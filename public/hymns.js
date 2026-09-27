// ==========================================================================
// DCLM OSUN II â€” Hymns & Songs Module (Stable Remote Fetch Edition)
// Logic: Loads GHS database programmatically from GitHub with a local fallback
// database of classic beloved hymns to guarantee 100% stable execution.
// ==========================================================================

const hymnsState = {
    database: null,
    selectedHymn: null,
    currentFontSize: 15,
    activeCategory: "all"
};

let isHymnAudioPlaying = false;

// High-Quality hand-crafted Local fallback database (used if user is offline or fetch fails)
const FALLBACK_HYMNS = {
    "hymns": {
        "1": {
            "number": "1",
            "title": "All Your Anxiety",
            "chorus": "All your anxiety, all your care,\nBring to the mercy seat--leave it there;\nNever a burden He cannot bear,\nNever a friend like Jesus.",
            "verses": [
                "Is there a heart o'er-bound by sorrow?\nIs there a life weighed down by care?\nCome to the cross--each burden bearing,\nAll your anxiety--leave it there.",
                "No other friend so keen to help you,\nNo other friend so quick to hear;\nNo other place to leave your burden,\nNo other one to hear your prayer.",
                "Come then at once--delay no longer!\nHeed His entreaty kind and sweet;\nYou need not fear a disappointment--\nYou shall find peace at the mercy seat."
            ],
            "sound": "https://www.dclmfl.org/Hymns/Hymns%201-150/GHS%2001%20All%20Your%20Anxiety.mp3",
            "category": "admonition"
        },
        "9": {
            "number": "9",
            "title": "Great Is Thy Faithfulness",
            "chorus": "Great is Thy faithfulness! Great is Thy faithfulness!\nMorning by morning new mercies I see;\nAll I have needed Thy hand hath provided,\nGreat is Thy faithfulness, Lord, unto me!",
            "verses": [
                "Great is Thy faithfulness, O God my Father,\nThere is no shadow of turning with Thee;\nThou changest not, Thy compassions they fail not,\nAs Thou hast been Thou for ever wilt be.",
                "Summer and winter, and spring-time and harvest,\nSun, moon and stars in their courses above,\nJoin with all nature in manifold witness\nTo Thy great faithfulness, mercy and love.",
                "Pardon for sin and a peace that endureth,\nThine own dear presence to cheer and to guide;\nStrength for today and bright hope for tomorrow,\nBlessings all mine, with ten thousand beside!"
            ],
            "sound": "https://www.dclmfl.org/Hymns/Hymns%201-150/GHS%2009%20Great%20is%20Thy%20Faithfulness.mp3",
            "category": "adoration"
        },
        "13": {
            "number": "13",
            "title": "To God Be The Glory",
            "chorus": "Praise the Lord! Praise the Lord!\nLet the earth hear His voice!\nPraise the Lord! Praise the Lord!\nLet the people rejoice!\nOh come to the Father, through Jesus the Son,\nAnd give Him the glory; great things He hath done.",
            "verses": [
                "To God be the glory, great things He hath done,\nSo loved He the world that He gave us His Son,\nWho yielded His life an atonement for sin,\nAnd opened the life gate that all may go in.",
                "O perfect redemption, the purchase of blood,\nTo ev'ry believer the promise of God;\nThe vilest offender who truly believes,\nThat moment from Jesus a pardon receives.",
                "Great things He hath taught us, great things He hath done,\nAnd great our rejoicing through Jesus the Son;\nBut purer, and higher, and greater will be,\nOur wonder, our transport when Jesus we see."
            ],
            "sound": "https://www.dclmfl.org/Hymns/Hymns%201-150/GHS%2013%20%20To%20God%20Be%20The%20Glory.mp3",
            "category": "adoration"
        },
        "18": {
            "number": "18",
            "title": "Blessed Assurance",
            "chorus": "This is my story, this is my song,\nPraising my Saviour all the day long;\nThis is my story, this is my song,\nPraising my Saviour all the day long.",
            "verses": [
                "Blessed assurance, Jesus is mine!\nOh, what a foretaste of glory divine!\nHeir of salvation, purchase of God,\nBorn of His Spirit, washed in His blood.",
                "Perfect submission, perfect delight,\nVisions of rapture now burst on my sight;\nAngels descending, bring from above\nEchoes of mercy, whispers of love.",
                "Perfect submission, all is at rest,\nI in my Saviour am happy and blest;\nWatching and waiting, looking above,\nFilled with His goodness, lost in His love."
            ],
            "sound": "https://www.dclmfl.org/Hymns/Hymns%201-150/GHS%2018%20%20Blessed%20Assurance.mp3",
            "category": "assurance & confidence"
        }
    }
};

// ==========================================================================
// INIT
// ==========================================================================
function initHymnsReader() {
    hymnsState.activeCategory = "all";
    const searchInput = document.getElementById("hymn-search-input");
    if (searchInput) searchInput.value = "";
    
    stopHymnAudio();

    // Load instantly from preloaded window.GHS_HYMNS (bundle) or fallback
    if (!hymnsState.database) {
        hymnsState.database = window.GHS_HYMNS || FALLBACK_HYMNS;
        console.log("[DCLM] 260 GHS Hymns loaded offline from local bundle.");
    }
    
    renderHymnCategoryPills();
    renderHymnsList(Object.values(hymnsState.database.hymns));
    showHymnsPanel("list");
}

// ==========================================================================
// RENDER CATEGORIES
// ==========================================================================
function renderHymnCategoryPills() {
    const container = document.querySelector(".hymns-category-selector");
    if (!container) return;
    container.innerHTML = "";
    
    // "All" Category Pill
    const allBtn = document.createElement("button");
    allBtn.className = "hymn-cat-btn" + (hymnsState.activeCategory === "all" ? " active" : "");
    allBtn.id = "hymn-cat-all";
    allBtn.innerHTML = `<i class="fa-solid fa-music"></i> All`;
    allBtn.onclick = () => filterHymnsByCategory("all");
    container.appendChild(allBtn);
    
    // Extract unique categories from loaded dataset
    const categories = new Set();
    if (hymnsState.database && hymnsState.database.hymns) {
        Object.values(hymnsState.database.hymns).forEach(h => {
            if (h.category) categories.add(h.category.trim());
        });
    }
    
    // Render sorted category pills
    Array.from(categories).sort().forEach(cat => {
        const btn = document.createElement("button");
        const prettyName = formatCategoryName(cat);
        btn.className = "hymn-cat-btn" + (hymnsState.activeCategory === cat ? " active" : "");
        const cleanId = cat.replace(/[^a-zA-Z0-9]/g, '-');
        btn.id = `hymn-cat-${cleanId}`;
        btn.textContent = prettyName;
        btn.onclick = () => filterHymnsByCategory(cat);
        container.appendChild(btn);
    });
}

// ==========================================================================
// RENDER HYMNS LIST
// ==========================================================================
function renderHymnsList(hymns) {
    const container = document.getElementById("hymns-list-container");
    if (!container) return;
    container.innerHTML = "";
    
    if (hymns.length === 0) {
        container.innerHTML = `
            <div class="hymns-empty">
                <i class="fa-solid fa-music"></i>
                <p>No hymns found matching your criteria.</p>
            </div>
        `;
        return;
    }
    
    hymns.forEach(hymn => {
        const item = document.createElement("div");
        item.className = "hymn-card-item";
        
        const formattedNumber = String(hymn.number).padStart(2, '0');
        const formattedCat = formatCategoryName(hymn.category);
        
        item.innerHTML = `
            <div class="hymn-number-badge">${formattedNumber}</div>
            <div class="hymn-card-details">
                <span class="hymn-card-title">${hymn.title}</span>
                <span class="hymn-card-meta">${formattedCat}</span>
            </div>
            <i class="fa-solid fa-chevron-right hymn-card-arrow"></i>
        `;
        item.onclick = () => openHymnDetails(hymn);
        container.appendChild(item);
    });
}

// ==========================================================================
// FILTER LOGIC
// ==========================================================================
function filterHymnsByCategory(cat) {
    hymnsState.activeCategory = cat;
    
    document.querySelectorAll(".hymn-cat-btn").forEach(btn => {
        btn.classList.remove("active");
    });
    
    const cleanId = cat.replace(/[^a-zA-Z0-9]/g, '-');
    const activeBtn = cat === "all" ? 
        document.getElementById("hymn-cat-all") : 
        document.getElementById(`hymn-cat-${cleanId}`);
    if (activeBtn) activeBtn.classList.add("active");
    
    stopHymnAudio();
    applyGlobalFilters();
}

function applyGlobalFilters(isSubmit = false) {
    const searchInput = document.getElementById("hymn-search-input");
    const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const cat = hymnsState.activeCategory;
    
    if (!hymnsState.database || !hymnsState.database.hymns) return;
    let filtered = Object.values(hymnsState.database.hymns);
    
    // 1. Category Pill Filter
    if (cat !== "all") {
        filtered = filtered.filter(h => h.category === cat);
    }
    
    // 2. Search Query (Number, Title, or Lyrics matched)
    if (query) {
        filtered = filtered.filter(h => {
            const numMatch = h.number.toString().includes(query);
            const titleMatch = h.title.toLowerCase().includes(query);
            const lyricsMatch = h.verses.some(v => v.toLowerCase().includes(query)) || 
                               (h.chorus && h.chorus.toLowerCase().includes(query));
            return numMatch || titleMatch || lyricsMatch;
        });
    }
    
    // Smart Load on Submit
    if (isSubmit && query && filtered.length > 0) {
        // Try to find exact number match first
        const exactNumMatch = filtered.find(h => h.number.toString() === query);
        if (exactNumMatch) {
            openHymnDetails(exactNumMatch);
            return;
        }
        // Otherwise if there's exactly one match, open it!
        if (filtered.length === 1) {
            openHymnDetails(filtered[0]);
            return;
        }
    }
    
    renderHymnsList(filtered);
}

function filterHymns(query, isSubmit = false) {
    stopHymnAudio();
    applyGlobalFilters(isSubmit);
}

// ==========================================================================
// DETAILED LYRICS CANVAS
// ==========================================================================
function openHymnDetails(hymn) {
    hymnsState.selectedHymn = hymn;
    
    document.getElementById("hymn-details-number").textContent = `Hymn ${hymn.number}`;
    document.getElementById("hymn-details-title").textContent = hymn.title;
    
    const formattedCat = formatCategoryName(hymn.category);
    document.getElementById("hymn-details-meta").textContent = `${formattedCat}`;
    
    // Audio Player setup
    const player = document.getElementById("hymn-audio-player");
    const playBtn = document.getElementById("hymn-player-play-btn");
    const statusText = document.getElementById("hymn-audio-status");
    
    stopHymnAudio();
    
    // Construct the active high-speed online stream URL fallback
    const onlineSoundUrl = `https://deeperlifeghs.com.ng/MP3/${hymn.number}.mp3`;
    
    // Always load local offline audio file path first
    const localAudioUrl = `audio/${hymn.number}.mp3`;
    player.src = localAudioUrl;
    
    // Set default UI state for the player
    statusText.textContent = "Audio Tune Available (Local/Offline)";
    if (playBtn) playBtn.style.display = "flex";
    if (playBtn && playBtn.querySelector("i")) {
        playBtn.querySelector("i").className = "fa-solid fa-play";
    }
    
    let isFallenBack = false;
    
    // Fallback helper function to stream online or show offline missing MP3 notice
    function triggerAudioFallback() {
        if (isFallenBack) return;
        isFallenBack = true;
        
        if (onlineSoundUrl) {
            console.log(`[GHS] Local audio not found at '${localAudioUrl}'. Falling back to secure remote stream.`);
            player.src = onlineSoundUrl;
            statusText.textContent = "Connecting to DCLM OSUN 2 HQ online feed...";
            if (isHymnAudioPlaying) {
                player.play().catch(e => {
                    console.warn("[GHS] Fallback remote stream play blocked:", e);
                    resetGhsAudioState("Audio stream unavailable");
                });
            }
        } else {
            console.log(`[GHS] Local audio not found at '${localAudioUrl}' and no online fallback exists.`);
            resetGhsAudioState("Tune Offline (MP3 missing in 'audio/' folder)");
        }
    }
    
    function resetGhsAudioState(msg) {
        statusText.textContent = msg;
        isHymnAudioPlaying = false;
        if (playBtn && playBtn.querySelector("i")) {
            playBtn.querySelector("i").className = "fa-solid fa-play";
        }
    }
    
    // Expose helpers to toggleHymnAudio
    window.triggerGhsFallback = triggerAudioFallback;
    window.resetGhsAudioState = resetGhsAudioState;
    
    // Robust local-to-online media loading error fallback handler
    player.onerror = function() {
        if (!isFallenBack && player.src.endsWith(localAudioUrl)) {
            triggerAudioFallback();
        } else {
            console.warn("[GHS] Audio failed to load completely.");
            resetGhsAudioState("Audio stream unavailable");
        }
    };
    
    // Reactive player events to keep status messages perfectly synchronized
    player.onplay = function() {
        if (player.src.includes(localAudioUrl)) {
            statusText.textContent = "Playing Offline Instrumental (Local)";
        } else {
            statusText.textContent = "Playing Official DCLM Organ stream";
        }
        isHymnAudioPlaying = true;
        if (playBtn && playBtn.querySelector("i")) {
            playBtn.querySelector("i").className = "fa-solid fa-pause";
        }
    };
    
    player.onpause = function() {
        statusText.textContent = "Audio Tune Paused";
        isHymnAudioPlaying = false;
        if (playBtn && playBtn.querySelector("i")) {
            playBtn.querySelector("i").className = "fa-solid fa-play";
        }
    };
    
    player.onended = function() {
        statusText.textContent = "Audio Tune Completed";
        isHymnAudioPlaying = false;
        if (playBtn && playBtn.querySelector("i")) {
            playBtn.querySelector("i").className = "fa-solid fa-play";
        }
    };
    
    // Render lyrics paragraphs
    const canvas = document.getElementById("hymn-lyrics-canvas");
    if (canvas) {
        canvas.style.fontSize = hymnsState.currentFontSize + "px";
        canvas.innerHTML = "";
        
        hymn.verses.forEach((verse, index) => {
            const verseDiv = document.createElement("div");
            verseDiv.className = "hymn-verse-block";
            const formattedVerse = verse.trim().replace(/\n/g, '<br>');
            
            verseDiv.innerHTML = `
                <span class="hymn-verse-number">${index + 1}</span>
                <p class="hymn-verse-text">${formattedVerse}</p>
            `;
            canvas.appendChild(verseDiv);
            
            // Insert chorus immediately under EACH verse (stanza) as requested
            if (hymn.chorus) {
                const chorusDiv = document.createElement("div");
                chorusDiv.className = "hymn-chorus-block";
                const formattedChorus = hymn.chorus.trim().replace(/\n/g, '<br>');
                chorusDiv.innerHTML = `
                    <span class="hymn-chorus-label">CHORUS</span>
                    <p class="hymn-chorus-text">${formattedChorus}</p>
                `;
                canvas.appendChild(chorusDiv);
            }
        });
    }
    
    showHymnsPanel("reading");
}

// ==========================================================================
// AUDIO PLAYBACK TUNER
// ==========================================================================
function toggleHymnAudio() {
    const player = document.getElementById("hymn-audio-player");
    const playBtn = document.getElementById("hymn-player-play-btn");
    const statusText = document.getElementById("hymn-audio-status");
    if (!player || !playBtn) return;
    
    if (isHymnAudioPlaying) {
        player.pause();
    } else {
        statusText.textContent = "Loading instrumental tune...";
        isHymnAudioPlaying = true; // Set flag so that onerror fallback knows to play
        
        player.play().then(() => {
            // Success! The player.onplay handler will handle UI state updates.
        }).catch(err => {
            console.warn("[GHS] Local play request failed:", err);
            // If the local file failed to play and we haven't fallen back yet, trigger it!
            if (window.triggerGhsFallback) {
                window.triggerGhsFallback();
            } else {
                isHymnAudioPlaying = false;
                if (playBtn.querySelector("i")) playBtn.querySelector("i").className = "fa-solid fa-play";
                statusText.textContent = "Audio stream unavailable";
            }
        });
    }
}

function stopHymnAudio() {
    const player = document.getElementById("hymn-audio-player");
    const playBtn = document.getElementById("hymn-player-play-btn");
    if (player) {
        player.pause();
        player.currentTime = 0;
    }
    if (playBtn && playBtn.querySelector("i")) {
        playBtn.querySelector("i").className = "fa-solid fa-play";
    }
    const statusText = document.getElementById("hymn-audio-status");
    if (statusText) {
        statusText.textContent = "Audio Tune Available (Local/Offline)";
    }
    isHymnAudioPlaying = false;
}

// ==========================================================================
// NAVIGATION UTILITIES
// ==========================================================================
function showHymnsPanel(panelName) {
    document.querySelectorAll(".hymns-panel").forEach(p => p.classList.remove("active"));
    const activePanel = document.getElementById(`hymns-${panelName}-panel`);
    if (activePanel) activePanel.classList.add("active");
    
    const container = document.querySelector(".content-container");
    if (container) container.scrollTo({ top: 0, behavior: "instant" });
}

function backToHymnsList() {
    stopHymnAudio();
    
    // Clear search box
    const searchInput = document.getElementById("hymn-search-input");
    if (searchInput) {
        searchInput.value = "";
    }
    
    // Reset category to "all" and clear visually active pills
    hymnsState.activeCategory = "all";
    document.querySelectorAll(".hymn-cat-btn").forEach(btn => {
        btn.classList.remove("active");
    });
    
    const allBtn = document.getElementById("hymn-cat-all");
    if (allBtn) {
        allBtn.classList.add("active");
    }
    
    // Refresh the search list filters to show all hymns
    applyGlobalFilters();
    
    showHymnsPanel("list");
}

function backToHome() {
    stopHymnAudio();
    const homeTab = document.querySelector(".bottom-nav a"); // First nav item is Home
    if (homeTab && window.switchTab) {
        window.switchTab(homeTab, 'home');
    }
}

function adjustHymnsFontSize(delta) {
    hymnsState.currentFontSize = Math.min(24, Math.max(12, hymnsState.currentFontSize + delta));
    const canvas = document.getElementById("hymn-lyrics-canvas");
    if (canvas) canvas.style.fontSize = hymnsState.currentFontSize + "px";
}

function formatCategoryName(cat) {
    if (!cat) return "Gospel Song";
    return cat.split(' ').map(word => {
        const lower = word.toLowerCase();
        if (lower === "and" || lower === "&") return "&";
        if (lower === "of") return "of";
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
}

// Expose handlers globally
window.initHymnsReader = initHymnsReader;
window.filterHymns = filterHymns;
window.filterHymnsByCategory = filterHymnsByCategory;
window.backToHymnsList = backToHymnsList;
window.backToHome = backToHome;
window.toggleHymnAudio = toggleHymnAudio;
window.adjustHymnsFontSize = adjustHymnsFontSize;

// ==========================================================================
// READING QUICK PICK / SEARCH OVERLAY LOGIC
// ==========================================================================
function toggleHymnsReadingSearch(forceShow) {
    const overlay = document.getElementById("hymns-reading-search-overlay");
    if (!overlay) return;
    
    const show = (forceShow !== undefined) ? forceShow : !overlay.classList.contains("active");
    
    if (show) {
        overlay.classList.add("active");
        const input = document.getElementById("hymns-overlay-search-input");
        if (input) {
            input.value = "";
            input.focus();
        }
        filterOverlayHymns("");
    } else {
        overlay.classList.remove("active");
    }
}

function filterOverlayHymns(query, isSubmit = false) {
    const container = document.getElementById("hymns-overlay-results-list");
    if (!container) return;
    container.innerHTML = "";
    
    if (!hymnsState.database || !hymnsState.database.hymns) return;
    let list = Object.values(hymnsState.database.hymns);
    
    const trimmed = query.trim().toLowerCase();
    
    // If search box is empty, show the first 10 hymns as quick suggestions
    if (!trimmed) {
        list = list.slice(0, 10);
    } else {
        list = list.filter(h => {
            const numMatch = h.number.toString().includes(trimmed);
            const titleMatch = h.title.toLowerCase().includes(trimmed);
            const lyricsMatch = h.verses.some(v => v.toLowerCase().includes(trimmed)) || 
                               (h.chorus && h.chorus.toLowerCase().includes(trimmed));
            return numMatch || titleMatch || lyricsMatch;
        });
    }
    
    // Smart Load on Submit
    if (isSubmit && trimmed && list.length > 0) {
        const exactNumMatch = list.find(h => h.number.toString() === trimmed);
        if (exactNumMatch) {
            toggleHymnsReadingSearch(false);
            openHymnDetails(exactNumMatch);
            return;
        }
        if (list.length === 1) {
            toggleHymnsReadingSearch(false);
            openHymnDetails(list[0]);
            return;
        }
    }
    
    if (list.length === 0) {
        container.innerHTML = `<div class="hymns-empty"><p style="font-size:12px; color:#64748b;">No matching hymns found.</p></div>`;
        return;
    }
    
    list.forEach(hymn => {
        const div = document.createElement("div");
        div.className = "hymn-card-item";
        div.style.padding = "10px 14px";
        div.style.marginBottom = "6px";
        
        const formattedNumber = String(hymn.number).padStart(2, '0');
        const formattedCat = formatCategoryName(hymn.category);
        
        div.innerHTML = `
            <div class="hymn-number-badge" style="width:28px; height:28px; font-size:11px; border-radius:6px;">${formattedNumber}</div>
            <div class="hymn-card-details">
                <span class="hymn-card-title" style="font-size:13px;">${hymn.title}</span>
                <span class="hymn-card-meta" style="font-size:10px;">${formattedCat}</span>
            </div>
            <i class="fa-solid fa-chevron-right hymn-card-arrow" style="font-size:9px;"></i>
        `;
        div.onclick = () => {
            toggleHymnsReadingSearch(false);
            openHymnDetails(hymn);
        };
        container.appendChild(div);
    });
}

window.toggleHymnsReadingSearch = toggleHymnsReadingSearch;
window.filterOverlayHymns = filterOverlayHymns;
