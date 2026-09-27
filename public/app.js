window.currentUserState = window.currentUserState || {
    isLoggedIn: false,
    isAdmin: false,
    firstName: "",
    lastName: "",
    phone: "",
    region: "",
    group: "",
    profileImage: ""
};

// Synchronously hydrate cached radio tracks for 0ms initial load
try {
    const cachedTracks = localStorage.getItem('dclm_radio_metadata_cache') || localStorage.getItem('dclm_radio_tracks_cache');
    if (cachedTracks) {
        window._currentRadioTracks = JSON.parse(cachedTracks);
    }
} catch(e) {}

// Global Client-Server Clock Synchronization Engine
window.clockSkew = 0;

window.getSyncedTime = function() {
    return Date.now() + window.clockSkew;
};

// Automatically normalizes external storage links (Dropbox, Google Drive) to direct stream URLs
window.getDirectMediaUrl = function(url) {
    if (!url) return url;
    
    const trimmed = url.trim();

    // Catch Terabox links to notify the user/admin why they fail and suggest working alternatives
    if (trimmed.includes("terabox") || trimmed.includes("nephobox") || trimmed.includes("dubox") || trimmed.includes("mirrobox") || trimmed.includes("momobox")) {
        console.warn("[Media Player] TeraBox share link detected. Displaying helpful guidance.");
        setTimeout(() => {
            alert("⚠️ TeraBox links are webpages and cannot be streamed directly due to TeraBox's platform security and login restrictions.\n\nPlease upload this file to Google Drive or Dropbox instead. Our app has built-in auto-converters that will automatically make those links streamable for you instantly!");
        }, 300);
        return ""; // Stop playback loading of invalid source
    }
    
    // Dropbox share link normalization
    if (trimmed.includes("dropbox.com")) {
        if (trimmed.includes("dl=0")) {
            return trimmed.replace("dl=0", "raw=1");
        } else {
            return trimmed + (trimmed.includes("?") ? "&raw=1" : "?raw=1");
        }
    }
    
    // Google Drive share link normalization
    if (trimmed.includes("drive.google.com")) {
        let fileId = "";
        const matchD = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        const matchId = trimmed.match(/id=([a-zA-Z0-9_-]+)/);
        if (matchD) fileId = matchD[1];
        else if (matchId) fileId = matchId[1];
        
        if (fileId) {
            return `https://docs.google.com/uc?export=download&id=${fileId}`;
        }
    }
    
    return trimmed;
};

async function calculateClockSkew() {
    try {
        const start = Date.now();
        const response = await fetch(window.location.origin + '/?t=' + start, { method: 'HEAD' });
        const dateHeader = response.headers.get('Date');
        if (dateHeader) {
            const serverTime = new Date(dateHeader).getTime();
            const end = Date.now();
            const latency = (end - start) / 2;
            const adjustedServerTime = serverTime + latency;
            window.clockSkew = adjustedServerTime - end;
            console.log("[Time Sync] Calculated client-to-server clock skew (ms):", window.clockSkew);
        }
    } catch (err) {
        console.warn("[Time Sync] Failed to calculate clock skew:", err);
    }
}
calculateClockSkew();

// Robust Firestore Timestamp parsing utility
window.parseStartedAt = function(startedAt) {
    if (!startedAt) return window.getSyncedTime();
    if (typeof startedAt.toMillis === 'function') return startedAt.toMillis();
    if (typeof startedAt.seconds === 'number') return startedAt.seconds * 1000;
    if (typeof startedAt === 'object') {
        if (startedAt._seconds !== undefined) return startedAt._seconds * 1000;
        if (startedAt.seconds !== undefined) return startedAt.seconds * 1000;
    }
    return Number(startedAt) || window.getSyncedTime();
};

// App Boot Hooks Trigger Listener
document.addEventListener("DOMContentLoaded", () => {
    initDynamicGreeting();
    evaluateAppGatewayLock();
    startImageCarousel();

    // Check if redirecting from a logout action
    if (localStorage.getItem("dclm_logout_redirect") === "true") {
        localStorage.removeItem("dclm_logout_redirect");
        setTimeout(() => {
            if (window.setAuthScreenMode) {
                window.setAuthScreenMode('login');
            }
        }, 150);
    }
});

// Clock System Parsing Engine
function initDynamicGreeting() {
    const timeElement = document.getElementById("time-greeting");
    const currentHour = new Date().getHours();
    let greetingString = "Welcome";

    if (currentHour >= 0 && currentHour < 12) { greetingString = "Good morning"; }
    else if (currentHour >= 12 && currentHour < 16) { greetingString = "Good afternoon"; }
    else { greetingString = "Good evening"; }

    timeElement.textContent = greetingString;
}

// Controls Screen Intercept Layout Form States
// FIX: Exposed on window so firebase-config.js can call it from module scope
window.evaluateAppGatewayLock = function evaluateAppGatewayLock() {
    const authScreen = document.getElementById("auth-screen");
    if (window.currentUserState.isLoggedIn) {
        if (authScreen) authScreen.classList.remove("active");
        verifyUserAuthentication();
    } else {
        // Guest Mode: Do NOT force-show the authScreen overlay on startup!
        // Explicitly remove active class to bypass any cached active state in index.html
        if (authScreen) authScreen.classList.remove("active");
        verifyUserAuthentication();
    }
}

// Sign-up Toggle Handler Tabs Hook
function setAuthRole(roleName) {
    window.selectedSignupRole = roleName;
    const memberBtn = document.getElementById("role-member-btn");
    const adminBtn = document.getElementById("role-admin-btn");
    const secretField = document.getElementById("admin-secret-group");

    if (roleName === 'admin') {
        adminBtn.classList.add("active");
        memberBtn.classList.remove("active");
        secretField.classList.add("visible");
    } else {
        memberBtn.classList.add("active");
        adminBtn.classList.remove("active");
        secretField.classList.remove("visible");
    }
}

// Profile Rendering Engine Functions
function verifyUserAuthentication() {
    const nameLabel = document.getElementById("user-display-name");
    const avatarPic = document.getElementById("user-avatar");
    const accountTabBtn = document.getElementById("account-tab-btn");
    const accName = document.getElementById("account-user-name");
    const accStatus = document.getElementById("account-user-status");
    const accPic = document.getElementById("account-profile-pic");
    const adminPanel = document.getElementById("admin-control-panel");
    const logoutBtn = document.getElementById("account-logout-btn");
    const signupBtn = document.getElementById("account-signup-btn");

    if (window.currentUserState.isLoggedIn) {
        if (nameLabel) nameLabel.textContent = window.currentUserState.firstName;
        if (avatarPic) avatarPic.src = window.currentUserState.profileImage || "https://cdn-icons-png.flaticon.com/512/1144/1144760.png";
        if (accName) accName.textContent = `${window.currentUserState.firstName} ${window.currentUserState.lastName}`;
        if (accPic) accPic.src = window.currentUserState.profileImage || "https://cdn-icons-png.flaticon.com/512/1144/1144760.png";

        if (window.currentUserState.isAdmin) {
            if (accountTabBtn && accountTabBtn.querySelector('span')) accountTabBtn.querySelector('span').textContent = "Admin Portal";
            if (accStatus) {
                accStatus.textContent = "System Administrator";
                accStatus.style.backgroundColor = "rgba(248, 113, 113, 0.15)";
                accStatus.style.color = "#f87171";
            }
            if (adminPanel) adminPanel.classList.add("authorized");
        } else {
            if (accountTabBtn && accountTabBtn.querySelector('span')) accountTabBtn.querySelector('span').textContent = "Account";
            if (accStatus) {
                accStatus.textContent = `Member • ${window.currentUserState.region}`;
                accStatus.style.backgroundColor = "rgba(56, 239, 125, 0.15)";
                accStatus.style.color = "#38ef7d";
            }
            if (adminPanel) adminPanel.classList.remove("authorized");
        }

        if (logoutBtn) logoutBtn.style.display = "flex";
        if (signupBtn) signupBtn.style.display = "none";
    } else {
        if (nameLabel) nameLabel.textContent = "Guest";
        if (avatarPic) avatarPic.src = "https://cdn-icons-png.flaticon.com/512/1144/1144760.png";
        if (accName) accName.textContent = "Guest Account";
        if (accPic) accPic.src = "https://cdn-icons-png.flaticon.com/512/1144/1144760.png";
        if (accountTabBtn && accountTabBtn.querySelector('span')) accountTabBtn.querySelector('span').textContent = "Account";
        if (accStatus) {
            accStatus.textContent = "Not Signed In";
            accStatus.style.backgroundColor = "rgba(148, 163, 184, 0.15)";
            accStatus.style.color = "#94a3b8";
        }
        if (adminPanel) adminPanel.classList.remove("authorized");

        if (logoutBtn) logoutBtn.style.display = "none";
        if (signupBtn) signupBtn.style.display = "flex";
    }
}

// Slider Engine Function Rules
let carouselIntervalId = null;
function startImageCarousel() {
    if (carouselIntervalId) {
        clearInterval(carouselIntervalId);
        carouselIntervalId = null;
    }
    
    const oldContainer = document.getElementById("carousel");
    if (!oldContainer) return;
    
    // Purge old event handlers by replacing the element with its clean clone
    const container = oldContainer.cloneNode(true);
    oldContainer.parentNode.replaceChild(container, oldContainer);
    
    const slides = container.querySelectorAll(".carousel-slide");
    let currentSlideIndex = 0;
    if (slides.length <= 1) return;
    
    // Synchronize initial currentSlideIndex with active slide element
    slides.forEach((slide, idx) => {
        if (slide.classList.contains("active")) {
            currentSlideIndex = idx;
        }
    });
    
    function showSlide(index) {
        const activeSlides = container.querySelectorAll(".carousel-slide");
        if (activeSlides.length <= 1) return;
        
        // Remove active class from the current slide
        activeSlides[currentSlideIndex].classList.remove("active");
        
        // Calculate new circular index
        currentSlideIndex = (index + activeSlides.length) % activeSlides.length;
        
        // Add active class to the target slide
        activeSlides[currentSlideIndex].classList.add("active");
    }
    
    function resetTimer() {
        if (carouselIntervalId) {
            clearInterval(carouselIntervalId);
        }
        carouselIntervalId = setInterval(() => {
            showSlide(currentSlideIndex + 1);
        }, 10000); // 10-second transition interval
    }
    
    // Start initial auto-transition cycle
    resetTimer();
    
    // Track gesture coordinates
    let startX = 0;
    let startY = 0;
    let isMouseDown = false;
    
    // Touch Gestures support
    container.addEventListener("touchstart", (e) => {
        if (carouselIntervalId) {
            clearInterval(carouselIntervalId);
            carouselIntervalId = null;
        }
        if (e.touches.length > 0) {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }
    }, { passive: true });
    
    container.addEventListener("touchend", (e) => {
        if (e.changedTouches.length > 0) {
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            handleSwipe(startX, startY, endX, endY);
        }
        resetTimer(); // Resume automatic timer when touch stops
    }, { passive: true });
    
    // Mouse Drags support (for easy desktop and emulator testing)
    container.addEventListener("mousedown", (e) => {
        if (carouselIntervalId) {
            clearInterval(carouselIntervalId);
            carouselIntervalId = null;
        }
        isMouseDown = true;
        startX = e.clientX;
        startY = e.clientY;
    });
    
    container.addEventListener("mouseup", (e) => {
        if (!isMouseDown) return;
        isMouseDown = false;
        const endX = e.clientX;
        const endY = e.clientY;
        handleSwipe(startX, startY, endX, endY);
        resetTimer(); // Resume automatic timer when mouse stops dragging
    });
    
    container.addEventListener("mouseleave", () => {
        if (isMouseDown) {
            isMouseDown = false;
            resetTimer(); // Resume automatic timer if mouse leaves during drag
        }
    });

    // Prevent default browser image dragging which disrupts custom drag gestures
    container.addEventListener("dragstart", (e) => {
        e.preventDefault();
    });
    
    function handleSwipe(x1, y1, x2, y2) {
        const diffX = x1 - x2;
        const diffY = y1 - y2;
        
        // Enforce swipe axis and horizontal threshold limit (50px)
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
            if (diffX > 50) {
                // Swipe Left -> Next Slide
                showSlide(currentSlideIndex + 1);
            } else {
                // Swipe Right -> Previous Slide
                showSlide(currentSlideIndex - 1);
            }
        }
    }
}
window.startImageCarousel = startImageCarousel;

/// Streaming Server Dynamic Audio Hook Trigger Interfaces
window.isAudioPlaying = false;
let currentPlayingTrackId = "";


const _blobUrlCache = new Map();

// IndexedDB Audio Cache Store for persistent 0ms audio retrieval
const DB_NAME = 'dclm_radio_audio_db';
const DB_VERSION = 1;
const STORE_NAME = 'audio_blobs';

function openAudioDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function getCachedAudioBlob(trackId) {
    try {
        const db = await openAudioDB();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(`track_${trackId}`);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => resolve(null);
        });
    } catch(e) {
        return null;
    }
}

async function saveCachedAudioBlob(trackId, blob) {
    try {
        const db = await openAudioDB();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.put(blob, `track_${trackId}`);
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => resolve(false);
        });
    } catch(e) {}
}

async function dataURLtoBlob(dataurl) {
    try {
        if (!dataurl || typeof dataurl !== 'string') return null;
        if (typeof fetch !== 'undefined') {
            try {
                const res = await fetch(dataurl);
                return await res.blob();
            } catch (fetchErr) {
                console.warn("[Radio] Native fetch(dataurl) fallback to atob:", fetchErr);
            }
        }
        
        const commaIdx = dataurl.indexOf(',');
        if (commaIdx === -1) return null;
        
        const header = dataurl.substring(0, commaIdx);
        let base64Data = dataurl.substring(commaIdx + 1).replace(/[\r\n\s]/g, '');
        const mimeMatch = header.match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'audio/mpeg';
        
        const byteCharacters = atob(base64Data);
        const len = byteCharacters.length;
        const u8arr = new Uint8Array(len);
        
        for (let i = 0; i < len; i++) {
            u8arr[i] = byteCharacters.charCodeAt(i);
        }
        
        return new Blob([u8arr], { type: mime });
    } catch (e) {
        console.error("[Radio] Fast data URL decode failed:", e);
        return null;
    }
}

async function getOrCreateBlobUrl(dataUrl, trackId) {
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
        return dataUrl;
    }
    const cacheKey = trackId ? `track_${trackId}` : dataUrl.substring(0, 100);
    if (_blobUrlCache.has(cacheKey)) {
        return _blobUrlCache.get(cacheKey);
    }
    const blob = await dataURLtoBlob(dataUrl);
    if (blob) {
        const blobUrl = URL.createObjectURL(blob);
        _blobUrlCache.set(cacheKey, blobUrl);
        if (trackId) saveCachedAudioBlob(trackId, blob);
        return blobUrl;
    }
    return dataUrl;
}

window.resolveTrackAudioUrl = async function(trackId, audioUrlHint) {
    if (!trackId) return "";
    const cacheKey = `track_${trackId}`;
    
    // 1. In-memory URL cache (0ms)
    if (_blobUrlCache.has(cacheKey)) {
        return _blobUrlCache.get(cacheKey);
    }
    
    // 2. Direct HTTP/HTTPS link (not base64)
    if (audioUrlHint && typeof audioUrlHint === 'string' && !audioUrlHint.startsWith('data:')) {
        return audioUrlHint;
    }
    
    // 3. If base64 passed directly
    if (audioUrlHint && typeof audioUrlHint === 'string' && audioUrlHint.startsWith('data:')) {
        return await getOrCreateBlobUrl(audioUrlHint, trackId);
    }
    
    // 4. Check IndexedDB persistent cache (5ms)
    const cachedBlob = await getCachedAudioBlob(trackId);
    if (cachedBlob) {
        const blobUrl = URL.createObjectURL(cachedBlob);
        _blobUrlCache.set(cacheKey, blobUrl);
        return blobUrl;
    }
    
    // 5. Fetch single track from Supabase
    if (window.supabaseClientInstance) {
        try {
            console.log(`[Radio] Fetching audio binary for track ${trackId} from Supabase...`);
            const { data, error } = await window.supabaseClientInstance
                .from('radio_tracks')
                .select('audio_url')
                .eq('id', trackId)
                .single();
            if (data && data.audio_url) {
                if (data.audio_url.startsWith('data:')) {
                    const blob = await dataURLtoBlob(data.audio_url);
                    if (blob) {
                        const blobUrl = URL.createObjectURL(blob);
                        _blobUrlCache.set(cacheKey, blobUrl);
                        saveCachedAudioBlob(trackId, blob);
                        return blobUrl;
                    }
                } else {
                    _blobUrlCache.set(cacheKey, data.audio_url);
                    return data.audio_url;
                }
            }
        } catch(e) {
            console.error("[Radio] Fetch audio source error:", e);
        }
    }
    return "";
};

// Robust audio source comparison utility to normalize URL variations, query params, and browser differences
window.isSameAudioSource = function(src1, src2) {
    if (!src1 || !src2) return false;
    
    // Resolve any blob URL references back to the original source URL
    const player = document.getElementById("global-radio-player");
    if (player && player.originalSrc) {
        if (src1 === player.src || src1 === player.blobUrl) {
            src1 = player.originalSrc;
        }
        if (src2 === player.src || src2 === player.blobUrl) {
            src2 = player.originalSrc;
        }
    }
    
    // Normalize both URLs using getDirectMediaUrl
    if (window.getDirectMediaUrl) {
        src1 = window.getDirectMediaUrl(src1);
        src2 = window.getDirectMediaUrl(src2);
    }
    
    // Strip origin and leading/trailing slashes
    const origin = window.location.origin + '/';
    let path1 = src1.replace(origin, '').trim();
    let path2 = src2.replace(origin, '').trim();
    
    // Decode URI component to handle %2F vs / or space encodings
    try {
        path1 = decodeURIComponent(path1);
        path2 = decodeURIComponent(path2);
    } catch(e) {}
    
    // Strip query parameters to compare base media files
    path1 = path1.split('?')[0];
    path2 = path2.split('?')[0];
    
    // Remove any double slashes or trailing slashes
    path1 = path1.replace(/\/+/g, '/').replace(/\/$/, '');
    path2 = path2.replace(/\/+/g, '/').replace(/\/$/, '');
    
    return path1 === path2;
};


// HLS.js instance manager for live audio streams
let _radioHlsInstance = null;
function destroyRadioHls() {
    if (_radioHlsInstance) {
        try { _radioHlsInstance.destroy(); } catch(e) {}
        _radioHlsInstance = null;
    }
}
window.destroyRadioHls = destroyRadioHls;


function playAudioStream(url, title, subtext, trackId = "") {
    const player = document.getElementById("global-radio-player");
    const audioBar = document.getElementById("global-audio-bar");
    if (!player || !url) return;

    // Automatically normalize storage links (Dropbox, Google Drive)
    url = window.getDirectMediaUrl(url);

    // Track original source url
    player.originalSrc = url;

    // Revoke previous blob URL if any to clean up memory
    if (player.blobUrl) {
        try { URL.revokeObjectURL(player.blobUrl); } catch(e) {}
        player.blobUrl = null;
    }

    // Clean up any stale live sync handler so it NEVER attempts to seek unseekable live streams
    if (player._liveSyncHandler) {
        player.removeEventListener('timeupdate', player._liveSyncHandler);
        player._liveSyncHandler = null;
    }

    if (trackId && trackId !== 'fallback' && trackId !== 'live') {
        if (window.addToRecentlyPlayed) {
            window.addToRecentlyPlayed({ id: trackId, title, speaker: subtext, type: 'audio', url: url });
        }
    }

    // Pause other media elements to prevent simultaneous audio overlap
    const liveVideo = document.getElementById("live-video-player");
    if (liveVideo) liveVideo.pause();
    if (window.stopHymnAudio) window.stopHymnAudio();

    // Always destroy any previous HLS audio instance before loading a new source
    destroyRadioHls();

    // Detect HLS stream (.m3u8) — use HLS.js for compatibility
    const isHlsStream = url && url.toLowerCase().includes('.m3u8');
    const isLiveStream = trackId === 'live';

    if (isHlsStream && typeof Hls !== 'undefined') {
        if (Hls.isSupported()) {
            console.log("[Radio] HLS audio stream detected. Initializing hls.js engine...");
            _radioHlsInstance = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
                maxBufferLength: 10,
                maxMaxBufferLength: 30
            });
            _radioHlsInstance.loadSource(url);
            _radioHlsInstance.attachMedia(player);
            _radioHlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
                console.log("[Radio] HLS audio manifest parsed. Autoplaying...");
                player.play().catch(e => console.warn("[Radio] HLS audio autoplay blocked:", e));
            });
            _radioHlsInstance.on(Hls.Events.ERROR, function(event, data) {
                if (data.fatal) {
                    if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                        console.warn("[Radio] HLS network error — attempting reconnect...");
                        _radioHlsInstance.startLoad();
                    } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                        console.warn("[Radio] HLS media error — attempting recovery...");
                        _radioHlsInstance.recoverMediaError();
                    } else {
                        console.error("[Radio] HLS fatal error — destroying instance.");
                        destroyRadioHls();
                    }
                }
            });
        } else if (player.canPlayType('application/x-mpegURL')) {
            // Native Safari/iOS HLS fallback
            console.log("[Radio] Using native HLS support (Safari/iOS).");
            player.src = url;
            player.load();
            player.play().catch(e => console.warn("[Radio] Native HLS autoplay blocked:", e));
        }
    } else {
        // Standard MP3 / Icecast / SHOUTcast / Direct audio
        let playUrl;
        if (isLiveStream) {
            delete player.pendingSeekTime;
            player.playbackRate = 1.0;
            const cleanUrl = url.split('?')[0];
            const isAlreadyPlayingThisLiveStream = (player.currentPlayingTrackId === 'live' || window.currentPlayingTrackId === 'live') && player.src && player.src.includes(cleanUrl) && !player.paused;
            
            if (!isAlreadyPlayingThisLiveStream) {
                const sep = url.includes('?') ? '&' : '?';
                playUrl = `${cleanUrl}${sep}_live=${Date.now()}`;
                player.src = playUrl;
                player.load();
                console.log("[Radio] Switched directly to Live Stream audio source:", playUrl);
            }
        } else {
            player.playbackRate = 1.0;
            playUrl = url;
            player.blobUrl = playUrl;
            const isSameSource = window.isSameAudioSource(player.src, playUrl);
            if (!isSameSource) {
                player.src = playUrl;
                player.load();
            }
        }

        const playPromise = player.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                isAudioPlaying = true;
                if (typeof _consecutiveAudioErrors !== 'undefined') _consecutiveAudioErrors = 0;
                if (window.syncRadioPlayButtonState) window.syncRadioPlayButtonState();
            }).catch(err => {
                console.warn("[Radio] Audio play waiting for user interaction:", err);
                isAudioPlaying = false;
                if (window.syncRadioPlayButtonState) window.syncRadioPlayButtonState();
            });
        }
    }

    window.currentPlayingTrackId = trackId;
    currentPlayingTrackId = trackId;
    player.currentPlayingTrackId = trackId;

    document.getElementById("current-track-title").textContent = title.toUpperCase();
    document.getElementById("current-track-speaker").textContent = subtext;
    
    // Update both Detailed Playlist Card UI and Radio UI fields if present in the DOM
    const playlistTitle = document.getElementById("playlist-track-title");
    const playlistSpeaker = document.getElementById("playlist-track-speaker");
    if (playlistTitle) playlistTitle.textContent = title.toUpperCase();
    if (playlistSpeaker) playlistSpeaker.textContent = subtext;

    const radioTitle = document.getElementById("radio-player-title");
    const radioSpeaker = document.getElementById("radio-player-speaker");
    if (radioTitle) radioTitle.textContent = title.toUpperCase();
    if (radioSpeaker) radioSpeaker.textContent = subtext;

    audioBar.classList.add("visible");
    isAudioPlaying = true;
    
    // Update Play Buttons Class across all visible elements
    document.getElementById("global-play-btn").className = "fa-solid fa-pause play-btn";
    const playlistPlayBtn = document.getElementById("playlist-play-btn");
    const radioPlayBtn = document.getElementById("radio-play-btn");
    if (playlistPlayBtn) playlistPlayBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    if (radioPlayBtn) radioPlayBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    
    // Disk Spinning animations
    const discIcon = document.getElementById("playlist-disc-icon");
    if (discIcon) {
        discIcon.className = "fa-solid fa-compact-disc fa-spin";
        discIcon.style.animationDuration = "4s";
    }

    // Non-HLS streams: sync UI state after play
    if (!isHlsStream) {
        updateActivePlaylistTrackHighlight();
        if (window.syncRadioPlayButtonState) window.syncRadioPlayButtonState();
    }

    // Audio is now playing — register as active listener
    if (window.joinRadioPresence) window.joinRadioPresence();
    
    // Update OS / Lockscreen Media Session metadata & controls
    updateMediaSession(title, subtext);
}

function updateMediaSession(title, speaker) {
    if ('mediaSession' in navigator) {
        try {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: (title || "DCLM OSUN II RADIO").toUpperCase(),
                artist: speaker || "Deeper Life Bible Church",
                album: "DCLM Osun State HQ Live Broadcast",
                artwork: [
                    { src: "/dclm logo.png", sizes: "96x96", type: "image/png" },
                    { src: "/dclm logo.png", sizes: "192x192", type: "image/png" },
                    { src: "/dclm logo.png", sizes: "512x512", type: "image/png" }
                ]
            });

            navigator.mediaSession.setActionHandler('play', () => {
                if (window.toggleRadioAudio) window.toggleRadioAudio();
            });
            navigator.mediaSession.setActionHandler('pause', () => {
                if (window.toggleRadioAudio) window.toggleRadioAudio();
            });
            navigator.mediaSession.setActionHandler('stop', () => {
                if (window.closeAudioBar) window.closeAudioBar();
            });
        } catch (e) {
            console.warn("[MediaSession] Registration notice:", e);
        }
    }
}

function closeAudioBar() {
    const player = document.getElementById("global-radio-player");
    if (player) {
        player.pause();
    }
    document.getElementById("global-audio-bar").classList.remove("visible");
    isAudioPlaying = false;
    document.getElementById("global-play-btn").className = "fa-solid fa-play play-btn";
    
    const playlistPlayBtn = document.getElementById("playlist-play-btn");
    const radioPlayBtn = document.getElementById("radio-play-btn");
    if (playlistPlayBtn) playlistPlayBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    if (radioPlayBtn) radioPlayBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    
    const discIcon = document.getElementById("playlist-disc-icon");
    if (discIcon) discIcon.className = "fa-solid fa-compact-disc";

    // User cancelled the audio — remove them from the listener count immediately
    if (window.leaveRadioPresence) window.leaveRadioPresence();

    // Also destroy any active HLS audio instance
    if (window.destroyRadioHls) window.destroyRadioHls();

    updateActivePlaylistTrackHighlight();
    if (window.syncRadioPlayButtonState) window.syncRadioPlayButtonState();
}

function toggleSermonAudio() {
    const player = document.getElementById("global-radio-player");
    const playBtnIcon = document.getElementById("global-play-btn");
    const playlistPlayBtn = document.getElementById("playlist-play-btn");
    const radioPlayBtn = document.getElementById("radio-play-btn");
    const discIcon = document.getElementById("playlist-disc-icon");
    
    if (!player) return;

    if (player.paused || !isAudioPlaying) {
        // Pause conflicting video/hymn media
        const liveVideo = document.getElementById("live-video-player");
        if (liveVideo) liveVideo.pause();
        if (window.stopHymnAudio) window.stopHymnAudio();

        // Make bottom audio bar visible
        const audioBar = document.getElementById("global-audio-bar");
        if (audioBar) audioBar.classList.add("visible");

        // Sync and play the current live stream or 24/7 virtual broadcast
        if (window.syncPlayerWithGlobalBroadcast) {
            window.syncPlayerWithGlobalBroadcast(true);
        } else if (player.src) {
            player.play().catch(e => console.warn("[Radio] Direct play error:", e));
        }
    } else {
        // Pause audio
        player.pause();
        isAudioPlaying = false;
        
        if (playBtnIcon) playBtnIcon.className = "fa-solid fa-play play-btn";
        if (playlistPlayBtn) playlistPlayBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        if (radioPlayBtn) radioPlayBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        if (discIcon) {
            discIcon.className = "fa-solid fa-compact-disc";
            discIcon.style.animationDuration = "";
        }
        
        updateActivePlaylistTrackHighlight();
        if (window.syncRadioPlayButtonState) window.syncRadioPlayButtonState();
        if (window.leaveRadioPresence) window.leaveRadioPresence();
    }
}

// Interactive tap seek handler for default playlist tab
window.handlePlaylistAudioSeek = function(e) {
    const player = document.getElementById("global-radio-player");
    const container = document.getElementById("playlist-audio-seeker-container");
    if (!player || !container || !player.duration || isNaN(player.duration) || !isFinite(player.duration)) return;
    if (currentPlayingTrackId === 'live' || window.currentPlayingTrackId === 'live' || player.currentPlayingTrackId === 'live') return;
    
    const rect = container.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(1, offsetX / width));
    
    player.currentTime = percentage * player.duration;
};

// Interactive tap seek handler for new fullscreen flyer-based Radio tab
window.handleRadioAudioSeek = function(e) {
    const player = document.getElementById("global-radio-player");
    const container = document.getElementById("radio-audio-seeker-container");
    if (!player || !container || !player.duration || isNaN(player.duration) || !isFinite(player.duration)) return;
    if (currentPlayingTrackId === 'live' || window.currentPlayingTrackId === 'live' || player.currentPlayingTrackId === 'live') return;
    
    const rect = container.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(1, offsetX / width));
    
    player.currentTime = percentage * player.duration;
};

// Autoplay next track sequence in lockstep with 24/7 time engine
function handleAudioEnded() {
    // If currently on live stream, do NOT cycle tracks
    if (currentPlayingTrackId === 'live' || window.currentPlayingTrackId === 'live') {
        console.warn("[Radio] Live stream ended or connection closed.");
        const isLiveOnline = Boolean(window._liveAudioSettings?.audioUrl && window._liveAudioSettings?.audioUrl.trim().length > 0 && window._liveAudioSettings?.isLive !== false);
        if (!isLiveOnline && window.syncPlayerWithGlobalBroadcast) {
            window.currentPlayingTrackId = null;
            window.syncPlayerWithGlobalBroadcast(window.isAudioPlaying);
        }
        return;
    }

    console.log("[Radio Playlist] Track completed naturally. Re-synchronizing 24/7 playlist engine in lockstep...");
    if (window.syncPlayerWithGlobalBroadcast) {
        window.syncPlayerWithGlobalBroadcast(true);
    }
}

// Highlights current playing track visually inside the playlist view list
function updateActivePlaylistTrackHighlight() {
    document.querySelectorAll(".radio-track-item").forEach(item => {
        item.classList.remove("active");
        const playBtn = item.querySelector(".track-play-indicator");
        if (playBtn) {
            playBtn.innerHTML = '<i class="fa-solid fa-circle-play"></i>';
        }
    });

    if (!isAudioPlaying || !currentPlayingTrackId) return;

    const activeItem = document.getElementById(`radio-track-${currentPlayingTrackId}`);
    if (activeItem) {
        activeItem.classList.add("active");
        const playBtn = activeItem.querySelector(".track-play-indicator");
        if (playBtn) {
            playBtn.innerHTML = '<i class="fa-solid fa-volume-high fa-beat-fade" style="color: #a855f7;"></i>';
        }
    }
}
window.updateActivePlaylistTrackHighlight = updateActivePlaylistTrackHighlight;

// Helper to format raw seconds to MM:SS formats
function formatTimeStr(seconds) {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Navigation Tab switching logic
function switchTab(clickedElement, targetView) {
    // Intercept restricted views for Guests
    if (!window.currentUserState.isLoggedIn && (targetView === 'library' || targetView === 'playlist')) {
        window.showGatedAccessModal(targetView);
        return;
    }

    document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
    if (clickedElement) clickedElement.classList.add("active");
    document.querySelectorAll(".app-view").forEach(view => view.classList.remove("active"));

    if (targetView === 'home') {
        document.getElementById("home-view").classList.add("active");
    } else if (targetView === 'account') {
        document.getElementById("account-view").classList.add("active");
    } else if (targetView === 'live') {
        document.getElementById("live-view").classList.add("active");
    } else if (targetView === 'bible') {
        document.getElementById("bible-view").classList.add("active");
        if (window.initBibleReader) window.initBibleReader();
    } else if (targetView === 'hymns') {
        document.getElementById("hymns-view").classList.add("active");
        if (window.initHymnsReader) window.initHymnsReader();
    } else if (targetView === 'doctrine') {
        document.getElementById("doctrine-view").classList.add("active");
        if (window.initDoctrines) window.initDoctrines();
    } else if (targetView === 'playlist') {
        document.getElementById("playlist-view").classList.add("active");
        if (window.renderFellowshipPlaylist) window.renderFellowshipPlaylist();
        if (window.refreshRecentlyPlayedUI) window.refreshRecentlyPlayedUI();
        if (window.initRadioPlaylist) window.initRadioPlaylist();
    } else if (targetView === 'radio') {
        document.getElementById("radio-view").classList.add("active");
        if (window.syncPlayerWithGlobalBroadcast) {
            window.syncPlayerWithGlobalBroadcast(false);
        }
        if (window.initRadioPlaylist) window.initRadioPlaylist();
    } else if (targetView === 'search') {
        document.getElementById("search-view").classList.add("active");
        const searchInput = document.getElementById("main-search-input");
        if (searchInput) searchInput.value = "";
        if (window.renderSearchSuggestions) window.renderSearchSuggestions();
    } else if (targetView === 'library') {
        document.getElementById("library-view").classList.add("active");
        const searchInput = document.getElementById("library-search-input");
        if (searchInput) searchInput.value = "";
        if (window.switchLibrarySubTab) window.switchLibrarySubTab('audio');
    } else if (targetView === 'departments') {
        // Intercept restricted views for Guests
        if (!window.currentUserState.isLoggedIn) {
            window.showGatedAccessModal('departments');
            return;
        }
        document.getElementById("departments-view").classList.add("active");
        if (window.refreshClientDepartments) window.refreshClientDepartments();
    } else {
        alert(`Opening placeholder frame frame panel screen: [${targetView.toUpperCase()}]`);
    }

    if (targetView !== 'live') {
        const player = document.getElementById("live-video-player");
        if (player) player.pause();
    }
}

window.initializeLiveVideoPlayer = function(videoUrl) {
    const offlineCard = document.getElementById("live-stream-offline-card");
    const onlineContent = document.getElementById("live-stream-online-content");
    const player = document.getElementById("live-video-player");
    const source = document.getElementById("video-stream-source");
    const iframeWrapper = document.getElementById("live-iframe-wrapper");
    const embedIframe = document.getElementById("live-embed-iframe");
    const statusText = document.getElementById("stream-status-text");

    const hasVideo = Boolean(videoUrl && videoUrl.trim().length > 0);

    if (!hasVideo) {
        // Stream is offline: Hide video player & live stream features, show offline standby card
        if (offlineCard) offlineCard.style.display = "block";
        if (onlineContent) onlineContent.style.display = "none";
        if (player) {
            player.pause();
            player.src = "";
        }
        if (embedIframe) embedIframe.src = "";
        if (iframeWrapper) iframeWrapper.style.display = "none";
        return;
    }

    // Stream is active: Show video player, toolbar, live chat, and hide offline standby card
    if (offlineCard) offlineCard.style.display = "none";
    if (onlineContent) onlineContent.style.display = "block";

    videoUrl = videoUrl.trim();

    // Check for YouTube / Facebook / Vimeo / iframe embed URLs
    const isYouTube = videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be");
    const isFacebook = videoUrl.includes("facebook.com");
    const isIframeEmbed = isYouTube || isFacebook || videoUrl.includes("embed") || videoUrl.includes("player.vimeo.com");

    if (isIframeEmbed) {
        let embedSrc = videoUrl;
        if (isYouTube) {
            const matchYt = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
            if (matchYt && matchYt[1]) {
                embedSrc = `https://www.youtube-nocookie.com/embed/${matchYt[1]}?autoplay=1&rel=0`;
            }
        }
        if (player) {
            player.pause();
            player.style.display = "none";
        }
        if (iframeWrapper && embedIframe) {
            iframeWrapper.style.display = "block";
            if (embedIframe.src !== embedSrc) embedIframe.src = embedSrc;
        }
    } else {
        // Native HLS or direct video stream
        if (iframeWrapper) iframeWrapper.style.display = "none";
        if (embedIframe) embedIframe.src = "";
        if (player) {
            player.style.display = "block";
            if (source) source.src = videoUrl;
            player.src = videoUrl;
            player.load();
            player.play().catch(e => console.log("[Live Video] Autoplay waiting:", e));
        }
    }

    if (statusText) {
        statusText.textContent = "DCLM OSUN 2 sanctuary video feed active";
        statusText.style.color = "#38ef7d";
        statusText.style.backgroundColor = "rgba(56, 239, 125, 0.1)";
    }
};

function handleGridClick(featureName) {
    if (featureName === 'Watch Live Video Feed') {
        document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
        document.querySelectorAll(".app-view").forEach(view => view.classList.remove("active"));
        document.getElementById("live-view").classList.add("active");

        const videoUrl = window._liveVideoSettings?.videoUrl || "";
        if (window.initializeLiveVideoPlayer) {
            window.initializeLiveVideoPlayer(videoUrl);
        }

        const countLabel = document.getElementById("live-viewer-count");
        let baseViewersCount = Math.floor(Math.random() * (450 - 320 + 1)) + 320;
        if (countLabel) countLabel.textContent = baseViewersCount;

        const viewerIncrementInterval = setInterval(() => {
            if (!document.getElementById("live-view").classList.contains("active")) {
                clearInterval(viewerIncrementInterval);
                return;
            }
            baseViewersCount += Math.floor(Math.random() * 5) - 2;
            if (countLabel) countLabel.textContent = baseViewersCount;
        }, 4000);

    } else if (featureName === 'Hymns & Anthems') {
        switchTab(null, 'hymns');
    } else if (featureName === 'Doctrine') {
        switchTab(null, 'doctrine');
    } else if (featureName === 'Library') {
        switchTab(null, 'library');
    } else if (featureName === 'Maximized Audio Panel') {
        const player = document.getElementById("global-radio-player");
        const tracks = window._currentRadioTracks || [];
        const isPlayingRadio = player && player.src && 
            (player.currentPlayingTrackId === 'live' || 
             player.currentPlayingTrackId === 'fallback' || 
             player.currentPlayingTrackId === 'fallback-all-gods-children' || 
             tracks.some(t => t.id === player.currentPlayingTrackId));
             
        if (isPlayingRadio) {
            // Find the Radio navigation item to keep nav bar highlighted
            const radioNavItem = Array.from(document.querySelectorAll(".nav-bar .nav-item, .bottom-nav .nav-item")).find(item => {
                const span = item.querySelector('span');
                return span && (span.textContent.trim().toLowerCase() === 'radio' || span.textContent.trim().toLowerCase() === 'playlist');
            });
            switchTab(radioNavItem || null, 'radio');
        }
    } else if (featureName === 'Departments') {
        // Switch to departments tab
        document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
        document.querySelectorAll(".app-view").forEach(view => view.classList.remove("active"));
        
        // Hide overlay or account panel if open
        const detailsPanel = document.getElementById("account-basic-details-panel");
        if (detailsPanel) detailsPanel.classList.remove("active");
        
        document.getElementById("departments-view").classList.add("active");
        if (window.refreshClientDepartments) {
            window.refreshClientDepartments();
        }
    } else if (featureName === 'Cell Locator') {
        // Switch to cell locator tab
        document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
        document.querySelectorAll(".app-view").forEach(view => view.classList.remove("active"));
        
        const detailsPanel = document.getElementById("account-basic-details-panel");
        if (detailsPanel) detailsPanel.classList.remove("active");
        
        const cellLocatorEl = document.getElementById("cell-locator-view");
        if (cellLocatorEl) cellLocatorEl.classList.add("active");
        if (window.refreshClientCells) {
            window.refreshClientCells();
        }
    } else {
        alert(`Opening ${featureName} view container...`);
    }
}

window.startRadioPlayback = function() {
    window._pendingAutoPlayRadio = true;
    switchTab(null, 'radio');

    if (window.syncPlayerWithGlobalBroadcast) {
        window.syncPlayerWithGlobalBroadcast(true);
    }
};

window.preBufferActiveRadioTrack = function() {
    try {
        const tracks = window._currentRadioTracks || [];
        if (tracks.length === 0) return;
        
        const computed = window.calculateVirtualRadioPlayback();
        if (computed && computed.track) {
            const audioSrc = computed.track.audio_url || computed.track.audioUrl;
            if (audioSrc && typeof audioSrc === 'string' && audioSrc.startsWith('data:')) {
                // Pre-decode into Blob cache asynchronously so playback is 0ms instant
                getOrCreateBlobUrl(audioSrc, computed.track.id);
            }
        }
    } catch(e) {
        console.warn("[Radio Pre-buffer] Pre-cache notice:", e);
    }
};

window._defaultRadioTracks = [
    { id: 2, title: "THINGS ARE NOT THE SAME ANYMORE", speaker: "DLSO CHOIR", duration: 660, audio_url: "/audio/radio_track_2.mp3", created_at: "2026-06-14T11:51:12.705472+00:00" },
    { id: 3, title: "THATS ENOUGH", speaker: "DLCF CHOIR", duration: 368, audio_url: "/audio/radio_track_3.mp3", created_at: "2026-08-29T15:19:45.13627+00:00" }
];

if (!window._currentRadioTracks || window._currentRadioTracks.length === 0) {
    try {
        const _cached = localStorage.getItem('dclm_radio_metadata_cache');
        if (_cached) {
            const _parsed = JSON.parse(_cached);
            if (Array.isArray(_parsed)) {
                const isStale = _parsed.some(t => (t.id == 2 && t.duration !== 660) || (t.id == 3 && t.duration !== 368));
                if (isStale) {
                    console.log("[Radio Sync] Purging stale localStorage radio metadata cache.");
                    localStorage.removeItem('dclm_radio_metadata_cache');
                } else if (_parsed.length > 0) {
                    window._currentRadioTracks = _parsed;
                }
            }
        }
    } catch(e) {}
    if (!window._currentRadioTracks || window._currentRadioTracks.length === 0) {
        window._currentRadioTracks = window._defaultRadioTracks;
    }
}

window.calculateVirtualRadioPlayback = function() {
    let tracks = window._currentRadioTracks || [];
    if (tracks.length === 0) {
        tracks = window._defaultRadioTracks || [];
        window._currentRadioTracks = tracks;
    }

    // Sort tracks deterministically by created_at / id
    const sortedTracks = [...tracks].sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : (a.createdAt ? (a.createdAt.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime()) : (Number(a.id) || 0));
        const timeB = b.created_at ? new Date(b.created_at).getTime() : (b.createdAt ? (b.createdAt.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime()) : (Number(b.id) || 0));
        return timeA - timeB;
    });

    // Stable fixed reference epoch (Friday, January 1, 2026 00:00:00 UTC)
    const epoch = 1767225600000;
    const now = window.getSyncedTime ? window.getSyncedTime() : Date.now();
    let elapsedMs = now - epoch;
    if (elapsedMs < 0) elapsedMs = now;

    const elapsedSec = elapsedMs / 1000;

    // Sum the durations
    let totalDurationSec = 0;
    const trackDurations = sortedTracks.map(t => {
        const dur = (t.duration && !isNaN(t.duration) && Number(t.duration) > 0) ? Number(t.duration) : 180;
        totalDurationSec += dur;
        return dur;
    });

    if (totalDurationSec <= 0) {
        totalDurationSec = 180 * sortedTracks.length;
    }

    // Calculate current cycle offset in seconds
    const cycleSec = elapsedSec % totalDurationSec;

    // Locate active track inside the current cycle
    let runningSum = 0;
    for (let i = 0; i < sortedTracks.length; i++) {
        const track = sortedTracks[i];
        const dur = trackDurations[i];
        if (cycleSec >= runningSum && cycleSec < runningSum + dur) {
            const offset = cycleSec - runningSum;
            const calculatedStartedAt = now - Math.floor(offset * 1000);
            return {
                track: track,
                offset: offset,
                startedAt: calculatedStartedAt
            };
        }
        runningSum += dur;
    }

    const first = sortedTracks[0];
    return {
        track: first,
        offset: 0,
        startedAt: now
    };
};

window.preloadRadioAudioInBackground = function() {
    const player = document.getElementById("global-radio-player");
    if (!player) return;
    
    // Check if live stream is online
    const liveUrl = (window._liveAudioSettings?.audioUrl || "").trim();
    const isLive = Boolean(liveUrl && window._liveAudioSettings?.isLive !== false);
    
    let targetUrl = '';
    let targetTitle = '';
    let targetSpeaker = '';
    let targetId = '';
    let targetOffset = 0;
    
    if (isLive) {
        targetUrl = liveUrl;
        targetTitle = window._liveAudioSettings?.title || "DCLM OSUN II LIVE BROADCAST";
        targetSpeaker = window._liveAudioSettings?.speaker || "Osun State HQ Pulpit";
        targetId = 'live';
    } else {
        const computed = window.calculateVirtualRadioPlayback ? window.calculateVirtualRadioPlayback() : null;
        if (computed && computed.track) {
            targetUrl = computed.track.audio_url || computed.track.audioUrl;
            targetTitle = computed.track.title;
            targetSpeaker = computed.track.speaker;
            targetId = computed.track.id.toString();
            targetOffset = computed.offset || 0;
        }
    }
    
    // Update all labels immediately
    if (targetTitle) {
        const rTitle = document.getElementById("radio-player-title");
        const rSpeaker = document.getElementById("radio-player-speaker");
        const cTitle = document.getElementById("current-track-title");
        const cSpeaker = document.getElementById("current-track-speaker");
        const pTitle = document.getElementById("playlist-track-title");
        const pSpeaker = document.getElementById("playlist-track-speaker");
        if (rTitle) rTitle.textContent = targetTitle.toUpperCase();
        if (rSpeaker) rSpeaker.textContent = targetSpeaker;
        if (cTitle) cTitle.textContent = targetTitle.toUpperCase();
        if (cSpeaker) cSpeaker.textContent = targetSpeaker;
        if (pTitle) pTitle.textContent = targetTitle.toUpperCase();
        if (pSpeaker) pSpeaker.textContent = targetSpeaker;
    }
    
    // Preload audio into player element in background
    if (targetUrl) {
        if (!player.src || player.src === '' || player.src.endsWith('#')) {
            player.src = targetUrl;
            player.preload = "auto";
            player.currentPlayingTrackId = targetId;
            window.currentPlayingTrackId = targetId;
            if (targetOffset > 0 && targetId !== 'live') {
                player.pendingSeekTime = targetOffset;
            }
            player.load();
            console.log("[DCLM Radio] 🚀 Background audio preloaded:", targetUrl, "offset:", targetOffset);
        } else if (player.paused && targetId !== 'live' && targetOffset > 0) {
            player.pendingSeekTime = targetOffset;
        }
    }
};

// Immediately preload audio on script load and on DOM ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", window.preloadRadioAudioInBackground);
} else {
    setTimeout(window.preloadRadioAudioInBackground, 0);
}

window.syncPlayerWithGlobalBroadcast = function(forcePlay = false) {
    // Check if an active Live Audio Stream is configured and active
    let liveUrl = (window._liveAudioSettings?.audioUrl || "").trim();
    let isLiveAudioOnline = Boolean(liveUrl && window._liveAudioSettings?.isLive !== false);
    
    let state = null;
    
    if (isLiveAudioOnline) {
        state = {
            trackId: 'live',
            title: window._liveAudioSettings?.title || "DCLM OSUN II LIVE BROADCAST",
            speaker: window._liveAudioSettings?.speaker || "Osun State HQ Pulpit",
            audioUrl: liveUrl,
            duration: 0
        };
    } else {
        // 24/7 Virtual Radio Mode (Synchronized across all listeners)
        const computed = window.calculateVirtualRadioPlayback();
        if (computed && computed.track) {
            state = {
                trackId: computed.track.id.toString(),
                startedAt: computed.startedAt,
                offset: computed.offset,
                title: computed.track.title,
                speaker: computed.track.speaker,
                audioUrl: computed.track.audio_url || computed.track.audioUrl,
                duration: computed.track.duration
            };
        } else {
            const defaultTrack = (window._defaultRadioTracks && window._defaultRadioTracks[0]) || {
                id: '2',
                title: "THINGS ARE NOT THE SAME ANYMORE",
                speaker: "DLSO CHOIR",
                audio_url: "/audio/radio_track_2.mp3",
                duration: 660,
                created_at: "2026-06-14T11:51:12.705472+00:00"
            };
            state = {
                trackId: defaultTrack.id.toString(),
                startedAt: Date.now(),
                offset: 0,
                title: defaultTrack.title,
                speaker: defaultTrack.speaker,
                audioUrl: defaultTrack.audio_url,
                duration: defaultTrack.duration
            };
        }
    }
    
    window._currentRadioPlaybackState = state;

    const player = document.getElementById("global-radio-player");
    if (!player) return;

    player.currentPlayingTrackId = state.trackId;
    window.currentPlayingTrackId = state.trackId;
    currentPlayingTrackId = state.trackId;

    // Update UI titles & labels everywhere
    const radioTitle = document.getElementById("radio-player-title");
    const radioSpeaker = document.getElementById("radio-player-speaker");
    if (radioTitle) radioTitle.textContent = (state.title || "DCLM OSUN II RADIO").toUpperCase();
    if (radioSpeaker) radioSpeaker.textContent = state.speaker || "Deeper Life Bible Church";

    const playlistTitle = document.getElementById("playlist-track-title");
    const playlistSpeaker = document.getElementById("playlist-track-speaker");
    if (playlistTitle) playlistTitle.textContent = (state.title || "DCLM OSUN II RADIO").toUpperCase();
    if (playlistSpeaker) playlistSpeaker.textContent = state.speaker || "Deeper Life Bible Church";

    const currentTitle = document.getElementById("current-track-title");
    const currentSpeaker = document.getElementById("current-track-speaker");
    if (currentTitle) currentTitle.textContent = (state.title || "DCLM OSUN II RADIO").toUpperCase();
    if (currentSpeaker) currentSpeaker.textContent = state.speaker || "Deeper Life Bible Church";

    const isSyncLive = state.trackId === 'live';
    const startedAt = state.startedAt ? window.parseStartedAt(state.startedAt) : Date.now();
    const elapsedSeconds = !isSyncLive ? (state.offset !== undefined ? state.offset : Math.max(0, (window.getSyncedTime() - startedAt) / 1000)) : 0;

    const shouldPlay = isAudioPlaying || forcePlay;
    
    if (shouldPlay) {
        const audioBar = document.getElementById("global-audio-bar");
        if (audioBar) audioBar.classList.add("visible");
        
        if (isSyncLive) {
            delete player.pendingSeekTime;
            playAudioStream(state.audioUrl, state.title, state.speaker, 'live');
            return;
        }

        // Show immediate responsive green round loading spinner on play buttons
        const radioPlayBtn = document.getElementById("radio-play-btn");
        if (radioPlayBtn) {
            radioPlayBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin" style="font-size: 26px; color: #22c55e;"></i>';
            radioPlayBtn.setAttribute("data-loading", "true");
        }
        const globalPlayBtn = document.getElementById("global-play-btn");
        if (globalPlayBtn) {
            globalPlayBtn.className = "fa-solid fa-circle-notch fa-spin play-btn";
            globalPlayBtn.style.color = "#22c55e";
        }
        const playlistPlayBtn = document.getElementById("playlist-play-btn");
        if (playlistPlayBtn) {
            playlistPlayBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin" style="font-size: 16px; color: #22c55e;"></i>';
        }

        window.resolveTrackAudioUrl(state.trackId, state.audioUrl).then(playUrl => {
            if (!playUrl) {
                console.error("[Radio] Could not resolve audio URL for track:", state.trackId);
                if (radioPlayBtn) {
                    radioPlayBtn.innerHTML = '<i class="fa-solid fa-play" style="margin-left: 3px;"></i>';
                    radioPlayBtn.removeAttribute("data-loading");
                }
                if (globalPlayBtn) {
                    globalPlayBtn.className = "fa-solid fa-play play-btn";
                    globalPlayBtn.style.color = "";
                }
                if (playlistPlayBtn) {
                    playlistPlayBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                }
                return;
            }
            player.blobUrl = playUrl;

            // Check if player source is already set
            const isSameSrc = player.src && (player.src === playUrl || player.src.endsWith(playUrl) || (player.originalSrc && player.originalSrc === state.audioUrl));
            
            const applySeekAndPlay = (forceSeek = false) => {
                const targetSeek = Math.max(0, elapsedSeconds);
                const currentDiff = Math.abs((player.currentTime || 0) - targetSeek);
                const isPlayingSmoothly = !player.paused && currentDiff < 3.0;

                // Always record pending seek time so loadedmetadata/canplay will snap if not ready yet
                if (targetSeek > 0) {
                    player.pendingSeekTime = targetSeek;
                }

                // Snap seek position if out of sync or forced
                if (!isPlayingSmoothly && (forceSeek || currentDiff > 3.0)) {
                    if (targetSeek > 0 && (player.readyState >= 1 || (player.duration && isFinite(player.duration)))) {
                        try {
                            player.currentTime = targetSeek;
                            console.log("[Radio Sync] Snapped seek position to second:", targetSeek);
                        } catch(e) {
                            console.warn("[Radio Sync] Seek error:", e);
                        }
                    }
                }

                if (player.paused) {
                    player.play().then(() => {
                        // Enforce seek after play promise resolves (catches browser resets to 0:00)
                        if (targetSeek > 0 && Math.abs((player.currentTime || 0) - targetSeek) > 2.0) {
                            try {
                                player.currentTime = targetSeek;
                                console.log("[Radio Sync] Enforced target seek post-play:", targetSeek);
                            } catch(e) {}
                        }

                        isAudioPlaying = true;
                        window.isAudioPlaying = true;
                        _consecutiveAudioErrors = 0;
                        const playBtnIcon = document.getElementById("global-play-btn");
                        if (playBtnIcon) {
                            playBtnIcon.className = "fa-solid fa-pause play-btn";
                            playBtnIcon.style.color = "";
                        }
                        
                        const radioPlayBtn = document.getElementById("radio-play-btn");
                        if (radioPlayBtn) {
                            radioPlayBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
                            radioPlayBtn.removeAttribute("data-loading");
                        }
                        
                        const playlistPlayBtn = document.getElementById("playlist-play-btn");
                        if (playlistPlayBtn) playlistPlayBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
                        
                        const discIcon = document.getElementById("playlist-disc-icon");
                        if (discIcon) {
                            discIcon.className = "fa-solid fa-compact-disc fa-spin";
                            discIcon.style.animationDuration = "4s";
                        }
                        
                        const wave = document.getElementById("radio-music-wave");
                        if (wave) wave.classList.add("playing");
                        
                        updateActivePlaylistTrackHighlight();
                        if (window.syncRadioPlayButtonState) window.syncRadioPlayButtonState();
                        if (window.joinRadioPresence) window.joinRadioPresence();
                        updateMediaSession(state.title, state.speaker);
                    }).catch(err => {
                        console.error("[Radio Sync] Play error:", err);
                        isAudioPlaying = false;
                        window.isAudioPlaying = false;
                        if (radioPlayBtn) {
                            radioPlayBtn.innerHTML = '<i class="fa-solid fa-play" style="margin-left: 3px;"></i>';
                            radioPlayBtn.removeAttribute("data-loading");
                        }
                        if (globalPlayBtn) {
                            globalPlayBtn.className = "fa-solid fa-play play-btn";
                            globalPlayBtn.style.color = "";
                        }
                        if (playlistPlayBtn) {
                            playlistPlayBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                        }
                        if (window.syncRadioPlayButtonState) window.syncRadioPlayButtonState();
                    });
                } else {
                    isAudioPlaying = true;
                    window.isAudioPlaying = true;
                    if (radioPlayBtn) {
                        radioPlayBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
                        radioPlayBtn.removeAttribute("data-loading");
                    }
                    if (globalPlayBtn) {
                        globalPlayBtn.className = "fa-solid fa-pause play-btn";
                        globalPlayBtn.style.color = "";
                    }
                    if (window.syncRadioPlayButtonState) window.syncRadioPlayButtonState();
                }
            };

            if (!isSameSrc || !player.src) {
                player.src = playUrl;
                player.load();
                let started = false;
                const startPlayback = () => {
                    if (started) return;
                    started = true;
                    player.removeEventListener('loadedmetadata', startPlayback);
                    player.removeEventListener('canplay', startPlayback);
                    applySeekAndPlay(false);
                };
                if (player.readyState >= 1) {
                    startPlayback();
                } else {
                    player.addEventListener('loadedmetadata', startPlayback, { once: true });
                    player.addEventListener('canplay', startPlayback, { once: true });
                    setTimeout(startPlayback, 1000);
                }
            } else {
                // Source already loaded, apply seek and play
                applySeekAndPlay(false);
            }
        });
    } else {
        // UI sync without autoplay
        const playBtnIcon = document.getElementById("global-play-btn");
        if (playBtnIcon && !isAudioPlaying) {
            playBtnIcon.className = "fa-solid fa-play play-btn";
            playBtnIcon.style.color = "";
        }
        
        const radioPlayBtn = document.getElementById("radio-play-btn");
        if (radioPlayBtn && !isAudioPlaying && radioPlayBtn.getAttribute("data-loading") !== "true") {
            radioPlayBtn.innerHTML = '<i class="fa-solid fa-play" style="margin-left: 3px;"></i>';
        }
        
        const playlistPlayBtn = document.getElementById("playlist-play-btn");
        if (playlistPlayBtn && !isAudioPlaying) playlistPlayBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    }
};

// Lockstep 24/7 Virtual Radio Watchdog: ensures ALL devices stay in 100% sync
if (window._radioLockstepWatchdogInterval) {
    clearInterval(window._radioLockstepWatchdogInterval);
}
window._radioLockstepWatchdogInterval = setInterval(() => {
    const player = document.getElementById("global-radio-player");
    if (!player) return;

    // If live stream is active, do not sync virtual radio
    const isLiveOnline = Boolean(window._liveAudioSettings?.audioUrl && window._liveAudioSettings?.audioUrl.trim().length > 0 && window._liveAudioSettings?.isLive !== false);
    if (isLiveOnline) {
        // If live stream is online and player is actively playing 24/7 radio, switch immediately to live stream!
        if ((window.isAudioPlaying || !player.paused) && player.currentPlayingTrackId !== 'live') {
            console.log("[Radio Watchdog] Live stream is online. Transitioning active listener to live sanctuary feed...");
            window.syncPlayerWithGlobalBroadcast(true);
        }
        return;
    }
    if (player.currentPlayingTrackId === 'live' || window.currentPlayingTrackId === 'live') {
        return;
    }

    const computed = window.calculateVirtualRadioPlayback ? window.calculateVirtualRadioPlayback() : null;
    if (!computed || !computed.track) return;

    const expectedTrackId = computed.track.id.toString();

    // 1. If currently playing: check if track has transitioned or if audio has drifted
    if (window.isAudioPlaying && !player.paused) {
        // Check if track needs to change (e.g. track ended or time engine passed boundary)
        if (player.currentPlayingTrackId && player.currentPlayingTrackId !== expectedTrackId) {
            console.log(`[Radio Lockstep] Engine transitioned to track ${expectedTrackId}. Switching smoothly in lockstep...`);
            window.syncPlayerWithGlobalBroadcast(true);
            return;
        }

        // Check drift within the current track
        const currentSec = player.currentTime || 0;
        const targetSec = computed.offset;
        const drift = Math.abs(currentSec - targetSec);

        // If drift exceeds 3.0 seconds, re-snap to lockstep
        if (drift > 3.0) {
            console.log(`[Radio Lockstep] Correcting audio drift of ${drift.toFixed(1)}s (current: ${currentSec.toFixed(1)}s, target: ${targetSec.toFixed(1)}s)`);
            try {
                player.currentTime = targetSec;
            } catch(e) {
                console.warn("[Radio Lockstep] Seek correction failed:", e);
            }
        }
    } else {
        // 2. Not playing: keep preloaded audio track & UI labels in lockstep so pressing Play starts instantly on the exact right track & second
        if (player.currentPlayingTrackId !== expectedTrackId) {
            if (window.preloadRadioAudioInBackground) {
                window.preloadRadioAudioInBackground();
            }
        }
    }
}, 5000);

let _consecutiveAudioErrors = 0;
let _lastAudioErrorTime = 0;

// Wire up global audio elements listeners when page load finished
document.addEventListener("DOMContentLoaded", () => {
    const globalPlayer = document.getElementById("global-radio-player");
    if (globalPlayer) {
        // Time updating listener
        globalPlayer.addEventListener("timeupdate", () => {
            const isLive = currentPlayingTrackId === 'live' || window.currentPlayingTrackId === 'live' || globalPlayer.currentPlayingTrackId === 'live';
            if (isLive) {
                const playlistCur = document.getElementById("playlist-audio-time-current");
                if (playlistCur) playlistCur.textContent = "LIVE";
                
                const radioCur = document.getElementById("radio-audio-time-current");
                if (radioCur) radioCur.textContent = "LIVE";
                
                const playlistSeek = document.getElementById("playlist-audio-seeker-bar");
                const radioSeek = document.getElementById("radio-audio-seeker-bar");
                if (playlistSeek) playlistSeek.style.width = "100%";
                if (radioSeek) radioSeek.style.width = "100%";
                return;
            }

            const formatTime = formatTimeStr(globalPlayer.currentTime);
            
            const playlistCur = document.getElementById("playlist-audio-time-current");
            if (playlistCur) playlistCur.textContent = formatTime;
            
            const radioCur = document.getElementById("radio-audio-time-current");
            if (radioCur) radioCur.textContent = formatTime;
            
            const playlistSeek = document.getElementById("playlist-audio-seeker-bar");
            const radioSeek = document.getElementById("radio-audio-seeker-bar");
            
            if (globalPlayer.duration && !isNaN(globalPlayer.duration) && isFinite(globalPlayer.duration)) {
                const percentage = (globalPlayer.currentTime / globalPlayer.duration) * 100;
                if (playlistSeek) playlistSeek.style.width = `${percentage}%`;
                if (radioSeek) radioSeek.style.width = `${percentage}%`;
            }
        });

        // Loaded metadata listener (updates total duration label & processes deferred seeks)
        globalPlayer.addEventListener("loadedmetadata", () => {
            const isLive = currentPlayingTrackId === 'live' || window.currentPlayingTrackId === 'live' || globalPlayer.currentPlayingTrackId === 'live';
            if (isLive) {
                const playlistTotal = document.getElementById("playlist-audio-time-total");
                if (playlistTotal) playlistTotal.textContent = "ON AIR";
                
                const radioTotal = document.getElementById("radio-audio-time-total");
                if (radioTotal) radioTotal.textContent = "ON AIR";
                delete globalPlayer.pendingSeekTime;
                return;
            }

            const formatDuration = formatTimeStr(globalPlayer.duration);
            
            const playlistTotal = document.getElementById("playlist-audio-time-total");
            if (playlistTotal) playlistTotal.textContent = formatDuration;
            
            const radioTotal = document.getElementById("radio-audio-time-total");
            if (radioTotal) radioTotal.textContent = formatDuration;
            
            // Dynamically write missing or incorrect track durations back to Firestore to perfect the loop math
            const duration = globalPlayer.duration;
            if (duration && !isNaN(duration) && isFinite(duration) && duration > 0) {
                const trackId = globalPlayer.currentPlayingTrackId;
                if (trackId && trackId !== 'live' && trackId !== 'fallback') {
                    const tracks = window._currentRadioTracks || [];
                    const localTrack = tracks.find(t => t.id === trackId);
                    if (localTrack && (!localTrack.duration || Math.abs(localTrack.duration - duration) > 1.5)) {
                        console.log(`[Radio Sync] Auto-updating duration for track ${trackId} in Firestore: ${duration}s`);
                        if (window.updateRadioTrackDuration) {
                            window.updateRadioTrackDuration(trackId, duration);
                        }
                    }
                }
            }

            // Try to process deferred seek (only for virtual radio tracks, never live)
            if (globalPlayer.pendingSeekTime !== undefined && !isLive) {
                const maxDuration = globalPlayer.duration || 999999;
                if (globalPlayer.pendingSeekTime < maxDuration) {
                    globalPlayer.currentTime = globalPlayer.pendingSeekTime;
                    console.log("[Radio Sync] Deferred seek executed on loadedmetadata:", globalPlayer.pendingSeekTime);
                }
            }
        });

        // Canplay listener (HAVE_CURRENT_DATA - ensures seek is respected in all desktop/mobile browsers)
        globalPlayer.addEventListener("canplay", () => {
            const isLive = currentPlayingTrackId === 'live' || window.currentPlayingTrackId === 'live' || globalPlayer.currentPlayingTrackId === 'live';
            if (isLive) {
                delete globalPlayer.pendingSeekTime;
                return;
            }
            if (globalPlayer.pendingSeekTime !== undefined) {
                const maxDuration = globalPlayer.duration || 999999;
                if (globalPlayer.pendingSeekTime < maxDuration) {
                    globalPlayer.currentTime = globalPlayer.pendingSeekTime;
                    console.log("[Radio Sync] Deferred seek executed on canplay:", globalPlayer.pendingSeekTime);
                }
                delete globalPlayer.pendingSeekTime;
            }
        });

        // Audio track ended listener
        globalPlayer.addEventListener("ended", () => {
            handleAudioEnded();
        });

        // Audio track error listener (automatically handles stream blocks or skips broken files)
        globalPlayer.addEventListener("error", (e) => {
            // For live streams: show detailed mixed-content diagnostics or retry
            if (currentPlayingTrackId === 'live' || window.currentPlayingTrackId === 'live' || globalPlayer.currentPlayingTrackId === 'live') {
                console.warn("[Radio] Live stream transient event:", globalPlayer.src);
                return;
            }
            
            // For virtual radio playlist tracks:
            const now = Date.now();
            if (now - _lastAudioErrorTime < 4000) {
                _consecutiveAudioErrors++;
            } else {
                _consecutiveAudioErrors = 1;
            }
            _lastAudioErrorTime = now;

            if (_consecutiveAudioErrors >= 3) {
                console.error("[Radio] Too many consecutive audio errors. Halting playback loop to prevent UI glitching.");
                _consecutiveAudioErrors = 0;
                isAudioPlaying = false;
                globalPlayer.pause();
                if (window.syncRadioPlayButtonState) window.syncRadioPlayButtonState();
                return;
            }

            console.warn("[Radio] Audio track error encountered. Skipping to next track in 2s...", e);
            setTimeout(() => {
                handleAudioEnded();
            }, 2000);
        });

        // Native play event listener (synchronizes all UI play states)
        globalPlayer.addEventListener("play", () => {
            isAudioPlaying = true;
            
            // Ensure bottom audio bar is visible when playing
            const audioBar = document.getElementById("global-audio-bar");
            if (audioBar) audioBar.classList.add("visible");
            
            // Sync bottom bar play icon
            const playBtnIcon = document.getElementById("global-play-btn");
            if (playBtnIcon) playBtnIcon.className = "fa-solid fa-pause play-btn";
            
            // Sync big radio play icon
            const radioPlayBtn = document.getElementById("radio-play-btn");
            if (radioPlayBtn) radioPlayBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
            
            // Sync playlist tab play icon
            const detailPlayBtn = document.getElementById("playlist-play-btn");
            if (detailPlayBtn) detailPlayBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
            
            // Sync music waves bouncing animation
            const wave = document.getElementById("radio-music-wave");
            if (wave) wave.classList.add("playing");

            if (window.updateActivePlaylistTrackHighlight) {
                window.updateActivePlaylistTrackHighlight();
            }

            // Sync presence count - joining active stream listener
            if (window.joinRadioPresence) window.joinRadioPresence();
        });

        // Native pause event listener (synchronizes all UI pause states)
        globalPlayer.addEventListener("pause", () => {
            // Only toggle pause state and reset buttons if the pause was manual (track has NOT naturally ended)
            if (!globalPlayer.ended) {
                isAudioPlaying = false;
                
                // Sync bottom bar play icon
                const playBtnIcon = document.getElementById("global-play-btn");
                if (playBtnIcon) playBtnIcon.className = "fa-solid fa-play play-btn";
                
                // Sync big radio play icon
                const radioPlayBtn = document.getElementById("radio-play-btn");
                if (radioPlayBtn) radioPlayBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                
                // Sync playlist tab play icon
                const detailPlayBtn = document.getElementById("playlist-play-btn");
                if (detailPlayBtn) detailPlayBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                
                // Sync music waves bouncing animation
                const wave = document.getElementById("radio-music-wave");
                if (wave) wave.classList.remove("playing");
    
                if (window.updateActivePlaylistTrackHighlight) {
                    window.updateActivePlaylistTrackHighlight();
                }
    
                // Sync presence count - leaving listener count (paused)
                if (window.leaveRadioPresence) window.leaveRadioPresence();
            }
        });
    }

    // Native unload / tab close presence clean-up
    window.addEventListener("beforeunload", (e) => {
        if (window.leaveRadioPresence) {
            window.leaveRadioPresence();
        }

        // Warn active streaming admin before they close the tab
        const settings = window._currentCarouselSettings;
        const myUid = window.currentUserState?.uid;
        if (settings && myUid) {
            const isStreamingAudio = settings.audioStreamActive && settings.audioBroadcasterUid === myUid;
            const isStreamingVideo = settings.streamUrl && settings.streamUrl.trim().length > 0 && settings.videoBroadcasterUid === myUid;
            if (isStreamingAudio || isStreamingVideo) {
                const warningMsg = "You have an active live broadcast running! Please click 'End Stream' in the Admin Console before leaving to cleanly take the broadcast offline for all viewers.";
                e.preventDefault();
                e.returnValue = warningMsg;
                return warningMsg;
            }
        }
    });

    // App visibility tracking — only leave presence if not playing background audio
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
            // Only leave presence if audio is NOT playing (otherwise keep counted as background listener)
            if (!isAudioPlaying && window.leaveRadioPresence) {
                window.leaveRadioPresence();
            }
        } else {
            // App came back to foreground and audio is playing — make sure presence is active
            if (isAudioPlaying && window.joinRadioPresence) {
                window.joinRadioPresence();
            }
        }
    });

    // Real-time Presence Heartbeat: keep the listener record active in Firestore as long as audio is playing
    setInterval(() => {
        if (isAudioPlaying && window.joinRadioPresence) {
            console.log("[Radio Presence] Heartbeat update...");
            window.joinRadioPresence();
        }
    }, 2 * 60 * 1000); // Heartbeat every 2 minutes (sweeper cleans after 5 minutes of inactivity)
});

// Circular play/pause button state sync
window.syncRadioPlayButtonState = function() {
    const player = document.getElementById("global-radio-player");
    const detailPlayBtn = document.getElementById("radio-play-btn");
    const globalPlayBtn = document.getElementById("global-play-btn");
    const playlistPlayBtn = document.getElementById("playlist-play-btn");
    const wave = document.getElementById("radio-music-wave");
    
    if (!player) return;

    if (detailPlayBtn && detailPlayBtn.getAttribute("data-loading") === "true") return;
    
    const isPaused = player.paused || !isAudioPlaying;
    
    if (detailPlayBtn) {
        detailPlayBtn.innerHTML = isPaused ? '<i class="fa-solid fa-play" style="margin-left: 3px;"></i>' : '<i class="fa-solid fa-pause"></i>';
        detailPlayBtn.removeAttribute("data-loading");
    }
    if (globalPlayBtn) {
        globalPlayBtn.className = isPaused ? 'fa-solid fa-play play-btn' : 'fa-solid fa-pause play-btn';
        globalPlayBtn.style.color = "";
    }
    if (playlistPlayBtn) {
        playlistPlayBtn.innerHTML = isPaused ? '<i class="fa-solid fa-play"></i>' : '<i class="fa-solid fa-pause"></i>';
    }

    if (wave) {
        if (isPaused) {
            wave.classList.remove("playing");
        } else {
            wave.classList.add("playing");
        }
    }
};

window.playPlaylistTrack = async function(trackId, title, speaker) {
    if (!trackId) return;
    const player = document.getElementById("global-radio-player");
    const audioBar = document.getElementById("global-audio-bar");
    if (audioBar) audioBar.classList.add("visible");
    
    const radioTitle = document.getElementById("radio-player-title");
    const radioSpeaker = document.getElementById("radio-player-speaker");
    if (radioTitle) radioTitle.textContent = (title || "").toUpperCase();
    if (radioSpeaker) radioSpeaker.textContent = speaker || "";
    
    const playlistTitle = document.getElementById("playlist-track-title");
    const playlistSpeaker = document.getElementById("playlist-track-speaker");
    if (playlistTitle) playlistTitle.textContent = (title || "").toUpperCase();
    if (playlistSpeaker) playlistSpeaker.textContent = speaker || "";
    
    const currentTitle = document.getElementById("current-track-title");
    const currentSpeaker = document.getElementById("current-track-speaker");
    if (currentTitle) currentTitle.textContent = (title || "").toUpperCase();
    if (currentSpeaker) currentSpeaker.textContent = speaker || "";
    
    const playBtnIcon = document.getElementById("global-play-btn");
    if (playBtnIcon) playBtnIcon.className = "fa-solid fa-spinner fa-spin play-btn";
    const radioPlayBtn = document.getElementById("radio-play-btn");
    if (radioPlayBtn) radioPlayBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="font-size:20px;"></i>';
    
    try {
        const playUrl = await window.resolveTrackAudioUrl(trackId);
        if (playUrl) {
            playAudioStream(playUrl, title, speaker, trackId);
        } else {
            console.error("[Radio] Could not resolve audio URL for track:", trackId);
            isAudioPlaying = false;
            if (window.syncRadioPlayButtonState) window.syncRadioPlayButtonState();
        }
    } catch (e) {
        console.error("[Radio] playPlaylistTrack error:", e);
        isAudioPlaying = false;
        if (window.syncRadioPlayButtonState) window.syncRadioPlayButtonState();
    }
};

// Circular Play/Pause button toggle trigger
window.toggleRadioAudio = function() {
    if (window.toggleSermonAudio) {
        window.toggleSermonAudio();
    }
    setTimeout(window.syncRadioPlayButtonState, 150);
};

// Real-time live presence listener hook
window.startRadioListenerCountPulse = function() {
    // Rely exclusively on real-time Supabase Presence synchronization
    if (window.joinRadioPresence && window.isAudioPlaying) {
        window.joinRadioPresence();
    }
};

// Language Dropdown Selector Custom Toast
window.handleRadioLanguageChange = function(lang) {
    const languages = {
        en: "English/Anglais",
        fr: "French/Français",
        yo: "Yoruba",
        ig: "Igbo",
        ha: "Hausa"
    };
    
    const langName = languages[lang] || "English";
    
    // Remove any existing radio toasts
    document.querySelectorAll(".radio-toast").forEach(t => t.remove());
    
    // Create a beautiful floating toast
    const toast = document.createElement("div");
    toast.className = "radio-toast";
    toast.innerHTML = `<i class="fa-solid fa-language"></i> Switched audio feed to <strong>${langName}</strong>`;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.add("visible");
    }, 50);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove("visible");
        setTimeout(() => toast.remove(), 400);
    }, 3000);
};

// ==========================================================================
// MEDIA VAULT — REAL-TIME ARCHIVE SEARCH ENGINE
// ==========================================================================

// Play sermon video in a beautiful popup modal directly inside the tab
window.playVideoArchive = function(url, title, speaker) {
    url = window.getDirectMediaUrl(url);
    const modal = document.getElementById("video-archive-modal");
    const player = document.getElementById("video-archive-player");
    const titleEl = document.getElementById("video-archive-modal-title");
    const speakerEl = document.getElementById("video-archive-modal-speaker");

    if (!modal || !player) return;

    // Cache played video metadata into persistent recently played list
    if (url) {
        const videoId = url.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
        if (window.addToRecentlyPlayed) {
            window.addToRecentlyPlayed({ id: videoId, title, speaker, type: 'video', url: url });
        }
    }

    // Pause other playing audios/videos to prevent overlapping sound
    if (window.closeAudioBar) window.closeAudioBar();
    const liveVideo = document.getElementById("live-video-player");
    if (liveVideo) liveVideo.pause();

    // Set source and labels
    player.src = url;
    player.load();
    if (titleEl) titleEl.textContent = title.toUpperCase();
    if (speakerEl) speakerEl.innerHTML = `<i class="fa-solid fa-user-tie" style="color: #38bdf8;"></i> ${speaker}`;

    // Show popup modal
    modal.classList.add("active");

    // Attempt autoplay
    player.play().catch(err => {
        console.log("[Video Archive] Autoplay blocked:", err);
    });
};

// Close sermon video popup modal cleanly
window.closeVideoArchiveModal = function() {
    const modal = document.getElementById("video-archive-modal");
    const player = document.getElementById("video-archive-player");

    if (modal) modal.classList.remove("active");
    if (player) {
        player.pause();
        player.src = "";
    }
};

// Render default suggestions (combines uploaded audios and videos sorted by time)
window.renderSearchSuggestions = function() {
    const container = document.getElementById("search-results-container");
    const titleEl = document.getElementById("search-results-title");
    if (!container) return;

    const audios = window._currentRadioTracks || [];
    const videos = window._currentVideoTracks || [];

    const suggestions = [];
    audios.forEach(a => suggestions.push({ type: 'audio', ...a }));
    videos.forEach(v => suggestions.push({ type: 'video', ...v }));

    // Sort: show newest uploaded files first
    suggestions.sort((a, b) => {
        const timeA = a.createdAt ? (a.createdAt.seconds || new Date(a.createdAt).getTime()) : 0;
        const timeB = b.createdAt ? (b.createdAt.seconds || new Date(b.createdAt).getTime()) : 0;
        return timeB - timeA;
    });

    if (suggestions.length === 0) {
        container.innerHTML = `
            <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); border-radius: 12px; padding: 24px; text-align: center; color: #64748b; font-size: 13px; width: 100%;">
                <i class="fa-solid fa-folder-open" style="font-size: 24px; margin-bottom: 8px; display: block; color: #475569;"></i>
                No uploaded sermons or video archives found in the media vault.
            </div>
        `;
        return;
    }

    if (titleEl) titleEl.textContent = "Suggestions";
    renderSearchResultsList(suggestions);
};

// Query search handler inside the main search bar
window.handleMainSearch = function(queryStr) {
    const term = queryStr.trim().toLowerCase();
    const container = document.getElementById("search-results-container");
    const titleEl = document.getElementById("search-results-title");
    if (!container) return;

    if (!term) {
        window.renderSearchSuggestions();
        return;
    }

    const audios = window._currentRadioTracks || [];
    const videos = window._currentVideoTracks || [];

    const combined = [];
    audios.forEach(a => combined.push({ type: 'audio', ...a }));
    videos.forEach(v => combined.push({ type: 'video', ...v }));

    const filtered = combined.filter(item =>
        (item.title && item.title.toLowerCase().includes(term)) ||
        (item.speaker && item.speaker.toLowerCase().includes(term))
    );

    if (titleEl) titleEl.textContent = `Search Results (${filtered.length})`;

    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); border-radius: 12px; padding: 24px; text-align: center; color: #64748b; font-size: 13px; width: 100%;">
                <i class="fa-solid fa-circle-exclamation" style="font-size: 24px; margin-bottom: 8px; display: block; color: #475569;"></i>
                No matching sermons or videos found for "${queryStr}".
            </div>
        `;
        return;
    }

    renderSearchResultsList(filtered);
};

// Result items card list builder
function renderSearchResultsList(items) {
    const container = document.getElementById("search-results-container");
    if (!container) return;

    container.innerHTML = items.map(item => {
        const isAudio = item.type === 'audio';
        const typeLabel = isAudio ? 'Audio' : 'Video';
        const typeColor = isAudio ? '#a855f7' : '#ef4444';
        const iconClass = isAudio ? 'fa-microphone' : 'fa-video';

        const titleEscaped = escapedString(item.title || "Untitled Sermon");
        const speakerEscaped = escapedString(item.speaker || "Guest Preacher");

        const clickHandler = isAudio ?
            `window.playAudioStream('${escapedString(item.audio_url || item.audioUrl)}', '${titleEscaped}', '${speakerEscaped}', '${item.id}')` :
            `window.playVideoArchive('${escapedString(item.video_url || item.videoUrl)}', '${titleEscaped}', '${speakerEscaped}')`;

        return `
            <div class="search-result-item search-result-card" onclick="${clickHandler}" style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 12px; background-color: rgba(13, 30, 49, 0.45); border: 1px solid rgba(255, 255, 255, 0.03); cursor: pointer; transition: all 0.2s;">
                <div style="width: 34px; height: 34px; background: rgba(${isAudio ? '168,85,247' : '239,68,68'}, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: ${typeColor}; border: 1px solid rgba(${isAudio ? '168,85,247' : '239,68,68'}, 0.25); flex-shrink: 0;">
                    <i class="fa-solid ${iconClass}" style="font-size: 13px;"></i>
                </div>
                <div style="flex: 1; overflow: hidden; min-width: 0;">
                    <span style="font-size: 13px; font-weight: 700; color: #ffffff; display: block; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${item.title}</span>
                    <span style="font-size: 10px; color: #94a3b8; display: block; margin-top: 2px;">${item.speaker}</span>
                </div>
                <div style="font-size: 9.5px; font-weight: 700; color: ${typeColor}; background: rgba(${isAudio ? '168,85,247' : '239,68,68'}, 0.1); border: 1px solid rgba(${isAudio ? '168,85,247' : '239,68,68'}, 0.2); border-radius: 20px; padding: 3px 8px; flex-shrink: 0; text-transform: uppercase; letter-spacing: 0.5px;">${typeLabel}</div>
            </div>
        `;
    }).join('');
}

// Mini string escaping helper to prevent quotes breaks inside tags
function escapedString(str) {
    if (!str) return "";
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// ==========================================================================
// DCLM OSUN 2 MEDIA & RESOURCE LIBRARY — CORE BUSINESS LOGIC
// ==========================================================================
window._currentLibraryTabMode = 'audio'; // default tab
window._librarySearchQuery = '';

// Switch between library sub-tabs
window.switchLibrarySubTab = function(mode) {
    window._currentLibraryTabMode = mode;
    
    // Toggle active classes on tab buttons
    document.querySelectorAll("#library-view .role-tab").forEach(tab => {
        tab.classList.remove("active");
    });
    
    const activeTabBtn = document.getElementById(`lib-tab-${mode}`);
    if (activeTabBtn) activeTabBtn.classList.add("active");
    
    // Reset search query input on switch
    const searchInput = document.getElementById("library-search-input");
    if (searchInput) {
        searchInput.value = "";
    }
    window._librarySearchQuery = "";
    
    window.renderLibraryTab();
};

// Render results in library tab based on active category and optional search query
window.renderLibraryTab = function() {
    const container = document.getElementById("library-results-container");
    if (!container) return;
    
    const mode = window._currentLibraryTabMode;
    const queryStr = (window._librarySearchQuery || "").trim().toLowerCase();
    
    let items = [];
    
    if (mode === 'audio') {
        items = window._currentRadioTracks || [];
    } else if (mode === 'video') {
        items = window._currentVideoTracks || [];
    } else if (mode === 'outline') {
        items = window._currentLibraryOutlines || [];
    }
    
    // Apply search filter if query is present
    if (queryStr) {
        items = items.filter(item => 
            (item.title && item.title.toLowerCase().includes(queryStr)) ||
            (item.speaker && item.speaker.toLowerCase().includes(queryStr)) ||
            (item.author && item.author.toLowerCase().includes(queryStr))
        );
    }
    
    if (items.length === 0) {
        let msg = "No audio sermons found in the library.";
        let icon = "fa-microphone";
        if (mode === 'video') {
            msg = "No video sermons found in the archives.";
            icon = "fa-video";
        } else if (mode === 'outline') {
            msg = "No study outlines or booklets uploaded yet.";
            icon = "fa-file-pdf";
        }
        
        if (queryStr) {
            msg = `No matching resource found for "${window._librarySearchQuery}".`;
            icon = "fa-circle-exclamation";
        }
        
        container.innerHTML = `
            <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); border-radius: 12px; padding: 24px; text-align: center; color: #64748b; font-size: 13px; width: 100%;">
                <i class="fa-solid ${icon}" style="font-size: 24px; margin-bottom: 8px; display: block; color: #475569;"></i>
                ${msg}
            </div>
        `;
        return;
    }
    
    container.innerHTML = items.map(item => {
        const titleEscaped = escapedString(item.title || "Untitled Resource");
        
        if (mode === 'audio') {
            const speakerEscaped = escapedString(item.speaker || "Guest Speaker");
            const audioSrc = escapedString(item.audio_url || item.audioUrl || "");
            return `
                <div class="search-result-item search-result-card" onclick="window.playAudioStream('${audioSrc}', '${titleEscaped}', '${speakerEscaped}', '${item.id}')" style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 12px; background-color: rgba(13, 30, 49, 0.45); border: 1px solid rgba(255, 255, 255, 0.03); cursor: pointer; transition: all 0.2s;">
                    <div style="width: 34px; height: 34px; background: rgba(168, 85, 247, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #a855f7; border: 1px solid rgba(168, 85, 247, 0.25); flex-shrink: 0;">
                        <i class="fa-solid fa-microphone" style="font-size: 13px;"></i>
                    </div>
                    <div style="flex: 1; overflow: hidden; min-width: 0;">
                        <span style="font-size: 13px; font-weight: 700; color: #ffffff; display: block; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${item.title}</span>
                        <span style="font-size: 10px; color: #94a3b8; display: block; margin-top: 2px;">${item.speaker}</span>
                    </div>
                    <div style="font-size: 9.5px; font-weight: 700; color: #a855f7; background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.25); border-radius: 20px; padding: 3px 8px; flex-shrink: 0; text-transform: uppercase; letter-spacing: 0.5px;">Play Audio</div>
                </div>
            `;
        } else if (mode === 'video') {
            const speakerEscaped = escapedString(item.speaker || "Guest Preacher");
            const videoSrc = escapedString(item.video_url || item.videoUrl || "");
            return `
                <div class="search-result-item search-result-card" onclick="window.playVideoArchive('${videoSrc}', '${titleEscaped}', '${speakerEscaped}')" style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 12px; background-color: rgba(13, 30, 49, 0.45); border: 1px solid rgba(255, 255, 255, 0.03); cursor: pointer; transition: all 0.2s;">
                    <div style="width: 34px; height: 34px; background: rgba(239, 68, 68, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.25); flex-shrink: 0;">
                        <i class="fa-solid fa-video" style="font-size: 13px;"></i>
                    </div>
                    <div style="flex: 1; overflow: hidden; min-width: 0;">
                        <span style="font-size: 13px; font-weight: 700; color: #ffffff; display: block; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${item.title}</span>
                        <span style="font-size: 10px; color: #94a3b8; display: block; margin-top: 2px;">${item.speaker}</span>
                    </div>
                    <div style="font-size: 9.5px; font-weight: 700; color: #ef4444; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 20px; padding: 3px 8px; flex-shrink: 0; text-transform: uppercase; letter-spacing: 0.5px;">Watch</div>
                </div>
            `;
        } else if (mode === 'outline') {
            const authorEscaped = escapedString(item.author || "DCLM Pulpit");
            const outlineSrc = escapedString(item.content || item.outline_url || item.outlineUrl || "");
            return `
                <div class="search-result-item search-result-card" onclick="window.openOutlineResource('${outlineSrc}', '${titleEscaped}', '${authorEscaped}')" style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 12px; background-color: rgba(13, 30, 49, 0.45); border: 1px solid rgba(255, 255, 255, 0.03); cursor: pointer; transition: all 0.2s;">
                    <div style="width: 34px; height: 34px; background: rgba(56, 189, 248, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.25); flex-shrink: 0;">
                        <i class="fa-solid fa-file-pdf" style="font-size: 13px;"></i>
                    </div>
                    <div style="flex: 1; overflow: hidden; min-width: 0;">
                        <span style="font-size: 13px; font-weight: 700; color: #ffffff; display: block; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${item.title}</span>
                        <span style="font-size: 10px; color: #94a3b8; display: block; margin-top: 2px;">By ${item.author || 'DCLM Pulpit'}</span>
                    </div>
                    <div style="font-size: 9.5px; font-weight: 700; color: #38bdf8; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 20px; padding: 3px 8px; flex-shrink: 0; text-transform: uppercase; letter-spacing: 0.5px;">Study</div>
                </div>
            `;
        }
    }).join('');
};

// Search outlines, sermons, or topics within active category
window.handleLibrarySearch = function(queryStr) {
    window._librarySearchQuery = queryStr;
    window.renderLibraryTab();
};

// Open the study outline modal player cleanly
window.openOutlineResource = function(url, title, author) {
    const modal = document.getElementById("outline-viewer-modal");
    const titleEl = document.getElementById("outline-modal-title");
    const authorEl = document.getElementById("outline-modal-author");
    const readBtn = document.getElementById("outline-modal-read-btn");
    const downloadBtn = document.getElementById("outline-modal-download-btn");

    if (!modal) return;

    // Cache played outline metadata into persistent recently played list
    if (url) {
        const outlineId = url.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
        if (window.addToRecentlyPlayed) {
            window.addToRecentlyPlayed({ id: outlineId, title, speaker: author, type: 'outline', url: url });
        }
    }

    if (titleEl) titleEl.textContent = title.toUpperCase();
    if (authorEl) authorEl.innerHTML = `<i class="fa-solid fa-user-tie" style="color: #38bdf8;"></i> ${author}`;

    // Configure link URLs
    if (readBtn) readBtn.href = url;
    if (downloadBtn) {
        downloadBtn.href = url;
        // set dynamic file download name matching outlines
        downloadBtn.download = `${title.replace(/\s+/g, '_')}_Outline.pdf`;
    }

    modal.classList.add("active");
};

// Close outlines modal cleanly
window.closeOutlineViewerModal = function() {
    const modal = document.getElementById("outline-viewer-modal");
    if (modal) modal.classList.remove("active");
};

// ==========================================================================
// PERSISTENT PLAYLIST — RECENTLY PLAYED sermon caching logic
// ==========================================================================
window._recentlyPlayedMedia = [];
try {
    const raw = localStorage.getItem("dclm_recently_played");
    if (raw) {
        window._recentlyPlayedMedia = JSON.parse(raw);
    }
} catch (e) {
    console.warn("[Playlist] Error loading recently played list:", e);
}

// Add an item to the recently played array and persist in localStorage
window.addToRecentlyPlayed = function(item) {
    if (!item || !item.id || !item.type) return;
    
    const cleanedItem = {
        id: item.id,
        title: item.title || "Untitled Resource",
        speaker: item.speaker || "Guest Preacher",
        type: item.type, // 'audio' | 'video' | 'outline'
        url: item.url || "",
        timestamp: Date.now()
    };
    
    let history = window._recentlyPlayedMedia || [];
    
    // De-duplicate: filter out previous occurrence
    history = history.filter(h => h.id !== cleanedItem.id);
    
    // Add to top
    history.unshift(cleanedItem);
    
    // Limit history to 10 entries
    if (history.length > 10) {
        history = history.slice(0, 10);
    }
    
    window._recentlyPlayedMedia = history;
    
    try {
        localStorage.setItem("dclm_recently_played", JSON.stringify(history));
    } catch (e) {
        console.warn("[Playlist] Error saving recently played list:", e);
    }
    
    // Refresh the view if it is present
    window.refreshRecentlyPlayedUI();
    if (window.renderFellowshipPlaylist) window.renderFellowshipPlaylist();
};

// Render active radio playlist tracks in the Playlist tab
window.renderFellowshipPlaylist = function(tracks) {
    const listEl = document.getElementById("fellowship-active-playlist-list");
    if (!listEl) return;
    
    tracks = (tracks && tracks.length > 0) ? tracks : ((window._currentRadioTracks && window._currentRadioTracks.length > 0) ? window._currentRadioTracks : window._defaultRadioTracks);
    if (!tracks || tracks.length === 0) {
        listEl.innerHTML = `
            <div style="background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; text-align: center; color: #64748b; font-size: 12px;">
                <i class="fa-solid fa-music" style="font-size: 20px; margin-bottom: 6px; display: block; color: #475569;"></i>
                No audio tracks currently in the radio playlist.
            </div>
        `;
        return;
    }
    
    listEl.innerHTML = tracks.map(t => {
        const titleEscaped = escapedString(t.title || "Untitled Song");
        const speakerEscaped = escapedString(t.speaker || "DCLM Choir");
        const audioSrc = escapedString(t.audio_url || t.audioUrl || "");
        const durationStr = t.duration ? `${Math.floor(t.duration / 60)}:${(t.duration % 60).toString().padStart(2, '0')}` : '';
        const isCurrent = (t.id && (t.id.toString() === window.currentPlayingTrackId?.toString())) && isAudioPlaying;
        
        return `
            <div id="radio-track-${t.id}" class="radio-track-item search-result-card ${isCurrent ? 'active' : ''}" onclick="window.playPlaylistTrack('${t.id}', '${titleEscaped}', '${speakerEscaped}')" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; border-radius: 12px; background-color: rgba(13, 30, 49, 0.45); border: 1px solid rgba(255, 255, 255, 0.03); cursor: pointer; transition: all 0.2s;">
                <div style="display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1;">
                    <div class="track-play-indicator" style="width: 32px; height: 32px; background: rgba(168, 85, 247, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #a855f7; border: 1px solid rgba(168, 85, 247, 0.25); flex-shrink: 0;">
                        ${isCurrent ? '<i class="fa-solid fa-volume-high fa-beat-fade" style="color: #a855f7;"></i>' : '<i class="fa-solid fa-circle-play"></i>'}
                    </div>
                    <div style="overflow: hidden; min-width: 0; flex: 1;">
                        <span class="track-title" style="font-size: 13px; font-weight: 700; color: #ffffff; display: block; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${t.title}</span>
                        <span class="track-speaker" style="font-size: 10.5px; color: #94a3b8; display: block; margin-top: 2px;">${t.speaker}</span>
                    </div>
                </div>
                ${durationStr ? `<span style="font-size: 11px; font-weight: 700; color: #64748b; font-family: monospace;">${durationStr}</span>` : ''}
            </div>
        `;
    }).join('');
};

try {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => window.renderFellowshipPlaylist());
    } else {
        window.renderFellowshipPlaylist();
    }
} catch(e) {}

// Populate the recently played items list inside Playlist tab
window.refreshRecentlyPlayedUI = function() {
    const container = document.getElementById("radio-recently-played-list");
    if (!container) return;
    
    // Filter history to display only audio or video items
    const history = (window._recentlyPlayedMedia || []).filter(item => item.type === 'audio' || item.type === 'video');
    
    if (history.length === 0) {
        container.innerHTML = `
            <div style="background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.05); border-radius: 16px; padding: 36px 20px; text-align: center; color: #64748b; font-size: 12.5px; width: 100%;">
                <i class="fa-solid fa-clock-rotate-left" style="font-size: 32px; margin-bottom: 12px; display: block; color: #475569;"></i>
                Your fellowship playlist is currently empty. Listen to an audio sermon or watch a video archive to add it here!
            </div>
        `;
        return;
    }
    
    container.innerHTML = history.map(item => {
        const isAudio = item.type === 'audio';
        const isVideo = item.type === 'video';
        
        let iconClass = 'fa-microphone';
        let typeColor = '#a855f7';
        let actionLabel = 'Listen Again';
        let cardBorderColor = 'rgba(168, 85, 247, 0.15)';
        
        if (isVideo) {
            iconClass = 'fa-video';
            typeColor = '#ef4444';
            actionLabel = 'Watch Again';
            cardBorderColor = 'rgba(239, 68, 68, 0.15)';
        }
        
        const titleEscaped = escapedString(item.title);
        const speakerEscaped = escapedString(item.speaker);
        
        let clickHandler = '';
        if (isAudio) {
            clickHandler = `window.playAudioStream('${escapedString(item.url)}', '${titleEscaped}', '${speakerEscaped}', '${item.id}')`;
        } else if (isVideo) {
            clickHandler = `window.playVideoArchive('${escapedString(item.url)}', '${titleEscaped}', '${speakerEscaped}')`;
        }
        
        return `
            <div class="search-result-item search-result-card" onclick="${clickHandler}" style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 12px; background-color: rgba(13, 30, 49, 0.45); border: 1px solid ${cardBorderColor}; cursor: pointer; transition: all 0.2s;">
                <div style="width: 32px; height: 32px; background: rgba(${isAudio ? '168,85,247' : '239,68,68'}, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: ${typeColor}; border: 1px solid rgba(${isAudio ? '168,85,247' : '239,68,68'}, 0.25); flex-shrink: 0;">
                    <i class="fa-solid ${iconClass}" style="font-size: 12px;"></i>
                </div>
                <div style="flex: 1; overflow: hidden; min-width: 0;">
                    <span style="font-size: 12.5px; font-weight: 700; color: #ffffff; display: block; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${item.title}</span>
                    <span style="font-size: 10px; color: #94a3b8; display: block; margin-top: 2px;">${item.speaker}</span>
                </div>
                <div style="font-size: 9px; font-weight: 700; color: ${typeColor}; background: rgba(${isAudio ? '168,85,247' : '239,68,68'}, 0.1); border: 1px solid rgba(${isAudio ? '168,85,247' : '239,68,68'}, 0.2); border-radius: 20px; padding: 3px 8px; flex-shrink: 0; text-transform: uppercase; letter-spacing: 0.5px;">${actionLabel}</div>
            </div>
        `;
    }).join('');
};

// Expose all functions globally
window.setAuthRole = setAuthRole;
window.switchTab = switchTab;
window.handleGridClick = handleGridClick;
window.playAudioStream = playAudioStream;
window.closeAudioBar = closeAudioBar;
window.toggleSermonAudio = toggleSermonAudio;
window.openGivingModal = () => {
    if (!window.currentUserState.isLoggedIn) {
        window.showGatedAccessModal('giving');
        return;
    }
    document.getElementById("giving-modal").classList.add("active");
    if (window.refreshClientGivingTimeline) {
        window.refreshClientGivingTimeline();
    }
};
window.closeGivingModal = () => {
    document.getElementById("giving-modal").classList.remove("active");
};

window.addGivingPreset = function(amt) {
    const input = document.getElementById("giving-amount-input");
    if (!input) return;
    let currentVal = parseInt(input.value) || 0;
    input.value = currentVal + amt;
    
    const charge = document.getElementById("checkout-charge-amount");
    if (charge) {
        charge.textContent = "₦" + (currentVal + amt).toLocaleString();
    }
};

window.openSimulatedCheckout = function() {
    const amountInput = document.getElementById("giving-amount-input");
    const amount = parseInt(amountInput ? amountInput.value : 0) || 0;
    if (amount < 100) {
        alert("Minimum contribution amount is ₦100.");
        return;
    }

    const chargeAmount = document.getElementById("checkout-charge-amount");
    if (chargeAmount) {
        chargeAmount.textContent = "₦" + amount.toLocaleString();
    }

    document.getElementById("giving-form-screen").style.display = "none";
    document.getElementById("giving-checkout-screen").style.display = "flex";
    document.getElementById("giving-success-screen").style.display = "none";
    
    window.switchGivingPayTab('card');
};

window.backToGivingForm = function() {
    document.getElementById("giving-form-screen").style.display = "flex";
    document.getElementById("giving-checkout-screen").style.display = "none";
};

window.resetGivingModalFlow = function() {
    const amountInput = document.getElementById("giving-amount-input");
    if (amountInput) amountInput.value = "1000";
    
    document.getElementById("giving-form-screen").style.display = "flex";
    document.getElementById("giving-checkout-screen").style.display = "none";
    document.getElementById("giving-success-screen").style.display = "none";
    
    window.closeGivingModal();
};

window.switchGivingPayTab = function(tabId) {
    const tabs = ['card', 'transfer', 'ussd'];
    tabs.forEach(t => {
        const btn = document.getElementById(`pay-tab-${t}-btn`);
        const view = document.getElementById(`pay-subview-${t}`);
        if (btn && view) {
            if (t === tabId) {
                btn.classList.add('active');
                view.style.display = t === 'transfer' ? 'flex' : 'block';
            } else {
                btn.classList.remove('active');
                view.style.display = 'none';
            }
        }
    });
    
    if (tabId === 'ussd') {
        window.updateUssdDialString();
    }
};

window.updateUssdDialString = function() {
    const bankSelect = document.getElementById("pay-ussd-bank-select");
    const bank = bankSelect ? bankSelect.value : "GTBank";
    const amountInput = document.getElementById("giving-amount-input");
    const amount = parseInt(amountInput ? amountInput.value : 0) || 0;
    
    let code = "*737*22*" + amount + "#";
    if (bank === "Zenith") {
        code = "*966*3*" + amount + "#";
    } else if (bank === "Access") {
        code = "*901*2*" + amount + "#";
    } else if (bank === "UBA") {
        code = "*919*3*" + amount + "#";
    }
    
    const display = document.getElementById("pay-ussd-code-display");
    if (display) {
        display.textContent = code;
    }
};

window.escapedString = escapedString;

// Toggle Account Profile Details Modals
window.toggleAccountBasicDetails = function(show) {
    if (show && !window.currentUserState.isLoggedIn) {
        window.showGatedAccessModal('basic_details');
        return;
    }
    const modal = document.getElementById("basic-details-modal");
    if (!modal) return;

    if (show) {
        // Populate profile details from window.currentUserState
        const state = window.currentUserState || {};
        
        const pic = document.getElementById("details-profile-pic");
        const role = document.getElementById("details-user-role");
        const fname = document.getElementById("details-firstname");
        const lname = document.getElementById("details-lastname");
        const phone = document.getElementById("details-phone");
        const region = document.getElementById("details-region");
        const group = document.getElementById("details-group");

        if (pic) pic.src = state.profileImage || "https://cdn-icons-png.flaticon.com/512/1144/1144760.png";
        if (role) {
            role.textContent = state.isAdmin ? "System Administrator" : "Church Member";
            role.style.backgroundColor = state.isAdmin ? "rgba(248, 113, 113, 0.15)" : "rgba(56, 239, 125, 0.15)";
            role.style.color = state.isAdmin ? "#f87171" : "#38ef7d";
        }
        if (fname) fname.textContent = state.firstName || "Guest";
        if (lname) lname.textContent = state.lastName || "User";
        if (phone) phone.textContent = state.phone || "N/A";
        if (region) region.textContent = state.region || "Osun II";
        if (group) group.textContent = state.group || "Group B";

        modal.classList.add("active");
    } else {
        modal.classList.remove("active");
    }
};

window.toggleAccountPrivacyPolicy = function(show) {
    const modal = document.getElementById("privacy-policy-modal");
    if (modal) {
        if (show) modal.classList.add("active");
        else modal.classList.remove("active");
    }
};

window.toggleAccountTerms = function(show) {
    const modal = document.getElementById("terms-conditions-modal");
    if (modal) {
        if (show) modal.classList.add("active");
        else modal.classList.remove("active");
    }
};

window.toggleAccountContactUs = function(show) {
    const modal = document.getElementById("contact-us-modal");
    if (modal) {
        if (show) {
            modal.classList.add("active");
            const txt = document.getElementById("support-message-text");
            if (txt) txt.value = "";
        } else {
            modal.classList.remove("active");
        }
    }
};

// Support message submission handled in firebase-config.js

// ============================================================
// LIVE CHAT FLOATING EMOJI REACTION EFFECTS
// ============================================================

// Toggles the visibility of the absolute-positioned chat reaction drawer
window.toggleReactionTray = function(show) {
    const tray = document.getElementById("chat-reaction-tray");
    if (!tray) return;
    if (typeof show === 'boolean') {
        tray.style.display = show ? 'flex' : 'none';
    } else {
        tray.style.display = (tray.style.display === 'none' || tray.style.display === '') ? 'flex' : 'none';
    }
};

// Spawns a floating emoji animation particle within the live chat card container
window.spawnFloatingEmoji = function(emoji, isLocal = true) {
    const chatCard = document.querySelector(".live-chat-card");
    if (!chatCard) return;

    const span = document.createElement("span");
    span.className = "floating-emoji-particle";
    span.textContent = emoji;

    // Sinusoidal swaying custom parameters
    const sway1 = (Math.random() * 40 - 20).toFixed(1); // -20px to 20px sway at 10%
    const sway2 = (Math.random() * 80 - 40).toFixed(1); // -40px to 40px sway at 45%
    const sway3 = (Math.random() * 120 - 60).toFixed(1); // -60px to 60px sway at 100%

    span.style.setProperty("--sway-x-1", `${sway1}px`);
    span.style.setProperty("--sway-x-2", `${sway2}px`);
    span.style.setProperty("--sway-x-3", `${sway3}px`);

    // Add randomized right-side offset so emojis don't stack on top of each other exactly
    const offsetRight = Math.floor(Math.random() * 35) + 15; // 15px to 50px
    span.style.right = `${offsetRight}px`;

    chatCard.appendChild(span);

    // Dynamic garbage collection of animated elements from the DOM after 1800ms
    setTimeout(() => {
        span.remove();
    }, 1800);
};

// ============================================================
// GUEST MODE ACCESS CONTROLLER (GATED PREMIUM PROMOS)
// ============================================================
window.showGatedAccessModal = function(featureKey) {
    const modal = document.getElementById("gated-access-modal");
    if (!modal) return;

    const titleEl = document.getElementById("gated-modal-title");
    const descEl = document.getElementById("gated-modal-desc");

    let titleText = "Premium Feature Access";
    let descText = "Before you can access this premium fellowship feature, you need to sign up or log in.";

    if (featureKey === 'library') {
        titleText = "Library Access Gated";
        descText = "Sign up to explore our comprehensive media vault archives, including full audio sermon tapes, video broadcasts, and study outline PDFs.";
    } else if (featureKey === 'playlist') {
        titleText = "Playlist Access Gated";
        descText = "Sign up to unlock your personal Fellowship Playlist queue and easily save your recently played audio and video archives.";
    } else if (featureKey === 'giving') {
        titleText = "Giving Portal Access Gated";
        descText = "Sign up to securely access the DCLM OSUN 2 Giving Portal, submit your tithe contributions, or plant a fellowship seed.";
    } else if (featureKey === 'basic_details') {
        titleText = "Profile Details Protected";
        descText = "Sign up or log in to create your personal profile and view your church region, cell fellowship details, and contact card.";
    } else if (featureKey === 'departments') {
        titleText = "Workforce Portal Protected";
        descText = "Sign up or log in to explore DCLM Osun II Workforce Departments, view duties/expectations, and submit service membership applications.";
    }

    if (titleEl) titleEl.textContent = titleText;
    if (descEl) descEl.textContent = descText;

    modal.classList.add("active");
};

window.closeGatedAccessModal = function() {
    const modal = document.getElementById("gated-access-modal");
    if (modal) modal.classList.remove("active");
};

window.triggerGatedAuth = function() {
    window.closeGatedAccessModal();
    if (window.showAuthOverlay) {
        window.showAuthOverlay();
    }
};

// ============================================================
// WORKFORCE CLIENT VIEWS, MODALS & SEARCH CONTROLLERS
// ============================================================
window.handleDepartmentsSearch = function(query) {
    const q = (query || "").trim().toLowerCase();
    const cards = document.querySelectorAll(".dept-card-wrapper");
    cards.forEach(card => {
        const name = (card.dataset.name || "").toLowerCase();
        const desc = (card.dataset.desc || "").toLowerCase();
        if (name.includes(q) || desc.includes(q)) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
};

window.openDeptDetailsModal = function(deptId) {
    const dept = (window._cachedDepartments || []).find(d => d.id === deptId);
    if (!dept) return;
    
    const titleEl = document.getElementById("dept-detail-title");
    const bodyEl = document.getElementById("dept-detail-body");
    const footerEl = document.getElementById("dept-detail-footer");
    
    if (titleEl) {
        titleEl.innerHTML = `<i class="fa-solid ${dept.icon || 'fa-people-group'}" style="color: #38ef7d; margin-right: 6px;"></i> ${dept.name}`;
    }
    
    if (bodyEl) {
        const dutiesHtml = (dept.duties || []).map(d => `<li style="margin-left: 14px; margin-bottom: 4px;">${d}</li>`).join('');
        const announcHtml = dept.announcements ? `
            <div style="background: rgba(56, 239, 125, 0.05); border: 1px solid rgba(56, 239, 125, 0.15); border-radius: 12px; padding: 12px; margin-top: 8px;">
                <h4 style="color: #38ef7d; font-weight: 700; margin: 0 0 4px 0; font-size: 11.5px; text-transform: uppercase;"><i class="fa-solid fa-bullhorn"></i> Department Announcement</h4>
                <p style="margin: 0; font-size: 11.5px; color: #cbd5e1;">${dept.announcements}</p>
            </div>
        ` : '';
        
        bodyEl.innerHTML = `
            <p style="margin: 0 0 6px 0; font-style: italic; color: #94a3b8;">${dept.description || ''}</p>
            
            <div style="display: flex; flex-direction: column; gap: 4px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 12px;">
                <p style="margin: 0;"><strong><i class="fa-solid fa-user-tie" style="color: #38bdf8; margin-right: 4px;"></i> Department Head:</strong> ${dept.leaderName || 'To Be Appointed'}</p>
                <p style="margin: 4px 0 0 0;"><strong><i class="fa-solid fa-clock" style="color: #fb923c; margin-right: 4px;"></i> Weekly Meetings:</strong> ${dept.meetingSchedule || 'Saturdays @ 5:00 PM'}</p>
            </div>
            
            <div style="margin-top: 4px;">
                <h4 style="margin: 0 0 6px 0; color: #ffffff; font-weight: 700;">Duties & Core Expectations:</h4>
                <ul style="margin: 0; padding: 0; list-style-type: square; color: #cbd5e1; font-size: 12px;">
                    ${dutiesHtml || '<li style="margin-left: 14px;">Serve faithfully according to scriptural guidelines.</li>'}
                </ul>
            </div>
            
            ${announcHtml}
        `;
    }
    
    // Bind Apply Button click
    const joinBtn = document.getElementById("dept-detail-join-btn");
    if (joinBtn) {
        const app = (window._cachedApplications || []).find(a => a.departmentId === deptId);
        if (app) {
            joinBtn.disabled = true;
            joinBtn.style.background = "#475569";
            joinBtn.innerHTML = `<i class="fa-solid fa-clock-rotate-left"></i> Application Status: ${app.status.toUpperCase()}`;
        } else {
            const otherApp = (window._cachedApplications || []).find(a => a.departmentId !== deptId);
            if (otherApp) {
                joinBtn.disabled = true;
                joinBtn.style.background = "#475569";
                joinBtn.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Limited to 1 Unit (${otherApp.departmentName})`;
            } else {
                joinBtn.disabled = false;
                joinBtn.style.background = "linear-gradient(135deg, #38ef7d, #11998e)";
                joinBtn.innerHTML = `<i class="fa-solid fa-user-plus"></i> Apply to Join Department`;
                joinBtn.onclick = function() {
                    window.closeDeptDetailsModal();
                    window.openDeptApplyModal(dept.id, dept.name);
                };
            }
        }
    }
    
    const modal = document.getElementById("dept-details-modal");
    if (modal) modal.classList.add("active");
};

window.closeDeptDetailsModal = function() {
    const modal = document.getElementById("dept-details-modal");
    if (modal) modal.classList.remove("active");
};

window.openDeptApplyModal = function(deptId, deptName) {
    const deptIdInput = document.getElementById("apply-dept-id");
    const deptNameInput = document.getElementById("apply-dept-name");
    const labelEl = document.getElementById("apply-dept-label");
    
    if (deptIdInput) deptIdInput.value = deptId;
    if (deptNameInput) deptNameInput.value = deptName;
    if (labelEl) labelEl.textContent = deptName;
    
    // Reset form inputs
    const form = document.getElementById("dept-apply-form");
    if (form) form.reset();
    
    const modal = document.getElementById("dept-apply-modal");
    if (modal) modal.classList.add("active");
};

window.closeDeptApplyModal = function() {
    const modal = document.getElementById("dept-apply-modal");
    if (modal) modal.classList.remove("active");
};

// ============================================================
// CELL LOCATOR CLIENT SEARCH CONTROLLER
// ============================================================
window.handleCellsSearch = function(query) {
    const q = (query || "").trim().toLowerCase();
    const cards = document.querySelectorAll(".cell-card-wrapper");
    cards.forEach(card => {
        const name = (card.dataset.name || "").toLowerCase();
        const address = (card.dataset.address || "").toLowerCase();
        const region = (card.dataset.region || "").toLowerCase();
        if (name.includes(q) || address.includes(q) || region.includes(q)) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
};