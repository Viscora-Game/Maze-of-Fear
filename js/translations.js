export const translations = {
  en: {
    title: "Maze of Fear",
    subtitle: "A Procedural Adventure of Risk & Decisions",
    play: "Play",
    settings: "Settings",
    howToPlay: "How to Play",
    coop: "Co-op Mode",
    coopTitle: "Co-op Lobby",
    hostRoom: "Host Room",
    btnHost: "Create New Room",
    roomCodeLabel: "Your Room Code:",
    btnCopyLink: "Copy Invite Link",
    coopMapSize: "Map Size",
    mapSmall: "🏚️ Small",
    mapMedium: "🏰 Medium",
    mapLarge: "🏯 Large",
    mapSmallDesc: "1-Floor Labyrinth",
    mapMediumDesc: "2-Floor Labyrinth",
    mapLargeDesc: "3-Floor Labyrinth",
    voiceChatLabel: "Voice Chat",
    voiceOn: "🎤 On",
    voiceOff: "🔕 Off",
    soundTestTitle: "Sound Test Panel (Preview SFX)",
    sfxWoodChop: "🪓 Axe Chop Barricade",
    sfxShearsCut: "✂️ Garden Shears Vines",
    sfxWaterFill: "🪣 Draw Well Water",
    sfxShadowSpawn: "👻 Monster Spawn Roar",
    sfxShadowGroan: "👹 Monster Growl/Groan",
    sfxShadowBurn: "🔥 Flashlight Burn Hiss",
    sfxScream: "😱 Horror Scream / Jumpscare",
    sfxDoor: "🚪 Metal Door Open",
    sfxUnlock: "🗝️ Key Unlock Gate",
    sfxFlashlight: "⚡ Flashlight Toggle",
    replayTutorial: "📖 Watch Interactive Tutorial",
    joinRoom: "Join Room",
    btnJoin: "Join",
    achievements: "Achievements",
    achGroupEasy: "Kolay Mod Başarımları (Easy)",
    achGroupMedium: "Orta Mod Başarımları (Medium)",
    achGroupHard: "Zor Mod Başarımları (Hard)",
    achGroupNightmare: "Kabus Mod Başarımları (Nightmare)",
    achGroupGeneral: "Genel Başarımlar (General)",
    difficulty: "Difficulty",
    diffEasy: "🟢 Easy",
    diffMedium: "🟡 Medium",
    diffHard: "🔴 Hard",
    diffNightmare: "💀 Nightmare",
    diffPeaceful: "☮️ Peaceful",
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
      cheese: { name: "Old Cheese", desc: "Slightly smelly. Might interest a rodent." },
      revival_scroll: { name: "Revival Scroll", desc: "A dark ritual parchment that can revive a deceased teammate." }
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
        farewell: "End Dialogue",
        stages: {
          start: {
            q1: "Who am I? Who are you?",
            a1: "You are a mortal who surrendered to fear, and this labyrinth is a prison of shadow and sorrow. I am the first victim of this purgatory, bound here eternally to guide lost souls.",
            q2: "How do I escape?",
            a2: "You must descend deeper. You will need keys and combination codes hidden on the walls. Most importantly, never let your flashlight die."
          },
          who_are_you: {
            q1: "How was this maze created?",
            a1: "Whenever a soul is crushed under regret and fear, a new stone is laid in these walls. You are walking inside a prison of your own making.",
            q2: "Where did the shadow monster come from?",
            a2: "It was spawned from the despair and wrath of those who lost their light here before you. The shadows will swallow you the second your light fades.",
            back: "Go Back"
          },
          how_to_escape: {
            q1: "What lies in the deeper floors?",
            a1: "The first floor is only the beginning. As you descend, the zindans turn pitch black, and the paths narrow. You will need ropes to descend, and shears or axes to clear roadblocks.",
            back: "Go Back"
          },
          sub: {
            back: "Go Back"
          }
        }
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
      // Chapter 1: "The Lost Explorer's Journal" (Level 1-10) — A trapped explorer's descent into madness
      lore_ch1_1: "Lost Journal — Entry I:\n\n\"I entered the maze three days ago... or was it three weeks? The hedges are impossibly tall, and the sky above never changes. I marked my path with chalk, but the marks keep vanishing. Something is erasing my trail. I must stay calm. I must find the exit.\"",
      lore_ch1_2: "Lost Journal — Entry II:\n\n\"The walls... they move. I am certain of it now. I turned left at the stone arch twice, but the corridor beyond was different each time. This maze is alive. It breathes. I can hear it shifting in the dark when I hold my breath.\"",
      lore_ch1_3: "Lost Journal — Entry III:\n\n\"I saw it for the first time last night — a shape in the darkness, just beyond my lantern's reach. It had no face, only the absence of light in the shape of a man. When I ran, it did not chase me. It simply... watched. The Shadow Monster is real.\"",
      lore_ch1_4: "Lost Journal — Entry IV:\n\n\"I found a merchant sitting calmly in a dead-end corridor, as if waiting for me. He sells batteries and supplies for gold coins scattered throughout the maze. How long has he been here? He smiled when I asked. He did not answer.\"",
      lore_ch1_5: "Lost Journal — Entry V:\n\n\"My lantern flickered twice tonight. When the light dims, the whispers grow louder — hundreds of voices speaking at once, all saying my name. A name I can no longer remember. The batteries are my lifeline. Without them, the Shadow takes you instantly.\"",
      lore_ch1_6: "Lost Journal — Entry VI:\n\n\"I found another explorer's bag near a collapsed wall. Inside was a journal much like mine, the handwriting growing more frantic with each page. The last entry was just one word, written over and over: 'BEHIND.' I did not look behind me.\"",
      lore_ch1_7: "Lost Journal — Entry VII:\n\n\"The exit exists — I have seen it! A massive iron gate at the far end of the labyrinth. But it is locked with a 4-digit combination. The code fragments are scattered on blood-stained parchments somewhere in these corridors. I must find them all.\"",
      lore_ch1_8: "Lost Journal — Entry VIII:\n\n\"Time has stopped meaning anything. My watch says 3:47 AM. It has said 3:47 AM for as long as I can remember. The stars above don't move. The rain falls but nothing gets wet. This place is a wound in reality itself.\"",
      lore_ch1_9: "Lost Journal — Entry IX:\n\n\"I have a theory about the Shadow Monster. It is not a creature — it is the accumulated despair of every soul that was consumed here. Every person who lost their light became part of it. If my lantern dies... I will become part of it too.\"",
      lore_ch1_10: "Lost Journal — Entry X:\n\n\"If you are reading this, there may still be hope for you. I left everything I know in these pages. Find the code fragments. Keep your lantern burning. And whatever you do, do not trust the silence. The silence means it is right behind you. Run.\"",
      lore_ch1_11: "Lost Journal — Entry XI:\n\n\"The rumbles are getting louder. Not from the walls, but from below. It's like the ground itself is digesting me. I found a well with clean water today. It felt so real, but when I drank, it tasted like ash. My senses are lying to me.\"",
      lore_ch1_12: "Lost Journal — Entry XII:\n\n\"The Child... I met a child today. He was crying, asking for his toy. How could a child survive here? I tried to lead him, but the moment I looked away and back, he was gone, replaced by a wall. Was he ever there, or am I finally losing my mind?\"",
      lore_ch1_13: "Lost Journal — Entry XIII:\n\n\"The Mouse... it spoke. It asked for cheese. I laughed, a hysterical sound that echoed forever. But I gave it cheese. It whispered something in return: 'The Sage is not who you think he is.' What does that mean? The Sage is the only one who helped me!\"",
      lore_ch1_14: "Lost Journal — Final Entry:\n\n\"My lantern is dying. The merchant refuses to sell to me anymore. He says my gold is 'worn out', like my soul. The Sage is gone. If you find this page, know that I didn't make it to the gate. But you... you must run.\"",

      // Chapter 2: "The Shadow Guardian's Sermons" (Level 11-20) — The Labyrinth's own perspective
      lore_ch2_1: "The Guardian's Sermon — I:\n\n\"You think this maze was built to trap you? No. It was built to protect the world from what lies at its center. I am the Guardian. The walls are not your prison — they are everyone else's shield. You wandered in willingly. Now you understand.\"",
      lore_ch2_2: "The Guardian's Sermon — II:\n\n\"The explorer who left those journal pages... he understood so little. The walls do not move — reality bends around them. This labyrinth exists in the space between nightmares, where geometry itself is afraid to hold its shape.\"",
      lore_ch2_3: "The Guardian's Sermon — III:\n\n\"They call me the Shadow Monster. How quaint. I was the first Guardian — the first to sacrifice my form to keep the darkness contained. I do not consume souls. I collect them, so they do not wander into something far worse.\"",
      lore_ch2_4: "The Guardian's Sermon — IV:\n\n\"The walls shift because this place remembers every soul that walked here. Each footstep reshapes the corridors. The maze you walk is built from the fears of a thousand lost minds. That is why no two paths are ever the same.\"",
      lore_ch2_5: "The Guardian's Sermon — V:\n\n\"Light... such a fragile comfort. Your lantern does not repel me — it merely blinds you to what walks beside you. In the dark, you would see the truth: you have never been alone in these corridors. Not even for a moment.\"",
      lore_ch2_6: "The Guardian's Sermon — VI:\n\n\"The merchant? He is the oldest prisoner. He chose to stay — trading trinkets for gold that has no value here. Ask him his name sometime. Watch his eyes when he tries to remember. Even he has forgotten who he was before the maze.\"",
      lore_ch2_7: "The Guardian's Sermon — VII:\n\n\"The combination lock on the gate... a cruel joke left by my predecessor. The code changes with every soul that enters. The parchments rewrite themselves. Even if you escape, you will carry the maze with you. It lives in the space behind your eyelids.\"",
      lore_ch2_8: "The Guardian's Sermon — VIII:\n\n\"Time does not pass here because time is afraid of this place. The rain falls upward when no one is watching. The stars in the sky are not stars — they are the eyes of those who escaped and still dream of these corridors every night.\"",
      lore_ch2_9: "The Guardian's Sermon — IX:\n\n\"There is something beneath the deepest floor. Something older than the maze, older than the shadows. I was placed here to ensure no one reaches it. Every Guardian before me failed. The thing below is patient. It has been waiting since before time began.\"",
      lore_ch2_10: "The Guardian's Sermon — X:\n\n\"You have read all my words and still you press forward. Brave or foolish — in this place, they are the same thing. The truth you seek is this: the maze is not a place. It is a mirror. Every wall, every shadow, every whisper — it is all you. You built this prison from your own fears. And you are the only one who can tear it down.\"",
      lore_ch2_11: "The Guardian's Sermon — XI:\n\n\"The well of fresh water he drank from... it was not ash he tasted, but his own decaying memories. The maze gives you what you need to survive, but it extracts a price in return. Every sip costs a piece of your past.\"",
      lore_ch2_12: "The Guardian's Sermon — XII:\n\n\"The Child... he is the manifestation of the child you once were, before fear took root in your heart. You cannot save him. You can only watch him vanish back into the stone, a relic of a life you can never return to.\"",
      lore_ch2_13: "The Guardian's Sermon — XIII:\n\n\"The Mouse is the labyrinth's oldest witness. It knows the truth about the Sage. The Sage is the one who designed the gate, the one who locked the lock. He guides you only to watch the cycle repeat. He is the architect of your despair.\"",
      lore_ch2_14: "The Guardian's Sermon — XIV:\n\n\"Why do you keep walking? Each step only prints your feet deeper into the dust. You are building the very path that leads to your demise. The labyrinth does not expand; it merely folds you deeper within its creases.\"",
      lore_ch2_15: "The Guardian's Sermon — XV:\n\n\"The gold coins you find are not currency. They are fragments of willpower lost by those who came before. The merchant hoards them because they are the only things that still have weight in this dreamscape.\"",
      lore_ch2_16: "The Guardian's Sermon — XVI:\n\n\"Your heart beats so loudly. I can hear it from across the floors. A rhythm of panic. You think it is keeping you alive, but it is actually a countdown. Every beat is one less moment you have left before the dark.\"",
      lore_ch2_17: "The Guardian's Sermon — XVII:\n\n\"The keypads and the gates... they are not barriers, they are filters. Only those with enough resolve to solve the riddles are allowed to descend to the deeper floors. The weak are consumed early. The strong are reserved for the deep.\"",
      lore_ch2_18: "The Guardian's Sermon — XVIII:\n\n\"Do you remember the sun? The warmth of it on your skin? Try to recall it. You will find only a cold grey circle. The maze has already eaten your sky. Soon, it will eat your shadow.\"",
      lore_ch2_19: "The Guardian's Sermon — XIX:\n\n\"The rain that falls here does not come from clouds. It is the tears of the architect, weeping for the prison he created and can never destroy. He is trapped here with us, wandering the corridors in a different form.\"",
      lore_ch2_20: "The Guardian's Sermon — XX:\n\n\"I watched the explorer's light go out. He did not scream. He simply sighed as the shadows embraced him. He is part of me now. I know his name. I know his childhood dreams. They are quite beautiful.\"",
      lore_ch2_21: "The Guardian's Sermon — XXI:\n\n\"The third floor... the Crimson Horror Vault. It is paved with the blood of those who thought they were brave. The walls there do not hide their intent. They are hungry, and they are waiting for you.\"",
      lore_ch2_22: "The Guardian's Sermon — XXII:\n\n\"You think you are different from the ones who failed. That is the initial stage of the curse: hope. Hope is the bait. If you had no hope, you would lie down and make my job easier. But you run, and so the game continues.\"",
      lore_ch2_23: "The Guardian's Sermon — XXIII:\n\n\"The Compass you hold... it points to the exit, yes, but only because the exit is the place where your fear is loudest. It does not guide you to safety. It guides you to the climax of your nightmare.\"",
      lore_ch2_24: "The Guardian's Sermon — XXIV:\n\n\"There are no monsters here except the ones you brought with you. I am merely the reflection of your own self-loathing. If you loved yourself, I would cease to exist. But you do not, and so I am solid.\"",
      lore_ch2_25: "The Guardian's Sermon — XXV:\n\n\"The Sage's true name is written on the underside of the gate. But you will never see it, because to look down is to invite the shadow. He watches you right now, smiling from the darkness.\"",
      lore_ch2_26: "The Guardian's Sermon — XXVI:\n\n\"We are reaching the end of the pages. The paper is running out. Soon you will have no words to guide you, only the silence. Are you ready to walk without my voice? Or will you join me here?\"",
      lore_ch2_27: "The Guardian's Final Sermon:\n\n\"The gate is open. But look behind you. The labyrinth has grown into your mind. Even if you step through the iron doors, you will still be walking these hedges. You are the Maze. And the Maze of Fear has no exit.\"",

      // Spooky Whispers (Atmospheric notes)
      lore_whisper_1: "Whisper:\n\n\"I can hear something crawling in the hedges...\"",
      lore_whisper_2: "Whisper:\n\n\"Do not let the flame die.\"",
      lore_whisper_3: "Whisper:\n\n\"The walls are watching.\"",
      lore_whisper_4: "Whisper:\n\n\"There is no escape from the dark.\"",
      lore_whisper_5: "Whisper:\n\n\"Stay quiet. It listens.\"",
      lore_whisper_6: "Whisper:\n\n\"Follow the light, ignore the cold.\"",
      lore_whisper_7: "Whisper:\n\n\"They all fell here.\"",
      lore_whisper_8: "Whisper:\n\n\"Is this reality or a dream?\"",
      lore_whisper_9: "Whisper:\n\n\"Trust no one. Not even yourself.\"",
      lore_whisper_10: "Whisper:\n\n\"The exit is close, but the end is closer.\"",
      lore_whisper_11: "Whisper:\n\n\"The shadows grow longer.\"",
      lore_whisper_12: "Whisper:\n\n\"Can you hear the heartbeat?\""
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
    coop: "Co-op Modu",
    coopTitle: "Co-op Lobisi",
    hostRoom: "Oda Kur",
    btnHost: "Yeni Oda Oluştur",
    roomCodeLabel: "Oda Kodunuz:",
    btnCopyLink: "Davet Linkini Kopyala",
    coopMapSize: "Harita Boyutu",
    mapSmall: "🏚️ Küçük",
    mapMedium: "🏰 Orta",
    mapLarge: "🏯 Büyük",
    mapSmallDesc: "1 Katlı Labirent",
    mapMediumDesc: "2 Katlı Labirent",
    mapLargeDesc: "3 Katlı Labirent",
    voiceChatLabel: "Sesli Sohbet",
    voiceOn: "🎤 Açık",
    voiceOff: "🔕 Kapalı",
    soundTestTitle: "Ses Test Paneli (Efektleri Test Et)",
    sfxWoodChop: "🪓 Balta Kırma Barikat",
    sfxShearsCut: "✂️ Bahçe Makası Sarmaşık",
    sfxWaterFill: "🪣 Kuyudan Su Doldurma",
    sfxShadowSpawn: "👻 Canavar Belirme Kükremesi",
    sfxShadowGroan: "👹 Canavar Hırlama/İnilti",
    sfxShadowBurn: "🔥 Canavar Yanma Tıslaması",
    sfxScream: "😱 Çığlık / Jumpscare",
    sfxDoor: "🚪 Metal Kapı Açma",
    sfxUnlock: "🗝️ Kilit Açma",
    sfxFlashlight: "⚡ Fener Aç/Kapat",
    replayTutorial: "📖 Başlangıç Rehberini İzle",
    joinRoom: "Odaya Katıl",
    btnJoin: "Katıl",
    achievements: "Başarımlar",
    achGroupEasy: "Kolay Mod Başarımları (Easy)",
    achGroupMedium: "Orta Mod Başarımları (Medium)",
    achGroupHard: "Zor Mod Başarımları (Hard)",
    achGroupNightmare: "Kabus Mod Başarımları (Nightmare)",
    achGroupGeneral: "Genel Başarımlar (General)",
    difficulty: "Zorluk Derecesi",
    diffEasy: "🟢 Kolay",
    diffMedium: "🟡 Orta",
    diffHard: "🔴 Zor",
    diffNightmare: "💀 Kabus",
    diffPeaceful: "☮️ Barışçıl",
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
      cheese: { name: "Eski Peynir", desc: "Biraz kokulu. Bir kemirgenin ilgisini çekebilir." },
      revival_scroll: { name: "Diriltme Parşömeni", desc: "Ölen arkadaşınızı hayata döndürebilen karanlık bir ritüel parşömeni." }
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
        finalQuote: "Ciyak... Bugün bu labirentten çıkabilirsin belki koca adam, ama unutma: bu dehlizlerin sonu her zaman en başına çıkar..."
      },
      traveler: {
        name: "Yaşlı Bilge",
        greeting: "Selam kayıp ruh. Nihayet Korku Labirenti'nde uyandın... Burası zihninin en karanlık köşelerinden beslenen bir araf. Cevaplar mı arıyorsun, yoksa sadece hayatta kalmak mı?",
        farewell: "Sohbeti Bitir",
        stages: {
          start: {
            q1: "Ben kimim? Sen kimsin?",
            a1: "Sen korkularına teslim olup buraya sürüklenen bir fânisin. Ben ise bu arafın ilk kurbanı, kayıp ruhlara rehberlik etme cezasıyla buraya bağlanmış bir bilgeyim. Burası senin zihninin hapishanesi...",
            q2: "Buradan nasıl kaçarım?",
            a2: "Yalnızca daha derine inerek. 20 kat boyunca ilerlemeli, kapı şifrelerini duvarlardaki parşömenlerden öğrenmeli ve en önemlisi... fenerinin ışığını asla söndürmemelisin."
          },
          who_are_you: {
            q1: "Bu labirent nasıl yaratıldı?",
            a1: "İnsanoğlu ne zaman pişmanlık ve korkularının altında ezilse, bu dehlizlerin duvarları bir taş daha yükselir. Kendi ellerinle ördüğün bir hapishanede yürüyorsun.",
            q2: "Karanlıktaki o mahluk nereden geldi?",
            a2: "Işığını kaybedip buraya yenik düşenlerin geride bıraktığı ümitsizlik ve öfkeden doğdu. Fenerinin ateşi söndüğü an seni yutmak için bekliyor.",
            back: "Geri Dön"
          },
          how_to_escape: {
            q1: "Alt katlarda bizi ne bekliyor?",
            a1: "İlk katlar sadece bir başlangıç. Derine indikçe zindanlar zifiri karanlığa bürünecek, yollar daralacak. İnmek için halat, engelleri aşmak için makas ve balta bulmalısın.",
            back: "Geri Dön"
          },
          sub: {
            back: "Geri Dön"
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
        finalQuote: "Ruhlar senin iyiliğini asla unutmayacak... Ama bilmelisin ki bu labirentte karşılaştığın her çocuk ben değilim. Biz sadece bu lanetli döngüde farklı bedenlerde sıkışıp kalmış aynı kayıp ruhlarız..."
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
      // Bölüm 1: "Kayıp Kâşifin Günlüğü" (Level 1-10)
      lore_ch1_1: "Kayıp Günlük — Giriş I:\n\n\"Bu labirente üç gün önce girdim... yoksa üç hafta mı oldu? Çitler inanılmaz yüksek ve gökyüzü hiç değişmiyor. Yolumu tebeşirle işaretledim ama izler sürekli kayboluyor. Bir şey izlerimi siliyor. Sakin kalmalıyım. Çıkışı bulmalıyım.\"",
      lore_ch1_2: "Kayıp Günlük — Giriş II:\n\n\"Duvarlar... hareket ediyor. Artık bundan eminim. Taş kemerin solundan iki kez döndüm ama ötesindeki koridor her seferinde farklıydı. Bu labirent canlı. Nefes alıyor. Nefesimi tuttuğumda karanlıkta yer değiştirdiğini duyabiliyorum.\"",
      lore_ch1_3: "Kayıp Günlük — Giriş III:\n\n\"Onu dün gece ilk kez gördüm — karanlıkta bir şekil, fenerimin ışığının hemen ötesinde. Yüzü yoktu, sadece bir insan şeklinde ışığın yokluğu vardı. Koştuğumda peşimden gelmedi. Sadece... izledi. Gölge Canavarı gerçek.\"",
      lore_ch1_4: "Kayıp Günlük — Giriş IV:\n\n\"Çıkmaz bir koridorda sakin sakin oturan bir tüccar buldum, sanki beni bekliyormuş gibi. Labirentte dağılmış altın sikkeler karşılığında pil ve malzeme satıyor. Ne zamandır burada? Sorduğumda gülümsedi. Cevap vermedi.\"",
      lore_ch1_5: "Kayıp Günlük — Giriş V:\n\n\"Fenerim bu gece iki kez titredi. Işık azaldığında fısıltılar yükseliyor — yüzlerce ses aynı anda konuşuyor, hepsi benim adımı söylüyor. Artık hatırlayamadığım bir ismi. Piller can damarım. Onlar olmadan Gölge seni anında yutar.\"",
      lore_ch1_6: "Kayıp Günlük — Giriş VI:\n\n\"Çökmüş bir duvarın yanında başka bir kâşifin çantasını buldum. İçinde benimkine çok benzer bir günlük vardı, el yazısı her sayfada daha çılgınlaşıyordu. Son giriş tek bir kelimeydi, defalarca yazılmış: 'ARKANDA.' Arkama bakmadım.\"",
      lore_ch1_7: "Kayıp Günlük — Giriş VII:\n\n\"Çıkış var — onu gördüm! Labirentin en ucunda devasa bir demir kapı. Ama 4 haneli bir şifreyle kilitli. Şifre parçaları bu koridorlarda bir yerlerde, kanlı parşömenlerin üzerinde dağılmış. Hepsini bulmalıyım.\"",
      lore_ch1_8: "Kayıp Günlük — Giriş VIII:\n\n\"Zamanın artık hiçbir anlamı kalmadı. Saatim 3:47'yi gösteriyor. Hatırlayabildiğim kadarıyla hep 3:47'yi gösteriyordu. Gökyüzündeki yıldızlar hareket etmiyor. Yağmur yağıyor ama hiçbir şey ıslanmıyor. Burası gerçekliğin kendisinde açılmış bir yara.\"",
      lore_ch1_9: "Kayıp Günlük — Giriş IX:\n\n\"Gölge Canavarı hakkında bir teorim var. O bir yaratık değil — burada yutulmuş her ruhun birikmiş umutsuzluğu. Işığını kaybeden herkes onun bir parçası oldu. Eğer fenerim sönerse... ben de onun bir parçası olacağım.\"",
      lore_ch1_10: "Kayıp Günlük — Son Giriş:\n\n\"Bunu okuyorsan, belki senin için hâlâ umut vardır. Bildiğim her şeyi bu sayfalarda bıraktım. Şifre parçalarını bul. Fenerini yanık tut. Ve ne yaparsan yap, sessizliğe güvenme. Sessizlik, onun tam arkanda olduğu anlamına gelir. Koş.\"",
      lore_ch1_11: "Kayıp Günlük — Giriş XI:\n\n\"Uğultular giderek artıyor. Duvarlardan değil, aşağıdan geliyor. Sanki yer beni sindiriyormuş gibi. Bugün temiz suyu olan bir kuyu buldum. Çok gerçekçi görünüyordu ama içtiğimde tadı kül gibiydi. Duyularım bana yalan söylüyor.\"",
      lore_ch1_12: "Kayıp Günlük — Giriş XII:\n\n\"Çocuk... Bugün bir çocukla karşılaştım. Ağlıyordu, oyuncağını istiyordu. Bir çocuk burada nasıl hayatta kalabilir? Ona yol göstermeye çalıştım ama kafamı çevirip tekrar baktığımda gitmişti, yerinde bir duvar vardı. Gerçekten orada mıydı, yoksa aklımı mı yitiriyorum?\"",
      lore_ch1_13: "Kayıp Günlük — Giriş XIII:\n\n\"Fare... konuştu. Peynir istedi. Delice güldüm, sesim sonsuza dek yankılandı. Ama ona peynir verdim. Karşılığında bir şey fısıldadı: 'Bilge sandığın kişi değil.' Bu ne anlama geliyor? Bana yardım eden tek kişi Bilge'ydi!\"",
      lore_ch1_14: "Kayıp Günlük — Son Giriş:\n\n\"Fenerim sönüyor. Tüccar artık bana satış yapmayı reddediyor. Altınlarımın ruhum gibi 'eskimiş' olduğunu söylüyor. Bilge de gitti. Eğer bu sayfayı bulursan, kapıya ulaşamadığımı bil. Ama sen... koşmalısın.\"",

      // Bölüm 2: "Gölge Muhafızının Vaazları" (Level 11-20)
      lore_ch2_1: "Muhafızın Vaazı — I:\n\n\"Bu labirentin seni hapsetmek için inşa edildiğini mi sanıyorsun? Hayır. Merkezinde yatan şeyden dünyayı korumak için inşa edildi. Ben Muhafız'ım. Duvarlar senin hapisanen değil — herkesin kalkanı. Sen kendi isteğinle içeri girdin. Şimdi anlıyorsun.\"",
      lore_ch2_2: "Muhafızın Vaazı — II:\n\n\"O günlük sayfalarını bırakan kâşif... çok az şey anladı. Duvarlar hareket etmez — gerçeklik onların etrafında bükülür. Bu labirent kabusların arasındaki boşlukta var olur, geometrinin bile şeklini korumaktan korktuğu yerde.\"",
      lore_ch2_3: "Muhafızın Vaazı — III:\n\n\"Bana Gölge Canavarı diyorlar. Ne tuhaf. Ben ilk Muhafız'dım — karanlığı kontrol altında tutmak için bedeninden vazgeçen ilk kişi. Ben ruhları yutmam. Onları toplarım, çok daha kötü bir şeyin içine sürüklenmelerini engellemek için.\"",
      lore_ch2_4: "Muhafızın Vaazı — IV:\n\n\"Duvarlar değişiyor çünkü burası burada yürüyen her ruhu hatırlıyor. Her adım koridorları yeniden şekillendiriyor. Yürüdüğün labirent bin kayıp zihnin korkularından inşa edilmiş. İşte bu yüzden hiçbir iki yol asla aynı değildir.\"",
      lore_ch2_5: "Muhafızın Vaazı — V:\n\n\"Işık... ne kırılgan bir teselli. Fenerin beni uzaklaştırmıyor — sadece yanında yürüyen şeyi görmeni engelliyor. Karanlıkta gerçeği görürdün: bu koridorlarda hiçbir zaman yalnız olmadın. Tek bir an bile.\"",
      lore_ch2_6: "Muhafızın Vaazı — VI:\n\n\"Tüccar mı? O en eski mahkum. Burada kalmayı seçti — burada hiçbir değeri olmayan altın karşılığında ıvır zıvır satıyor. Bir ara ona adını sor. Hatırlamaya çalışırken gözlerini izle. O bile labirentten önceki kim olduğunu unutmuş.\"",
      lore_ch2_7: "Muhafızın Vaazı — VII:\n\n\"Kapıdaki şifre kilidi... selefimin bıraktığı acımasız bir şaka. Şifre her giren ruhla değişir. Parşömenler kendilerini yeniden yazar. Kaçsan bile labirenti seninle taşıyacaksın. Göz kapaklarının arkasındaki karanlıkta yaşıyor.\"",
      lore_ch2_8: "Muhafızın Vaazı — VIII:\n\n\"Burada zaman geçmiyor çünkü zaman bu yerden korkuyor. Kimse bakmadığında yağmur yukarı doğru yağar. Gökyüzündeki yıldızlar yıldız değil — buradan kaçıp her gece bu koridorları rüyasında gören insanların gözleri.\"",
      lore_ch2_9: "Muhafızın Vaazı — IX:\n\n\"En derin katın altında bir şey var. Labirentten daha eski, gölgelerden daha eski bir şey. Kimsenin ona ulaşmaması için buraya kondum. Benden önceki her Muhafız başarısız oldu. Aşağıdaki şey sabırlı. Zaman başlamadan önce beri bekliyor.\"",
      lore_ch2_10: "Muhafızın Son Vaazı:\n\n\"Tüm sözlerimi okudun ve hâlâ ilerliyorsun. Cesur mu aptal mı — bu yerde ikisi de aynı şey. Aradığın gerçek şu: labirent bir yer değil. Bir ayna. Her duvar, her gölge, her fısıltı — hepsi sensin. Bu hapishaneyi kendi korkularından inşa ettin. Ve onu yıkabilecek tek kişi de sensin.\"",
      lore_ch2_11: "Muhafızın Vaazı — XI:\n\n\"İçtiği o taze su kuyusu... ağzına gelen kül tadı kuyuya ait değildi, kendi çürüyen anılarının tadıydı. Labirent hayatta kalman için gerekeni verir ama karşılığında bir bedel alır. Her yudum geçmişinden bir parça götürür.\"",
      lore_ch2_12: "Muhafızın Vaazı — XII:\n\n\"Çocuk... kalbine korku yerleşmeden önceki çocukluğunun yansımasıdır. Onu kurtaramazsın. Sadece taşların arasında yok oluşunu izleyebilirsin; o, asla geri dönemeyeceğin bir hayatın kalıntısıdır...\"",
      lore_ch2_13: "Muhafızın Vaazı — XIII:\n\n\"Fare, labirentin en eski tanığıdır. Bilge hakkındaki gerçeği bilir. Kapıyı tasarlayan, kilidi kilitleyen Bilge'nin ta kendisidir. Döngünün tekrarlanışını izlemek için sana rehberlik eder. O senin çaresizliğinin mimarıdır.\"",
      lore_ch2_14: "Muhafızın Vaazı — XIV:\n\n\"Neden yürümeye devam ediyorsun? Her adım sadece ayak izlerini toza daha derin kazıyor. Kendi sonuna giden yolu kendin inşa ediyorsun. Labirent genişlemez, sadece seni kıvrımlarının daha derinine katlar.\"",
      lore_ch2_15: "Muhafızın Vaazı — XV:\n\n\"Bulduğun altınlar para birimi değildir. Senden önce gelenlerin kaybettiği irade parçalarıdır. Tüccar onları biriktiriyor çünkü bu düş dünyasında ağırlığı olan tek şey onlardır.\"",
      lore_ch2_16: "Muhafızın Vaazı — XVI:\n\n\"Kalbin çok hızlı atıyor. Katların ötesinden duyabiliyorum. Panik ritmi. Seni hayatta tuttuğunu sanıyorsun ama aslında bu bir geri sayım. Her atış, karanlıktan önceki son anlarındır.\"",
      lore_ch2_17: "Muhafızın Vaazı — XVII:\n\n\"Şifre panelleri ve kapılar... onlar engel değil, filtredir. Sadece bilmeceleri çözecek kararlılığa sahip olanların daha derin katlara inmesine izin verilir. Zayıflar erkenden yutulur. Güçlüler derinlikler için saklanır.\"",
      lore_ch2_18: "Muhafızın Vaazı — XVIII:\n\n\"Güneşi hatırlıyor musun? Tenindeki sıcaklığını? Hatırlamaya çalış. Sadece soğuk, gri bir daire bulacaksın. Labirent gökyüzünü çoktan yedi. Yakında gölgeni de yiyecek.\"",
      lore_ch2_19: "Muhafızın Vaazı — XIX:\n\n\"Buraya yağan yağmur bulutlardan gelmiyor. Yarattığı ve asla yok edemediği hapishane için ağlayan mimarın gözyaşlarıdır. O da bizimle burada tutsak, koridorlarda farklı bir biçimde dolaşıyor.\"",
      lore_ch2_20: "Muhafızın Vaazı — XX:\n\n\"Kâşifin ışığının sönüşünü izledim. Çığlık atmadı. Gölgeler onu kucaklarken sadece içini çekti. Artık benim bir parçam. Adını biliyorum. Çocukluk hayallerini biliyorum. Oldukça güzeller.\"",
      lore_ch2_21: "Muhafızın Vaazı — XXI:\n\n\"Üçüncü kat... Derin Kızıl Korku Mahzeni. Cesur olduğunu sananların kanıyla kaplıdır. Oradaki duvarlar niyetlerini gizlemez. Açlar ve seni bekliyorlar.\"",
      lore_ch2_22: "Muhafızın Vaazı — XXII:\n\n\"Başarısız olanlardan farklı olduğunu düşünüyorsun. Lanetin ilk aşaması budur: umut. Umut yemdir. Umudun olmasaydı, uzanıp işimi kolaylaştırırdın. Ama koşuyorsun, oyun devam ediyor.\"",
      lore_ch2_23: "Muhafızın Vaazı — XXIII:\n\n\"Elindeki Pusula... çıkışı gösteriyor, evet, ama sadece çıkış korkunun en yüksek olduğu yer olduğu için. Seni güvenliğe götürmez. Kabusunun zirvesine götürür.\"",
      lore_ch2_24: "Muhafızın Vaazı — XXIV:\n\n\"Burada getirdiğin korkulardan başka canavar yok. Ben sadece kendi kendinden nefret edişinin yansımasıyım. Kendini sevseydin ben yok olurdum. Ama sevmiyorsun, bu yüzden gerçeğim.\"",
      lore_ch2_25: "Muhafızın Vaazı — XXV:\n\n\"Bilge'nin gerçek adı kapının altında yazılı. Ama asla göremeyeceksin, çünkü aşağı bakmak gölgeyi davet etmektir. O şu anda seni izliyor, karanlıktan gülümsüyor.\"",
      lore_ch2_26: "Muhafızın Vaazı — XXVI:\n\n\"Sayfaların sonuna geliyoruz. Kağıt tükeniyor. Yakında sana rehberlik edecek hiçbir kelime kalmayacak, sadece sessizlik. Sesim olmadan yürümeye hazır mısın? Yoksa bana katılacak mısın?\"",
      lore_ch2_27: "Muhafızın Son Vaazı:\n\n\"Kapı açık. Ama arkana bak. Labirent zihninin içinde büyüdü. Demir kapılardan geçsen bile, hâlâ bu çitlerin arasında yürüyor olacaksın. Labirent sensin. Ve Korku Labirenti'nin çıkışı yok.\"",

      // Fısıltılar (Atmosferik notlar)
      lore_whisper_1: "Fısıltı:\n\n\"Çitlerin arasında bir şeyin süründüğünü duyabiliyorum...\"",
      lore_whisper_2: "Fısıltı:\n\n\"Alevin sönmesine izin verme.\"",
      lore_whisper_3: "Fısıltı:\n\n\"Duvarlar bizi izliyor.\"",
      lore_whisper_4: "Fısıltı:\n\n\"Karanlıktan kaçış yok.\"",
      lore_whisper_5: "Fısıltı:\n\n\"Sessiz ol. O dinliyor.\"",
      lore_whisper_6: "Fısıltı:\n\n\"Işığı takip et, soğuğu görmezden gel.\"",
      lore_whisper_7: "Fısıltı:\n\n\"Hepsi burada düştü.\"",
      lore_whisper_8: "Fısıltı:\n\n\"Bu gerçek mi yoksa bir rüya mı?\"",
      lore_whisper_9: "Fısıltı:\n\n\"Kimseye güvenme. Kendine bile.\"",
      lore_whisper_10: "Fısıltı:\n\n\"Çıkış yakın ama son daha yakın.\"",
      lore_whisper_11: "Fısıltı:\n\n\"Gölgeler uzuyor.\"",
      lore_whisper_12: "Fısıltı:\n\n\"Kalp atışını duyabiliyor musun?\""
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
