export const translations = {
  en: {
    title: "Maze of Fear",
    subtitle: "A Procedural Adventure of Risk & Decisions",
    play: "Play",
    settings: "Settings",
    howToPlay: "How to Play",
    achievements: "Achievements",
    achGroupEasy: "Kolay Mod Başarımları (Easy)",
    achGroupMedium: "Orta Mod Başarımları (Medium)",
    achGroupHard: "Zor Mod Başarımları (Hard)",
    achGroupNightmare: "Kabus Mod Başarımları (Nightmare)",
    achGroupGeneral: "Genel Başarımlar (General)",
    difficulty: "Difficulty",
    diffEasy: "Easy",
    diffMedium: "Medium",
    diffHard: "Hard",
    diffNightmare: "Nightmare",
    diffPeaceful: "Peaceful",
    language: "Language",
    sound: "Sound FX",
    soundOn: "ON",
    soundOff: "OFF",
    soundTitle: "Audio Settings",
    soundVolume: "Volume Level",
    controlsTitle: "Controls",
    creepyWarning: "Did you think you could escape by muting the sound?",
    howToPlayTitle1: "Controls & Gameplay",
    howToPlayTitle2: "Obstacles & Key Items",
    howToPlayTitle3: "Chests & Mimics",
    howToPlayTitle4: "Rewarded Ads",
    obstacleGate: "🚪 Iron Gate: Requires Key.",
    obstacleIvy: "🌿 Ivy: Requires Garden Shears.",
    obstacleBarricade: "🪵 Barricade: Requires Axe.",
    obstacleChasm: "🕳️ Chasm: Requires Rope.",
    obstacleCodeLock: "🔢 Code Lock: Enter 4-digit code found in the maze.",
    howToPlayChestsHelp: "Every chest carries a risk. You might find gold, fuel, or items, but you could also trigger traps or awaken Mimics.",
    howToPlayAdsIntro: "The game is completely free! You can optionally watch rewarded ads to:",
    howToPlayAdsItem1: "Undo trap damage.",
    howToPlayAdsItem2: "Revive with full health in a safe room.",
    howToPlayAdsItem3: "Reveal escape direction without a compass.",
    analogMode: "Analog Style",
    analogFloating: "Hidden/Floating",
    analogFixed: "Fixed",
    hudCustom: "HUD Customization",
    btnEditHud: "Customize Button Layout",
    hudEditorTitle: "HUD Layout Editor",
    hudEditorHelp: "Drag buttons to reposition. Use the slider to resize the selected button.",
    hudEditorSize: "Size:",
    back: "Back",
    gamePaused: "Game Paused",
    resume: "Resume",
    restart: "Restart",
    exitToMenu: "Exit to Menu",
    rotateDevice: "Please rotate your device to landscape.",
    steps: "Steps",
    health: "Health",
    gold: "Gold",
    fuel: "Battery",
    quests: "Active Quests",
    inventory: "Inventory",
    mapTitle: "Maze Map",
    exitFound: "Find the Exit",
    compassActive: "Compass active! Exit direction highlighted.",
    compassInactive: "Use a Compass to find the exit direction.",
    noCompass: "No compass in inventory.",
    useItem: "Use Item",
    interact: "Interact",
    open: "Open",
    close: "Close",
    cancel: "Cancel",
    confirm: "Confirm",
    yes: "Yes",
    no: "No",
    skip: "Skip",

    // Items
    items: {
      key: { name: "Key", desc: "Unlocks heavy iron gates." },
      shears: { name: "Garden Shears", desc: "Cuts through thick ivy covering passages." },
      bucket: { name: "Bucket", desc: "A metal bucket. Can be filled with well water." },
      bucket_full: { name: "Filled Bucket", desc: "Filled with clean well water." },
      axe: { name: "Axe", desc: "Splits wooden barricades blockading paths." },
      rope: { name: "Rope", desc: "Used to descend safely into lower floor rope pits." },
      compass: { name: "Compass", desc: "Indicates the general direction of the exit." },
      map_piece: { name: "Map Fragment", desc: "Reveals a section of the maze when consumed." },
      fuel: { name: "Battery", desc: "Replenishes 30% of flashlight power." },
      fuel_half: { name: "Half-used Battery", desc: "Replenishes 15% of flashlight power." },
      cheese: { name: "Old Cheese", desc: "Slightly smelly. Might interest a rodent." }
    },

    // Obstacles
    obstacles: {
      gate: "A locked iron gate blocks the way. Requires a Key.",
      ivy: "Thick, thorny ivy covers the path. Requires Garden Shears.",
      barricade: "A wooden barricade blocks the corridor. Requires an Axe.",
      chasm: "A deep chasm yawns before you. Requires a Rope to cross.",
      codeLock: "A gate with a combination dial. Enter the 4-digit code.",
      ropePitWarning: "This is a deep pit. You must find a Rope in chests or from the Merchant to climb down!",
      ropePitSuccess: "You deployed the rope. Now you can descend safely!"
    },

    // Chest events
    chest: {
      prompt: "You found a mysterious chest! Do you want to open it?",
      openBtn: "Open Chest",
      leaveBtn: "Leave It",
      rewardTitle: "Fortune Favors You!",
      trapTitle: "It's a Trap!",
      mimicTitle: "A Mimic!",
      mimicText: "The chest turns out to be a mimic! It bites you for {damage} damage.",
      trapText: "A poison dart shoots out! You lose {damage} health.",
      fuelLeakText: "A battery leak drains your power. Flashlight power drained by 25%.",
      goldReward: "You found {amount} gold pieces!",
      itemReward: "You found a {item}!",
      adUndo: "Watch Ad to Undo Trap",
      adClose: "No thanks, take damage"
    },

    // NPC Dialogues
    npc: {
      mouse: {
        name: "Talking Mouse",
        greeting: "Squeak! I smell something delicious... Do you happen to have any old cheese?",
        noCheese: "Squeak! Bring me cheese from the chests, and I'll show you a secret tunnel!",
        hasCheese: "Squeak! That smell! Will you give me the cheese?",
        giveCheese: "Give Cheese",
        declineCheese: "Keep Cheese",
        thanks: "Delicious! Look at this wall behind me—press here to open a shortcut! Squeak!",
        finalQuote: "Squeak... You might escape this maze today, big guy, but remember: the end of these corridors always leads back to the very beginning..."
      },
      traveler: {
        name: "Old Sage",
        greeting: "Greetings, lost soul. You have finally awakened in the Maze of Fear... A purgatory born from the deepest corners of the mind. Do you seek answers, or just survival?",
        askWho: "Ask 'Who am I? What is this place?'",
        askEscape: "Ask 'How do I escape?'",
        askMonster: "Ask 'What is that thing in the dark?'",
        replyWho: "You are a mortal who surrendered to fear, and this labyrinth is a prison of shadow and sorrow. Escape is possible, but the toll is heavy.",
        replyEscape: "You must go deeper into the maze. You will need keys and combination codes hidden on the walls. Most importantly, never let your flashlight die.",
        replyMonster: "That is the Shadow Monster. It hunts when your light fades. Manage your batteries carefully. You can buy them from the merchant in the maze.",
        farewell: "End Dialogue"
      },
      merchant: {
        name: "Lost Merchant",
        greeting: "Ah, a customer! I have useful survival wares, but I only accept gold.",
        buy: "Buy {item} ({cost} Gold)",
        noGold: "You don't have enough gold!",
        soldOut: "Sold out!",
        done: "Goodbye"
      },
      child: {
        name: "Lost Youth",
        greeting: "I'm so thirsty... and I lost my way. Have you seen any water?",
        noWater: "I saw a well somewhere in these ruins, but I don't have anything to carry water in...",
        hasWater: "You have fresh well water! Can I have a drink?",
        giveWater: "Give Water",
        declineWater: "Keep Water",
        thanks: "Thank you! I feel much better. Here, take this half-used battery I found on the ground! (Battery added to inventory!)",
        finalQuote: "The spirits will never forget your kindness... But you should know, not every child you meet here is me. We are just the same lost souls, trapped in different bodies within this eternal loop..."
      },
      well: {
        name: "Deep Well",
        greeting: "A stone well filled with cool, fresh water.",
        drawWater: "Draw water with Bucket",
        noBucket: "It's too deep to reach the water with your hands. You need a Bucket.",
        drewWater: "You lowered the bucket and drew fresh water.",
        alreadyFull: "You already have a bucket of water."
      }
    },

    lore: {
      lore_1: "Lost Journal - Part I:\n\n\"This maze is not real. It is a prison of shadows fed by the darkest corners of our minds. I have forgotten my name... I only know that as my light dims, the whispers grow louder. Protect the light. Batteries are your most precious treasure.\"",
      lore_2: "Lost Journal - Part II:\n\n\"The Shadow Monster... it is not just darkness. It is the very despair left behind by those who fell here and lost their light. It will swallow you instantly when your lantern goes dark. Buy batteries from the merchant in the maze, he still sells gear for gold.\"",
      lore_3: "Lost Journal - Part III:\n\n\"The exit gate... it is locked with a 4-digit combination code. I left the combination on the blood-stained parchments on the walls. If you are reading this, hurry to escape the Maze of Fear. The shadows are closing in every second.\""
    },

    // Random Events
    events: {
      sound: {
        desc: "You hear a faint cry for help coming from a side corridor.",
        choice1: "Investigate (Walk toward sound)",
        choice2: "Avoid (Go opposite direction)",
        choice3: "Ignore and continue",
        resInvestigate: "You find a skeleton clutching a pouch! You gain 15 gold, but breathe in toxic spores (lose 10 health).",
        resAvoid: "You safely avoid any potential danger, but your flashlight burns extra power (-10% power) as you rush.",
        resIgnore: "You walk past. The sound fades, leaving you with an eerie silence."
      },
      shrine: {
        desc: "You discover a small, glowing stone altar dedicated to a lost deity.",
        choice1: "Offer 10 Gold for a blessing",
        choice2: "Destroy shrine for loot",
        choice3: "Leave it alone",
        resOffer: "The altar glows warmly. Your health is fully restored!",
        resDestroy: "You smash the altar! You find a Map Fragment, but a curse dims your flashlight (-30% power).",
        resIgnore: "You walk past the altar. Nothing happens."
      },
      fog: {
        desc: "A sudden, dense wave of cold fog rolls into the corridor, blinding you.",
        choice1: "Stand still and wait it out",
        choice2: "Run forward blindly",
        resWait: "You wait. The fog clears, but the cold dampness drains your flashlight power (-15% power).",
        resRun: "You run and trip over a loose stone! You take 15 damage, but end up in a different corridor."
      }
    },

    // Puzzles
    puzzle: {
      noteFound: "You find a crude note carved into the wall: \"The gate code is {code}\". Remember this!",
      keypadTitle: "Enter 4-Digit Combination",
      keypadIncorrect: "INCORRECT CODE. Alarm sounds, draining 10 Health!",
      keypadCorrect: "CODE ACCEPTED. The gate grinds open!"
    },

    // Game states
    victory: "Escape Successful!",
    victoryDesc: "You navigated the Maze of Fear and found your way back to safety!",
    gameOver: "Lost in the Dark",
    gameOverDesc: "Your health has depleted. The maze claims another explorer...",
    restart: "Start New Adventure",
    reviveBtn: "Watch Ad to Revive",
    reviveAdPrompt: "Watch a 5-second ad to revive with full health at a safe spot?",
    adWatchTitle: "Sponsor Video",
    adSeconds: "Ad closing in {sec}...",
    adRewardText: "Reward Granted!",

    // Controls Help
    controlsHelp: "Controls: Keyboard WASD/Arrows or On-Screen D-Pad. Walk up to chests, gates, and NPCs to interact.",
    directionNames: {
      north: "North",
      south: "South",
      east: "East",
      west: "West"
    }
  },
  tr: {
    title: "Maze of Fear",
    subtitle: "Risk ve Kararların Prosedürel Macerası",
    play: "Oyna",
    settings: "Ayarlar",
    howToPlay: "Nasıl Oynanır",
    achievements: "Başarımlar",
    achGroupEasy: "Kolay Mod Başarımları (Easy)",
    achGroupMedium: "Orta Mod Başarımları (Medium)",
    achGroupHard: "Zor Mod Başarımları (Hard)",
    achGroupNightmare: "Kabus Mod Başarımları (Nightmare)",
    achGroupGeneral: "Genel Başarımlar (General)",
    difficulty: "Zorluk Derecesi",
    diffEasy: "Kolay",
    diffMedium: "Orta",
    diffHard: "Zor",
    diffNightmare: "Kabus",
    diffPeaceful: "Barışçıl",
    language: "Dil",
    sound: "Ses Efektleri",
    soundOn: "AÇIK",
    soundOff: "KAPALI",
    soundTitle: "Ses Ayarları",
    soundVolume: "Ses Seviyesi",
    controlsTitle: "Kontroller",
    creepyWarning: "Sesi Kapatarak Kaçabileceğini mi sandın?",
    howToPlayTitle1: "Kontroller & Oynanış",
    howToPlayTitle2: "Engeller & Çözümler",
    howToPlayTitle3: "Sandıklar & Mimicler",
    howToPlayTitle4: "Ödüllü Reklamlar",
    obstacleGate: "🚪 Demir Kapı: Anahtar (Key) gerektirir.",
    obstacleIvy: "🌿 Sarmaşıklar: Bahçe Makası (Garden Shears) gerektirir.",
    obstacleBarricade: "🪵 Ahşap Barikat: Balta (Axe) gerektirir.",
    obstacleChasm: "🕳️ Uçurum: Halat (Rope) gerektirir.",
    obstacleCodeLock: "🔢 Şifreli Geçit: Labirentte bulacağınız 4 haneli şifreyi girin.",
    howToPlayChestsHelp: "Her sandık risk taşır. Değerli altınlar, fener pili veya ekipman çıkabileceği gibi; tuzaklar veya sandık canavarları (Mimic) da çıkabilir.",
    howToPlayAdsIntro: "Oyun tamamen ücretsizdir! İsteğe bağlı olarak ödüllü reklam izleyerek:",
    howToPlayAdsItem1: "Tuzak hasarını iptal edebilirsiniz (Undo).",
    howToPlayAdsItem2: "Öldüğünüzde tam sağlıkla canlanabilirsiniz (Revive).",
    howToPlayAdsItem3: "Pusula olmasa bile çıkış yönünü görebilirsiniz.",
    analogMode: "Analog Tarzı",
    analogFloating: "Gizli/Yüzen",
    analogFixed: "Sabit",
    hudCustom: "HUD Özelleştirme",
    btnEditHud: "Buton Düzenini Özelleştir",
    hudEditorTitle: "HUD Düzenleme Modu",
    hudEditorHelp: "Taşımak için butonları sürükleyin. Seçili butonu boyutlandırmak için kaydırıcıyı kullanın.",
    hudEditorSize: "Boyut:",
    back: "Geri",
    gamePaused: "Oyun Durduruldu",
    resume: "Devam Et",
    restart: "Yeniden Başla",
    exitToMenu: "Ana Menüye Dön",
    rotateDevice: "Lütfen cihazınızı yatay konuma getirin.",
    steps: "Adım",
    health: "Sağlık",
    gold: "Altın",
    fuel: "Pil",
    quests: "Aktif Görevler",
    inventory: "Envanter",
    mapTitle: "Labirent Haritası",
    exitFound: "Çıkışı Bul",
    compassActive: "Pusula aktif! Çıkış yönü gösteriliyor.",
    compassInactive: "Çıkış yönünü görmek için Pusula kullanın.",
    noCompass: "Envanterde pusula yok.",
    useItem: "Eşyayı Kullan",
    interact: "Etkileşim",
    open: "Aç",
    close: "Kapat",
    cancel: "İptal",
    confirm: "Onayla",
    yes: "Evet",
    no: "Hayır",
    skip: "Geç",

    // Items
    items: {
      key: { name: "Anahtar", desc: "Ağır demir kapıları açar." },
      shears: { name: "Bahçe Makası", desc: "Geçitleri tıkayan kalın sarmaşıkları keser." },
      bucket: { name: "Kova", desc: "Metal bir kova. Kuyudan su doldurmak için kullanılır." },
      bucket_full: { name: "Dolu Kova", desc: "Temiz kuyu suyu ile dolu." },
      axe: { name: "Balta", desc: "Yolları kapatan ahşap barikatları parçalar." },
      rope: { name: "Halat", desc: "Alt katlardaki derin kuyulardan aşağı inmek için kullanılır." },
      compass: { name: "Pusula", desc: "Çıkışın genel yönünü gösterir." },
      map_piece: { name: "Harita Parçası", desc: "Kullanıldığında labirentin bir kısmını açar." },
      fuel: { name: "Pil", desc: "El feneri gücünü %30 doldurur." },
      fuel_half: { name: "Yarım Pil", desc: "El feneri gücünü %15 doldurur." },
      cheese: { name: "Eski Peynir", desc: "Biraz kokulu. Bir kemirgenin ilgisini çekebilir." }
    },

    // Obstacles
    obstacles: {
      gate: "Kilitli bir demir kapı yolu kapatıyor. Anahtar gerekiyor.",
      ivy: "Geçidi kalın, dikenli sarmaşıklar sarmış. Bahçe Makası gerekiyor.",
      barricade: "Ahşap bir barikat koridoru kapatıyor. Balta gerekiyor.",
      chasm: "Önünüzde dipsiz bir uçurum uzanıyor. Karşıya geçmek için Halat gerekiyor.",
      codeLock: "Şifreli kadranı olan bir kapı. 4 haneli şifreyi girin.",
      ropePitWarning: "Burası derin bir çukur. Aşağı inmek için sandıklardan veya Tüccardan bir Halat bulmalısın!",
      ropePitSuccess: "Halatı çukura sarkıttın. Artık güvenle aşağı inebilirsin!"
    },

    // Chest events
    chest: {
      prompt: "Gizemli bir sandık buldunuz! Açmak istiyor musunuz?",
      openBtn: "Sandığı Aç",
      leaveBtn: "Bırak Git",
      rewardTitle: "Şans Senden Yana!",
      trapTitle: "Bu Bir Tuzak!",
      mimicTitle: "Taklitçi (Mimic)!",
      mimicText: "Sandık bir canavara dönüştü! Seni ısırarak {damage} hasar verdi.",
      trapText: "Zehirli bir iğne fırladı! {damage} sağlık kaybettiniz.",
      fuelLeakText: "Pil sızıntısı ışığınızı körletti. El feneri gücü %25 azaldı.",
      goldReward: "Sandıktan {amount} altın çıktı!",
      itemReward: "Bir {item} buldunuz!",
      adUndo: "Tuzaktan Kaçmak İçin Reklam İzle",
      adClose: "Hayır, hasarı kabul et"
    },

    // NPC Dialogues
    npc: {
      mouse: {
        name: "Konuşan Fare",
        greeting: "Ciyak! Nefis bir koku alıyorum... Yanında eski peynir var mı?",
        noCheese: "Ciyak! Sandıklardan bana peynir getir, sana gizli bir geçit göstereyim!",
        hasCheese: "Ciyak! Bu koku! Peyniri bana verir misin?",
        giveCheese: "Peyniri Ver",
        declineCheese: "Peyniri Sakla",
        thanks: "Nefis! Arkamdaki duvara bak—kestirme yolu açmak için buraya bas! Ciyak!",
        finalQuote: "Ciyak... Bugün bu labirentten çıkabilirsin belki koca adam, ama unutma; bu dehlizlerin sonu her zaman en başına çıkar..."
      },
      traveler: {
        name: "Yaşlı Bilge",
        greeting: "Selam kayıp ruh. Nihayet Korku Labirenti'nde uyandın...",
        farewell: "Sohbeti Bitir",
        levels: {
          1: {
            greeting: "Selam kayıp ruh. Nihayet Korku Labirenti'nde uyandın... Zihninin en karanlık köşelerinden beslenen bu kapanda cevaplar mı arıyorsun, yoksa sadece hayatta kalmak mı?",
            q1: "Ben kimim? Burası neresi?",
            a1: "Sen korkularına teslim olmuş bir faniyisin. Adını unuttun ama buraya geliş amacın geçmişindeki derin bir pişmanlıktır.",
            q2: "Labirentten nasıl kaçarım?",
            a2: "İlerlemelisin. Çıkış kapısının şifreleri duvar parşömenlerine kazındı. En önemlisi, fenerinin pillerini idareli kullan.",
            q3: "Karanlıktaki o mahluk da nedir?",
            a3: "O, Gölge Avcısı. Işığın söndüğünde seni avlar. Işık senin tek sığınağındır."
          },
          2: {
            greeting: "Yeniden karşılaştık. İlk adımları attın ama dehlizler daha da daralıyor. Fenerinin ateşi titriyor...",
            q1: "Sen kimsin bilge kişi? Neden buradasın?",
            a1: "Ben bu zindanın ilk mahkumuyum. Asırlar önce bu labirent inşa edildiğinde buraya kilitlendim.",
            q2: "Sandıklardaki mektuplar ne anlama geliyor?",
            a2: "Onlar senden önce gelenlerin son çığlıkları. Dikkatli oku, sırları kavra."
          },
          3: {
            greeting: "Daha derine ilerliyorsun. Yolunda garip bir tüccarla karşılaşabilirsin...",
            q1: "Tüccar güvenilir biri mi?",
            a1: "O sadece altın karşılığı pil satar. Ancak dikkat et, altın ararken tuzağa düşme.",
            q2: "Duvarlardaki semboller ne anlatıyor?",
            a2: "Onlar labirentin kadim koruyucularına ait mühürlerdir."
          },
          4: {
            greeting: "Labirentin derinliklerinde susuzluktan kıvranan küçük bir çocuk dolaşır...",
            q1: "Çocuk bir illüzyon mu?",
            a1: "O da senin gibi bu labirentte yolunu kaybetmiş masum bir ruh. Ona yardım etmeyi seçersen iyilik seni korur.",
            q2: "Neden bazı kapılar şifreli?",
            a2: "Korkunun koruyucuları en büyük sırları şifreli kilitlerin arkasına sakladı."
          },
          5: {
            greeting: "Yakında ilk katın sonuna ulaşacaksın. Ama altındaki zindanlar buradan çok daha karanlık...",
            q1: "Alt katlarda bizi ne bekliyor?",
            a1: "Işığın neredeyse hiç ulaşmadığı zifiri zindanlar. Alt kata inebilmek için bir halat bulmalısın.",
            q2: "Hiç buradan kurtulan oldu mu?",
            a2: "Efsaneler 20 kapıyı geçen birinin kurtulduğunu söyler. Ama bedeli ağırdır."
          },
          6: {
            greeting: "Hazır ol. Bir sonraki seviyede ilk defa yerin altına, zindan katlarına ineceksin...",
            q1: "Zindanda gezinmek daha mı zor?",
            a1: "Evet. Alt katta tavan kararır, ortam zifiri karanlığa bürünür. Fenerin pillerini harcarken çok dikkatli ol.",
            q2: "Halatı nerede bulabilirim?",
            a2: "Sandıkların içinde gizlenmiş halatlar bulacaksın. O halatla derin zindan çukuruna inebilirsin."
          },
          7: {
            greeting: "İşte ilk zindan katı... Gökyüzü artık yok. Sadece soğuk zindan taşları ve karanlık var.",
            q1: "Duvarlardaki tablolar kimin?",
            a1: "Labirentin eski lordlarına ve gölge yaratıklarına ait tablolardır. Onlara fazla bakma...",
            q2: "Neden sesler duyuyorum?",
            a2: "Zindan ruhların yankılarıyla doludur. Korkunu kontrol et."
          },
          8: {
            greeting: "Derin zindanda ilerliyorsun. Fenerin pilleri hızla tükeniyor, öyle değil mi?",
            q1: "Işığım biterse ne olur?",
            a1: "Karanlık seni saniyeler içinde yutar. Gölge Yaratığı asla acımaz.",
            q2: "Kaç kat daha aşağı inebiliriz?",
            a2: "Daha da derin zindan katları var... En alttaki kanlı zindan en tehlikelisisidir."
          },
          9: {
            greeting: "Duvar diplerinde bir fare ciyaklıyor... Onu küçümseme.",
            q1: "Fare ne işe yarar?",
            a1: "Ona sandıktan bulduğun bir parça peynir verirsen sana gizli geçitleri gösterecektir.",
            q2: "Zindanın haritası değişiyor mu?",
            a2: "Her seviyede labirent zihnine göre yeniden şekilledir."
          },
          10: {
            greeting: "Yolun yarısına geldin yürekli savaşçı. 10 seviye geride kaldı...",
            q1: "Geçmişimi hatırlamaya başladım...",
            a1: "Güzel. Hatırladıkça labirentin üzerindeki gücü azalacaktır.",
            q2: "Önümüzdeki seviyeler daha mı zor?",
            a2: "Daha büyük labirentler ve 3 katlı derin zindanlar seni bekliyor."
          },
          11: {
            greeting: "Labirent genişliyor. Artık 2 katlı zindan dehlizlerindesin.",
            q1: "Harita parçalarını bulmak şart mı?",
            a1: "Harita parçaları körlemesine kaybolmanı önler.",
            q2: "Gölge Canavarı yaklaştığında ne yapmalıyım?",
            a2: "Hemen fenerini yak ve geriye bakmadan koş."
          },
          12: {
            greeting: "Zindandaki fısıltılar güçleniyor... Son kat yaklaşıyor.",
            q1: "Sesler bana ne söylüyor?",
            a1: "Zihnine şüphe ekmeye çalışıyorlar. Dinleme.",
            q2: "Tüccar neden buralarda dolaşıyor?",
            a2: "Tüccar da buranın lanetine mahkum bir tüccar ruhudur."
          },
          13: {
            greeting: "Bir sonraki seviyede en derin 3. kata ineceksin. Kanlı Zindan Katı...",
            q1: "Kanlı Zindan nedir?",
            a1: "En alt kattaki kızıl kuyu. Sis kan kırmızısıdır ve fenerin paranormal şekilde titrer.",
            q2: "Oraya inmek zorunda mıyım?",
            a2: "Çıkış kapısına ulaşmak için o katı geçmek zorundasın."
          },
          14: {
            greeting: "İşte 3. Kat... Kanlı Zindan'dasın. Sis kızıl ve fenerin fısıldıyor...",
            q1: "Duvarlar neden kızıl renkte?",
            a1: "Burası korkunun merkezidir. Sadece en cesurlar buradan canlı çıkar.",
            q2: "Görüş mesafem çok azaldı!",
            a2: "Evet, kan sisi ışığı yutar. Yavaş ve dikkatli ilerle."
          },
          15: {
            greeting: "Duvarlardaki tabloların gözleri seni takip ediyor...",
            q1: "Tablolar canlanacak mı?",
            a1: "Hayır ama zihnini sarsabilirler. Işığına odaklan.",
            q2: "Son seviyeler yaklaşıyor mu?",
            a2: "Evet, 20. seviye bu kabusun sonudur."
          },
          16: {
            greeting: "Harabelerdeki eski kuyular ve susuz kalan ruhlar...",
            q1: "Kovayla su çekmenin faydası ne?",
            a1: "Susuz kalan kayıp çocuğa yardım edebilirsin.",
            q2: "Ödül olarak ne veriyor?",
            a2: "Sana fenerin için pil verecektir."
          },
          17: {
            greeting: "En alt kattan zemin kata çıktığında gökyüzüne bak... Yıldızlar hala orada.",
            q1: "Orion takımyıldızını gördüm...",
            a1: "O yıldızlar umudun simgesidir. Yolunu aydınlatır.",
            q2: "Az kaldı mı?",
            a2: "Sadece 3 seviye kaldı."
          },
          18: {
            greeting: "18. seviye... Labirentin duvarları çatlıyor!",
            q1: "Gölge Canavarı daha hızlı mı?",
            a1: "Son seviyelerde daha agresiftir. Asla durma.",
            q2: "Şifreler daha mı zor?",
            a2: "Dikkatli oku, 4 haneli şifreleri hemen bulacaksın."
          },
          19: {
            greeting: "20. seviyeden önceki son engel. Hazır mısın?",
            q1: "Bütün bu olanlar gerçek miydi?",
            a1: "Zihninle verdiğin savaştı. Son kapıyı açtığında özgürsün.",
            q2: "Sana ne olacak Bilge?",
            a2: "Ben burada kalacağım, yeni kayıp ruhları yönlendirmek için..."
          },
          20: {
            greeting: "Tebrikler kahraman. 20 seviyelik kabusu aştın ve son kapının önündesin!",
            q1: "Kaçış kapısının şifresi nedir?",
            a1: "Duvar parşömenlerini okudun. Son şifreyi gir ve özgürlüğüne kavuş!",
            q2: "Elveda bilge kişi...",
            a2: "Elveda kayıp ruh. Işığın hiç sönmesin..."
          }
        }
      },
      merchant: {
        name: "Kayıp Tüccar",
        greeting: "Ah, bir müşteri! Hayatta kalmana yarayacak eşyalarım var ama sadece altın kabul ederim.",
        buy: "{item} Satın Al ({cost} Altın)",
        noGold: "Yeterli altının yok!",
        soldOut: "Tükendi!",
        done: "Güle güle"
      },
      child: {
        name: "Kayıp Genç",
        greeting: "Çok susadım... ve yolumu kaybettim. Hiç su gördün mü?",
        noWater: "Bu harabelerde bir kuyu görmüştüm ama su taşıyacak hiçbir şeyim yok...",
        hasWater: "Taze kuyu suyun var! Bir yudum içebilir miyim?",
        giveWater: "Suyu Ver",
        declineWater: "Suyu Sakla",
        thanks: "Teşekkürler! Çok daha iyi hissediyorum. Yerde bulduğum bu yarım pili al, işine yarayabilir! (Pil envanterine eklendi!)",
        finalQuote: "Ruhlar senin iyiliğini asla unutmayacak... Ama bilmelisin ki, bu labirentte karşılaştığın her çocuk ben değilim. Biz sadece bu lanetli döngüde farklı bedenlerde sıkışıp kalmış aynı kayıp ruhlarız..."
      },
      well: {
        name: "Derin Kuyu",
        greeting: "Serin, taze suyla dolu taş bir kuyu.",
        drawWater: "Kova ile su çek",
        noBucket: "Suya elinle ulaşamayacak kadar derin. Bir Kovaya ihtiyacın var.",
        drewWater: "Kovayı sarkıtıp taze su çektiniz.",
        alreadyFull: "Zaten su dolu bir kovanız var."
      }
    },

    lore: {
      lore_1: "Kayıp Günlük - Parça I:\n\n\"Bu labirent gerçek değil. Burası zihnimizin karanlık köşelerinden beslenen gölgelerin hapishanesi. Adımı unuttum... Sadece ışığım azaldıkça fısıltıların arttığını biliyorum. Işığı koruyun. Piller en değerli hazinenizdir.\"",
      lore_2: "Kayıp Günlük - Parça II:\n\n\"Gölge Canavarı... o sadece karanlıktan ibaret değil. O, buraya düşüp ışığı sönenlerin geride bıraktığı umutsuzluğun ta kendisi. Feneriniz kapandığında sizi anında yutacaktır. Labirentteki tüccardan pilleri satın alabilirsiniz, o hâlâ altın karşılığında eşya satıyor.\"",
      lore_3: "Kayıp Günlük - Parça III:\n\n\"Çıkış kapısı... 4 haneli şifreyle kilitlenmiş. Şifreyi duvarlardaki kanlı parşömenlerde bıraktım. Eğer bu notu okuyorsan, Korku Labirenti'nden kaçmak için acele et. Gölgeler her saniye daha da yaklaşıyor.\""
    },

    // Random Events
    events: {
      sound: {
        desc: "Yan koridorların birinden zayıf bir yardım çığlığı duyuyorsunuz.",
        choice1: "Araştır (Sese doğru yürü)",
        choice2: "Kaçın (Tersi yöne git)",
        choice3: "Umursama ve devam et",
        resInvestigate: "Bir kese altın tutan bir iskelet buldunuz! 15 altın kazandınız ancak zehirli sporları soludunuz (10 sağlık kaybettiniz).",
        resAvoid: "Olası tehlikelerden kaçındınız, ancak aceleyle uzaklaşırken feneriniz ekstra yakıt yaktı (-%10 yakıt).",
        resIgnore: "Yürümeye devam ettiniz. Ses kayboldu, yerini ürpertici bir sessizliğe bıraktı."
      },
      shrine: {
        desc: "Kayıp bir tanrıya adanmış, parıldayan küçük bir taş sunak buldunuz.",
        choice1: "Kutsanmak için 10 Altın sun",
        choice2: "Ganimet için sunağı parçala",
        choice3: "Kendi haline bırak",
        resOffer: "Sunak sıcak bir ışıkla parlıyor. Sağlığınız tamamen yenilendi!",
        resDestroy: "Sunağı parçaladınız! Bir Harita Parçası buldunuz ancak feneriniz lanetlendi (-%30 yakıt).",
        resIgnore: "Sunağın yanından geçip gittiniz. Hiçbir şey olmadı."
      },
      fog: {
        desc: "Koridora aniden soğuk ve yoğun bir sis dalgası çökerek görüşünüzü tamamen kapatıyor.",
        choice1: "Kıpırdamadan sisin geçmesini bekle",
        choice2: "Körlemesine ileri doğru koş",
        resWait: "Beklediniz. Sis dağıldı ancak soğuk nem fener yakıtınızı tüketti (-%15 yakıt).",
        resRun: "Koşarken gevşek bir taşa takılıp düştünüz! 15 hasar aldınız ancak kendinizi başka bir koridorda buldunuz."
      }
    },

    // Puzzles
    puzzle: {
      noteFound: "Duvara kazınmış basit bir not buldunuz: \"Kapı şifresi: {code}\". Bunu unutmayın!",
      keypadTitle: "4 Haneli Şifreyi Girin",
      keypadIncorrect: "YANLIŞ ŞİFRE. Alarm çalıyor, 10 Sağlık kaybedildi!",
      keypadCorrect: "ŞİFRE KABUL EDİLDİ. Kapı gıcırdayarak açılıyor!"
    },

    // Game states
    victory: "Kaçış Başarılı!",
    victoryDesc: "Maze of Fear'ı aştınız ve güvenli bölgeye giden yolu buldunuz!",
    gameOver: "Karanlıkta Kayboluş",
    gameOverDesc: "Sağlığınız tükendi. Labirent bir kaşifi daha yuttu...",
    restart: "Yeni Maceraya Başla",
    reviveBtn: "Canlanmak İçin Reklam İzle",
    reviveAdPrompt: "Güvenli bir odada tam sağlıkla canlanmak için 5 saniyelik reklam izlensin mi?",
    adWatchTitle: "Sponsor Videosu",
    adSeconds: "Reklamın bitmesine {sec} saniye...",
    adRewardText: "Ödül Kazanıldı!",

    // Controls Help
    controlsHelp: "Kontroller: Klavyede WASD/Yön Tuşları veya Ekran D-Padi. Etkileşime geçmek için sandıklara, kapılara ve NPC'lere doğru yürüyün.",
    directionNames: {
      north: "Kuzey",
      south: "Güney",
      east: "Doğu",
      west: "Batı"
    }
  }
};
