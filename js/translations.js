export const translations = {
  en: {
    title: "Maze of Choices",
    subtitle: "A Procedural Adventure of Risk & Decisions",
    play: "Play Game",
    settings: "Settings",
    howToPlay: "How to Play",
    difficulty: "Maze Size",
    diffEasy: "Small (11x11)",
    diffMedium: "Medium (15x15)",
    diffHard: "Large (21x21)",
    language: "Language",
    sound: "Sound FX",
    soundOn: "ON",
    soundOff: "OFF",
    analogMode: "Analog Style",
    analogFloating: "Hidden/Floating",
    analogFixed: "Fixed",
    hudCustom: "HUD Customization",
    btnEditHud: "Customize Button Layout",
    hudEditorTitle: "HUD Layout Editor",
    hudEditorHelp: "Drag buttons to reposition. Use the slider to resize the selected button.",
    hudEditorSize: "Size:",
    back: "Back",
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
      rope: { name: "Rope", desc: "Used to cross bottomless chasms safely." },
      compass: { name: "Compass", desc: "Indicates the general direction of the exit." },
      map_piece: { name: "Map Fragment", desc: "Reveals a section of the maze when consumed." },
      fuel: { name: "Battery", desc: "Replenishes 30% of flashlight power." },
      cheese: { name: "Old Cheese", desc: "Slightly smelly. Might interest a rodent." }
    },

    // Obstacles
    obstacles: {
      gate: "A locked iron gate blocks the way. Requires a Key.",
      ivy: "Thick, thorny ivy covers the path. Requires Garden Shears.",
      barricade: "A wooden barricade blocks the corridor. Requires an Axe.",
      chasm: "A deep chasm yawns before you. Requires a Rope to cross.",
      codeLock: "A gate with a combination dial. Enter the 4-digit code."
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
        thanks: "Delicious! Look at this wall behind me—press here to open a shortcut! Squeak!"
      },
      traveler: {
        name: "Old Traveler",
        greeting: "Greetings, wanderer. I have traversed these corridors for years. My eyes are weak, but my memory is sharp.",
        askExit: "Ask about Exit",
        askCode: "Ask about Combination Codes",
        exitHint: "I believe the escape lies to the {direction} of here. Tread carefully.",
        codeHint: "Ah, the combination lock? I remember seeing a scribbled note on the wall in a remote room. Keep your eyes peeled.",
        farewell: "Keep moving, child. Do not let your light fade."
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
        thanks: "Thank you! I feel much better. Here, I found this shiny thing on the floor. Take it! (Got a Key!)"
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
    victoryDesc: "You navigated the Maze of Choices and found your way back to safety!",
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
    title: "Seçimler Labirenti",
    subtitle: "Risk ve Kararların Prosedürel Macerası",
    play: "Oyunu Başlat",
    settings: "Ayarlar",
    howToPlay: "Nasıl Oynanır",
    difficulty: "Labirent Boyutu",
    diffEasy: "Küçük (11x11)",
    diffMedium: "Orta (15x15)",
    diffHard: "Büyük (21x21)",
    language: "Dil",
    sound: "Ses Efektleri",
    soundOn: "AÇIK",
    soundOff: "KAPALI",
    analogMode: "Analog Tarzı",
    analogFloating: "Gizli/Yüzen",
    analogFixed: "Sabit",
    hudCustom: "HUD Özelleştirme",
    btnEditHud: "Buton Düzenini Özelleştir",
    hudEditorTitle: "HUD Düzenleme Modu",
    hudEditorHelp: "Taşımak için butonları sürükleyin. Seçili butonu boyutlandırmak için kaydırıcıyı kullanın.",
    hudEditorSize: "Boyut:",
    back: "Geri",
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
      rope: { name: "Halat", desc: "Dipsiz uçurumlardan güvenle geçmek için kullanılır." },
      compass: { name: "Pusula", desc: "Çıkışın genel yönünü gösterir." },
      map_piece: { name: "Harita Parçası", desc: "Kullanıldığında labirentin bir kısmını açar." },
      fuel: { name: "Pil", desc: "El feneri gücünü %30 doldurur." },
      cheese: { name: "Eski Peynir", desc: "Biraz kokulu. Bir kemirgenin ilgisini çekebilir." }
    },

    // Obstacles
    obstacles: {
      gate: "Kilitli bir demir kapı yolu kapatıyor. Anahtar gerekiyor.",
      ivy: "Geçidi kalın, dikenli sarmaşıklar sarmış. Bahçe Makası gerekiyor.",
      barricade: "Ahşap bir barikat koridoru kapatıyor. Balta gerekiyor.",
      chasm: "Önünüzde dipsiz bir uçurum uzanıyor. Karşıya geçmek için Halat gerekiyor.",
      codeLock: "Şifreli kadranı olan bir kapı. 4 haneli şifreyi girin."
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
        thanks: "Nefis! Arkamdaki duvara bak—kestirme yolu açmak için buraya bas! Ciyak!"
      },
      traveler: {
        name: "Yaşlı Gezgin",
        greeting: "Selam yabancı. Yıllardır bu koridorları arşınlarım. Gözlerim zayıf ama hafızam keskindir.",
        askExit: "Çıkışı Sor",
        askCode: "Şifreleri Sor",
        exitHint: "Kaçış yolunun buradan {direction} yönünde olduğuna inanıyorum. Dikkatli yürü.",
        codeHint: "Ah, şifreli kapı mı? Uzak bir odada duvara karalanmış bir not gördüğümü hatırlıyorum. Gözünü açık tut.",
        farewell: "Yola devam et evladım. Işığının sönmesine izin verme."
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
        thanks: "Teşekkürler! Çok daha iyi hissediyorum. Bunu yerde bulmuştum, al senin olsun! (Anahtar kazandın!)"
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
    victoryDesc: "Seçimler Labirentini aştınız ve güvenli bölgeye giden yolu buldunuz!",
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
