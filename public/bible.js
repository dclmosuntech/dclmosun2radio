// ============================================================
// DCLM OSUN II — Full Featured KJV Bible Reader (Offline)
// Features: Book/Chapter Navigation, Search, Highlight, Bookmarks, Daily Verse
// Data: KJV_BIBLE embedded local data from kjv-bible.js (zero network calls)
// ============================================================

const BIBLE_BOOKS = [
    // Old Testament
    "Genesis","Exodus","Leviticus","Numbers","Deuteronomy",
    "Joshua","Judges","Ruth","1 Samuel","2 Samuel",
    "1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra",
    "Nehemiah","Esther","Job","Psalms","Proverbs",
    "Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations",
    "Ezekiel","Daniel","Hosea","Joel","Amos",
    "Obadiah","Jonah","Micah","Nahum","Habakkuk",
    "Zephaniah","Haggai","Zechariah","Malachi",
    // New Testament
    "Matthew","Mark","Luke","John","Acts",
    "Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians",
    "Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy",
    "2 Timothy","Titus","Philemon","Hebrews","James",
    "1 Peter","2 Peter","1 John","2 John","3 John",
    "Jude","Revelation"
];

const BIBLE_CHAPTER_COUNTS = {
    "Genesis":50,"Exodus":40,"Leviticus":27,"Numbers":36,"Deuteronomy":34,
    "Joshua":24,"Judges":21,"Ruth":4,"1 Samuel":31,"2 Samuel":24,
    "1 Kings":22,"2 Kings":25,"1 Chronicles":29,"2 Chronicles":36,"Ezra":10,
    "Nehemiah":13,"Esther":10,"Job":42,"Psalms":150,"Proverbs":31,
    "Ecclesiastes":12,"Song of Solomon":8,"Isaiah":66,"Jeremiah":52,"Lamentations":5,
    "Ezekiel":48,"Daniel":12,"Hosea":14,"Joel":3,"Amos":9,
    "Obadiah":1,"Jonah":4,"Micah":7,"Nahum":3,"Habakkuk":3,
    "Zephaniah":3,"Haggai":2,"Zechariah":14,"Malachi":4,
    "Matthew":28,"Mark":16,"Luke":24,"John":21,"Acts":28,
    "Romans":16,"1 Corinthians":16,"2 Corinthians":13,"Galatians":6,"Ephesians":6,
    "Philippians":4,"Colossians":4,"1 Thessalonians":5,"2 Thessalonians":3,"1 Timothy":6,
    "2 Timothy":4,"Titus":3,"Philemon":1,"Hebrews":13,"James":5,
    "1 Peter":5,"2 Peter":3,"1 John":5,"2 John":1,"3 John":1,
    "Jude":1,"Revelation":22
};

// Book name mapping: KJV_BIBLE uses compact names like "1Samuel", "SongofSolomon"
// but app uses spaced names "1 Samuel", "Song of Solomon"
// Build a normalised lookup on first access
let _kjvLookup = null;
function _normBookName(name) {
    return String(name).replace(/\s+/g, '').toLowerCase();
}
function getKjvLookup() {
    if (_kjvLookup) return _kjvLookup;
    _kjvLookup = {};
    if (typeof KJV_BIBLE === 'undefined') return _kjvLookup;
    for (const bookObj of KJV_BIBLE) {
        // Store under raw name (e.g. "1Samuel") AND normalised key (e.g. "1samuel")
        // This allows app names like "1 Samuel" -> normalised "1samuel" to match "1Samuel"
        _kjvLookup[bookObj.book] = bookObj;
        _kjvLookup[_normBookName(bookObj.book)] = bookObj;
    }
    return _kjvLookup;
}

function getChapterVerses(bookName, chapterNum) {
    const lookup = getKjvLookup();
    // Try exact then normalised (strips spaces from "1 Samuel" -> "1samuel")
    const bookObj = lookup[bookName] || lookup[_normBookName(bookName)];
    if (!bookObj) return null;
    const chapterObj = bookObj.chapters.find(c => String(c.chapter) === String(chapterNum));
    if (!chapterObj) return null;
    return chapterObj.verses.map(v => ({ verse: parseInt(v.verse), text: v.text }));
}

const DAILY_VERSES = [
    { ref: "John 3:16", text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life." },
    { ref: "Psalms 23:1", text: "The LORD is my shepherd; I shall not want." },
    { ref: "Philippians 4:13", text: "I can do all things through Christ which strengtheneth me." },
    { ref: "Proverbs 3:5", text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding." },
    { ref: "Isaiah 40:31", text: "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint." },
    { ref: "Romans 8:28", text: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose." },
    { ref: "Jeremiah 29:11", text: "For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end." },
    { ref: "Matthew 6:33", text: "But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you." },
    { ref: "Psalms 119:105", text: "Thy word is a lamp unto my feet, and a light unto my path." },
    { ref: "2 Timothy 3:16", text: "All scripture is given by inspiration of God, and is profitable for doctrine, for reproof, for correction, for instruction in righteousness." },
    { ref: "Joshua 1:9", text: "Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest." },
    { ref: "Psalms 46:1", text: "God is our refuge and strength, a very present help in trouble." },
    { ref: "Romans 10:17", text: "So then faith cometh by hearing, and hearing by the word of God." },
    { ref: "Hebrews 11:1", text: "Now faith is the substance of things hoped for, the evidence of things not seen." },
    { ref: "Ephesians 2:8", text: "For by grace are ye saved through faith; and that not of yourselves: it is the gift of God." },
    { ref: "1 Corinthians 13:13", text: "And now abideth faith, hope, charity, these three; but the greatest of these is charity." },
    { ref: "Proverbs 22:6", text: "Train up a child in the way he should go: and when he is old, he will not depart from it." },
    { ref: "Psalms 37:4", text: "Delight thyself also in the LORD: and he shall give thee the desires of thine heart." },
    { ref: "John 14:6", text: "Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me." },
    { ref: "Revelation 21:4", text: "And God shall wipe away all tears from their eyes; and there shall be no more death, neither sorrow, nor crying, neither shall there be any more pain: for the former things are passed away." },
    { ref: "Matthew 5:8", text: "Blessed are the pure in heart: for they shall see God." },
    { ref: "1 John 4:8", text: "He that loveth not knoweth not God; for God is love." },
    { ref: "Psalms 27:1", text: "The LORD is my light and my salvation; whom shall I fear? the LORD is the strength of my life; of whom shall I be afraid?" },
    { ref: "Galatians 5:22", text: "But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith." },
    { ref: "Numbers 6:24", text: "The LORD bless thee, and keep thee." },
    { ref: "Deuteronomy 31:6", text: "Be strong and of a good courage, fear not, nor be afraid of them: for the LORD thy God, he it is that doth go with thee; he will not fail thee, nor forsake thee." },
    { ref: "John 11:25", text: "Jesus said unto her, I am the resurrection, and the life: he that believeth in me, though he were dead, yet shall he live." },
    { ref: "Romans 1:16", text: "For I am not ashamed of the gospel of Christ: for it is the power of God unto salvation to every one that believeth." },
    { ref: "Psalms 91:1", text: "He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty." },
    { ref: "James 1:5", text: "If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him." },
    { ref: "John 1:1", text: "In the beginning was the Word, and the Word was with God, and the Word was God." }
];

// ── Bible State ──
let bibleState = {
    currentBook: "John",
    currentChapter: 1,
    currentVerses: [],
    highlights: {},
    bookmarks: [],
    fontSize: 16,
    activePanel: "reader",
    isLoading: false
};

// ── Load from localStorage ──
function loadBibleStorage() {
    try {
        const saved = localStorage.getItem("dclm_bible_data");
        if (saved) {
            const parsed = JSON.parse(saved);
            bibleState.highlights = parsed.highlights || {};
            bibleState.bookmarks = parsed.bookmarks || [];
            bibleState.fontSize = parsed.fontSize || 16;
            bibleState.currentBook = parsed.currentBook || "John";
            bibleState.currentChapter = parsed.currentChapter || 1;
        }
    } catch(e) {}
}

function saveBibleStorage() {
    try {
        localStorage.setItem("dclm_bible_data", JSON.stringify({
            highlights: bibleState.highlights,
            bookmarks: bibleState.bookmarks,
            fontSize: bibleState.fontSize,
            currentBook: bibleState.currentBook,
            currentChapter: bibleState.currentChapter
        }));
    } catch(e) {}
}

// ============================================================
// RENDER BIBLE VIEW
// ============================================================
window.renderBibleView = function() {
    loadBibleStorage();
    // Pre-warm the lookup index
    getKjvLookup();

    const container = document.getElementById("bible-view");
    if (!container) return;

    container.innerHTML = `
        <div class="bible-reader-wrap">

            <!-- Daily Verse Banner -->
            <div class="daily-verse-card" id="daily-verse-card">
                <div class="dv-label"><i class="fa-solid fa-sun"></i> VERSE OF THE DAY</div>
                <p class="dv-text" id="dv-text">Loading...</p>
                <p class="dv-ref" id="dv-ref"></p>
            </div>

            <!-- Bible Panel Tabs -->
            <div class="bible-panel-tabs">
                <button class="bpt active" id="bpt-reader" onclick="switchBiblePanel('reader')">
                    <i class="fa-solid fa-book-open"></i> Read
                </button>
                <button class="bpt" id="bpt-search" onclick="switchBiblePanel('search')">
                    <i class="fa-solid fa-magnifying-glass"></i> Search
                </button>
                <button class="bpt" id="bpt-bookmarks" onclick="switchBiblePanel('bookmarks')">
                    <i class="fa-solid fa-bookmark"></i> Saved
                </button>
            </div>

            <!-- READER PANEL -->
            <div class="bible-panel active" id="bible-panel-reader">

                <!-- Book + Chapter Selectors -->
                <div class="bible-nav-row">
                    <select id="bible-book-select" class="bible-select" onchange="onBibleBookChange()">
                        ${BIBLE_BOOKS.map(b => `<option value="${b}" ${b === bibleState.currentBook ? 'selected' : ''}>${b}</option>`).join('')}
                    </select>
                    <select id="bible-chapter-select" class="bible-select" onchange="onBibleChapterChange()">
                        ${generateChapterOptions(bibleState.currentBook, bibleState.currentChapter)}
                    </select>
                </div>

                <!-- Font Size Controls -->
                <div class="bible-font-row">
                    <span class="bible-location-label" id="bible-location-label">${bibleState.currentBook} ${bibleState.currentChapter}</span>
                    <div class="font-controls">
                        <button onclick="changeFontSize(-1)" class="font-btn">A-</button>
                        <button onclick="changeFontSize(1)" class="font-btn">A+</button>
                    </div>
                </div>

                <!-- Verses Display -->
                <div class="verses-container" id="verses-container">
                    <div class="bible-loading"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</div>
                </div>

                <!-- Chapter Navigation Arrows -->
                <div class="chapter-nav-btns">
                    <button class="chap-nav-btn" onclick="navigateChapter(-1)">
                        <i class="fa-solid fa-chevron-left"></i> Previous
                    </button>
                    <button class="chap-nav-btn" onclick="navigateChapter(1)">
                        Next <i class="fa-solid fa-chevron-right"></i>
                    </button>
                </div>
            </div>

            <!-- SEARCH PANEL -->
            <div class="bible-panel" id="bible-panel-search">
                <div class="bible-search-box">
                    <i class="fa-solid fa-magnifying-glass search-icon-inner"></i>
                    <input type="text" id="bible-search-input" placeholder="Search the scriptures..." class="bible-search-input" onkeydown="if(event.key==='Enter') runBibleSearch()">
                    <button class="bible-search-btn" onclick="runBibleSearch()">Search</button>
                </div>
                <div id="bible-search-results" class="bible-search-results">
                    <div class="search-placeholder">
                        <i class="fa-solid fa-book-bible"></i>
                        <p>Enter a word or phrase to search the KJV Bible</p>
                    </div>
                </div>
            </div>

            <!-- BOOKMARKS PANEL -->
            <div class="bible-panel" id="bible-panel-bookmarks">
                <div id="bookmarks-list" class="bookmarks-list"></div>
            </div>

        </div>

        <!-- Verse Action Popup -->
        <div class="verse-action-popup" id="verse-action-popup">
            <button onclick="highlightSelectedVerse()" class="vap-btn"><i class="fa-solid fa-highlighter"></i> Highlight</button>
            <button onclick="bookmarkSelectedVerse()" class="vap-btn"><i class="fa-solid fa-bookmark"></i> Bookmark</button>
            <button onclick="copySelectedVerse()" class="vap-btn"><i class="fa-solid fa-copy"></i> Copy</button>
            <button onclick="closeVersePopup()" class="vap-btn vap-close"><i class="fa-solid fa-xmark"></i></button>
        </div>
    `;

    renderDailyVerse();
    loadChapter(bibleState.currentBook, bibleState.currentChapter);
    renderBookmarks();
}

// ── Daily Verse ──
function renderDailyVerse() {
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    const verse = DAILY_VERSES[dayOfYear % DAILY_VERSES.length];
    const dvText = document.getElementById("dv-text");
    const dvRef = document.getElementById("dv-ref");
    if (dvText) dvText.textContent = `"${verse.text}"`;
    if (dvRef) dvRef.textContent = `— ${verse.ref} (KJV)`;
}

// ── Generate Chapter Options ──
function generateChapterOptions(book, selected) {
    const count = BIBLE_CHAPTER_COUNTS[book] || 1;
    let html = "";
    for (let i = 1; i <= count; i++) {
        html += `<option value="${i}" ${i === selected ? 'selected' : ''}>Chapter ${i}</option>`;
    }
    return html;
}

// ── Load Chapter — instant from local data ──
function loadChapter(book, chapter) {
    if (bibleState.isLoading) return Promise.resolve();
    bibleState.isLoading = true;

    const container = document.getElementById("verses-container");
    if (!container) { bibleState.isLoading = false; return Promise.resolve(); }

    // All data is local — get it synchronously
    const verses = getChapterVerses(book, chapter);

    if (verses && verses.length > 0) {
        bibleState.currentVerses = verses;
        renderVerses(verses);
    } else {
        container.innerHTML = `<div class="bible-error"><i class="fa-solid fa-exclamation-triangle"></i> Chapter data unavailable offline.</div>`;
    }

    bibleState.isLoading = false;

    // Update labels
    const label = document.getElementById("bible-location-label");
    if (label) label.textContent = `${book} ${chapter}`;

    // Save last position
    bibleState.currentBook = book;
    bibleState.currentChapter = chapter;
    saveBibleStorage();

    // Scroll verses to top
    if (container) container.scrollTop = 0;

    return Promise.resolve();
}

// ── Render Verses ──
function renderVerses(verses) {
    const container = document.getElementById("verses-container");
    if (!container) return;

    const highlightKey = `${bibleState.currentBook}_${bibleState.currentChapter}`;
    const chapterHighlights = bibleState.highlights[highlightKey] || [];

    container.innerHTML = verses.map(v => {
        const isHighlighted = chapterHighlights.includes(v.verse);
        return `
            <div class="verse-block ${isHighlighted ? 'highlighted' : ''}" 
                 id="verse-${v.verse}" 
                 data-verse="${v.verse}"
                 style="font-size: ${bibleState.fontSize}px"
                 onclick="onVerseTap(${v.verse}, this)">
                <span class="verse-num">${v.verse}</span>
                <span class="verse-text">${v.text.trim()}</span>
            </div>
        `;
    }).join('');
}

// ── Verse Tap Handler ──
let selectedVerseNum = null;
let selectedVerseEl = null;

function onVerseTap(verseNum, el) {
    document.querySelectorAll(".verse-block.selected").forEach(v => v.classList.remove("selected"));
    selectedVerseNum = verseNum;
    selectedVerseEl = el;
    el.classList.add("selected");
    const popup = document.getElementById("verse-action-popup");
    if (popup) popup.classList.add("visible");
}

function closeVersePopup() {
    const popup = document.getElementById("verse-action-popup");
    if (popup) popup.classList.remove("visible");
    document.querySelectorAll(".verse-block.selected").forEach(v => v.classList.remove("selected"));
    selectedVerseNum = null;
    selectedVerseEl = null;
}

// ── Highlight ──
function highlightSelectedVerse() {
    if (selectedVerseNum === null) return;
    const key = `${bibleState.currentBook}_${bibleState.currentChapter}`;
    if (!bibleState.highlights[key]) bibleState.highlights[key] = [];
    const idx = bibleState.highlights[key].indexOf(selectedVerseNum);
    if (idx === -1) {
        bibleState.highlights[key].push(selectedVerseNum);
        if (selectedVerseEl) selectedVerseEl.classList.add("highlighted");
    } else {
        bibleState.highlights[key].splice(idx, 1);
        if (selectedVerseEl) selectedVerseEl.classList.remove("highlighted");
    }
    saveBibleStorage();
    closeVersePopup();
}

// ── Bookmark ──
function bookmarkSelectedVerse() {
    if (selectedVerseNum === null || !bibleState.currentVerses.length) return;
    const verseData = bibleState.currentVerses.find(v => v.verse === selectedVerseNum);
    if (!verseData) return;

    const bookmark = {
        book: bibleState.currentBook,
        chapter: bibleState.currentChapter,
        verse: selectedVerseNum,
        text: verseData.text.trim(),
        savedAt: new Date().toISOString()
    };

    const exists = bibleState.bookmarks.find(b => b.book === bookmark.book && b.chapter === bookmark.chapter && b.verse === bookmark.verse);
    if (exists) {
        alert("This verse is already bookmarked!");
        closeVersePopup();
        return;
    }

    bibleState.bookmarks.unshift(bookmark);
    saveBibleStorage();
    renderBookmarks();
    closeVersePopup();
    showToast("Verse bookmarked! ✨");
}

// ── Copy Verse ──
function copySelectedVerse() {
    if (selectedVerseNum === null || !bibleState.currentVerses.length) return;
    const verseData = bibleState.currentVerses.find(v => v.verse === selectedVerseNum);
    if (!verseData) return;
    const text = `${bibleState.currentBook} ${bibleState.currentChapter}:${selectedVerseNum} (KJV)\n"${verseData.text.trim()}"`;
    navigator.clipboard.writeText(text).then(() => {
        showToast("Verse copied! 📋");
    }).catch(() => {
        showToast("Could not copy — try again");
    });
    closeVersePopup();
}

// ── Render Bookmarks ──
function renderBookmarks() {
    const list = document.getElementById("bookmarks-list");
    if (!list) return;
    if (bibleState.bookmarks.length === 0) {
        list.innerHTML = `
            <div class="search-placeholder">
                <i class="fa-solid fa-bookmark"></i>
                <p>No bookmarks yet.<br>Tap any verse and press Bookmark to save it here.</p>
            </div>`;
        return;
    }
    list.innerHTML = bibleState.bookmarks.map((b, i) => `
        <div class="bookmark-card" onclick="goToBookmark('${b.book}', ${b.chapter}, ${b.verse})">
            <div class="bookmark-ref">
                <i class="fa-solid fa-bookmark" style="color:#38bdf8; margin-right:8px;"></i>
                ${b.book} ${b.chapter}:${b.verse}
            </div>
            <p class="bookmark-text">"${b.text}"</p>
            <button class="bookmark-del-btn" onclick="event.stopPropagation(); deleteBookmark(${i})">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function goToBookmark(book, chapter, verse) {
    bibleState.currentBook = book;
    bibleState.currentChapter = chapter;
    const bookSelect = document.getElementById("bible-book-select");
    const chapSelect = document.getElementById("bible-chapter-select");
    if (bookSelect) bookSelect.value = book;
    if (chapSelect) {
        chapSelect.innerHTML = generateChapterOptions(book, chapter);
        chapSelect.value = chapter;
    }
    switchBiblePanel("reader");
    loadChapter(book, chapter).then(() => {
        setTimeout(() => {
            const verseEl = document.getElementById(`verse-${verse}`);
            if (verseEl) verseEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 200);
    });
}

function deleteBookmark(index) {
    bibleState.bookmarks.splice(index, 1);
    saveBibleStorage();
    renderBookmarks();
}

// ── Search — fully offline, searches KJV_BIBLE in memory ──
function runBibleSearch() {
    const query = document.getElementById("bible-search-input")?.value.trim().toLowerCase();
    if (!query || query.length < 2) {
        alert("Please enter at least 2 characters to search.");
        return;
    }

    const resultsEl = document.getElementById("bible-search-results");
    resultsEl.innerHTML = `<div class="bible-loading"><i class="fa-solid fa-spinner fa-spin"></i> Searching KJV Bible...</div>`;

    // Defer to next frame so the spinner shows before blocking the main thread
    setTimeout(() => {
        const results = [];
        if (typeof KJV_BIBLE !== 'undefined') {
            for (const bookObj of KJV_BIBLE) {
                for (const chapterObj of bookObj.chapters) {
                    for (const v of chapterObj.verses) {
                        if (v.text.toLowerCase().includes(query)) {
                            results.push({
                                book: bookObj.book,
                                chapter: chapterObj.chapter,
                                verse: v.verse,
                                text: v.text
                            });
                            if (results.length >= 100) break; // cap at 100 results
                        }
                    }
                    if (results.length >= 100) break;
                }
                if (results.length >= 100) break;
            }
        }

        if (results.length > 0) {
            resultsEl.innerHTML = `
                <p class="search-count">${results.length}${results.length >= 100 ? '+' : ''} result(s) for "<strong>${query}</strong>"</p>
                ${results.map(v => `
                    <div class="search-result-card" onclick="goToBookmark('${v.book}', ${v.chapter}, ${v.verse})">
                        <div class="sr-ref">${v.book} ${v.chapter}:${v.verse}</div>
                        <p class="sr-text">${v.text.trim()}</p>
                    </div>
                `).join('')}
            `;
        } else {
            resultsEl.innerHTML = `
                <div class="search-placeholder">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <p>No results found for "<strong>${query}</strong>"</p>
                </div>`;
        }
    }, 50);
}

// ── Navigation Helpers ──
function onBibleBookChange() {
    const book = document.getElementById("bible-book-select")?.value;
    if (!book) return;
    bibleState.currentBook = book;
    bibleState.currentChapter = 1;
    const chapSelect = document.getElementById("bible-chapter-select");
    if (chapSelect) chapSelect.innerHTML = generateChapterOptions(book, 1);
    loadChapter(book, 1);
}

function onBibleChapterChange() {
    const chapter = parseInt(document.getElementById("bible-chapter-select")?.value);
    if (!chapter) return;
    loadChapter(bibleState.currentBook, chapter);
}

function navigateChapter(direction) {
    const maxChapters = BIBLE_CHAPTER_COUNTS[bibleState.currentBook] || 1;
    let newChapter = bibleState.currentChapter + direction;

    if (newChapter < 1) {
        const bookIdx = BIBLE_BOOKS.indexOf(bibleState.currentBook);
        if (bookIdx > 0) {
            bibleState.currentBook = BIBLE_BOOKS[bookIdx - 1];
            newChapter = BIBLE_CHAPTER_COUNTS[bibleState.currentBook];
            updateBookSelect();
        } else { return; }
    } else if (newChapter > maxChapters) {
        const bookIdx = BIBLE_BOOKS.indexOf(bibleState.currentBook);
        if (bookIdx < BIBLE_BOOKS.length - 1) {
            bibleState.currentBook = BIBLE_BOOKS[bookIdx + 1];
            newChapter = 1;
            updateBookSelect();
        } else { return; }
    }

    bibleState.currentChapter = newChapter;
    const chapSelect = document.getElementById("bible-chapter-select");
    if (chapSelect) {
        chapSelect.innerHTML = generateChapterOptions(bibleState.currentBook, newChapter);
        chapSelect.value = newChapter;
    }
    loadChapter(bibleState.currentBook, newChapter);
}

function updateBookSelect() {
    const bookSelect = document.getElementById("bible-book-select");
    if (bookSelect) bookSelect.value = bibleState.currentBook;
}

function changeFontSize(delta) {
    bibleState.fontSize = Math.min(24, Math.max(12, bibleState.fontSize + delta));
    document.querySelectorAll(".verse-block").forEach(el => {
        el.style.fontSize = bibleState.fontSize + "px";
    });
    saveBibleStorage();
}

function switchBiblePanel(panel) {
    bibleState.activePanel = panel;
    document.querySelectorAll(".bible-panel").forEach(p => p.classList.remove("active"));
    document.querySelectorAll(".bpt").forEach(b => b.classList.remove("active"));
    const panelEl = document.getElementById(`bible-panel-${panel}`);
    const tabEl = document.getElementById(`bpt-${panel}`);
    if (panelEl) panelEl.classList.add("active");
    if (tabEl) tabEl.classList.add("active");
    if (panel === "bookmarks") renderBookmarks();
}

// ── Toast Notification ──
function showToast(message) {
    let toast = document.getElementById("bible-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "bible-toast";
        toast.className = "bible-toast";
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("visible");
    setTimeout(() => toast.classList.remove("visible"), 2500);
}