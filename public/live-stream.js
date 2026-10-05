// ==========================================================================
// DCLM OSUN II — Watch Live Premium Streaming & Interactive Logic Controller
// Features: HLS.js Engine, Sermon Notepad Auto-save/Export, Clipboard Sharing,
// Support Ticketing Overlay, Pulsing Viewer Counts, and Database Chat Delegation.
// ==========================================================================

const liveStreamState = {
    notesFontSize: 14,
    viewerBaseCount: 345,
    viewerIntervalId: null
};

// Global Boot Trigger Hooks
document.addEventListener("DOMContentLoaded", () => {
    // Check if we are currently active on the live view tab
    const liveView = document.getElementById("live-view");
    if (liveView && liveView.classList.contains("active")) {
        activateLiveViewSystems();
    }
});

// Intercept routing switches from app.js to trigger systems boot
const originalSwitchTab = window.switchTab;
window.switchTab = function(clickedElement, targetView) {
    if (originalSwitchTab) {
        originalSwitchTab(clickedElement, targetView);
    }
    
    if (targetView === 'live') {
        setTimeout(activateLiveViewSystems, 100);
    } else {
        deactivateLiveViewSystems();
    }
};

// ==========================================================================
// CORE BOOT SYSTEM INITIALIZERS
// ==========================================================================
function activateLiveViewSystems() {
    console.log("[Live-Stream] Booting active streaming and interactive engines...");
    
    // Load local notepad
    loadSermonNotes();
    
    // Check stream URLs and initialize player / presence
    syncActiveLivestreamPlayer();
}

function deactivateLiveViewSystems() {
    console.log("[Live-Stream] Leaving live view tab / pausing active streams...");
    
    // Announce departure from multi-device live viewer presence
    if (window.leaveVideoPresence) {
        window.leaveVideoPresence();
    }
    
    if (liveStreamState.viewerIntervalId) {
        clearInterval(liveStreamState.viewerIntervalId);
        liveStreamState.viewerIntervalId = null;
    }
    
    // Pause native video player
    const player = document.getElementById("live-video-player");
    if (player) player.pause();

    // Mute/pause iframe embed
    const iframeWrapper = document.getElementById("live-iframe-wrapper");
    const iframe = document.getElementById("live-embed-iframe");
    if (iframeWrapper && iframe) {
        const currentSrc = iframe.src;
        if (currentSrc && currentSrc !== "about:blank") {
            iframe.dataset.pausedSrc = currentSrc;
            iframe.src = "";
        }
    }
}

// ==========================================================================
// UNIVERSAL VIDEO STREAM ENGINE CONTROLLER (YouTube, Facebook, HLS, MP4)
// ==========================================================================
let hlsInstance = null;

// Universal Video Stream URL Parser
function parseVideoStreamUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') {
        return { type: 'empty', url: '' };
    }
    const url = rawUrl.trim();
    if (!url) return { type: 'empty', url: '' };

    // 1. YouTube (watch?v=, youtu.be/, /live/, /embed/, /shorts/)
    const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i);
    if (ytMatch && ytMatch[1]) {
        const videoId = ytMatch[1];
        return {
            type: 'youtube',
            videoId: videoId,
            embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0&modestbranding=1&enablejsapi=1`,
            url: url
        };
    }

    // 2. Facebook Live / Videos (facebook.com/.../videos/... or fb.watch/...)
    if (/facebook\.com|fb\.watch/i.test(url)) {
        return {
            type: 'facebook',
            embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&autoplay=true`,
            url: url
        };
    }

    // 3. HLS (.m3u8)
    if (/\.m3u8(?:$|\?)/i.test(url)) {
        return {
            type: 'hls',
            url: url
        };
    }

    // 4. Direct HTML5 Video (mp4, webm, ogg)
    if (/\.(mp4|webm|ogg)(?:$|\?)/i.test(url)) {
        return {
            type: 'video',
            url: url
        };
    }

    // 5. Generic embed / iframe
    if (url.includes('/embed') || url.includes('player.')) {
        return {
            type: 'iframe',
            embedUrl: url,
            url: url
        };
    }

    // Default fallback: treat as HLS / direct stream
    return {
        type: 'hls',
        url: url
    };
}
window.parseVideoStreamUrl = parseVideoStreamUrl;

function syncActiveLivestreamPlayer() {
    const videoElement = document.getElementById("live-video-player");
    const iframeWrapper = document.getElementById("live-iframe-wrapper");
    const iframeElement = document.getElementById("live-embed-iframe");
    const offlineCard = document.getElementById("live-stream-offline-card");
    const onlineContent = document.getElementById("live-stream-online-content");
    const statusText = document.getElementById("stream-status-text");
    const liveBadge = document.getElementById("live-badge-tag");
    const viewerBadge = document.getElementById("viewer-count-tag");
    const wrapper = document.getElementById("video-player-wrapper");
    const streamContainer = document.querySelector(".live-stream-container");
    
    // Try to get published live stream URL from the admin input
    const streamUrlInput = document.getElementById("stream-url-input");
    let streamUrl = streamUrlInput ? streamUrlInput.value.trim() : "";
    
    // Fallback to global video settings if input is empty
    if (!streamUrl && window._liveVideoSettings?.videoUrl) {
        streamUrl = window._liveVideoSettings.videoUrl;
        if (streamUrlInput) streamUrlInput.value = streamUrl;
    }
    
    // Clean up existing HLS instance
    if (hlsInstance) {
        hlsInstance.destroy();
        hlsInstance = null;
    }
    
    const parsed = parseVideoStreamUrl(streamUrl);
    
    if (parsed.type === 'empty') {
        // Stream offline standby state: hide ALL live broadcast features (video player, toolbar, metadata, actions, chat)
        console.log("[Live-Stream] Sanctuary stream URL is blank. Hiding video player and displaying offline radio card.");
        
        // Hide the entire online live stream interface
        if (onlineContent) {
            onlineContent.style.display = "none";
        }
        
        // Display dedicated offline standby card
        if (offlineCard) {
            offlineCard.style.display = "flex";
            offlineCard.classList.add("active");
        }
        
        // Reset player frame & exit any theater or pip modes
        if (wrapper) {
            wrapper.classList.remove("theater-mode", "mini-pip-float");
        }
        if (streamContainer) {
            streamContainer.classList.remove("theater-mode");
        }
        
        if (videoElement) {
            videoElement.pause();
            videoElement.src = "";
            videoElement.style.display = "none";
        }
        if (iframeWrapper) iframeWrapper.style.display = "none";
        if (iframeElement) iframeElement.src = "";
        
        // Depart from live video viewer presence while offline
        if (window.leaveVideoPresence) {
            window.leaveVideoPresence();
        }
        
        return;
    }
    
    // Stream active state: hide offline notice and show complete live broadcast interface
    if (offlineCard) {
        offlineCard.style.display = "none";
        offlineCard.classList.remove("active");
    }
    if (onlineContent) {
        onlineContent.style.display = "flex";
        onlineContent.style.flexDirection = "column";
        onlineContent.style.gap = "16px";
    }
    
    // Join live video viewer presence
    if (window.joinVideoPresence) {
        window.joinVideoPresence();
    }
    
    if (liveBadge) liveBadge.style.display = "flex";
    if (viewerBadge) viewerBadge.style.display = "flex";
    if (statusText) {
        const platformLabel = parsed.type === 'youtube' ? 'YouTube Live' : 
                              parsed.type === 'facebook' ? 'Facebook Live' : 'Sanctuary HQ Feed';
        statusText.textContent = `${platformLabel} active`;
        statusText.style.color = "#38ef7d";
        statusText.style.backgroundColor = "rgba(56, 239, 125, 0.1)";
    }
    
    // Handle player selection based on stream type
    if (parsed.type === 'youtube' || parsed.type === 'facebook' || parsed.type === 'iframe') {
        // Embedded iFrame Player
        console.log(`[Live-Stream] Loading embedded ${parsed.type} stream:`, parsed.embedUrl);
        videoElement.pause();
        videoElement.style.display = "none";
        
        if (iframeWrapper && iframeElement) {
            iframeWrapper.style.display = "block";
            if (iframeElement.src !== parsed.embedUrl) {
                iframeElement.src = parsed.embedUrl;
            }
        }
    } else if (parsed.type === 'video') {
        // Direct MP4 / HTML5 Video
        console.log("[Live-Stream] Loading direct HTML5 video stream:", parsed.url);
        if (iframeWrapper) iframeWrapper.style.display = "none";
        if (iframeElement) iframeElement.src = "";
        
        videoElement.style.display = "block";
        videoElement.src = parsed.url;
        videoElement.play().catch(e => console.log("[Live-Stream] Autoplay blocked, user click required."));
    } else {
        // HLS Stream (.m3u8)
        console.log("[Live-Stream] Loading HLS stream:", parsed.url);
        if (iframeWrapper) iframeWrapper.style.display = "none";
        if (iframeElement) iframeElement.src = "";
        
        videoElement.style.display = "block";
        
        if (Hls.isSupported()) {
            console.log("[Live-Stream] hls.js is supported. Initializing stream engine...");
            hlsInstance = new Hls({
                enableWorker: true,
                lowLatencyMode: true
            });
            hlsInstance.loadSource(parsed.url);
            hlsInstance.attachMedia(videoElement);
            
            hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
                console.log("[Live-Stream] HLS Manifest parsed. Auto-playing stream...");
                videoElement.play().catch(e => console.log("[Live-Stream] Play blocked. Needs user click."));
            });
            
            hlsInstance.on(Hls.Events.ERROR, function (event, data) {
                if (data.fatal) {
                    switch(data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.log("[Live-Stream] Fatal network error. Trying recovery...");
                            hlsInstance.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.log("[Live-Stream] Fatal media error. Trying recovery...");
                            hlsInstance.recoverMediaError();
                            break;
                        default:
                            console.log("[Live-Stream] Unrecoverable error. Destroying HLS player.");
                            deactivateLiveViewSystems();
                            break;
                    }
                }
            });
        } else if (videoElement.canPlayType('application/x-mpegURL')) {
            // Native fallback (Safari/iOS)
            console.log("[Live-Stream] hls.js not supported. Falling back to native Safari engine...");
            videoElement.src = parsed.url;
            videoElement.addEventListener('loadedmetadata', () => {
                videoElement.play();
            });
        } else {
            console.warn("[Live-Stream] HLS streaming is not supported on this browser device.");
        }
    }
}
window.syncActiveLivestreamPlayer = syncActiveLivestreamPlayer;

// ==========================================================================
// THEATER MODE, PICTURE-IN-PICTURE & FULLSCREEN CONTROLS
// ==========================================================================
window.toggleTheaterMode = function() {
    const container = document.querySelector(".live-stream-container");
    const wrapper = document.getElementById("video-player-wrapper");
    const btn = document.getElementById("btn-theater-mode");
    if (!wrapper) return;

    const isTheater = wrapper.classList.toggle("theater-mode");
    if (container) container.classList.toggle("theater-mode", isTheater);
    if (btn) {
        btn.classList.toggle("active", isTheater);
        btn.innerHTML = isTheater ? '<i class="fa-solid fa-compress"></i> <span id="theater-btn-label">Exit Theater</span>' :
                                    '<i class="fa-solid fa-expand"></i> <span id="theater-btn-label">Theater Mode</span>';
    }

    if (isTheater) {
        wrapper.scrollIntoView({ behavior: "smooth", block: "start" });
    }
};

window.toggleVideoPiP = async function() {
    const videoElement = document.getElementById("live-video-player");
    const iframeWrapper = document.getElementById("live-iframe-wrapper");
    const wrapper = document.getElementById("video-player-wrapper");
    const btn = document.getElementById("btn-pip-mode");

    const isIframeActive = iframeWrapper && iframeWrapper.style.display !== 'none';

    // If native video is active and PiP is supported, use native browser PiP
    if (!isIframeActive && videoElement && videoElement.style.display !== 'none' && document.pictureInPictureEnabled) {
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
                if (btn) btn.classList.remove("active");
            } else {
                await videoElement.requestPictureInPicture();
                if (btn) btn.classList.add("active");
            }
            return;
        } catch (err) {
            console.warn("[Live-Stream] Native PiP unavailable, falling back to mini player:", err);
        }
    }

    // Mini floating player fallback (works smoothly for YouTube, Facebook, and native video)
    if (wrapper) {
        const isFloating = wrapper.classList.toggle("mini-pip-float");
        if (btn) btn.classList.toggle("active", isFloating);
    }
};

window.toggleVideoFullscreen = function() {
    const wrapper = document.getElementById("video-player-wrapper");
    const btn = document.getElementById("btn-fullscreen-mode");
    if (!wrapper) return;

    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (wrapper.requestFullscreen) {
            wrapper.requestFullscreen();
        } else if (wrapper.webkitRequestFullscreen) {
            wrapper.webkitRequestFullscreen();
        } else if (wrapper.msRequestFullscreen) {
            wrapper.msRequestFullscreen();
        }
        if (btn) btn.classList.add("active");
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
        if (btn) btn.classList.remove("active");
    }
};

// Listen to fullscreen changes to update button active state
document.addEventListener("fullscreenchange", () => {
    const btn = document.getElementById("btn-fullscreen-mode");
    if (btn) {
        btn.classList.toggle("active", Boolean(document.fullscreenElement));
    }
});

// Intercept admin publish form submission inside firebase-config to reload player instantly
const originalAdminUpdateForm = document.getElementById("admin-update-form");
if (originalAdminUpdateForm) {
    originalAdminUpdateForm.addEventListener("submit", () => {
        setTimeout(syncActiveLivestreamPlayer, 500);
    });
}

// ==========================================================================
// INTERACTIVE SERMON NOTEBOOK OVERLAY
// ==========================================================================
function toggleSermonNotes(show) {
    const overlay = document.getElementById("sermon-notes-overlay");
    if (!overlay) return;
    
    if (show) {
        overlay.classList.add("active");
    } else {
        overlay.classList.remove("active");
    }
}
window.toggleSermonNotes = toggleSermonNotes;

function saveSermonNotes() {
    const editor = document.getElementById("sermon-notes-editor");
    if (editor) {
        localStorage.setItem("dclm_sermon_notes", editor.value);
    }
}
window.saveSermonNotes = saveSermonNotes;

function loadSermonNotes() {
    const editor = document.getElementById("sermon-notes-editor");
    if (editor) {
        const saved = localStorage.getItem("dclm_sermon_notes");
        editor.value = saved ? saved : "";
        editor.style.fontSize = liveStreamState.notesFontSize + "px";
    }
}

function adjustNotesFontSize(delta) {
    liveStreamState.notesFontSize = Math.min(24, Math.max(12, liveStreamState.notesFontSize + delta));
    const editor = document.getElementById("sermon-notes-editor");
    if (editor) {
        editor.style.fontSize = liveStreamState.notesFontSize + "px";
    }
}
window.adjustNotesFontSize = adjustNotesFontSize;

function exportSermonNotes() {
    const editor = document.getElementById("sermon-notes-editor");
    if (!editor || !editor.value.trim()) {
        alert("Your Sermon Notebook is empty. Type some notes before exporting!");
        return;
    }
    
    const notesText = editor.value;
    const dateStamp = new Date().toLocaleDateString().replace(/\//g, "-");
    const filename = `DCLM_Sermon_Notes_${dateStamp}.txt`;
    
    const blob = new Blob([notesText], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
window.exportSermonNotes = exportSermonNotes;

// ==========================================================================
// GLASSMORPHIC SHARE DIALOG PANEL
// ==========================================================================
function toggleShareService(show) {
    const overlay = document.getElementById("share-service-overlay");
    const copiedMsg = document.getElementById("share-copied-notification");
    
    if (!overlay) return;
    
    if (show) {
        if (copiedMsg) copiedMsg.style.display = "none";
        overlay.classList.add("active");
    } else {
        overlay.classList.remove("active");
    }
}
window.toggleShareService = toggleShareService;

function copyShareLink() {
    const input = document.getElementById("share-link-input");
    const copiedMsg = document.getElementById("share-copied-notification");
    const copyBtn = document.getElementById("share-copy-btn");
    
    if (!input) return;
    
    input.select();
    input.setSelectionRange(0, 99999); // Mobile compatibility
    
    navigator.clipboard.writeText(input.value)
        .then(() => {
            if (copiedMsg) copiedMsg.style.display = "flex";
            if (copyBtn) {
                copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
                setTimeout(() => {
                    copyBtn.innerHTML = '<i class="fa-solid fa-copy"></i> Copy';
                }, 2000);
            }
        })
        .catch(err => {
            console.error("[Live-Stream] Failed to copy link: ", err);
        });
}
window.copyShareLink = copyShareLink;

// ==========================================================================
// TECHNICAL SUPPORT DESK PORTAL (REPORT ISSUE)
// ==========================================================================
function toggleReportIssue(show) {
    const overlay = document.getElementById("report-issue-overlay");
    const form = document.getElementById("media-report-form");
    const successScreen = document.getElementById("media-report-success");
    
    if (!overlay) return;
    
    if (show) {
        if (form) form.style.display = "flex";
        if (successScreen) successScreen.style.display = "none";
        overlay.classList.add("active");
    } else {
        overlay.classList.remove("active");
    }
}
window.toggleReportIssue = toggleReportIssue;

function submitMediaReport(event) {
    event.preventDefault();
    
    const form = document.getElementById("media-report-form");
    const successScreen = document.getElementById("media-report-success");
    const issueType = document.getElementById("report-issue-type");
    const issueDesc = document.getElementById("report-issue-desc");
    
    if (!form || !successScreen) return;
    
    console.log(`[Support Portal] Submitting media desk ticket: [Type: ${issueType?.value}], [Details: ${issueDesc ? issueDesc.value : ""}]`);
    
    if (window.submitSupportMessage) {
        window.submitSupportMessage(event);
    }

    // Trigger sleek success transition
    form.style.display = "none";
    successScreen.style.display = "flex";
    
    // Reset forms
    if (issueType) issueType.value = "";
    if (issueDesc) issueDesc.value = "";
}
window.submitMediaReport = submitMediaReport;

// ==========================================================================
// INTERACTIVE FELLOWSHIP LIVE CHAT DELEGATOR
// ==========================================================================
function handleUserChatSubmit(event) {
    event.preventDefault();
    
    const input = document.getElementById("chat-input-field");
    if (!input || !input.value.trim()) return;
    
    const message = input.value.trim();
    
    // Delegate the write operation directly to the real-time Firestore database synchronizer
    if (window.sendLiveChatMessage) {
        window.sendLiveChatMessage(message);
    } else {
        console.warn("[Live-Stream] sendLiveChatMessage is not loaded yet in the context.");
    }
    
    // Clear input instantly
    input.value = "";
}
window.handleUserChatSubmit = handleUserChatSubmit;

// ==========================================================================
// REAL-TIME MULTI-DEVICE VIEWER COUNT INTEGRATION
// ==========================================================================
function initViewerCountPulse() {
    if (liveStreamState.viewerIntervalId) {
        clearInterval(liveStreamState.viewerIntervalId);
        liveStreamState.viewerIntervalId = null;
    }
    
    // Connect to real-time multi-device Supabase presence engine
    if (window.joinVideoPresence) {
        window.joinVideoPresence();
    }
}

function updateViewerBadgeDisplay(count) {
    const label = document.getElementById("live-viewer-count");
    if (label) label.textContent = count;
}

// Wrapper called by Supabase configuration to refresh live stream video player
window.initializeLiveVideoPlayer = function(url) {
    const input = document.getElementById("stream-url-input");
    if (input) input.value = url || '';
    syncActiveLivestreamPlayer();
};
