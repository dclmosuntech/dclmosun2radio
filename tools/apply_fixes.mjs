import fs from 'fs';

// ── 1. Update supabase-config.js ──
console.log('1. Updating supabase-config.js...');
let sc = fs.readFileSync('supabase-config.js', 'utf8');

// Replace isLiveStreamUrl
const oldIsLive = `function isLiveStreamUrl(url, trackId) {
    if (trackId === 'live' || window.currentPlayingTrackId === 'live') return true;
    if (!url || typeof url !== 'string') return false;
    const lower = url.toLowerCase();
    return lower.includes('/live') || lower.includes('lhr.life') || lower.includes(':8001') || lower.includes('icecast') || lower.includes('butt') || lower.includes('zeno.fm') || lower.includes('.m3u8');
}`;

const newIsLive = `function isLiveStreamUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const lower = url.toLowerCase();
    return lower.includes('/live') || lower.includes('lhr.life') || lower.includes(':8001') || lower.includes(':8000') || lower.includes('icecast') || lower.includes('butt') || lower.includes('zeno.fm') || lower.includes('.m3u8') || lower.includes('trycloudflare.com') || lower.includes('cloudflare');
}`;

if (sc.includes(oldIsLive)) {
    sc = sc.replace(oldIsLive, newIsLive);
    console.log('  ✅ Replaced isLiveStreamUrl');
} else {
    console.log('  ⚠️ oldIsLive not found as exact match, doing normalized replace...');
    sc = sc.replace(/function isLiveStreamUrl\([\s\S]*?return lower\.includes\('\.m3u8'\);\r?\n\}/, newIsLive);
}

// Replace applyAudioSettingsUI
const oldApplyAudio = `    const isCurrentlyLiveUrl = isLiveStreamUrl(currentSrc, player?.currentPlayingTrackId);

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
        // Automatically switch active listener directly to the live sanctuary feed!
        if (window.isAudioPlaying || (player && !player.paused)) {
            console.log("[DCLM Radio] 🔴 Live broadcast started! Seamlessly switching active listener to live sanctuary feed:", value.audioUrl);
            if (window.syncPlayerWithGlobalBroadcast) {
                window.syncPlayerWithGlobalBroadcast(true);
            }
            return;
        }
    }`;

const newApplyAudio = `    const isCurrentlyLiveUrl = isLiveStreamUrl(currentSrc);

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

        // If user is actively listening and NOT yet on this exact live stream, switch immediately:
        if (!isAlreadyPlayingThisLive && (window.isAudioPlaying || (player && !player.paused))) {
            console.log("[DCLM Radio] 🔴 Live broadcast started! Seamlessly transitioning active listener to live stream:", liveUrl);
            if (window.playAudioStream) {
                window.playAudioStream(liveUrl, value.title || "DCLM OSUN II LIVE BROADCAST", value.speaker || "Osun State HQ Pulpit", 'live');
            } else if (window.syncPlayerWithGlobalBroadcast) {
                window.syncPlayerWithGlobalBroadcast(true);
            }
            return;
        }
    }`;

if (sc.includes(oldApplyAudio)) {
    sc = sc.replace(oldApplyAudio, newApplyAudio);
    console.log('  ✅ Replaced applyAudioSettingsUI');
} else {
    console.log('  ⚠️ oldApplyAudio not found as exact match, doing regex replace...');
    sc = sc.replace(/const isCurrentlyLiveUrl = isLiveStreamUrl\(currentSrc[\s\S]*?return;\r?\n        \}\r?\n    \}/, newApplyAudio);
}

// Replace watchdog in supabase-config.js
const oldWatchdog = `        // Live stream is ONLINE: If user is actively listening, ensure player is attached to live stream, not 24/7 playlist!
        const currentSrc = player.src || player.originalSrc || '';
        const isAttachedToLive = isLiveStreamUrl(currentSrc, player.currentPlayingTrackId);
        if ((window.isAudioPlaying || !player.paused) && !isAttachedToLive) {
            console.log("[DCLM Watchdog] 🔴 Live broadcast online but player is playing 24/7 track. Transitioning to live stream...");
            if (window.syncPlayerWithGlobalBroadcast) {
                window.syncPlayerWithGlobalBroadcast(true);
            }
        }`;

const newWatchdog = `        // Live stream is ONLINE: If user is actively listening, ensure player is attached to live stream, not 24/7 playlist!
        const liveUrl = (liveAudio.audioUrl || '').trim();
        const cleanLiveUrl = liveUrl.split('?')[0];
        const currentSrc = player.src || player.originalSrc || '';
        const isAttachedToLive = isLiveStreamUrl(currentSrc) && currentSrc.includes(cleanLiveUrl);
        if ((window.isAudioPlaying || !player.paused) && !isAttachedToLive) {
            console.log("[DCLM Watchdog] 🔴 Live broadcast online but player is on 24/7 track. Transitioning to live stream...");
            if (window.playAudioStream) {
                window.playAudioStream(liveUrl, liveAudio.title || "DCLM OSUN II LIVE BROADCAST", liveAudio.speaker || "Osun State HQ Pulpit", 'live');
            } else if (window.syncPlayerWithGlobalBroadcast) {
                window.syncPlayerWithGlobalBroadcast(true);
            }
        }`;

if (sc.includes(oldWatchdog)) {
    sc = sc.replace(oldWatchdog, newWatchdog);
    console.log('  ✅ Replaced watchdog in supabase-config.js');
} else {
    console.log('  ⚠️ oldWatchdog not found as exact match, doing regex replace...');
    sc = sc.replace(/\/\/ Live stream is ONLINE[\s\S]*?window\.syncPlayerWithGlobalBroadcast\(true\);\r?\n            \}\r?\n        \}/, newWatchdog);
}

// Replace window.playAudioStream in supabase-config.js
const oldPlayAudioStream = `// ── Global Radio Player Functions ──
window.playAudioStream = function(url, title, speaker, trackId) {
    const player = document.getElementById("global-radio-player");
    if (!player || !url) return;

    if (player._liveLatencyMonitor) {
        clearInterval(player._liveLatencyMonitor);
        player._liveLatencyMonitor = null;
    }

    updateAllPlayerLabels(title, speaker);

    const isLiveStream = url.includes('/live') || trackId === 'live';
    const targetTrackId = trackId || (isLiveStream ? 'live' : 'track');

    // IF ALREADY ACTIVELY PLAYING THIS STREAM, DO NOT OVERWRITE PLAYER.SRC OR INTERRUPT PLAYBACK!
    if (player.currentPlayingTrackId === targetTrackId && !player.paused) {
        console.log("[DCLM Audio] Active playback already in progress, keeping audio uninterrupted.");
        return;
    }

    player.currentPlayingTrackId = targetTrackId;
    window.currentPlayingTrackId = targetTrackId;
    
    // Add cache buster timestamp query param to force fresh live HTTP connection at current instant
    let finalUrl = url;
    if (isLiveStream) {
        const cleanUrl = url.split('?')[0];
        finalUrl = \`\${cleanUrl}?t=\${Date.now()}\`;
    }

    if (player.src !== finalUrl) {
        player.src = finalUrl;
        player.load();
    }
    
    player.play().then(() => {
        window.isAudioPlaying = true;
        const playBtnIcon = document.getElementById("global-play-btn");
        if (playBtnIcon) playBtnIcon.className = "fa-solid fa-pause play-btn";
        const radioPlayBtn = document.getElementById("radio-play-btn");
        if (radioPlayBtn) radioPlayBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        const playlistPlayBtn = document.getElementById("playlist-play-btn");
        if (playlistPlayBtn) playlistPlayBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        const wave = document.getElementById("radio-music-wave");
        if (wave) wave.classList.add("playing");
        console.log("[DCLM Audio] Playing stream successfully:", finalUrl);
    }).catch(err => {
        console.error("[DCLM Audio] Play failed or requires user gesture:", err);
    });
};`;

const newPlayAudioStream = `// ── Global Radio Player Functions ──
window.playAudioStream = function(url, title, speaker, trackId) {
    const player = document.getElementById("global-radio-player");
    if (!player || !url) return;

    if (player._liveLatencyMonitor) {
        clearInterval(player._liveLatencyMonitor);
        player._liveLatencyMonitor = null;
    }

    updateAllPlayerLabels(title, speaker);

    const isLiveStream = isLiveStreamUrl(url) || trackId === 'live';
    const targetTrackId = trackId || (isLiveStream ? 'live' : 'track');

    // Check if ALREADY playing this exact stream URL (must verify actual src, not just ID!)
    const cleanTarget = url.split('?')[0];
    const currentSrc = (player.src || player.originalSrc || '').split('?')[0];
    const isSameSource = currentSrc.includes(cleanTarget) || (window.isSameAudioSource && window.isSameAudioSource(currentSrc, cleanTarget));

    if (isSameSource && !player.paused) {
        console.log("[DCLM Audio] Active playback of this exact stream already in progress.");
        return;
    }

    player.currentPlayingTrackId = targetTrackId;
    window.currentPlayingTrackId = targetTrackId;
    
    let finalUrl = url;
    if (isLiveStream) {
        const cleanUrl = url.split('?')[0];
        const sep = cleanUrl.includes('?') ? '&' : '?';
        finalUrl = \`\${cleanUrl}\${sep}_live=\${Date.now()}\`;
        delete player.pendingSeekTime;
    }

    // Disconnect any ongoing playback and switch immediately
    player.pause();
    player.src = finalUrl;
    player.load();
    
    const playPromise = player.play();
    if (playPromise !== undefined) {
        playPromise.then(() => {
            window.isAudioPlaying = true;
            const playBtnIcon = document.getElementById("global-play-btn");
            if (playBtnIcon) playBtnIcon.className = "fa-solid fa-pause play-btn";
            const radioPlayBtn = document.getElementById("radio-play-btn");
            if (radioPlayBtn) {
                radioPlayBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
                radioPlayBtn.removeAttribute("data-loading");
            }
            const playlistPlayBtn = document.getElementById("playlist-play-btn");
            if (playlistPlayBtn) playlistPlayBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
            const wave = document.getElementById("radio-music-wave");
            if (wave) wave.classList.add("playing");
            console.log("[DCLM Audio] Playing stream successfully:", finalUrl);
        }).catch(err => {
            console.warn("[DCLM Audio] Play waiting for user gesture:", err);
            window.isAudioPlaying = false;
            if (window.syncRadioPlayButtonState) window.syncRadioPlayButtonState();
        });
    }
};`;

if (sc.includes(oldPlayAudioStream)) {
    sc = sc.replace(oldPlayAudioStream, newPlayAudioStream);
    console.log('  ✅ Replaced window.playAudioStream in supabase-config.js');
} else {
    console.log('  ⚠️ oldPlayAudioStream not found as exact match, doing regex replace...');
    sc = sc.replace(/\/\/ ── Global Radio Player Functions ──\r?\nwindow\.playAudioStream = function[\s\S]*?console\.error\("\[DCLM Audio\] Play failed or requires user gesture:", err\);\r?\n    \}\);\r?\n\};/, newPlayAudioStream);
}

fs.writeFileSync('supabase-config.js', sc, 'utf8');
console.log('supabase-config.js written successfully.');

// ── 2. Update public/app.js ──
console.log('\n2. Updating public/app.js...');
let app = fs.readFileSync('public/app.js', 'utf8');

// In public/app.js: Ensure syncPlayerWithGlobalBroadcast doesn't set player.currentPlayingTrackId before playAudioStream
const oldSyncLive = `    if (shouldPlay) {
        const audioBar = document.getElementById("global-audio-bar");
        if (audioBar) audioBar.classList.add("visible");
        
        if (isSyncLive) {
            delete player.pendingSeekTime;
            playAudioStream(state.audioUrl, state.title, state.speaker, 'live');
            return;
        }`;

const newSyncLive = `    if (shouldPlay) {
        const audioBar = document.getElementById("global-audio-bar");
        if (audioBar) audioBar.classList.add("visible");
        
        if (isSyncLive) {
            delete player.pendingSeekTime;
            if (window.playAudioStream) {
                window.playAudioStream(state.audioUrl, state.title, state.speaker, 'live');
            } else {
                playAudioStream(state.audioUrl, state.title, state.speaker, 'live');
            }
            return;
        }`;

if (app.includes(oldSyncLive)) {
    app = app.replace(oldSyncLive, newSyncLive);
    console.log('  ✅ Updated isSyncLive in public/app.js');
}

// In public/app.js: Update lockstep watchdog so it checks actual player.src
const oldAppWatchdog = `    if (isLiveOnline) {
        // If live stream is online and player is actively playing 24/7 radio, switch immediately to live stream!
        if ((window.isAudioPlaying || !player.paused) && player.currentPlayingTrackId !== 'live') {
            console.log("[Radio Watchdog] Live stream is online. Transitioning active listener to live sanctuary feed...");
            window.syncPlayerWithGlobalBroadcast(true);
        }
        return;
    }`;

const newAppWatchdog = `    if (isLiveOnline) {
        // If live stream is online and player is actively playing 24/7 radio, switch immediately to live stream!
        const liveUrl = (window._liveAudioSettings?.audioUrl || '').trim();
        const cleanLiveUrl = liveUrl.split('?')[0];
        const currentSrc = player.src || player.originalSrc || '';
        const isAttachedToLive = currentSrc.includes(cleanLiveUrl);
        if ((window.isAudioPlaying || !player.paused) && !isAttachedToLive) {
            console.log("[Radio Watchdog] Live stream is online. Transitioning active listener to live sanctuary feed...");
            if (window.playAudioStream) {
                window.playAudioStream(liveUrl, window._liveAudioSettings?.title || "DCLM OSUN II LIVE BROADCAST", window._liveAudioSettings?.speaker || "Osun State HQ Pulpit", 'live');
            } else if (window.syncPlayerWithGlobalBroadcast) {
                window.syncPlayerWithGlobalBroadcast(true);
            }
        }
        return;
    }`;

if (app.includes(oldAppWatchdog)) {
    app = app.replace(oldAppWatchdog, newAppWatchdog);
    console.log('  ✅ Updated watchdog in public/app.js');
}

fs.writeFileSync('public/app.js', app, 'utf8');
console.log('public/app.js written successfully.');

// ── 3. Update local_icecast_server.js for Low-Bandwidth Optimizations ──
console.log('\n3. Updating local_icecast_server.js...');
let serverCode = fs.readFileSync('local_icecast_server.js', 'utf8');

const oldServerHeaders = `                socket.write(
                    'HTTP/1.1 200 OK\\r\\n' +
                    'Content-Type: audio/mpeg\\r\\n' +
                    'Access-Control-Allow-Origin: *\\r\\n' +
                    'Cache-Control: no-cache, no-store, must-revalidate, max-age=0\\r\\n' +
                    'Pragma: no-cache\\r\\n' +
                    'Expires: 0\\r\\n' +
                    'X-Accel-Buffering: no\\r\\n' +
                    'Connection: keep-alive\\r\\n\\r\\n'
                );`;

const newServerHeaders = `                socket.write(
                    'HTTP/1.1 200 OK\\r\\n' +
                    'Content-Type: audio/mpeg\\r\\n' +
                    'Access-Control-Allow-Origin: *\\r\\n' +
                    'Access-Control-Allow-Headers: *\\r\\n' +
                    'Cache-Control: no-cache, no-store, must-revalidate, max-age=0\\r\\n' +
                    'Pragma: no-cache\\r\\n' +
                    'Expires: 0\\r\\n' +
                    'X-Accel-Buffering: no\\r\\n' +
                    'X-Content-Type-Options: nosniff\\r\\n' +
                    'icy-name: DCLM OSUN 2 RADIO\\r\\n' +
                    'icy-genre: Gospel\\r\\n' +
                    'icy-br: 64\\r\\n' +
                    'icy-pub: 1\\r\\n' +
                    'Connection: keep-alive\\r\\n\\r\\n'
                );`;

if (serverCode.includes(oldServerHeaders)) {
    serverCode = serverCode.replace(oldServerHeaders, newServerHeaders);
    console.log('  ✅ Updated audio response headers in local_icecast_server.js');
}

fs.writeFileSync('local_icecast_server.js', serverCode, 'utf8');
console.log('local_icecast_server.js written successfully.');

console.log('\n🎉 ALL FIXES APPLIED SUCCESSFULLY!');
