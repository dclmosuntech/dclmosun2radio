// ============================================================
// DCLM OSUN II — Supabase Core Integration Module
// Services: Supabase Client Auth + Realtime + Database
// ============================================================

import { createClient } from '@supabase/supabase-js';

// ── Check Env Variables & Require Configuration ──
const rawUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qksslhnlyjwnieiilcsf.supabase.co';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrc3NsaG5seWp3bmllaWlsY3NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MDU4MTEsImV4cCI6MjEwNjA4MTgxMX0.OSQP98iLjBkt4a3sNMFyMMpB67Kn2ySSv0_1OBfUtNM';

if (!rawUrl || !rawKey || rawUrl.includes('your-project-id') || rawKey.includes('your-key-here')) {
    alert("⚠️ Missing Supabase Configuration!\n\nPlease configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.");
    throw new Error("Supabase credentials not configured.");
}

const isRealSupabase = true;
let supabase = null;

// Global Subscription Handles to prevent Temporal Dead Zone (TDZ) reference errors
let chatSubscription = null;
let reactionsSubscription = null;
let radioPresenceChannel = null;
const activeChannels = {};

function getFreshChannel(name) {
    if (activeChannels[name]) {
        try {
            supabase.removeChannel(activeChannels[name]);
        } catch (e) {
            console.warn(`[DCLM] Error removing channel ${name}:`, e);
        }
        delete activeChannels[name];
    }
    const ch = supabase.channel(name);
    activeChannels[name] = ch;
    return ch;
}

try {
    supabase = createClient(rawUrl, rawKey);
    console.log("[DCLM] Live Supabase Client successfully initialized!");
} catch (err) {
    console.error("[DCLM] Live Supabase init failed.", err);
    alert("❌ Failed to connect to Supabase: " + err.message);
    throw err;
}

// Global variable definitions/exposures
window.supabaseClientInstance = supabase;
window._isLocalMockDatabase = false;
window.currentUserState = window.currentUserState || {
    isLoggedIn: false,
    uid: null,
    isAdmin: false,
    firstName: "",
    lastName: "",
    phone: "",
    region: "",
    group: "",
    profileImage: "https://cdn-icons-png.flaticon.com/512/1144/1144760.png"
};

// ── Helper to compress profile images (Base64 under 200KB) ──
function compressImage(file) {
    const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/1144/1144760.png";
    if (!file) return Promise.resolve(defaultAvatar);
    return new Promise((resolve) => {
        let finished = false;
        const timer = setTimeout(() => {
            if (!finished) {
                finished = true;
                console.warn("[DCLM] Image compression timed out. Using default avatar.");
                resolve(defaultAvatar);
            }
        }, 4000);

        try {
            const reader = new FileReader();
            reader.onerror = function () {
                if (finished) return;
                finished = true;
                clearTimeout(timer);
                resolve(defaultAvatar);
            };
            reader.onload = function (e) {
                const img = new Image();
                img.onerror = function () {
                    if (finished) return;
                    finished = true;
                    clearTimeout(timer);
                    resolve(defaultAvatar);
                };
                img.onload = function () {
                    if (finished) return;
                    finished = true;
                    clearTimeout(timer);
                    try {
                        const canvas = document.createElement("canvas");
                        const MAX_SIZE = 200;
                        let width = img.width || 200;
                        let height = img.height || 200;

                        if (width > height) {
                            if (width > MAX_SIZE) { height = Math.round(height * MAX_SIZE / width); width = MAX_SIZE; }
                        } else {
                            if (height > MAX_SIZE) { width = Math.round(width * MAX_SIZE / height); height = MAX_SIZE; }
                        }

                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext("2d");
                        ctx.drawImage(img, 0, 0, width, height);
                        resolve(canvas.toDataURL("image/jpeg", 0.7));
                    } catch (err) {
                        resolve(defaultAvatar);
                    }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        } catch (err) {
            clearTimeout(timer);
            resolve(defaultAvatar);
        }
    });
}

// ── Helper to compress banner images (Base64 under 1MB) ──
function compressBannerImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                const canvas = document.createElement("canvas");
                const MAX_W = 1000;
                let w = img.width;
                let h = img.height;
                if (w > MAX_W) { h = Math.round(h * MAX_W / w); w = MAX_W; }
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL("image/jpeg", 0.75));
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ── Helper to compress audio files (downsamples to optimized 22kHz mono for fast 1s downloads) ──
async function compressAudioFile(file, maxTargetMB = 2.0) {
    return new Promise(async (resolve, reject) => {
        try {
            const originalSizeMB = (file.size / (1024 * 1024)).toFixed(2);
            console.log(`[Audio Compressor] Original file: ${file.name} (${originalSizeMB} MB)`);

            // If file is already tiny (< 700KB), read directly
            if (file.size <= 700 * 1024) {
                const reader = new FileReader();
                reader.onload = (e) => resolve({
                    dataUrl: e.target.result,
                    duration: 180,
                    sizeMB: originalSizeMB
                });
                reader.onerror = reject;
                reader.readAsDataURL(file);
                return;
            }

            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const arrayBuffer = await file.arrayBuffer();
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            const duration = Math.round(audioBuffer.duration) || 180;

            // Target audio encoding at 22050Hz mono for speech/choir clarity while cutting size by ~80%
            const targetSampleRate = 22050;
            const offlineCtx = new OfflineAudioContext(1, Math.ceil(duration * targetSampleRate), targetSampleRate);
            
            const source = offlineCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(offlineCtx.destination);
            source.start(0);

            const renderedBuffer = await offlineCtx.startRendering();
            audioCtx.close();

            // Encode to compact 16-bit WAV Blob
            const wavBlob = audioBufferToWavBlob(renderedBuffer);
            const compressedSizeMB = (wavBlob.size / (1024 * 1024)).toFixed(2);
            console.log(`[Audio Compressor] Compressed to ${targetSampleRate}Hz: ${compressedSizeMB} MB (Duration: ${duration}s)`);

            const reader = new FileReader();
            reader.onload = (e) => {
                resolve({
                    dataUrl: e.target.result,
                    duration: duration,
                    sizeMB: compressedSizeMB
                });
            };
            reader.onerror = reject;
            reader.readAsDataURL(wavBlob);
        } catch (err) {
            console.warn("[Audio Compressor] Compression fallback to standard reader:", err);
            const reader = new FileReader();
            reader.onload = (e) => resolve({
                dataUrl: e.target.result,
                duration: 180,
                sizeMB: (file.size / (1024 * 1024)).toFixed(2)
            });
            reader.onerror = reject;
            reader.readAsDataURL(file);
        }
    });
}

function audioBufferToWavBlob(buffer) {
    const numChannels = 1;
    const sampleRate = buffer.sampleRate;
    const bitDepth = 16;
    
    const channelData = buffer.getChannelData(0);
    const dataLength = channelData.length * (bitDepth / 8);
    const headerLength = 44;
    const totalLength = headerLength + dataLength;
    
    const arrayBuffer = new ArrayBuffer(totalLength);
    const view = new DataView(arrayBuffer);
    
    writeWavString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeWavString(view, 8, 'WAVE');
    
    writeWavString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
    view.setUint16(32, numChannels * (bitDepth / 8), true);
    view.setUint16(34, bitDepth, true);
    
    writeWavString(view, 36, 'data');
    view.setUint32(40, dataLength, true);
    
    let offset = 44;
    for (let i = 0; i < channelData.length; i++, offset += 2) {
        let sample = Math.max(-1, Math.min(1, channelData[i]));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, sample, true);
    }
    
    return new Blob([view], { type: 'audio/wav' });
}

function writeWavString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

// ── Phone validation helper formats ──
function getPhoneFormats(phoneVal) {
    if (!phoneVal) return [];
    let clean = phoneVal.trim();
    let cleanDigits = clean.replace(/\D/g, '');
    
    // Support 10-digit numbers without leading 0 (e.g. 8105742618 -> 08105742618)
    if (cleanDigits.length === 10 && (cleanDigits.startsWith('7') || cleanDigits.startsWith('8') || cleanDigits.startsWith('9'))) {
        cleanDigits = '0' + cleanDigits;
    }
    
    const formats = [clean, cleanDigits];
    
    // Support common phone lookups (e.g. 080... vs 23480... vs 80...)
    if (cleanDigits.startsWith('0') && cleanDigits.length > 1) {
        formats.push(cleanDigits.substring(1));
        formats.push('234' + cleanDigits.substring(1));
        formats.push('+234' + cleanDigits.substring(1));
    } else if (cleanDigits.startsWith('234') && cleanDigits.length > 3) {
        formats.push(cleanDigits.substring(3));
        formats.push('0' + cleanDigits.substring(3));
        formats.push('+' + cleanDigits);
    }
    return [...new Set(formats)];
}

// Helper: Timeout wrapper for database queries to prevent UI hanging
function withTimeout(promise, ms = 5000, errorMsg = "Network timeout") {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(errorMsg)), ms))
    ]);
}

// ── Auth Handling & Boot Sequence ──
let activeSessionUserId = null;
const anonSessionId = localStorage.getItem('dclm_anon_uid') || crypto.randomUUID();
localStorage.setItem('dclm_anon_uid', anonSessionId);

async function checkUserSession() {
    const loggedInUid = localStorage.getItem('dclm_logged_in_uid');
    const cachedProfileRaw = localStorage.getItem('dclm_cached_user_profile');
    
    // 1. Instant 0ms Local Storage account restoration
    if (cachedProfileRaw) {
        try {
            const cachedProfile = JSON.parse(cachedProfileRaw);
            if (cachedProfile && cachedProfile.firstName) {
                const uidToUse = loggedInUid || cachedProfile.uid || anonSessionId;
                activeSessionUserId = uidToUse;
                restoreProfileToState(cachedProfile, uidToUse);
                console.log("[DCLM] ⚡ Instant account loaded from local storage cache:", cachedProfile.firstName);
            }
        } catch (e) {
            console.warn("[DCLM] Cached profile parse error:", e);
        }
    }

    if (loggedInUid) {
        activeSessionUserId = loggedInUid;
        // Background verification (non-blocking, keeps user logged in even if offline/timeout)
        await loadUserProfile(loggedInUid);
    } else if (!cachedProfileRaw) {
        fallbackAnonSession();
    }
}

function fallbackAnonSession() {
    activeSessionUserId = anonSessionId;
    window._pendingFirebaseUID = anonSessionId;
    
    window.currentUserState = window.currentUserState || {};
    window.currentUserState.isLoggedIn = false;
    window.currentUserState.uid = anonSessionId;
    window.currentUserState.isAdmin = false;
    window.currentUserState.firstName = "";
    window.currentUserState.lastName = "";
    window.currentUserState.phone = "";
    window.currentUserState.region = "";
    window.currentUserState.group = "";
    window.currentUserState.profileImage = "https://cdn-icons-png.flaticon.com/512/1144/1144760.png";

    if (window.evaluateAppGatewayLock) window.evaluateAppGatewayLock();
    
    // Run seeders & real-time syncs
    initializeWorkforceDatabaseSeed();
    initializeWorkforceSyncBridges();
    initializeCellLocationsSeed();
    initializeCellsSyncBridges();
    initializeSupportSyncBridges();
    initializeGivingSyncBridges();
    initializeRealtimeSettingsSync();
    initializeLiveChatSyncBridge();
    initializeLiveReactionsSyncBridge();
    initializePresenceSync();
    initializeVideoPresenceSync();
    initializeBannersSync();
}

async function loadUserProfile(userId) {
    try {
        const { data, error } = await withTimeout(
            supabase.from('users').select('*').eq('id', userId).maybeSingle(),
            5000,
            "Profile verification timeout"
        );
        if (error) throw error;
        if (data) {
            const profile = {
                firstName: data.first_name,
                lastName: data.last_name,
                phone: data.phone,
                region: data.region,
                group: data.group_name,
                profileImage: data.profile_image,
                isAdmin: data.is_admin,
                role: data.role,
                uid: userId
            };
            restoreProfileToState(profile, userId);
            localStorage.setItem('dclm_cached_user_profile', JSON.stringify(profile));
            localStorage.setItem('dclm_logged_in_uid', userId);
        }
    } catch (err) {
        console.warn("[DCLM] Profile sync warning (retaining offline session):", err.message);
        // Do NOT log out user on network drop/timeout!
    }
    
    // Run seeders & real-time syncs
    initializeWorkforceDatabaseSeed();
    initializeWorkforceSyncBridges();
    initializeCellLocationsSeed();
    initializeCellsSyncBridges();
    initializeSupportSyncBridges();
    initializeGivingSyncBridges();
    initializeRealtimeSettingsSync();
    initializeLiveChatSyncBridge();
    initializeLiveReactionsSyncBridge();
    initializePresenceSync();
    initializeVideoPresenceSync();
    initializeBannersSync();
}

window.logoutUser = function() {
    localStorage.removeItem('dclm_logged_in_uid');
    localStorage.removeItem('dclm_cached_user_profile');
    activeSessionUserId = anonSessionId;
    
    window.currentUserState = window.currentUserState || {};
    window.currentUserState.isLoggedIn = false;
    window.currentUserState.isAdmin = false;
    window.currentUserState.firstName = "";
    window.currentUserState.lastName = "";
    window.currentUserState.phone = "";
    window.currentUserState.region = "";
    window.currentUserState.group = "";
    window.currentUserState.profileImage = "https://cdn-icons-png.flaticon.com/512/1144/1144760.png";
    
    localStorage.setItem("dclm_logout_redirect", "true");
    window.location.reload();
};

function restoreProfileToState(profile, userId) {
    window.currentUserState = window.currentUserState || {};
    window.currentUserState.isLoggedIn = true;
    window.currentUserState.uid = userId;
    window.currentUserState.isAdmin = profile.isAdmin || false;
    window.currentUserState.firstName = profile.firstName || "";
    window.currentUserState.lastName = profile.lastName || "";
    window.currentUserState.phone = profile.phone || "";
    window.currentUserState.region = profile.region || "";
    window.currentUserState.group = profile.group || "";
    window.currentUserState.profileImage = profile.profileImage || "https://cdn-icons-png.flaticon.com/512/1144/1144760.png";

    try {
        localStorage.setItem('dclm_cached_user_profile', JSON.stringify({
            firstName: window.currentUserState.firstName,
            lastName: window.currentUserState.lastName,
            phone: window.currentUserState.phone,
            region: window.currentUserState.region,
            group: window.currentUserState.group,
            profileImage: window.currentUserState.profileImage,
            isAdmin: window.currentUserState.isAdmin,
            uid: userId
        }));
        localStorage.setItem('dclm_logged_in_uid', userId);
    } catch (e) {}

    if (window.evaluateAppGatewayLock) window.evaluateAppGatewayLock();
    console.log(`[DCLM] Session Restored: ${profile.firstName} (${profile.isAdmin ? 'Admin' : 'Member'})`);
}

// Boot setup moved to end of file to prevent premature execution errors

// Auth UI display trigger
window.showAuthOverlay = function() {
    const authScreen = document.getElementById("auth-screen");
    if (authScreen) authScreen.classList.add("active");
};

// ── Registration (Sign Up) ──
window.handleUserSignup = async function (event) {
    event.preventDefault();
    const submitBtn = event.target.querySelector(".auth-submit-btn");
    if (submitBtn) {
        submitBtn.textContent = "Creating Account...";
        submitBtn.disabled = true;
    }

    try {
        const firstName = (document.getElementById("reg-firstname")?.value || "").trim();
        const lastName = (document.getElementById("reg-lastname")?.value || "").trim();
        const region = document.getElementById("reg-region")?.value || "";
        const group = (document.getElementById("reg-group")?.value || "").trim();
        const avatarFile = document.getElementById("reg-avatar")?.files?.[0];

        // Safe phone extraction (check hidden normalized field, then fallback to visible input)
        const phoneInputEl = document.getElementById("reg-phone-input");
        const hiddenPhoneEl = document.getElementById("reg-phone");
        let phoneVal = (hiddenPhoneEl?.value || phoneInputEl?.value || "").trim();

        if (!phoneVal) {
            alert("❌ Please enter your phone number.");
            return;
        }

        // Auto-normalize phone if user entered local format (e.g. 080... or 80...)
        if (!phoneVal.startsWith('+')) {
            const cleanDigits = phoneVal.replace(/\D/g, '');
            const rawDigits = cleanDigits.startsWith('0') ? cleanDigits.substring(1) : cleanDigits;
            phoneVal = `+234${rawDigits}`;
        }

        if (!firstName || !lastName) {
            alert("❌ Please enter your First and Last name.");
            return;
        }

        if (!region) {
            alert("❌ Please select your Region in Osun State II.");
            return;
        }

        if (!group) {
            alert("❌ Please enter your District / Group.");
            return;
        }

        let avatarBase64 = "https://cdn-icons-png.flaticon.com/512/1144/1144760.png";
        if (avatarFile) {
            avatarBase64 = await compressImage(avatarFile);
        }

        const isRegisteringAdmin = window._currentAuthRoleSelected === 'admin';
        const adminCodeEl = document.getElementById("reg-admin-id") || document.getElementById("admin-reg-code");
        const adminCodeEntered = adminCodeEl ? adminCodeEl.value.trim() : "";

        let isAdmin = false;
        let role = 'member';

        if (isRegisteringAdmin) {
            if (!adminCodeEntered) {
                alert("❌ Please enter the Special Admin Security ID.");
                return;
            }

            // Validate Admin code
            let isCodeValid = false;
            const { data } = await supabase.from('admin_codes').select('*').eq('code', adminCodeEntered).eq('is_valid', true).maybeSingle();
            if (data) {
                isCodeValid = true;
                // Mark code as used
                await supabase.from('admin_codes').update({
                    is_valid: false,
                    used_by: `${firstName} ${lastName}`,
                    used_at: new Date().toISOString()
                }).eq('id', data.id);
            }

            if (!isCodeValid) {
                alert("❌ Invalid or expired Admin Security Code. Please contact your administrator.");
                return;
            }
            isAdmin = true;
            role = 'admin';
        }

        const currentUid = activeSessionUserId || anonSessionId || crypto.randomUUID();
        const profile = {
            firstName,
            lastName,
            phone: phoneVal,
            region,
            group,
            profileImage: avatarBase64,
            isAdmin,
            role,
            uid: currentUid
        };

        const { error: upsertError } = await supabase.from('users').upsert({
            id: currentUid,
            first_name: firstName,
            last_name: lastName,
            phone: phoneVal,
            region,
            group_name: group,
            profile_image: avatarBase64,
            is_admin: isAdmin,
            role: role
        });
        if (upsertError) throw upsertError;

        localStorage.setItem('dclm_logged_in_uid', currentUid);
        activeSessionUserId = currentUid;

        restoreProfileToState(profile, currentUid);
        alert(`🎉 Registration successful! Welcome to the fellowship, ${firstName}.`);
        
        const authScreen = document.getElementById("auth-screen");
        if (authScreen) authScreen.classList.remove("active");

    } catch (error) {
        console.error("[DCLM] Registration error:", error);
        alert(`❌ Registration failed: ${error.message || error}`);
    } finally {
        if (submitBtn) {
            submitBtn.innerHTML = "Complete Registration";
            submitBtn.disabled = false;
        }
    }
};

// ── Phone Sign In (Login) ──
window.handleUserLogin = async function (event) {
    event.preventDefault();
    const phoneInput = document.getElementById("login-phone");
    const phoneVal = phoneInput ? phoneInput.value.trim() : "";
    const submitBtn = event.target.querySelector(".auth-submit-btn");

    if (!phoneVal) {
        alert("Please enter your registered phone number.");
        return;
    }

    submitBtn.textContent = "Verifying Account...";
    submitBtn.disabled = true;

    try {
        let matchedProfile = null;
        let oldUid = null;

        const formats = getPhoneFormats(phoneVal);

        try {
            const { data, error } = await withTimeout(
                supabase.from('users').select('*').in('phone', formats).maybeSingle(),
                6000,
                "Connection timeout"
            );
            if (error) throw error;
            if (data) {
                matchedProfile = {
                    firstName: data.first_name,
                    lastName: data.last_name,
                    phone: data.phone,
                    region: data.region,
                    group: data.group_name,
                    profileImage: data.profile_image,
                    isAdmin: data.is_admin,
                    role: data.role
                };
                oldUid = data.id;
            }
        } catch (netErr) {
            console.warn("[DCLM] Network query error/timeout on login:", netErr.message);
            // Check if phone matches locally cached profile
            const cachedRaw = localStorage.getItem('dclm_cached_user_profile');
            if (cachedRaw) {
                try {
                    const cached = JSON.parse(cachedRaw);
                    if (cached && formats.some(f => cached.phone && (cached.phone === f || cached.phone.includes(f)))) {
                        matchedProfile = cached;
                        oldUid = cached.uid || localStorage.getItem('dclm_logged_in_uid') || anonSessionId;
                        console.log("[DCLM] Restoring login from cached profile offline!");
                    }
                } catch (e) {}
            }
            if (!matchedProfile) {
                throw new Error("Unable to connect to church database. Please check your internet connection and try again.");
            }
        }

        if (!matchedProfile) {
            alert("❌ The entered phone number is not registered on this platform.\n\nPlease check the number and try again, or create a new account.");
            submitBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Sign In to Account';
            submitBtn.disabled = false;
            return;
        }

        // Save login session using the persistent ID from the database
        localStorage.setItem('dclm_logged_in_uid', oldUid);
        localStorage.setItem('dclm_cached_user_profile', JSON.stringify({ ...matchedProfile, uid: oldUid }));
        activeSessionUserId = oldUid;

        restoreProfileToState(matchedProfile, oldUid);
        alert(`🎉 Welcome back, ${matchedProfile.firstName}! Your online fellowship access has been restored.`);
        
        const authScreen = document.getElementById("auth-screen");
        if (authScreen) authScreen.classList.remove("active");

    } catch (err) {
        console.error("[DCLM] Login error:", err);
        alert(`❌ ${err.message || "Authentication failed. Please check network."}`);
    } finally {
        submitBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Sign In to Account';
        submitBtn.disabled = false;
    }
};



// ── Realtime Settings Sync ──
window._liveVideoSettings = { videoUrl: '', announcement: '' };
window._liveAudioSettings = { audioUrl: '', announcement: '' };

function initializeRealtimeSettingsSync() {
    
        // Fetch initial video
        supabase.from('app_settings').select('*').eq('key', 'live_video').maybeSingle().then(({ data }) => {
            if (data?.value) {
                applyVideoSettingsUI(data.value);
            }
        });
        
        // Fetch initial audio
        supabase.from('app_settings').select('*').eq('key', 'live_audio').maybeSingle().then(({ data }) => {
            if (data?.value) {
                applyAudioSettingsUI(data.value);
            }
        });
        
        // Subscribe
        getFreshChannel('app_settings_sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, payload => {
                if (payload.new?.key === 'live_video' && payload.new?.value) {
                    applyVideoSettingsUI(payload.new.value);
                }
                if (payload.new?.key === 'live_audio' && payload.new?.value) {
                    applyAudioSettingsUI(payload.new.value);
                }
            })
            .subscribe();
    
}

function applyVideoSettingsUI(value) {
    window._liveVideoSettings = value;
    
    // Update live announcement text
    const annBox = document.getElementById("stream-announcement-text");
    if (annBox && value.announcement) {
        annBox.textContent = value.announcement;
    }

    // Refresh live-stream player if on stream page
    if (window.initializeLiveVideoPlayer) {
        window.initializeLiveVideoPlayer(value.videoUrl);
    }
}

function isLiveStreamUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const lower = url.toLowerCase();
    return lower.includes('/live') || lower.includes('lhr.life') || lower.includes(':8001') || lower.includes(':8000') || lower.includes('icecast') || lower.includes('butt') || lower.includes('zeno.fm') || lower.includes('.m3u8') || lower.includes('trycloudflare.com') || lower.includes('cloudflare');
}
window.isLiveStreamUrl = isLiveStreamUrl;

function applyAudioSettingsUI(value) {
    window._liveAudioSettings = value || { audioUrl: '', isLive: false };
    const isLive = Boolean(value?.audioUrl && value?.audioUrl.trim().length > 0 && value?.isLive === true);
    
    // Update live banner in radio UI
    const liveStatusBanner = document.getElementById("radio-live-status-banner");
    if (liveStatusBanner) {
        if (isLive) {
            liveStatusBanner.style.display = "flex";
            liveStatusBanner.innerHTML = `<i class="fa-solid fa-signal live-pulse-badge" style="color: #c084fc;"></i> <span>LIVE STREAM SYNCHRONIZED</span>`;
        } else {
            liveStatusBanner.style.display = "none";
        }
    }
    
    const player = document.getElementById("global-radio-player");
    const currentSrc = player ? (player.src || player.originalSrc || '') : '';
    const isCurrentlyLiveUrl = isLiveStreamUrl(currentSrc);

    // If live stream went offline AND player is attached to live stream: force socket abort & switch to 24/7 playlist
    if (!isLive && isCurrentlyLiveUrl) {
        console.log("[DCLM Radio] Live broadcast ended — closing live stream socket & resuming 24/7 playlist.");
        if (player) {
            player.pause();
            player.removeAttribute('src');
            player.load();
            player.currentPlayingTrackId = null;
            window.currentPlayingTrackId = null;
        }
        if (window.resumeVirtualPlaylist) {
            window.resumeVirtualPlaylist();
        }
    } else if (isLive) {
        const liveUrl = (value.audioUrl || '').trim();
        const cleanLiveUrl = liveUrl.split('?')[0];
        const isAlreadyPlayingThisLive = currentSrc.includes(cleanLiveUrl) && !player.paused;

        // If user is actively listening to RADIO and NOT yet on this exact live stream, switch immediately:
        const isRadioMode = player?.playbackMode === 'radio' || window.currentPlaybackMode === 'radio' || !player?.playbackMode;
        if (!isAlreadyPlayingThisLive && (window.isAudioPlaying || (player && !player.paused)) && isRadioMode) {
            console.log("[DCLM Radio] 🔴 Live broadcast started! Seamlessly transitioning active radio listener to live stream:", liveUrl);
            if (window.playAudioStream) {
                window.playAudioStream(liveUrl, value.title || "DCLM OSUN II LIVE BROADCAST", value.speaker || "Osun State HQ Pulpit", 'live');
            } else if (window.syncPlayerWithGlobalBroadcast) {
                window.syncPlayerWithGlobalBroadcast(true);
            }
            return;
        }
    }

    // Update UI labels cleanly without interrupting ongoing playback
    if (window.syncPlayerWithGlobalBroadcast) {
        window.syncPlayerWithGlobalBroadcast(false);
    }
}

// ── Continuous Safety Watchdog for Live Audio Socket Enforcement ──
setInterval(() => {
    const player = document.getElementById("global-radio-player");
    if (!player) return;

    // Do NOT interrupt on-demand Library resource playback!
    if (window.currentPlaybackMode === 'library' || player.playbackMode === 'library') {
        return;
    }

    const liveAudio = window._liveAudioSettings;
    const isLive = Boolean(liveAudio?.audioUrl && liveAudio?.audioUrl.trim().length > 0 && liveAudio?.isLive === true);

    if (!isLive) {
        const currentSrc = player.src || player.originalSrc || '';
        if (isLiveStreamUrl(currentSrc, player.currentPlayingTrackId)) {
            console.warn("[DCLM Watchdog] 🚨 Live stream socket active while broadcast is OFFLINE! Force disconnecting socket and switching to 24/7 playlist.");
            player.pause();
            player.removeAttribute('src');
            player.load();
            player.currentPlayingTrackId = null;
            window.currentPlayingTrackId = null;
            if (window.resumeVirtualPlaylist) {
                window.resumeVirtualPlaylist();
            }
        }
    } else {
        // Live stream is ONLINE: If user is actively listening to radio, ensure player is attached to live stream, not 24/7 playlist!
        const liveUrl = (liveAudio.audioUrl || '').trim();
        const cleanLiveUrl = liveUrl.split('?')[0];
        const currentSrc = player.src || player.originalSrc || '';
        const isAttachedToLive = isLiveStreamUrl(currentSrc) && currentSrc.includes(cleanLiveUrl);
        const isRadioMode = player?.playbackMode === 'radio' || window.currentPlaybackMode === 'radio' || !player?.playbackMode;
        if ((window.isAudioPlaying || !player.paused) && !isAttachedToLive && isRadioMode) {
            console.log("[DCLM Watchdog] 🔴 Live broadcast online but radio player is on 24/7 track. Transitioning to live stream...");
            if (window.playAudioStream) {
                window.playAudioStream(liveUrl, liveAudio.title || "DCLM OSUN II LIVE BROADCAST", liveAudio.speaker || "Osun State HQ Pulpit", 'live');
            } else if (window.syncPlayerWithGlobalBroadcast) {
                window.syncPlayerWithGlobalBroadcast(true);
            }
        }
    }
}, 2500);

// ── Live Chat Sync & Posting ──

function initializeLiveChatSyncBridge() {
    const chatBox = document.getElementById("chat-messages-box");
    if (!chatBox) return;

    
        // Fetch latest 50
        supabase.from('live_chat_messages').select('*').order('timestamp', { ascending: false }).limit(50).then(({ data }) => {
            if (data) {
                chatBox.innerHTML = `
                    <div class="system-message">Welcome to the DCLM Osun State II live stream channel. Keep conversations edifying and Christ-centered.</div>
                `;
                const messages = data.map(row => ({
                    id: row.id,
                    senderName: row.sender_name || row.username || 'Guest',
                    messageText: row.message_text || row.text || '',
                    location: row.location || 'Osun II',
                    isAdmin: row.is_admin || row.role === 'admin'
                })).reverse();

                messages.forEach(msg => {
                    appendChatBubbleUI(msg.senderName, msg.messageText, msg.location, msg.isAdmin, msg.id);
                });
                chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: "smooth" });
            }
        });

        // Subscribe
        chatSubscription = getFreshChannel('public:live_chat_messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_chat_messages' }, payload => {
                const row = payload.new;
                appendChatBubbleUI(
                    row.sender_name || row.username || 'Guest',
                    row.message_text || row.text || '',
                    row.location || 'Osun II',
                    row.is_admin || row.role === 'admin',
                    row.id
                );
                chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: "smooth" });
            })
            .subscribe();
    
}

function appendChatBubbleUI(senderName, messageText, location = "", isAdmin = false, docId = "") {
    const chatBox = document.getElementById("chat-messages-box");
    if (!chatBox) return;

    const bubble = document.createElement("div");
    bubble.className = "chat-bubble" + (isAdmin ? " admin-bubble" : "");
    bubble.id = "chat-msg-" + docId;

    const locTag = location ? ` <span class="bubble-location">• ${location}</span>` : '';
    const adminTag = isAdmin ? ` <span class="bubble-admin-badge"><i class="fa-solid fa-shield-halved"></i> Admin</span>` : '';

    bubble.innerHTML = `
        <div class="bubble-meta">
            <span class="bubble-sender">${senderName}</span>
            ${locTag}
            ${adminTag}
        </div>
        <div class="bubble-body">${messageText}</div>
    `;

    chatBox.appendChild(bubble);
}

window.sendLiveChatMessage = async function(text) {
    if (!text.trim()) return;

    let senderName = "Guest User";
    let location = "Osun II";
    let isAdmin = false;
    let role = 'member';

    if (window.currentUserState && window.currentUserState.isLoggedIn) {
        senderName = `${window.currentUserState.firstName} ${window.currentUserState.lastName}`;
        location = window.currentUserState.region || "Osun II";
        isAdmin = window.currentUserState.isAdmin || false;
        role = window.currentUserState.isAdmin ? 'admin' : 'member';
    }

    try {
        
            const { error } = await supabase.from('live_chat_messages').insert({
                user_id: window.currentUserState.isLoggedIn ? activeSessionUserId : null,
                username: senderName,
                text: text.trim(),
                role: role,
                sender_name: senderName,
                message_text: text.trim(),
                location: location,
                is_admin: isAdmin
            });
            if (error) throw error;
        
    } catch (err) {
        console.error("[DCLM] Send chat failed:", err);
    }
};

// ── Live Reactions (Exploding Emojis) ──

// Particle animation dispatcher for floating emojis on chat and video screen
window.triggerEmojiExplosion = function(emoji) {
    if (!emoji) return;

    // 1. Live Chat floating emoji particle
    if (window.spawnFloatingEmoji) {
        window.spawnFloatingEmoji(emoji, false);
    }

    // 2. Video Player Frame floating reaction
    const canvas = document.getElementById("live-floating-reactions-canvas");
    if (canvas) {
        const el = document.createElement("span");
        el.className = "floating-video-reaction";
        el.textContent = emoji;

        const driftX = (Math.random() * 50 - 25).toFixed(1);
        const driftXEnd = (Math.random() * 80 - 40).toFixed(1);
        const rot = (Math.random() * 30 - 15).toFixed(1);
        const startX = Math.floor(Math.random() * 30) + 10;

        el.style.left = `${startX}px`;
        el.style.setProperty("--drift-x", `${driftX}px`);
        el.style.setProperty("--drift-x-end", `${driftXEnd}px`);
        el.style.setProperty("--rot", `${rot}deg`);

        canvas.appendChild(el);
        setTimeout(() => {
            el.remove();
        }, 2300);
    }
};

function initializeLiveReactionsSyncBridge() {
    reactionsSubscription = getFreshChannel('public:live_reactions')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_reactions' }, payload => {
            const row = payload.new;
            if (window.triggerEmojiExplosion && row?.emoji) {
                window.triggerEmojiExplosion(row.emoji);
            }
        })
        .subscribe();
}

window.sendLiveReaction = async function(emoji) {
    if (!emoji) return;
    
    // Immediate client feedback
    if (window.triggerEmojiExplosion) {
        window.triggerEmojiExplosion(emoji);
    }

    try {
        await supabase.from('live_reactions').insert({ emoji });
    } catch (err) {
        console.error("[DCLM] Reaction send failed:", err);
    }
};

// ── Real-Time Multi-Device Radio Broadcast Listener Sync Engine ──
let isRadioListeningActive = false;
let radioBroadcastChannel = null;
let isRadioChannelReady = false;
let pendingRadioStateBroadcast = null;
const activeLiveListenersMap = new Map();

// Tab/Device unique persistent identifier (unique across tabs and separate physical devices)
let myTabSessionKey = sessionStorage.getItem('dclm_tab_listener_id');
if (!myTabSessionKey) {
    myTabSessionKey = 'dev_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    try { sessionStorage.setItem('dclm_tab_listener_id', myTabSessionKey); } catch (e) {}
}

function updateListenerCountUI() {
    const now = Date.now();
    // Purge devices that haven't sent a heartbeat in 35 seconds
    for (const [id, lastSeen] of activeLiveListenersMap.entries()) {
        if (id !== myTabSessionKey && (now - lastSeen > 35000)) {
            activeLiveListenersMap.delete(id);
        }
    }

    if (isRadioListeningActive) {
        activeLiveListenersMap.set(myTabSessionKey, now);
    } else {
        activeLiveListenersMap.delete(myTabSessionKey);
    }

    const currentCount = activeLiveListenersMap.size;
    const countEl = document.getElementById("radio-listener-number");

    if (countEl && countEl.textContent !== String(currentCount)) {
        countEl.textContent = currentCount;
    }
}

function broadcastMyListenerState(isListening) {
    if (!radioBroadcastChannel || !isRadioChannelReady) {
        pendingRadioStateBroadcast = isListening;
        return;
    }

    try {
        radioBroadcastChannel.send({
            type: 'broadcast',
            event: 'radio_listener_state',
            payload: {
                deviceId: myTabSessionKey,
                isListening: isListening,
                timestamp: Date.now()
            }
        });
        console.log(`[Radio Sync] 📡 Broadcasted listener state: ${isListening ? 'LISTENING (JOIN)' : 'PAUSED (LEAVE)'}`);
    } catch (e) {
        console.warn("[Radio Sync] Broadcast error:", e);
    }
}

function initializePresenceSync() {
    if (radioBroadcastChannel) {
        updateListenerCountUI();
        return;
    }

    radioBroadcastChannel = supabase.channel('dclm_live_radio_listeners_v1', {
        config: {
            broadcast: {
                self: true
            }
        }
    });

    radioBroadcastChannel
        // Listen for peer device state announcements (join or leave)
        .on('broadcast', { event: 'radio_listener_state' }, ({ payload }) => {
            if (!payload || !payload.deviceId) return;

            if (payload.isListening === true) {
                activeLiveListenersMap.set(payload.deviceId, payload.timestamp || Date.now());
                console.log(`[Radio Sync] 🟢 Peer device joined broadcast: ${payload.deviceId}`);
            } else {
                activeLiveListenersMap.delete(payload.deviceId);
                console.log(`[Radio Sync] 🔴 Peer device paused/left broadcast: ${payload.deviceId}`);
            }
            updateListenerCountUI();
        })
        // Listen for Admin emergency force-end stream signal across all devices
        .on('broadcast', { event: 'FORCE_END_LIVE_STREAM' }, () => {
            console.warn("[Radio Sync] 🛑 FORCE_END_LIVE_STREAM signal received from Admin! Closing live audio socket and switching to 24/7 playlist.");
            window._liveAudioSettings = { audioUrl: '', isLive: false };
            const player = document.getElementById("global-radio-player");
            if (player) {
                player.pause();
                player.removeAttribute('src');
                player.load();
                player.currentPlayingTrackId = null;
                window.currentPlayingTrackId = null;
            }
            applyAudioSettingsUI({ audioUrl: '', isLive: false });
            if (window.resumeVirtualPlaylist) {
                window.resumeVirtualPlaylist();
            }
        })
        // When a new device opens the page, it asks "who is listening?"
        .on('broadcast', { event: 'radio_who_is_listening' }, () => {
            if (isRadioListeningActive) {
                broadcastMyListenerState(true);
            }
        })
        .subscribe((status) => {
            console.log('[Radio Sync] Channel status:', status);
            if (status === 'SUBSCRIBED') {
                isRadioChannelReady = true;
                // Ask the network who is already listening so we instantly get the real count
                radioBroadcastChannel.send({
                    type: 'broadcast',
                    event: 'radio_who_is_listening',
                    payload: { from: myTabSessionKey }
                });

                if (pendingRadioStateBroadcast !== null) {
                    broadcastMyListenerState(pendingRadioStateBroadcast);
                    pendingRadioStateBroadcast = null;
                }
                updateListenerCountUI();
            } else {
                isRadioChannelReady = false;
            }
        });

    // Native tab close / navigation: immediately announce departure to all peer devices
    window.addEventListener('beforeunload', () => {
        if (isRadioListeningActive) {
            broadcastMyListenerState(false);
        }
    });

    // Periodic sweep & UI sync every 2 seconds
    setInterval(() => {
        updateListenerCountUI();
    }, 2000);

    // Heartbeat every 15 seconds to keep active state alive across the network
    setInterval(() => {
        if (isRadioListeningActive && isRadioChannelReady) {
            broadcastMyListenerState(true);
        }
    }, 15000);
}

window.joinRadioPresence = function() {
    isRadioListeningActive = true;
    activeLiveListenersMap.set(myTabSessionKey, Date.now());
    updateListenerCountUI();
    broadcastMyListenerState(true);
};

window.leaveRadioPresence = function() {
    isRadioListeningActive = false;
    activeLiveListenersMap.delete(myTabSessionKey);
    updateListenerCountUI();
    broadcastMyListenerState(false);
};

// ── Real-Time Multi-Device Live Video Viewer Presence Engine ──
let isVideoWatchingActive = false;
let videoBroadcastChannel = null;
let isVideoChannelReady = false;
let pendingVideoStateBroadcast = null;
const activeLiveVideoViewersMap = new Map();

function updateVideoViewerCountUI() {
    const now = Date.now();
    // Purge devices that haven't sent a heartbeat in 35 seconds
    for (const [id, lastSeen] of activeLiveVideoViewersMap.entries()) {
        if (id !== myTabSessionKey && (now - lastSeen > 35000)) {
            activeLiveVideoViewersMap.delete(id);
        }
    }

    if (isVideoWatchingActive) {
        activeLiveVideoViewersMap.set(myTabSessionKey, now);
    } else {
        activeLiveVideoViewersMap.delete(myTabSessionKey);
    }

    const currentCount = activeLiveVideoViewersMap.size;
    const liveViewerEl = document.getElementById("live-viewer-count");

    if (liveViewerEl && liveViewerEl.textContent !== String(currentCount)) {
        liveViewerEl.textContent = currentCount;
    }
}

function broadcastMyVideoViewerState(isWatching) {
    if (!videoBroadcastChannel || !isVideoChannelReady) {
        pendingVideoStateBroadcast = isWatching;
        return;
    }

    try {
        videoBroadcastChannel.send({
            type: 'broadcast',
            event: 'video_viewer_state',
            payload: {
                deviceId: myTabSessionKey,
                isWatching: isWatching,
                timestamp: Date.now()
            }
        });
        console.log(`[Video Sync] 📡 Broadcasted video viewer state: ${isWatching ? 'WATCHING (JOIN)' : 'LEFT (LEAVE)'}`);
    } catch (e) {
        console.warn("[Video Sync] Broadcast error:", e);
    }
}

function initializeVideoPresenceSync() {
    if (videoBroadcastChannel) {
        updateVideoViewerCountUI();
        return;
    }

    videoBroadcastChannel = supabase.channel('dclm_live_video_viewers_v1', {
        config: {
            broadcast: {
                self: true
            }
        }
    });

    videoBroadcastChannel
        // Listen for peer device announcements
        .on('broadcast', { event: 'video_viewer_state' }, ({ payload }) => {
            if (!payload || !payload.deviceId) return;

            if (payload.isWatching === true) {
                activeLiveVideoViewersMap.set(payload.deviceId, payload.timestamp || Date.now());
                console.log(`[Video Sync] 🟢 Peer device joined live video: ${payload.deviceId}`);
            } else {
                activeLiveVideoViewersMap.delete(payload.deviceId);
                console.log(`[Video Sync] 🔴 Peer device left live video: ${payload.deviceId}`);
            }
            updateVideoViewerCountUI();
        })
        // When a new device opens the page, it asks "who is watching video?"
        .on('broadcast', { event: 'video_who_is_watching' }, () => {
            if (isVideoWatchingActive) {
                broadcastMyVideoViewerState(true);
            }
        })
        .subscribe((status) => {
            console.log('[Video Sync] Channel status:', status);
            if (status === 'SUBSCRIBED') {
                isVideoChannelReady = true;
                // Query who is already watching video
                videoBroadcastChannel.send({
                    type: 'broadcast',
                    event: 'video_who_is_watching',
                    payload: { from: myTabSessionKey }
                });

                if (pendingVideoStateBroadcast !== null) {
                    broadcastMyVideoViewerState(pendingVideoStateBroadcast);
                    pendingVideoStateBroadcast = null;
                }
                updateVideoViewerCountUI();
            } else {
                isVideoChannelReady = false;
            }
        });

    // Native tab close / navigation: announce departure
    window.addEventListener('beforeunload', () => {
        if (isVideoWatchingActive) {
            broadcastMyVideoViewerState(false);
        }
    });

    // Periodic sweep & UI sync every 2 seconds
    setInterval(() => {
        updateVideoViewerCountUI();
    }, 2000);

    // Heartbeat every 15 seconds to keep active state alive
    setInterval(() => {
        if (isVideoWatchingActive && isVideoChannelReady) {
            broadcastMyVideoViewerState(true);
        }
    }, 15000);
}

window.initializeVideoPresenceSync = initializeVideoPresenceSync;

window.joinVideoPresence = function() {
    isVideoWatchingActive = true;
    activeLiveVideoViewersMap.set(myTabSessionKey, Date.now());
    updateVideoViewerCountUI();
    broadcastMyVideoViewerState(true);
};

window.leaveVideoPresence = function() {
    isVideoWatchingActive = false;
    activeLiveVideoViewersMap.delete(myTabSessionKey);
    updateVideoViewerCountUI();
    broadcastMyVideoViewerState(false);
};

// ── Radio Global Playlist & Sync ──
window._currentRadioTracks = [];
window._currentRadioPlaybackState = null;

window._defaultRadioTracks = [
    { id: 2, title: "THINGS ARE NOT THE SAME ANYMORE", speaker: "DLSO CHOIR", duration: 660, audio_url: "/audio/radio_track_2.mp3", created_at: "2026-06-14T11:51:12.705472+00:00" },
    { id: 3, title: "THATS ENOUGH", speaker: "DLCF CHOIR", duration: 368, audio_url: "/audio/radio_track_3.mp3", created_at: "2026-08-29T15:19:45.13627+00:00" }
];
if (!window._currentRadioTracks || window._currentRadioTracks.length === 0) {
    window._currentRadioTracks = window._defaultRadioTracks;
}

// Synchronously restore cached tracks metadata from localStorage on initial script evaluation (0ms boot)
try {
    const cachedTracksJson = localStorage.getItem('dclm_radio_metadata_cache');
    if (cachedTracksJson) {
        const cachedTracks = JSON.parse(cachedTracksJson);
        if (Array.isArray(cachedTracks)) {
            const isStale = cachedTracks.some(t => (t.id == 2 && t.duration !== 660) || (t.id == 3 && t.duration !== 368));
            if (isStale) {
                console.log("[DCLM] Purging stale localStorage radio metadata cache.");
                localStorage.removeItem('dclm_radio_metadata_cache');
            } else if (cachedTracks.length > 0) {
                window._currentRadioTracks = cachedTracks;
                console.log(`[DCLM] Boot: loaded ${cachedTracks.length} radio tracks metadata instantly from cache (0ms).`);
                setTimeout(() => {
                    if (window.refreshRadioPlaylistUI) {
                        window.refreshRadioPlaylistUI(cachedTracks, true);
                    }
                }, 0);
            }
        }
    }
} catch (e) {
    console.warn("[DCLM] Cache load notice:", e);
}

window.refreshRadioPlaylistUI = function(tracks, fromCache = false) {
    if (!tracks || !Array.isArray(tracks) || tracks.length === 0) return;
    
    window._currentRadioTracks = tracks;
    if (window.preloadRadioAudioInBackground) {
        window.preloadRadioAudioInBackground();
    }
    
    // Save to localStorage cache for 0ms instant loads
    if (!fromCache) {
        try {
            // Strip any raw audio payload from localStorage cache to prevent quota exceptions
            const lightweightTracks = tracks.map(t => ({
                id: t.id,
                title: t.title,
                speaker: t.speaker,
                duration: t.duration,
                audio_url: t.audio_url || t.audioUrl || '',
                created_at: t.created_at
            }));
            localStorage.setItem('dclm_radio_metadata_cache', JSON.stringify(lightweightTracks));
        } catch(e) {
            console.warn("[DCLM] Cache storage notice:", e);
        }
    }

    const container = document.getElementById("radio-playlist-container");
    if (container) {
        container.innerHTML = tracks.map(track => `
            <div class="radio-track-item" data-id="${track.id}" data-src="${track.audio_url || track.audioUrl || ''}" data-duration="${track.duration}">
                <span class="track-title">${track.title}</span>
                <span class="track-speaker">${track.speaker}</span>
            </div>
        `).join('');
    }
    
    // Refresh Fellowship Playlist view
    if (window.renderFellowshipPlaylist) {
        window.renderFellowshipPlaylist(tracks);
    }
    
    // Refresh Resource Library audio tab
    if (window.renderLibraryTab) {
        window.renderLibraryTab();
    }
    
    // Refresh Search Media suggestions
    if (window.renderSearchSuggestions) {
        window.renderSearchSuggestions();
    }
    
    // Refresh Admin track list if present
    if (window.renderAdminTracksList) {
        window.renderAdminTracksList();
    }

    // Pre-decode and buffer active track in memory for instant playback
    if (window.preBufferActiveRadioTrack) {
        window.preBufferActiveRadioTrack();
    }
    
    // Update Radio page labels immediately so it NEVER shows "RADIO STANDBY"
    if (window.syncPlayerWithGlobalBroadcast) {
        const shouldAutoPlay = Boolean(window._pendingAutoPlayRadio);
        window.syncPlayerWithGlobalBroadcast(shouldAutoPlay);
        if (shouldAutoPlay) window._pendingAutoPlayRadio = false;
    }
    
    console.log("[DCLM] Radio Playlist refreshed. Total tracks:", tracks.length);
};

window.initRadioPlaylist = async function() {
    try {
        const { data } = await supabase
            .from('radio_tracks')
            .select('id, title, speaker, duration, audio_url, created_at')
            .order('created_at', { ascending: true });
        if (data && data.length > 0) {
            window.refreshRadioPlaylistUI(data);
        }
        
        // Listen for tracks changes in real-time
        getFreshChannel('radio_tracks_sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'radio_tracks' }, async () => {
                const { data: updated } = await supabase
                    .from('radio_tracks')
                    .select('id, title, speaker, duration, audio_url, created_at')
                    .order('created_at', { ascending: true });
                if (updated) window.refreshRadioPlaylistUI(updated);
            }).subscribe();

            // Listen to radio active playback setting row
            supabase.from('app_settings').select('*').eq('key', 'radio_broadcast').maybeSingle().then(({ data }) => {
                if (data?.value) {
                    window._currentRadioPlaybackState = data.value;
                }
            });
            getFreshChannel('radio_playback_sync')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings', filter: "key=eq.radio_broadcast" }, payload => {
                    if (payload.new?.value) {
                        window._currentRadioPlaybackState = payload.new.value;
                    }
                }).subscribe();
        
    } catch (err) {
        console.error("[DCLM] Radio tracks failed:", err);
    }
};

function updateAllPlayerLabels(title, speaker) {
    const formattedTitle = (title || "DCLM OSUN II LIVE SANCTUARY BROADCAST").toUpperCase();
    const formattedSpeaker = (speaker || "Deeper Life Bible Church").toUpperCase();

    // 1. Radio View Card Labels
    const rTitle = document.getElementById("radio-player-title");
    const rSpeaker = document.getElementById("radio-player-speaker");
    if (rTitle) rTitle.textContent = formattedTitle;
    if (rSpeaker) rSpeaker.textContent = formattedSpeaker;

    // 2. Sticky Bottom Audio Player Bar Labels
    const bTitle = document.getElementById("current-track-title");
    const bSpeaker = document.getElementById("current-track-speaker");
    if (bTitle) bTitle.textContent = formattedTitle;
    if (bSpeaker) bSpeaker.textContent = formattedSpeaker;

    // 3. Ensure sticky bottom player bar is displayed
    const bBar = document.getElementById("global-audio-bar");
    if (bBar) bBar.style.display = "flex";
}

// ── Global Radio Player Functions ──
window.playAudioStream = function(url, title, speaker, trackId) {
    const player = document.getElementById("global-radio-player");
    if (!player || !url) return;

    if (player._liveLatencyMonitor) {
        clearInterval(player._liveLatencyMonitor);
        player._liveLatencyMonitor = null;
    }

    updateAllPlayerLabels(title, speaker);

    const isLiveStream = isLiveStreamUrl(url) || trackId === 'live';
    const isRadioMode = trackId === 'radio';
    const targetTrackId = trackId || (isLiveStream ? 'live' : 'track');

    // Check if ALREADY playing or loaded with this exact stream URL
    const cleanTarget = url.split('?')[0];
    const currentSrc = (player.src || player.originalSrc || '').split('?')[0];
    const isSameSource = currentSrc.includes(cleanTarget) || (window.isSameAudioSource && window.isSameAudioSource(currentSrc, cleanTarget));

    player.currentPlayingTrackId = targetTrackId;
    window.currentPlayingTrackId = targetTrackId;
    player.originalSrc = url;

    if (isLiveStream) {
        player.playbackMode = 'live';
        window.currentPlaybackMode = 'live';
    } else if (isRadioMode) {
        player.playbackMode = 'radio';
        window.currentPlaybackMode = 'radio';
    } else {
        player.playbackMode = 'library';
        window.currentPlaybackMode = 'library';
    }
    
    // If ALREADY on this exact source:
    if (isSameSource) {
        if (!player.paused) {
            console.log("[DCLM Audio] Active playback of this exact stream already in progress.");
            return;
        }
        // Resuming from pause on the same track: SYNCHRONOUS play keeps user gesture!
        console.log("[DCLM Audio] Resuming playback on current track synchronously:", cleanTarget);
        const playPromise = player.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                window.isAudioPlaying = true;
                if (window.syncRadioPlayButtonState) window.syncRadioPlayButtonState();
            }).catch(err => {
                console.warn("[DCLM Audio] Resume error:", err);
            });
        }
        window.isAudioPlaying = true;
        if (window.syncRadioPlayButtonState) window.syncRadioPlayButtonState();
        return;
    }

    let finalUrl = url;
    if (isLiveStream) {
        const cleanUrl = url.split('?')[0];
        const sep = cleanUrl.includes('?') ? '&' : '?';
        finalUrl = `${cleanUrl}${sep}_live=${Date.now()}`;
        delete player.pendingSeekTime;
    }

    // Switch to new source and play synchronously
    player.src = finalUrl;

    const playPromise = player.play();
    if (playPromise !== undefined) {
        playPromise.then(() => {
            window.isAudioPlaying = true;
            if (window.syncRadioPlayButtonState) window.syncRadioPlayButtonState();
            console.log("[DCLM Audio] Playing stream successfully:", finalUrl);
        }).catch(err => {
            console.warn("[DCLM Audio] Play waiting for user interaction/buffer:", err);
            window.isAudioPlaying = false;
            if (window.syncRadioPlayButtonState) window.syncRadioPlayButtonState();
        });
    }
    window.isAudioPlaying = true;
    if (window.syncRadioPlayButtonState) window.syncRadioPlayButtonState();
};

window.resumeVirtualPlaylist = function() {
    console.log("[DCLM Radio] Transitioning to 24/7 Virtual Radio Playlist...");
    if (window.syncPlayerWithGlobalBroadcast) {
        window.syncPlayerWithGlobalBroadcast(true);
    }
};

window.toggleRadioAudio = function() {
    if (window.toggleSermonAudio) {
        window.toggleSermonAudio();
    } else if (window.syncPlayerWithGlobalBroadcast) {
        const player = document.getElementById("global-radio-player");
        if (player && !player.paused) {
            player.pause();
            window.isAudioPlaying = false;
            if (window.syncRadioPlayButtonState) window.syncRadioPlayButtonState();
        } else {
            window.syncPlayerWithGlobalBroadcast(true);
        }
    }
};

// Ensure syncPlayerWithGlobalBroadcast delegates to the 24/7 background playing engine
if (!window.syncPlayerWithGlobalBroadcast || window.syncPlayerWithGlobalBroadcast._isFallback) {
    window.syncPlayerWithGlobalBroadcast = function(autoPlay = false) {
        const liveAudio = window._liveAudioSettings;
        const isLive = Boolean(liveAudio?.audioUrl && liveAudio?.audioUrl.trim().length > 0 && liveAudio?.isLive === true);

        if (isLive) {
            updateAllPlayerLabels(liveAudio.title, liveAudio.speaker || 'LIVE BROADCAST');
            if (autoPlay && window.playAudioStream) {
                window.playAudioStream(liveAudio.audioUrl.trim(), liveAudio.title, liveAudio.speaker, 'live');
            }
        } else if (window.calculateVirtualRadioPlayback) {
            const computed = window.calculateVirtualRadioPlayback();
            if (computed && computed.track) {
                updateAllPlayerLabels(computed.track.title, computed.track.speaker);
                if (autoPlay && window.playAudioStream) {
                    window.playAudioStream(computed.track.audio_url || computed.track.audioUrl, computed.track.title, computed.track.speaker, computed.track.id);
                }
            }
        }
    };
    window.syncPlayerWithGlobalBroadcast._isFallback = true;
}

window.updateGlobalRadioPlaybackState = async function(track, customStartedAt) {
    const startedAt = customStartedAt || Date.now();
    const payload = {
        activeTrackId: track.id.toString(),
        startedAt,
        title: track.title,
        speaker: track.speaker,
        audioUrl: track.audio_url,
        duration: track.duration
    };

    try {
        
            await supabase.from('app_settings').upsert({
                key: 'radio_broadcast',
                value: payload,
                last_updated: new Date().toISOString()
            });
        
    } catch (err) {
        console.error("[DCLM] Playback state update failed:", err);
    }
};

window.updateRadioTrackDuration = async function(trackId, duration) {
    if (!trackId || !duration) return;
    try {
        
            await supabase.from('radio_tracks').update({ duration }).eq('id', trackId);
        
    } catch (err) {
        console.error("[DCLM] Duration update failed:", err);
    }
};

// ── Video tracks sync ──
window._currentVideoTracks = [];
window.refreshAdminMediaCatalog = async function() {
    try {
        
            const { data } = await supabase.from('video_tracks').select('*').order('created_at', { ascending: false });
            if (data) {
                window._currentVideoTracks = data;
                if (window.renderLibraryVideos) window.renderLibraryVideos();
            }
        
    } catch (err) {
        console.error("[DCLM] Library videos load error:", err);
    }
};

// ── Outlines and Doctrines Sync ──
window._currentLibraryOutlines = [];
function initializeOutlinesSync() {
    
        supabase.from('library_outlines').select('*').order('created_at', { ascending: false }).then(({ data }) => {
            if (data) {
                window._currentLibraryOutlines = data;
            }
        });
        
        getFreshChannel('outlines_sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'library_outlines' }, async () => {
                const { data } = await supabase.from('library_outlines').select('*').order('created_at', { ascending: false });
                if (data) window._currentLibraryOutlines = data;
            }).subscribe();
    
}
initializeOutlinesSync();

// ── Workforce Departments Core ──
window._cachedDepartments = [];
window._cachedApplications = [];
window._allApplications = [];

async function initializeWorkforceDatabaseSeed() {
    const defaults = [
        {
            id: "dept_media",
            name: "Media & Technical",
            icon: "fa-video",
            color: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
            description: "Livestream, video projection, camera feeds, sound reinforcement.",
            meeting_schedule: "Saturdays @ 4:00 PM",
            leader_name: "Brother Isaac Williams",
            duties: [
                "Manage livestream broadcasting during Sunday Worship and Crusades.",
                "Coordinate sound system balancing and amplifier settings.",
                "Execute video coverage, angles, camera panning, and screen projection.",
                "Setup and tear down media instruments for outreach rallies."
            ],
            announcements: "Special media workshop holds this Saturday at 2:00 PM in the technical booth. All media workers must attend."
        },
        {
            id: "dept_choir",
            name: "Choir & Orchestral Music",
            icon: "fa-music",
            color: "linear-gradient(135deg, #ec4899, #be185d)",
            description: "Singing, anthems, orchestra rehearsals, and special music presentations.",
            meeting_schedule: "Fridays @ 5:00 PM & Saturdays @ 3:00 PM",
            leader_name: "Sister Helen Johnson",
            duties: [
                "Attend weekly voice training and choir rehearsals faithfully.",
                "Minister in song during Sunday services, Bible study, and special revival meetings.",
                "Maintain the orderliness and proper care of choir robes and orchestral instruments.",
                "Assist in writing and arranging sheet music for Sunday specials."
            ],
            announcements: "Rehearsal for the upcoming State Crusade begins this Friday. We will practice the new anthem 'Hallelujah Chorus'."
        }
    ];

    try {
        
            // Count departments
            const { count } = await supabase.from('workforce_departments').select('*', { count: 'exact', head: true });
            if (count === 0) {
                // Seed
                await supabase.from('workforce_departments').insert(defaults);
                console.log("[Workforce] Seeding default departments completed.");
            }
        
    } catch (err) {
        console.error("[Workforce] Seeding error:", err);
    }
}

function initializeWorkforceSyncBridges() {
    
        // Sync depts
        supabase.from('workforce_departments').select('*').then(({ data }) => {
            if (data) {
                window._cachedDepartments = data.map(d => ({
                    id: d.id,
                    name: d.name,
                    icon: d.icon,
                    color: d.color,
                    description: d.description,
                    meetingSchedule: d.meeting_schedule,
                    leaderName: d.leader_name,
                    duties: d.duties,
                    announcements: d.announcements
                }));
                if (window.refreshClientDepartments) window.refreshClientDepartments();
            }
        });
        
        getFreshChannel('workforce_depts_sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'workforce_departments' }, async () => {
                const { data } = await supabase.from('workforce_departments').select('*');
                if (data) {
                    window._cachedDepartments = data.map(d => ({
                        id: d.id,
                        name: d.name,
                        icon: d.icon,
                        color: d.color,
                        description: d.description,
                        meetingSchedule: d.meeting_schedule,
                        leaderName: d.leader_name,
                        duties: d.duties,
                        announcements: d.announcements
                    }));
                    if (window.refreshClientDepartments) window.refreshClientDepartments();
                }
            }).subscribe();

        // Sync apps
        const syncApps = async () => {
            const { data } = await supabase.from('workforce_applications').select('*');
            if (data) {
                const mapped = data.map(a => ({
                    id: a.id,
                    userId: a.user_id,
                    departmentId: a.department_id,
                    status: a.status,
                    submittedAt: a.submitted_at
                }));
                window._allApplications = mapped;
                window._cachedApplications = mapped.filter(a => a.userId === activeSessionUserId);
                
                if (window.refreshClientDepartments) window.refreshClientDepartments();
                if (window.refreshAdminWorkforceDesk) window.refreshAdminWorkforceDesk();
            }
        };
        syncApps();
        
        getFreshChannel('workforce_apps_sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'workforce_applications' }, () => {
                syncApps();
            }).subscribe();
    
}

window.submitDeptApplication = async function(event) {
    if (event) event.preventDefault();
    const deptId = document.getElementById("apply-dept-id")?.value;
    if (!deptId) return;

    try {
        const payload = {
            user_id: activeSessionUserId,
            department_id: deptId,
            status: 'pending',
            submitted_at: new Date().toISOString()
        };

        
            await supabase.from('workforce_applications').insert(payload);
        

        alert("🎉 Application submitted successfully! The department leader will review your profile shortly.");
        // Hide details modal
        const modal = document.getElementById("dept-detail-modal");
        if (modal) modal.classList.remove("active");

    } catch (err) {
        console.error("[Workforce] Apply error:", err);
        alert("Failed to submit application: " + err.message);
    }
};

window.updateApplicationStatus = async function(appId, newStatus) {
    try {
        
            await supabase.from('workforce_applications').update({ status: newStatus }).eq('id', appId);
        
        alert(`Application status updated to ${newStatus.toUpperCase()}`);
    } catch (err) {
        console.error("[Workforce] Update app failed:", err);
    }
};

window.deleteAdminDepartment = async function(deptId, deptName) {
    if (!confirm(`Are you sure you want to delete the department: "${deptName}"?`)) return;
    try {
        
            await supabase.from('workforce_departments').delete().eq('id', deptId);
        
        alert("Department deleted.");
    } catch (err) {
        console.error("[Workforce] Delete dept failed:", err);
    }
};

window.submitAdminAddDepartment = async function(event) {
    if (event) event.preventDefault();
    const name = document.getElementById("add-dept-name").value.trim();
    const leaderName = document.getElementById("add-dept-leader").value.trim();
    const schedule = document.getElementById("add-dept-schedule").value.trim();
    const description = document.getElementById("add-dept-desc").value.trim();
    const dutiesText = document.getElementById("add-dept-duties").value.trim();
    const announcement = document.getElementById("add-dept-announce").value.trim();
    const icon = document.getElementById("add-dept-icon").value;
    const color = document.getElementById("add-dept-color").value;

    const id = "dept_" + name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const duties = dutiesText.split('\n').map(d => d.trim()).filter(Boolean);

    try {
        const payload = {
            id,
            name,
            icon,
            color,
            description,
            meeting_schedule: schedule,
            leader_name: leaderName,
            duties,
            announcements: announcement
        };

        
            await supabase.from('workforce_departments').insert(payload);
        

        alert("✅ Department created successfully!");
        event.target.reset();

    } catch (err) {
        console.error("[Workforce] Create dept failed:", err);
        alert("Failed to create department: " + err.message);
    }
};

// ── Department Chat Room Messages ──
window._unsubscribeUnitMessages = null;

window.openUnitDashboard = function(deptId) {
    const modal = document.getElementById("unit-message-board-modal");
    const feedEl = document.getElementById("unit-message-board-feed");
    if (!feedEl) return;

    feedEl.innerHTML = `<div style="text-align: center; padding: 20px; color: #94a3b8;"><i class="fa-solid fa-spinner fa-spin"></i> Loading unit communications...</div>`;

    
        const syncUnitMsgs = async () => {
            const { data } = await supabase.from('workforce_unit_messages').select('*').eq('department_id', deptId).order('timestamp', { ascending: true });
            if (data && feedEl) {
                feedEl.innerHTML = data.length === 0 ? `
                    <div style="text-align: center; padding: 40px 20px; color: #94a3b8; font-size: 12px;">
                        <i class="fa-solid fa-comments" style="font-size: 24px; color: #475569; margin-bottom: 8px;"></i>
                        <p>No messages posted in this department dashboard yet. Be the first to start the discussion!</p>
                    </div>
                ` : data.map(msg => `
                    <div style="margin-bottom: 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; padding: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                            <span style="font-size: 10.5px; font-weight: 800; color: #38bdf8;">${msg.username}</span>
                            <span style="font-size: 8.5px; color: #64748b;">${new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <p style="font-size: 11.5px; color: #cbd5e1; margin: 0; line-height: 1.4;">${msg.text}</p>
                    </div>
                `).join('');
                feedEl.scrollTo({ top: feedEl.scrollHeight, behavior: "smooth" });
            }
        };
        syncUnitMsgs();
        
        window._unsubscribeUnitMessages = getFreshChannel(`unit_messages:${deptId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'workforce_unit_messages', filter: `department_id=eq.${deptId}` }, () => {
                syncUnitMsgs();
            }).subscribe();
    

    if (modal) modal.classList.add("active");
};

window.closeUnitDashboard = function() {
    const modal = document.getElementById("unit-message-board-modal");
    if (modal) modal.classList.remove("active");

    if (window._unsubscribeUnitMessages) {
        
            supabase.removeChannel(window._unsubscribeUnitMessages);
        
        window._unsubscribeUnitMessages = null;
    }
};

window.submitUnitMessage = async function(event, deptId) {
    if (event) event.preventDefault();
    const inputEl = document.getElementById("unit-chat-input");
    const val = inputEl ? inputEl.value.trim() : "";
    if (!val) return;

    const myUid = activeSessionUserId;
    const myFullName = `${window.currentUserState.firstName} ${window.currentUserState.lastName}`;

    try {
        
            await supabase.from('workforce_unit_messages').insert({
                department_id: deptId,
                user_id: myUid,
                username: myFullName,
                text: val,
                timestamp: new Date().toISOString()
            });
        
        if (inputEl) inputEl.value = "";
    } catch (err) {
        console.error("[Workforce] Chat send failed:", err);
    }
};

// ── Cell Locations locator ──
window._cachedCells = [];
window._currentCellsAdminTab = 'list';

async function initializeCellLocationsSeed() {
    const defaults = [
        {
            id: "cell_osogbo",
            name: "Osogbo Central Cell",
            leader_name: "Pastor Timothy Adeola",
            leader_phone: "+2348031234567",
            address: "12, Faith Avenue, Gbongan Road, Osogbo",
            meeting_schedule: "Sundays @ 5:00 PM",
            region: "Osogbo Region",
            latitude: 7.7827,
            longitude: 4.5419
        },
        {
            id: "cell_ife",
            name: "Ile-Ife Grace Center",
            leader_name: "Brother Silas Abraham",
            leader_phone: "+2348039876543",
            address: "8, Hope Close, Near OAU, Ile-Ife",
            meeting_schedule: "Sundays @ 5:00 PM",
            region: "Ile-Ife Region",
            latitude: 7.5212,
            longitude: 4.5123
        }
    ];

    try {
        
            const { count } = await supabase.from('cell_locations').select('*', { count: 'exact', head: true });
            if (count === 0) {
                await supabase.from('cell_locations').insert(defaults);
                console.log("[Cells] Seeding default cells completed.");
            }
        
    } catch (err) {
        console.error("[Cells] Seeding error:", err);
    }
}

function initializeCellsSyncBridges() {
    
        const fetchCells = async () => {
            const { data } = await supabase.from('cell_locations').select('*');
            if (data) {
                window._cachedCells = data.map(c => ({
                    id: c.id,
                    name: c.name,
                    address: c.address,
                    leaderName: c.leader_name,
                    leaderPhone: c.leader_phone,
                    meetingSchedule: c.meeting_schedule,
                    region: c.region,
                    latitude: c.latitude,
                    longitude: c.longitude
                }));
                if (window.refreshClientCells) window.refreshClientCells();
                if (window.refreshAdminCellsDesk) window.refreshAdminCellsDesk();
            }
        };
        fetchCells();
        
        getFreshChannel('cells_sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'cell_locations' }, () => {
                fetchCells();
            }).subscribe();
    
}

window.submitAdminAddCell = async function(event) {
    if (event) event.preventDefault();
    const name = document.getElementById("cl-new-name").value.trim();
    const leader = document.getElementById("cl-new-leader").value.trim();
    const phone = document.getElementById("cl-new-phone").value.trim();
    const region = document.getElementById("cl-new-region").value.trim();
    const address = document.getElementById("cl-new-address").value.trim();
    const schedule = document.getElementById("cl-new-schedule").value.trim();
    const lat = parseFloat(document.getElementById("cl-new-lat").value) || 0;
    const lng = parseFloat(document.getElementById("cl-new-lng").value) || 0;

    const id = "cell_" + name.toLowerCase().replace(/[^a-z0-9]/g, '_');

    try {
        const payload = {
            id,
            name,
            address,
            leader_name: leader,
            leader_phone: phone,
            meeting_schedule: schedule,
            region,
            latitude: lat,
            longitude: lng
        };

        
            await supabase.from('cell_locations').insert(payload);
        

        alert("✅ Home Cell created successfully!");
        event.target.reset();

    } catch (err) {
        console.error("[Cells] Create cell failed:", err);
        alert("Failed to create cell: " + err.message);
    }
};

window.deleteAdminCell = async function(cellId, cellName) {
    if (!confirm(`Are you sure you want to delete the home cell "${cellName}"?`)) return;
    try {
        
            await supabase.from('cell_locations').delete().eq('id', cellId);
        
        alert("Cell deleted successfully.");
    } catch (err) {
        console.error("[Cells] Delete cell failed:", err);
    }
};

// ── Technical Support desk ──
window._allSupportTickets = [];
window._mySupportTickets = [];

function initializeSupportSyncBridges() {
    
        const fetchTickets = async () => {
            const { data } = await supabase.from('support_tickets').select('*');
            if (data) {
                const mapped = data.map(t => ({
                    id: t.id,
                    userId: t.user_id,
                    issueType: t.issue_type,
                    details: t.details,
                    status: t.status,
                    createdAt: t.created_at,
                    repliedBy: t.replied_by,
                    reply: t.reply,
                    repliedAt: t.replied_at
                }));
                window._allSupportTickets = mapped;
                window._mySupportTickets = mapped.filter(t => t.userId === activeSessionUserId);

                if (window.refreshClientSupportTimeline) window.refreshClientSupportTimeline();
                if (window.refreshAdminSupportDesk) window.refreshAdminSupportDesk();
            }
        };
        fetchTickets();
        
        getFreshChannel('support_sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => {
                fetchTickets();
            }).subscribe();
    
}

window.submitSupportMessage = async function(event) {
    if (event) event.preventDefault();
    const issueType = document.getElementById("report-issue-type").value;
    const details = document.getElementById("report-issue-desc").value.trim();
    const submitBtn = event.target.querySelector("button[type='submit']");

    submitBtn.textContent = "Submitting...";
    submitBtn.disabled = true;

    try {
        const payload = {
            user_id: activeSessionUserId,
            issue_type: issueType,
            details,
            status: 'open',
            created_at: new Date().toISOString()
        };

        
            await supabase.from('support_tickets').insert(payload);
        

        alert("✅ Support ticket submitted successfully! A media desk officer will address it shortly.");
        event.target.reset();
        
        // Hide Support Overlay Panel
        const modal = document.getElementById("report-issue-overlay");
        if (modal) modal.classList.remove("active");

    } catch (err) {
        console.error("[Support] Submit ticket failed:", err);
        alert("Failed to submit ticket: " + err.message);
    } finally {
        submitBtn.textContent = "Submit Issue Report";
        submitBtn.disabled = false;
    }
};

window.submitSupportReply = async function(ticketId) {
    const inputEl = document.getElementById("reply-input-" + ticketId);
    const replyText = inputEl ? inputEl.value.trim() : "";
    if (!replyText) return;

    try {
        const payload = {
            status: 'resolved',
            replied_by: `${window.currentUserState.firstName} ${window.currentUserState.lastName}`,
            reply: replyText,
            replied_at: new Date().toISOString()
        };

        
            await supabase.from('support_tickets').update(payload).eq('id', ticketId);
        
        alert("✅ Reply published and ticket marked as resolved.");
    } catch (err) {
        console.error("[Support] Reply failed:", err);
    }
};

window.deleteSupportTicket = async function(ticketId, ticketName) {
    if (!confirm(`Are you sure you want to delete this ticket?`)) return;
    try {
        
            await supabase.from('support_tickets').delete().eq('id', ticketId);
        
        alert("Ticket deleted.");
    } catch (err) {
        console.error("[Support] Delete failed:", err);
    }
};

// ── Giving/Tithe Transactions ──
window._allGivingTransactions = [];
window._myGivingTransactions = [];

function initializeGivingSyncBridges() {
    
        const fetchTransactions = async () => {
            const { data } = await supabase.from('giving_transactions').select('*');
            if (data) {
                const mapped = data.map(g => ({
                    id: g.id,
                    userId: g.user_id,
                    amount: g.amount,
                    type: g.type,
                    status: g.status,
                    createdAt: g.created_at,
                    category: g.category,
                    paymentMethod: g.payment_method
                }));
                window._allGivingTransactions = mapped;
                window._myGivingTransactions = mapped.filter(g => g.userId === activeSessionUserId);

                if (window.refreshClientGivingTimeline) window.refreshClientGivingTimeline();
                if (window.refreshAdminGivingDesk) window.refreshAdminGivingDesk();
            }
        };
        fetchTransactions();
        
        getFreshChannel('giving_sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'giving_transactions' }, () => {
                fetchTransactions();
            }).subscribe();
    
}

window.completeSimulatedGivingTransaction = async function(category, amount, paymentMethod) {
    window.toggleGivingPaymentLoading(true, "Logging security clearance details on blockchain ledger...");

    try {
        const payload = {
            user_id: activeSessionUserId,
            amount,
            type: category,
            status: 'successful',
            created_at: new Date().toISOString(),
            category,
            payment_method: paymentMethod
        };

        
            await supabase.from('giving_transactions').insert(payload);
        

        setTimeout(() => {
            window.toggleGivingPaymentLoading(false);
            
            // Show custom success window
            const successPortal = document.getElementById("giving-success-portal");
            const checkoutPortal = document.getElementById("giving-checkout-portal");
            
            if (successPortal) successPortal.style.display = "block";
            if (checkoutPortal) checkoutPortal.style.display = "none";
            
            const amtLabel = document.getElementById("giving-success-amount");
            if (amtLabel) amtLabel.textContent = `â‚¦${amount.toLocaleString()}`;
            
            const catLabel = document.getElementById("giving-success-category");
            if (catLabel) catLabel.textContent = category.toUpperCase();
        }, 1500);

    } catch (err) {
        console.error("[Giving] Transaction failed:", err);
        window.toggleGivingPaymentLoading(false);
        alert("Transaction failed: " + err.message);
    }
};

window.deleteGivingTransaction = async function(id, memberName) {
    if (!confirm(`Are you sure you want to delete the transaction of ${memberName}?`)) return;
    try {
        
            await supabase.from('giving_transactions').delete().eq('id', id);
        
        alert("Transaction deleted successfully.");
    } catch (err) {
        console.error("[Giving] Delete transaction failed:", err);
    }
};

window.clearAllGivingTransactions = async function() {
    if (!confirm(`CRITICAL WARNING: Are you sure you want to purge all transactions?`)) return;
    try {
        
            await supabase.from('giving_transactions').delete().neq('id', 0);
        
        alert("Purged successfully.");
    } catch (err) {
        console.error("[Giving] Purge failed:", err);
    }
};

// ── Auth Screen & Admin Gateway Custom Swappers ──
window.setAuthScreenMode = function(mode) {
    const registerWorkspace = document.getElementById("register-workspace");
    const loginWorkspace = document.getElementById("login-workspace");
    const registerBtn = document.getElementById("auth-mode-register-btn");
    const loginBtn = document.getElementById("auth-mode-login-btn");
    const desc = document.getElementById("auth-header-desc");

    if (mode === 'register') {
        if (registerWorkspace) registerWorkspace.style.display = 'block';
        if (loginWorkspace) loginWorkspace.style.display = 'none';
        if (registerBtn) registerBtn.classList.add("active");
        if (loginBtn) loginBtn.classList.remove("active");
        if (desc) desc.textContent = "Register to join our online gospel fellowship community";
    } else {
        if (registerWorkspace) registerWorkspace.style.display = 'none';
        if (loginWorkspace) loginWorkspace.style.display = 'block';
        if (registerBtn) registerBtn.classList.remove("active");
        if (loginBtn) loginBtn.classList.add("active");
        if (desc) desc.textContent = "Restore your fellowship workspace access with your phone number";
    }
};

window.setAdminGatewayMode = function(mode) {
    const registerWorkspace = document.getElementById("admin-register-workspace");
    const loginWorkspace = document.getElementById("admin-login-workspace");
    const registerBtn = document.getElementById("admin-mode-register-btn");
    const loginBtn = document.getElementById("admin-mode-login-btn");
    const desc = document.getElementById("admin-gateway-header-desc");

    if (mode === 'register') {
        if (registerWorkspace) registerWorkspace.style.display = 'block';
        if (loginWorkspace) loginWorkspace.style.display = 'none';
        if (registerBtn) registerBtn.classList.add("active");
        if (loginBtn) loginBtn.classList.remove("active");
        if (desc) desc.textContent = "Register as DCLM OSUN II Church Admin with authority ID";
    } else {
        if (registerWorkspace) registerWorkspace.style.display = 'none';
        if (loginWorkspace) loginWorkspace.style.display = 'block';
        if (registerBtn) registerBtn.classList.remove("active");
        if (loginBtn) loginBtn.classList.add("active");
        if (desc) desc.textContent = "Enter admin credentials to access the DCLM OSUN II HQ Console";
    }
};

// ── Admin Gateway Sign Up ──
window.handleAdminSignup = async function (event) {
    event.preventDefault();
    const submitBtn = event.target.querySelector(".auth-submit-btn");
    if (submitBtn) {
        submitBtn.textContent = "Creating Admin Account...";
        submitBtn.disabled = true;
    }

    try {
        const firstName = (document.getElementById("admin-reg-firstname")?.value || "").trim();
        const lastName = (document.getElementById("admin-reg-lastname")?.value || "").trim();
        const region = document.getElementById("admin-reg-region")?.value || "";
        const group = (document.getElementById("admin-reg-group")?.value || "").trim();
        const avatarFile = document.getElementById("admin-reg-avatar")?.files?.[0];
        const adminCodeEntered = (document.getElementById("admin-reg-code")?.value || "").trim();

        // Safe phone extraction
        const phoneInputEl = document.getElementById("admin-reg-phone-input");
        const hiddenPhoneEl = document.getElementById("admin-reg-phone");
        let phoneVal = (hiddenPhoneEl?.value || phoneInputEl?.value || "").trim();

        if (!phoneVal) {
            alert("❌ Please enter your phone number.");
            return;
        }

        if (!phoneVal.startsWith('+')) {
            const cleanDigits = phoneVal.replace(/\D/g, '');
            const rawDigits = cleanDigits.startsWith('0') ? cleanDigits.substring(1) : cleanDigits;
            phoneVal = `+234${rawDigits}`;
        }

        if (!firstName || !lastName) {
            alert("❌ Please enter your First and Last name.");
            return;
        }

        if (!region) {
            alert("❌ Please select your Region in Osun State II.");
            return;
        }

        if (!group) {
            alert("❌ Please enter your District / Group.");
            return;
        }

        if (!adminCodeEntered) {
            alert("❌ Please enter the Special Admin Security ID.");
            return;
        }

        let avatarBase64 = "https://cdn-icons-png.flaticon.com/512/1144/1144760.png";
        if (avatarFile) {
            avatarBase64 = await compressImage(avatarFile);
        }

        // Validate Admin code
        let isCodeValid = false;
        const { data } = await supabase.from('admin_codes').select('*').eq('code', adminCodeEntered).eq('is_valid', true).maybeSingle();
        if (data) {
            isCodeValid = true;
            // Mark code as used
            await supabase.from('admin_codes').update({
                is_valid: false,
                used_by: `${firstName} ${lastName}`,
                used_at: new Date().toISOString()
            }).eq('id', data.id);
        }

        if (!isCodeValid) {
            alert("❌ Invalid or expired Admin Security Code. Please contact your administrator.");
            return;
        }

        const currentUid = activeSessionUserId || anonSessionId || crypto.randomUUID();
        const profile = {
            firstName,
            lastName,
            phone: phoneVal,
            region,
            group,
            profileImage: avatarBase64,
            isAdmin: true,
            role: 'admin',
            uid: currentUid
        };

        const { error: upsertError } = await supabase.from('users').upsert({
            id: currentUid,
            first_name: firstName,
            last_name: lastName,
            phone: phoneVal,
            region,
            group_name: group,
            profile_image: avatarBase64,
            is_admin: true,
            role: 'admin'
        });
        if (upsertError) throw upsertError;

        localStorage.setItem('dclm_logged_in_uid', currentUid);
        activeSessionUserId = currentUid;

        restoreProfileToState(profile, currentUid);
        alert(`🎉 Admin registration successful! Welcome, ${firstName}.`);
        
        const gatewayModal = document.getElementById("admin-gateway-modal");
        if (gatewayModal) gatewayModal.classList.remove("active");

    } catch (error) {
        console.error("[DCLM] Admin registration error:", error);
        alert(`❌ Admin registration failed: ${error.message || error}`);
    } finally {
        if (submitBtn) {
            submitBtn.textContent = "Register Admin";
            submitBtn.disabled = false;
        }
    }
};

// ── Admin Gateway Sign In ──
window.handleAdminLogin = async function (event) {
    event.preventDefault();
    const phoneInput = document.getElementById("admin-login-phone");
    const phoneVal = phoneInput ? phoneInput.value.trim() : "";
    const submitBtn = event.target.querySelector(".auth-submit-btn");

    if (!phoneVal) {
        alert("Please enter your registered phone number.");
        return;
    }

    submitBtn.textContent = "Verifying Admin clearance...";
    submitBtn.disabled = true;

    try {
        let matchedProfile = null;
        let oldUid = null;

        const formats = getPhoneFormats(phoneVal);

        try {
            const { data, error } = await withTimeout(
                supabase.from('users').select('*').in('phone', formats).eq('is_admin', true).maybeSingle(),
                6000,
                "Connection timeout"
            );
            if (error) throw error;
            if (data) {
                matchedProfile = {
                    firstName: data.first_name,
                    lastName: data.last_name,
                    phone: data.phone,
                    region: data.region,
                    group: data.group_name,
                    profileImage: data.profile_image,
                    isAdmin: data.is_admin,
                    role: data.role
                };
                oldUid = data.id;
            }
        } catch (netErr) {
            console.warn("[DCLM] Network query error/timeout on admin login:", netErr.message);
            const cachedRaw = localStorage.getItem('dclm_cached_user_profile');
            if (cachedRaw) {
                try {
                    const cached = JSON.parse(cachedRaw);
                    if (cached && cached.isAdmin && formats.some(f => cached.phone && (cached.phone === f || cached.phone.includes(f)))) {
                        matchedProfile = cached;
                        oldUid = cached.uid || localStorage.getItem('dclm_logged_in_uid') || anonSessionId;
                    }
                } catch (e) {}
            }
            if (!matchedProfile) {
                throw new Error("Unable to connect to church server. Please check your internet connection and try again.");
            }
        }

        if (!matchedProfile) {
            alert("❌ The entered phone number is not registered as an Admin on this platform.\n\nPlease check the number or contact church authority.");
            submitBtn.innerHTML = '<i class="fa-solid fa-shield-halved"></i> Authenticate Admin';
            submitBtn.disabled = false;
            return;
        }

        // Save login session
        localStorage.setItem('dclm_logged_in_uid', oldUid);
        localStorage.setItem('dclm_cached_user_profile', JSON.stringify({ ...matchedProfile, uid: oldUid }));
        activeSessionUserId = oldUid;

        restoreProfileToState(matchedProfile, oldUid);
        alert(`🎉 Welcome back Admin, ${matchedProfile.firstName}! Admin Console access granted.`);
        
        const gatewayModal = document.getElementById("admin-gateway-modal");
        if (gatewayModal) gatewayModal.classList.remove("active");

    } catch (err) {
        console.error("[DCLM] Admin login error:", err);
        alert(`❌ ${err.message || "Authentication failed. Please check network."}`);
    } finally {
        submitBtn.innerHTML = '<i class="fa-solid fa-shield-halved"></i> Authenticate Admin';
        submitBtn.disabled = false;
    }
};

// ── Admin Gateway URL Router ──
function checkAdminGatewayRoute() {
    const isLocalHostAdmin = window.location.pathname === '/admin-portal' || window.location.hash === '#admin-portal';
    const authScreen = document.getElementById("auth-screen");
    const gatewayModal = document.getElementById("admin-gateway-modal");

    if (isLocalHostAdmin) {
        // If logged in already, clear the hash and do nothing
        if (window.currentUserState && window.currentUserState.isLoggedIn && window.currentUserState.isAdmin) {
            console.log("[DCLM Router] Admin already logged in.");
            if (gatewayModal) gatewayModal.classList.remove("active");
            return;
        }
        
        // Hide regular auth screen
        if (authScreen) authScreen.classList.remove("active");
        
        // Show admin gateway modal
        if (gatewayModal) {
            gatewayModal.classList.add("active");
            // Set mode to login by default
            window.setAdminGatewayMode('login');
        }
    } else {
        // Hide gateway modal if not on route
        if (gatewayModal) gatewayModal.classList.remove("active");
    }
}

window.addEventListener('hashchange', checkAdminGatewayRoute);
if (document.readyState === "complete" || document.readyState === "interactive") {
    checkAdminGatewayRoute();
} else {
    document.addEventListener("DOMContentLoaded", checkAdminGatewayRoute);
}

// ── Admin Operations Console Engine ──

window.toggleAdminConsole = function(visible) {
    const overlay = document.getElementById("admin-console-overlay");
    if (!overlay) return;
    
    if (visible) {
        // Double check user authorization status
        if (!window.currentUserState || !window.currentUserState.isLoggedIn || !window.currentUserState.isAdmin) {
            alert("❌ Access Denied: Administrator security clearance required.");
            overlay.classList.remove("active");
            return;
        }
        overlay.classList.add("active");
        window.switchAdminTask('video');
    } else {
        overlay.classList.remove("active");
    }
};

window.switchAdminTask = function(task) {
    const canvas = document.getElementById("admin-workspace-canvas");
    if (!canvas) return;
    
    // Highlight the selected task tile button in the UI
    const tiles = document.querySelectorAll(".admin-tasks-nav button");
    tiles.forEach(tile => {
        if (tile.getAttribute("onclick")?.includes(`'${task}'`)) {
            tile.style.background = "rgba(56, 189, 248, 0.2)";
            tile.style.borderColor = "rgba(56, 189, 248, 0.4)";
        } else {
            tile.style.background = "";
            tile.style.borderColor = "";
        }
    });

    if (task === 'video') {
        const currentUrl = window._liveVideoSettings?.videoUrl || '';
        const currentAnnounce = window._liveVideoSettings?.announcement || '';
        canvas.innerHTML = `
            <h3 style="font-size: 13.5px; font-weight: 700; color: #ef4444; margin: 0 0 4px 0; display:flex; align-items:center; gap:6px;">
                <i class="fa-solid fa-video"></i> Live Video Stream Settings
            </h3>
            <p style="font-size: 11px; color:#94a3b8; margin:0 0 12px 0;">Configure sanctuary live feeds — supports YouTube Live, Facebook Live, HLS (.m3u8), and direct MP4 streams.</p>
            <form id="admin-video-stream-form" style="display:flex; flex-direction:column; gap:12px;">
                <div class="form-group" style="margin:0;">
                    <label style="color:#cbd5e1; font-weight:700; font-size:10px; text-transform:uppercase;">Video Stream URL (YouTube, Facebook, HLS .m3u8, MP4)</label>
                    <input type="text" id="canvas-video-url" value="${currentUrl}" placeholder="e.g. https://www.youtube.com/watch?v=... or https://domain.com/live.m3u8" style="width: 100%; border-radius: 8px; padding: 10px; background-color: #0b1827; border: 1px solid rgba(255,255,255,0.08); color:#ffffff; font-size:12.5px; outline:none; margin-top:4px;">
                </div>

                <div class="form-group" style="margin:0;">
                    <label style="color:#cbd5e1; font-weight:700; font-size:10px; text-transform:uppercase;">Video Scroll Announcement</label>
                    <textarea id="canvas-video-announcement" rows="3" placeholder="Enter scrolling notification text..." style="width: 100%; border-radius: 8px; padding: 10px; background-color: #0b1827; border: 1px solid rgba(255,255,255,0.08); color:#ffffff; font-size:12.5px; outline:none; resize:none; margin-top:4px;">${currentAnnounce}</textarea>
                </div>
                <button type="submit" class="admin-submit-btn" style="background: linear-gradient(135deg, #ef4444, #991b1b); display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 4px; font-size: 12px; padding: 12px;">
                    <i class="fa-solid fa-paper-plane"></i> Publish Live Video Feed
                </button>
            </form>
        `;
        
        const form = document.getElementById("admin-video-stream-form");
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const url = document.getElementById("canvas-video-url").value.trim();
            const text = document.getElementById("canvas-video-announcement").value.trim();
            const btn = e.target.querySelector("button");
            btn.textContent = "Publishing Video...";
            btn.disabled = true;
            try {
                const payload = {
                    videoUrl: url,
                    announcement: text,
                    lastUpdated: new Date().toISOString(),
                    updatedBy: `${window.currentUserState?.firstName || 'Admin'} ${window.currentUserState?.lastName || ''}`
                };
                
                    await supabase.from('app_settings').upsert({
                        key: 'live_video',
                        value: payload,
                        last_updated: new Date().toISOString(),
                        updated_by: `${window.currentUserState?.firstName || 'Admin'} ${window.currentUserState?.lastName || ''}`
                    });
                
                alert("✅ Live Video Feed published successfully!");
                window.toggleAdminConsole(false);
            } catch(err) {
                alert("Publish failed: " + err.message);
            } finally {
                btn.textContent = "Publish Live Video Feed";
                btn.disabled = false;
            }
        });
    }
    else if (task === 'audio') {
        const currentUrl = window._liveAudioSettings?.audioUrl || '';
        const currentAnnounce = window._liveAudioSettings?.announcement || '';
        const currentTitle = window._liveAudioSettings?.title || 'DCLM OSUN II LIVE SANCTUARY BROADCAST';
        const isLive = Boolean(currentUrl && window._liveAudioSettings?.isLive === true);
        
        canvas.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <h3 style="font-size: 13.5px; font-weight: 700; color: #f59e0b; margin: 0; display:flex; align-items:center; gap:6px;">
                    <i class="fa-solid fa-tower-broadcast"></i> Live Audio Broadcast Studio
                </h3>
                <span style="font-size:9.5px; font-weight:800; padding:3px 8px; border-radius:12px; ${isLive ? 'background:rgba(239,68,68,0.2); color:#f87171; border:1px solid rgba(239,68,68,0.3);' : 'background:rgba(168,85,247,0.15); color:#c084fc; border:1px solid rgba(168,85,247,0.3);'}">
                    ${isLive ? '🔴 LIVE STREAM ONLINE' : '📻 24/7 PLAYLIST ACTIVE'}
                </span>
            </div>
            <p style="font-size: 11px; color:#94a3b8; margin:0 0 14px 0;">Broadcast live service audio (Icecast, BUTT, Shoutcast, Zeno, Mixlr, HLS) to all listeners worldwide.</p>

            <form id="admin-audio-stream-form" style="display:flex; flex-direction:column; gap:12px;">
                <div class="form-group" style="margin:0;">
                    <label style="color:#cbd5e1; font-weight:700; font-size:10px; text-transform:uppercase;">Audio Stream URL</label>
                    <input type="text" id="canvas-audio-url" value="${currentUrl}" placeholder="e.g. https://stream.zeno.fm/... or http://your-icecast-server:8000/live" required style="width: 100%; border-radius: 8px; padding: 10px; background-color: #0b1827; border: 1px solid rgba(255,255,255,0.08); color:#ffffff; font-size:12.5px; outline:none; margin-top:4px;">
                </div>
                <div class="form-group" style="margin:0;">
                    <label style="color:#cbd5e1; font-weight:700; font-size:10px; text-transform:uppercase;">Broadcast Service Title</label>
                    <input type="text" id="canvas-audio-title" value="${currentTitle}" placeholder="e.g. Sunday Worship Service - Pastor W.F. Kumuyi" style="width: 100%; border-radius: 8px; padding: 10px; background-color: #0b1827; border: 1px solid rgba(255,255,255,0.08); color:#ffffff; font-size:12.5px; outline:none; margin-top:4px;">
                </div>
                <div class="form-group" style="margin:0;">
                    <label style="color:#cbd5e1; font-weight:700; font-size:10px; text-transform:uppercase;">Live Preacher / Speaker Name</label>
                    <textarea id="canvas-audio-announcement" rows="2" placeholder="e.g. Pastor W.F. Kumuyi / Osun State HQ Pulpit" style="width: 100%; border-radius: 8px; padding: 10px; background-color: #0b1827; border: 1px solid rgba(255,255,255,0.08); color:#ffffff; font-size:12.5px; outline:none; resize:none; margin-top:4px;">${currentAnnounce}</textarea>
                </div>
                
                <div style="display:flex; flex-direction:column; gap:10px; margin-top:6px;">
                    <button type="submit" class="admin-submit-btn" style="background: linear-gradient(135deg, #10b981, #047857); display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 12.5px; padding: 12px; font-weight:700;">
                        <i class="fa-solid fa-tower-broadcast"></i> Publish & Go Live (All Devices)
                    </button>
                    <button type="button" onclick="window.setAudioStreamOffline()" class="admin-submit-btn" style="background: linear-gradient(135deg, #ef4444, #991b1b); border:1px solid rgba(239,68,68,0.5); display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 12.5px; padding: 12px; font-weight:700; color:#ffffff;">
                        <i class="fa-solid fa-power-off"></i> 🔴 FORCE END & KILL ALL STREAMS (ALL DEVICES)
                    </button>
                </div>
            </form>

            <div style="margin-top:14px; padding:12px; border-radius:10px; background:rgba(15, 23, 42, 0.6); border:1px solid rgba(255,255,255,0.08);">
                <h4 style="font-size:11px; font-weight:800; color:#38bdf8; margin:0 0 6px 0; text-transform:uppercase; letter-spacing:0.5px; display:flex; align-items:center; gap:6px;">
                    <i class="fa-solid fa-sliders"></i> Ultra-Low Latency & vMix / BUTT Setup Guide
                </h4>
                <div style="font-size:10.5px; color:#cbd5e1; line-height:1.5; display:flex; flex-direction:column; gap:8px;">
                    <div>
                        <strong style="color:#f59e0b;">1. Routing Songs & Audio from vMix or PC to BUTT:</strong><br>
                        • <b>In vMix:</b> Go to <i>Settings ➔ Audio Outputs</i> ➔ set Bus A (or External Output) to <b>VB-Audio Cable</b>.<br>
                        • <b>In BUTT:</b> Go to <i>Settings ➔ Audio ➔ Audio Device</i> ➔ Select <b>CABLE Output (VB-Audio Virtual Cable)</b> or <b>Stereo Mix</b>.
                    </div>
                    <div>
                        <strong style="color:#38ef7d;">2. Eliminating Stream Delay (Sub-Second Latency):</strong><br>
                        • <b>In BUTT:</b> Set <i>Settings ➔ Audio ➔ Buffer Size</i> to <b>100ms</b>.<br>
                        • <b>In Icecast Server (icecast.xml):</b> Change <code>&lt;burst-size&gt;65535&lt;/burst-size&gt;</code> to <code>&lt;burst-size&gt;0&lt;/burst-size&gt;</code>.<br>
                        • <b>In App:</b> Web engine automatically speeds up buffer drift to sync real-time edge.
                    </div>
                </div>
            </div>
        `;
        
        const form = document.getElementById("admin-audio-stream-form");
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const url = document.getElementById("canvas-audio-url").value.trim();
            const title = document.getElementById("canvas-audio-title").value.trim() || 'DCLM OSUN II LIVE BROADCAST';
            const text = document.getElementById("canvas-audio-announcement").value.trim() || 'Osun State HQ Pulpit';
            const btn = e.target.querySelector("button[type='submit']");
            btn.textContent = "Publishing Audio...";
            btn.disabled = true;
            try {
                const payload = {
                    audioUrl: url,
                    title: title,
                    speaker: text,
                    announcement: text,
                    isLive: true,
                    lastUpdated: new Date().toISOString(),
                    updatedBy: `${window.currentUserState?.firstName || 'Admin'} ${window.currentUserState?.lastName || ''}`
                };
                
                await supabase.from('app_settings').upsert({
                    key: 'live_audio',
                    value: payload,
                    last_updated: new Date().toISOString(),
                    updated_by: `${window.currentUserState?.firstName || 'Admin'} ${window.currentUserState?.lastName || ''}`
                });
                await supabase.from('app_settings').upsert({
                    key: 'radio_broadcast',
                    value: {
                        activeTrackId: 'live',
                        startedAt: Date.now(),
                        title: title,
                        speaker: text,
                        audioUrl: url,
                        duration: 999999
                    },
                    last_updated: new Date().toISOString()
                });
                
                alert("✅ Live Audio Broadcast is now active! All connected listeners are now hearing the sanctuary pulpit feed.");
                window.toggleAdminConsole(false);
            } catch(err) {
                alert("Publish failed: " + err.message);
            } finally {
                btn.textContent = "Publish & Go Live";
                btn.disabled = false;
            }
        });
    }
    else if (task === 'offline') {
        canvas.innerHTML = `
            <h3 style="font-size: 13.5px; font-weight: 700; color: #f59e0b; margin: 0 0 4px 0; display:flex; align-items:center; gap:6px;">
                <i class="fa-solid fa-power-off"></i> Standby & Offline Controls
            </h3>
            <p style="font-size: 11px; color:#cbd5e1; line-height: 1.4; margin:0 0 12px 0;">Control live broadcast standby status for both video feeds and audio radio streams.</p>
            <div style="display:flex; flex-direction:column; gap:10px;">
                <button type="button" class="admin-submit-btn" onclick="window.setVideoStreamOffline()" style="background: linear-gradient(135deg, #ef4444, #b91c1c); display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; font-size:12px; padding: 12px;">
                    <i class="fa-solid fa-video-slash"></i> Turn Live Video Offline
                </button>
                <button type="button" class="admin-submit-btn" onclick="window.setAudioStreamOffline()" style="background: linear-gradient(135deg, #f59e0b, #d97706); display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; font-size:12px; padding: 12px;">
                    <i class="fa-solid fa-microphone-slash"></i> Turn Live Audio Offline (Playlist Resume)
                </button>
            </div>
        `;
    }
    else if (task === 'chat') {
        canvas.innerHTML = `
            <h3 style="font-size: 13.5px; font-weight: 700; color: #ef4444; margin: 0 0 4px 0; display:flex; align-items:center; gap:6px;">
                <i class="fa-solid fa-comments"></i> Moderate Live Chat
            </h3>
            <p style="font-size: 11px; color:#cbd5e1; line-height: 1.4; margin:0 0 12px 0;">Purges all chat history in the live broadcast feed database.</p>
            <button type="button" class="admin-submit-btn" onclick="window.clearChatMessages()" style="background: linear-gradient(135deg, #ef4444, #b91c1c); display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; font-size:12px; padding: 12px;">
                <i class="fa-solid fa-trash-can"></i> Purge All Chat Messages
            </button>
        `;
    }
    else if (task === 'carousel') {
        canvas.innerHTML = `
            <h3 style="font-size: 13.5px; font-weight: 700; color: #38ef7d; margin: 0 0 4px 0; display:flex; align-items:center; gap:6px;">
                <i class="fa-solid fa-images"></i> Manage Home Banner Slides
            </h3>
            <form id="admin-carousel-form" style="display:flex; flex-direction:column; gap:10px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom:14px; margin-bottom:12px;">
                <div class="form-group" style="margin:0;">
                    <label style="color:#cbd5e1; font-weight:700; font-size:9.5px; text-transform:uppercase;">Select Slide Image File</label>
                    <input type="file" id="banner-file-input" accept="image/*" required style="width: 100%; font-size:11px; margin-top:4px;">
                </div>
                <button type="submit" class="admin-submit-btn" style="background: linear-gradient(135deg, #38ef7d, #11998e); font-size:11px; padding: 8px 12px; font-weight:700; width:100%;">
                    Upload and Add Banner Slide
                </button>
            </form>
            <div id="admin-banners-list" style="display:flex; flex-direction:column; gap:8px; max-height: 180px; overflow-y:auto;">
                Loading slides...
            </div>
        `;
        
        const form = document.getElementById("admin-carousel-form");
        form.addEventListener("submit", window.handleAddCarouselBanner);
        window.renderAdminBannersList();
    }
    else if (task === 'radio') {
        canvas.innerHTML = `
            <h3 style="font-size: 13.5px; font-weight: 700; color: #a855f7; margin: 0 0 4px 0; display:flex; align-items:center; gap:6px;">
                <i class="fa-solid fa-radio"></i> Manage Radio Playlists
            </h3>
            <form id="admin-radio-form" style="display:flex; flex-direction:column; gap:10px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom:14px; margin-bottom:12px;">
                <div class="form-group" style="margin:0;">
                    <label style="color:#cbd5e1; font-weight:700; font-size:9.5px; text-transform:uppercase;">Audio Track Title</label>
                    <input type="text" id="radio-title-input" placeholder="e.g. Holiness Message" required style="width: 100%; border-radius: 6px; padding: 7px 10px; background-color: #0b1827; border: 1px solid rgba(255,255,255,0.08); color:#ffffff; font-size:12px; outline:none; margin-top:4px;">
                </div>
                <div class="form-group" style="margin:0;">
                    <label style="color:#cbd5e1; font-weight:700; font-size:9.5px; text-transform:uppercase;">Speaker / Minister</label>
                    <input type="text" id="radio-speaker-input" placeholder="e.g. Pastor W.F. Kumuyi" required style="width: 100%; border-radius: 6px; padding: 7px 10px; background-color: #0b1827; border: 1px solid rgba(255,255,255,0.08); color:#ffffff; font-size:12px; outline:none; margin-top:4px;">
                </div>
                <div class="form-group" style="margin:0;">
                    <label style="color:#cbd5e1; font-weight:700; font-size:9.5px; text-transform:uppercase;">Input Method</label>
                    <select id="radio-input-method" onchange="window.toggleRadioInputMethod(this.value)" style="width: 100%; border-radius: 6px; padding: 6px; background-color: #0b1827; border: 1px solid rgba(255,255,255,0.08); color:#ffffff; font-size:12px; outline:none; margin-top:4px;">
                        <option value="url">Provide Audio Media URL (.MP3)</option>
                        <option value="file">Upload Audio File from Device</option>
                    </select>
                </div>
                <div class="form-group" id="radio-url-group" style="margin:0;">
                    <label style="color:#cbd5e1; font-weight:700; font-size:9.5px; text-transform:uppercase;">Audio Media URL (.MP3)</label>
                    <input type="url" id="radio-url-input" placeholder="e.g. https://domain.com/audio/track.mp3" style="width: 100%; border-radius: 6px; padding: 7px 10px; background-color: #0b1827; border: 1px solid rgba(255,255,255,0.08); color:#ffffff; font-size:12px; outline:none; margin-top:4px;">
                </div>
                <div class="form-group" id="radio-file-group" style="margin:0; display:none;">
                    <label style="color:#cbd5e1; font-weight:700; font-size:9.5px; text-transform:uppercase;">Select Audio File (.MP3)</label>
                    <input type="file" id="radio-file-input" accept="audio/mpeg,audio/mp3,audio/*" style="width: 100%; font-size:11px; margin-top:4px;">
                </div>
                <button type="submit" class="admin-submit-btn" style="background: linear-gradient(135deg, #a855f7, #6b21a8); font-size:11px; padding: 8px 12px; font-weight:700; width:100%;">
                    Add Track to Radio Playlist
                </button>
            </form>
            <div id="admin-tracks-list" style="display:flex; flex-direction:column; gap:8px; max-height: 180px; overflow-y:auto;">
                Loading playlist...
            </div>
        `;
        
        const form = document.getElementById("admin-radio-form");
        setTimeout(() => window.toggleRadioInputMethod('url'), 50);
        form.addEventListener("submit", window.handleAddRadioTrack);
        window.renderAdminTracksList();
    }
    else if (task === 'workforce') {
        canvas.innerHTML = `
            <h3 style="font-size: 13.5px; font-weight: 700; color: #38bdf8; margin: 0 0 4px 0; display:flex; align-items:center; gap:6px;">
                <i class="fa-solid fa-users-gear"></i> Workforce Desk
            </h3>
            <div style="border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:12px; margin-bottom:12px;">
                <h4 style="font-size:11px; font-weight:700; color:#cbd5e1; margin-bottom:8px; text-transform:uppercase;">Pending Applications</h4>
                <div id="admin-workforce-apps" style="display:flex; flex-direction:column; gap:8px; max-height: 150px; overflow-y:auto;">
                    Loading applications...
                </div>
            </div>
            
            <h4 style="font-size:11px; font-weight:700; color:#cbd5e1; margin-bottom:8px; text-transform:uppercase;">Create New Department</h4>
            <form id="admin-dept-form" style="display:flex; flex-direction:column; gap:10px;">
                <div class="form-row" style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                    <div class="form-group" style="margin:0;">
                        <input type="text" id="add-dept-name" placeholder="Dept Name" required style="width: 100%; border-radius: 6px; padding: 6px; background-color: #0b1827; border: 1px solid rgba(255,255,255,0.08); color:#ffffff; font-size:11.5px; outline:none;">
                    </div>
                    <div class="form-group" style="margin:0;">
                        <input type="text" id="add-dept-leader" placeholder="Leader Name" required style="width: 100%; border-radius: 6px; padding: 6px; background-color: #0b1827; border: 1px solid rgba(255,255,255,0.08); color:#ffffff; font-size:11.5px; outline:none;">
                    </div>
                </div>
                <div class="form-row" style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                    <div class="form-group" style="margin:0;">
                        <input type="text" id="add-dept-schedule" placeholder="Meeting Schedule" required style="width: 100%; border-radius: 6px; padding: 6px; background-color: #0b1827; border: 1px solid rgba(255,255,255,0.08); color:#ffffff; font-size:11.5px; outline:none;">
                    </div>
                    <div class="form-group" style="margin:0;">
                        <select id="add-dept-icon" style="width: 100%; border-radius: 6px; padding: 6px; background-color: #0b1827; border: 1px solid rgba(255, 255, 255, 0.08); color:#ffffff; font-size:11.5px; outline:none;">
                            <option value="fa-music">Music Icon</option>
                            <option value="fa-users">Users Icon</option>
                            <option value="fa-shield-halved">Shield Icon</option>
                            <option value="fa-video">Video Icon</option>
                            <option value="fa-book">Book Icon</option>
                        </select>
                    </div>
                </div>
                <div class="form-row" style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                    <div class="form-group" style="margin:0;">
                        <input type="text" id="add-dept-color" placeholder="Hex Color (e.g. #38bdf8)" required style="width: 100%; border-radius: 6px; padding: 6px; background-color: #0b1827; border: 1px solid rgba(255,255,255,0.08); color:#ffffff; font-size:11.5px; outline:none;">
                    </div>
                    <div class="form-group" style="margin:0;">
                        <input type="text" id="add-dept-announce" placeholder="Active Announcement" required style="width: 100%; border-radius: 6px; padding: 6px; background-color: #0b1827; border: 1px solid rgba(255,255,255,0.08); color:#ffffff; font-size:11.5px; outline:none;">
                    </div>
                </div>
                <div class="form-group" style="margin:0;">
                    <textarea id="add-dept-desc" rows="2" placeholder="Brief description..." required style="width: 100%; border-radius: 6px; padding: 6px; background-color: #0b1827; border: 1px solid rgba(255,255,255,0.08); color:#ffffff; font-size:11.5px; outline:none; resize:none;"></textarea>
                </div>
                <div class="form-group" style="margin:0;">
                    <textarea id="add-dept-duties" rows="2" placeholder="Duties (one per line)..." required style="width: 100%; border-radius: 6px; padding: 6px; background-color: #0b1827; border: 1px solid rgba(255,255,255,0.08); color:#ffffff; font-size:11.5px; outline:none; resize:none;"></textarea>
                </div>
                <button type="submit" class="admin-submit-btn" style="background: linear-gradient(135deg, #38bdf8, #0e5fa3); font-size:11px; padding: 8px; font-weight:700; width:100%;">
                    Create Department
                </button>
            </form>
        `;
        
        const form = document.getElementById("admin-dept-form");
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            await window.submitAdminAddDepartment(e);
            window.switchAdminTask('workforce');
        });
        window.refreshAdminWorkforceDesk();
    }
    else if (task === 'cells') {
        canvas.innerHTML = `
            <h3 style="font-size: 13.5px; font-weight: 700; color: #fb923c; margin: 0 0 4px 0; display:flex; align-items:center; gap:6px;">
                <i class="fa-solid fa-map-location-dot"></i> Manage Home Cells
            </h3>
            <div style="border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:12px; margin-bottom:12px;">
                <h4 style="font-size:11px; font-weight:700; color:#cbd5e1; margin-bottom:8px; text-transform:uppercase;">Active Cell Groups</h4>
                <div id="admin-cells-list" style="display:flex; flex-direction:column; gap:8px; max-height: 150px; overflow-y:auto;">
                    Loading cells...
                </div>
            </div>
            
            <h4 style="font-size:11px; font-weight:700; color:#cbd5e1; margin-bottom:8px; text-transform:uppercase;">Register New Home Cell</h4>
            <form id="admin-cell-form" style="display:flex; flex-direction:column; gap:10px;">
                <div class="form-row" style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                    <div class="form-group" style="margin:0;">
                        <input type="text" id="cl-new-name" placeholder="Cell Name" required style="width: 100%; border-radius: 6px; padding: 6px; background-color: #0b1827; border: 1px solid rgba(255,255,255,0.08); color:#ffffff; font-size:11.5px; outline:none;">
                    </div>
                    <div class="form-group" style="margin:0;">
                        <input type="text" id="cl-new-leader" placeholder="Leader Name" required style="width: 100%; border-radius: 6px; padding: 6px; background-color: #0b1827; border: 1px solid rgba(255,255,255,0.08); color:#ffffff; font-size:11.5px; outline:none;">
                    </div>
                </div>
                <div class="form-row" style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                    <div class="form-group" style="margin:0;">
                        <input type="text" id="cl-new-phone" placeholder="Leader Phone" required style="width: 100%; border-radius: 6px; padding: 6px; background-color: #0b1827; border: 1px solid rgba(255,255,255,0.08); color:#ffffff; font-size:11.5px; outline:none;">
                    </div>
                    <div class="form-group" style="margin:0;">
                        <input type="text" id="cl-new-region" placeholder="Region / Location" required style="width: 100%; border-radius: 6px; padding: 6px; background-color: #0b1827; border: 1px solid rgba(255,255,255,0.08); color:#ffffff; font-size:11.5px; outline:none;">
                    </div>
                </div>
                <div class="form-row" style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                    <div class="form-group" style="margin:0;">
                        <input type="text" id="cl-new-schedule" placeholder="Meeting Time / Schedule" required style="width: 100%; border-radius: 6px; padding: 6px; background-color: #0b1827; border: 1px solid rgba(255,255,255,0.08); color:#ffffff; font-size:11.5px; outline:none;">
                    </div>
                    <div class="form-group" style="margin:0; display:flex; gap:4px;">
                        <input type="number" step="any" id="cl-new-lat" placeholder="Lat" required style="width: 50%; border-radius: 6px; padding: 6px; background-color: #0b1827; border: 1px solid rgba(255,255,255,0.08); color:#ffffff; font-size:11.5px; outline:none;">
                        <input type="number" step="any" id="cl-new-lng" placeholder="Lng" required style="width: 50%; border-radius: 6px; padding: 6px; background-color: #0b1827; border: 1px solid rgba(255,255,255,0.08); color:#ffffff; font-size:11.5px; outline:none;">
                    </div>
                </div>
                <div class="form-group" style="margin:0;">
                    <textarea id="cl-new-address" rows="2" placeholder="Full meeting address details..." required style="width: 100%; border-radius: 6px; padding: 6px; background-color: #0b1827; border: 1px solid rgba(255,255,255,0.08); color:#ffffff; font-size:11.5px; outline:none; resize:none;"></textarea>
                </div>
                <button type="submit" class="admin-submit-btn" style="background: linear-gradient(135deg, #fb923c, #d97706); font-size:11px; padding: 8px; font-weight:700; width:100%;">
                    Register Home Cell
                </button>
            </form>
        `;
        
        const form = document.getElementById("admin-cell-form");
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            await window.submitAdminAddCell(e);
            window.switchAdminTask('cells');
        });
        window.refreshAdminCellsDesk();
    }
    else if (task === 'support') {
        canvas.innerHTML = `
            <h3 style="font-size: 13.5px; font-weight: 700; color: #fb923c; margin: 0 0 4px 0; display:flex; align-items:center; gap:6px;">
                <i class="fa-solid fa-envelope-open-text"></i> Support Desk Tickets
            </h3>
            <p style="font-size: 11px; color:#cbd5e1; margin:0 0 12px 0;">Manage technical issues reported by diocese members.</p>
            <div id="admin-support-tickets" style="display:flex; flex-direction:column; gap:8px; max-height: 320px; overflow-y:auto;">
                Loading support tickets...
            </div>
        `;
        window.refreshAdminSupportDesk();
    }
    else if (task === 'giving') {
        canvas.innerHTML = `
            <h3 style="font-size: 13.5px; font-weight: 700; color: #38ef7d; margin: 0 0 4px 0; display:flex; align-items:center; gap:6px;">
                <i class="fa-solid fa-hand-holding-dollar"></i> Giving Ledger Records
            </h3>
            <p style="font-size: 11px; color:#cbd5e1; margin:0 0 12px 0;">Review contribution lists and clear payment records.</p>
            <div id="admin-giving-list" style="display:flex; flex-direction:column; gap:8px; max-height: 280px; overflow-y:auto; margin-bottom:12px;">
                Loading transactions...
            </div>
            <button type="button" class="admin-submit-btn" onclick="window.clearAllGivingTransactions()" style="background: linear-gradient(135deg, #ef4444, #b91c1c); display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; font-size:11px; padding: 10px;">
                <i class="fa-solid fa-trash-can"></i> Purge All Transaction Records
            </button>
        `;
        window.refreshAdminGivingDesk();
    }
};

window.setVideoStreamOffline = async function() {
    if (!confirm("Confirm turning the live video feed offline?")) return;
    try {
        const payload = {
            videoUrl: "",
            announcement: "DCLM OSUN 2 HQ Video Feed Offline. Enjoy our offline resources.",
            lastUpdated: new Date().toISOString(),
            updatedBy: `${window.currentUserState?.firstName || 'Admin'} ${window.currentUserState?.lastName || ''}`
        };
        
            await supabase.from('app_settings').upsert({
                key: 'live_video',
                value: payload,
                last_updated: new Date().toISOString(),
                updated_by: `${window.currentUserState?.firstName || 'Admin'} ${window.currentUserState?.lastName || ''}`
            });
        
        alert("✅ Video feed successfully set offline!");
        window.toggleAdminConsole(false);
    } catch(err) {
        alert("Offline toggle failed: " + err.message);
    }
};

window.setAudioStreamOffline = async function() {
    if (!confirm("Confirm ending live audio feed? This will forcefully disconnect the live stream on ALL connected devices and switch everyone to the 24/7 virtual radio playlist.")) return;
    try {
        const payload = {
            audioUrl: "",
            isLive: false,
            announcement: "DCLM OSUN 2 HQ Audio Feed Offline.",
            lastUpdated: new Date().toISOString(),
            updatedBy: `${window.currentUserState?.firstName || 'Admin'} ${window.currentUserState?.lastName || ''}`
        };
        
        await supabase.from('app_settings').upsert({
            key: 'live_audio',
            value: payload,
            last_updated: new Date().toISOString(),
            updated_by: `${window.currentUserState?.firstName || 'Admin'} ${window.currentUserState?.lastName || ''}`
        });
        await supabase.from('app_settings').delete().eq('key', 'radio_broadcast');

        // Broadcast realtime kill signal across active presence channel
        if (radioBroadcastChannel && isRadioChannelReady) {
            try {
                radioBroadcastChannel.send({
                    type: 'broadcast',
                    event: 'FORCE_END_LIVE_STREAM',
                    payload: { timestamp: Date.now() }
                });
                console.log("[DCLM Radio] 📡 Broadcasted FORCE_END_LIVE_STREAM signal to all devices.");
            } catch (e) {
                console.warn("[DCLM Radio] Broadcast error:", e);
            }
        }
        
        // Immediately sync locally without waiting for Realtime roundtrip
        window._liveAudioSettings = payload;
        
        const player = document.getElementById("global-radio-player");
        if (player) {
            player.pause();
            player.removeAttribute('src');
            player.load();
            player.currentPlayingTrackId = null;
            window.currentPlayingTrackId = null;
        }

        applyAudioSettingsUI(payload);

        if (window.resumeVirtualPlaylist) {
            window.resumeVirtualPlaylist();
        }
        
        alert("✅ Live audio feed killed! Broadcast signal sent to disconnect live streams on all listener devices and switch to 24/7 playlist.");
        if (window.toggleAdminConsole) window.toggleAdminConsole(false);
    } catch(err) {
        alert("Offline toggle failed: " + err.message);
    }
};

window.clearChatMessages = async function() {
    if (!confirm("⚠️ Are you sure you want to permanently clear all live chat messages from the channel database?")) return;
    try {
        
            const { error } = await supabase.from('live_chat_messages').delete().neq('id', 0);
            if (error) throw error;
        
        alert("✅ Live chat messages cleared successfully!");
        const chatBox = document.getElementById("chat-messages-box");
        if (chatBox) chatBox.innerHTML = '<div style="text-align:center;color:#64748b;font-size:11px;margin-top:20px;">Chat is empty.</div>';
    } catch (err) {
        console.error("Clear chat failed:", err);
        alert("Failed to clear chat: " + err.message);
    }
};

window.refreshBanners = async function() {
    let banners = [];
    
        const { data } = await supabase.from('carousel_banners').select('*').order('created_at', { ascending: true });
        if (data) banners = data;
    
    
    const container = document.getElementById("carousel");
    if (!container) return;
    
    if (banners.length === 0) {
        container.innerHTML = `
            <div class="carousel-slide active">
                <img src="/dclm logo.png" alt="DCLM OSUN 2" class="slide-img" style="object-fit: contain; background: #0a1628;">
            </div>
        `;
    } else {
        container.innerHTML = banners.map((b, idx) => `
            <div class="carousel-slide ${idx === 0 ? 'active' : ''}">
                <img src="${b.image_url}" alt="DCLM OSUN 2 Banner" class="slide-img">
            </div>
        `).join('');
    }
    
    if (window.startImageCarousel) window.startImageCarousel();
};

window.renderAdminBannersList = async function() {
    const listContainer = document.getElementById("admin-banners-list");
    if (!listContainer) return;
    let banners = [];
    
        const { data } = await supabase.from('carousel_banners').select('*').order('created_at', { ascending: false });
        if (data) banners = data;
    
    
    if (banners.length === 0) {
        listContainer.innerHTML = '<span style="font-size:11px;color:#94a3b8;text-align:center;">No active promotional banner slides.</span>';
        return;
    }
    
    listContainer.innerHTML = banners.map(b => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); padding:8px; border-radius:8px; gap:8px;">
            <img src="${b.image_url}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;">
            <div style="flex:1; display:flex; flex-direction:column; gap:2px; min-width:0;">
                <span style="font-size:11.5px; font-weight:700; color:#ffffff;">Slide ID: ${b.id}</span>
            </div>
            <button type="button" onclick="window.deleteAdminBannerSlide(${b.id})" style="border:none; background:rgba(239,68,68,0.15); color:#ef4444; width:28px; height:28px; border-radius:6px; cursor:pointer;">
                <i class="fa-solid fa-trash-can" style="font-size:11px;"></i>
            </button>
        </div>
    `).join('');
};

window.handleAddCarouselBanner = async function(event) {
    if (event) event.preventDefault();
    const fileInput = document.getElementById("banner-file-input");
    const file = fileInput?.files[0];
    
    if (!file) return;
    
    const submitBtn = event.target.querySelector("button[type='submit']");
    submitBtn.textContent = "Uploading Slide...";
    submitBtn.disabled = true;
    
    try {
        const compressed = await compressBannerImage(file);
        
            const { error } = await supabase.from('carousel_banners').insert({
                image_url: compressed
            });
            if (error) throw error;
        
        
        alert("✅ Banner slide added successfully!");
        event.target.reset();
        window.renderAdminBannersList();
        window.refreshBanners();
    } catch(err) {
        alert("Failed to add banner: " + err.message);
    } finally {
        submitBtn.textContent = "Upload and Add Banner Slide";
        submitBtn.disabled = false;
    }
};

window.deleteAdminBannerSlide = async function(id) {
    if (!confirm("Confirm deleting this promotional banner slide?")) return;
    try {
        
            const { error } = await supabase.from('carousel_banners').delete().eq('id', id);
            if (error) throw error;
        
        alert("✅ Banner slide deleted successfully!");
        window.renderAdminBannersList();
        window.refreshBanners();
    } catch(err) {
        alert("Delete failed: " + err.message);
    }
};

window.renderAdminTracksList = async function() {
    const listContainer = document.getElementById("admin-tracks-list");
    if (!listContainer) return;
    let tracks = [];
    
        const { data } = await supabase.from('radio_tracks').select('*').order('created_at', { ascending: false });
        if (data) tracks = data;
    
    
    if (tracks.length === 0) {
        listContainer.innerHTML = '<span style="font-size:11px;color:#94a3b8;text-align:center;">No virtual radio tracks in database.</span>';
        return;
    }
    
    listContainer.innerHTML = tracks.map(t => {
        const titleEscaped = (t.title || "Untitled").replace(/'/g, "\\'");
        const speakerEscaped = (t.speaker || "Minister").replace(/'/g, "\\'");
        const audioUrlEscaped = (t.audio_url || t.audioUrl || "").replace(/'/g, "\\'");
        const durationStr = t.duration ? `${Math.floor(t.duration/60)}m ${t.duration%60}s` : 'Unknown';
        return `
        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); padding:8px; border-radius:8px; gap:8px;">
            <div style="flex:1; display:flex; flex-direction:column; gap:2px; min-width:0;">
                <span style="font-size:11.5px; font-weight:700; color:#ffffff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${t.title}</span>
                <span style="font-size:9.5px; color:#cbd5e1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${t.speaker} • ${durationStr}</span>
            </div>
            <div style="display:flex; gap:6px; align-items:center;">
                <button type="button" onclick="window.playAudioStream('${audioUrlEscaped}', '${titleEscaped}', '${speakerEscaped}', '${t.id}')" style="border:none; background:rgba(168,85,247,0.2); color:#c084fc; width:28px; height:28px; border-radius:6px; cursor:pointer;" title="Play / Preview Track">
                    <i class="fa-solid fa-play" style="font-size:11px;"></i>
                </button>
                <button type="button" onclick="window.deleteAdminRadioTrack(${t.id})" style="border:none; background:rgba(239,68,68,0.15); color:#ef4444; width:28px; height:28px; border-radius:6px; cursor:pointer;" title="Delete Track">
                    <i class="fa-solid fa-trash-can" style="font-size:11px;"></i>
                </button>
            </div>
        </div>
    `}).join('');
};

window.toggleRadioInputMethod = function(method) {
    const urlGroup = document.getElementById("radio-url-group");
    const fileGroup = document.getElementById("radio-file-group");
    const urlInput = document.getElementById("radio-url-input");
    const fileInput = document.getElementById("radio-file-input");
    if (!urlGroup || !fileGroup) return;
    if (method === 'url') {
        urlGroup.style.display = 'block';
        fileGroup.style.display = 'none';
        if (urlInput) urlInput.required = true;
        if (fileInput) fileInput.required = false;
    } else {
        urlGroup.style.display = 'none';
        fileGroup.style.display = 'block';
        if (urlInput) urlInput.required = false;
        if (fileInput) fileInput.required = true;
    }
};

window.handleAddRadioTrack = async function(event) {
    if (event) event.preventDefault();
    const title = document.getElementById("radio-title-input").value.trim();
    const speaker = document.getElementById("radio-speaker-input").value.trim();
    const inputMethod = document.getElementById("radio-input-method").value;
    
    let audioUrl = "";
    let file = null;
    
    if (inputMethod === 'url') {
        audioUrl = document.getElementById("radio-url-input").value.trim();
        if (!audioUrl) {
            alert("Please provide a valid audio URL.");
            return;
        }
    } else {
        const fileInput = document.getElementById("radio-file-input");
        file = fileInput?.files[0];
        if (!file) {
            alert("Please select an audio file to upload.");
            return;
        }
    }

    const submitBtn = event.target.querySelector("button[type='submit']");
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Compressing & Optimizing Audio...';
    submitBtn.disabled = true;
    
    try {
        let finalAudioSource = audioUrl;
        let finalDuration = 180;

        if (file) {
            const compressed = await compressAudioFile(file);
            finalAudioSource = compressed.dataUrl;
            finalDuration = compressed.duration || 180;
            console.log(`[Admin] Compressed file to ${compressed.sizeMB} MB (Duration: ${finalDuration}s)`);
            submitBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up fa-bounce"></i> Uploading to Radio Station...';
        } else {
            finalDuration = await new Promise((resolve) => {
                const audio = new Audio();
                audio.addEventListener('loadedmetadata', () => {
                    resolve(Math.round(audio.duration) || 180);
                });
                audio.addEventListener('error', () => {
                    resolve(180);
                });
                audio.src = finalAudioSource;
                setTimeout(() => resolve(180), 2000);
            });
        }

        
            const { error } = await supabase.from('radio_tracks').insert({
                title,
                speaker,
                audio_url: finalAudioSource,
                duration: finalDuration
            });
            if (error) throw error;
        
        
        alert("✅ Radio track added to playlist successfully!");
        event.target.reset();
        window.toggleRadioInputMethod('url');
        window.renderAdminTracksList();
    } catch(err) {
        alert("Failed to add track: " + err.message);
    } finally {
        submitBtn.textContent = "Add Track to Radio Playlist";
        submitBtn.disabled = false;
    }
};

window.deleteAdminRadioTrack = async function(id) {
    if (!confirm("Confirm deleting this radio playlist track?")) return;
    try {
        
            const { error } = await supabase.from('radio_tracks').delete().eq('id', id);
            if (error) throw error;
        
        alert("✅ Playlist track deleted successfully!");
        window.renderAdminTracksList();
    } catch(err) {
        alert("Delete failed: " + err.message);
    }
};

window.refreshAdminWorkforceDesk = async function() {
    const listContainer = document.getElementById("admin-workforce-apps");
    if (!listContainer) return;
    
    const apps = window._allApplications || [];
    const pending = apps.filter(a => a.status === 'pending');
    
    if (pending.length === 0) {
        listContainer.innerHTML = '<span style="font-size:10.5px;color:#94a3b8;text-align:center;display:block;padding:10px 0;">No pending workforce applications.</span>';
        return;
    }
    
    const depts = window._cachedDepartments || [];
    
    listContainer.innerHTML = pending.map(a => {
        const dept = depts.find(d => d.id.toString() === a.departmentId.toString());
        const deptName = dept ? dept.name : 'Unknown Department';
        return `
            <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); padding:8px; border-radius:8px; gap:8px;">
                <div style="flex:1; display:flex; flex-direction:column; gap:2px; min-width:0;">
                    <span style="font-size:11px; font-weight:700; color:#ffffff;">Applicant: User ID ${a.userId.substring(0,6)}...</span>
                    <span style="font-size:9.5px; color:#cbd5e1;">Applying for: ${deptName}</span>
                </div>
                <div style="display:flex; gap:4px;">
                    <button type="button" onclick="window.updateApplicationStatus(${a.id}, 'approved')" style="border:none; background:rgba(56,239,125,0.15); color:#38ef7d; width:26px; height:26px; border-radius:6px; cursor:pointer;">
                        <i class="fa-solid fa-check" style="font-size:11px;"></i>
                    </button>
                    <button type="button" onclick="window.updateApplicationStatus(${a.id}, 'rejected')" style="border:none; background:rgba(239,68,68,0.15); color:#ef4444; width:26px; height:26px; border-radius:6px; cursor:pointer;">
                        <i class="fa-solid fa-xmark" style="font-size:11px;"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
};

window.refreshAdminCellsDesk = async function() {
    const listContainer = document.getElementById("admin-cells-list");
    if (!listContainer) return;
    
    let cells = [];
    
        const { data } = await supabase.from('cell_locations').select('*').order('name', { ascending: true });
        if (data) cells = data;
    
    
    if (cells.length === 0) {
        listContainer.innerHTML = '<span style="font-size:10.5px;color:#94a3b8;text-align:center;display:block;padding:10px 0;">No registered home cells.</span>';
        return;
    }
    
    listContainer.innerHTML = cells.map(c => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); padding:8px; border-radius:8px; gap:8px;">
            <div style="flex:1; display:flex; flex-direction:column; gap:2px; min-width:0;">
                <span style="font-size:11px; font-weight:700; color:#ffffff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${c.name}</span>
                <span style="font-size:9.5px; color:#cbd5e1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">Leader: ${c.leader_name || c.leaderName} (${c.region})</span>
            </div>
            <button type="button" onclick="window.deleteAdminCell('${c.id}', '${c.name.replace(/'/g, "\\'")}')" style="border:none; background:rgba(239,68,68,0.15); color:#ef4444; width:26px; height:26px; border-radius:6px; cursor:pointer;">
                <i class="fa-solid fa-trash-can" style="font-size:11px;"></i>
            </button>
        </div>
    `).join('');
};

window.refreshAdminSupportDesk = async function() {
    const listContainer = document.getElementById("admin-support-tickets");
    if (!listContainer) return;
    
    let tickets = [];
    
        const { data } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
        if (data) {
            tickets = data.map(t => ({
                id: t.id,
                userId: t.user_id,
                issueType: t.issue_type,
                details: t.details,
                status: t.status,
                createdAt: t.created_at
            }));
        }
    
    
    if (tickets.length === 0) {
        listContainer.innerHTML = '<span style="font-size:10.5px;color:#94a3b8;text-align:center;display:block;padding:10px 0;">No support inquiries submitted.</span>';
        return;
    }
    
    listContainer.innerHTML = tickets.map(t => {
        const timeStr = new Date(t.createdAt).toLocaleDateString();
        const badgeColor = t.status === 'open' ? '#f59e0b' : '#38ef7d';
        const badgeBg = t.status === 'open' ? 'rgba(245,158,11,0.15)' : 'rgba(56,239,125,0.15)';
        return `
            <div style="display:flex; flex-direction:column; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); padding:10px; border-radius:10px; gap:6px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:11.5px; font-weight:800; color:#ffffff;">${t.issueType}</span>
                    <span style="font-size:9px; font-weight:700; color:${badgeColor}; background:${badgeBg}; padding:2px 6px; border-radius:4px; text-transform:uppercase;">${t.status}</span>
                </div>
                <p style="font-size:10.5px; color:#cbd5e1; margin:0; line-height:1.4;">${t.details}</p>
                <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.05); padding-top:6px; margin-top:2px;">
                    <span style="font-size:9px; color:#94a3b8;">User ID: ${t.userId ? t.userId.substring(0,6)+'...' : 'Guest'} | ${timeStr}</span>
                    <div style="display:flex; gap:4px;">
                        ${t.status === 'open' ? `
                        <button type="button" onclick="window.resolveSupportTicket(${t.id})" style="border:none; background:rgba(56,239,125,0.15); color:#38ef7d; padding:2px 8px; font-size:9.5px; font-weight:700; border-radius:4px; cursor:pointer;">
                            Resolve
                        </button>` : ''}
                        <button type="button" onclick="window.deleteSupportTicket(${t.id})" style="border:none; background:rgba(239,68,68,0.15); color:#ef4444; width:22px; height:22px; border-radius:4px; display:flex; align-items:center; justify-content:center; cursor:pointer;">
                            <i class="fa-solid fa-trash-can" style="font-size:9px;"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
};

window.resolveSupportTicket = async function(id) {
    if (!confirm("Mark this technical issue ticket as resolved?")) return;
    try {
        
            await supabase.from('support_tickets').update({ status: 'resolved' }).eq('id', id);
        
        alert("✅ Ticket resolved successfully!");
        window.refreshAdminSupportDesk();
    } catch(err) {
        alert("Action failed: " + err.message);
    }
};

window.deleteSupportTicket = async function(id) {
    if (!confirm("Confirm deleting this technical ticket record?")) return;
    try {
        
            await supabase.from('support_tickets').delete().eq('id', id);
        
        alert("✅ Ticket deleted successfully!");
        window.refreshAdminSupportDesk();
    } catch(err) {
        alert("Delete failed: " + err.message);
    }
};

window.refreshAdminGivingDesk = async function() {
    const listContainer = document.getElementById("admin-giving-list");
    if (!listContainer) return;
    
    let txs = [];
    
        const { data } = await supabase.from('giving_transactions').select('*').order('created_at', { ascending: false });
        if (data) {
            txs = data.map(g => ({
                id: g.id,
                userId: g.user_id,
                amount: g.amount,
                type: g.type,
                status: g.status,
                createdAt: g.created_at
            }));
        }
    
    
    if (txs.length === 0) {
        listContainer.innerHTML = '<span style="font-size:10.5px;color:#94a3b8;text-align:center;display:block;padding:10px 0;">No transaction records logged.</span>';
        return;
    }
    
    listContainer.innerHTML = txs.map(t => {
        const timeStr = new Date(t.createdAt).toLocaleDateString();
        return `
            <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); padding:8px; border-radius:8px; gap:8px;">
                <div style="flex:1; display:flex; flex-direction:column; gap:2px; min-width:0;">
                    <span style="font-size:11px; font-weight:700; color:#38ef7d;">₦${parseFloat(t.amount).toLocaleString()} (${t.type})</span>
                    <span style="font-size:9px; color:#cbd5e1;">Donor: ${t.userId ? t.userId.substring(0,6)+'...' : 'Guest'} | ${timeStr}</span>
                </div>
                <button type="button" onclick="window.deleteAdminGivingTx(${t.id})" style="border:none; background:rgba(239,68,68,0.15); color:#ef4444; width:26px; height:26px; border-radius:6px; cursor:pointer;">
                    <i class="fa-solid fa-trash-can" style="font-size:11px;"></i>
                </button>
            </div>
        `;
    }).join('');
};

window.deleteAdminGivingTx = async function(id) {
    if (!confirm("Confirm deleting this transaction logs record?")) return;
    try {
        
            await supabase.from('giving_transactions').delete().eq('id', id);
        
        alert("✅ Transaction deleted successfully!");
        window.refreshAdminGivingDesk();
    } catch(err) {
        alert("Delete failed: " + err.message);
    }
};

function initializeBannersSync() {
    window.refreshBanners();
    
        getFreshChannel('banners_sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'carousel_banners' }, () => {
                window.refreshBanners();
            }).subscribe();
    
}

// Boot setup & Admin URL Trigger
function checkAdminUrlTrigger() {
    try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('open') === 'admin') {
            setTimeout(() => {
                if (window.toggleAdminConsole) {
                    window.toggleAdminConsole(true);
                }
                if (window.switchAdminTask) {
                    window.switchAdminTask('audio');
                }
            }, 600);
        }
    } catch(e) {}
}

if (document.readyState === "complete" || document.readyState === "interactive") {
    checkUserSession();
    checkAdminUrlTrigger();
} else {
    document.addEventListener("DOMContentLoaded", () => {
        checkUserSession();
        checkAdminUrlTrigger();
    });
}


