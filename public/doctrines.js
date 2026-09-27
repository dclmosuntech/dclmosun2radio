// ==========================================================================
// DCLM OSUN II — Systematic Bible Doctrines Sermon Engine
// Features: Single-Page Sermon Manuscript Layout (Introduction, Focal Text, Points I-III, Exhortations, Proofs)
// Provides 4 to 5 pages of rich, comprehensive sermon outlines per doctrine.
// Fully integrated with inline clickable KJV scripture reference popups.
// ==========================================================================

const doctrinesState = {
    searchQuery: "",
    selectedDoctrine: null,
    currentFontSize: 15,
    currentActivePopup: null
};

const DOCTRINES_DATABASE = [
    {
        id: 1,
        title: "The Holy Scriptures",
        summary: "The Holy Scriptures, consisting of the 66 books of the Old and New Testaments, are the inspired, inerrant, and infallible Word of God.",
        focalScripture: "2 Timothy 3:16-17",
        focalText: "All scripture is given by inspiration of God, and is profitable for doctrine, for reproof, for correction, for instruction in righteousness: That the man of God may be perfect, thoroughly furnished unto all good works.",
        introduction: "The doctrine of the Holy Scriptures is the foundational rock upon which the entire structure of the Christian faith rests. Without a reliable, authoritative, and divinely preserved revelation, our knowledge of God, salvation, and eternity would be lost in the shifting sands of human philosophy and subjective feelings. The Bible is not a human book containing divine ideas; it is the direct, verbal revelation of the living God Himself. In an age of skepticism, modernism, and secular humanism, we stand uncompromisingly upon the absolute authority of the written Word of God as our supreme and final arbiter in all matters of faith, doctrine, and daily living.",
        point1Title: "Verbal Plenary Inspiration of the Word",
        point1Content: `
            <p class="doc-study-p">Verbal Plenary Inspiration is the theological truth that every single word in the original manuscripts of the Old and New Testaments was breathed out by God Himself. 'Verbal' means that inspiration extends to the very words chosen, not just the general thoughts or concepts of the writers. 'Plenary' means that inspiration is full and complete; every portion of the 66 books is equally inspired, from the historical narratives of Genesis to the prophetic visions of Revelation.</p>
            <p class="doc-study-p">The human writers of scripture were not passive tape recorders, nor were they merely writing down their own religious opinions. The Holy Spirit supernaturally moved upon holy men of God, utilizing their unique personalities, vocabularies, and backgrounds to record precisely what God intended to communicate, without a single trace of human error. As Peter asserts in <span class="doc-inline-ref" onclick="openScripturePopup('2 Peter', 1, 20, 21, '2 Peter 1:20-21')">2 Peter 1:20-21</span>, no prophecy of the scripture is of any private interpretation, for prophecy came not in old time by the will of man, but holy men of God spake as they were moved by the Holy Ghost.</p>
            <p class="doc-study-p">This divine breathing, or *theopneustos*, makes the Bible a living, active book unlike any other piece of human literature. Because it is inspired by the eternal Spirit, its truths are timeless, powerful, and sharp, piercing even to the dividing asunder of soul and spirit, and of the joints and marrow, acting as a discerner of the thoughts and intents of the heart.</p>
        `,
        point2Title: "Absolute Divine Authority and Infallibility",
        point2Content: `
            <p class="doc-study-p">Because the Scriptures are inspired by a holy, all-knowing, and perfect God, they are completely infallible and possess absolute divine authority. Infallibility means that the Bible is incapable of teaching error, deceit, or falsehood. It is entirely true in all its assertions, whether dealing with theological doctrines, historical events, scientific facts, or geographical details. God's character is truth, and since the Bible is His breath, the Bible is absolute truth, as declared by Jesus in His high priestly prayer: 'Sanctify them through thy truth: thy word is truth.'</p>
            <p class="doc-study-p">Therefore, the written Word stands as the supreme court of appeal for the Church. No personal revelation, angelic visitation, church tradition, or modern cultural consensus can override or supplement the scriptures. If any teaching, dream, or custom contradicts the plain text of scripture, it must be rejected as false and dangerous. The Psalmist proclaimed in <span class="doc-inline-ref" onclick="openScripturePopup('Psalms', 119, 89, 89, 'Psalm 119:89')">Psalm 119:89</span>: 'For ever, O Lord, thy word is settled in heaven.' It is unchangeable and eternal.</p>
            <p class="doc-study-p">To reject the authority of the written Word is to reject the authority of the Lord Himself. Jesus constantly answered His critics with the words: 'It is written,' demonstrating that the written text of the Old Testament was the final, unshakeable authority that ended all disputations.</p>
        `,
        point3Title: "Eternal Preservation and Complete Sufficiency",
        point3Content: `
            <p class="doc-study-p">The same God who supernaturally inspired the Scriptures has also supernaturally preserved them through centuries of intense persecution, political upheavals, and malicious attempts to destroy or corrupt them. The preservation of the Bible is a miracle of divine providence, ensuring that the church in every generation has access to the pure, unadulterated words of God. The grass withereth, the flower fadeth: but the word of our God shall stand for ever.</p>
            <p class="doc-study-p">Furthermore, the Scriptures are completely sufficient. This means they contain everything a human being needs to know to be saved, justified, sanctified, and fully equipped to live a perfect, victorious Christian life. We do not need modern psychology, worldly philosophies, or extra-biblical revelations to guide our spiritual growth. As Paul boldly declares in <span class="doc-inline-ref" onclick="openScripturePopup('2 Timothy', 3, 16, 17, '2 Timothy 3:16-17')">2 Timothy 3:16-17</span>, the Scriptures are profitable for doctrine, reproof, correction, and instruction in righteousness, that the man of God may be perfect, thoroughly furnished unto all good works.</p>
            <p class="doc-study-p">The sufficiency of scripture warns us against adding to or subtracting from the divine text. God has closed the canon of scripture with the 66 books, and anyone who claims to have a new revelation that equals or bypasses the written Bible brings themselves under severe divine judgment.</p>
        `,
        applicationContent: `
            <p class="doc-study-p"><strong>1. Absolute Submission to the Word:</strong> As believers, we must cultivate a deep, reverent fear of God's Word. When we read a command or a warning in scripture, we must immediately align our actions, thoughts, and attitudes with it, regardless of cost, personal feelings, or cultural opposition. We must never seek to compromise or water down the truths of the Bible to please the world.</p>
            <p class="doc-study-p"><strong>2. Diligent Daily Study and Meditation:</strong> The Bible is our spiritual food. Just as our physical body cannot survive without food, our soul will starve without the daily intake of scripture. We must read, study, and memorize the Word systematically, hiding it in our hearts so that we might not sin against God. Joshua was commanded to meditate on the book of the law day and night to observe to do according to all that is written therein, promising that then his way would be prosperous and he would have good success.</p>
            <p class="doc-study-p"><strong>3. Bold Proclamation and Defense:</strong> We are called to stand as pillars and grounds of truth in an apostate and compromising generation. We must boldly preach the pure word in season and out of season, using the Scriptures to reprove, rebuke, and exhort. We must earnestly contend for the faith which was once delivered unto the saints, using the Bible as our only sword in spiritual warfare.</p>
        `,
        refs: [
            { label: "2 Timothy 3:16-17", book: "2 Timothy", chapter: 3, start: 16, end: 17 },
            { label: "2 Peter 1:20-21", book: "2 Peter", chapter: 1, start: 20, end: 21 },
            { label: "Psalm 119:89", book: "Psalms", chapter: 119, start: 89, end: 89 }
        ]
    },
    {
        id: 2,
        title: "The Godhead (Trinity)",
        summary: "One God eternally existing in three distinct Persons: Father, Son, and Holy Spirit.",
        focalScripture: "Deuteronomy 6:4",
        focalText: "Hear, O Israel: The Lord our God is one Lord:",
        introduction: "The doctrine of the Trinity represents the supreme mystery and majesty of our great God. While human reason struggles to comprehend how God can be one in essence and yet three in Person, the Scriptures reveal this truth with absolute clarity. The Godhead is not a collection of three separate gods (tritheism), nor is He one Person manifesting in three different modes (modalism). The Bible teaches that there is only one true, infinite, and self-existent God, who eternally exists in three co-equal, co-eternal, and co-essential Persons: God the Father, God the Son, and God the Holy Spirit. This triune Godhead is the source of all creation, redemption, and spiritual fellowship.",
        point1Title: "The Unity of the Divine Essence",
        point1Content: `
            <p class="doc-study-p">The Bible stands as an unshakeable monument of monotheism. There is only one true and living God, infinite, eternal, and unchangeable in His being, wisdom, power, holiness, justice, goodness, and truth. He is the self-existent Creator who does not share His deity, glory, or worship with any created thing. In the Old Testament, God repeatedly declared His absolute oneness to keep His people from falling into the idolatry of surrounding nations. The foundational Shema in <span class="doc-inline-ref" onclick="openScripturePopup('Deuteronomy', 6, 4, 4, 'Deuteronomy 6:4')">Deuteronomy 6:4</span> proclaims: 'Hear, O Israel: The Lord our God is one Lord.'</p>
            <p class="doc-study-p">This unity of essence means that God is one in substance, nature, and will. The Father, Son, and Holy Spirit are not three parts of God, but each Person possesses the entire undivided divine essence in full. Thus, when we speak to or worship one Person of the Trinity, we are in direct contact with the one true God. Isaiah records the absolute declaration of God: 'I am the Lord, and there is none else, there is no God beside me: I girded thee, though thou hast not known me.'</p>
            <p class="doc-study-p">Because God is one, there is absolute harmony, agreement, and perfect love within the Godhead. There is no conflict of interest or divergence of purpose. The divine essence remains completely integrated and unified throughout eternity.</p>
        `,
        point2Title: "The Tri-Unity of the Divine Persons",
        point2Content: `
            <p class="doc-study-p">While God is one in essence, He exists eternally in three distinct Persons. The Father is not the Son, the Son is not the Holy Spirit, and the Holy Spirit is not the Father. Each Person has distinct personal properties: the Father is unbegotten, the Son is eternally begotten of the Father, and the Spirit eternally proceeds from the Father and the Son. Yet, all three Persons are co-equal in power, majesty, glory, and eternity; none is greater or lesser than the other.</p>
            <p class="doc-study-p">We see the plurality of the Godhead revealed in the very opening of scripture. In Genesis 1:26, during the creation of man, God says: 'Let us make man in our image, after our likeness.' The use of the plural pronouns 'us' and 'our' indicates a collaborative, personal dialogue within the one Godhead. The same plural expression is seen in the account of the Tower of Babel: 'Go to, let us go down, and there confound their language.'</p>
            <p class="doc-study-p">In the New Testament, this tri-unity is clearly demonstrated at the baptism of Jesus. Here, we see the Son physically standing in the Jordan river, the Holy Spirit descending visibly in the form of a dove, and the Father speaking audibly from heaven: 'This is my beloved Son, in whom I am well pleased.' This event manifests three distinct personal agents operating simultaneously in absolute harmony.</p>
        `,
        point3Title: "The Cooperative Work of the Godhead",
        point3Content: `
            <p class="doc-study-p">The Father, Son, and Holy Spirit operate in perfect cooperation in all the works of creation, providence, and redemption. In creation, the Father spoke the decree, the Son executed the creative word, and the Holy Spirit moved upon the face of the waters, bringing life and order. In our redemption, the cooperation of the Trinity is even more beautiful: the Father planned the redemptive work, the Son came to earth and executed it on the cross, and the Holy Spirit applies the finished work of Christ to the sinner's heart, regenerating and sealing them.</p>
            <p class="doc-study-p">Jesus Christ commanded the Church to baptize all new converts in the singular 'name' of the three Persons, indicating co-equal authority and essence. In <span class="doc-inline-ref" onclick="openScripturePopup('Matthew', 28, 19, 19, 'Matthew 28:19')">Matthew 28:19</span>, He said: 'Go ye therefore, and teach all nations, baptizing them in the name of the Father, and of the Son, and of the Holy Ghost.' Notice the singular word 'name' is used, reinforcing the singular essence of the three Persons.</p>
            <p class="doc-study-p">The apostolic benediction in <span class="doc-inline-ref" onclick="openScripturePopup('2 Corinthians', 13, 14, 14, '2 double Corinthians 13:14')">2 Corinthians 13:14</span> also highlights this perfect Trinitarian fellowship: 'The grace of the Lord Jesus Christ, and the love of God, and the communion of the Holy Ghost, be with you all. Amen.' Our entire salvation is anchored in the cooperative love and power of the Triune Godhead.</p>
        `,
        applicationContent: `
            <p class="doc-study-p"><strong>1. Balanced and reverent Worship:</strong> We must ensure that we worship the Father, the Son, and the Holy Spirit in equal measure. We must recognize the Father's love, the Son's grace, and the Holy Spirit's power, offering our complete devotion to the Triune God. We must guard against neglecting any Person of the Godhead in our prayers and praises.</p>
            <p class="doc-study-p"><strong>2. Cultivating Spiritual Fellowship:</strong> We are called to live in daily communion with the Trinity. We must walk in the love of the Father, rely constantly on the intercession and mediation of the Son, and yield ourselves to the guiding and empowering presence of the Holy Spirit inside us. This intimate fellowship keeps our spiritual life vibrant and victorious.</p>
            <p class="doc-study-p"><strong>3. Exhibiting Unity in the Church:</strong> The perfect unity and cooperative love of the Father, Son, and Spirit stand as the supreme model for relationships within the Church. Just as there is no division or rivalry in the Godhead, believers must walk in absolute unity, humility, and love, rejecting all strife, backbiting, and division, and working together in harmony to expand the kingdom of God.</p>
        `,
        refs: [
            { label: "Deuteronomy 6:4", book: "Deuteronomy", chapter: 6, start: 4, end: 4 },
            { label: "Genesis 1:26", book: "Genesis", chapter: 1, start: 26, end: 26 },
            { label: "Matthew 28:19", book: "Matthew", chapter: 28, start: 19, end: 19 },
            { label: "2 Corinthians 13:14", book: "2 Corinthians", chapter: 13, start: 14, end: 14 }
        ]
    },
    {
        id: 3,
        title: "The Virgin Birth of Jesus Christ",
        summary: "Jesus was conceived by the Holy Spirit and born of the virgin Mary, being both fully God and fully man.",
        focalScripture: "Isaiah 7:14",
        focalText: "Therefore the Lord himself shall give you a sign; Behold, a virgin shall conceive, and bear a son, and shall call his name Immanuel.",
        introduction: "The Virgin Birth of Jesus Christ is one of the most vital, non-negotiable pillars of the Christian faith. It is not an optional detail of the Christmas story; it is the miraculous mechanism of the Incarnation, whereby the eternal Word of God took upon Himself a physical human body. Without the virgin birth, Jesus would have been born through natural generation, inheriting the fallen, corrupted Adamic nature of a human father, which would have disqualified Him from being our sinless Savior. Through the overshadowing of the Holy Spirit, Jesus was conceived supernaturally in the womb of the virgin Mary, uniting two distinct natures—fully God and fully man—in one sinless, glorious Person forever.",
        point1Title: "The Prophetic Sign of Immanuel",
        point1Content: `
            <p class="doc-study-p">Centuries before the birth of Christ, the Holy Spirit declared that a virgin would conceive and bear a son. This prophetic promise stands as an unshakeable proof of His Messiahship. Isaiah declared in <span class="doc-inline-ref" onclick="openScripturePopup('Isaiah', 7, 14, 14, 'Isaiah 7:14')">Isaiah 7:14</span>: 'Therefore the Lord himself shall give you a sign; Behold, a virgin shall conceive, and bear a son, and shall call his name Immanuel.' This sign was completely supernatural, designed by God to bypass the standard course of human generation.</p>
            <p class="doc-study-p">The Hebrew word for virgin in Isaiah's prophecy is *almah*, which refers specifically to a chaste, unmarried young woman. The fulfillment of this prophecy is recorded in the New Testament with absolute precision. Matthew records that Mary was found with child of the Holy Ghost before she and Joseph came together, declaring that this was done to fulfill what was spoken of the Lord by the prophet: 'Behold, a virgin shall be with child, and shall bring forth a son, and they shall call his name Emmanuel, which being interpreted is, God with us.'</p>
            <p class="doc-study-p">This prophetic sign proves that the arrival of Jesus on earth was not an accident of history, but the execution of a eternal, sovereign plan of God to rescue fallen humanity through a miraculous Redeemer.</p>
        `,
        point2Title: "The Miraculous Conception by the Holy Spirit",
        point2Content: `
            <p class="doc-study-p">The conception of Jesus was a unique biological miracle wrought by the direct power of the Holy Spirit, without the agency of a human father. When the angel Gabriel appeared to Mary to announce that she would bear the Messiah, Mary asked: 'How shall this be, seeing I know not a man?' The angel answered in <span class="doc-inline-ref" onclick="openScripturePopup('Luke', 1, 35, 35, 'Luke 1:35')">Luke 1:35</span>: 'The Holy Ghost shall come upon thee, and the power of the Highest shall overshadow thee: therefore also that holy thing which shall be born of thee shall be called the Son of God.'</p>
            <p class="doc-study-p">This overshadowing represents the creative power of God. Just as the Holy Spirit moved upon the face of the deep at creation to bring light and order, He supernaturally formed the human body of Christ inside Mary's womb. This conception preserved the absolute sinlessness of Jesus. Because He was not conceived through human seed, He did not inherit the original sin, guilt, and depravity of Adam's race.</p>
            <p class="doc-study-p">Joseph's dream, recorded in <span class="doc-inline-ref" onclick="openScripturePopup('Matthew', 1, 18, 20, 'Matthew 1:18-20')">Matthew 1:18-20</span>, confirms this supernatural intervention. Joseph was instructed by an angel not to fear taking Mary as his wife, because 'that which is conceived in her is of the Holy Ghost.' This divine conception stands as an eternal truth.</p>
        `,
        point3Title: "The Sinless, Unspotted Humanity of Christ",
        point3Content: `
            <p class="doc-study-p">Through the virgin birth, Jesus became the unique God-man (*theanthropos*). He did not cease to be God when He became man; rather, He took upon Himself a complete human nature, consisting of a physical body, mind, and emotions, yet without sin. He was fully God, possessing all the attributes of deity, and fully man, experiencing hunger, weariness, thirst, and temptation. The writer of Hebrews declares in <span class="doc-inline-ref" onclick="openScripturePopup('Hebrews', 4, 15, 15, 'Hebrews 4:15')">Hebrews 4:15</span>: 'For we have not an high priest which cannot be touched with the feeling of our infirmities; but was in all points tempted like as we are, yet without sin.'</p>
            <p class="doc-study-p">This sinlessness was absolute. He had no inherited original sin, and He committed no actual sin during His entire life on earth. He was holy, harmless, undefiled, and separate from sinners. This perfect holiness made Him the only qualified Mediator who could take upon Himself the sins of the world. A sinner could not die for another sinner, but Christ, being entirely sinless, could offer Himself as a spotless, acceptable sacrifice on the cross.</p>
            <p class="doc-study-p">Because He was fully man, He could represent humanity and suffer in our place. Because He was fully God, His sacrifice had infinite value, capable of cleansing the sins of all who believe. The virgin birth is the brilliant gateway to this perfect redemption.</p>
        `,
        applicationContent: `
            <p class="doc-study-p"><strong>1. Absolute Trust in His Divinity:</strong> Knowing that Jesus is the eternal God who took human flesh gives us absolute confidence in His power to save, heal, and deliver us. He is not just a moral teacher or a historical prophet; He is the Almighty Creator, Immanuel, God with us, who possesses all power in heaven and on earth.</p>
            <p class="doc-study-p"><strong>2. Comfort in His Perfect Sympathy:</strong> Because Jesus took a physical human body and experienced the limitations, pain, sorrow, and temptations of earthly life, He understands our struggles intimately. When we face trials, physical pain, or emotional distress, we can come boldly to His throne of grace to find mercy and timely help, knowing He feels our pain.</p>
            <p class="doc-study-p"><strong>3. Commitment to Holy Living:</strong> Since our Savior walked sinless in this wicked world, He has set an example for us. By His Spirit dwelling inside us, we are empowered to walk in victory over all sin. We must keep our bodies and spirits holy, avoiding all forms of compromise, and presenting ourselves as clean, undefiled vessels fit for the Master's use.</p>
        `,
        refs: [
            { label: "Isaiah 7:14", book: "Isaiah", chapter: 7, start: 14, end: 14 },
            { label: "Matthew 1:18-20", book: "Matthew", chapter: 1, start: 18, end: 20 },
            { label: "Luke 1:35", book: "Luke", chapter: 1, start: 35, end: 35 },
            { label: "Hebrews 4:15", book: "Hebrews", chapter: 4, start: 15, end: 15 }
        ]
    },
    {
        id: 4,
        title: "The Fall of Man",
        summary: "Mankind fell by voluntary transgression, thereby inheriting a depraved, sinful nature and separation from God.",
        focalScripture: "Romans 5:12",
        focalText: "Wherefore, as by one man sin entered into the world, and death by sin; and so death passed upon all men, for that all have sinned:",
        introduction: "The doctrine of the Fall of Man is key to understanding the current state of humanity and the absolute necessity of the Gospel. God did not create man as a sinful, corrupt being; Adam and Eve were created in a state of absolute innocence, perfection, and holy fellowship with their Creator. However, through voluntary transgression and direct disobedience to God's command in the Garden of Eden, man fell from this glorious state. As the representative head of the human race, Adam's sin brought both physical and spiritual death upon all his descendants. Every human being is now born with a depraved, fallen nature that is naturally inclined to evil and separated from the presence of a holy God.",
        point1Title: "Voluntary Disobedience in Eden",
        point1Content: `
            <p class="doc-study-p">God placed Adam and Eve in a perfect, sinless environment and granted them complete freedom, with only one simple restriction: they were not to eat of the tree of the knowledge of good and evil. This restriction was not a restriction of their joy, but a test of their love, trust, and obedience to their sovereign Creator. Tempted by the devil, Eve, and then Adam, willfully chose to disobey God's direct command. This first sin represented a voluntary rebellion of the human will against the divine sovereignty, as detailed in <span class="doc-inline-ref" onclick="openScripturePopup('Genesis', 3, 1, 19, 'Genesis 3:1-19')">Genesis 3:1-19</span>.</p>
            <p class="doc-study-p">The fall was not a minor slip or an accident; it was a deliberate act of high treason against God. Adam and Eve believed the devil's lie that they could become like gods, independent of their Creator. This pride-driven disobedience immediately broke their fellowship with God, bringing guilt, fear, shame, and immediate spiritual death upon them.</p>
            <p class="doc-study-p">They tried to hide their nakedness with fig leaves and hid themselves among the trees of the garden when they heard the voice of the Lord God. This attempt to cover their own sin and hide from God demonstrates the immediate blindness and alienation of the fallen human heart.</p>
        `,
        point2Title: "Universal Inheritance of Depravity",
        point2Content: `
            <p class="doc-study-p">Because Adam was the federal head and father of all mankind, his fall was not a private matter. When he sinned, the entire human race sinned in him. The fallen Adamic nature was passed down to all generations through natural generation. Every human being is born conceived in sin, inheriting a depraved nature that is completely turned away from God. Paul explains this universal spiritual inheritance in <span class="doc-inline-ref" onclick="openScripturePopup('Romans', 5, 12, 12, 'Romans 5:12')">Romans 5:12</span>: 'Wherefore, as by one man sin entered into the world, and death by sin; and so death passed upon all men, for that all have sinned.'</p>
            <p class="doc-study-p">This depravity is 'total'—not in the sense that every human is as wicked as they could possibly be, but in the sense that every part of human nature (mind, will, emotions, and conscience) has been corrupted by sin. No one is born naturally good; we are born with an active inclination toward evil. The scriptures declare: 'The heart is deceitful above all things, and desperately wicked: who can know it?'</p>
            <p class="doc-study-p">David laments this inherited corruption in Psalm 51:5: 'Behold, I was shapen in iniquity; and in sin did my mother conceive me.' Education, culture, or self-effort cannot cleanse or eradicate this internal, inherited root of sin.</p>
        `,
        point3Title: "Spiritual Separation and Divine Condemnation",
        point3Content: `
            <p class="doc-study-p">The immediate consequence of the Fall was separation from God and exposure to His holy, righteous wrath. Because God is infinitely holy, He cannot tolerate or fellowship with sin. The fall brought physical death, labor, pain, sickness, and sorrow into the world, but its most terrifying result was spiritual death—absolute alienation from God. Left to themselves, humans are completely unable to recover themselves from this fallen state, as written in <span class="doc-inline-ref" onclick="openScripturePopup('Romans', 3, 23, 23, 'Romans 3:23')">Romans 3:23</span>: 'For all have sinned, and come short of the glory of God.'</p>
            <p class="doc-study-p">Without divine intervention, spiritual death leads to eternal death, which is conscious, everlasting separation from God in the Lake of Fire. Fallen man is described in scripture as being dead in trespasses and sins, walking according to the prince of the power of the air, and being by nature a child of wrath. Our moral deeds, charity, or religious rituals are as filthy rags before God, completely incapable of justifying us.</p>
            <p class="doc-study-p">This highlights the absolute necessity of a supernatural Savior. Since man cannot lift himself out of the deep pit of the Fall, God in His infinite mercy sent His Son Jesus Christ to take our condemnation, die in our place, and restore our broken fellowship with Him.</p>
        `,
        applicationContent: `
            <p class="doc-study-p"><strong>1. Recognizing Our Need of Grace:</strong> We must maintain a deep, humble recognition of our fallen nature. We must realize that without the redeeming work of Christ and the transforming power of the Holy Spirit, we are spiritually bankrupt and under condemnation. This humility keeps us dependent on God's grace and preserves us from self-righteousness.</p>
            <p class="doc-study-p"><strong>2. Vigilance Against Satan's Temptations:</strong> Understanding how Satan deceived Eve in the Garden teaches us to stay alert. The devil still uses the lust of the flesh, the lust of the eyes, and the pride of life to lead us into disobedience. We must resist his whispers by standing firmly on the written Word of God, refusing to parley with temptation.</p>
            <p class="doc-study-p"><strong>3. Pursuing the New Birth:</strong> Since our inherited Adamic nature is corrupt, we cannot fix it by self-improvement or moral reforms. We must seek the New Birth (Justification) to receive a brand-new divine nature from God. Only when we are born again by the Spirit of God can we have our sins forgiven and our fellowship with our Creator restored.</p>
        `,
        refs: [
            { label: "Genesis 3:1-19", book: "Genesis", chapter: 3, start: 1, end: 19 },
            { label: "Romans 5:12", book: "Romans", chapter: 5, start: 12, end: 12 },
            { label: "Romans 3:23", book: "Romans", chapter: 3, start: 23, end: 23 }
        ]
    },
    {
        id: 5,
        title: "Repentance",
        summary: "A godly sorrow for sin and a complete, voluntary turning away from all unrighteousness.",
        focalScripture: "Proverbs 28:13",
        focalText: "He that covereth his sins shall not prosper: but whoso confesseth and forsaketh them shall have mercy.",
        introduction: "Repentance is the first, indispensable step of a sinner returning to God. It is the very gateway to the kingdom of heaven, preached by John the Baptist, Lord Jesus Christ, and the Apostles. True repentance is not a mere intellectual agreement that one has sinned, nor is it worldly remorse driven by the fear of punishment or embarrassment. It is a deep, supernatural work of the Holy Spirit inside the heart of a sinner, consisting of a genuine godly sorrow for offending a holy God, an honest confession of all transgressions, and a complete, voluntary turning away from all unrighteousness to trust in Jesus Christ for salvation.",
        point1Title: "The Nature of True Repentance and Godly Sorrow",
        point1Content: `
            <p class="doc-study-p">True repentance begins in the heart with a deep, sincere sorrow for sin. This is 'godly sorrow,' which sees sin as a personal offense against an infinitely loving and holy God. It is contrasted with 'worldly sorrow,' which is merely regret for being caught or fear of the painful consequences of sin. Paul explains this difference in <span class="doc-inline-ref" onclick="openScripturePopup('2 Corinthians', 7, 10, 10, '2 Corinthians 7:10')">2 Corinthians 7:10</span>: 'For godly sorrow worketh repentance to salvation not to be repented of: but the sorrow of the world worketh death.'</p>
            <p class="doc-study-p">Godly sorrow breaks the stubborn will of the sinner, causing them to loathe their transgressions and weep over their spiritual rebellion. It leads to a complete change of mind, heart, and direction. The sinner no longer excuses their sin, blames others, or downplays their guilt. They see their sin exactly as God sees it—wicked, offensive, and deserving of judgment.</p>
            <p class="doc-study-p">This brokenness of heart is highly valued by God. The Psalmist writes: 'The sacrifices of God are a broken spirit: a broken and a contrite heart, O God, thou wilt not despise.' True repentance is not a superficial ritual, but a deep work of the soul.</p>
        `,
        point2Title: "The Absolute Commandment of Repentance to All Men",
        point2Content: `
            <p class="doc-study-p">Repentance is not an optional suggestion; it is God's universal, absolute command to every unsaved human being on earth. In the New Testament, John the Baptist began his ministry crying: 'Repent ye: for the kingdom of heaven is at hand.' When Jesus began His public ministry, He preached the same message: 'Repent, and believe the gospel.' He warned His listeners in <span class="doc-inline-ref" onclick="openScripturePopup('Luke', 13, 3, 3, 'Luke 13:3')">Luke 13:3</span>: 'I tell you, Nay: but, except ye repent, ye shall all likewise perish.'</p>
            <p class="doc-study-p">The Apostles carried this message to the nations. In his sermon at Athens, Paul declared that while God overlooked times of ignorance, He now commandeth all men everywhere to repent, because He has appointed a day in which He will judge the world in righteousness by Jesus Christ. Repentance is the first requirement of the Gospel; without it, faith is dead and salvation is impossible.</p>
            <p class="doc-study-p">As Solomon wrote in <span class="doc-inline-ref" onclick="openScripturePopup('Proverbs', 28, 13, 13, 'Proverbs 28:13')">Proverbs 28:13</span>, trying to cover or hide our sins leads to spiritual ruin, but confessing and forsaking them brings immediate divine mercy. God demands absolute honesty from the seeking sinner.</p>
        `,
        point3Title: "Spiritual Restoration and Divine Pardon",
        point3Content: `
            <p class="doc-study-p">When a sinner repents, confessing their sins and turning away from them with all their heart, God immediately responds with absolute forgiveness and complete pardon. The blood of Jesus Christ is applied to cleanse their record, and their sins are blotted out forever. Peter proclaimed this glorious promise in <span class="doc-inline-ref" onclick="openScripturePopup('Acts', 3, 19, 19, 'Acts 3:19')">Acts 3:19</span>: 'Repent ye therefore, and be converted, that your sins may be blotted out, when the times of refreshing shall come from the presence of the Lord.'</p>
            <p class="doc-study-p">Repentance opens the floodgates of heaven's joy. Jesus declared that there is joy in heaven over one sinner that repenteth, more than over ninety-nine just persons who need no repentance. True repentance transforms a child of wrath into a child of God, bringing immediate peace, reconciliation, and restoration.</p>
            <p class="doc-study-p">The sinner receives a new heart and a new spirit, empowered by the Holy Ghost to live in victory over the sins that once enslaved them. The times of spiritual refreshing and restoration are the direct, beautiful fruits of a heart that has repented before the Lord.</p>
        `,
        applicationContent: `
            <p class="doc-study-p"><strong>1. Sincere and Detailed Confession:</strong> We must never try to cover, hide, or excuse our sins. When we are convicted of any wrongdoing, we must immediately confess it to God in detail, taking full responsibility without making excuses. An honest, transparent confession is the key that unlocks divine mercy.</p>
            <p class="doc-study-p"><strong>2. Absolute Forsaking of All Sins:</strong> Repentance is not a temporary pause in sinful habits; it is a permanent divorce from sin. We must make a clean, final break with all known sins, evil companions, and corrupt places that lead us into temptation. We must burn our bridges behind us, turning our backs completely on the world to follow Christ.</p>
            <p class="doc-study-p"><strong>3. Maintaining a Sensitive Conscience:</strong> Even after conversion, we must guard our hearts against spiritual hardness. We must maintain a quick, sensitive response to the conviction of the Holy Spirit, repenting immediately if we fail in our thoughts, words, or actions. A continuously repentant and humble heart preserves us in active holiness.</p>
        `,
        refs: [
            { label: "Proverbs 28:13", book: "Proverbs", chapter: 28, start: 13, end: 13 },
            { label: "Luke 13:3", book: "Luke", chapter: 13, start: 3, end: 3 },
            { label: "Acts 3:19", book: "Acts", chapter: 3, start: 19, end: 19 }
        ]
    },
    {
        id: 6,
        title: "Restitution",
        summary: "Making amends for past wrongs, returning stolen property, and repairing damaged relationships.",
        focalScripture: "Luke 19:8",
        focalText: "And Zacchaeus stood, and said unto the Lord; Behold, Lord, the half of my goods I give to the poor; and if I have taken any thing from any man by false accusation, I restore him fourfold.",
        introduction: "Restitution is one of the most practical and visible fruits of a truly transformed, regenerated life. It is the act of making amends for past wrongs committed before salvation, returning stolen or swindled property, paying back unpaid debts, and confessing lies. Restitution is not a means of earning salvation, which is received strictly by grace through faith in Christ's blood. However, it is an absolute commandment of God designed to give the converted believer a clean, blameless conscience void of offense toward God and all men, serving as a powerful public testimony of the reality of conversion.",
        point1Title: "The Legal Mandate of Restitution under the Law",
        point1Content: `
            <p class="doc-study-p">Restitution is deeply rooted in God's law of justice and righteousness. In the Old Testament, God commanded that if anyone stole, defrauded, or lied about property, they had to restore it in full plus an additional fifth part. In <span class="doc-inline-ref" onclick="openScripturePopup('Exodus', 22, 1, 4, 'Exodus 22:1-4')">Exodus 22:1-4</span>, the law outlines detailed instructions for restoring stolen sheep, oxen, and goods, showing that God values justice and honesty in practical life.</p>
            <p class="doc-study-p">The law of the trespass offering in Leviticus 6:1-5 warns that if a soul sin and commit a trespass against the Lord, lying unto his neighbor in that which was delivered him to keep, or in fellowship, or in a thing taken by violence, or hath deceived his neighbor, he must restore it in the principal, add the fifth part more thereto, and bring his trespass offering before the priest. This shows that horizontal reconciliation with man is inseparable from vertical reconciliation with God.</p>
            <p class="doc-study-p">God does not accept religious sacrifices from a hand that holds onto stolen goods. The principle of restitution ensures that the repentant sinner shows the sincerity of their turning to God by doing justice to their fellow man.</p>
        `,
        point2Title: "The New Testament Model and Fruit of True Salvation",
        point2Content: `
            <p class="doc-study-p">In the New Testament, restitution is demonstrated as a natural, immediate fruit of a heart touched by saving grace. A classic example is the tax collector Zacchaeus. Having spent years swindling the public, Zacchaeus repented and received Jesus into his home. Instantly, without any direct command from Jesus, Zacchaeus stood up and promised restitution. As recorded in <span class="doc-inline-ref" onclick="openScripturePopup('Luke', 19, 8, 8, 'Luke 19:8')">Luke 19:8</span>, he declared: 'Behold, Lord... if I have taken any thing from any man by false accusation, I restore him fourfold.'</p>
            <p class="doc-study-p">Jesus responded by declaring: 'This day is salvation come to this house.' Jesus recognized Zacchaeus's voluntary commitment to make amends as the definitive proof of his genuine conversion. True salvation does not just change our theology; it changes our relationship with our neighbor's pocketbook and character.</p>
            <p class="doc-study-p">In the early church, believers who practiced occult arts or magic brought their books together and burned them before all men as an act of public restitution, destroying the instruments of their past wicked deeds, even though the value was fifty thousand pieces of silver. Restitution is the practical evidence of a broken, regenerated heart.</p>
        `,
        point3Title: "Maintaining a Conscience Void of Offense",
        point3Content: `
            <p class="doc-study-p">The ultimate goal of restitution is to keep our conscience clear before God and man, removing every barrier to effective personal evangelism. If we go out to preach the Gospel while still holding onto stolen items or keeping past frauds covered, the world will mock our message. As Paul testified in <span class="doc-inline-ref" onclick="openScripturePopup('Acts', 24, 16, 16, 'Acts 24:16')">Acts 24:16</span>: 'And herein do I exercise myself, to have always a conscience void of offence toward God, and toward men.'</p>
            <p class="doc-study-p">Restitution must be performed with great godly wisdom. In simple matters (like returning stolen tools, paying back borrowed money, or confessing a lie), it should be done promptly. In sensitive matters (such as past offenses that could destroy marriages, cause severe legal problems, or put lives in danger), the believer must seek spiritual guidance and counsel from the church leadership before taking action, to ensure that the restitution does not cause more harm than good.</p>
            <p class="doc-study-p">When done properly in the wisdom of the Spirit, restitution clears the path of the believer, grants them bold confidence in prayer, shuts the mouth of the enemy, and stands as a powerful sermon to the unsaved world.</p>
        `,
        applicationContent: `
            <p class="doc-study-p"><strong>1. Practical Execution of Restitution:</strong> We must carefully examine our past lives under the searchlight of the Holy Spirit. If we have stolen property, swindled money, falsified documents, or lied about others before our conversion, we must take concrete, practical steps to return the goods, pay the debts, or confess the lies, restoring what is due.</p>
            <p class="doc-study-p"><strong>2. Seeking Wise Counsel for Complex Cases:</strong> In highly sensitive cases where restitution could impact marriages, cause job loss, or involve legal issues, do not rush ahead blindly. Approach your pastors and seek spiritual, experienced guidance. They will counsel you on how to handle these matters scripturally and safely, preserving the peace of all parties.</p>
            <p class="doc-study-p"><strong>3. Reconciling Broken Relationships:</strong> Restitution is not just about material goods or money; it is about restoring damaged human relationships. Apologize humbly to those you have offended, lied to, or gossiped about. Seek their forgiveness, and take active steps to repair the damage, showing the love of Christ in all your actions.</p>
        `,
        refs: [
            { label: "Exodus 22:1-4", book: "Exodus", chapter: 22, start: 1, end: 4 },
            { label: "Luke 19:8", book: "Luke", chapter: 19, start: 8, end: 8 },
            { label: "Acts 24:16", book: "Acts", chapter: 24, start: 16, end: 16 }
        ]
    },
    {
        id: 7,
        title: "Justification (New Birth)",
        summary: "Salvation by grace through faith, declaring the repentant sinner righteous and giving spiritual rebirth.",
        focalScripture: "Romans 5:1",
        focalText: "Therefore being justified by faith, we have peace with God through our Lord Jesus Christ:",
        introduction: "Justification and the New Birth represent the central miracle of the Gospel of Jesus Christ. They occur simultaneously in the experience of a repentant sinner. Justification is a judicial, legal act of God's sovereign grace whereby He pardons all past sins, cancels the death penalty, and declares the repentant sinner righteous in His sight—solely on the ground of the shed blood of Christ. At the same instant, the New Birth (regeneration) occurs as a supernatural recreation of the soul by the Holy Spirit, transforming the sinner into a brand-new creature in Christ, with a new nature and a new name.",
        point1Title: "Justification by Grace Through Faith Alone",
        point1Content: `
            <p class="doc-study-p">No human being can ever be justified before a holy God by their own good deeds, church attendance, charity, or keeping the law. The standard of God's holiness is absolute perfection, and since all have fallen, our best moral deeds are as filthy rags. Justification is received strictly as a free gift of God's grace, through personal faith in the blood of Jesus Christ. As Paul declares in <span class="doc-inline-ref" onclick="openScripturePopup('Romans', 5, 1, 1, 'Romans 5:1')">Romans 5:1</span>: 'Therefore being justified by faith, we have peace with God through our Lord Jesus Christ.'</p>
            <p class="doc-study-p">On the cross, a divine exchange took place: Jesus took our sins, guilt, and condemnation, and when we believe, His perfect righteousness is imputed to our account. God looks at the justified believer as if they had never sinned, declaring them righteous. The blood of Jesus is the sole ground of our acceptance before God, completely satisfying the demands of divine justice.</p>
            <p class="doc-study-p">Paul reinforces this truth in Ephesians 2:8-9: 'For by grace are ye saved through faith; and that not of yourselves: it is the gift of God: Not of works, lest any man should boast.' Works do not save us, but are rather the fruit of our salvation.</p>
        `,
        point2Title: "The Supernatural Miracle of the New Birth",
        point2Content: `
            <p class="doc-study-p">To enter or even see the kingdom of God, every single person must experience the New Birth. This is not a biological renewal or a moral resolution to do better; it is a supernatural resurrection of the spiritually dead soul. In His discussion with the highly religious Nicodemus in <span class="doc-inline-ref" onclick="openScripturePopup('John', 3, 3, 3, 'John 3:3')">John 3:3</span>, Jesus asserted with absolute emphasis: 'Verily, verily, I say unto thee, Except a man be born again, he cannot see the kingdom of God.'</p>
            <p class="doc-study-p">The New Birth is a work of the Holy Spirit. He uses the incorruptible seed of the Word of God to quicken the dead spirit, infusing the repentant sinner with the very life of God. The believer becomes a new creature; the old, corrupt Adamic nature is subdued, and a new divine nature is implanted, bringing brand-new desires, loves, and goals into the soul.</p>
            <p class="doc-study-p">As written in 2 Corinthians 5:17: 'Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.' The love of sin is replaced by a deep love for holiness and a longing to please God.</p>
        `,
        point3Title: "Divine Regeneration and Renewal",
        point3Content: `
            <p class="doc-study-p">The New Birth is not a silent theory; it produces a visible, practical change in the believer's lifestyle, vocabulary, and actions. The Holy Spirit washes the soul clean from the filth of past sins and continuously renews the inner man. In <span class="doc-inline-ref" onclick="openScripturePopup('Titus', 3, 5, 5, 'Titus 3:5')">Titus 3:5</span>, the Bible reminds us: 'Not by works of righteousness which we have done, but according to his mercy he saved us, by the washing of regeneration, and renewing of the Holy Ghost.'</p>
            <p class="doc-study-p">Regeneration changes our status from children of wrath to sons and daughters of God. The Spirit Himself bears witness with our spirit that we are the children of God, crying 'Abba, Father' in our hearts. The justified believer receives the fruit of the Spirit, which is love, joy, peace, longsuffering, gentleness, goodness, faith, meekness, and temperance.</p>
            <p class="doc-study-p">This inner transformation is followed by a life of absolute victory over sin. As John asserts in his epistle: 'Whosoever is born of God doth not commit sin; for his seed remaineth in him: and he cannot sin, because he is born of God.' The power of habitual sin is broken.</p>
        `,
        applicationContent: `
            <p class="doc-study-p"><strong>1. Resting in the Assurance of Pardon:</strong> Once you have repented and trusted in the blood of Jesus, you must rest in the absolute assurance that God has fully justified you. Do not let the accusations of the devil or feelings of doubt rob you of your peace. God has declared you righteous, and there is now no condemnation to them who are in Christ Jesus.</p>
            <p class="doc-study-p"><strong>2. Walking in Newness of Life:</strong> As a new creature, you must no longer indulge in the sinful habits, vocabulary, or desires of your past. Your lifestyle, business deals, family life, and character must reflect the divine nature you have received. You must walk in active righteousness, shining as a light in this dark world.</p>
            <p class="doc-study-p"><strong>3. Sharing the Miracle of Conversion:</strong> Do not hide your light under a bushel. Boldly share the testimony of your spiritual rebirth with your friends, family, and colleagues. Tell them of the transforming power of Christ's blood, and point them to the same Savior who can justify and recreate their souls.</p>
        `,
        refs: [
            { label: "Romans 5:1", book: "Romans", chapter: 5, start: 1, end: 1 },
            { label: "John 3:3", book: "John", chapter: 3, start: 3, end: 3 },
            { label: "Titus 3:5", book: "Titus", chapter: 3, start: 5, end: 5 }
        ]
    },
    {
        id: 8,
        title: "Water Baptism",
        summary: "Immersion in water in the name of the Father, Son, and Holy Ghost as an outward testimony of inward cleaning.",
        focalScripture: "Matthew 28:19",
        focalText: "Go ye therefore, and teach all nations, baptizing them in the name of the Father, and of the Son, and of the Holy Ghost:",
        introduction: "Water Baptism is a sacred, solemn ordinance commanded by our Lord Jesus Christ for all who have experienced the miracle of salvation. It is not a means of washing away sins, nor is it infant christening or sprinkling. Water baptism is performed strictly by complete immersion in water in the singular name of the Father, and of the Son, and of the Holy Ghost, symbolizing the believer's identification with Christ's death, burial, and resurrection. It stands as a public declaration to the world that the believer has broken all ties with sin and belongs eternally to Jesus.",
        point1Title: "The Supreme Commandment of Jesus Christ",
        point1Content: `
            <p class="doc-study-p">Water baptism is not an optional suggestion for the believer; it is a direct command from the Lord Jesus Christ Himself as part of the Great Commission. In <span class="doc-inline-ref" onclick="openScripturePopup('Matthew', 28, 19, 19, 'Matthew 28:19')">Matthew 28:19</span>, Jesus instructed the Church: 'Go ye therefore, and teach all nations, baptizing them in the name of the Father, and of the Son, and of the Holy Ghost.' Tapping into His authority, every saved soul must submit to this ordinance.</p>
            <p class="doc-study-p">Jesus Himself set the example by being baptized by John in the Jordan river. When John hesitated, Jesus said: 'Suffer it to be so now: for thus it becometh us to fulfill all righteousness.' If the sinless Savior was baptized to fulfill all righteousness, how much more must saved sinners obey this commandment!</p>
            <p class="doc-study-p">The early church practiced water baptism immediately upon conversion. On the Day of Pentecost, Peter commanded the convicted crowd: 'Repent, and be baptized every one of you.' Those who gladly received his word were baptized that very day, showing that baptism is the immediate step of obedience.</p>
        `,
        point2Title: "The Scriptural Mode of Complete Immersion",
        point2Content: `
            <p class="doc-study-p">The word 'baptize' comes from the Greek word *baptizo*, which means to dip, plunge, whelm, or completely submerge in water. Sprinkling, pouring, or christening infants does not fulfill the biblical definition or standard of water baptism. The scriptures demonstrate that water baptism requires 'much water' and complete submersion.</p>
            <p class="doc-study-p">When Philip baptized the Ethiopian eunuch, the scriptures record in <span class="doc-inline-ref" onclick="openScripturePopup('Acts', 8, 38, 39, 'Acts 8:38-39')">Acts 8:38-39</span> that 'they went down both into the water, both Philip and the eunuch; and he baptized him. And when they were come up out of the water, the Spirit of the Lord caught away Philip...' This going down into the water and coming up out of it is the uniform biblical pattern.</p>
            <p class="doc-study-p">Only complete immersion can represent a burial. Sprinkling a few drops of water does not symbolize a burial in any way. Submerging the believer completely in water represents their absolute burial to the old life of sin, and bringing them out of the water represents their resurrection to walk in a new life of righteousness.</p>
        `,
        point3Title: "The Sacred Symbolism of Death, Burial, and Resurrection",
        point3Content: `
            <p class="doc-study-p">Water baptism is a powerful visual sermon. It symbolizes the believer's identification with Jesus Christ in His death, burial, and resurrection. When the believer stands in the water, they declare that they have died to sin. When they are submerged under the water, they represent being buried with Christ. When they are raised out of the water, they represent rising to walk in newness of life. Paul explains this in <span class="doc-inline-ref" onclick="openScripturePopup('Romans', 6, 3, 4, 'Romans 6:3-4')">Romans 6:3-4</span>: 'Know ye not, that so many of us as were baptized into Jesus Christ were baptized into his death? Therefore we are buried with him by baptism into death: that like as Christ was raised up from the dead by the glory of the Father, even so we also should walk in newness of life.'</p>
            <p class="doc-study-p">Baptism is a public declaration of the circumcision of the heart. It signifies that the old, corrupt Adamic nature has been cut off and buried. The believer rises from the water with a public commitment to live a life of absolute righteousness and holiness, powered by the resurrected life of Christ.</p>
            <p class="doc-study-p">It is also an outward testimony of inward cleansing. Just as water washes away physical dirt from the body, water baptism represents the washing away of the believer's sins through the blood of Christ, which occurred at justification. It is the answer of a clear conscience toward God.</p>
        `,
        applicationContent: `
            <p class="doc-study-p"><strong>1. Prompt Obedience After Salvation:</strong> Once you are saved, do not delay or hesitate to seek water baptism. It is a vital public step that confirms your absolute commitment to follow Christ. Do not let family opposition, embarrassment, or religious traditions prevent you from obeying this direct command of your Lord.</p>
            <p class="doc-study-p"><strong>2. Bold Public Testimony:</strong> Use the event of your water baptism as a bold declaration to your family, friends, and the community that you have permanently broken all ties with the world, sin, and secret societies, and that you now belong exclusively to Jesus Christ. It is a line in the sand that shuts the mouth of the enemy.</p>
            <p class="doc-study-p"><strong>3. Walking Daily in Resurrected Power:</strong> Remember daily that your old, sinful self has been buried in the waters of baptism. Live in a way that manifests your spiritual resurrection. When tempted to sin, declare to yourself: 'I have died to sin and have been buried with Christ; I cannot walk in it any longer.' Yield your members to God as instruments of righteousness.</p>
        `,
        refs: [
            { label: "Matthew 28:19", book: "Matthew", chapter: 28, start: 19, end: 19 },
            { label: "Acts 8:38-39", book: "Acts", chapter: 8, start: 38, end: 39 },
            { label: "Romans 6:3-4", book: "Romans", chapter: 6, start: 3, end: 4 }
        ]
    },
    {
        id: 9,
        title: "The Lord's Supper (Holy Communion)",
        summary: "Commemorating the death and broken body of Christ through bread and fruit of the vine.",
        focalScripture: "1 Corinthians 11:26",
        focalText: "For as often as ye eat this bread, and drink this cup, ye do shew the Lord's death till he come.",
        introduction: "The Lord's Supper, or Holy Communion, is a sacred, holy ordinance instituted by our Lord Jesus Christ on the night of His betrayal. It is a perpetual memorial designed to keep the sacrificial death of Christ at the very center of the Church's focus until He returns in glory. Through partaking of unleavened bread (symbolizing His broken body) and the fruit of the vine (symbolizing His shed blood), believers renew their covenant and spiritual fellowship with Christ, manifesting their unity as one body. Because the Communion is holy, it must be approached with deep reverence, heart examination, and a life of absolute purity.",
        point1Title: "The Institution by the Lord Jesus Christ",
        point1Content: `
            <p class="doc-study-p">On the night He was betrayed, as He sat with His disciples to eat the Passover, Jesus took bread, blessed it, broke it, and gave it to them, declaring it to be His body which was given for them. He then took the cup, blessed it, and gave it to them, declaring it to be the new testament in His blood, shed for many for the remission of sins. In <span class="doc-inline-ref" onclick="openScripturePopup('Luke', 22, 19, 20, 'Luke 22:19-20')">Luke 22:19-20</span>, Jesus commanded: 'This is my body which is given for you: this do in remembrance of me. Likewise also the cup after supper, saying, This cup is the new testament in my blood, which is shed for you.'</p>
            <p class="doc-study-p">This ordinance is a holy replacement of the Old Testament Passover. Just as the Passover commemorated Israel's physical deliverance from Egyptian slavery through the blood of a lamb, the Lord's Supper commemorates our eternal, spiritual deliverance from sin and hell through the blood of the Lamb of God.</p>
            <p class="doc-study-p">The elements used are highly significant. The bread must be unleavened, because leaven in scripture represents sin, malice, and hypocrisy. Since Christ's body was entirely sinless, only unleavened bread can represent it. The fruit of the vine represents His pure, unspotted blood, which was shed to purchase our eternal redemption.</p>
        `,
        point2Title: "The Perpetual Proclamation and Remembrance",
        point2Content: `
            <p class="doc-study-p">The Lord's Supper is not a historical relic; it is a living, continuous proclamation of the core of the Gospel. It keeps the cross of Christ at the absolute center of the Church's worship. Paul explains this in <span class="doc-inline-ref" onclick="openScripturePopup('1 Corinthians', 11, 23, 26, '1 Corinthians 11:23-26')">1 Corinthians 11:23-26</span>, stating that as often as we eat this bread and drink this cup, we do show the Lord's death until He comes. It looks backward to His sacrifice, upward to His present intercession, and forward to His glorious return.</p>
            <p class="doc-study-p">When we partake of Communion, we are not just remembering a dead historical figure; we are spiritually feeding on Christ by faith. It strengthens our spiritual union with Him. Jesus declared: 'He that eateth my flesh, and drinketh my blood, dwelleth in me, and I in him.'</p>
            <p class="doc-study-p">Furthermore, Communion is a celebration of the unity of the Church. By partaking of one bread and one cup, we declare that we are one body, united in love, faith, and purpose. As Paul asserts: 'For we being many are one bread, and one body: for we are all partakers of that one bread.' It demands that we maintain perfect peace and harmony with our brethren.</p>
        `,
        point3Title: "The Requirement of Self-Examination and Holy Living",
        point3Content: `
            <p class="doc-study-p">Because the Communion elements represent the holy body and blood of the Son of God, partaking of them is a highly solemn matter. No one should approach the Communion table lightly, carelessly, or with unconfessed sin in their heart. Doing so is highly dangerous, bringing divine judgment upon the soul and physical body. Paul sounds a severe warning in <span class="doc-inline-ref" onclick="openScripturePopup('1 Corinthians', 11, 27, 30, '1 Corinthians 11:27-30')">1 Corinthians 11:27-30</span>: 'Wherefore whosoever shall eat this bread, and drink this cup of the Lord, unworthily, shall be guilty of the body and blood of the Lord. But let a man examine himself, and so let him eat of that bread, and drink of that cup. For he that eateth and drinketh unworthily, eateth and drinketh damnation to himself, not discerning the Lord's body.'</p>
            <p class="doc-study-p">Partaking 'unworthily' does not mean that a person must be sinless before they can ever partake; rather, it refers to partaking in an irreverent, careless manner, while holding onto known sin, malice, pride, or unresolved conflicts with others. God commands every believer to perform a thorough, honest self-examination, repenting of all sins and reconciling with others before eating of the bread and drinking of the cup.</p>
            <p class="doc-study-p">Failure to heed this warning brought severe chastisement upon the Corinthian church. Paul noted: 'For this cause many are weak and sickly among you, and many sleep.' Holy Communion must be approached with clean hands and a pure heart, serving as a catalyst for deeper holiness and self-judgment.</p>
        `,
        applicationContent: `
            <p class="doc-study-p"><strong>1. Approaching the Table with Deep Reverence:</strong> Never view Holy Communion as a routine ritual. When the table is set, approach it with deep awe, respect, and overwhelming thanksgiving for the broken body and shed blood of Christ on the cross. Meditate on the immense price He paid to save you, offering Him your complete heart devotion.</p>
            <p class="doc-study-p"><strong>2. Rigorous Heart Examination and Repentance:</strong> Prior to partaking, spend dedicated time in quiet prayer and self-examination under the searchlight of the Holy Spirit. Confess and forsake every known sin, bad attitude, gossip, or secret compromise. If the Spirit convicts you of any wrong, repent immediately so that you do not bring judgment upon yourself.</p>
            <p class="doc-study-p"><strong>3. Reconciling and Maintaining Perfect Unity:</strong> You cannot partake of the one bread while harboring hatred, malice, or unforgiveness toward any brother or sister in Christ. Before you sit at the Communion table, reconcile with those you are in conflict with. Forgive completely, make peace, and participate in perfect harmony, manifesting the love of the body of Christ.</p>
        `,
        refs: [
            { label: "Luke 22:19-20", book: "Luke", chapter: 22, start: 19, end: 20 },
            { label: "1 Corinthians 11:23-26", book: "1 Corinthians", chapter: 11, start: 23, end: 26 },
            { label: "1 Corinthians 11:27-30", book: "1 Corinthians", chapter: 11, start: 27, end: 30 }
        ]
    },
    {
        id: 10,
        title: "Sanctification (Holiness)",
        summary: "An instantaneous work of grace subsequent to salvation, cleansing the heart from original sin.",
        focalScripture: "1 Thessalonians 4:3",
        focalText: "For this is the will of God, even your sanctification,",
        introduction: "Sanctification, also known as entire sanctification, Christian perfection, or heart holiness, is the ultimate goal of the Christian journey. It is a definite, instantaneous work of divine grace subsequent to justification and the New Birth. While justification pardons our committed actual sins, sanctification goes deeper, cleansing the heart from original sin—the inherited, corrupt Adamic nature that naturally inclines man to evil. Wrought by the Holy Spirit through the blood of Jesus Christ and personal faith, sanctification purges the inner man, consecrates them entirely to God, and empowers them to walk in absolute, uncompromised holiness daily.",
        point1Title: "The Absolute Mandate of Entire Sanctification",
        point1Content: `
            <p class="doc-study-p">Holiness is not an optional specialty for a few super-Christians; it is the absolute requirement of God for all who wish to maintain fellowship with Him and enter heaven. God is infinitely holy, and He cannot tolerate or fellowship with sin. The writer of Hebrews sounds a clear warning in <span class="doc-inline-ref" onclick="openScripturePopup('Hebrews', 12, 14, 14, 'Hebrews 12:14')">Hebrews 12:14</span>: 'Follow peace with all men, and holiness, without which no man shall see the Lord.' Without heart purity, no one can ever stand in His presence.</p>
            <p class="doc-study-p">Justification delivers us from the guilt and power of committed sins, but it leaves the internal root of sin—the Adamic nature—intact. This root often manifests as internal struggles, pride, anger, and evil desires. Entire sanctification goes to the very root of the problem, purging the heart from this inherited corruption. It is God's will and purpose for every born-again believer, as Paul asserts: 'For this is the will of God, even your sanctification.'</p>
            <p class="doc-study-p">God's command to His people in both the Old and New Testaments is: 'Be ye holy; for I am holy.' He has planned a standard of entire sanctification to deliver us completely from the pollution of sin, making us fit vessels for His glory.</p>
        `,
        point2Title: "Instantaneous Cleansing of the Heart from Original Sin",
        point2Content: `
            <p class="doc-study-p">Entire sanctification is not a gradual process of self-improvement or growth in grace. While we grow in the Christian life, entire sanctification is a definite, instantaneous work of grace received in a moment by faith. It is a divine surgery where the Holy Spirit circumcises the heart, cutting away the body of the sins of the flesh, and cleansing the inner man from all traces of original sin. Paul prayed for the Thessalonians in <span class="doc-inline-ref" onclick="openScripturePopup('1 Thessalonians', 5, 23, 24, '1 Thessalonians 5:23-24')">1 Thessalonians 5:23-24</span>: 'And the very God of peace sanctify you wholly; and I pray God your whole spirit and soul and body be preserved blameless unto the coming of our Lord Jesus Christ. Faithful is he that calleth you, who also will do it.'</p>
            <p class="doc-study-p">This work is accomplished through the shed blood of Jesus Christ. As written in Hebrews 13:12: 'Wherefore Jesus also, that he might sanctify the people with his own blood, suffered without the gate.' The blood of Jesus has absolute power to cleanse us from all unrighteousness, removing the deep-seated root of original sin.</p>
            <p class="doc-study-p">It is received through complete consecration and faith. The believer must present their body as a living sacrifice, laying all on the altar, and trust God to send His purging fire to cleanse their heart. When we believe, the Holy Spirit purges our hearts by faith, instating absolute heart purity.</p>
        `,
        point3Title: "Continuous Walking in Heart Holiness and Purity",
        point3Content: `
            <p class="doc-study-p">Once the heart has been sanctified, the believer must walk daily in this state of heart holiness and purity. Entire sanctification does not make a person incapable of sinning, nor does it remove the possibility of temptation. Rather, it delivers the believer from the internal attraction to sin, granting them a pure heart that naturally loves righteousness. The sanctified soul must maintain this experience through continuous watchfulness, prayer, and feeding on God's Word. Jesus prayed: 'Sanctify them through thy truth: thy word is truth.'</p>
            <p class="doc-study-p">A sanctified life is manifested through perfect love toward God and our fellow man. It removes pride, selfishness, anger, and malice, replacing them with humility, gentleness, and active charity. The believer walks in perfect harmony with God's will, keeping their garments unspotted from the corruptions of the world. As written in <span class="doc-inline-ref" onclick="openScripturePopup('John', 17, 17, 17, 'John 17:17')">John 17:17</span>, the truth of God's Word preserves and anchors the sanctified soul.</p>
            <p class="doc-study-p">Sanctification makes us highly productive in service. A clean vessel is fit for the Master's use, prepared unto every good work. It grants the believer absolute boldness in witnessing and a continuous, deep peace that passes all human understanding.</p>
        `,
        applicationContent: `
            <p class="doc-study-p"><strong>1. Absolute and Total Consecration:</strong> Present your body, soul, spirit, career, ambitions, and possessions as a living sacrifice upon the altar of God. Surrender your own will completely to the control of God. Consecration is the vital prerequisite for sanctification; you must lay all on the altar before the purging fire of the Holy Spirit can fall.</p>
            <p class="doc-study-p"><strong>2. Actively Seeking and Believing for Cleansing:</strong> Seek entire sanctification as a definite, instantaneous experience subsequent to salvation. Cry out to God in earnest prayer, presenting your consecration, and trust the cleansing power of the blood of Jesus to purge your heart from the Adamic nature. Believe that God is faithful and will perform this work instantly upon your faith.</p>
            <p class="doc-study-p"><strong>3. Maintaining a Vigilant and Holy Walk:</strong> Once sanctified, guard your heart purity with all diligence. Meditate daily on the Scriptures, pray without ceasing, and avoid all worldly compromises, corrupt conversations, and unholy associations. Walk in perfect love and humility, keeping your spiritual garments spot-free and ready for the Lord's return.</p>
        `,
        refs: [
            { label: "Hebrews 12:14", book: "Hebrews", chapter: 12, start: 14, end: 14 },
            { label: "1 Thessalonians 4:3", book: "1 Thessalonians", chapter: 4, start: 3, end: 3 },
            { label: "1 Thessalonians 5:23-24", book: "1 Thessalonians", chapter: 5, start: 23, end: 24 },
            { label: "John 17:17", book: "John", chapter: 17, start: 17, end: 17 }
        ]
    },
    {
        id: 11,
        title: "Holy Ghost Baptism",
        summary: "The enduement of power from on high for service, with the initial evidence of speaking in other tongues.",
        focalScripture: "Acts 1:8",
        focalText: "But ye shall receive power, after that the Holy Ghost is come upon you: and ye shall be witnesses unto me both in Jerusalem, and in all Judaea, and in Samaria, and unto the uttermost part of the earth.",
        introduction: "The Baptism in the Holy Ghost is the promised gift of divine power from on high, designed to equip the sanctified believer for effective service, bold witnessing, and victorious spiritual warfare. It is a definite experience, distinct from and subsequent to the New Birth and entire sanctification. Wrought by the Lord Jesus Christ, who is the divine Baptizer, this experience is accompanied by the initial physical evidence of speaking in other tongues as the Spirit gives utterance. In an age of widespread spiritual compromise and demonic resistance, the enduement of Holy Ghost power is an absolute necessity for every true soldier of Christ.",
        point1Title: "The Divine Enduement of Power for Effective Service",
        point1Content: `
            <p class="doc-study-p">Before His ascension, Jesus gave His disciples the Great Commission to preach the Gospel to all nations. However, He strictly commanded them not to depart Jerusalem or begin their ministry until they had received the promise of the Father. He declared in <span class="doc-inline-ref" onclick="openScripturePopup('Acts', 1, 8, 8, 'Acts 1:8')">Acts 1:8</span>: 'But ye shall receive power, after that the Holy Ghost is come upon you: and ye shall be witnesses unto me...' This baptism is not a saving grace, but an enduement of boldness, authority, and spiritual power for service.</p>
            <p class="doc-study-p">Without the Holy Spirit's power, our preaching is empty human wisdom, and our evangelism is powerless. The Holy Ghost baptism infuses the believer's voice with divine authority, sharpens their spiritual discernment, and convicts the hearts of their listeners. It grants the believer supernatural boldness to confront sin, face persecutions, and testify of Christ under all circumstances.</p>
            <p class="doc-study-p">This power was demonstrated on the Day of Pentecost. The once-timid Peter, who had denied Christ before a servant girl, stood up boldly before thousands and preached a sermon that pierced their hearts, leading to the salvation of three thousand souls in one day. This is the power of the Holy Ghost.</p>
        `,
        point2Title: "The Initial Physical Evidence of Speaking in Tongues",
        point2Content: `
            <p class="doc-study-p">The Bible establishes a uniform, clear pattern regarding the initial physical evidence of the Baptism in the Holy Ghost. Whenever believers were first filled with the Holy Spirit in the New Testament, they immediately spoke in new, other tongues as the Spirit gave them utterance. This promise was literally fulfilled on the Day of Pentecost, as recorded in <span class="doc-inline-ref" onclick="openScripturePopup('Acts', 2, 1, 4, 'Acts 2:1-4')">Acts 2:1-4</span>: 'And they were all filled with the Holy Ghost, and began to speak with other tongues, as the Spirit gave them utterance.'</p>
            <p class="doc-study-p">This pattern was repeated throughout the early church history. At the house of the Gentile Centurion Cornelius, the Jewish believers were astonished because they saw that the gift of the Holy Ghost was poured out on the Gentiles also. How did they know? 'For they heard them speak with tongues, and magnify God.' The same occurred at Ephesus when Paul laid hands on the disciples of John: 'the Holy Ghost came on them; and they spake with tongues, and prophesied.'</p>
            <p class="doc-study-p">Speaking in other tongues is a supernatural manifestation where the Holy Spirit takes absolute control of the believer's tongue—the most unruly member of the body—directing them to pray and praise God in a language they have never learned. It serves as an unshakeable initial evidence of the Spirit's absolute infilling.</p>
        `,
        point3Title: "The Command to Tarry, Pray, and Receive",
        point3Content: `
            <p class="doc-study-p">The Baptism in the Holy Ghost is not a historical experience confined to the early Apostles. It is the birthright and promise of every born-again, sanctified child of God in the present generation. On the Day of Pentecost, Peter declared: 'For the promise is unto you, and to your children, and to all that are afar off, even as many as the Lord our God shall call.' Believers must tarry, wait, and pray in active faith to receive this gift, as Jesus commanded in <span class="doc-inline-ref" onclick="openScripturePopup('Luke', 24, 49, 49, 'Luke 24:49')">Luke 24:49</span>: 'And, behold, I send the promise of my Father upon you: but tarry ye in the city of Jerusalem, until ye be endued with power from on high.'</p>
            <p class="doc-study-p">To receive the Holy Ghost baptism, the believer must first ensure their heart is clean and sanctified. The Holy Spirit is a holy Guest, and He only fills a clean, consecrated vessel. The believer must then seek the gift with an intense, overwhelming spiritual thirst, praying in absolute faith and surrendering their voice, tongue, and throat to the control of the Spirit, yielding themselves to speak as the Spirit gives utterance.</p>
            <p class="doc-study-p">Once filled, the believer must continue to walk in the Spirit, maintaining their spiritual power through daily prayer, speaking in tongues to edify themselves, and utilizing the spiritual gifts to serve the church and win the lost for Christ.</p>
        `,
        applicationContent: `
            <p class="doc-study-p"><strong>1. Purify and Sanctify Your Heart:</strong> Before you seek the Baptism in the Holy Ghost, ensure that you have experienced entire sanctification. Present yourself as a clean, holy, and completely surrendered vessel. Pray earnestly for the cleansing of the blood of Christ, so that your heart is a suitable dwelling place for the Spirit of power.</p>
            <p class="doc-study-p"><strong>2. Seek with Intense Thirst and Persistent Prayer:</strong> Seek the infilling of the Holy Ghost with a deep spiritual hunger and thirst. Attend tarrying meetings, spend quality time in prayer, and ask in unwavering faith, believing that your heavenly Father is more willing to give the Holy Spirit to them that ask Him. Yield your tongue, voice, and spirit to speak in new tongues as He gives utterance.</p>
            <p class="doc-study-p"><strong>3. Deploying Power for Global Evangelism:</strong> Remember that the primary purpose of the Holy Ghost baptism is witnessing power. Do not utilize this gift merely for emotional excitement. Step out boldly in your neighborhood, school, or workplace to share the Gospel, cast out devils, pray for the sick, and participate actively in the soul-winning campaigns of the church.</p>
        `,
        refs: [
            { label: "Acts 1:8", book: "Acts", chapter: 1, start: 8, end: 8 },
            { label: "Acts 2:1-4", book: "Acts", chapter: 2, start: 1, end: 4 },
            { label: "Luke 24:49", book: "Luke", chapter: 24, start: 49, end: 49 }
        ]
    },
    {
        id: 12,
        title: "Redemption, Healing & Deliverance",
        summary: "Divine physical healing, protection, and deliverance provided through the atonement of Jesus Christ.",
        focalScripture: "Isaiah 53:5",
        focalText: "But he was wounded for our transgressions, he was bruised for our iniquities: the chastisement of our peace was upon him; and with his stripes we are healed.",
        introduction: "The Gospel of Jesus Christ is a complete, all-inclusive package of redemption. Jesus did not come merely to save our souls from hell; He came to deliver the whole man—spirit, soul, and body—from the devastating consequences of the Fall. Sickness, physical disease, mental torment, and demonic oppression are all direct results of the entry of sin into the world. However, through the redemptive sacrifice and substitutionary atonement of Jesus Christ on the cross, complete provision has been made for our physical healing, supernatural protection, and total deliverance from all demonic forces. Sickness is a curse, but Christ has redeemed us from the curse, granting us the right to walk in divine health and absolute victory.",
        point1Title: "Physical Healing in the Atonement of Christ",
        point1Content: `
            <p class="doc-study-p">Divine physical healing is not a secondary benefit of the Gospel; it is an integral part of the finished work of atonement on the cross of Calvary. The prophet Isaiah, looking forward to the suffering of the Messiah, declared in <span class="doc-inline-ref" onclick="openScripturePopup('Isaiah', 53, 4, 5, 'Isaiah 53:4-5')">Isaiah 53:4-5</span>: 'Surely he hath borne our griefs, and carried our sorrows... and with his stripes we are healed.' The Hebrew words for 'griefs' and 'sorrows' refer literally to physical sicknesses and bodily pains, proving that Jesus bore our physical diseases just as He bore our sins.</p>
            <p class="doc-study-p">This redemptive truth is reaffirmed in the New Testament. Matthew records that Jesus healed all that were sick, 'That it might be fulfilled which was spoken by Esaias the prophet, saying, Himself took our infirmities, and bare our sicknesses.' Peter also writes: 'Who his own self bare our sins in his own body on the tree... by whose stripes ye were healed.' Physical healing is a paid-for redemptive right for every child of God.</p>
            <p class="doc-study-p">Sickness is an oppression of the devil, but the cross has broken the power of Satan. Because Christ took our infirmities upon Himself, we have a scriptural right to reject sickness and claim physical restoration and strength by faith in His finished work.</p>
        `,
        point2Title: "The Elder's Anointing and the Prayer of Faith",
        point2Content: `
            <p class="doc-study-p">God has established a clear, practical, and highly authoritative method within the local church for receiving physical healing. If any believer falls sick, they are not to rely solely on medical science or suffer in silence. They are commanded to call for the elders of the church, who will pray over them and anoint them with oil in the name of the Lord. As written in <span class="doc-inline-ref" onclick="openScripturePopup('James', 5, 14, 16, 'James 5:14-16')">James 5:14-16</span>: 'Is any sick among you? let him call for the elders of the church; and let them pray over him, anointing him with oil in the name of the Lord: And the prayer of faith shall save the sick, and the Lord shall raise him up...'</p>
            <p class="doc-study-p">The oil used does not possess magical healing powers; it is a sacred symbol of the presence and power of the Holy Spirit. The key to healing is the 'prayer of faith,' offered by righteous men who stand on the promises of God. The promise is absolute: 'the Lord shall raise him up; and if he have committed sins, they shall be forgiven him.'</p>
            <p class="doc-study-p">This scriptural instruction demands that we confess our faults one to another, making sure that there is no unconfessed sin or unresolved bitterness blocking our healing. The effectual fervent prayer of a righteous man availeth much, opening the channel of divine restoration.</p>
        `,
        point3Title: "Authority Over All Demonic Oppressions",
        point3Content: `
            <p class="doc-study-p">Redemption also includes complete deliverance from all demonic oppressions, generational curses, witchcraft, and satanic bondages. Through His death and resurrection, Jesus Christ completely disarmed principalities and powers, making a show of them openly, and triumphing over them in it. He has granted His believers absolute authority over all the power of the enemy. As recorded in <span class="doc-inline-ref" onclick="openScripturePopup('Matthew', 8, 16, 17, 'Matthew 8:16-17')">Matthew 8:16-17</span>, Jesus cast out the spirits with His word, and healed all that were sick.</p>
            <p class="doc-study-p">In the Great Commission, Jesus promised: 'And these signs shall follow them that believe; In my name shall they cast out devils...' Every born-again believer possesses this authority. We do not need to live in fear of curses, spell, hexes, or ancestral spirits. The blood of Jesus has broken every chain, and the name of Jesus is a strong tower before which every knee must bow.</p>
            <p class="doc-study-p">Deliverance and healing are described in scripture as the 'children's bread,' which is readily available to all who belong to the household of faith. We must actively exercise our spiritual authority, casting out demonic influences and walking in absolute liberty and divine protection.</p>
        `,
        applicationContent: `
            <p class="doc-study-p"><strong>1. Actively Walking in Divine Health:</strong> Believe with all your heart that Christ's atonement covers your physical body. Stand on the promises of Isaiah 53:5 and refuse to accept sickness as your lot. Keep your physical body holy, clean, and well-rested, and trust the Lord daily for supernatural strength, health, and physical vitality, rejecting the symptoms of disease in His name.</p>
            <p class="doc-study-p"><strong>2. Utilizing the Church Ordinance:</strong> If you or your family members fall sick, do not hesitate to call for the pastors and elders of the church to pray over you and anoint you with oil. Approach this ordinance in active faith, expecting the Lord to raise you up according to His word. Ensure your heart is free from unconfessed sin, unforgiveness, or bitterness, which can block divine healing.</p>
            <p class="doc-study-p"><strong>3. Casting Out Demonic Influences:</strong> Stand boldly on the victory of the cross of Calvary. Refuse to live in fear of witchcraft, dreams of oppression, ancestral curses, or demonic attacks. Exercise your spiritual authority in the name of Jesus; cast out evil spirits, cleanse your home from all occult items, and walk in absolute freedom, protected by the blood of the Lamb.</p>
        `,
        refs: [
            { label: "Isaiah 53:4-5", book: "Isaiah", chapter: 53, start: 4, end: 5 },
            { label: "James 5:14-16", book: "James", chapter: 5, start: 14, end: 16 },
            { label: "Matthew 8:16-17", book: "Matthew", chapter: 8, start: 16, end: 17 }
        ]
    },
    {
        id: 13,
        title: "Personal Evangelism",
        summary: "The sacred duty and privilege of every believer to share the Gospel of Jesus Christ with every creature.",
        focalScripture: "Mark 16:15",
        focalText: "And he said unto them, Go ye into all the world, and preach the gospel to every creature.",
        introduction: "Personal Evangelism is the supreme task and mission of the Church of Jesus Christ on earth. It is not a specialized calling reserved for pastors, evangelists, or missionaries; it is the sacred duty, privilege, and responsibility of every single born-again believer. Sinner-saving is the heartbeat of God, who is not willing that any should perish, but that all should come to repentance. Having been saved, justified, and sanctified, we are appointed as ambassadors of Christ, commanded to share the Gospel of reconciliation, win souls, and make disciples of all nations, using every scriptural means to bring sinners to saving faith.",
        point1Title: "The Great Commission as an Absolute Duty",
        point1Content: `
            <p class="doc-study-p">Before His ascension, Jesus left His disciples with a clear, universal, and binding mandate. This command remains the primary purpose of the Church's existence. In <span class="doc-inline-ref" onclick="openScripturePopup('Mark', 16, 15, 15, 'Mark 16:15')">Mark 16:15</span>, Jesus commanded: 'Go ye into all the world, and preach the gospel to every creature.' This commission is not a suggestion; it is an absolute commandment of the King of kings, binding on every generation of believers.</p>
            <p class="doc-study-p">To remain silent while millions are sliding into hell is a severe sin of omission. Paul felt this weight deeply, crying out: 'For necessity is laid upon me; yea, woe is unto me, if I preach not the gospel!' We are gatekeepers and watchmen; if we see the sword coming and do not blow the trumpet to warn the people, their blood will be required at our hands. Personal evangelism is our primary spiritual debt to the unsaved world.</p>
            <p class="doc-study-p">This mission requires urgency. We must go out to the highways and hedges, warning sinners of the coming judgment and pleading with them to accept the mercy of God. Every believer, in their unique sphere of influence (family, school, office, or neighborhood), is called to be a constant witness for Christ.</p>
        `,
        point2Title: "The Wisdom and Blessings of Soul Winning",
        point2Content: `
            <p class="doc-study-p">Soul winning is highly valued and honored in the eyes of God. It is characterized in scripture as the highest form of spiritual wisdom. Solomon declared in <span class="doc-inline-ref" onclick="openScripturePopup('Proverbs', 11, 30, 30, 'Proverbs 11:30')">Proverbs 11:30</span>: 'The fruit of the righteous is a tree of life; and he that winneth souls is wise.' A healthy, vibrant Christian life naturally bears the fruit of winning others to Christ.</p>
            <p class="doc-study-p">There are immense spiritual blessings promised to the soul-winner. Daniel prophesied: 'And they that be wise shall shine as the brightness of the firmament; and they that turn many to righteousness as the stars for ever and ever.' God honors those who honor His son by sharing His sacrifice. The soul-winner experiences a unique joy, deep spiritual growth, and constant divine answers to prayer.</p>
            <p class="doc-study-p">Evangelism also preserves the local church. A church that does not evangelize will eventually die out. By winning souls and bringing them into the fellowship, we keep the church alive, active, and productive in the work of God.</p>
        `,
        point3Title: "Witnessing in the Demonstration of the Spirit",
        point3Content: `
            <p class="doc-study-p">To perform personal evangelism effectively, we must not rely on human eloquence, intellectual arguments, or theological debates. We must rely on the power, guidance, and presence of the Holy Spirit. In <span class="doc-inline-ref" onclick="openScripturePopup('Acts', 1, 8, 8, 'Acts 1:8')">Acts 1:8</span>, we are reminded that the primary purpose of receiving Holy Ghost power is to be witnesses in all parts of the earth. The Holy Spirit grants boldness, convicts the sinner's heart, and guides the soul-winner to prepared souls.</p>
            <p class="doc-study-p">Our preaching must be backed by the demonstration of the Spirit and of power. When we go out in faith, the Holy Spirit confirms the word with signs following, healing the sick, casting out devils, and breaking chains, proving to the sinner that Jesus is alive. We must utilize tracts, personal testimonies, and open discussions, speaking with deep love, compassion, and absolute sincerity.</p>
            <p class="doc-study-p">A blameless, holy lifestyle is also the most powerful witness we can offer. If our life contradicts our message, our evangelism becomes useless. We must live in a way that adorns the doctrine of God our Savior, shining as pure lights in a crooked generation.</p>
        `,
        applicationContent: `
            <p class="doc-study-p"><strong>1. Dedicating Time Weekly for Evangelism:</strong> Do not let busyness rob you of your primary duty. Dedicate specific time weekly to go out and share the Gospel systematically. Participate actively in the evangelism outings of your local church, distribute gospel tracts, and seek opportunities to speak to people about their souls.</p>
            <p class="doc-study-p"><strong>2. Maintaining a Personal Intercessory List:</strong> Keep a personal diary or list of unsaved family members, friends, schoolmates, and office colleagues. Pray for them daily by name, pleading with God to convict them of sin, open their blind spiritual eyes, and create opportunities for you to share the Gospel with them in love.</p>
            <p class="doc-study-p"><strong>3. Living as a Blameless Christian Witness:</strong> Ensure that your daily life matches the message you preach. Avoid all forms of hypocrisy, dishonesty, hot temper, and compromise. A holy, loving, and honest lifestyle is the foundation of successful soul-winning, giving your words immense power and credibility when you speak.</p>
        `,
        refs: [
            { label: "Mark 16:15", book: "Mark", chapter: 16, start: 15, end: 15 },
            { label: "Proverbs 11:30", book: "Proverbs", chapter: 11, start: 30, end: 30 },
            { label: "Acts 1:8", book: "Acts", chapter: 1, start: 8, end: 8 }
        ]
    },
    {
        id: 14,
        title: "Marriage",
        summary: "A sacred covenant between one biological man and one biological woman for life, strictly prohibiting divorce.",
        focalScripture: "Matthew 19:6",
        focalText: "Wherefore they are no more twain, but one flesh. What therefore God hath joined together, let not man put asunder.",
        introduction: "The doctrine of Marriage is of critical importance in an age of moral decay, widespread divorce, and attempts to redefine the family. Marriage is not a human, social contract that can be modified by cultural trends; it is a holy, sacred institution ordained and structured by God at creation. The Bible teaches that marriage is a lifelong covenant union between one biological man and one biological woman. It is indissoluble by any human authority, and the scriptures strictly prohibit divorce and remarriage while the first partner is still living, maintaining the absolute sanctity and purity of the family unit.",
        point1Title: "The Original Edenic Pattern of Marriage",
        point1Content: `
            <p class="doc-study-p">Marriage was created and instituted by God in the Garden of Eden, before sin entered the world. God saw that it was not good for man to be alone, and He supernaturally formed Eve from Adam's rib, presenting her as a help meet for him. God established the standard of marriage as a monogamous, heterosexual union. Genesis records this original pattern in <span class="doc-inline-ref" onclick="openScripturePopup('Genesis', 2, 24, 24, 'Genesis 2:24')">Genesis 2:24</span>: 'Therefore shall a man leave his father and his mother, and shall cleave unto his wife: and they shall be one flesh.'</p>
            <p class="doc-study-p">This original pattern establishes three key principles: leaving, cleaving, and becoming one flesh. 'Leaving' requires a physical and emotional break from parents, establishing a new independent family unit. 'Cleaving' speaks of an unbreakable bond of loyalty, love, and commitment. 'Becoming one flesh' represents the physical, spiritual, and emotional union of husband and wife, designed for companionship and the multiplication of a godly offspring.</p>
            <p class="doc-study-p">This pattern strictly rules out polygamy, homosexuality, cohabitation, and all forms of sexual immorality. God's design is one biological man and one biological woman, united in holy love, forming the foundational block of human society.</p>
        `,
        point2Title: "The Indissoluble Marriage Covenant",
        point2Content: `
            <p class="doc-study-p">Jesus Christ strongly reaffirmed this original, lifelong standard of marriage during His earthly ministry. When questioned by the Pharisees regarding divorce, Jesus directed them back to the creation mandate. In <span class="doc-inline-ref" onclick="openScripturePopup('Matthew', 19, 4, 6, 'Matthew 19:4-6')">Matthew 19:4-6</span>, He declared: 'Have ye not read, that he which made them at the beginning made them male and female... What therefore God hath joined together, let not man put asunder.' The marriage bond is a sacred covenant joined by God Himself, and it cannot be dissolved by any human court, pastoral decree, or mutual agreement.</p>
            <p class="doc-study-p">The covenant of marriage is designed to endure through all circumstances—for better or for worse, in sickness and in health, in poverty and in wealth. It is a reflection of the unbreakable covenant between Christ and His Church. The husband is commanded to love his wife sacrificially, just as Christ loved the Church and gave Himself for it, and the wife is commanded to submit to her husband as unto the Lord.</p>
            <p class="doc-study-p">Divorce is highly offensive to God. Through the prophet Malachi, God declared in absolute terms: 'For the Lord, the God of Israel, saith that he hateth putting away.' Divorce destroys families, wounds children, and brings severe spiritual consequences upon the society.</p>
        `,
        point3Title: "Remarriage Forbidden While a Spouse Lives",
        point3Content: `
            <p class="doc-study-p">According to the plain, uncompromised teachings of the New Testament, the marriage bond remains binding as long as both husband and wife are physically alive. Remarriage while the first partner is still living is characterized in the scriptures as an act of adultery. Paul outlines this scriptural law in <span class="doc-inline-ref" onclick="openScripturePopup('Romans', 7, 2, 3, 'Romans 7:2-3')">Romans 7:2-3</span>: 'For the woman which hath an husband is bound by the law to her husband so long as he liveth; but if the husband be dead, she is loosed... So then if, while her husband liveth, she be married to another man, she shall be called an adulteress...'</p>
            <p class="doc-study-p">This standard is absolute. The exception clause in Matthew 19:9 refers strictly to fornication (*porneia*) discovered during the betrothal period (as was suspected in Joseph and Mary's case before marriage), not post-consummation adultery. Once a marriage is consummated, only the physical death of one partner can legally dissolve the bond, freeing the surviving spouse to marry in the Lord.</p>
            <p class="doc-study-p">In <span class="doc-inline-ref" onclick="openScripturePopup('Romans', 7, 2, 3, 'Romans 7:2-3')">Romans 7:2-3</span>, Paul demonstrates that remarriage during the lifetime of a first spouse is a violation of the divine law. The Church must maintain this high, holy standard of marital fidelity, refusing to compromise under the pressure of modern legal systems or backslidden denominations.</p>
        `,
        applicationContent: `
            <p class="doc-study-p"><strong>1. Lifelong Commitment and Loyalty:</strong> View your marriage as an unbreakable, lifelong covenant. Dedicate yourself to work through every marital conflict, misunderstanding, or financial trial with deep love, patience, mutual forgiveness, and intense prayer, refusing to ever consider or speak the word 'divorce' as an option.</p>
            <p class="doc-study-p"><strong>2. Strict Fidelity and Bed Undefiled:</strong> Maintain absolute purity and fidelity in your marriage. Avoid all forms of emotional, mental, and physical adultery. Keep your thoughts, eyes, and conversations clean from all pornography, lustful looks, and unholy relationships with the opposite sex, keeping the marriage bed completely undefiled.</p>
            <p class="doc-study-p"><strong>3. Thorough Pre-Marital Guidance:</strong> If you are single, do not enter into any romantic relationship or marriage deal blindly. You must strictly avoid unequal yokes with unbelievers. Seek thorough, intensive biblical counseling and guidance from the church leadership before taking any marriage step, ensuring you marry strictly in the Lord.</p>
        `,
        refs: [
            { label: "Genesis 2:24", book: "Genesis", chapter: 2, start: 24, end: 24 },
            { label: "Matthew 19:4-6", book: "Matthew", chapter: 19, start: 4, end: 6 },
            { label: "Romans 7:2-3", book: "Romans", chapter: 7, start: 2, end: 3 }
        ]
    },
    {
        id: 15,
        title: "The Rapture",
        summary: "The literal, sudden translation of living saints and resurrection of dead saints to meet Christ in the air.",
        focalScripture: "1 Thessalonians 4:16-17",
        focalText: "For the Lord himself shall descend from heaven with a shout, with the voice of the archangel, and with the trump of God: and the dead in Christ shall rise first: Then we which are alive and remain shall be caught up together with them in the clouds, to meet the Lord in the air: and so shall we ever be with the Lord.",
        introduction: "The Rapture is the next great, imminent, and highly anticipated event on God's prophetic calendar. It is the literal, sudden, and instantaneous translation of all living, holy saints, alongside the physical resurrection of all dead believers. They will be caught up together in the clouds to meet the Lord Jesus Christ in the air, escaping the terrifying period of the Great Tribulation that will follow on earth. In a world filled with wars, moral decay, and natural disasters, the Rapture stands as the blessed hope of the Church, motivating us to constant watchfulness, active holiness, and urgent soul winning.",
        point1Title: "The Sudden Gathering of the Saints in the Air",
        point1Content: `
            <p class="doc-study-p">The Rapture is a literal event that will occur in a fraction of a second, 'in the twinkling of an eye.' At the sound of the trump of God, the Lord Jesus Christ will descend from heaven into the atmosphere. He will not touch the earth at this time; instead, He will gather His Bride in the air. The dead in Christ will be resurrected first with glorified, incorruptible bodies, and then the living saints will be changed and caught up together with them. Paul details this glorious hope in <span class="doc-inline-ref" onclick="openScripturePopup('1 Thessalonians', 4, 13, 18, '1 Thessalonians 4:13-18')">1 Thessalonians 4:13-18</span>.</p>
            <p class="doc-study-p">This gathering will catch the unsaved world completely off guard. It will be a silent, sudden disappearance of millions of holy believers from all parts of the globe. Planes, cars, and offices will be left empty in an instant, throwing the Christ-rejecting world into immediate chaos and confusion.</p>
            <p class="doc-study-p">As written in <span class="doc-inline-ref" onclick="openScripturePopup('1 Thessalonians', 4, 13, 18, '1 Thessalonians 4:13-18')">1 Thessalonians 4:13-18</span>, this event comforteth the hearts of believers, assuring us that we will be reunited with our departed loved ones who died in the faith, and that we will ever be with the Lord in His heavenly mansions.</p>
        `,
        point2Title: "The Glorious Instantaneous Body Transformation",
        point2Content: `
            <p class="doc-study-p">During the Rapture, a supernatural biological transformation will occur instantly. Our mortal, corrupted, and frail physical bodies will be changed into immortal, incorruptible, and glorified bodies, exactly like the resurrected body of Jesus Christ. We will no longer experience sickness, fatigue, pain, or the limitations of gravity. Paul outlines this transformation in <span class="doc-inline-ref" onclick="openScripturePopup('1 Corinthians', 15, 51, 54, '1 Corinthians 15:51-54')">1 Corinthians 15:51-54</span>: 'Behold, I shew you a mystery; We shall not all sleep, but we shall all be changed, In a moment, in the twinkling of an eye...'</p>
            <p class="doc-study-p">This corruptible physical frame must put on incorruption, and this mortal must put on immortality. Our new glorified bodies will be perfectly suited for eternal heavenly existence, free from the presence and pull of sin. It is the final, complete redemption of our physical bodies.</p>
            <p class="doc-study-p">As John writes in his epistle: 'Beloved, now are we the sons of God, and it doth not yet appear what we shall be: but we know that, when he shall appear, we shall be like him; for we shall see him as he is.' This hope purifies the believer's life.</p>
        `,
        point3Title: "Christ's Ultimate Return Promise",
        point3Content: `
            <p class="doc-study-p">Before His crucifixion, when His disciples were filled with sorrow and fear, Jesus comforted them with the absolute promise of His return to take them to His Father's house. He declared in <span class="doc-inline-ref" onclick="openScripturePopup('John', 14, 1, 3, 'John 14:1-3')">John 14:1-3</span>: 'Let not your heart be troubled... In my Father's house are many mansions... I go to prepare a place for you. And if I go and prepare a place for you, I will come again, and receive you unto myself; that where I am, there ye may be also.'</p>
            <p class="doc-study-p">The Rapture is the fulfillment of this promise. It is the time when Christ comes to claim His Bride, bringing her to the mansions prepared in heaven. It is distinct from the Second Coming, which occurs seven years later, when Christ returns all the way to the earth to judge and reign.</p>
            <p class="doc-study-p">This hope of Christ's return has been the anchor of the Church through centuries of trials and martyrdom. We must live with a constant, active expectation of His return, knowing that the signs of the times indicate that the coming of the Lord is at the very door.</p>
        `,
        applicationContent: `
            <p class="doc-study-p"><strong>1. Constant Readiness and Active Holiness:</strong> Live daily with the conscious expectation that Jesus could return at any moment. This hope must purify your daily lifestyle. Confess and forsake all known sin immediately, keeping your spiritual garments spot-free, white, and ready. Walk in active holiness, so that you are not left behind when the trumpet sounds.</p>
            <p class="doc-study-p"><strong>2. Staying Detached from the World:</strong> Do not set your heart, treasures, or affections on the temporary, passing elements of this earth. Live as a pilgrim and a stranger, knowing that our citizenship is in heaven, from whence we look for the Savior. Maintain a loose grip on worldly wealth, and invest your time and resources in things of eternal value.</p>
            <p class="doc-study-p"><strong>3. Warning the Lost with Urgency:</strong> Knowing that the time is short and the terrifying Great Tribulation is coming, we must warn our unsaved family members, friends, and neighbors with deep urgency. Preach the Gospel, distribute tracts, and plead with them to accept salvation now, before the door of mercy is closed at the Rapture.</p>
        `,
        refs: [
            { label: "1 Thessalonians 4:13-18", book: "1 Thessalonians", chapter: 4, start: 13, end: 18 },
            { label: "1 Corinthians 15:51-54", book: "1 Corinthians", chapter: 15, start: 51, end: 54 },
            { label: "John 14:1-3", book: "John", chapter: 14, start: 1, end: 3 }
        ]
    },
    {
        id: 16,
        title: "Resurrection of the Dead",
        summary: "The physical resurrection of all dead: the righteous to life, and the unrighteous to judgment.",
        focalScripture: "John 5:28-29",
        focalText: "Marvel not at this: for the hour is coming, in the which all that are in the graves shall hear his voice, and shall come forth; they that have done good, unto the resurrection of life; and they that have done evil, unto the resurrection of damnation.",
        introduction: "The doctrine of the Resurrection of the Dead is one of the foundational, eternal truths of the Christian faith. The Bible clearly teaches that death is not the end of human existence; it is merely a temporary separation of the soul and body. In God's sovereign timeline, there will be a literal, physical, and bodily resurrection of all human beings who have ever died since creation. The righteous (saved) will be resurrected to everlasting life, glory, and reward, while the unrighteous (unsaved) will be resurrected to final judgment, shame, and eternal damnation in the Lake of Fire.",
        point1Title: "The Bodily Resurrection of the Just and Unjust",
        point1Content: `
            <p class="doc-study-p">Every human being who has ever walked the earth will eventually experience a physical resurrection. The grave is not a final resting place. Every human soul, which is immortal, will eventually be reunited with a physically resurrected body to stand before God. Jesus declared this absolute truth in <span class="doc-inline-ref" onclick="openScripturePopup('John', 5, 28, 29, 'John 5:28-29')">John 5:28-29</span>: 'Marvel not at this: for the hour is coming, in the which all that are in the graves shall hear his voice, and shall come forth...'</p>
            <p class="doc-study-p">This resurrection is bodily, not merely spiritual. The same body that was laid in the grave, though decomposed, will be supernaturally reconstructed and reunited with its soul. For the righteous, it will be a glorified body; for the unrighteous, a body suited for eternal punishment. God's creative power is fully capable of gathering the scattered elements of every decomposed body.</p>
            <p class="doc-study-p">This truth is confirmed by the resurrection of Jesus Christ. His resurrection is the firstfruits, proving that just as He rose physically from the grave, so also all men will rise physically. The scriptures assert: 'But now is Christ risen from the dead, and become the firstfruits of them that slept.'</p>
        `,
        point2Title: "The Cornerstone Hope of Apostolic Preaching",
        point2Content: `
            <p class="doc-study-p">The early Church Apostles preached the physical resurrection of the dead as the absolute cornerstone of the Christian hope. Without the resurrection, our faith is vain, our preaching is empty, and we are still in our sins. When Paul stood before governors and councils, he constantly declared that his hope was anchored in this truth. In <span class="doc-inline-ref" onclick="openScripturePopup('Acts', 24, 15, 15, 'Acts 24:15')">Acts 24:15</span>, Paul stated: 'And have hope toward God... that there shall be a resurrection of the dead, both of the just and unjust.'</p>
            <p class="doc-study-p">If there is no resurrection of the dead, then Christ is not risen, and if Christ be not risen, then those who have fallen asleep in Christ are perished, and we are of all men most miserable. The resurrection is our ultimate victory over death, which is the last enemy to be destroyed. It gives the believer absolute courage to face martyrdom, knowing that the grave has no permanent victory.</p>
            <p class="doc-study-p">The early Christians faced the lions, the fire, and the sword with joy, because they held fast to the hope of a better resurrection. We must maintain this apostolic testimony, refusing to let modern secularism reduce our hope to this passing earthly life.</p>
        `,
        point3Title: "The Chronology of the First and Second Resurrections",
        point3Content: `
            <p class="doc-study-p">The resurrection of the dead does not occur all at the same time; it is divided into two major phases separated by a literal 1,000 years. The first phase is the 'First Resurrection' or the 'Resurrection of Life,' which is reserved exclusively for the righteous. This phase began with the resurrection of Christ (the firstfruits), continues with the resurrection of the saints at the Rapture, and concludes with the resurrection of the Tribulation martyrs at the Second Coming. As written in <span class="doc-inline-ref" onclick="openScripturePopup('Revelation', 20, 5, 6, 'Revelation 20:5-6')">Revelation 20:5-6</span>: 'Blessed and holy is he that hath part in the first resurrection...'</p>
            <p class="doc-study-p">The second phase is the 'Second Resurrection' or the 'Resurrection of Damnation,' which occurs at the end of the Millennial Reign of Christ. During this phase, all the wicked, unsaved dead of all generations will be physically resurrected to stand before the Great White Throne Judgment, to be judged according to their works and cast into the Lake of Fire.</p>
            <p class="doc-study-p">This clear chronology highlights the absolute importance of our current spiritual standing. To have part in the First Resurrection is to escape the second death, which is eternal damnation, and to enter into a glorious eternity of reigning with Christ.</p>
        `,
        applicationContent: `
            <p class="doc-study-p"><strong>1. Finding Solace in Bereavement:</strong> Do not sorrow as those who have no hope when a Christian brother or family member passes away. We have an absolute, divine assurance that their physical body will be resurrected in glory and immortality at the coming of Christ. Sickness and death are only temporary, and we will meet again in glorified bodies.</p>
            <p class="doc-study-p"><strong>2. Warning the Unsaved of the Resurrection of Damnation:</strong> Knowing that the wicked will also rise physically to suffer everlasting conscious torment in the Lake of Fire, we must plead with sinners with all urgency. Warn your unsaved neighbors, friends, and relatives to repent and receive Christ's pardon now, before they pass away into a hopeless grave.</p>
            <p class="doc-study-p"><strong>3. Keeping Your Physical Body Holy:</strong> Live with the constant recognition that your physical body is not trash; it is a temple of the Holy Spirit, destined for an eternal resurrection. Keep your body holy, pure, and undefiled, avoiding all forms of sexual immorality, drug abuse, and worldly pollutions. Present your physical members as instruments of righteousness to God.</p>
        `,
        refs: [
            { label: "John 5:28-29", book: "John", chapter: 5, start: 28, end: 29 },
            { label: "Acts 24:15", book: "Acts", chapter: 24, start: 15, end: 15 },
            { label: "Revelation 20:5-6", book: "Revelation", chapter: 20, start: 5, end: 6 }
        ]
    },
    {
        id: 17,
        title: "The Great Tribulation",
        summary: "A period of unprecedented wrath and trouble on earth following the Rapture, under the rule of the Antichrist.",
        focalScripture: "Matthew 24:21",
        focalText: "For then shall be great tribulation, such as was not since the beginning of the world to this time, no, nor ever shall be.",
        introduction: "The Great Tribulation is a literal, highly terrifying period of unprecedented worldwide distress, divine judgment, and satanic wrath that will occur immediately after the Rapture of the Church. During this seven-year period, the restraining influence of the Holy Spirit inside the Church will be removed, allowing the Antichrist to rise as a global dictator. He will deceive the nations, enforce his mark, and severely persecute all who refuse to worship him. At the same time, the seals, trumpets, and vials of God's holy wrath will be poured out upon the earth, making it a time of unparalleled horror in human history.",
        point1Title: "Unparalleled Distress in Human History",
        point1Content: `
            <p class="doc-study-p">The Great Tribulation is characterized by our Lord Jesus Christ as a time of trouble unlike anything the world has ever seen or will ever see again. In His olivet discourse, recorded in <span class="doc-inline-ref" onclick="openScripturePopup('Matthew', 24, 21, 22, 'Matthew 24:21-22')">Matthew 24:21-22</span>, Jesus declared: 'For then shall be great tribulation... And except those days should be shortened, there should no flesh be saved.' It will be a time of global wars, devastating famines, deadly pestilences, massive earthquakes, and celestial disruptions.</p>
            <p class="doc-study-p">During this time, the holy wrath of God will be poured out upon a Christ-rejecting world. The Book of Revelation describes terrifying judgments: a third of the trees burned, the sea turned to blood, demonic locusts tormenting men, and scorching heat melting the earth. Men will seek death and shall not find it; they will desire to die, and death shall flee from them.</p>
            <p class="doc-study-p">This is the 'day of the Lord's wrath,' designed to punish ungodly nations, break the stubborn rebellion of Israel, leading to their final national repentance, and demonstrate the absolute consequence of rejecting the grace of God.</p>
        `,
        point2Title: "The Rise and Reign of the Antichrist",
        point2Content: `
            <p class="doc-study-p">Following the Rapture of the Church, the world will be thrown into absolute chaos and fear. In this vacuum, the Antichrist—the 'man of sin,' the 'son of perdition'—will rise, presenting himself as a brilliant political savior who can bring peace, economic stability, and unity. Supported by the False Prophet, he will perform lying signs and wonders, deceiving all whose names are not written in the Book of Life. Paul warns of this spiritual deception in <span class="doc-inline-ref" onclick="openScripturePopup('2 Thessalonians', 2, 3, 12, '2 Thessalonians 2:3-12')">2 Thessalonians 2:3-12</span>.</p>
            <p class="doc-study-p">He will establish a global government, a global religion, and a global economic system. He will sit in the rebuilt temple in Jerusalem, showing himself that he is God, and demanding absolute worship. Anyone who refuses to worship him will face severe persecution and physical martyrdom. He will wear out the saints of the Most High, making war with them and overcoming them physically.</p>
            <p class="doc-study-p">This reign will last for seven years, divided into two halves. The first three and a half years will be a time of false peace, but the second half—the 'Great Tribulation'—will be a time of absolute demonic terror, as the Antichrist breaks his covenant and unleashes his full fury.</p>
        `,
        point3Title: "The Mark of the Beast Economic System",
        point3Content: `
            <p class="doc-study-p">To control the global population, the Antichrist will implement a highly sophisticated global economic system. Every person on earth will be forced to receive a mark in their right hand or in their forehead. Without this mark, no one will be permitted to buy food, pay rent, conduct business, or survive. John details this economic tyranny in <span class="doc-inline-ref" onclick="openScripturePopup('Revelation', 13, 16, 18, 'Revelation 13:16-18')">Revelation 13:16-18</span>: 'And he causeth all, both small and great... to receive a mark... And that no man might buy or sell, save he that had the mark...'</p>
            <p class="doc-study-p">This mark, representing the name of the beast or the number of his name (666), is not just an economic tool; it is a sacred pledge of absolute loyalty and worship to Satan. Receiving the mark represents an irreversible step of spiritual rebellion, sealing the soul for eternal damnation. The scriptures warn in absolute terms that anyone who receives the mark of the beast will drink of the wine of the wrath of God, and shall be tormented with fire and brimstone in the presence of the holy angels and the Lamb, and the smoke of their torment ascendeth up forever and ever.</p>
            <p class="doc-study-p">Those who refuse the mark during the Tribulation will be hunted, arrested, and beheaded for their testimony. Yet, they will triumph over the beast through their physical martyrdom, refusing to compromise their faith, and their souls will reign with Christ eternally.</p>
        `,
        applicationContent: `
            <p class="doc-study-p"><strong>1. Escaping the Tribulation Through Holiness:</strong> The Great Tribulation is designed as a judgment upon the Christ-rejecting world, not for the Bride of Christ. The Bible promises that God has not appointed us to wrath. To escape this terrifying period, you must maintain active holiness, keep your heart clean, and participate in the imminent Rapture of the saints.</p>
            <p class="doc-study-p"><strong>2. Warning the Deceived with Urgency:</strong> Preach the Gospel with all urgency to rescue others from being left behind. Educate your family and friends about the reality of the Rapture and the coming of the Antichrist. Warn them never to receive any mark or chip on their hand or forehead under any circumstances, pleading with them to accept salvation now.</p>
            <p class="doc-study-p"><strong>3. Resisting the Spirit of the Antichrist Now:</strong> The 'spirit of antichrist' is already actively operating in our modern world through moral compromises, attempts to neutralize the Bible, and secular economic pressures. We must boldly resist these early signs of end-time deception, standing firmly on the written Word of God, and refusing to conform to the ungodly systems of this world.</p>
        `,
        refs: [
            { label: "Matthew 24:21-22", book: "Matthew", chapter: 24, start: 21, end: 22 },
            { label: "2 Thessalonians 2:3-12", book: "2 Thessalonians", chapter: 2, start: 3, end: 12 },
            { label: "Revelation 13:16-18", book: "Revelation", chapter: 13, start: 16, end: 18 }
        ]
    },
    {
        id: 18,
        title: "The Second Coming of Christ",
        summary: "The literal, visible return of Jesus Christ in glory with His saints to judge the earth and reign.",
        focalScripture: "Jude 1:14-15",
        focalText: "And Enoch also, the seventh from Adam, prophesied of these, saying, Behold, the Lord cometh with ten thousands of his saints, To execute judgment upon all, and to convince all that are ungodly among them of all their ungodly deeds...",
        introduction: "The Second Coming of Jesus Christ is the ultimate climax of human history. Unlike the Rapture—which is a silent, sudden gathering of the saints in the clouds—the Second Coming is the literal, physical, and highly visible return of the Lord Jesus Christ in power and great glory all the way to the earth. Occurring at the end of the seven-year Great Tribulation, Christ will descend from heaven with His glorified saints to defeat the Antichrist at the Battle of Armageddon, execute judgment upon rebellious nations, and establish His righteous kingdom on the earth.",
        point1Title: "The Physical Mount of Olives Return",
        point1Content: `
            <p class="doc-study-p">At His ascension from the Mount of Olives, two angels stood by the disciples and promised: 'This same Jesus, which is taken up from you into heaven, shall so come in like manner as ye have seen him go into heaven.' At the Second Coming, this promise will be literally fulfilled. Christ's feet will physically touch the earth. Zechariah prophesied this visible return in <span class="doc-inline-ref" onclick="openScripturePopup('Zechariah', 14, 3, 4, 'Zechariah 14:3-4')">Zechariah 14:3-4</span>: 'And his feet shall stand in that day upon the mount of Olives... and the mount of Olives shall cleave in the midst...'</p>
            <p class="doc-study-p">This physical return will shake the earth. The Mount of Olives will split in half, creating a massive valley, and Jerusalem will be transformed. Christ descends not as a humble servant riding on a donkey, but as the King of kings and Lord of lords riding upon a white horse, with eyes like a flame of fire, and on His head many crowns.</p>
            <p class="doc-study-p">He will physically establish His headquarters in Jerusalem, taking His seat upon the throne of His father David. His return will put an end to all human political rebellion, establishing His absolute, sovereign rule over all the nations of the earth.</p>
        `,
        point2Title: "A Public, Universal, and Visible Appearance",
        point2Content: `
            <p class="doc-study-p">The Second Coming of Christ will not be a secret or hidden event. It will be public, highly visible, and universally witnessed by every human being alive on the earth. Jesus described this awesome appearance in His Olivet discourse, recorded in <span class="doc-inline-ref" onclick="openScripturePopup('Matthew', 24, 29, 30, 'Matthew 24:29-30')">Matthew 24:29-30</span>, explaining that the sign of the Son of man will appear in heaven, and He will come in the clouds of heaven with power and great glory. Every eye shall see Him, and all the tribes of the earth shall mourn.</p>
            <p class="doc-study-p">John confirms this universal visibility in Revelation 1:7: 'Behold, he cometh with clouds; and every eye shall see him, and they also which pierced him: and all kindreds of the earth shall wail because of him.' Unlike the Rapture, which occurs in the twinkling of an eye, the Second Coming will be a slow, majestic, and terrifying descent, visible to all.</p>
            <p class="doc-study-p">The unsaved world, having followed the Antichrist and rejected the Gospel, will be filled with terror when they see the skies split open to reveal the righteous Judge. The kings of the earth, the great men, and the rich men will hide themselves in the dens and in the rocks of the mountains, crying to the rocks: 'Fall on us, and hide us from the face of him that sitteth on the throne, and from the wrath of the Lamb.'</p>
        `,
        point3Title: "Conquering the Antichrist and Rebellious Nations",
        point3Content: `
            <p class="doc-study-p">The primary purpose of the Second Coming is to execute judgment upon the ungodly, defeat the Antichrist and his global armies, and establish righteousness on earth. As Christ descends, the Antichrist will gather the kings of the earth and their massive armies at Armageddon to make war against Him. This battle will end in immediate, absolute defeat for the enemy. Christ will destroy them with the sword that proceeds out of His mouth—the spoken Word of His power. The Antichrist and False Prophet will be captured alive and cast into the Lake of Fire. Jude declared this in <span class="doc-inline-ref" onclick="openScripturePopup('Jude', 1, 14, 15, 'Jude 14-15')">Jude 14-15</span>.</p>
            <p class="doc-study-p">Christ does not return alone; He is accompanied by the 'armies of heaven,' consisting of the glorified saints who were caught up at the Rapture. We will return with Him, clothed in fine linen, white and clean, to witness and participate in His victory. He will tread the winepress of the fierceness and wrath of Almighty God, executing final judgment upon all rebellious nations.</p>
            <p class="doc-study-p">Following the Battle of Armageddon, Christ will gather the surviving nations and judge them (the Judgment of the Nations or the Sheep and Goats Judgment), separating the righteous from the wicked. The ungodly will be cast into punishment, while the righteous will be invited to inherit the kingdom prepared for them, initiating the glorious Millennial Reign.</p>
        `,
        applicationContent: `
            <p class="doc-study-p"><strong>1. Ensuring Your Part in His Army:</strong> The saints who return with Christ in glory are those who were first caught up at the Rapture. To be part of this heavenly army, you must maintain a holy, consecrated walk now. Ensure your heart is justified and sanctified, keeping your spiritual garments clean, white, and unspotted from the world.</p>
            <p class="doc-study-p"><strong>2. Resting in His Ultimate Victory:</strong> Do not let the current chaos, rise of ungodly governments, or satanic systems fill you with fear or despair. The scriptures guarantee that Christ has the final victory. The kingdoms of this world will eventually become the kingdoms of our Lord and of His Christ, and He shall reign forever and ever.</p>
            <p class="doc-study-p"><strong>3. Warning Sinners of the Coming Wrath:</strong> Use the reality of the Second Coming to warn unsaved friends and neighbors. Tell them that Jesus is not just a savior, but a coming Judge who will execute judgment upon all the ungodly. Plead with them to make peace with Him now through repentance, before He returns as the King of wrath.</p>
        `,
        refs: [
            { label: "Zechariah 14:3-4", book: "Zechariah", chapter: 14, start: 3, end: 4 },
            { label: "Matthew 24:29-30", book: "Matthew", chapter: 24, start: 29, end: 30 },
            { label: "Jude 14-15", book: "Jude", chapter: 1, start: 14, end: 15 }
        ]
    },
    {
        id: 19,
        title: "Christ's Millennial Reign",
        summary: "A literal 1,000-year reign of peace, prosperity, and harmony by Jesus Christ on the earth.",
        focalScripture: "Revelation 20:6",
        focalText: "Blessed and holy is he that hath part in the first resurrection: on such the second death hath no power, but they shall be priests of God and of Christ, and shall reign with him a thousand years.",
        introduction: "Christ's Millennial Reign is a literal 1,000-year period of absolute peace, righteousness, and harmony on the earth, during which Jesus Christ will reign as King of kings alongside His glorified saints. This glorious age represents the fulfillment of God's covenant promises to Israel and the restoration of the earth from the devastating effects of the Fall. With the devil bound in the bottomless pit and Christ ruling from Jerusalem, the earth will be filled with the knowledge of the Lord as the waters cover the sea, creating a golden age of prosperity, peace, and spiritual harmony.",
        point1Title: "Satan Bound in the Bottomless Pit",
        point1Content: `
            <p class="doc-study-p">At the very beginning of the Millennial Reign, a powerful angel will descend from heaven with a great chain and the key of the bottomless pit. He will lay hold of the dragon, that old serpent, which is the Devil and Satan, bind him for a literal 1,000 years, cast him into the bottomless pit, shut him up, and set a seal upon him. This event is detailed in <span class="doc-inline-ref" onclick="openScripturePopup('Revelation', 20, 1, 6, 'Revelation 20:1-6')">Revelation 20:1-6</span>.</p>
            <p class="doc-study-p">With Satan bound, the primary source of temptation, spiritual deception, and demonic oppression will be completely removed from the earth. There will be no demonic suggestions, no witchcraft, no occult influences, and no national deceptions. The spiritual atmosphere of the globe will be completely clean and pure.</p>
            <p class="doc-study-p">This binding of Satan allows righteousness to flourish without active resistance. It demonstrates that when the influence of the devil is removed and the righteous rule of Christ is established, human society can experience perfect peace, justice, and absolute harmony.</p>
        `,
        point2Title: "Restoration of Peace and Environmental Harmony",
        point2Content: `
            <p class="doc-study-p">Under the righteous rule of Christ, the curse of sin that has plagued creation since the Fall will be lifted. The animal kingdom will return to its original, sinless state of perfect harmony and peace. Wild, carnivorous animals will lose their ferocity and become completely harmless. Isaiah prophesied of this restoration in <span class="doc-inline-ref" onclick="openScripturePopup('Isaiah', 11, 6, 9, 'Isaiah 11:6-9')">Isaiah 11:6-9</span>: 'The wolf also shall dwell with the lamb, and the leopard shall lie down with the kid... They shall not hurt nor destroy in all my holy mountain...'</p>
            <p class="doc-study-p">The earth will experience unprecedented physical and environmental fertility. Deserts will blossom as the rose, and waste places will be restored. Sickness, physical deformities, and early deaths will be largely eradicated. The lifespan of humans will be supernaturally extended, so that 'a child shall die an hundred years old.'</p>
            <p class="doc-study-p">There will be absolute world peace. Nations will beat their swords into plowshares, and their spears into pruninghooks. War will be completely outlawed, and military training will cease, as Micah prophesied: 'nation shall not lift up a sword against nation, neither shall they learn war any more.'</p>
        `,
        point3Title: "Jerusalem as the Center of Global Righteousness",
        point3Content: `
            <p class="doc-study-p">During the Millennium, Jesus Christ will reign physically from David's throne in the city of Jerusalem. Jerusalem will become the spiritual and political capital of the entire earth. All nations will travel to Jerusalem year after year to worship the King, the Lord of hosts, and to learn His ways. Micah prophesied of this global center of righteousness in <span class="doc-inline-ref" onclick="openScripturePopup('Micah', 4, 1, 4, 'Micah 4:1-4')">Micah 4:1-4</span>: 'But in the last days... the mountain of the house of the Lord shall be established... and many nations shall come, and say, Come, and let us go up to the mountain of the Lord...'</p>
            <p class="doc-study-p">The glorified saints—those who participated in the First Resurrection—will reign alongside Christ as kings and priests. We will be given administrative authority over cities and nations, enforcing the righteous law of Christ with absolute justice. The government will be a perfect, righteous theocracy.</p>
            <p class="doc-study-p">This reign will manifest perfect social justice. The poor, the fatherless, and the oppressed will be fully protected, and righteousness will cover the earth. It will be an age of absolute prosperity, joy, and spiritual harmony, showing the world the perfect design of God's kingdom on earth.</p>
        `,
        applicationContent: `
            <p class="doc-study-p"><strong>1. Praying Earnestly for His Kingdom:</strong> Our daily prayer taught by Jesus, 'Thy kingdom come, Thy will be done in earth, as it is in heaven,' is a longing for this Millennial Reign. We must maintain a deep, spiritual desire for the return of Christ to establish His righteous government, praying for the peace of Jerusalem and the fulfillment of His promises.</p>
            <p class="doc-study-p"><strong>2. Cultivating Peacemaking and Justice:</strong> As future co-rulers with Christ in the Millennium, we must cultivate the qualities of peacemaking, righteousness, and absolute honesty in our current lives. We must reject all forms of strife, anger, and injustice, acting as representatives of Christ's kingdom in our daily transactions and relationships.</p>
            <p class="doc-study-p"><strong>3. Finding Hope in Future Restoration:</strong> Let the promise of this glorious age anchor your soul against the current chaos, wars, political corruptions, and moral decay of our modern world. Remember that the troubles of this present time are only temporary; a glorious age of absolute peace and environmental harmony is coming, and we shall reign with Him.</p>
        `,
        refs: [
            { label: "Revelation 20:1-6", book: "Revelation", chapter: 20, start: 1, end: 6 },
            { label: "Isaiah 11:6-9", book: "Isaiah", chapter: 11, start: 6, end: 9 },
            { label: "Micah 4:1-4", book: "Micah", chapter: 4, start: 1, end: 4 }
        ]
    },
    {
        id: 20,
        title: "The Great White Throne Judgment",
        summary: "The final, inescapable judgment of all the wicked dead before God's white throne.",
        focalScripture: "Revelation 20:11",
        focalText: "And I saw a great white throne, and him that sat on it, from whose face the earth and the heaven fled away; and there was found no place for them.",
        introduction: "The Great White Throne Judgment is the final, most solemn, and escapeless court session of the universe. Occurring at the end of the Millennial Reign and after the final rebellion of Satan is crushed, all the wicked, unsaved dead of all generations will be physically resurrected to stand before God's majestic, holy white throne. They will be judged with absolute accuracy according to their thoughts, secrets, and deeds recorded in the books of heaven, and everyone whose name is not found written in the Lamb's Book of Life will be cast into the Lake of Fire, suffering eternal, conscious torment.",
        point1Title: "The Final Escapeless Court of the Universe",
        point1Content: `
            <p class="doc-study-p">At the close of the Millennial Reign, the final rebellion of humanity (instigated by Satan after his brief release) will be devoured by fire from heaven, and the devil will be cast into the Lake of Fire. Following this, the Great White Throne will appear. It is 'great' because of its infinite majesty and the volume of souls judged, and 'white' because of its absolute, blinding holiness and purity. John describes this terrifying scene in <span class="doc-inline-ref" onclick="openScripturePopup('Revelation', 20, 11, 15, 'Revelation 20:11-15')">Revelation 20:11-15</span>.</p>
            <p class="doc-study-p">The presence of the Judge on the throne will be so awesome and holy that the current heavens and earth, having been corrupted by human and demonic sin, will melt and flee away from His face, leaving the resurrected dead standing in the vast atmosphere before the sovereign Creator. There will be no place to hide, no excuse to make, and no lawyer to plead their case.</p>
            <p class="doc-study-p">All the unsaved dead of all generations—from Cain to the last rebel of the Millennium, including kings, presidents, rich men, and beggars—will stand before the throne. The sea, death, and hell will deliver up all the dead inside them, ensuring that not a single sinner escapes this final divine summons.</p>
        `,
        point2Title: "The Books Opened and Accurate Records Judged",
        point2Content: `
            <p class="doc-study-p">The judgment at the Great White Throne will be conducted with absolute, perfect justice and accuracy. There will be no false witnesses, no bribery, and no errors. God has kept a perfect register of every human life. Books will be opened containing the complete record of every thought, word, motive, secret, and action of the unrighteous. Daniel prophesied of this majestic court scene in <span class="doc-inline-ref" onclick="openScripturePopup('Daniel', 7, 9, 10, 'Daniel 7:9-10')">Daniel 7:9-10</span>: 'the judgment was set, and the books were opened.'</p>
            <p class="doc-study-p">Every secret sin that was hidden from parents, pastors, or spouses will be publicly exposed before the entire universe. Jesus warned: 'For there is nothing covered, that shall not be revealed; neither hid, that shall not be known.' The books will reveal the absolute righteousness of God's judgment, showing that every sinner deserves their sentence.</p>
            <p class="doc-study-p">Another book will be opened, which is the Lamb's Book of Life. This book contains the names of all who repented, believed the Gospel, and remained faithful to Christ, having their sins washed away by His blood. Anyone whose name is not found written in the Book of Life will be cast into the Lake of Fire, which is the second death.</p>
        `,
        point3Title: "The Purification of the Cosmos by Fire",
        point3Content: `
            <p class="doc-study-p">The Great White Throne Judgment marks the final clearing of sin and rebellion from the cosmos. The present heavens and earth, having been defiled by the presence of Satan, demons, and human sin, must undergo a complete purging by fire. Peter details this cosmic dissolution in <span class="doc-inline-ref" onclick="openScripturePopup('2 double Peter', 3, 7, 7, '2 Peter 3:7')">2 Peter 3:7</span>, noting that the present heavens and earth are kept in store, reserved unto fire against the day of judgment and perdition of ungodly men.</p>
            <p class="doc-study-p">This fire will be intense, melting the very elements with fervent heat. It will completely purge the universe of all traces of the curse, pollution, and rebellion. Out of this fiery dissolution, God will bring forth a brand-new, pristine creation, completely free from the presence of sin.</p>
            <p class="doc-study-p">This absolute purification demonstrates that God will not allow sin to exist in His eternal domain. Sin will be permanently locked away in the Lake of Fire, and the new creation will be reserved exclusively for righteousness, joy, and the eternal presence of God.</p>
        `,
        applicationContent: `
            <p class="doc-study-p"><strong>1. Ensuring Your Name is in the Book of Life:</strong> The only passport to escape the Great White Throne Judgment and the Lake of Fire is to have your name written and preserved in the Lamb's Book of Life. You must experience genuine justification and entire sanctification, and walk daily in active holiness. Do not rely on past experiences; maintain a continuous, vibrant relationship with Christ.</p>
            <p class="doc-study-p"><strong>2. Rejecting All Secret Sins and Hypocrisy:</strong> Remember daily that God registers even your secret thoughts, words, and private actions. Live a completely transparent, sincere, and honest Christian life before Him. Do not play the hypocrite; confess and forsake every hidden sin immediately, knowing that everything will be exposed at the final judgment.</p>
            <p class="doc-study-p"><strong>3. Warn the Unsaved with Tears:</strong> Use the reality of this terrifying final court to plead with sinners. Do not be indifferent to the spiritual state of your family members, friends, and neighbors. Go out with tears and deep passion, warning them to accept Christ's free pardon now, before they are summoned to stand before the Great White Throne.</p>
        `,
        refs: [
            { label: "Revelation 20:11-15", book: "Revelation", chapter: 20, start: 11, end: 15 },
            { label: "Daniel 7:9-10", book: "Daniel", chapter: 7, start: 9, end: 10 },
            { label: "2 Peter 3:7", book: "2 double Peter", chapter: 3, start: 7, end: 7 }
        ]
    },
    {
        id: 21,
        title: "The New Heaven & New Earth",
        summary: "The literal recreation of the cosmos into a sinless, eternal domain of joy in God's presence.",
        focalScripture: "Revelation 21:1",
        focalText: "And I saw a new heaven and a new earth: for the first heaven and the first earth were passed away; and there was no more sea.",
        introduction: "The doctrine of the New Heaven and the New Earth represents the glorious, eternal destiny of all redeemed saints. Following the final judgment and the complete purging of the corrupted cosmos by fire, God will literally recreate the heavens and the earth, completely free from the curse of sin, pain, sorrow, and death. He will establish His tabernacle directly among men, ushering in a glorious eternity of joy, light, and perfect communion in His presence. It is our ultimate home, motivating us to keep our garments white and our eyes fixed on things above.",
        point1Title: "The Complete Dissolution of the Old Cosmos",
        point1Content: `
            <p class="doc-study-p">The current heavens and earth, having been stained by the rebellion of angels and men, must pass away. God will not merely repair the old earth; He will perform a complete, supernatural recreation of the cosmos. John, in his prophetic vision, declared in <span class="doc-inline-ref" onclick="openScripturePopup('Revelation', 21, 1, 7, 'Revelation 21:1-7')">Revelation 21:1-7</span>: 'And I saw a new heaven and a new earth: for the first heaven and the first earth were passed away...'</p>
            <p class="doc-study-p">This new creation will have no more sea, representing the removal of all barriers, divisions, and instability. The new cosmos will be vast, glorious, and perfectly designed for the eternal dwelling of glorified beings. The New Jerusalem—the bride of the Lamb—will descend out of heaven from God, shining with the very glory of God, and adorned as a bride for her husband.</p>
            <p class="doc-study-p">This New Jerusalem will be a literal city of pure gold, jasper, and precious stones, with twelve gates of pearl. It will have no need of the sun or the moon, for the glory of God will lighten it, and the Lamb will be the light thereof. It is a city of absolute beauty and eternal stability.</p>
        `,
        point2Title: "Eternal Dwelling of God Directly with Men",
        point2Content: `
            <p class="doc-study-p">The supreme glory of the New Heaven and New Earth is not the streets of gold or gates of pearl; it is the immediate, unhindered presence of God Himself. In this eternal state, there will be no more temple or distance between God and His children. God will physically tabernacle among men, and they shall be His people, and God Himself shall be with them, and be their God. He will wipe away all tears from their eyes, as prophesied by Isaiah in <span class="doc-inline-ref" onclick="openScripturePopup('Isaiah', 65, 17, 17, 'Isaiah 65:17')">Isaiah 65:17</span>: 'For, behold, I create new heavens and a new earth...'</p>
            <p class="doc-study-p">There will be no more physical or spiritual death, neither sorrow, nor crying, neither shall there be any more physical pain, for the former things are passed away. The curse of Adam is completely eradicated. Believers will have direct, face-to-face fellowship with their Creator, experiencing an eternity of pure love, joy, and intellectual satisfaction.</p>
            <p class="doc-study-p">The pure river of water of life, clear as crystal, will proceed out of the throne of God and of the Lamb, and in the midst of the street of the city will be the tree of life, yielding her fruit every month. The leaves of the tree are for the healing of the nations, and there shall be no more curse. The saints shall serve Him, they shall see His face, and His name shall be in their foreheads.</p>
        `,
        point3Title: "The Pristine Inheritance of Complete Righteousness",
        point3Content: `
            <p class="doc-study-p">This glorious eternity is not a universal inheritance for all humanity; it is reserved strictly and exclusively for those who have been redeemed by the blood of the Lamb and have maintained a holy, white garment. No trace of sin, uncleanness, or rebellion will ever be permitted to enter this new cosmos. As promised in <span class="doc-inline-ref" onclick="openScripturePopup('2 double Peter', 3, 13, 13, '2 Peter 3:13')">2 Peter 3:13</span>: 'Nevertheless we, according to his promise, look for new heavens and a new earth, wherein dwelleth righteousness.'</p>
            <p class="doc-study-p">The scriptures warn that the fearful, the unbelieving, the abominable, murderers, whoremongers, sorcerers, idolaters, and all liars shall have their part in the Lake of Fire, which is the second death. There shall in no wise enter into the new city anything that defileth, neither whatsoever worketh abomination, or maketh a lie: but they who are written in the Lamb's Book of Life.</p>
            <p class="doc-study-p">This highlights the absolute necessity of maintaining active, uncompromised holiness throughout our earthly journey. Holiness is our spiritual passport, granting us entrance into this eternal domain of pure righteousness and light.</p>
        `,
        applicationContent: `
            <p class="doc-study-p"><strong>1. Live with Constant Heavenly Mindedness:</strong> Set your affections on things above, not on the temporary, passing, and corrupted elements of this present earth. Do not let the pursuit of worldly wealth, fame, or possessions distract you from your eternal inheritance. Live as a pilgrim, investing your time, talents, and resources in things of eternal value.</p>
            <p class="doc-study-p"><strong>2. Preserving Spiritual and Moral Purity:</strong> Knowing that only pure righteousness can enter the New Jerusalem, keep your heart and garments clean from all spots of the world. Avoid all forms of compromise, dishonesty, and sexual immorality. Walk in the light, continuously cleansing yourself from all filthiness of the flesh and spirit, perfecting holiness in the fear of God.</p>
            <p class="doc-study-p"><strong>3. Finding Comfort in Times of Earthly Suffering:</strong> Let the promise of this sorrow-free, pain-free eternity comfort your heart during present earthly trials, sicknesses, persecutions, or financial losses. Remember that our light affliction, which is but for a moment, worketh for us a far more exceeding and eternal weight of glory, and that the sufferings of this present time are not worthy to be compared with the glory that shall be revealed in us.</p>
        `,
        refs: [
            { label: "Revelation 21:1-7", book: "Revelation", chapter: 21, start: 1, end: 7 },
            { label: "Isaiah 65:17", book: "Isaiah", chapter: 65, start: 17, end: 17 },
            { label: "2 Peter 3:13", book: "2 double Peter", chapter: 3, start: 13, end: 13 }
        ]
    },
    {
        id: 22,
        title: "Hell (Eternal Punishment)",
        summary: "A literal place of everlasting fire, torment, and darkness prepared for the devil and all sinners.",
        focalScripture: "Revelation 20:15",
        focalText: "And whosoever was not found written in the book of life was cast into the lake of fire.",
        introduction: "The doctrine of Hell is the most solemn, terrifying, and urgent warning in the entire counsel of God's Word. Hell is not a metaphor, a temporary purgatory, or a state of non-existence (annihilationism). It is a literal, physical, and eternal place of conscious torment, unquenchable fire, and absolute darkness. Originally prepared by God as a final prison for the devil and his rebellious angels, it will also be the final destination of all unrepentant sinners, backsliders, and hypocrites who reject the salvation of Jesus Christ. Sparing no words, Jesus preached on Hell more than any other person in scripture, pleading with humanity to escape this place of eternal doom.",
        point1Title: "Hell as a Literal Final Prison of the Wicked",
        point1Content: `
            <p class="doc-study-p">Hell is the ultimate, eternal prison house of the universe, established by the absolute justice of God to quarantine all sin and rebellion. Sickness, corruption, and evil will be permanently separated from the new creation. Originally, Hell was not designed for humanity; it was prepared for Satan's rebellion. In His description of the sheep and goats judgment, recorded in <span class="doc-inline-ref" onclick="openScripturePopup('Matthew', 25, 41, 46, 'Matthew 25:41-46')">Matthew 25:41-46</span>, Jesus warned: 'Depart from me, ye cursed, into everlasting fire, prepared for the devil and his angels.'</p>
            <p class="doc-study-p">However, because man voluntarily chose to follow Satan's rebellion and reject God's mercy, they must share in Satan's punishment. Hell is a place of absolute separation from the presence, love, light, and grace of God. It is a region of 'outer darkness,' where there is not a single ray of hope or comfort.</p>
            <p class="doc-study-p">At the Great White Throne, death and hell will deliver up the dead in them, and after the judgment, they will be cast into the Lake of Fire, which is the final, permanent execution of the divine sentence, locking away all unrighteousness forever.</p>
        `,
        point2Title: "The Consciousness of Suffering in the Lake of Fire",
        point2Content: `
            <p class="doc-study-p">Hell is a place of intense, conscious physical and spiritual suffering. The scriptures repeatedly depict it in the most terrifying terms: a place of weeping, wailing, and gnashing of teeth, where the fire is never quenched, and the worm dieth not. Sufferers will possess resurrected bodies capable of feeling pain, yet incapable of being consumed by the fire. Jesus sounded a severe warning in <span class="doc-inline-ref" onclick="openScripturePopup('Mark', 9, 43, 48, 'Mark 9:43-48')">Mark 9:43-48</span>, declaring that it is better to cut off a hand or pluck out an eye than to go into Hell.</p>
            <p class="doc-study-p">In His account of the rich man and Lazarus, Jesus pulled back the veil of the afterlife. The rich man died, was buried, and immediately 'in hell he lift up his eyes, being in torments.' He possessed all his senses: he could see, feel the heat of the flame, remember his past life, and thirst, crying: 'Send Lazarus, that he may dip the tip of his finger in water, and cool my tongue; for I am tormented in this flame.' This proves that suffering is conscious and immediate upon death.</p>
            <p class="doc-study-p">There is no sleep, no rest, and no relief in Hell. Sufferers will endure the constant gnaw of an accusing conscience, remembering every gospel sermon they rejected, every warning they ignored, and every compromise they chose, adding spiritual torment to their physical pain.</p>
        `,
        point3Title: "The Unchanging Finality of Divine Sentence",
        point3Content: `
            <p class="doc-study-p">The most terrifying aspect of Hell is its absolute, unchanging eternity. The punishment is 'everlasting'—it has no end, no release date, and no hope of escape. The same Greek word *aionios* is used in scripture to describe both the 'everlasting life' of the righteous and the 'everlasting punishment' of the wicked, proving that both states are of equal, eternal duration. John details this finality in <span class="doc-inline-ref" onclick="openScripturePopup('Revelation', 20, 10, 15, 'Revelation 20:10-15')">Revelation 20:10-15</span>.</p>
            <p class="doc-study-p">There is a 'great gulf fixed' between heaven and hell, preventing any transition or escape. The door of mercy is permanently closed once a person dies. There is no second chance, no purgatory, and no prayers of the living can ever alter the state of a soul in Hell. Sufferers will be tormented day and night forever and ever.</p>
            <p class="doc-study-p">This unchanging finality reveals the immense value of our current life. Earth is the only place where our eternal destination can be determined. Once physical death occurs, the soul's destiny is sealed forever in either the glory of heaven or the torments of hell. Salvation through Jesus Christ is the only way of escape.</p>
        `,
        applicationContent: `
            <p class="doc-study-p"><strong>1. Value Your Salvation with Deep Thanksgiving:</strong> Appreciate the immense, infinite price Jesus Christ paid on the cross to deliver your soul from this terrifying, eternal destination. Live with continuous gratitude, praise, and total dedication to Him, recognizing that His blood has saved you from the absolute wrath of God.</p>
            <p class="doc-study-p"><strong>2. Fleeing All Secret Sins and Worldly Compromises:</strong> Do not play or compromise with sin. The pleasure of sin is only temporary, but the consequence of sin in Hell is eternal. No worldly wealth, position, or physical pleasure is worth losing your soul over. Confess and forsake every known sin immediately, and walk in strict, uncompromised holiness daily.</p>
            <p class="doc-study-p"><strong>3. Extreme Urgency in Soul Winning:</strong> Knowing the absolute, terrifying finality of Hell must compel us to win souls with intense passion and urgency. Preach the Gospel, warning every sinner you meet. Do not let family members, friends, or neighbors slide into the Lake of Fire without warning. Pull them out of the fire, testifying boldly of the salvation in Christ.</p>
        `,
        refs: [
            { label: "Matthew 25:41-46", book: "Matthew", chapter: 25, start: 41, end: 46 },
            { label: "Mark 9:43-48", book: "Mark", chapter: 9, start: 43, end: 48 },
            { label: "Revelation 20:10-15", book: "Revelation", chapter: 20, start: 10, end: 15 }
        ]
    }
];

// ==========================================================================
// INITIALIZER
// ==========================================================================
function initDoctrines() {
    doctrinesState.searchQuery = "";
    doctrinesState.selectedDoctrine = null;
    
    const searchInput = document.getElementById("doctrine-search-input");
    if (searchInput) searchInput.value = "";
    
    renderDoctrines(DOCTRINES_DATABASE);
    showDoctrinesPanel("list");
    
    // Wire up Direct Bible Reader navigation button inside scripture popup
    const readBtn = document.getElementById("doctrine-modal-read-btn");
    if (readBtn) {
        readBtn.onclick = () => {
            const popup = doctrinesState.currentActivePopup;
            if (popup && window.navigateToBibleVerse) {
                closeScripturePopup();
                window.navigateToBibleVerse(popup.book, popup.chapter, popup.start);
            }
        };
    }
}

// ==========================================================================
// RENDER DOCTRINES LIST
// ==========================================================================
function renderDoctrines(list) {
    const container = document.getElementById("doctrines-list-container");
    if (!container) return;
    container.innerHTML = "";
    
    if (list.length === 0) {
        container.innerHTML = `
            <div class="hymns-empty">
                <i class="fa-solid fa-book-bible"></i>
                <p>No doctrines found matching your query.</p>
            </div>
        `;
        return;
    }
    
    list.forEach(doc => {
        const item = document.createElement("div");
        item.className = "doctrine-card-item";
        
        const formattedNumber = String(doc.id).padStart(2, '0');
        
        item.innerHTML = `
            <div class="doctrine-number-badge">${formattedNumber}</div>
            <div class="doctrine-card-details">
                <span class="doctrine-card-title">${doc.title}</span>
                <span class="doctrine-card-meta">${doc.summary}</span>
            </div>
            <i class="fa-solid fa-chevron-right doctrine-card-arrow"></i>
        `;
        item.onclick = () => openDoctrineDetails(doc);
        container.appendChild(item);
    });
}

// ==========================================================================
// FILTER LOGIC
// ==========================================================================
function filterDoctrines(query) {
    const trimmed = query.trim().toLowerCase();
    doctrinesState.searchQuery = trimmed;
    
    if (!trimmed) {
        renderDoctrines(DOCTRINES_DATABASE);
        return;
    }
    
    const filtered = DOCTRINES_DATABASE.filter(doc => {
        const titleMatch = doc.title.toLowerCase().includes(trimmed);
        const textMatch = doc.summary.toLowerCase().includes(trimmed);
        const introMatch = doc.introduction.toLowerCase().includes(trimmed);
        const p1Match = doc.point1Content.toLowerCase().includes(trimmed) || doc.point1Title.toLowerCase().includes(trimmed);
        const p2Match = doc.point2Content.toLowerCase().includes(trimmed) || doc.point2Title.toLowerCase().includes(trimmed);
        const p3Match = doc.point3Content.toLowerCase().includes(trimmed) || doc.point3Title.toLowerCase().includes(trimmed);
        const appMatch = doc.applicationContent.toLowerCase().includes(trimmed);
        return titleMatch || textMatch || introMatch || p1Match || p2Match || p3Match || appMatch;
    });
    
    renderDoctrines(filtered);
}

// ==========================================================================
// DETAILED STUDY READING PANEL VIEW
// ==========================================================================
function openDoctrineDetails(doc) {
    doctrinesState.selectedDoctrine = doc;
    
    document.getElementById("doctrine-details-number").textContent = `Doctrine ${String(doc.id).padStart(2, '0')}`;
    document.getElementById("doctrine-details-title").textContent = doc.title;
    
    renderDoctrineDetailedContent();
    showDoctrinesPanel("reading");
}

function renderDoctrineDetailedContent() {
    const doc = doctrinesState.selectedDoctrine;
    if (!doc) return;
    
    const canvas = document.getElementById("doctrine-detailed-canvas");
    if (!canvas) return;
    
    canvas.style.fontSize = doctrinesState.currentFontSize + "px";
    
    // Assemble the complete sermon manuscript HTML on a single page!
    let html = `
        <div class="sermon-intro-section">
            <p class="doc-study-p" style="font-weight: 500; color: #f1f5f9; text-align: justify;">${doc.introduction}</p>
            
            <div class="sermon-focal-scripture">
                <span class="sermon-focal-label"><i class="fa-solid fa-bookmark"></i> Focal Text: ${doc.focalScripture}</span>
                <p class="sermon-focal-text">"${doc.focalText}"</p>
            </div>
        </div>
        
        <div class="sermon-outline-box">
            <div class="sermon-outline-title"><i class="fa-solid fa-list-check"></i> Sermon Study Outline</div>
            <ul class="sermon-outline-list">
                <li class="sermon-outline-item"><span class="sermon-outline-num">I.</span> ${doc.point1Title}</li>
                <li class="sermon-outline-item"><span class="sermon-outline-num">II.</span> ${doc.point2Title}</li>
                <li class="sermon-outline-item"><span class="sermon-outline-num">III.</span> ${doc.point3Title}</li>
            </ul>
        </div>
        
        <hr class="sermon-divider">
        
        <h4 class="doc-study-h4">POINT I: ${doc.point1Title}</h4>
        <div class="sermon-point-body">${doc.point1Content}</div>
        
        <h4 class="doc-study-h4">POINT II: ${doc.point2Title}</h4>
        <div class="sermon-point-body">${doc.point2Content}</div>
        
        <h4 class="doc-study-h4">POINT III: ${doc.point3Title}</h4>
        <div class="sermon-point-body">${doc.point3Content}</div>
        
        <hr class="sermon-divider">
        
        <div class="sermon-section-header">
            <i class="fa-solid fa-person-praying"></i> Practical Applications and Exhortation
        </div>
        <div class="sermon-application-body">${doc.applicationContent}</div>
        
        <hr class="sermon-divider">
        
        <div class="sermon-section-header">
            <i class="fa-solid fa-circle-nodes"></i> Scriptural Proofs Index
        </div>
        <p class="doc-study-p">Tap any scriptural reference below to view its corresponding KJV Bible text instantly in the scripture popup, or click the "Read Chapter" link inside the popup to jump directly to the chapter in our Bible Reader:</p>
        
        <div class="doctrine-refs-list" style="margin-top:15px; display:flex; flex-direction:column; gap:8px;">
    `;
    
    doc.refs.forEach((r, idx) => {
        html += `
            <div class="doctrine-scripture-link" style="padding:12px 16px; font-size:13px; display:flex; justify-content:space-between; align-items:center;" onclick="openScripturePopup('${r.book}', ${r.chapter}, ${r.start}, ${r.end}, '${r.label}')">
                <span style="display:flex; align-items:center; gap:8px; font-weight:700; color:#ffffff;">
                    <i class="fa-solid fa-book-bible" style="color:#f59e0b;"></i> Proof #${idx + 1}: ${r.label}
                </span>
                <i class="fa-solid fa-chevron-right" style="font-size:10px; color:#64748b;"></i>
            </div>
        `;
    });
    
    html += `
        </div>
        <div style="height: 40px;"></div>
    `;
    
    canvas.innerHTML = html;
}

function showDoctrinesPanel(panelName) {
    document.querySelectorAll(".doctrine-panel").forEach(p => p.classList.remove("active"));
    const activePanel = document.getElementById(`doctrine-${panelName}-panel`);
    if (activePanel) activePanel.classList.add("active");
    
    const container = document.querySelector(".content-container");
    if (container) container.scrollTo({ top: 0, behavior: "instant" });
}

function backToDoctrinesList() {
    showDoctrinesPanel("list");
}

function adjustDoctrinesFontSize(delta) {
    doctrinesState.currentFontSize = Math.min(24, Math.max(12, doctrinesState.currentFontSize + delta));
    renderDoctrineDetailedContent(); // Re-render to scale text sizes instantly
}

// ==========================================================================
// SCRIPTURE POPUP LOAD matrix (integrated with KJV cache)
// ==========================================================================
function openScripturePopup(book, chapter, startVerse, endVerse, label) {
    const modal = document.getElementById("doctrine-scripture-modal");
    const title = document.getElementById("doctrine-modal-title");
    const canvas = document.getElementById("doctrine-modal-body-canvas");
    
    if (!modal || !title || !canvas) return;
    
    // Set popup state
    doctrinesState.currentActivePopup = { book, chapter, start: startVerse, end: endVerse, label };
    
    title.textContent = label;
    canvas.innerHTML = `
        <div class="bible-loading" style="padding: 40px 0;">
            <i class="fa-solid fa-spinner"></i>
            <span>Fetching scripture verses...</span>
        </div>
    `;
    
    modal.classList.add("active");
    
    // Check if bible-reader.js versesCache has this chapter loaded
    const cacheKey = `${book}-${chapter}`;
    let cachedVerses = null;
    
    if (window.bibleState && window.bibleState.versesCache) {
        cachedVerses = window.bibleState.versesCache[cacheKey];
    }
    
    if (cachedVerses) {
        // Cache hit! Instant render
        setTimeout(() => renderPopupScriptureText(cachedVerses, startVerse, endVerse), 80);
    } else {
        // Cache miss: Load via HTTPS dynamic fetch and save inside cache
        const encoded = encodeURIComponent(`${book} ${chapter}`);
        fetch(`https://bible-api.com/${encoded}?translation=kjv`)
            .then(res => {
                if (!res.ok) throw new Error("Connection failed");
                return res.json();
            })
            .then(data => {
                if (data.verses && data.verses.length > 0) {
                    // Update the bibleState cache so future navigations/clicks are also cached!
                    if (window.bibleState && window.bibleState.versesCache) {
                        window.bibleState.versesCache[cacheKey] = data.verses;
                    }
                    renderPopupScriptureText(data.verses, startVerse, endVerse);
                } else {
                    throw new Error("No verses returned");
                }
            })
            .catch(err => {
                console.error("[GHS] Scripture popup fetch error:", err);
                canvas.innerHTML = `
                    <div class="hymns-empty" style="padding: 20px 10px;">
                        <i class="fa-solid fa-wifi" style="font-size:24px; color:#fb923c;"></i>
                        <p style="font-size:12px; margin-top:6px; color:#94a3b8;">Offline or fetch failed.</p>
                        <p style="font-size:10px; color:#64748b;">Please check your internet connection to load this scripture verse, or tap "Read Chapter" to try anyway.</p>
                    </div>
                `;
            });
    }
}

function renderPopupScriptureText(verses, start, end) {
    const canvas = document.getElementById("doctrine-modal-body-canvas");
    if (!canvas) return;
    canvas.innerHTML = "";
    
    const filtered = verses.filter(v => v.verse >= start && v.verse <= end);
    
    if (filtered.length === 0) {
        canvas.innerHTML = `<p style="font-size:12px; color:#64748b; text-align:center; padding:20px;">Verses not found in chapter.</p>`;
        return;
    }
    
    filtered.forEach(v => {
        const p = document.createElement("p");
        p.style.fontSize = "13px";
        p.style.lineHeight = "1.6";
        p.style.color = "#cbd5e1";
        p.style.marginBottom = "10px";
        p.innerHTML = `<strong style="color:#f59e0b; margin-right:4px;">${v.verse}.</strong> ${v.text.trim()}`;
        canvas.appendChild(p);
    });
}

function closeScripturePopup() {
    const modal = document.getElementById("doctrine-scripture-modal");
    if (modal) modal.classList.remove("active");
    doctrinesState.currentActivePopup = null;
}

// Expose handlers globally
window.initDoctrines = initDoctrines;
window.filterDoctrines = filterDoctrines;
window.openDoctrineDetails = openDoctrineDetails;
window.backToDoctrinesList = backToDoctrinesList;
window.adjustDoctrinesFontSize = adjustDoctrinesFontSize;
window.openScripturePopup = openScripturePopup;
window.closeScripturePopup = closeScripturePopup;
