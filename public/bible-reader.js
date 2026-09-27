// ==========================================================================
// DCLM OSUN II — Bible Reader Module (KJV — Fully Offline)
// Flow: Books → Chapters → Verses (number grid) → Reading view
// Data: Embedded KJV_BIBLE constant from kjv-bible.js (zero network calls)
// ==========================================================================

const bibleState = {
    selectedBook: null,
    selectedChapter: null,
    selectedVerse: null,
    currentFontSize: 15,
    totalChapters: 0,
    testamentFilter: "all"
};

// ── Build a fast lookup index from KJV_BIBLE on first access ──
// KJV_BIBLE = [{book, chapters:[{chapter, verses:[{verse,text}]}]}]
let _bibleIndex = null; // { "Genesis": { "1": [{verse,text},...], ... }, ... }

// Normalise a book name to a compact lowercase key for lookup
function _normBook(name) {
    return String(name).replace(/\s+/g, '').toLowerCase();
}

function getBibleIndex() {
    if (_bibleIndex) return _bibleIndex;
    _bibleIndex = {};
    if (typeof KJV_BIBLE === 'undefined') {
        console.error("[Bible] KJV_BIBLE data not loaded! Make sure kjv-bible.js is included before bible-reader.js.");
        return _bibleIndex;
    }
    for (const bookObj of KJV_BIBLE) {
        const chapters = {};
        for (const chapterObj of bookObj.chapters) {
            chapters[String(chapterObj.chapter)] = chapterObj.verses.map(v => ({
                verse: parseInt(v.verse),
                text: v.text
            }));
        }
        // Store under raw name AND normalised (no-space, lowercase) key
        // This allows "1 Samuel" to find "1Samuel" and "SongofSolomon" etc.
        _bibleIndex[bookObj.book] = chapters;
        _bibleIndex[_normBook(bookObj.book)] = chapters;
    }
    console.log(`[Bible] Index built: ${Object.keys(KJV_BIBLE).length || KJV_BIBLE.length} books loaded offline.`);
    return _bibleIndex;
}

// Instantly retrieve verses for a book+chapter from local data
function getVerses(bookName, chapterNum) {
    const index = getBibleIndex();
    // Try exact match first, then normalised (handles spaces/no-spaces differences)
    const chapterData = index[bookName] || index[_normBook(bookName)];
    if (!chapterData) return null;
    return chapterData[String(chapterNum)] || null;
}


const ALL_BIBLE_BOOKS = [
    { name: "Genesis", chapters: 50, test: "OT", cat: "Pentateuch" },
    { name: "Exodus", chapters: 40, test: "OT", cat: "Pentateuch" },
    { name: "Leviticus", chapters: 27, test: "OT", cat: "Pentateuch" },
    { name: "Numbers", chapters: 36, test: "OT", cat: "Pentateuch" },
    { name: "Deuteronomy", chapters: 34, test: "OT", cat: "Pentateuch" },
    { name: "Joshua", chapters: 24, test: "OT", cat: "History" },
    { name: "Judges", chapters: 21, test: "OT", cat: "History" },
    { name: "Ruth", chapters: 4, test: "OT", cat: "History" },
    { name: "1 Samuel", chapters: 31, test: "OT", cat: "History" },
    { name: "2 Samuel", chapters: 24, test: "OT", cat: "History" },
    { name: "1 Kings", chapters: 22, test: "OT", cat: "History" },
    { name: "2 Kings", chapters: 25, test: "OT", cat: "History" },
    { name: "1 Chronicles", chapters: 29, test: "OT", cat: "History" },
    { name: "2 Chronicles", chapters: 36, test: "OT", cat: "History" },
    { name: "Ezra", chapters: 10, test: "OT", cat: "History" },
    { name: "Nehemiah", chapters: 13, test: "OT", cat: "History" },
    { name: "Esther", chapters: 10, test: "OT", cat: "History" },
    { name: "Job", chapters: 42, test: "OT", cat: "Poetry & Wisdom" },
    { name: "Psalms", chapters: 150, test: "OT", cat: "Poetry & Wisdom" },
    { name: "Proverbs", chapters: 31, test: "OT", cat: "Poetry & Wisdom" },
    { name: "Ecclesiastes", chapters: 12, test: "OT", cat: "Poetry & Wisdom" },
    { name: "Song of Solomon", chapters: 8, test: "OT", cat: "Poetry & Wisdom" },
    { name: "Isaiah", chapters: 66, test: "OT", cat: "Major Prophets" },
    { name: "Jeremiah", chapters: 52, test: "OT", cat: "Major Prophets" },
    { name: "Lamentations", chapters: 5, test: "OT", cat: "Major Prophets" },
    { name: "Ezekiel", chapters: 48, test: "OT", cat: "Major Prophets" },
    { name: "Daniel", chapters: 12, test: "OT", cat: "Major Prophets" },
    { name: "Hosea", chapters: 14, test: "OT", cat: "Minor Prophets" },
    { name: "Joel", chapters: 3, test: "OT", cat: "Minor Prophets" },
    { name: "Amos", chapters: 9, test: "OT", cat: "Minor Prophets" },
    { name: "Obadiah", chapters: 1, test: "OT", cat: "Minor Prophets" },
    { name: "Jonah", chapters: 4, test: "OT", cat: "Minor Prophets" },
    { name: "Micah", chapters: 7, test: "OT", cat: "Minor Prophets" },
    { name: "Nahum", chapters: 3, test: "OT", cat: "Minor Prophets" },
    { name: "Habakkuk", chapters: 3, test: "OT", cat: "Minor Prophets" },
    { name: "Zephaniah", chapters: 3, test: "OT", cat: "Minor Prophets" },
    { name: "Haggai", chapters: 2, test: "OT", cat: "Minor Prophets" },
    { name: "Zechariah", chapters: 14, test: "OT", cat: "Minor Prophets" },
    { name: "Malachi", chapters: 4, test: "OT", cat: "Minor Prophets" },
    { name: "Matthew", chapters: 28, test: "NT", cat: "Gospels" },
    { name: "Mark", chapters: 16, test: "NT", cat: "Gospels" },
    { name: "Luke", chapters: 24, test: "NT", cat: "Gospels" },
    { name: "John", chapters: 21, test: "NT", cat: "Gospels" },
    { name: "Acts", chapters: 28, test: "NT", cat: "Acts / History" },
    { name: "Romans", chapters: 16, test: "NT", cat: "Epistles" },
    { name: "1 Corinthians", chapters: 16, test: "NT", cat: "Epistles" },
    { name: "2 Corinthians", chapters: 13, test: "NT", cat: "Epistles" },
    { name: "Galatians", chapters: 6, test: "NT", cat: "Epistles" },
    { name: "Ephesians", chapters: 6, test: "NT", cat: "Epistles" },
    { name: "Philippians", chapters: 4, test: "NT", cat: "Epistles" },
    { name: "Colossians", chapters: 4, test: "NT", cat: "Epistles" },
    { name: "1 Thessalonians", chapters: 5, test: "NT", cat: "Epistles" },
    { name: "2 Thessalonians", chapters: 3, test: "NT", cat: "Epistles" },
    { name: "1 Timothy", chapters: 6, test: "NT", cat: "Epistles" },
    { name: "2 Timothy", chapters: 4, test: "NT", cat: "Epistles" },
    { name: "Titus", chapters: 3, test: "NT", cat: "Epistles" },
    { name: "Philemon", chapters: 1, test: "NT", cat: "Epistles" },
    { name: "Hebrews", chapters: 13, test: "NT", cat: "Epistles" },
    { name: "James", chapters: 5, test: "NT", cat: "Epistles" },
    { name: "1 Peter", chapters: 5, test: "NT", cat: "Epistles" },
    { name: "2 Peter", chapters: 3, test: "NT", cat: "Epistles" },
    { name: "1 John", chapters: 5, test: "NT", cat: "Epistles" },
    { name: "2 John", chapters: 1, test: "NT", cat: "Epistles" },
    { name: "3 John", chapters: 1, test: "NT", cat: "Epistles" },
    { name: "Jude", chapters: 1, test: "NT", cat: "Epistles" },
    { name: "Revelation", chapters: 22, test: "NT", cat: "Prophecy" }
];

// ==========================================================================
// INIT
// ==========================================================================
function initBibleReader() {
    // Pre-build the index the first time the Bible tab is opened
    getBibleIndex();
    bibleState.testamentFilter = "all";
    updateTestamentSelectorStyles();
    renderBooksList(ALL_BIBLE_BOOKS);
    showBiblePanel('books');
    resetBibleTabs();
}

// ==========================================================================
// BOOKS
// ==========================================================================
function renderBooksList(books) {
    const container = document.getElementById("books-list");
    container.innerHTML = "";

    const activeFilter = bibleState.testamentFilter || "all";
    let filteredBooks = books;
    if (activeFilter === "ot") {
        filteredBooks = books.filter(b => b.test === "OT");
    } else if (activeFilter === "nt") {
        filteredBooks = books.filter(b => b.test === "NT");
    }

    function createBookElement(book) {
        const item = document.createElement("div");
        const isOt = book.test === "OT";
        item.className = `bible-book-item ${isOt ? 'ot-book' : 'nt-book'}` +
                         (bibleState.selectedBook === book.name ? " selected" : "");
        item.innerHTML = `
            <div class="book-details-left">
                <span class="bible-book-name">${book.name}</span>
                <span class="bible-book-meta">${book.chapters} Chapters • ${book.cat}</span>
            </div>
            <span class="testament-badge ${isOt ? 'ot-badge' : 'nt-badge'}">${book.test}</span>
        `;
        item.onclick = () => selectBook(book.name, book.chapters);
        return item;
    }

    if (activeFilter === "all" && filteredBooks.length === ALL_BIBLE_BOOKS.length) {
        const otHeader = document.createElement("div");
        otHeader.className = "testament-group-header ot-group-header";
        otHeader.innerHTML = `
            <i class="fa-solid fa-scroll"></i>
            <div>
                <h3>Old Testament</h3>
                <p>39 Books • Law, History, Poetry & Prophets</p>
            </div>
        `;
        container.appendChild(otHeader);

        filteredBooks.filter(b => b.test === "OT").forEach(book => {
            container.appendChild(createBookElement(book));
        });

        const ntHeader = document.createElement("div");
        ntHeader.className = "testament-group-header nt-group-header";
        ntHeader.innerHTML = `
            <i class="fa-solid fa-cross"></i>
            <div>
                <h3>New Testament</h3>
                <p>27 Books • Gospels, Epistles & Prophecy</p>
            </div>
        `;
        container.appendChild(ntHeader);

        filteredBooks.filter(b => b.test === "NT").forEach(book => {
            container.appendChild(createBookElement(book));
        });
    } else {
        filteredBooks.forEach(book => {
            container.appendChild(createBookElement(book));
        });
    }
}

function setTestamentFilter(filterValue) {
    bibleState.testamentFilter = filterValue;
    updateTestamentSelectorStyles();
    const searchInput = document.getElementById("bible-search-input");
    const query = searchInput ? searchInput.value.trim() : "";
    if (query) {
        filterBibleBooks(query);
    } else {
        renderBooksList(ALL_BIBLE_BOOKS);
    }
}

function updateTestamentSelectorStyles() {
    const filters = ["all", "ot", "nt"];
    filters.forEach(f => {
        const btn = document.getElementById(`test-filter-${f}`);
        if (btn) {
            btn.classList.toggle("active", bibleState.testamentFilter === f);
        }
    });
}

// ==========================================================================
// SELECT BOOK → go to Chapters instantly (no network call needed)
// ==========================================================================
function selectBook(bookName, chapterCount) {
    bibleState.selectedBook = bookName;
    bibleState.totalChapters = chapterCount;
    bibleState.selectedChapter = null;
    bibleState.selectedVerse = null;

    document.getElementById("tab-chapters").classList.remove("locked");
    document.getElementById("chapters-breadcrumb").textContent = bookName;

    const grid = document.getElementById("chapters-grid");
    grid.innerHTML = "";
    grid.className = "bible-chapters-grid";
    if (chapterCount > 100) {
        grid.classList.add("max-chapters");
    } else if (chapterCount > 40) {
        grid.classList.add("many-chapters");
    }

    for (let i = 1; i <= chapterCount; i++) {
        const btn = document.createElement("button");
        btn.className = "bible-chapter-btn";
        btn.textContent = i;
        btn.onclick = () => selectChapter(i);
        grid.appendChild(btn);
    }

    switchBibleTab("chapters");
}

// ==========================================================================
// SELECT CHAPTER → show Verses grid instantly from local data
// ==========================================================================
function selectChapter(chapterNum) {
    bibleState.selectedChapter = chapterNum;
    bibleState.selectedVerse = null;

    document.querySelectorAll(".bible-chapter-btn").forEach((btn, idx) => {
        btn.classList.toggle("selected", idx + 1 === chapterNum);
    });

    document.getElementById("tab-verses").classList.remove("locked");
    document.getElementById("verses-breadcrumb").textContent =
        `${bibleState.selectedBook} ${chapterNum}`;

    switchBibleTab("verses");

    // All data is local — this is instant, no spinner needed
    const verses = getVerses(bibleState.selectedBook, chapterNum);

    if (verses && verses.length > 0) {
        renderVersesGrid(verses);
    } else {
        // Fallback: data missing for this chapter (shouldn't happen with full offline data)
        const versesGrid = document.getElementById("verses-grid");
        versesGrid.innerHTML = `
            <div class="bible-loading" style="grid-column:1/-1">
                <i class="fa-solid fa-exclamation-triangle"></i>
                <span>Chapter data unavailable offline.</span>
            </div>`;
    }
}

// ==========================================================================
// RENDER VERSES as number grid
// ==========================================================================
function renderVersesGrid(verses) {
    const grid = document.getElementById("verses-grid");
    grid.innerHTML = "";

    const count = verses.length;
    grid.className = "bible-chapters-grid";
    if (count > 100) {
        grid.classList.add("max-chapters");
    } else if (count > 40) {
        grid.classList.add("many-chapters");
    }

    verses.forEach(v => {
        const btn = document.createElement("button");
        btn.className = "bible-chapter-btn";
        btn.textContent = v.verse;
        btn.onclick = () => openReadingView(verses, v.verse);
        grid.appendChild(btn);
    });
}

// ==========================================================================
// OPEN READING VIEW — instant, scroll to selected verse
// ==========================================================================
function openReadingView(verses, targetVerseNum) {
    bibleState.selectedVerse = targetVerseNum;

    document.getElementById("reading-title").textContent =
        `${bibleState.selectedBook} ${bibleState.selectedChapter} (KJV)`;

    updateReadingNavButtons();

    const canvas = document.getElementById("reading-text-canvas");
    canvas.style.fontSize = bibleState.currentFontSize + "px";
    canvas.innerHTML = "";

    verses.forEach(v => {
        const block = document.createElement("div");
        block.className = "verse-line-block" + (v.verse === targetVerseNum ? " verse-target" : "");
        block.id = `verse-${v.verse}`;
        block.innerHTML = `
            <p class="verse-line-text"><span class="verse-line-num">${v.verse}.</span> ${v.text.trim()}</p>
            <hr class="verse-divider">
        `;
        canvas.appendChild(block);
    });

    showBiblePanel("reading");

    // Scroll to selected verse after render
    setTimeout(() => {
        const targetEl = document.getElementById(`verse-${targetVerseNum}`);
        const container = document.querySelector(".content-container");
        if (targetEl && container) {
            const containerRect = container.getBoundingClientRect();
            const verseRect = targetEl.getBoundingClientRect();
            const offset = verseRect.top - containerRect.top - 80;
            container.scrollTo({ top: container.scrollTop + offset, behavior: "smooth" });
        }
    }, 80);
}

// ==========================================================================
// PREV / NEXT CHAPTER — instant from local data
// ==========================================================================
function updateReadingNavButtons() {
    const prevBtn = document.getElementById("reading-prev-btn");
    const nextBtn = document.getElementById("reading-next-btn");
    if (prevBtn) prevBtn.style.opacity = bibleState.selectedChapter <= 1 ? "0.25" : "1";
    if (nextBtn) nextBtn.style.opacity = bibleState.selectedChapter >= bibleState.totalChapters ? "0.25" : "1";
}

window.goToPrevChapter = function() {
    if (bibleState.selectedChapter <= 1) return;
    bibleState.selectedChapter--;
    renderChapterFromLocal(bibleState.selectedChapter);
};

window.goToNextChapter = function() {
    if (bibleState.selectedChapter >= bibleState.totalChapters) return;
    bibleState.selectedChapter++;
    renderChapterFromLocal(bibleState.selectedChapter);
};

function renderChapterFromLocal(chapterNum) {
    document.getElementById("reading-title").textContent =
        `${bibleState.selectedBook} ${chapterNum} (KJV)`;
    updateReadingNavButtons();

    const verses = getVerses(bibleState.selectedBook, chapterNum);
    const canvas = document.getElementById("reading-text-canvas");

    if (verses && verses.length > 0) {
        canvas.innerHTML = "";
        verses.forEach(v => {
            const block = document.createElement("div");
            block.className = "verse-line-block";
            block.id = `verse-${v.verse}`;
            block.innerHTML = `
                <p class="verse-line-text"><span class="verse-line-num">${v.verse}.</span> ${v.text.trim()}</p>
                <hr class="verse-divider">
            `;
            canvas.appendChild(block);
        });
        const container = document.querySelector(".content-container");
        if (container) container.scrollTo({ top: 0, behavior: "instant" });
    } else {
        canvas.innerHTML = `<div class="bible-loading"><i class="fa-solid fa-exclamation-triangle"></i><span>Chapter data unavailable offline.</span></div>`;
    }
}

// ==========================================================================
// BACK BUTTON
// ==========================================================================
window.backToVerses = function() {
    showBiblePanel("verses");
    document.querySelectorAll(".bible-tab").forEach(t => t.classList.remove("active"));
    document.getElementById("tab-verses").classList.add("active");
};

// ==========================================================================
// PANEL SWITCHER
// ==========================================================================
function showBiblePanel(panelName) {
    document.querySelectorAll(".bible-panel").forEach(p => p.classList.remove("active"));
    document.getElementById(`panel-${panelName}`).classList.add("active");
    const container = document.querySelector(".content-container");
    if (container) container.scrollTo({ top: 0, behavior: "instant" });
}

// ==========================================================================
// TAB SWITCHER
// ==========================================================================
function switchBibleTab(tabName) {
    const tabEl = document.getElementById(`tab-${tabName}`);
    if (tabEl && tabEl.classList.contains("locked")) return;

    document.querySelectorAll(".bible-tab").forEach(t => t.classList.remove("active"));
    if (tabEl) tabEl.classList.add("active");

    if (["books", "chapters", "verses"].includes(tabName)) {
        showBiblePanel(tabName);
    }

    if (tabName !== "books") {
        document.getElementById("bible-search-bar").classList.remove("visible");
    }
}

function resetBibleTabs() {
    document.querySelectorAll(".bible-tab").forEach(t => t.classList.remove("active", "locked"));
    document.getElementById("tab-books").classList.add("active");
    document.getElementById("tab-chapters").classList.add("locked");
    document.getElementById("tab-verses").classList.add("locked");
}

// ==========================================================================
// SEARCH (offline — searches KJV_BIBLE directly in memory)
// ==========================================================================
function toggleBibleSearch() {
    const bar = document.getElementById("bible-search-bar");
    const isVisible = bar.classList.toggle("visible");
    if (isVisible) {
        showBiblePanel("books");
        switchBibleTab("books");
        document.getElementById("bible-search-input").focus();
    } else {
        document.getElementById("bible-search-input").value = "";
        renderBooksList(ALL_BIBLE_BOOKS);
    }
}

function filterBibleBooks(query) {
    const filtered = ALL_BIBLE_BOOKS.filter(b =>
        b.name.toLowerCase().includes(query.toLowerCase())
    );
    renderBooksList(filtered);
}

// ==========================================================================
// FONT SIZE
// ==========================================================================
function adjustBibleFontSize(delta) {
    bibleState.currentFontSize = Math.min(22, Math.max(12, bibleState.currentFontSize + delta));
    const canvas = document.getElementById("reading-text-canvas");
    if (canvas) canvas.style.fontSize = bibleState.currentFontSize + "px";
}

// ==========================================================================
// EXPOSE GLOBALLY
// ==========================================================================
window.initBibleReader = initBibleReader;
window.toggleBibleSearch = toggleBibleSearch;
window.filterBibleBooks = filterBibleBooks;
window.switchBibleTab = switchBibleTab;
window.adjustBibleFontSize = adjustBibleFontSize;
window.setTestamentFilter = setTestamentFilter;

// Cross-Module Scripture redirection loader (used from doctrines/search)
window.navigateToBibleVerse = function(bookName, chapterNum, verseNum = 1) {
    const book = ALL_BIBLE_BOOKS.find(b => b.name.toLowerCase() === bookName.toLowerCase());
    if (!book) return;

    bibleState.selectedBook = book.name;
    bibleState.totalChapters = book.chapters;
    bibleState.selectedChapter = chapterNum;
    bibleState.selectedVerse = verseNum;

    document.getElementById("tab-chapters").classList.remove("locked");
    document.getElementById("tab-verses").classList.remove("locked");

    document.getElementById("chapters-breadcrumb").textContent = book.name;
    document.getElementById("verses-breadcrumb").textContent = `${book.name} ${chapterNum}`;

    const verses = getVerses(book.name, chapterNum);

    if (window.switchTab) {
        const bibleTab = document.querySelector(".bottom-nav a[onclick*='bible']");
        window.switchTab(bibleTab, 'bible');
    }

    if (verses && verses.length > 0) {
        openReadingView(verses, verseNum);
    } else {
        showBiblePanel("reading");
        document.getElementById("reading-title").textContent = `${book.name} ${chapterNum} (KJV)`;
        const canvas = document.getElementById("reading-text-canvas");
        if (canvas) canvas.innerHTML = `<div class="bible-loading"><i class="fa-solid fa-exclamation-triangle"></i><span>Chapter data unavailable offline.</span></div>`;
    }
};