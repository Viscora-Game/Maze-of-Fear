import { generateMaze } from "./maze.js?v=130";
import { AudioEngine } from "./audio.js?v=130";
import { CanvasRenderer } from "./canvas.js?v=130";
import { translations } from "./translations.js?v=130";
import { randomEvents, deathEvents } from "./events.js?v=130";
import { getSeededRandom } from "./prng.js?v=130";

const jumpscareNormalUrl = new URL('../assets/jumpscare.png', import.meta.url).href;
const jumpscareChestUrl = new URL('../assets/jumpscare_chest.png', import.meta.url).href;
const jumpscare3Url = new URL('../assets/jumpscare_3.png', import.meta.url).href;
const jumpscare4Url = new URL('../assets/jumpscare_4.png', import.meta.url).href;
const jumpscare5Url = new URL('../assets/jumpscare_5.png', import.meta.url).href;
const jumpscare6Url = new URL('../assets/jumpscare_6.png', import.meta.url).href;

const jumpscareConfigs = [
  { url: jumpscareNormalUrl, filter: "" },
  { url: jumpscareChestUrl, filter: "" },
  { url: jumpscare3Url, filter: "" },
  { url: jumpscare4Url, filter: "" },
  { url: jumpscare5Url, filter: "" },
  { url: jumpscare6Url, filter: "" },
  // 4 extra realistic variations using CSS filters
  // Variant 7: Blood Red Demonic Look (Chest Base)
  { url: jumpscareChestUrl, filter: "hue-rotate(180deg) saturate(3.5) brightness(0.7) contrast(1.6)" },
  // Variant 8: Toxic Night Vision (Variant 3 Base)
  { url: jumpscare3Url, filter: "hue-rotate(90deg) saturate(2.5) contrast(1.4) brightness(0.85)" },
  // Variant 9: Inverted Spectral Phantom (Variant 5 Base)
  { url: jumpscare5Url, filter: "invert(1) contrast(1.6) brightness(1.05)" },
  // Variant 10: Hellfire Skull (Variant 6 Base)
  { url: jumpscare6Url, filter: "hue-rotate(330deg) saturate(3.5) contrast(1.5) sepia(0.8)" }
];

// Preload jumpscare images to avoid filesystem/network lag spikes during gameplay
if (typeof Image !== "undefined") {
  jumpscareConfigs.forEach(config => {
    const img = new Image();
    img.src = config.url;
  });
}

export class Game {
  constructor() {
    this.lang = localStorage.getItem("maze_lang") || "tr";
    this.audioEnabled = localStorage.getItem("maze_audio") !== "false";
    this.vibrationEnabled = localStorage.getItem("maze_vibration") !== "false";
    this.shadowsEnabled = localStorage.getItem("maze_shadows") !== "false";
    this.difficulty = localStorage.getItem("maze_diff") || "medium";
    this.coopMapSize = "small"; // Default Co-op Map Size

    // Achievements definitions (16 Total: Easy, Medium, Hard, Nightmare, Co-op, and General)
    this.achievements = [
      { id: "first_escape", group: "easy", nameTr: "İlk Kaçış", nameEn: "First Escape", descTr: "Kolay veya daha üstü zorlukta labirentten ilk kez kaç.", descEn: "Escape the maze on Easy or higher difficulty for the first time.", icon: "🏆" },
      { id: "burn_monster", group: "medium", nameTr: "Karanlığın Avcısı", nameEn: "Shadow Burner", descTr: "Orta veya daha üstü zorlukta canavarı ilk kez yakarak geri püskürt.", descEn: "Repel the shadow monster on Medium or higher difficulty by burning it.", icon: "🔥" },
      { id: "no_damage_victory", group: "hard", nameTr: "Hayatta Kalan", nameEn: "Fearless", descTr: "Zor veya daha üstü zorlukta canavardan hiç hasar almadan kaç.", descEn: "Escape the maze on Hard or higher difficulty without taking damage from the monster.", icon: "🛡️" },
      { id: "nightmare_victory", group: "nightmare", nameTr: "Kabusun Sonu", nameEn: "End of Nightmare", descTr: "Kabus (Nightmare) modunda labirentten başarıyla kaç.", descEn: "Successfully escape the maze on Nightmare difficulty.", icon: "💀" },
      
      // Co-op Achievements
      { id: "coop_first_lobby", group: "coop", nameTr: "Omuz Omuza", nameEn: "Side by Side", descTr: "Co-op modunda bir lobiye ilk kez katıl veya lobi kur.", descEn: "Host or join a Co-op room lobby for the first time.", icon: "🤝" },
      { id: "coop_first_escape", group: "coop", nameTr: "Kardeşlik Bağı", nameEn: "Brotherhood", descTr: "Co-op modunda arkadaşınla birlikte labirentten başarıyla kaç.", descEn: "Successfully escape the maze in Co-op mode with your partner.", icon: "👥" },
      { id: "coop_revive_partner", group: "coop", nameTr: "Hayat Kurtaran", nameEn: "Savior", descTr: "Co-op modunda arkadaşının düştüğü bir oyunda labirentten kaçmayı başar.", descEn: "Escape the maze in Co-op mode when your partner was saved or spectating.", icon: "🚑" },
      { id: "coop_nightmare_escape", group: "coop", nameTr: "Karanlığın İkizleri", nameEn: "Twin Shadows", descTr: "Kabus (Nightmare) zorluğunda Co-op modunda arkadaşınla birlikte kaç.", descEn: "Escape the maze in Co-op mode on Nightmare difficulty.", icon: "🕯️" },

      // General & Retention Achievements
      { id: "master_explorer", group: "general", nameTr: "Usta Gezgin", nameEn: "Master Explorer", descTr: "Tek oyunculu modda Seviye 5 veya üzerine ulaş.", descEn: "Reach Level 5 or higher in singleplayer progression.", icon: "🗺️" },
      { id: "speedrunner", group: "general", nameTr: "Rüzgar Gibi", nameEn: "Speedrunner", descTr: "Bir labirent bölümünü 90 saniyeden kısa sürede tamamla.", descEn: "Complete a maze level in under 90 seconds.", icon: "⚡" },
      { id: "monster_slayer", group: "general", nameTr: "Fenerlerin Efendisi", nameEn: "Light Lord", descTr: "Bir oyunda canavarı ışıkla en az 3 kez yakarak püskürt.", descEn: "Burn and repel the shadow monster at least 3 times in a single game.", icon: "💡" },
      { id: "rope_explorer", group: "general", nameTr: "Derinliklerin Hakimi", nameEn: "Abyss Explorer", descTr: "Alt katlara giden halat kuyusunu kullanarak alt kata in.", descEn: "Use the rope shaft to descend to lower maze floors.", icon: "🪢" },
      { id: "read_all_lore", group: "general", nameTr: "Kayıp Parşömenler", nameEn: "Lore Keeper", descTr: "Labirentteki 3 hikaye parşömeninin tamamını bul ve oku.", descEn: "Find and read all 3 lore papers scattered in the maze.", icon: "📜" },
      { id: "solve_all_quests", group: "general", nameTr: "İyilik Meleği", nameEn: "Soul Liberator", descTr: "Çocuk ve Fare yan görevlerinin ikisini de aynı oyunda tamamla.", descEn: "Complete both the Child and Mouse side quests in a single game.", icon: "💖" },
      { id: "gold_collector", group: "general", nameTr: "Altın Avcısı", nameEn: "Gold Digger", descTr: "Bir oyunda en az 30 altın biriktir.", descEn: "Accumulate at least 30 gold in a single game.", icon: "💰" },
      { id: "solve_all_gates", group: "general", nameTr: "Zırhlı Kapılar", nameEn: "Keymaster", descTr: "3 kilitli kapının/şifrenin tamamını çözerek aç.", descEn: "Resolve and open all 3 locked doors/puzzles in the maze.", icon: "🔑" }
    ];

    // Level progression
    this.currentLevel = parseInt(localStorage.getItem("maze_level")) || 1;
    this.currentVariation = 0; // 0, 1, or 2 (rotated per level generation)
    this.unlockedAchievements = JSON.parse(localStorage.getItem("unlocked_achievements") || "[]");
    this.characterSkin = localStorage.getItem("selected_character_skin") || "traveler";
    this.unlockedSkins = JSON.parse(localStorage.getItem("unlocked_skins") || '["traveler"]');

    this.audio = new AudioEngine();
    if (!this.audioEnabled) this.audio.muted = true;

    this.state = null;
    this.renderer = null;
    this.canvas = null;
    this.joystick = { x: 0, y: 0 };

    // Keyboard inputs
    this.keys = {};
    window.addEventListener("keydown", (e) => {
      const k = e.key.toLowerCase();
      this.keys[k] = true;
      if (this.state && this.state.gameState === "playing") {
        if (k === "f") this.toggleLantern();
        if (k === "m") this.useInventoryItem("map_piece");
        if (k === "c") this.useInventoryItem("compass");
        if (k === "e" || e.key === " ") {
          this.interactWithClosest();
        }
      }
    });
    window.addEventListener("keyup", (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    // Game loop flags
    this.loopRunning = false;
    this.lastTime = null;
    this.stepSoundTimer = 0;

    // UI Callbacks
    this.onStateChange = null;
    this.onDialog = null;
    this.onChest = null;
    this.onEvent = null;
    this.onKeypad = null;
    this.onAd = null;
    this.onGameEnd = null;
  }

  showJumpscare(type = "normal") {
    const now = Date.now();
    if (this._lastJumpscareShowTime && now - this._lastJumpscareShowTime < 3000) {
      return; // Ignore duplicate overlapping jumpscares within 3s
    }
    this._lastJumpscareShowTime = now;

    const overlay = document.getElementById("modal-jumpscare");
    if (!overlay || typeof overlay.querySelector !== "function") return;
    const img = overlay.querySelector("img");
    if (img) {
      let config;
      if (type === "normal") {
        // Monster caught player -> use the main shadow monster face
        config = jumpscareConfigs[0];
      } else {
        // Randomly pick one of the chest jumpscare variations (index 1 to 9, excluding shadow monster index 0)!
        const idx = 1 + Math.floor(Math.random() * (jumpscareConfigs.length - 1));
        config = jumpscareConfigs[idx];
      }
      img.src = config.url;
      // Default filter is brightness(1.2) contrast(1.3) transform(scale(1.1)). Combine with custom filter.
      img.style.filter = (config.filter ? `${config.filter} ` : "") + "brightness(1.2) contrast(1.3)";
    }
  }

  setCanvas(canvasElement) {
    this.canvas = canvasElement;
    this.renderer = new CanvasRenderer(canvasElement);
    this.renderer.audio = this.audio;
  }

  t(key, replacements = {}) {
    const dict = translations[this.lang];
    if (!dict) return key;

    let val = key;
    if (key.includes(".")) {
      const parts = key.split(".");
      let curr = dict;
      for (const p of parts) {
        if (curr && curr[p] !== undefined) {
          curr = curr[p];
        } else {
          curr = null;
          break;
        }
      }
      if (curr) val = curr;
    } else if (dict[key] !== undefined) {
      val = dict[key];
    }

    if (typeof val !== "string") return key;

    for (const [k, v] of Object.entries(replacements)) {
      val = val.replace(`{${k}}`, v);
    }
    return val;
  }

  initNewGame(isRetry = false, customSeed = null) {
    const isCoop = this.multiplayer && this.multiplayer.isConnected;
    
    // Always roll a random variation (0, 1, or 2) out of the 3 static level variations to keep it fresh and prevent simple memorization!
    if (customSeed === null) {
      this.currentVariation = Math.floor(Math.random() * 3);
    }

    // 1. Calculate dimensions and floors based on 20 levels progression
    let size = 21 + (this.currentLevel - 1) * 2;
    size = Math.min(39, size); // Cap at 39x39 for excellent performance
    if (size % 2 === 0) size += 1;

    let numFloors = 1;
    if (this.currentLevel >= 7 && this.currentLevel <= 13) numFloors = 2;
    else if (this.currentLevel >= 14) numFloors = 3;

    // Generate seeded deterministic maze
    const seed = customSeed !== null ? customSeed : (this.currentLevel * 100) + this.currentVariation;
    this.currentSeed = seed;
    const rng = getSeededRandom(seed);
    const mazeData = generateMaze(size, size, numFloors, rng, this.currentLevel, isCoop);
    
    // Visited Map tracker (per floor)
    const visited = [];
    for (let f = 0; f < numFloors; f++) {
      const fVisited = [];
      for (let y = 0; y < mazeData.height; y++) {
        fVisited.push(new Array(mazeData.width).fill(false));
      }
      visited.push(fVisited);
    }

    // Select 10 random events
    const shuffledEvents = [...randomEvents].sort(() => 0.5 - Math.random());
    const levelEventsPool = shuffledEvents.slice(0, 10);

    this.state = {
      floors: mazeData.floors,
      width: mazeData.width,
      height: mazeData.height,
      numFloors: mazeData.numFloors,
      startCell: mazeData.startCell,
      exitCell: mazeData.exitCell,
      doorCode: mazeData.doorCode,
      visitedMap: visited,
      devMode: false,
      gameState: "playing",
      currentLevel: this.currentLevel,
      currentFloor: 0,
      stepsTaken: 0,
      nextEventSteps: 1500 + Math.floor(Math.random() * 1000), // Rare random events for peaceful exploration
      levelEvents: levelEventsPool,
      staircaseCooldown: 0,
      staircaseCell: null,
      timeOfDay: 0.0, // 0.0 to 1.0 cycle (0.0 to 0.45 day, 0.45 to 0.55 sunset, 0.55 to 0.90 night, 0.90 to 1.0 sunrise)
      lanternOn: false, // lantern starts turned off by default
      playerTrail: [{ x: 1, y: 1, floor: 0 }], // Track player path coordinates

      player: {
        x: 1.5, // Start centered in cell (1, 1)
        y: 1.5,
        visualX: 1.5,
        visualY: 1.5,
        dir: "south",
        angle: Math.PI / 2, // start facing south (down)
        pitch: 0.0,
        stamina: 100,
        maxStamina: 100,
        health: 100,
        maxHealth: 100,
        gold: 0,
        fuel: 100,
        inventory: {
          key: 0,
          shears: 0,
          bucket: 0,
          bucket_full: 0,
          axe: 0,
          rope: isCoop ? 2 : 1,
          compass: 0,
          map_piece: 0,
          fuel: 0,
          fuel_half: 0,
          cheese: 0,
          revival_scroll: 0
        },
        equippedBoots: null,
        activeBlessing: null,
        characterSkin: this.characterSkin,
        hasCompass: false,
        equippedItem: null
      },

      quests: {
        childState: "unsolved",
        mouseState: "unsolved",
        wellState: "unsolved"
      },

      merchantStock: {
        compass: { cost: 30, count: 1 },
        map_piece: { cost: 25, count: 1 },
        revival_scroll: { cost: 40, count: isCoop ? 1 : 0 },
        fuel: { cost: 15, count: Math.floor(1 + Math.random() * 2) },
        cheese: { cost: 15, count: 1 },
        axe: { cost: 25, count: 1 }
      },

      otherPlayer: isCoop ? {
        fuel: 100,
        gold: 0,
        ropes: 2,
        matches: 0,
        inventory: [],
        walkSpeedBonus: 0,
        staminaDrainRate: 1.0,
        flashlightDrainRate: 1.0,
        flashlightRangeBonus: 0,
        lastAltarUseTime: 0,
        altarCooldown: 0,
        altarUses: 0,
        x: 1.5,
        y: 1.5,
        visualX: 1.5,
        visualY: 1.5,
        floor: 0,
        angle: Math.PI / 2,
        pitch: 0,
        lanternOn: false,
        health: 100,
        isShiftPressed: false,
        isExhausted: false,
        isDead: false
      } : null,
      lastCheckPoint: { x: 1.5, y: 1.5, floor: 0 },
      shadowMonsters: (() => {
        if (this.difficulty === "peaceful") return [];
        // Difficulty-based spawner parameters
        let initialSpawn = 30.0 + Math.random() * 15.0; // Medium default
        let baseSpeed = 1.55;
        if (this.difficulty === "easy") {
          initialSpawn = 50.0 + Math.random() * 20.0;
          baseSpeed = 1.15;
        } else if (this.difficulty === "hard") {
          initialSpawn = 15.0 + Math.random() * 10.0;
          baseSpeed = 1.85;
        } else if (this.difficulty === "nightmare") {
          initialSpawn = 10.0 + Math.random() * 10.0;
          baseSpeed = 1.95;
        }

        const monsters = [];
        const makeMonster = (spawnDelay) => ({
          active: false,
          x: 0,
          y: 0,
          floor: 0,
          burnTime: 0,
          spawnTimer: spawnDelay,
          speed: baseSpeed * (0.95 + Math.random() * 0.1),
          soundTimer: 0.5,
          pathRecalcTimer: 0
        });

        if (this.difficulty === "nightmare") {
          monsters.push(makeMonster(initialSpawn));
          monsters.push(makeMonster(initialSpawn + 20.0 + Math.random() * 15.0)); // Staggered second monster
        } else {
          monsters.push(makeMonster(initialSpawn));
        }
        return monsters;
      })(),
      tookMonsterDamage: false,
      solvedGatesCount: 0,
      readLore: []
    };

    this.lastCellX = undefined;
    this.lastCellY = undefined;

    this.gameStartTime = Date.now();
    this.sageDisappeared = false;

    // Reveal start coordinates
    this.revealArea(1, 1);
    this.audio.init();

    if (this.renderer) {
      this.renderer.resetFloorCache();
      this.renderer.rebuildScene(this.state);
      this.renderer.onEntityClick = (type, cell) => {
        if (this.state.gameState !== "playing") return;
        if (type === "chest") this.triggerChestInteraction(cell);
        else if (type === "npc") this.triggerNPCInteraction(cell);
        else if (type === "obstacle") {
          if (cell.obstacle && !cell.obstacle.resolved) {
            this.triggerObstacleInteraction(cell);
          }
        }
        else if (type === "clue") this.triggerClueInteraction(cell);
        else if (type === "lore") this.triggerLoreInteraction(cell);
      };
    }

    if (this.onStateChange) this.onStateChange();
    this.resizeCanvas();

    // Start physics animation loop
    this.startLoop();
  }

  startCoopGame(isHost) {
    if (isHost) {
      this.currentVariation = Math.floor(Math.random() * 3);
      const seed = Math.floor(100000 + Math.random() * 900000);
      
      // Determine the level index randomly based on the selected map size
      let levelVal = 1;
      const mapSize = this.coopMapSize || "small";
      if (mapSize === "small") {
        levelVal = 1 + Math.floor(Math.random() * 6); // Levels 1 to 6
      } else if (mapSize === "medium") {
        levelVal = 7 + Math.floor(Math.random() * 7); // Levels 7 to 13
      } else if (mapSize === "large") {
        levelVal = 14 + Math.floor(Math.random() * 7); // Levels 14 to 20
      }
      this.currentLevel = levelVal;
      
      this.multiplayer.send({
        type: "SYNC_GAME",
        seed: seed,
        level: this.currentLevel,
        difficulty: this.difficulty,
        variation: this.currentVariation
      });

      this.initNewGame(false, seed);
      
      const coopScreen = document.getElementById("screen-coop");
      if (coopScreen) coopScreen.classList.add("hidden");
      const gameScreen = document.getElementById("screen-game");
      if (gameScreen) gameScreen.classList.remove("hidden");
      
      this.state.gameState = "playing";
      this.resizeCanvas();
      this.startLoop();
      this.draw();
    }
  }

  initializeCoopGuestGame(seed, level, difficulty, variation) {
    this.currentLevel = level;
    this.difficulty = difficulty;
    this.currentVariation = variation;
    
    this.initNewGame(false, seed);
    
    const coopScreen = document.getElementById("screen-coop");
    if (coopScreen) coopScreen.classList.add("hidden");
    const gameScreen = document.getElementById("screen-game");
    if (gameScreen) gameScreen.classList.remove("hidden");
    
    // Hide any active victory/game over end modal
    const endModal = document.getElementById("modal-end");
    if (endModal) endModal.classList.add("hidden");
    
    this.state.gameState = "playing";
    this.resizeCanvas();
    this.startLoop();
    this.draw();
  }

  revivePlayerFromCoop(spawnX, spawnY) {
    const p = this.state.player;
    p.health = 100;
    p.isDead = false;
    
    p.x = spawnX;
    p.y = spawnY;
    p.visualX = spawnX;
    p.visualY = spawnY;
    
    if (this.state.otherPlayer) {
      this.state.currentFloor = this.state.otherPlayer.floor;
    }
    
    this.revealArea(Math.floor(p.x), Math.floor(p.y));
    
    this.audio.playShadowSpawn();
    
    this.showToast(this.lang === "tr" ? "Ritüel tamamlandı! Hayata döndün!" : "Ritual complete! You have been revived!");
    
    if (this.onStateChange) this.onStateChange();
    this.draw();
  }

  reviveOtherPlayerLocally() {
    if (this.state.otherPlayer) {
      this.state.otherPlayer.isDead = false;
      this.state.otherPlayer.health = 100;
    }
    if (this.onStateChange) this.onStateChange();
    this.draw();
  }

  syncRemotePlayerVisited(rx, ry, rFloor) {
    if (this.state && this.state.visitedMap && this.state.visitedMap[rFloor]) {
      const cx = Math.floor(rx);
      const cy = Math.floor(ry);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const vx = cx + dx;
          const vy = cy + dy;
          if (vx >= 0 && vx < this.state.width && vy >= 0 && vy < this.state.height) {
            this.state.visitedMap[rFloor][vy][vx] = true;
          }
        }
      }
    }
  }

  triggerMonsterSpawnAlert(targetPlayer, monsterIndex) {
    const isTarget = (targetPlayer === "Player1" && this.multiplayer.isHost) || 
                     (targetPlayer === "Player2" && !this.multiplayer.isHost);
                     
    if (isTarget) {
      this.audio.playShadowSpawn();
      this.vibrateDevice("heavy");
      
      let alertEl = document.getElementById("coop-target-alert");
      if (!alertEl) {
        alertEl = document.createElement("div");
        alertEl.id = "coop-target-alert";
        alertEl.style.position = "fixed";
        alertEl.style.top = "20%";
        alertEl.style.left = "50%";
        alertEl.style.transform = "translate(-50%, -50%)";
        alertEl.style.color = "#ef4444";
        alertEl.style.fontSize = "2rem";
        alertEl.style.fontWeight = "bold";
        alertEl.style.textShadow = "0 0 15px rgba(239, 68, 68, 0.8), 0 0 5px #000";
        alertEl.style.zIndex = "2000";
        alertEl.style.pointerEvents = "none";
        alertEl.style.animation = "coop-pulse-alert 0.5s infinite alternate";
        alertEl.style.fontFamily = "monospace";
        
        const style = document.createElement("style");
        style.innerHTML = `
          @keyframes coop-pulse-alert {
            from { transform: translate(-50%, -50%) scale(1.0); opacity: 0.5; }
            to { transform: translate(-50%, -50%) scale(1.15); opacity: 1.0; }
          }
        `;
        document.head.appendChild(style);
        document.body.appendChild(alertEl);
      }
      
      alertEl.textContent = this.lang === "tr" ? "⚠️ CANAVAR SENİ HEDEFLİYOR!" : "⚠️ MONSTER IS TARGETING YOU!";
      alertEl.style.display = "block";
      
      setTimeout(() => {
        alertEl.style.display = "none";
      }, 3500);
    }
  }

  updateInventoryUI() {
    if (this.onStateChange) this.onStateChange();
    
    const invModal = document.getElementById("modal-inventory");
    if (invModal && !invModal.classList.contains("hidden")) {
      const openInvBtn = document.getElementById("btn-open-inventory");
      if (openInvBtn) {
        const closeInvBtn = document.getElementById("btn-close-inventory");
        if (closeInvBtn) closeInvBtn.click();
        openInvBtn.click();
      }
    }
  }

  startLoop() {
    if (this.loopRunning) return;
    this.loopRunning = true;
    this.lastTime = performance.now();

    const tick = (now) => {
      if (!this.loopRunning) return;
      
      const dt = Math.min(0.033, (now - this.lastTime) / 1000); // cap dt to 33ms (30 FPS physics step cap)
      this.lastTime = now;

      if (this.state && this.state.gameState === "playing") {
        this.updatePhysics(dt);
        this.checkSageDisappearance();
        
        // Sync player coordinates to buddy in co-op mode (rate-limited to 16 updates/sec to keep framerate high & avoid GC spikes)
        if (this.multiplayer && this.multiplayer.isConnected) {
          const nowMs = Date.now();
          if (!this.lastSendTime || nowMs - this.lastSendTime > 60) {
            this.lastSendTime = nowMs;
            const p = this.state.player;
            this.multiplayer.send({
              type: "PLAYER_POS",
              x: Math.round(p.x * 100) / 100,
              y: Math.round(p.y * 100) / 100,
              floor: this.state.currentFloor,
              angle: Math.round(p.angle * 100) / 100,
              pitch: Math.round(p.pitch * 100) / 100,
              lanternOn: this.state.lanternOn,
              fuel: p.fuel,
              health: p.health,
              isDead: p.isDead || false
            });
          }
        }
      }

      if (this.state && this.state.gameState !== "menu") {
        this.draw();
      }

      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  stopLoop() {
    this.loopRunning = false;
  }

  broadcastAudioEvent(sound, extra = {}) {
    if (this.multiplayer && this.multiplayer.isConnected) {
      this.multiplayer.send({
        type: "AUDIO_EVENT",
        sound: sound,
        ...extra
      });
    }
  }

  resizeCanvas() {
    if (this.renderer && this.canvas && this.state) {
      const container = this.canvas.parentElement;
      if (container) {
        this.renderer.resize(container.clientWidth, container.clientHeight, this.state.width, this.state.height);
        this.draw();
      }
    }
  }

  draw() {
    if (this.renderer && this.state && this.state.gameState !== "menu") {
      this.renderer.draw(this.state);
    }
  }

  revealArea(px, py) {
    const w = this.state.width;
    const h = this.state.height;
    const f = this.state.currentFloor;
    const radius = 3; // reveal cells up to 3 units away cardinally and diagonally
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        // Euclidean distance check to make it a perfect circular reveal area of radius 3
        if (dx * dx + dy * dy <= 12.25) { // 3.5 squared
          const nx = px + dx;
          const ny = py + dy;
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            this.state.visitedMap[f][ny][nx] = true;
          }
        }
      }
    }
  }

  // Continuous Physics Loop
  updatePhysics(dt) {
    const p = this.state.player;
    
    if (this.state.gameState !== "playing") {
      this.stepSoundTimer = 0;
      this.audio.stopStep();
      return;
    }
    
    if (p.isDead) {
      if (this.state.otherPlayer) {
        p.x = this.state.otherPlayer.x;
        p.y = this.state.otherPlayer.y;
        p.angle = this.state.otherPlayer.angle;
        p.pitch = this.state.otherPlayer.pitch;
        this.state.currentFloor = this.state.otherPlayer.floor;
        this.state.lanternOn = this.state.otherPlayer.lanternOn; // Sync lantern state during spectating!
      }
      return;
    }
    
    const prevStamina = p.stamina;
    
    // 1. Keyboard rotation disabled (rotation is controlled solely by mouse movement / touch drags)

    // Normalise angle to [-PI, PI]
    let normalizedAngle = p.angle % (Math.PI * 2);
    if (normalizedAngle < -Math.PI) normalizedAngle += Math.PI * 2;
    if (normalizedAngle > Math.PI) normalizedAngle -= Math.PI * 2;
    p.angle = normalizedAngle;

    // Map angle to cardinal facing direction for translations and audio cues
    if (p.angle >= -Math.PI / 4 && p.angle <= Math.PI / 4) {
      p.dir = "east";
    } else if (p.angle > Math.PI / 4 && p.angle < 3 * Math.PI / 4) {
      p.dir = "south";
    } else if (p.angle >= 3 * Math.PI / 4 || p.angle <= -3 * Math.PI / 4) {
      p.dir = "west";
    } else {
      p.dir = "north";
    }

    // 2. Forward/Backward Movement & Sideways Strafing inputs
    let moveDir = 0;
    let strafeDir = 0;

    const hasJoystick = this.joystick && (Math.abs(this.joystick.x) > 0.05 || Math.abs(this.joystick.y) > 0.05);
    if (hasJoystick) {
      moveDir = this.joystick.y;
      strafeDir = this.joystick.x;
    } else {
      if (this.keys["w"] || this.keys["arrowup"]) moveDir = 1;
      if (this.keys["s"] || this.keys["arrowdown"]) moveDir = -1;
      if (this.keys["a"]) strafeDir -= 1;
      if (this.keys["d"]) strafeDir += 1;

      // Arrow keys turning (only when mouse pointer lock is NOT active to prevent mouse conflict)
      if (typeof document !== "undefined" && !document.pointerLockElement) {
        if (this.keys["arrowleft"]) p.angle -= dt * 2.2;
        if (this.keys["arrowright"]) p.angle += dt * 2.2;
      }
    }

    const isMoving = hasJoystick || moveDir !== 0 || strafeDir !== 0;

    // Running & Stamina logic with exhaustion hysteresis to prevent high-frequency oscillation
    const isShiftPressed = !!(this.keys["shift"]);
    p.stamina = p.stamina !== undefined ? p.stamina : 100;
    p.maxStamina = 100;
    p.exhausted = p.exhausted !== undefined ? p.exhausted : false;

    if (p.stamina <= 2.0) {
      p.exhausted = true;
      this.keys["shift"] = false; // Turn off sprint toggle when exhausted
    } else if (p.stamina >= 25.0) {
      p.exhausted = false;
    }

    let isRunning = false;
    if (isShiftPressed && isMoving && !p.exhausted && moveDir > 0.5) {
      isRunning = true;
    }
    p.isRunning = isRunning;
    p.isMoving = isMoving;

    const speedMultiplier = isRunning ? 1.6 : 1.0;
    const speed = (1.8 + (p.walkSpeedBonus || 0)) * speedMultiplier;

    if (isRunning) {
      // Drain stamina when sprinting forward (reduced significantly by Altar B2 upgrade)
      p.stamina = Math.max(0, p.stamina - dt * 22.0 * (p.staminaDrainRate || 1.0));
    } else {
      // Regenerate stamina when walking or standing (fully recovers in 15 seconds: 6.6 per second)
      p.stamina = Math.min(p.maxStamina, p.stamina + dt * 6.6);
    }

    // Apply movement relative to camera look angle (including strafing perpendicular to the look vector)
    let inputX = Math.cos(p.angle) * moveDir + Math.cos(p.angle + Math.PI / 2) * strafeDir;
    let inputY = Math.sin(p.angle) * moveDir + Math.sin(p.angle + Math.PI / 2) * strafeDir;

    // Normalize diagonal movement speed to prevent running faster when moving diagonally
    const inputLength = Math.hypot(inputX, inputY);
    if (inputLength > 1.0) {
      inputX /= inputLength;
      inputY /= inputLength;
    }

    // 3. Wall Collision detection (Sliding box collision)
    const r = 0.22; // collision radius
    const grid = this.state.floors[this.state.currentFloor];

    const resolveCollisions = (px, py) => {
      const minX = Math.max(0, Math.floor(px - r));
      const maxX = Math.min(this.state.width - 1, Math.floor(px + r));
      const minY = Math.max(0, Math.floor(py - r));
      const maxY = Math.min(this.state.height - 1, Math.floor(py + r));

      let rx = px;
      let ry = py;

      for (let cy = minY; cy <= maxY; cy++) {
        for (let cx = minX; cx <= maxX; cx++) {
          const cell = grid[cy][cx];
          if (cell.type === "wall" || (cell.obstacle && !cell.obstacle.resolved)) {
            const closestX = Math.max(cx, Math.min(rx, cx + 1));
            const closestY = Math.max(cy, Math.min(ry, cy + 1));

            const diffX = rx - closestX;
            const diffY = ry - closestY;
            const dist = Math.hypot(diffX, diffY);

            if (dist < r) {
              if (dist > 0.001) {
                const overlap = r - dist;
                rx += (diffX / dist) * overlap;
                ry += (diffY / dist) * overlap;
              } else {
                // Player is inside the wall cell boundary. Push out along the shallowest axis.
                const distL = rx - cx;
                const distR = (cx + 1) - rx;
                const distB = ry - cy;
                const distT = (cy + 1) - ry;
                const minDist = Math.min(distL, distR, distB, distT);
                
                if (minDist === distL) rx = cx - r;
                else if (minDist === distR) rx = cx + 1 + r;
                else if (minDist === distB) ry = cy - r;
                else ry = cy + 1 + r;
              }
            }
          }
        }
      }
      return { x: rx, y: ry };
    };

    // Store pre-move position to detect actual displacement (prevents footstep sounds when stuck against walls)
    const preX = p.x;
    const preY = p.y;

    if (isMoving) {
      let nextX = p.x + inputX * speed * dt;
      let nextY = p.y + inputY * speed * dt;

      // Boundary constraints: Keep the player strictly within walkable cells (radius 0.22 from outer walls)
      nextX = Math.max(1.22, Math.min(this.state.width - 1.22, nextX));
      nextY = Math.max(1.22, Math.min(this.state.height - 1.22, nextY));

      // Update X and resolve
      let res = resolveCollisions(nextX, p.y);
      p.x = res.x;

      // Update Y and resolve
      res = resolveCollisions(p.x, nextY);
      p.y = res.y;
    }

    // Check if player actually moved (not blocked by wall collision or standing still)
    const distMoved = Math.hypot(p.x - preX, p.y - preY);
    const actuallyMoved = isMoving && (distMoved > 0.015);

    // Sync visual coordinates directly
    p.visualX = p.x;
    p.visualY = p.y;

    // 4. Update coordinates & trigger proximity interaction (Staircase & Exit ONLY!)
    const cellX = Math.floor(p.x);
    const cellY = Math.floor(p.y);
    const cell = grid[cellY][cellX];

    // Update staircase stepped-off tracking
    if (this.state.staircaseCell) {
      if (cellX !== this.state.staircaseCell.x || cellY !== this.state.staircaseCell.y || this.state.currentFloor !== this.state.staircaseCell.floor) {
        // Player stepped off the staircase cell; clear restriction
        this.state.staircaseCell = null;
      }
    }

    // Decrement staircase timer
    if (this.state.staircaseCooldown > 0) {
      this.state.staircaseCooldown -= dt;
    }

    // A. Check Exit
    if (cell.isExit) {
      const dist = Math.hypot(p.x - (cellX + 0.5), p.y - (cellY + 0.5));
      if (dist < 0.28) {
        this.triggerLevelVictory();
        return;
      }
    }

    // B. Check Staircase (Requires 4.0 seconds cooldown AND player stepping off the landing cell before re-triggering)
    if (cell.staircase && this.state.staircaseCooldown <= 0 && !this.state.staircaseCell) {
      const dist = Math.hypot(p.x - (cellX + 0.5), p.y - (cellY + 0.5));
      if (dist < 0.28) {
        const nextFloor = cell.staircase === "down" ? this.state.currentFloor + 1 : this.state.currentFloor - 1;
        
        // Downward transitions require a rope to be deployed first
        if (cell.staircase === "down" && !cell.staircaseDeployed) {
          if (p.inventory.rope > 0) {
            p.inventory.rope--;
            cell.staircaseDeployed = true;
            // Mark the corresponding staircase up cell on the destination floor as deployed
            if (this.state.floors[nextFloor] && this.state.floors[nextFloor][cellY] && this.state.floors[nextFloor][cellY][cellX]) {
              this.state.floors[nextFloor][cellY][cellX].staircaseDeployed = true;
            }
            if (this.multiplayer && this.multiplayer.isConnected) {
              this.multiplayer.send({
                type: "ROPE_DEPLOYED",
                floor: this.state.currentFloor,
                cellX: cellX,
                cellY: cellY,
                nextFloor: nextFloor
              });
            }
            if (this.showToast) {
              this.showToast(this.t("obstacles.ropePitSuccess"));
            }
          } else {
            // Block transition and show warning toast with a cooldown to prevent spamming
            this.state.staircaseCooldown = 3.0;
            if (this.showToast) {
              this.showToast(this.t("obstacles.ropePitWarning"));
            }
            return;
          }
        }

        this.state.staircaseCooldown = 4.0; // 4 seconds reaction delay
        this.state.staircaseCell = { x: cellX, y: cellY, floor: nextFloor }; // require stepping off before re-triggering
        this.audio.playUnlock();
        this.revealArea(cellX, cellY);
        
        if (cell.staircase === "down" && this.multiplayer && this.multiplayer.isConnected) {
          this.multiplayer.send({
            type: "COOP_ROPE_DESCEND_ALERT"
          });
        }

        if (typeof this.onFloorTransition === "function") {
          this.onFloorTransition(nextFloor, cell.staircase);
        } else {
          this.state.currentFloor = nextFloor;
        }
      }
    }

    // 5. Steps & event decrement (fuel consumption disabled)
    if (actuallyMoved) {
      this.state.stepsTaken += dt * 15;

      // Footstep audio timing (runs faster when sprinting)
      this.stepSoundTimer += dt;
      const stepInterval = isRunning ? 0.32 : 0.48;
      if (this.stepSoundTimer > stepInterval) {
        this.audio.playStep(isRunning);
        this.stepSoundTimer = 0;
      }
    } else {
      this.stepSoundTimer = 0;
      this.audio.stopStep();
    }

    // Out of breath heavy panting audio when stamina is low (20% and below)
    if (p.stamina <= 20.0) {
      if (this.pantSoundTimer === undefined) this.pantSoundTimer = 0;
      this.pantSoundTimer -= dt;
      if (this.pantSoundTimer <= 0) {
        this.audio.playPanting();
        // Dynamic interval: matches actual breathing sound duration (~1.5s to 2.2s) to prevent overlaps
        this.pantSoundTimer = 1.5 + (p.stamina / 20.0) * 0.7;
      }
    } else if (p.stamina > 35.0) {
      // Only reset the timer when stamina has recovered sufficiently, preventing oscillation
      this.pantSoundTimer = 0;
    } else {
      // Between 20% and 35% stamina, let the timer continue ticking down if it was active
      if (this.pantSoundTimer > 0) {
        this.pantSoundTimer -= dt;
      }
    }

    this.revealArea(cellX, cellY);
    this.updateShadowMonster(dt);

    // Update Checkpoint region level
    const lastCP = this.state.lastCheckPoint;
    const cpCell = this.state.floors[lastCP.floor][Math.floor(lastCP.y)][Math.floor(lastCP.x)];
    if (cell.region > cpCell.region) {
      this.state.lastCheckPoint = { x: p.x, y: p.y, floor: this.state.currentFloor };
    }

    // Random events trigger disabled as per user request

    // Update Day/Night Cycle (80-second loop: 40s Day, 40s Night)
    this.state.timeOfDay = (this.state.timeOfDay + dt * 0.0125) % 1.0;

    // Fuel consumption when lantern is ON
    if (this.state.lanternOn && p.fuel > 0) {
      let decayMult = 1.0;
      if (this.difficulty === "peaceful") decayMult = 0.5;
      else if (this.difficulty === "easy") decayMult = 0.7;
      else if (this.difficulty === "hard") decayMult = 1.25;
      else if (this.difficulty === "nightmare") decayMult = 1.4;
      p.fuel = Math.max(0, p.fuel - dt * (100 / 240) * decayMult * (p.flashlightDrainRate || 1.0));
      if (p.fuel === 0) {
        this.state.lanternOn = false; // Turn off automatically when out of fuel
      }
    }

    // Track player trail (deduplicated cell visits)
    const currentCell = { x: Math.floor(p.x), y: Math.floor(p.y), floor: this.state.currentFloor };
    const lastTrail = this.state.playerTrail[this.state.playerTrail.length - 1];
    if (!lastTrail || lastTrail.x !== currentCell.x || lastTrail.y !== currentCell.y || lastTrail.floor !== currentCell.floor) {
      this.state.playerTrail.push(currentCell);
      if (this.onStateChange) this.onStateChange();
    }

    // Trigger UI updates if stamina has changed (so stamina bar updates in real-time while standing/walking)
    if (p.stamina !== prevStamina && this.onStateChange) {
      this.onStateChange();
    }

    // Update mobile/hud interact button glow and disabled status dynamically based on closest active interactable
    const interactable = this.findClosestInteractable();
    const btnInteract = document.getElementById("btn-interact");
    if (btnInteract) {
      if (interactable) {
        if (typeof btnInteract.removeAttribute === "function") btnInteract.removeAttribute("disabled");
        if (btnInteract.style) {
          btnInteract.style.opacity = "1.0";
          btnInteract.style.pointerEvents = "auto";
          btnInteract.style.background = "rgba(16, 185, 129, 0.45)"; // emerald active glow
          btnInteract.style.borderColor = "rgba(16, 185, 129, 0.9)";
          btnInteract.style.boxShadow = "0 0 18px rgba(16, 185, 129, 0.65)";
        }
      } else {
        if (typeof btnInteract.setAttribute === "function") btnInteract.setAttribute("disabled", "true");
        if (btnInteract.style) {
          btnInteract.style.opacity = "0.35";
          btnInteract.style.pointerEvents = "none";
          btnInteract.style.background = "rgba(15, 23, 42, 0.6)"; // inactive dark slate
          btnInteract.style.borderColor = "rgba(16, 185, 129, 0.15)";
          btnInteract.style.boxShadow = "0 0 8px rgba(0, 0, 0, 0.3)";
        }
      }
    }
  }

  vibrateDevice(type) {
    if (!this.vibrationEnabled || typeof navigator === "undefined" || !navigator.vibrate) return;
    
    if (type === "heavy") {
      navigator.vibrate([100, 50, 100, 50, 300]);
    } else if (type === "medium") {
      navigator.vibrate([150, 80, 150]);
    } else if (type === "light") {
      navigator.vibrate([50, 30, 50]);
    }
  }

  unlockAchievement(id) {
    const unlocked = JSON.parse(localStorage.getItem("maze_achievements") || "[]");
    if (unlocked.includes(id)) return; // Already unlocked

    unlocked.push(id);
    localStorage.setItem("maze_achievements", JSON.stringify(unlocked));

    // Vibrate device on unlock
    this.vibrateDevice("light");

    // Play a level-up/unlock sound effect
    if (this.audioEnabled && this.audio) {
      this.audio.playPickup();
    }

    // Display Toast notification
    const ach = this.achievements.find(a => a.id === id);
    if (ach) {
      const name = this.lang === "tr" ? ach.nameTr : ach.nameEn;
      const icon = ach.icon || "🏆";
      this.showNotification(`${icon} BAŞARIM KAZANILDI: ${name}!`);
    }
  }

  unlockSkin(skinId) {
    if (!this.unlockedSkins) this.unlockedSkins = ["traveler"];
    if (this.unlockedSkins.includes(skinId)) return;
    this.unlockedSkins.push(skinId);
    localStorage.setItem("unlocked_skins", JSON.stringify(this.unlockedSkins));

    if (this.audio) this.audio.playAchievementUnlock();

    const skinNames = {
      police: { tr: "Polis Memuru", en: "Police Officer" },
      child: { tr: "Kayıp Kız", en: "Lost Girl" },
      doctor: { tr: "Doktor", en: "Doctor" },
      firefighter: { tr: "İtfaiyeci", en: "Firefighter" },
      killer: { tr: "Maskeli Katil", en: "Masked Killer" },
      monster: { tr: "Gölge Canavarı", en: "Shadow Monster" }
    };
    const sName = skinNames[skinId] ? (this.lang === "tr" ? skinNames[skinId].tr : skinNames[skinId].en) : skinId;
    this.showNotification(`🎭 YENİ KARAKTER AÇILDI: ${sName}!`);
  }

  showAchievementToast(icon, name) {
    if (typeof document === "undefined") return;
    const toast = document.createElement("div");
    toast.className = "achievement-toast animate-toast-in";
    toast.innerHTML = `
      <div style="font-size: 1.5rem; margin-right: 12px;">${icon}</div>
      <div>
        <div style="font-size: 0.65rem; color: #a78bfa; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px; margin-bottom: 2px;">
          ${this.lang === "tr" ? "BAŞARIM AÇILDI" : "ACHIEVEMENT UNLOCKED"}
        </div>
        <div style="font-size: 0.85rem; font-weight: bold; color: #ffffff; text-shadow: 0 0 8px rgba(139,92,246,0.5);">${name}</div>
      </div>
    `;
    document.body.appendChild(toast);
    
    // Auto-remove toast after 4 seconds
    setTimeout(() => {
      toast.classList.remove("animate-toast-in");
      toast.classList.add("animate-toast-out");
      setTimeout(() => {
        toast.remove();
      }, 500);
    }, 4000);
  }

  damagePlayer(amount) {
    this.state.player.health = Math.max(0, this.state.player.health - amount);
    this.vibrateDevice("medium");
    if (this.state.player.health <= 0) {
      const isCoop = this.multiplayer && this.multiplayer.isConnected;
      if (isCoop) {
        this.state.player.isDead = true;
        this.state.player.health = 0;
        this.audio.playHazard();
        
        this.multiplayer.send({
          type: "PLAYER_POS",
          x: this.state.player.x,
          y: this.state.player.y,
          floor: this.state.currentFloor,
          angle: this.state.player.angle,
          pitch: this.state.player.pitch,
          lanternOn: this.state.lanternOn,
          health: 0,
          isDead: true
        });
        
        if (this.state.otherPlayer && this.state.otherPlayer.isDead) {
          this.triggerGameOver();
        } else {
          this.showToast(this.lang === "tr" ? "Öldün! Arkadaşın seni diriltene kadar onu izliyorsun." : "You died! Spectating your friend until you are revived.");
        }
        if (this.onStateChange) this.onStateChange();
      } else {
        this.triggerDeathChoice();
      }
    } else {
      if (this.onStateChange) this.onStateChange();
    }
  }

  toggleLantern() {
    if (this.state && this.state.gameState === "playing") {
      this.state.lanternOn = !this.state.lanternOn;
      if (this.state.lanternOn) {
        this.audio.playFlashlightOn();
      } else {
        this.audio.playFlashlightOff();
      }
      if (this.onStateChange) this.onStateChange();
    }
  }

  resolveObstacle(obstacle) {
    obstacle.resolved = true;
    this.state.solvedGatesCount = (this.state.solvedGatesCount || 0) + 1;
    if (this.state.solvedGatesCount >= 3) {
      this.unlockAchievement("solve_all_gates");
    }
    
    // Sync obstacle resolving in co-op
    const isCoop = this.multiplayer && this.multiplayer.isConnected;
    if (isCoop) {
      let foundX = -1, foundY = -1;
      const grid = this.state.floors[this.state.currentFloor];
      for (let y = 0; y < this.state.height; y++) {
        for (let x = 0; x < this.state.width; x++) {
          if (grid[y][x].obstacle === obstacle) {
            foundX = x;
            foundY = y;
            break;
          }
        }
        if (foundX !== -1) break;
      }
      
      if (foundX !== -1) {
        this.multiplayer.send({
          type: "OBSTACLE_RESOLVED",
          floor: this.state.currentFloor,
          cellX: foundX,
          cellY: foundY
        });
      }
    }
  }

  // Interacting with Obstacles
  triggerObstacleInteraction(cell) {
    const type = cell.obstacle.type;
    const inv = this.state.player.inventory;
    
    this.state.gameState = "modal";
    
    let text = this.t(`obstacles.${type}`);
    let choices = [];

    if (type === "gate") {
      if (inv.key > 0) {
        choices.push({
          text: `${this.t("useItem")}: ${this.t("items.key.name")} (x${inv.key})`,
          action: () => {
             inv.key--;
             if (inv.key <= 0 && this.state.player.equippedItem === "key") this.state.player.equippedItem = null;
             this.resolveObstacle(cell.obstacle);
             this.audio.playChainGate();
             this.state.gameState = "playing";
             if (this.onStateChange) this.onStateChange();
          }
        });
      }
    } else if (type === "ivy") {
      if (inv.shears > 0) {
        choices.push({
          text: `${this.t("useItem")}: ${this.t("items.shears.name")} (x${inv.shears})`,
          action: () => {
            inv.shears--;
            if (inv.shears <= 0 && this.state.player.equippedItem === "shears") this.state.player.equippedItem = null;
            this.resolveObstacle(cell.obstacle);
            this.audio.playShearsCut();
            this.state.gameState = "playing";
            if (this.onStateChange) this.onStateChange();
          }
        });
      }
    } else if (type === "barricade") {
      if (inv.axe > 0) {
        choices.push({
          text: `${this.t("useItem")}: ${this.t("items.axe.name")} (x${inv.axe})`,
          action: () => {
            inv.axe--;
            if (inv.axe <= 0 && this.state.player.equippedItem === "axe") this.state.player.equippedItem = null;
            this.resolveObstacle(cell.obstacle);
            this.audio.playWoodChop();
            this.state.gameState = "playing";
            if (this.onStateChange) this.onStateChange();
          }
        });
      }
    } else if (type === "chasm") {
      if (inv.rope > 0) {
        choices.push({
          text: `${this.t("useItem")}: ${this.t("items.rope.name")} (x${inv.rope})`,
          action: () => {
            inv.rope--;
            if (inv.rope <= 0 && this.state.player.equippedItem === "rope") this.state.player.equippedItem = null;
            this.resolveObstacle(cell.obstacle);
            this.audio.playUnlock();
            this.state.gameState = "playing";
            if (this.onStateChange) this.onStateChange();
          }
        });
      }
    } else if (type === "codeLock") {
      choices.push({
        text: this.t("interact"),
        action: () => {
          this.state.gameState = "modal";
          if (this.onKeypad) {
            this.onKeypad(cell.obstacle.code, (correct) => {
              if (correct) {
                this.resolveObstacle(cell.obstacle);
                this.audio.playUnlock();
                this.state.gameState = "playing";
                if (this.onStateChange) this.onStateChange();
              } else {
                this.state.gameState = "playing";
                this.damagePlayer(10);
                if (this.onStateChange) this.onStateChange();
              }
            });
          }
        }
      });
    }

    choices.push({
      text: this.t("back"),
      action: () => {
        this.state.gameState = "playing";
        if (this.onStateChange) this.onStateChange();
      }
    });

    if (this.onDialog) {
      this.onDialog({
        title: this.t("interact"),
        text: text,
        choices: choices
      });
    }
  }

  // Proximity Scan & Interact helper methods

  findClosestInteractable() {
    const p = this.state.player;
    const grid = this.state.floors[this.state.currentFloor];
    let closestCell = null;
    let closestType = null;
    let minDistance = 1.6; // max interaction range (forces player to get closer, with comfortable buffer for mobile joystick/grid spacing)

    // Scan a 5x5 region around the player's grid cell
    const px = Math.floor(p.x);
    const py = Math.floor(p.y);
    
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const cx = px + dx;
        const cy = py + dy;
        
        if (cx >= 0 && cx < this.state.width && cy >= 0 && cy < this.state.height) {
          const cell = grid[cy][cx];
          
          let type = null;
          if (cell.obstacle && !cell.obstacle.resolved) type = "obstacle";
          else if (cell.chest && !cell.chest.opened) type = "chest";
          else if (cell.npc && !cell.npc.disappearing) type = "npc";
          else if (cell.puzzleClue) type = "clue";
          else if (cell.loreParchment) type = "lore";
          else if (cell.altar) type = "altar";
          
          if (type) {
            // Calculate distance to the center of the cell
            const dist = Math.hypot(p.x - (cx + 0.5), p.y - (cy + 0.5));
            if (dist < minDistance) {
              // Ensure player has a clear line of sight (not blocked by a wall)
              if (this.hasLineOfSight(p.x, p.y, cx + 0.5, cy + 0.5, grid)) {
                minDistance = dist;
                closestCell = cell;
                closestType = type;
              }
            }
          }
        }
      }
    }
    
    if (closestCell) {
      return { type: closestType, cell: closestCell };
    }
    return null;
  }

  interactWithClosest() {
    if (!this.state || this.state.gameState !== "playing") return;
    const interactable = this.findClosestInteractable();
    if (interactable) {
      if (interactable.type === "chest") this.triggerChestInteraction(interactable.cell);
      else if (interactable.type === "npc") this.triggerNPCInteraction(interactable.cell);
      else if (interactable.type === "obstacle") this.triggerObstacleInteraction(interactable.cell);
      else if (interactable.type === "clue") this.triggerClueInteraction(interactable.cell);
      else if (interactable.type === "lore") this.triggerLoreInteraction(interactable.cell);
      else if (interactable.type === "altar") this.triggerAltarInteraction(interactable.cell);
    }
  }

  // Interacting with Ancient Altars (💀)
  triggerAltarInteraction(cell) {
    this.state.gameState = "modal";
    if (this.onAltar) {
      this.onAltar({
        cell: cell,
        onUpgrade: (upgradeType) => {
          const p = this.state.player;
          const nowMs = Date.now();
          const cooldownRemaining = 30000 - (nowMs - (p.lastAltarUseTime || 0));

          if (cooldownRemaining > 0) {
            const sec = Math.ceil(cooldownRemaining / 1000);
            if (this.showToast) this.showToast(this.t("altar.coopCooldown", { sec: sec }), true);
            return false;
          }

          if (p.gold < 60) {
            if (this.showToast) this.showToast(this.t("altar.insufficientGold"), true);
            return false;
          }

          p.gold -= 60;
          p.lastAltarUseTime = nowMs;

          if (upgradeType === "A1") {
            p.flashlightRangeBonus = (p.flashlightRangeBonus || 0) + 0.40;
            if (this.showToast) this.showToast(this.lang === "tr" ? "🔦 Uzun Menzilli Odak Kazanıldı! (+%40 Menzil)" : "🔦 Long-Range Focus Granted! (+40% Reach)");
          } else if (upgradeType === "A2") {
            p.flashlightDrainRate = (p.flashlightDrainRate || 1.0) * 0.60;
            if (this.showToast) this.showToast(this.lang === "tr" ? "🔋 Güçlendirilmiş Hücre Kazanıldı! (%40 Yavaş Pil Tüketimi)" : "🔋 Reinforced Cell Granted! (40% Slower Battery Depletion)");
          } else if (upgradeType === "B1") {
            p.walkSpeedBonus = (p.walkSpeedBonus || 0) + 0.60; // +35% Walk speed boost
            if (this.showToast) this.showToast(this.lang === "tr" ? "👟 Hızlı Adımlar Kazanıldı! (+%35 Yürüme Hızı)" : "👟 Swift Stride Granted! (+35% Walk Speed)");
          } else if (upgradeType === "B2") {
            p.staminaDrainRate = (p.staminaDrainRate || 1.0) * 0.40; // 60% Slower stamina drain
            if (this.showToast) this.showToast(this.lang === "tr" ? "🫁 Derin Soluk Kazanıldı! (%60 Yavaş Stamina Tüketimi)" : "🫁 Deep Breath Granted! (60% Slower Stamina Drain)");
          }

          cell.altar.used = true;
          this.state.gameState = "playing";
          if (this.onStateChange) this.onStateChange();
          if (this.draw) this.draw();
          return true;
        },
        onClose: () => {
          this.state.gameState = "playing";
          if (this.onStateChange) this.onStateChange();
        }
      });
    }
  }

  // Interacting with Chests
  triggerChestInteraction(cell) {
    const chest = cell.chest;
    if (chest.opened) {
      this.state.gameState = "modal";
      if (this.onDialog) {
        this.onDialog({
          title: this.t("chest.rewardTitle") || "Sandık",
          text: this.lang === "tr" ? "Bu sandık zaten açılmış ve boş." : "This chest has already been opened and is empty.",
          choices: [{
            text: this.t("back"),
            action: () => {
              this.state.gameState = "playing";
              if (this.onStateChange) this.onStateChange();
            }
          }]
        });
      }
      return;
    }

    this.state.gameState = "modal";

    const executeChestOpen = () => {
      chest.opened = true;
      
      // Sync chest open in co-op
      if (this.multiplayer && this.multiplayer.isConnected) {
        let foundX = -1, foundY = -1;
        const grid = this.state.floors[this.state.currentFloor];
        for (let y = 0; y < this.state.height; y++) {
          for (let x = 0; x < this.state.width; x++) {
            if (grid[y][x].chest === chest) {
              foundX = x;
              foundY = y;
              break;
            }
          }
          if (foundX !== -1) break;
        }
        
        if (foundX !== -1) {
          this.multiplayer.send({
            type: "CHEST_OPENED",
            floor: this.state.currentFloor,
            cellX: foundX,
            cellY: foundY
          });
        }
      }
      
      let content = chest.content;

      // In peaceful mode, automatically convert traps/mimics to rewards (gold or map pieces)
      if (this.difficulty === "peaceful" && (content.type === "trap" || content.type === "mimic")) {
        const seedVal = chest.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        if (seedVal % 2 === 0) {
          content = { type: "gold", amount: 15 };
        } else {
          content = { type: "item", item: "map_piece", gold: 5 };
        }
      }

      let title = "";
      let text = "";
      let detail = null;

      if (content.type === "gold" || content.type === "item") {
        if (content.type === "gold") {
          title = this.t("chest.rewardTitle");
          text = this.t("chest.goldReward", { amount: content.amount });
          this.state.player.gold += content.amount;
        } else {
          title = this.t("chest.rewardTitle");
          const itemTrans = this.t(`items.${content.item}.name`);
          text = this.t("chest.itemReward", { item: itemTrans });
          this.state.player.inventory[content.item]++;
          if (content.item === "fuel") {
            this.state.player.fuel = Math.min(100, this.state.player.fuel + 30);
          } else if (content.item === "fuel_half") {
            this.state.player.fuel = Math.min(100, this.state.player.fuel + 15);
          }
          if (content.item === "compass") this.state.player.hasCompass = true;
          if (content.gold) this.state.player.gold += content.gold;
        }
        this.audio.playPickup();
        
        // Close chest prompt modal
        const chestModal = document.getElementById("modal-chest");
        if (chestModal) chestModal.classList.add("hidden");
        
        // Display premium toast notification
        if (this.showToast) {
          this.showToast(text);
        }
        
        // Resume active gameplay
        this.state.gameState = "playing";
        if (this.onStateChange) this.onStateChange();
        return;
      } else if (content.type === "trap" || content.type === "mimic") {
        // Trigger terrifying jumpscare overlay and rapid heartbeat sounds!
        this.audio.playJumpscare();
        this.audio.playHeartbeatRapid(6000); // 6 seconds of rapid heartbeat panic
        this.audio.playPanting(); // heavy breathing panic
        
        this.showJumpscare("chest");
        const overlay = document.getElementById("modal-jumpscare");
        if (overlay) {
          overlay.classList.remove("hidden");
          setTimeout(() => {
            overlay.classList.add("hidden");
          }, 1500);
        }
        
        let trapDamage = 25;
        if (this.difficulty === "easy") trapDamage = 10;
        else if (this.difficulty === "medium") trapDamage = 20;
        else if (this.difficulty === "hard") trapDamage = 35;
        else if (this.difficulty === "nightmare") trapDamage = 45;

        if (content.type === "trap") {
          title = this.t("chest.trapTitle");
          text = this.t("chest.trapText", { damage: trapDamage });
          detail = { type: "trap", value: trapDamage };
        } else {
          title = this.t("chest.mimicTitle");
          text = this.t("chest.mimicText", { damage: trapDamage });
          detail = { type: "mimic", value: trapDamage };
        }
      }

      if (this.onChest) {
        this.onChest({
          isOpeningPrompt: false,
          title: title,
          text: text,
          detail: detail,
          onClose: () => {
            if (detail) {
              this.damagePlayer(detail.value);
              if (this.state.player.health > 0) {
                this.state.gameState = "playing";
                if (this.onStateChange) this.onStateChange();
              }
              return;
            }
            this.state.gameState = "playing";
            if (this.onStateChange) this.onStateChange();
          },
          onWatchAd: () => {
            this.triggerAdOverlay("chest_undo", () => {
              chest.opened = false;
              this.state.gameState = "playing";
              if (this.onStateChange) this.onStateChange();
            });
          }
        });
      }
    };

    if (this.onChest) {
      this.onChest({
        isOpeningPrompt: true,
        title: this.t("interact"),
        text: this.t("chest.prompt"),
        onOpen: executeChestOpen,
        onLeave: () => {
          this.state.gameState = "playing";
          if (this.onStateChange) this.onStateChange();
        }
      });
    }
  }

  // Interacting with Puzzle Clues (Scrolls)
  triggerClueInteraction(cell) {
    this.state.gameState = "modal";
    const code = cell.puzzleClue;
    const title = this.lang === "tr" ? "Eski Bir Parşömen" : "An Ancient Parchment";
    const text = this.lang === "tr" 
      ? `Karanlık labirentin soğuk duvarlarında, eski bir kağıt parçası buldun. Üzerinde kan kırmızı renkte şunlar yazıyor:\n\n"Demir kapının ardındaki kurtuluş bu sayılara fısıldandı: ${code}\n\nUnutma, bu sayılar karanlıkta kaybolanların son çığlığıdır."`
      : `On the cold walls of the dark labyrinth, you found an old scrap of paper. Written in blood-red ink are these words:\n\n"The salvation behind the iron gate is whispered in these numbers: ${code}\n\nRemember, these numbers are the last scream of those lost in the dark."`;

    const choices = [{
      text: this.lang === "tr" ? "Parşömeni Bırak" : "Put Down Scroll",
      action: () => {
        this.state.gameState = "playing";
        if (this.onStateChange) this.onStateChange();
      }
    }];

    if (this.onDialog) {
      this.onDialog({ title, text, choices, isClue: true });
    }
  }

  // Interacting with Lore Parchments
  triggerLoreInteraction(cell) {
    this.state.gameState = "modal";
    const loreId = cell.loreParchment;
    cell.loreParchment = null; // Collect & remove parchment from floor cell so it does not re-trigger!
    if (this.draw) this.draw();
    const title = this.lang === "tr" ? "Yırtık Bir Günlük Sayfası" : "A Torn Journal Page";
    const text = this.t(`lore.${loreId}`);

    // Track read lore for achievements
    if (this.state && this.state.readLore) {
      if (!this.state.readLore.includes(loreId)) {
        this.state.readLore.push(loreId);
        let targetLoreCount = 3;
        if (this.state.numFloors === 2) targetLoreCount = 5;
        else if (this.state.numFloors === 3) targetLoreCount = 10;

        if (this.state.readLore.length >= targetLoreCount) {
          this.unlockAchievement("read_all_lore");
        }
      }
    }

    const choices = [{
      text: this.lang === "tr" ? "Parşömeni Bırak" : "Put Down Scroll",
      action: () => {
        this.state.gameState = "playing";
        if (this.onStateChange) this.onStateChange();
      }
    }];

    if (this.onDialog) {
      this.onDialog({ title, text, choices, isClue: true });
    }
  }

  showCoopDialog(title, text, isClue) {
    if (this.onDialog) {
      this.onDialog({
        title: title,
        text: text,
        isClue: isClue,
        choices: [{
          text: this.lang === "tr" ? "Kapat" : "Close",
          action: () => {
            this.state.gameState = "playing";
            if (this.onStateChange) this.onStateChange();
          }
        }],
        _isCoopReceived: true
      });
    }
  }

  closeCoopDialog() {
    const dialogModal = document.getElementById("modal-dialog");
    if (dialogModal) {
      dialogModal.classList.add("hidden");
      this.state.gameState = "playing";
      if (this.onStateChange) this.onStateChange();
    }
  }

  // Interacting with NPCs
  triggerNPCInteraction(cell) {
    this.state.gameState = "modal";
    this.keys = {};
    this.joystick = { x: 0, y: 0 };
    this.stepSoundTimer = 0;
    this.audio.stopStep();

    const npc = cell.npc;
    const p = this.state.player;
    const inv = p.inventory;

    let title = this.t(`npc.${npc.id}.name`);
    let text = this.t(`npc.${npc.id}.greeting`);
    let choices = [];

    if (npc.id === "well") {
      if (inv.bucket > 0) {
        choices.push({
          text: this.t("npc.well.drawWater"),
          action: () => {
            inv.bucket--;
            inv.bucket_full++;
            this.audio.playWaterFill();
            this.state.gameState = "playing";
            if (this.onStateChange) this.onStateChange();
          }
        });
      } else if (inv.bucket_full > 0) {
        text = this.t("npc.well.alreadyFull");
      } else {
        text = this.t("npc.well.noBucket");
      }
    } else if (npc.id === "child") {
      if (this.state.quests.childState === "solved") {
        text = this.t("npc.child.thanks");
      } else if (inv.bucket_full > 0) {
        text = this.t("npc.child.hasWater");
        choices.push({
          text: this.t("npc.child.giveWater"),
          action: () => {
            // Quest reward processing
            inv.bucket_full--;
            inv.bucket++;
            inv.fuel_half = (inv.fuel_half || 0) + 1; // Add 1 half-used battery to inventory
            this.state.quests.childState = "solved";
            this.audio.playPickup();
            if (this.onStateChange) this.onStateChange();

            // Screen 1: Thanks & Reward Description
            this.onDialog({
              title: this.t("npc.child.name"),
              text: this.t("npc.child.thanks"),
              choices: [{
                text: this.lang === "tr" ? "Dinle..." : "Listen...",
                action: () => {
                  // Screen 2: Final mysterious lore quote
                  this.onDialog({
                    title: this.t("npc.child.name"),
                    text: this.t("npc.child.finalQuote"),
                    choices: [{
                      text: this.t("npc.traveler.farewell") || "Sohbeti Bitir",
                      action: () => {
                        // Ghost fade away trigger
                        npc.disappearing = true;
                        npc.disappearStartTime = Date.now();
                        this.audio.playGhostFade();
                        this.state.gameState = "playing";
                        if (this.onStateChange) this.onStateChange();
                      }
                    }]
                  });
                }
              }]
            });
          }
        });
      } else {
        text = this.t("npc.child.noWater");
      }
    } else if (npc.id === "mouse") {
      if (this.state.quests.mouseState === "solved") {
        text = this.t("npc.mouse.thanks");
      } else if (inv.cheese > 0) {
        text = this.t("npc.mouse.hasCheese");
        choices.push({
          text: this.t("npc.mouse.giveCheese"),
          action: () => {
            // Quest reward processing
            inv.cheese--;
            this.state.quests.mouseState = "solved";

            // Screen 1: Thanks & Short-cut path hint
            this.onDialog({
              title: this.t("npc.mouse.name"),
              text: this.t("npc.mouse.thanks"),
              choices: [{
                text: this.lang === "tr" ? "Bekle..." : "Wait...",
                action: () => {
                  // Screen 2: Final mysterious loop lore quote
                  this.onDialog({
                    title: this.t("npc.mouse.name"),
                    text: this.t("npc.mouse.finalQuote"),
                    choices: [{
                      text: this.t("npc.traveler.farewell") || "Sohbeti Bitir",
                      action: () => {
                        // Runaway animation and path carving
                        if (cell.npc) {
                          cell.npc.disappearing = true;
                          cell.npc.disappearStartTime = Date.now();
                        }

                        // Clear adjacent wall nodes (mouse eats path)
                        const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
                        dirs.forEach(([dx, dy]) => {
                          const nx = cell.x + dx;
                          const ny = cell.y + dy;
                          if (nx >= 0 && nx < this.state.width && ny >= 0 && ny < this.state.height) {
                            const n = this.state.floors[this.state.currentFloor][ny][nx];
                            if (n && n.type === "wall") {
                              n.type = "floor";
                              n.region = cell.region;
                            }
                          }
                        });

                        if (this.renderer) {
                          this.renderer.rebuildScene(this.state);
                        }

                        this.audio.playUnlock();
                        this.state.gameState = "playing";
                        if (this.onStateChange) this.onStateChange();

                        // Completely remove mouse after walking finishes (3 seconds)
                        setTimeout(() => {
                          if (cell.npc && cell.npc.id === "mouse") {
                            cell.npc = null;
                            if (this.onStateChange) this.onStateChange();
                          }
                        }, 3000);
                      }
                    }]
                  });
                }
              }]
            });
          }
        });
      } else {
        text = this.t("npc.mouse.noCheese");
      }
    } else if (npc.id === "traveler") {
      title = this.t("npc.traveler.name");
      const travelerTrans = (translations[this.lang]?.npc?.traveler) || (translations["en"]?.npc?.traveler);
      const stages = travelerTrans?.stages || {};

      if (!npc.dialogueStage) {
        npc.dialogueStage = "start";
      }

      text = npc.currentText || travelerTrans.greeting;

      if (npc.dialogueStage === "start") {
        choices.push({
          text: stages.start?.q1 || "Ben kimim? Sen kimsin?",
          action: () => {
            npc.currentText = stages.start?.a1;
            npc.dialogueStage = "who_are_you";
            this.triggerNPCInteraction(cell);
          }
        });
        choices.push({
          text: stages.start?.q2 || "Buradan nasıl kaçarım?",
          action: () => {
            npc.currentText = stages.start?.a2;
            npc.dialogueStage = "how_to_escape";
            this.triggerNPCInteraction(cell);
          }
        });
      } else if (npc.dialogueStage === "who_are_you") {
        choices.push({
          text: stages.who_are_you?.q1 || "Bu labirent nasıl yaratıldı?",
          action: () => {
            npc.currentText = stages.who_are_you?.a1;
            npc.dialogueStage = "sub";
            this.triggerNPCInteraction(cell);
          }
        });
        choices.push({
          text: stages.who_are_you?.q2 || "Karanlıktaki o mahluk nereden geldi?",
          action: () => {
            npc.currentText = stages.who_are_you?.a2;
            npc.dialogueStage = "sub";
            this.triggerNPCInteraction(cell);
          }
        });
        choices.push({
          text: stages.who_are_you?.back || "Geri Dön",
          action: () => {
            npc.currentText = travelerTrans.greeting;
            npc.dialogueStage = "start";
            this.triggerNPCInteraction(cell);
          }
        });
      } else if (npc.dialogueStage === "how_to_escape") {
        choices.push({
          text: stages.how_to_escape?.q1 || "Alt katlarda bizi ne bekliyor?",
          action: () => {
            npc.currentText = stages.how_to_escape?.a1;
            npc.dialogueStage = "sub";
            this.triggerNPCInteraction(cell);
          }
        });
        choices.push({
          text: stages.how_to_escape?.back || "Geri Dön",
          action: () => {
            npc.currentText = travelerTrans.greeting;
            npc.dialogueStage = "start";
            this.triggerNPCInteraction(cell);
          }
        });
      } else if (npc.dialogueStage === "sub") {
        choices.push({
          text: stages.sub?.back || "Geri Dön",
          action: () => {
            npc.currentText = travelerTrans.greeting;
            npc.dialogueStage = "start";
            this.triggerNPCInteraction(cell);
          }
        });
      }

      choices.push({
        text: travelerTrans.farewell || "Sohbeti Bitir",
        action: () => {
          this.state.gameState = "playing";
          npc.hasSpoken = true;
          npc.dialogueClosedTime = Date.now();
          npc.dialogueStage = "start"; // Reset for next interaction
          npc.currentText = null;
          if (this.onStateChange) this.onStateChange();
        }
      });
    } else if (npc.id === "merchant") {
      const stock = this.state.merchantStock;
      Object.entries(stock).forEach(([itemId, info]) => {
        if (info.count > 0) {
          choices.push({
            text: this.t("npc.merchant.buy", { item: this.t(`items.${itemId}.name`), cost: info.cost }),
            action: () => {
              if (p.gold >= info.cost) {
                p.gold -= info.cost;
                inv[itemId]++;
                info.count--;
                this.audio.playPickup();
                if (this.onStateChange) this.onStateChange();
                this.triggerNPCInteraction(cell);
              } else {
                if (this.showToast) this.showToast(this.t("npc.merchant.noGold"));
                this.state.gameState = "playing";
              }
            }
          });
        }
      });
    }

    choices.push({
      text: this.t("close"),
      action: () => {
        this.state.gameState = "playing";
        try {
          if (npc && npc.id === "traveler") {
            npc.hasSpoken = true;
            npc.dialogueClosedTime = Date.now();
          }
          if (npc && npc.id === "merchant" && this.state.merchantStock) {
            const stock = this.state.merchantStock;
            const allSold = Object.keys(stock).length > 0 && Object.keys(stock).every(k => {
              const item = stock[k];
              return item && typeof item.count === "number" && item.count <= 0;
            });
            if (allSold) {
              npc.disappearing = true;
              npc.disappearStartTime = Date.now();
              this.audio.playGhostFade();
            }
          }
        } catch(e) { /* safe close */ }
        if (this.onStateChange) this.onStateChange();
      }
    });

    if (this.onDialog) {
      this.onDialog({ title, text, choices });
    }
  }

  // Interacting with Random Events
  triggerRandomEvent() {
    this.state.gameState = "modal";
    this.state.stepsTaken = 0;
    this.state.nextEventSteps = 1500 + Math.floor(Math.random() * 1000); // Rare random events for peaceful exploration

    const ev = this.state.levelEvents[Math.floor(Math.random() * this.state.levelEvents.length)];
    const p = this.state.player;

    const title = "⚠️ Olay / Event";
    const text = ev.text[this.lang];
    const choices = [];

    ev.choices.forEach(c => {
      if (c.requirement && !c.requirement(p)) return;

      choices.push({
        text: c.text[this.lang],
        action: () => {
          c.effect(p);
          this.showEventResolution(c.outcomeText[this.lang]);
        }
      });
    });

    if (this.onEvent) {
      this.onEvent({ text, choices });
    }
  }

  showEventResolution(resText) {
    if (this.onEvent) {
      this.onEvent({
        text: resText,
        choices: [{
          text: this.t("confirm"),
          action: () => {
            if (!this.state || !this.state.player) return;
            if (this.state.player.health <= 0) {
              this.triggerDeathChoice();
            } else {
              this.state.gameState = "playing";
              if (this.onStateChange) this.onStateChange();
            }
          }
        }]
      });
    }
  }

  // Use items
  useInventoryItem(itemId) {
    if (!this.state || !this.state.player) return;
    if (this.state.gameState !== "playing" && this.state.gameState !== "modal") return;
    const p = this.state.player;
    if (p.inventory[itemId] <= 0) return;

    if (itemId === "fuel") {
      p.inventory.fuel--;
      p.fuel = Math.min(100, p.fuel + 30);
      this.audio.playPickup();
      if (this.onStateChange) this.onStateChange();
    } else if (itemId === "fuel_half") {
      p.inventory.fuel_half--;
      p.fuel = Math.min(100, p.fuel + 15); // Restores 15% (half battery)
      this.audio.playPickup();
      if (this.onStateChange) this.onStateChange();
    } else if (itemId === "map_piece") {
      this.state.mapRevealMode = true;
      
      // Close inventory modal
      const invModal = document.getElementById("modal-inventory");
      if (invModal) invModal.classList.add("hidden");
      
      // Open map modal
      const mapModal = document.getElementById("modal-map");
      if (mapModal) {
        mapModal.classList.remove("hidden");
        this.state.gameState = "modal";
        
        // Setup visual instructions overlay
        const instructions = document.getElementById("map-instructions");
        if (instructions) {
          instructions.style.display = "block";
          instructions.textContent = this.lang === "tr" 
            ? "Haritada açmak istediğiniz 5x5'lik alana tıklayın!" 
            : "Click on the map to reveal a 5x5 area!";
        }
      }
      
      if (this.onStateChange) this.onStateChange();
    } else if (itemId === "compass") {
      const dx = this.state.exitCell.x - p.x;
      const dy = this.state.exitCell.y - p.y;
      
      let vert = dy > 0 ? "south" : "north";
      let horiz = dx > 0 ? "east" : "west";
      if (Math.abs(dy) < 2) vert = "";
      if (Math.abs(dx) < 2) horiz = "";
      
      const dirTrans = (vert && horiz) 
        ? `${this.t("directionNames." + vert)}-${this.t("directionNames." + horiz)}` 
        : this.t("directionNames." + (vert || horiz || "south"));
        
      if (this.showToast) this.showToast(`${this.t("compassActive")} (${dirTrans})`);
      this.audio.playUnlock();
    }
  }

  revealMapAt(canvasX, canvasY, canvasWidth, canvasHeight) {
    const s = this.state;
    if (!s || !s.mapRevealMode) return;
    
    // Check if player actually has a map piece
    const p = this.state.player;
    if (!p || !p.inventory || (p.inventory.map_piece || 0) <= 0) {
      s.mapRevealMode = false;
      const instructions = document.getElementById("map-instructions");
      if (instructions) instructions.style.display = "none";
      return;
    }
    
    // Calculate cell coordinates based on the layout logic in drawMap()
    const cellSize = Math.min(canvasWidth / s.width, canvasHeight / s.height);
    const offsetX = (canvasWidth - s.width * cellSize) / 2;
    const offsetY = (canvasHeight - s.height * cellSize) / 2;
    
    const clickX = canvasX - offsetX;
    const clickY = canvasY - offsetY;
    
    const cellX = Math.floor(clickX / cellSize);
    const cellY = Math.floor(clickY / cellSize);
    
    // Validate cell bounds
    if (cellX >= 0 && cellX < s.width && cellY >= 0 && cellY < s.height) {
      // Reveal 5x5 area around clicked cell
      const radius = 2;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = cellX + dx;
          const ny = cellY + dy;
          if (nx >= 0 && nx < s.width && ny >= 0 && ny < s.height) {
            s.visitedMap[s.currentFloor][ny][nx] = true;
          }
        }
      }
      
      // Consume the map piece
      p.inventory.map_piece--;
      s.mapRevealMode = false;
      
      // Play pickup sound as chime
      this.audio.playPickup();
      
      // Hide visual instructions
      const instructions = document.getElementById("map-instructions");
      if (instructions) instructions.style.display = "none";
      
      if (this.onStateChange) this.onStateChange();
    }
  }

  hasLineOfSight(x1, y1, x2, y2, grid, width = this.state.width, height = this.state.height) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    if (dist <= 0.1) return true;
    
    const steps = Math.ceil(dist * 4); // check 4 points per block unit
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const tx = x1 + dx * t;
      const ty = y1 + dy * t;
      const gx = Math.floor(tx);
      const gy = Math.floor(ty);
      if (gx >= 0 && gx < width && gy >= 0 && gy < height) {
        if (grid[gy][gx].type === "wall") {
          return false;
        }
      }
    }
    return true;
  }

  findPathToPlayer(smX, smY, pX, pY, grid, width, height) {
    const startX = Math.floor(smX);
    const startY = Math.floor(smY);
    const targetX = Math.floor(pX);
    const targetY = Math.floor(pY);
    
    if (startX === targetX && startY === targetY) {
      return null;
    }
    
    const size = width * height;
    const queue = [startX + startY * width];
    let qHead = 0;
    const visited = new Uint8Array(size);
    const parent = new Int32Array(size).fill(-1);
    
    const startIdx = startX + startY * width;
    visited[startIdx] = 1;
    
    let found = false;
    const targetIdx = targetX + targetY * width;

    const dirOffsets = [width, -width, 1, -1];
    const dxs = [0, 0, 1, -1];
    const dys = [1, -1, 0, 0];
    
    while (qHead < queue.length && qHead < 120) {
      const currIdx = queue[qHead++];
      if (currIdx === targetIdx) {
        found = true;
        break;
      }
      
      const cx = currIdx % width;
      const cy = Math.floor(currIdx / width);
      
      for (let i = 0; i < 4; i++) {
        const nx = cx + dxs[i];
        const ny = cy + dys[i];
        
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nextIdx = currIdx + dirOffsets[i];
          const cell = grid[ny][nx];
          const isBlocked = cell.type === "wall" || (cell.obstacle && !cell.obstacle.resolved);
          if (!visited[nextIdx] && !isBlocked) {
            visited[nextIdx] = 1;
            parent[nextIdx] = currIdx;
            queue.push(nextIdx);
          }
        }
      }
    }
    
    if (!found) return null;
    
    let curr = targetIdx;
    let nextStepIdx = -1;
    while (curr !== -1) {
      const prev = parent[curr];
      if (prev === startIdx) {
        nextStepIdx = curr;
        break;
      }
      curr = prev;
    }
    
    if (nextStepIdx !== -1) {
      const nx = nextStepIdx % width;
      const ny = Math.floor(nextStepIdx / width);
      return { x: nx + 0.5, y: ny + 0.5 };
    }
    
    return null;
  }

  updateShadowMonster(dt) {
    const s = this.state;
    if (!s || !s.shadowMonsters || s.shadowMonsters.length === 0) return;
    
    const p = s.player;
    if (!p) return;

    const isCoop = this.multiplayer && this.multiplayer.isConnected;
    const isHost = isCoop && this.multiplayer.isHost;

    s.shadowMonsters.forEach((sm, index) => {
      // In Co-op, Guest does NOT run independent monster AI physics. Guest reports flashlight burn and checks local jumpscare!
      if (isCoop && !isHost) {
        if (sm.active && Number(sm.floor) === Number(s.currentFloor)) {
          // A. Report Flashlight Burn to Host
          if (p.lanternOn && !p.isDead) {
            const dist = Math.hypot(sm.x - p.x, sm.y - p.y);
            if (dist <= 6.5) {
              const lookX = Math.cos(p.angle);
              const lookY = Math.sin(p.angle);
              const dirX = (sm.x - p.x) / dist;
              const dirY = (sm.y - p.y) / dist;
              const dot = lookX * dirX + lookY * dirY;
              if (dot > 0.866) {
                const grid = s.floors[s.currentFloor];
                if (this.hasLineOfSight(p.x, p.y, sm.x, sm.y, grid, s.width, s.height)) {
                  this.multiplayer.send({
                    type: "GUEST_MONSTER_BURN",
                    index: index,
                    dt: dt
                  });
                }
              }
            }
          }
          // B. Check local jumpscare collision on Guest side (ONLY if monster is NOT burning/fleeing!)
          if (sm.burnTime === 0 && p.health > 0 && !p.isDead) {
            const localDist = Math.hypot(sm.x - p.x, sm.y - p.y);
            const grid = s.floors[s.currentFloor];
            if (localDist < 0.42 && grid && this.hasLineOfSight(p.x, p.y, sm.x, sm.y, grid, s.width, s.height)) {
              this.triggerJumpscare();
            }
          }
        }
        return;
      }

      // Spawner logic (Host or Singleplayer)
      if (!sm.active) {
        
        sm.spawnTimer -= dt;
        if (sm.spawnTimer <= 0) {
          // Define difficulty-based spawn rates
          let minSpawn = 30.0;
          let maxSpawn = 45.0;
          if (this.difficulty === "easy") { minSpawn = 50.0; maxSpawn = 70.0; }
          else if (this.difficulty === "hard") { minSpawn = 15.0; maxSpawn = 25.0; }
          else if (this.difficulty === "nightmare") { minSpawn = 10.0; maxSpawn = 20.0; }
          
          sm.spawnTimer = minSpawn + Math.random() * (maxSpawn - minSpawn);

          // In co-op, pick focus position from alive players (50/50 chance between Player 1 & Player 2 if both alive)
          let focusX = p.x;
          let focusY = p.y;
          if (isCoop && s.otherPlayer && !s.otherPlayer.isDead) {
            const p1Alive = p && !p.isDead;
            if (!p1Alive || Math.random() < 0.5) {
              focusX = s.otherPlayer.x;
              focusY = s.otherPlayer.y;
            }
          }

          const pCellX = Math.floor(focusX);
          const pCellY = Math.floor(focusY);
          const grid = s.floors[s.currentFloor];

          // Collect all candidate path cells within range (but NOT inside the 8x8 region around the player!)
          let candidates = [];
          for (let dy = -15; dy <= 15; dy++) {
            for (let dx = -15; dx <= 15; dx++) {
              if (Math.abs(dx) < 6 && Math.abs(dy) < 6) continue;

              const cx = pCellX + dx;
              const cy = pCellY + dy;
              if (cx >= 0 && cx < s.width && cy >= 0 && cy < s.height) {
                const dist = Math.hypot(dx, dy);
                if (dist >= 8.0 && dist <= 15.0) {
                  const cell = grid[cy][cx];
                  if (cell && cell.type !== "wall" && !cell.isExit && !cell.npc) {
                    candidates.push({ x: cx, y: cy, dist });
                  }
                }
              }
            }
          }

          if (candidates.length === 0) {
            for (let dy = -10; dy <= 10; dy++) {
              for (let dx = -10; dx <= 10; dx++) {
                if (Math.abs(dx) < 3 && Math.abs(dy) < 3) continue;

                const cx = pCellX + dx;
                const cy = pCellY + dy;
                if (cx >= 0 && cx < s.width && cy >= 0 && cy < s.height) {
                  const dist = Math.hypot(dx, dy);
                  if (dist >= 5.0 && dist <= 9.0) {
                    const cell = grid[cy][cx];
                    if (cell && cell.type !== "wall" && !cell.isExit && !cell.npc) {
                      candidates.push({ x: cx, y: cy, dist });
                    }
                  }
                }
              }
            }
          }

          if (candidates.length > 0) {
            const pick = candidates[Math.floor(Math.random() * candidates.length)];
            sm.active = true;
            sm.x = pick.x + 0.5;
            sm.y = pick.y + 0.5;
            sm.floor = s.currentFloor;
            sm.burnTime = 0;
            
            let baseSpeed = 1.55;
            if (this.difficulty === "easy") baseSpeed = 1.15;
            else if (this.difficulty === "hard") baseSpeed = 1.85;
            else if (this.difficulty === "nightmare") baseSpeed = 1.95;
            
            sm.speed = baseSpeed * (0.95 + Math.random() * 0.1);
            sm.soundTimer = 0.5; // Play sound immediately after spawn
            this.audio.playShadowSpawn();
            this.broadcastAudioEvent("shadow_spawn");
            
            // Choose target player in co-op (must target living player!)
            if (isCoop) {
              const p1Alive = p && !p.isDead;
              const p2Alive = s.otherPlayer && !s.otherPlayer.isDead;
              
              if (p1Alive && p2Alive) {
                const distHost = Math.hypot(sm.x - p.x, sm.y - p.y);
                const distGuest = Math.hypot(sm.x - s.otherPlayer.x, sm.y - s.otherPlayer.y);
                sm.targetPlayer = (distGuest < distHost) ? "Player2" : "Player1";
              } else if (p2Alive) {
                sm.targetPlayer = "Player2";
              } else {
                sm.targetPlayer = "Player1";
              }
              
              // Broadcast spawn and target alert
              this.multiplayer.send({
                type: "MONSTER_SYNC",
                index: index,
                active: true,
                x: sm.x,
                y: sm.y,
                floor: sm.floor,
                targetPlayer: sm.targetPlayer,
                spawnTimer: sm.spawnTimer,
                speed: sm.speed,
                burnTime: sm.burnTime
              });
              
              this.multiplayer.send({
                type: "MONSTER_SPAWN_ALERT",
                targetPlayer: sm.targetPlayer,
                monsterIndex: index
              });
              
              this.triggerMonsterSpawnAlert(sm.targetPlayer, index);
            }
          }
        }
        return;
      }

      // If active but player changed floors, auto-despawn
      if (sm.floor !== s.currentFloor) {
        sm.active = false;
        sm.spawnTimer = 10.0;
        return;
      }

      const dist = Math.hypot(sm.x - p.x, sm.y - p.y);

      // Play periodic ambient groan sound relative to distance
      if (sm.soundTimer !== undefined) {
        sm.soundTimer -= dt;
        if (sm.soundTimer <= 0) {
          sm.soundTimer = 3.5 + Math.random() * 2.0;
          this.audio.playShadowGroan(dist);
          this.broadcastAudioEvent("shadow_groan", { dist: Math.round(dist * 10) / 10 });
        }
      }

      // Guest client: skip movement and burn calculations, just update positions based on Host sync
      if (isCoop && !isHost) {
        // Run local jumpscare check using Host-synced monster coordinates
        const grid = s.floors[s.currentFloor];
        if (p.health > 0 && !p.isDead) {
          const localDist = Math.hypot(sm.x - p.x, sm.y - p.y);
          if (localDist < 0.65 && this.hasLineOfSight(p.x, p.y, sm.x, sm.y, grid, s.width, s.height)) {
            this.triggerJumpscare();
          }
        }
        return; // End loop item for Guest
      }

      // Host/Singleplayer client: run full pathfinding, movement, fleeing, and collision checks
      // Check if player's flashlight is shining on this shadow monster
      let isBurned = false;
      if (s.lanternOn && p.fuel > 0 && p.health > 0 && !p.isDead) {
        const maxBurnDist = 8.0 * (1 + (p.flashlightRangeBonus || 0));
        if (dist < maxBurnDist) {
          const lookX = Math.cos(p.angle);
          const lookY = Math.sin(p.angle);
          const dirX = (sm.x - p.x) / dist;
          const dirY = (sm.y - p.y) / dist;

          const dot = lookX * dirX + lookY * dirY;
          if (dot > 0.866) {
            const grid = s.floors[s.currentFloor];
            if (this.hasLineOfSight(p.x, p.y, sm.x, sm.y, grid, s.width, s.height)) {
              isBurned = true;
            }
          }
        }
      }
      
      // Friend's flashlight can also burn it in co-op!
      if (isCoop && s.otherPlayer && s.otherPlayer.lanternOn && !s.otherPlayer.isDead) {
        const dist2 = Math.hypot(sm.x - s.otherPlayer.x, sm.y - s.otherPlayer.y);
        if (dist2 < 8.0) {
          const lookX = Math.cos(s.otherPlayer.angle);
          const lookY = Math.sin(s.otherPlayer.angle);
          const dirX = (sm.x - s.otherPlayer.x) / dist2;
          const dirY = (sm.y - s.otherPlayer.y) / dist2;
          const dot = lookX * dirX + lookY * dirY;
          if (dot > 0.866) {
            const grid = s.floors[s.currentFloor];
            if (this.hasLineOfSight(s.otherPlayer.x, s.otherPlayer.y, sm.x, sm.y, grid, s.width, s.height)) {
              isBurned = true;
            }
          }
        }
      }

      if (isBurned) {
        sm.burnTime += dt;
        if (!this.lastBurnSoundTime || Date.now() - this.lastBurnSoundTime > 300) {
          this.audio.playShadowBurn();
          this.broadcastAudioEvent("shadow_burn");
          this.lastBurnSoundTime = Date.now();
        }

        if (sm.burnTime >= 0.85) {
          sm.active = false;
          
          let minRespawn = 30.0;
          let maxRespawn = 45.0;
          if (this.difficulty === "easy") { minRespawn = 50.0; maxRespawn = 70.0; }
          else if (this.difficulty === "hard") { minRespawn = 15.0; maxRespawn = 25.0; }
          else if (this.difficulty === "nightmare") { minRespawn = 12.0; maxRespawn = 20.0; }
          
          sm.spawnTimer = minRespawn + Math.random() * (maxRespawn - minRespawn);
          this.audio.playShadowBurn();
          if (this.difficulty !== "easy") {
            this.unlockAchievement("burn_monster");
          }
          if (isCoop) {
            // Broadcast despawn
            this.multiplayer.send({
              type: "MONSTER_SYNC",
              index: index,
              active: false,
              x: sm.x,
              y: sm.y,
              floor: sm.floor,
              targetPlayer: "",
              spawnTimer: sm.spawnTimer,
              speed: sm.speed,
              burnTime: 0
            });
          }
          if (this.onStateChange) this.onStateChange();
          return;
        }
      } else {
        sm.burnTime = Math.max(0, sm.burnTime - dt * 2.0);
      }

      const grid = s.floors[s.currentFloor];

      if (sm.burnTime > 0) {
        // Flee away from the closest player who is burning it
        let fTarget = p;
        if (isCoop && s.otherPlayer && s.otherPlayer.lanternOn && !s.otherPlayer.isDead) {
          const dist1 = Math.hypot(sm.x - p.x, sm.y - p.y);
          const dist2 = Math.hypot(sm.x - s.otherPlayer.x, sm.y - s.otherPlayer.y);
          if (dist2 < dist1) fTarget = s.otherPlayer;
        }
        
        let runX = sm.x - fTarget.x;
        let runY = sm.y - fTarget.y;
        const len = Math.hypot(runX, runY);
        if (len > 0.001) {
          runX = (runX / len) * sm.speed * 1.35 * dt;
          runY = (runY / len) * sm.speed * 1.35 * dt;
        }

        let nextX = sm.x + runX;
        let nextY = sm.y + runY;

        const canMonsterMoveTo = (tx, ty, radius = 0.25) => {
          const minGx = Math.floor(tx - radius);
          const maxGx = Math.floor(tx + radius);
          const minGy = Math.floor(ty - radius);
          const maxGy = Math.floor(ty + radius);
          if (minGx < 0 || maxGx >= s.width || minGy < 0 || maxGy >= s.height) return false;
          for (let gy = minGy; gy <= maxGy; gy++) {
            for (let gx = minGx; gx <= maxGx; gx++) {
              const cell = grid[gy] ? grid[gy][gx] : null;
              if (!cell || cell.type === "wall" || cell.obstacle) return false;
            }
          }
          return true;
        };

        if (canMonsterMoveTo(nextX, sm.y)) sm.x = nextX;
        if (canMonsterMoveTo(sm.x, nextY)) sm.y = nextY;
      } else {
        // Chase player: automatically switch target to surviving alive player if target died!
        let targetObj = p;
        if (isCoop) {
          const p1Alive = p && !p.isDead;
          const p2Alive = s.otherPlayer && !s.otherPlayer.isDead;
          
          if (!p1Alive && p2Alive) {
            sm.targetPlayer = "Player2";
            targetObj = s.otherPlayer;
          } else if (!p2Alive && p1Alive) {
            sm.targetPlayer = "Player1";
            targetObj = p;
          } else if (sm.targetPlayer === "Player2" && s.otherPlayer) {
            targetObj = s.otherPlayer;
          }
        }
        let targetX = targetObj.x;
        let targetY = targetObj.y;

        sm.pathRecalcTimer = (sm.pathRecalcTimer || 0) - dt;
        if (sm.pathRecalcTimer <= 0 || !sm.lastNextStep) {
          sm.pathRecalcTimer = 0.20;
          sm.lastNextStep = this.findPathToPlayer(sm.x, sm.y, targetX, targetY, grid, s.width, s.height);
        }

        const canMonsterMoveTo = (tx, ty, radius = 0.25) => {
          const minGx = Math.floor(tx - radius);
          const maxGx = Math.floor(tx + radius);
          const minGy = Math.floor(ty - radius);
          const maxGy = Math.floor(ty + radius);
          if (minGx < 0 || maxGx >= s.width || minGy < 0 || maxGy >= s.height) return false;
          for (let gy = minGy; gy <= maxGy; gy++) {
            for (let gx = minGx; gx <= maxGx; gx++) {
              const cell = grid[gy] ? grid[gy][gx] : null;
              if (!cell || cell.type === "wall" || cell.obstacle) return false;
            }
          }
          return true;
        };

        const nextStep = sm.lastNextStep;
        let stepX = 0;
        let stepY = 0;
        if (nextStep) {
          let chaseX = nextStep.x - sm.x;
          let chaseY = nextStep.y - sm.y;
          const len = Math.hypot(chaseX, chaseY);
          if (len > 0.001) {
            stepX = (chaseX / len) * sm.speed * dt;
            stepY = (chaseY / len) * sm.speed * dt;
          }
        } else {
          let chaseX = targetX - sm.x;
          let chaseY = targetY - sm.y;
          const len = Math.hypot(chaseX, chaseY);
          if (len > 0.001) {
            stepX = (chaseX / len) * sm.speed * dt;
            stepY = (chaseY / len) * sm.speed * dt;
          }
        }

        if (canMonsterMoveTo(sm.x + stepX, sm.y)) {
          sm.x += stepX;
        }
        if (canMonsterMoveTo(sm.x, sm.y + stepY)) {
          sm.y += stepY;
        }
      }

      // Sync position updates from Host periodically using a time-based threshold (65ms ~ 15Hz)
      if (isCoop) {
        const nowMs = Date.now();
        if (!sm.lastSyncTime || nowMs - sm.lastSyncTime > 65) {
          sm.lastSyncTime = nowMs;
          this.multiplayer.send({
            type: "MONSTER_SYNC",
            index: index,
            active: sm.active,
            x: sm.x,
            y: sm.y,
            floor: sm.floor,
            targetPlayer: sm.targetPlayer,
            spawnTimer: sm.spawnTimer,
            speed: sm.speed,
            burnTime: sm.burnTime
          });
        }
      }

      // Check Jumpscare range — A burning/fleeing monster CANNOT deal damage or trigger jumpscare!
      if (sm.active && sm.burnTime === 0) {
        // A. Check Host local player collision
        if (p.health > 0 && !p.isDead) {
          const localDist = Math.hypot(sm.x - p.x, sm.y - p.y);
          if (localDist < 0.42 && this.hasLineOfSight(p.x, p.y, sm.x, sm.y, grid, s.width, s.height)) {
            this.triggerJumpscare();
            
            if (isCoop) {
              sm.active = false;
              sm.spawnTimer = 15.0 + Math.random() * 10.0;
              this.multiplayer.send({
                type: "MONSTER_SYNC",
                index: index,
                active: false,
                x: sm.x,
                y: sm.y,
                floor: sm.floor,
                targetPlayer: "",
                spawnTimer: sm.spawnTimer,
                speed: sm.speed,
                burnTime: 0
              });
            }
          }
        }

        // B. Check Guest player collision on Host side
        if (isCoop && s.otherPlayer && !s.otherPlayer.isDead && Number(s.otherPlayer.floor) === Number(sm.floor)) {
          const guestDist = Math.hypot(sm.x - s.otherPlayer.x, sm.y - s.otherPlayer.y);
          if (guestDist < 0.42 && this.hasLineOfSight(s.otherPlayer.x, s.otherPlayer.y, sm.x, sm.y, grid, s.width, s.height)) {
            sm.active = false;
            sm.spawnTimer = 15.0 + Math.random() * 10.0;
            this.multiplayer.send({
              type: "JUMPSCARE"
            });
            this.multiplayer.send({
              type: "MONSTER_SYNC",
              index: index,
              active: false,
              x: sm.x,
              y: sm.y,
              floor: sm.floor,
              targetPlayer: "",
              spawnTimer: sm.spawnTimer,
              speed: sm.speed,
              burnTime: 0
            });
          }
        }
      }
    });
  }

  triggerJumpscare() {
    const s = this.state;
    if (!s || s.gameState !== "playing") return;
    
    s.gameState = "modal";
    if (s.shadowMonsters && s.shadowMonsters.length > 0) {
      s.shadowMonsters.forEach((sm) => {
        sm.active = false;
        sm.spawnTimer = 15.0 + Math.random() * 10.0;
      });
    }
    
    this.audio.playJumpscare();
    
    const isCoop = this.multiplayer && this.multiplayer.isConnected;
    if (isCoop) {
      this.multiplayer.send({ type: "JUMPSCARE" });
    }

    this.showJumpscare("normal");
    const overlay = document.getElementById("modal-jumpscare");
    if (overlay) {
      overlay.classList.remove("hidden");
      
      setTimeout(() => {
        overlay.classList.add("hidden");
        
        const p = s.player;
        p.health = 0; // Instant death when caught by the shadow monster
        s.tookMonsterDamage = true;
        
        const isCoop = this.multiplayer && this.multiplayer.isConnected;
        if (isCoop) {
          p.isDead = true;
          this.multiplayer.send({
            type: "PLAYER_POS",
            x: p.x,
            y: p.y,
            floor: this.state.currentFloor,
            angle: p.angle,
            pitch: p.pitch,
            lanternOn: this.state.lanternOn,
            health: 0,
            isDead: true
          });
          
          if (s.otherPlayer && s.otherPlayer.isDead) {
            this.triggerGameOver();
          } else {
            this.showToast(this.lang === "tr" ? "Canavar seni yakaladı! Arkadaşın seni diriltene kadar onu izliyorsun." : "Monster caught you! Spectating your friend until you are revived.");
            s.gameState = "playing";
          }
          if (this.onStateChange) this.onStateChange();
        } else {
          this.triggerDeathChoice();
        }
        
        if (this.onStateChange) this.onStateChange();
      }, 1500);
    } else {
      s.gameState = "playing";
    }
  }

  showJumpscareForSpectator() {
    this.audio.playJumpscare();
    this.showJumpscare("normal");
    const overlay = document.getElementById("modal-jumpscare");
    if (overlay) {
      overlay.classList.remove("hidden");
      setTimeout(() => {
        overlay.classList.add("hidden");
      }, 1500);
    }
  }

  showCoopRopeDescendToast() {
    const msg = this.lang === "tr"
      ? "Arkadaşın alt kata indi! Arkadaşının sana halat bulup getirmesini bekle veya tüccardan halat satın al."
      : "Your friend descended to the lower floor! Wait for your friend to bring you a rope or buy one from the Merchant.";
    this.showToast(msg);
  }

  // Interfacing with Death Choice Modals
  triggerDeathChoice() {
    this.state.gameState = "modal";
    this.audio.playHazard();

    const deathEv = deathEvents[Math.floor(Math.random() * deathEvents.length)];
    const p = this.state.player;

    const title = "💀 Ölümün Eşiği / The Brink of Death";
    const text = deathEv.text[this.lang];
    const choices = [];

    deathEv.choices.forEach(c => {
      choices.push({
        text: c.text[this.lang],
        action: () => {
          if (c.isAdRevive) {
            this.revivePlayer();
          } else {
            c.effect(p);
            if (p.health > 0) {
              this.state.gameState = "playing";
              this.revealArea(Math.floor(p.x), Math.floor(p.y));
              if (this.onStateChange) this.onStateChange();
              if (this.showToast) this.showToast(c.outcomeText[this.lang]);
            } else {
              this.triggerGameOver();
            }
          }
        }
      });
    });

    if (this.onDialog) {
      this.onDialog({ title, text, choices });
    }
  }

  triggerAdOverlay(rewardType, onRewardGranted) {
    this.state.gameState = "ad";
    const adMusicNode = this.audio.playAdMusic();

    if (this.onAd) {
      this.onAd(5, () => {
        if (adMusicNode) adMusicNode.stop();
        onRewardGranted();
      }, () => {
        if (adMusicNode) adMusicNode.stop();
        this.state.gameState = "playing";
        if (this.onStateChange) this.onStateChange();
      });
    }
  }

  triggerLevelVictory(fromNetwork = false) {
    this.stopLoop();
    
    const isCoop = this.multiplayer && this.multiplayer.isConnected;
    if (isCoop && !fromNetwork) {
      this.multiplayer.send({
        type: "VICTORY"
      });
    }
    
    const gameCompleted = !isCoop && this.currentLevel === 20;
    this.state.gameState = "victory";
    
    // Check and unlock end-level achievements
    this.unlockAchievement("first_escape");
    
    if (this.difficulty === "nightmare") {
      this.unlockAchievement("nightmare_victory");
    }
    if ((this.difficulty === "hard" || this.difficulty === "nightmare") && !this.state.tookMonsterDamage) {
      this.unlockAchievement("no_damage_victory");
    }
    if (this.state.quests.childState === "solved" && this.state.quests.mouseState === "solved") {
      this.unlockAchievement("solve_all_quests");
    }
    if (this.state.player.gold >= 30) {
      this.unlockAchievement("gold_collector");
    }

    // New Co-op Achievements
    if (isCoop) {
      this.unlockAchievement("coop_first_escape");
      if (this.difficulty === "nightmare") {
        this.unlockAchievement("coop_nightmare_escape");
      }
      if (this.state.otherPlayer && this.state.otherPlayer.isDead) {
        this.unlockAchievement("coop_revive_partner");
      }
    }

    // Speedrunner Achievement (clear level in under 90 seconds)
    if (this.state.gameStartTime) {
      const elapsedSec = (Date.now() - this.state.gameStartTime) / 1000;
      if (elapsedSec < 90) {
        this.unlockAchievement("speedrunner");
      }
      // Unlock Character Skins based on Level Quests
      if (this.currentLevel >= 3) this.unlockSkin("police");
      if (this.currentLevel >= 5) this.unlockSkin("child");
      if (this.currentLevel >= 7) this.unlockSkin("doctor");
      if (this.currentLevel >= 12) this.unlockSkin("firefighter");
      if (this.currentLevel >= 15) this.unlockSkin("killer");
      if (gameCompleted) this.unlockSkin("monster");
    }

    // In co-op, don't advance the singleplayer level save
    if (!isCoop) {
      if (gameCompleted) {
        this.currentLevel = 1;
        localStorage.setItem("maze_level", "1");
      } else {
        this.currentLevel = Math.min(20, this.currentLevel + 1);
        localStorage.setItem("maze_level", this.currentLevel.toString());
      }
    }

    if (this.onGameEnd) this.onGameEnd(true, gameCompleted);
  }

  triggerGameOver(fromNetwork = false) {
    this.stopLoop();
    
    const isCoop = this.multiplayer && this.multiplayer.isConnected;
    if (isCoop && !fromNetwork) {
      this.multiplayer.send({
        type: "GAME_OVER"
      });
    }
    
    this.state.gameState = "gameover";
    if (this.onGameEnd) this.onGameEnd(false);
  }

  revivePlayer() {
    this.triggerAdOverlay("revive", () => {
      this.state.player.health = 100;
      this.state.player.fuel = Math.max(50, this.state.player.fuel);
      
      this.state.currentFloor = this.state.lastCheckPoint.floor;
      this.state.player.x = this.state.lastCheckPoint.x;
      this.state.player.y = this.state.lastCheckPoint.y;
      this.state.player.visualX = this.state.player.x;
      this.state.player.visualY = this.state.player.y;
      
      this.revealArea(Math.floor(this.state.player.x), Math.floor(this.state.player.y));

      this.state.gameState = "playing";
      if (this.onStateChange) this.onStateChange();
      this.startLoop();
    });
  }

  checkSageDisappearance() {
    if (this.state && this.state.currentFloor === 0 && !this.sageDisappeared) {
      const grid = this.state.floors[0];
      let sageCell = null;
      for (let y = 0; y < this.state.height; y++) {
        for (let x = 0; x < this.state.width; x++) {
          if (grid[y][x].npc && grid[y][x].npc.id === "traveler") {
            sageCell = grid[y][x];
            break;
          }
        }
        if (sageCell) break;
      }
      if (sageCell && sageCell.npc && !sageCell.npc.disappearing) {
        // Only disappear if the dialogue has been opened and closed, and 20 seconds has elapsed since closure
        if (sageCell.npc.hasSpoken && sageCell.npc.dialogueClosedTime) {
          if ((Date.now() - sageCell.npc.dialogueClosedTime) > 2000) {
            sageCell.npc.disappearing = true;
            sageCell.npc.disappearStartTime = Date.now();
            this.audio.playGhostFade();
            this.sageDisappeared = true;
            if (this.onStateChange) this.onStateChange();
          }
        }
      }
    }
  }
}
