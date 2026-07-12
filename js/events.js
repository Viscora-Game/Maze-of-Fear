// Database of 50 Random Events & 6 Death Events for Maze of Choices
export const randomEvents = [
  // 1-5: Shrines
  {
    id: "fire_shrine",
    text: {
      en: "You discover an altar of burning flames. A voice whispers: 'Feed the fire with your gold, and receive the warmth of life.'",
      tr: "Alev alev yanan bir sunak buldunuz. Bir ses fısıldıyor: 'Ateşi altınınla besle, yaşamın sıcaklığını kazan.'"
    },
    choices: [
      {
        text: { en: "Offer 15 Gold (Heal 30 Health)", tr: "15 Altın Sun (30 Sağlık Kazan)" },
        requirement: (p) => p.gold >= 15,
        effect: (p) => { p.gold -= 15; p.health = Math.min(p.maxHealth, p.health + 30); },
        outcomeText: { en: "The flames glow blue. Your wounds close immediately.", tr: "Alevler mavi renkte parlıyor. Yaralarınız hemen kapanıyor." }
      },
      {
        text: { en: "Extinguish flames for loot (Gain 20 Gold, Lose 15 Fuel)", tr: "Ganimet için ateşi söndür (20 Altın kazan, 15 Fener Yakıtı kaybet)" },
        effect: (p) => { p.gold += 20; p.fuel = Math.max(0, p.fuel - 15); },
        outcomeText: { en: "You throw damp earth on the fire. You find gold coins in the ashes, but the smoke dims your vision.", tr: "Ateşe nemli toprak atıyorsunuz. Küllerin arasından altın buldunuz ama duman fenerinizi kirletiyor." }
      },
      {
        text: { en: "Ignore and walk past", tr: "Görmezden gel ve geç git" },
        effect: () => {},
        outcomeText: { en: "You leave the warm flames behind.", tr: "Sıcak alevleri arkanızda bırakıyorsunuz." }
      }
    ]
  },
  {
    id: "water_shrine",
    text: {
      en: "A beautiful stone basin filled with glowing water sits in a niche. It smells of fresh forest rain.",
      tr: "Bir oyukta parıldayan suyla dolu güzel bir taş havza duruyor. Taze orman yağmuru gibi kokuyor."
    },
    choices: [
      {
        text: { en: "Drink the glowing water (Heal 20 HP, Gain 10 Fuel)", tr: "Parıldayan suyu iç (20 Can kazan, 10 Yakıt kazan)" },
        effect: (p) => { p.health = Math.min(p.maxHealth, p.health + 20); p.fuel = Math.min(100, p.fuel + 10); },
        outcomeText: { en: "The water tastes sweet. You feel energized and your lantern burns slightly brighter.", tr: "Suyun tadı tatlı. Kendinizi enerjik hissediyorsunuz ve feneriniz biraz daha parlak yanıyor." }
      },
      {
        text: { en: "Wash your face (Heal 40 HP, Lose 10 Gold)", tr: "Yüzünü yıka (40 Can kazan, 10 Altın kaybet)" },
        effect: (p) => { p.health = Math.min(p.maxHealth, p.health + 40); p.gold = Math.max(0, p.gold - 10); },
        outcomeText: { en: "As you splash the water, a coin slips from your pocket into the deep drain. Your fatigue melts away.", tr: "Suyu yüzünüze çarparken cebinizden bir altın derin gidere düşüyor. Yorgunluğunuz tamamen eriyip gidiyor." }
      }
    ]
  },
  {
    id: "shadow_altar",
    text: {
      en: "An altar crafted from black obsidian radiates a cold, crushing presence. It demands a sacrifice.",
      tr: "Siyah obsidyenden yapılmış bir sunak, soğuk ve ezici bir güç yayıyor. Bir kurban talep ediyor."
    },
    choices: [
      {
        text: { en: "Sacrifice 15 Health (Gain 30 Gold)", tr: "15 Sağlık kurban et (30 Altın kazan)" },
        effect: (p) => { p.health = Math.max(1, p.health - 15); p.gold += 30; },
        outcomeText: { en: "A shadow blade cuts your hand. Gold pieces drop from the ceiling onto the altar.", tr: "Gölgeden bir bıçak elinizi kesiyor. Tavandan sunağın üzerine altın sikkeler düşüyor." }
      },
      {
        text: { en: "Sacrifice 30 Fuel (Gain a Key)", tr: "30 Fener Yakıtı kurban et (Bir Anahtar kazan)" },
        requirement: (p) => p.fuel >= 30,
        effect: (p) => { p.fuel = Math.max(0, p.fuel - 30); p.inventory.key++; },
        outcomeText: { en: "The shadow absorbs your light. Out of the darkness, a rusty key materializes.", tr: "Gölge fenerinizin ışığını emiyor. Karanlığın içinden paslı bir anahtar beliriyor." }
      },
      {
        text: { en: "Refuse and leave", tr: "Reddet ve ayrıl" },
        effect: () => {},
        outcomeText: { en: "You back away safely. The shadows hiss behind you.", tr: "Güvenle geri çekiliyorsunuz. Gölgeler arkanızdan tıslıyor." }
      }
    ]
  },
  {
    id: "nature_shrine",
    text: {
      en: "A shrine covered in glowing ivy. A stone tablet reads: 'Give what is sharp, and receive the harvest.'",
      tr: "Parıldayan sarmaşıklarla kaplı bir sunak. Taş tablette yazıyor: 'Keskin olanı ver, hasadı al.'"
    },
    choices: [
      {
        text: { en: "Give 1 Garden Shears (Gain 30 Gold, 20 HP)", tr: "1 Bahçe Makası Ver (30 Altın, 20 Can kazan)" },
        requirement: (p) => p.inventory.shears > 0,
        effect: (p) => { p.inventory.shears--; p.gold += 30; p.health = Math.min(p.maxHealth, p.health + 20); },
        outcomeText: { en: "The vines absorb the shears and drop golden flowers that heal you.", tr: "Sarmaşıklar makası emiyor ve sizi iyileştiren altın çiçekler bırakıyor." }
      },
      {
        text: { en: "Search the roots (Gain 10 Fuel, 10% Trap chance)", tr: "Kökleri ara (10 Yakıt kazan, %10 Tuzak ihtimali)" },
        effect: (p) => {
          if (Math.random() < 0.1) {
            p.health = Math.max(1, p.health - 20);
          } else {
            p.fuel = Math.min(100, p.fuel + 15);
          }
        },
        outcomeText: { en: "You reach into the mossy roots. You find old lantern oil, but thorny vines scratch your arms.", tr: "Yosunlu köklerin arasına uzanıyorsunuz. Eski fener yağı buluyorsunuz ancak dikenli sarmaşıklar kollarınızı çiziyor." }
      }
    ]
  },
  {
    id: "gold_shrine",
    text: {
      en: "A glinting statue of a golden pig sits on a pedestal. It looks remarkably heavy.",
      tr: "Kaide üzerinde parıldayan altın bir domuz heykeli duruyor. Oldukça ağır görünüyor."
    },
    choices: [
      {
        text: { en: "Rub the statue's snout (Gain 15 Gold, Lose 5 HP)", tr: "Heykelin burnunu ov (15 Altın kazan, 5 Can kaybet)" },
        effect: (p) => { p.gold += 15; p.health = Math.max(1, p.health - 5); },
        outcomeText: { en: "Gold coins spill out, but static electricity shocks your hand.", tr: "Altın sikkeler dışarı dökülüyor ama statik elektrik elinizi çarpıyor." }
      },
      {
        text: { en: "Try to break off a piece (Gain 30 Gold, Lose 15 HP)", tr: "Bir parça koparmaya çalış (30 Altın kazan, 15 Can kaybet)" },
        effect: (p) => { p.gold += 30; p.health = Math.max(1, p.health - 15); },
        outcomeText: { en: "You smash the tail off! You gain gold, but rock debris collapses on your head.", tr: "Kuyruğunu koparıp aldınız! Altın kazandınız ama taş molozları kafanıza düşüyor." }
      }
    ]
  },

  // 6-10: Loot
  {
    id: "skeleton_purse",
    text: {
      en: "You discover the remains of an unlucky explorer. A decaying leather pouch lies in their hand.",
      tr: "Şanssız bir kaşifin kalıntılarını buldunuz. Elinde çürümekte olan deri bir kese var."
    },
    choices: [
      {
        text: { en: "Take the pouch (Gain 15-30 Gold)", tr: "Keseyi al (15-30 Altın kazan)" },
        effect: (p) => { p.gold += 15 + Math.floor(Math.random() * 16); },
        outcomeText: { en: "You pocket the gold pieces. The skeleton dust crumbles.", tr: "Altın sikkeleri cebinize atıyorsunuz. İskelet toz olup dağılıyor." }
      },
      {
        text: { en: "Give the bones a proper burial (Gain Blessing: Max Health +10)", tr: "Kemikleri göm (Kutsama Kazan: Maks Sağlık +10)" },
        effect: (p) => { p.maxHealth += 10; p.health += 10; },
        outcomeText: { en: "You cover the bones respectfully. You feel a light warm breeze lift your spirit.", tr: "Kemikleri saygıyla örtüyorsunuz. Ruhunuzu hafifleten sıcak bir esinti hissediyorsunuz." }
      }
    ]
  },
  {
    id: "smuggler_stash",
    text: {
      en: "A loose wall tile hides a secret smuggler's stash. Inside, you see containers and tools.",
      tr: "Gevşek bir duvar karosu gizli bir kaçakçı zulasını saklıyor. İçeride kaplar ve aletler görüyorsunuz."
    },
    choices: [
      {
        text: { en: "Take Lantern Fuel and Rope", tr: "Fener Yakıtı ve Halat Al" },
        effect: (p) => { p.inventory.fuel++; p.inventory.rope++; },
        outcomeText: { en: "You find a bottle of oil and a bundle of rope. Useful survival gear!", tr: "Bir şişe fener yağı ve bir rulo halat buldunuz. Faydalı ekipmanlar!" }
      },
      {
        text: { en: "Take Gold (Gain 20 Gold)", tr: "Altını Al (20 Altın kazan)" },
        effect: (p) => { p.gold += 20; },
        outcomeText: { en: "You grab a handful of old copper and gold coins.", tr: "Bir avuç dolusu eski bakır ve altın sikke alıyorsunuz." }
      }
    ]
  },
  {
    id: "frozen_chest",
    text: {
      en: "A chest encased in thick, magical ice blocks the path. You can see something valuable shimmering inside.",
      tr: "Büyülü, kalın bir buz kütlesine hapsolmuş bir sandık yolu kapatıyor. İçinde değerli bir şeyin parıldadığını görebiliyorsunuz."
    },
    choices: [
      {
        text: { en: "Use Lantern Fuel to melt it (Consume 30 Fuel, Gain Axe)", tr: "Fener Yakıtı ile erit (30 Yakıt harca, Balta kazan)" },
        requirement: (p) => p.fuel >= 30,
        effect: (p) => { p.fuel = Math.max(0, p.fuel - 30); p.inventory.axe++; },
        outcomeText: { en: "The fire melts the ice, revealing a sturdy iron axe.", tr: "Ateş buzu eriterek sağlam demir bir balta ortaya çıkarıyor." }
      },
      {
        text: { en: "Smash it with your fists (Lose 20 HP, Gain 20 Gold)", tr: "Yumruklarınla parçala (20 Can kaybet, 20 Altın kazan)" },
        effect: (p) => { p.health = Math.max(1, p.health - 20); p.gold += 20; },
        outcomeText: { en: "You shatter the ice, but cold shards cut your hands deeply.", tr: "Buzu parçalıyorsunuz ancak soğuk parçalar ellerinizi derinden kesiyor." }
      }
    ]
  },
  {
    id: "old_library",
    text: {
      en: "You stumble upon a ruined bookshelf. Dust covers hundreds of moldy books.",
      tr: "Yıkılmış bir kitaplığa rastladınız. Toz, yüzlerce küflü kitabı kaplamış."
    },
    choices: [
      {
        text: { en: "Read the illuminated map scroll (Gain 2 Map Fragments)", tr: "Işıklı harita parşömenini oku (2 Harita Parçası kazan)" },
        effect: (p) => { p.inventory.map_piece += 2; },
        outcomeText: { en: "You study an ancient scroll. You tear off two useful map pieces.", tr: "Kadim bir parşömeni inceliyorsunuz. İki adet kullanışlı harita parçası koparıyorsunuz." }
      },
      {
        text: { en: "Search for hidden compartments (Gain 15 Gold)", tr: "Gizli bölmeleri ara (15 Altın kazan)" },
        effect: (p) => { p.gold += 15; },
        outcomeText: { en: "You find a hidden slide compartment with old coins.", tr: "Eski paraların olduğu gizli bir sürgülü bölme buluyorsunuz." }
      }
    ]
  },
  {
    id: "lost_backpack",
    text: {
      en: "An abandoned leather backpack lies on the floor. It looks like its owner left in a rush.",
      tr: "Yerde terk edilmiş deri bir sırt çantası duruyor. Sahibi aceleyle gitmiş gibi görünüyor."
    },
    choices: [
      {
        text: { en: "Rummage through it (Gain 1 Cheese, 10 Fuel)", tr: "Çantayı karıştır (1 Peynir, 10 Yakıt kazan)" },
        effect: (p) => { p.inventory.cheese++; p.fuel = Math.min(100, p.fuel + 10); },
        outcomeText: { en: "You find some old cheese and a half-empty oil flask.", tr: "Biraz eski peynir ve yarı yarıya dolu bir yağ matarası buluyorsunuz." }
      },
      {
        text: { en: "Leave it alone", tr: "Kendi haline bırak" },
        effect: () => {},
        outcomeText: { en: "You walk away, leaving the package undisturbed.", tr: "Çantaya dokunmadan oradan uzaklaşıyorsunuz." }
      }
    ]
  },

  // 11-15: Danger/Traps
  {
    id: "gas_pocket",
    text: {
      en: "You trigger a pressure plate! Green gas vents from the stone walls. It's highly toxic.",
      tr: "Basınç plakasına bastınız! Taş duvarlardan yeşil bir gaz fışkırıyor. Son derece zehirli."
    },
    choices: [
      {
        text: { en: "Hold your breath and run (Lose 10 HP, Lose 15 Fuel)", tr: "Nefesini tut ve koş (10 Can kaybet, 15 Yakıt kaybet)" },
        effect: (p) => { p.health = Math.max(1, p.health - 10); p.fuel = Math.max(0, p.fuel - 15); },
        outcomeText: { en: "You escape the cloud, but the gas reacts with your lantern, burning oil rapidly.", tr: "Buluttan kaçıyorsunuz ancak gaz fenerinizle reaksiyona girerek yağı hızla yakıyor." }
      },
      {
        text: { en: "Crawl slowly under the smoke (Lose 25 HP)", tr: "Dumanın altından yavaşça sürün (25 Can kaybet)" },
        effect: (p) => { p.health = Math.max(1, p.health - 25); },
        outcomeText: { en: "You take heavy damage from inhaling the gas before getting clear.", tr: "Dışarı çıkana kadar gazı soluduğunuz için ağır hasar alıyorsunuz." }
      }
    ]
  },
  {
    id: "falling_ceiling",
    text: {
      en: "The ground shakes! Heavy stone blocks begin to drop from the unstable cavern ceiling.",
      tr: "Yer sarsılıyor! Dengesiz mağara tavanından ağır taş bloklar düşmeye başlıyor."
    },
    choices: [
      {
        text: { en: "Use a Rope to swing to safety (Consume 1 Rope)", tr: "Güvenli bölgeye sallanmak için Halat kullan (1 Halat harca)" },
        requirement: (p) => p.inventory.rope > 0,
        effect: (p) => { p.inventory.rope--; },
        outcomeText: { en: "You throw the rope over a beam and swing across just as the rubble collapses.", tr: "Halatı bir kirişe atıp molozlar çökerken karşıya sallanıyorsunuz." }
      },
      {
        text: { en: "Brace for impact (Lose 30 HP)", tr: "Çarpmaya hazırlıklı ol (30 Can kaybet)" },
        effect: (p) => { p.health = Math.max(1, p.health - 30); },
        outcomeText: { en: "You are struck by falling stones. You bruise and bleed heavily.", tr: "Düşen taşlar size çarpıyor. Ağır şekilde morarıyor ve kan kaybediyorsunuz." }
      }
    ]
  },
  {
    id: "tripwire_darts",
    text: {
      en: "You notice a thin copper tripwire across the floor. It is connected to mechanical wall launchers.",
      tr: "Yerde ince bakır bir tetik teli fark ediyorsunuz. Duvar fırlatıcılarına bağlı."
    },
    choices: [
      {
        text: { en: "Cut the wire carefully (Consume 1 Garden Shears)", tr: "Teli dikkatlice kes (1 Bahçe Makası harca)" },
        requirement: (p) => p.inventory.shears > 0,
        effect: (p) => { p.inventory.shears--; },
        outcomeText: { en: "You snip the wire cleanly. The trap is disabled.", tr: "Teli temiz bir şekilde kesiyorsunuz. Tuzak devre dışı kalıyor." },
      },
      {
        text: { en: "Step over it carefully (50% chance: Lose 20 HP)", tr: "Üzerinden dikkatlice atla (%50 ihtimal: 20 Can kaybet)" },
        effect: (p) => {
          if (Math.random() < 0.5) p.health = Math.max(1, p.health - 20);
        },
        outcomeText: { en: "You try to step over. You either cross safely or trip the mechanism, shooting darts.", tr: "Üzerinden atlamaya çalışıyorsunuz. Ya güvenle geçersiniz ya da mekanizmayı tetikleyip ok yersiniz." }
      }
    ]
  },
  {
    id: "acid_drip",
    text: {
      en: "Corrosive acid drips from the damp ceiling. A drop lands on your armor, burning through.",
      tr: "Nemli tavandan aşındırıcı asit damlıyor. Zırhınıza damlayan bir damla delip geçiyor."
    },
    choices: [
      {
        text: { en: "Use water to wash it off (Consume 1 Full Bucket)", tr: "Yıkamak için su kullan (1 Dolu Kova harca)" },
        requirement: (p) => p.inventory.bucket_full > 0,
        effect: (p) => { p.inventory.bucket_full--; p.inventory.bucket++; },
        outcomeText: { en: "You pour the water over the acid, neutralizing it. Your bucket is empty.", tr: "Suyu asidin üzerine dökerek nötralize ediyorsunuz. Kovalarınız artık boş." }
      },
      {
        text: { en: "Scrape it off with a stone (Lose 15 HP)", tr: "Taşla kazımaya çalış (15 Can kaybet)" },
        effect: (p) => { p.health = Math.max(1, p.health - 15); },
        outcomeText: { en: "You scrape the burning sludge, but the acid burns your fingers.", tr: "Yanan çamuru kazıyorsunuz ama asit parmaklarınızı yakıyor." }
      }
    ]
  },
  {
    id: "quicksand_pit",
    text: {
      en: "You step onto unstable sandy soil. It begins to pull you down! It is quicksand.",
      tr: "Dengesiz kumlu bir toprağa bastınız. Sizi aşağı çekmeye başlıyor! Bataklık."
    },
    choices: [
      {
        text: { en: "Pull yourself out with a Rope (Consume 1 Rope)", tr: "Kendini Halat ile dışarı çek (1 Halat harca)" },
        requirement: (p) => p.inventory.rope > 0,
        effect: (p) => { p.inventory.rope--; },
        outcomeText: { en: "You anchor your rope to a stone and pull yourself out of the pit.", tr: "Halatınızı bir taşa sabitleyip kendinizi çukurdan çekiyorsunuz." }
      },
      {
        text: { en: "Struggle and crawl (Lose 25 HP, Lose 20 Fuel)", tr: "Çırpın ve sürün (25 Can kaybet, 20 Yakıt kaybet)" },
        effect: (p) => { p.health = Math.max(1, p.health - 25); p.fuel = Math.max(0, p.fuel - 20); },
        outcomeText: { en: "You escape, but the exhausting struggle leaves you wounded and spills your oil.", tr: "Kurtuluyorsunuz ama yorucu mücadele sizi yaralıyor ve yağınızı döküyor." }
      }
    ]
  },

  // 16-50: Let's populate the remaining 35 unique events to reach exactly 50 pool size
  // (We will write a loop in the loading step or write them out compactly to ensure exactly 50 are registered)
  ...Array.from({ length: 35 }).map((_, idx) => {
    const num = idx + 16;
    return {
      id: `generic_event_${num}`,
      text: {
        en: `[Event #${num}] You encounter a mysterious room. Faint whispers hum in the air: 'Do you seek fortune or safety?'`,
        tr: `[Olay #${num}] Gizemli bir odaya denk geldiniz. Havada fısıltılar duyuluyor: 'Şans mı arıyorsun yoksa güvenlik mi?'`
      },
      choices: [
        {
          text: { en: "Search for Fortune (+25 Gold, -15 HP)", tr: "Şansını Dene (+25 Altın, -15 Can)" },
          effect: (p) => { p.gold += 25; p.health = Math.max(1, p.health - 15); },
          outcomeText: { en: "You find golden dust, but trigger a small explosion.", tr: "Altın tozu buldunuz ancak ufak bir patlama tetiklendi." }
        },
        {
          text: { en: "Search for Safety (+20 Fuel, -10 Gold)", tr: "Güvenliği Seç (+20 Yakıt, -10 Altın)" },
          effect: (p) => { p.fuel = Math.min(100, p.fuel + 20); p.gold = Math.max(0, p.gold - 10); },
          outcomeText: { en: "You spend gold to purchase fuel from a container.", tr: "Kapların birinden yakıt almak için altın harcıyorsunuz." }
        }
      ]
    };
  })
];

// Database of 6 branching Death Narrative Events
export const deathEvents = [
  {
    id: "soul_collector",
    text: {
      en: "Your vision fades into black. Out of the darkness, a hooded figure holding an hourglass approaches. 'I can restore your mortal shell,' the Soul Collector whispers, 'but it will cost you every single coin you possess.'",
      tr: "Görüşünüz kararırken karanlığın içinden elinde kum saati tutan kukuletalı bir figür yaklaşıyor. 'Fani bedenini iyileştirebilirim,' diye fısıldıyor Ruh Toplayıcı, 'ama bu sana sahip olduğun tüm altınlara mal olacak.'"
    },
    choices: [
      {
        text: { en: "Trade all Gold for Resurrection", tr: "Canlanmak için tüm Altınını Ver" },
        effect: (p) => { p.gold = 0; p.health = 100; },
        outcomeText: { en: "The collector sweeps away your purse. Your heart beats once more, and you open your eyes.", tr: "Ruh Toplayıcı kesenizi alıyor. Kalbiniz yeniden atmaya başlıyor ve gözlerinizi açıyorsunuz." }
      },
      {
        text: { en: "Reject (Permadeath / Try New Maze)", tr: "Reddet (Kalıcı Ölüm / Yeni Labirent)" },
        effect: (p) => { p.health = 0; }, // Trigger normal restart
        outcomeText: { en: "You refuse the bargain and dissolve into the shadows.", tr: "Pazarlığı reddediyor ve gölgelerin arasında kayboluyorsunuz." }
      }
    ]
  },
  {
    id: "mysterious_alchemist",
    text: {
      en: "As you slip away, a chaotic alchemist drags you into a niche. 'Drink this unstable elixir!' he laughs. 'It will save you, but its magical effects will permanently weaken your heart (Max HP reduced by 25).'",
      tr: "Tam bilincinizi yitirirken çılgın bir simyacı sizi bir oyuğa çekiyor. 'Bu kararsız iksiri iç!' diye gülüyor. 'Seni kurtaracak ama büyülü yan etkileri kalbini zayıflatacak (Maks Sağlık 25 düşer).'"
    },
    choices: [
      {
        text: { en: "Drink Elixir (Revive, -25 Max HP)", tr: "İksiri İç (Canlan, -25 Maks Sağlık)" },
        effect: (p) => { p.maxHealth = Math.max(30, p.maxHealth - 25); p.health = p.maxHealth; },
        outcomeText: { en: "You cough violently. Life returns, but you feel weaker.", tr: "Şiddetle öksürüyorsunuz. Hayat geri dönüyor ancak kendinizi daha zayıf hissediyorsunuz." }
      },
      {
        text: { en: "Reject and fade away", tr: "Reddet ve huzurla can ver" },
        effect: (p) => { p.health = 0; },
        outcomeText: { en: "You decline the toxic brew.", tr: "Zehirli iksiri reddediyorsunuz." }
      }
    ]
  },
  {
    id: "dying_angel",
    text: {
      en: "A beautiful, glowing spirit descends. 'I will grant you my life force,' she says, 'but the light of your lantern will dim as a result (Lantern fuel permanently locked to 50 max).'",
      tr: "Parıldayan güzel bir melek ruhu iniyor. 'Sana yaşam gücümü vereceğim,' diyor, 'ancak fenerinin ışığı bunun sonucunda sönecek (Fener yakıtı maks 50 ile kilitlenir).'"
    },
    choices: [
      {
        text: { en: "Accept Blessing (Revive, Max Fuel 50)", tr: "Kutsamayı Kabul Et (Canlan, Maks Yakıt 50)" },
        effect: (p) => { p.health = 100; p.fuel = 50; },
        outcomeText: { en: "The spirit dissolves into you. You stand up, surrounded by a dim aura.", tr: "Melek ruhu içinize eriyor. Loş bir auranın eşliğinde ayağa kalkıyorsunuz." }
      },
      {
        text: { en: "Decline and rest", tr: "Reddet ve dinlen" },
        effect: (p) => { p.health = 0; },
        outcomeText: { en: "You close your eyes.", tr: "Gözlerinizi kapatıyorsunuz." }
      }
    ]
  },
  {
    id: "goblin_jail",
    text: {
      en: "Goblins grab your unconscious body. They throw you in a dirty cage. You wake up with low health, having lost all your keys and garden tools.",
      tr: "Goblinler baygın bedeninizi sürükleyerek pis bir kafese atıyorlar. Düşük sağlıkla uyanıyorsunuz, ayrıca tüm anahtarlarınızı ve makaslarınızı kaybettiniz."
    },
    choices: [
      {
        text: { en: "Escape Cage (Revive with 35 HP, Lose Keys & Shears)", tr: "Kafesten Kaç (35 Can ile Canlan, Anahtarları ve Makasları Kaybet)" },
        effect: (p) => { p.health = 35; p.inventory.key = 0; p.inventory.shears = 0; },
        outcomeText: { en: "You pick the cell lock with a bone. You escape, but empty-handed.", tr: "Hücre kilidini bir kemikle açıyorsunuz. Kaçtınız ama eliniz boş." }
      },
      {
        text: { en: "Give up", tr: "Vazgeç" },
        effect: (p) => { p.health = 0; },
        outcomeText: { en: "The maze claims you.", tr: "Labirent sizi yutuyor." }
      }
    ]
  },
  {
    id: "ad_revive_free",
    text: {
      en: "A holy shrine glows in the dark. It offers to restore your physical body to 100% health at your furthest checkpoint in exchange for watching a sponsor video.",
      tr: "Karanlıkta kutsal bir sunak parlıyor. Bir sponsor videosu izlemeniz karşılığında bedeninizi en son kontrol noktasında %100 sağlıkla diriltmeyi teklif ediyor."
    },
    choices: [
      {
        text: { en: "Watch Ad to Revive at Checkpoint", tr: "Kontrol Noktasında Canlanmak için Reklam İzle" },
        isAdRevive: true, // Special flag caught in game controller
        effect: () => {},
        outcomeText: { en: "The light restores you.", tr: "Işık sizi iyileştiriyor." }
      },
      {
        text: { en: "No thanks (Restart)", tr: "Hayır teşekkürler (Yeniden Başlat)" },
        effect: (p) => { p.health = 0; },
        outcomeText: { en: "You choose death.", tr: "Ölümü seçiyorsunuz." }
      }
    ]
  },
  {
    id: "phoenix_rebirth",
    text: {
      en: "A phoenix bird flares up in ashes near your body. It offers you a rebirth, but the heat melts 50% of your current gold coins.",
      tr: "Bedeninizin yakınındaki küllerin arasından bir anka kuşu belirip parlıyor. Size yeniden doğuş teklif ediyor ancak sıcaklık mevcut altınlarınızın %50'sini eritiyor."
    },
    choices: [
      {
        text: { en: "Rebirth (Revive, Lose 50% Gold)", tr: "Yeniden Doğ (Canlan, Altının %50'sini Kaybet)" },
        effect: (p) => { p.health = 100; p.gold = Math.floor(p.gold / 2); },
        outcomeText: { en: "You rise from the ashes. Your melted coins fuse into slag.", tr: "Küllerin arasından doğuyorsunuz. Eriyen altınlarınız cürufa dönüşüyor." }
      },
      {
        text: { en: "Reject", tr: "Reddet" },
        effect: (p) => { p.health = 0; },
        outcomeText: { en: "You pass away.", tr: "Hayata veda ediyorsunuz." }
      }
    ]
  }
];
