import { generateMaze } from "./maze.js?v=34";
import { AudioEngine } from "./audio.js?v=34";
import { CanvasRenderer } from "./canvas.js?v=34";
import { translations } from "./translations.js?v=34";
import { randomEvents, deathEvents } from "./events.js?v=34";
import { getSeededRandom } from "./prng.js?v=34";

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

    // Achievements definitions
    this.achievements = [
      { id: "first_escape", group: "easy", nameTr: "İlk Kaçış", nameEn: "First Escape", descTr: "Kolay veya daha üstü zorlukta labirentten ilk kez kaç.", descEn: "Escape the maze on Easy or higher difficulty for the first time.", icon: "🏆" },
      { id: "burn_monster", group: "medium", nameTr: "Karanlığın Avcısı", nameEn: "Shadow Burner", descTr: "Orta veya daha üstü zorlukta canavarı ilk kez yakarak geri püskürt.", descEn: "Repel the shadow monster on Medium or higher difficulty by burning it.", icon: "🔥" },
      { id: "no_damage_victory", group: "hard", nameTr: "Hayatta Kalan", nameEn: "Fearless", descTr: "Zor veya daha üstü zorlukta canavardan hiç hasar almadan kaç.", descEn: "Escape the maze on Hard or higher difficulty without taking damage from the monster.", icon: "🛡️" },
      { id: "nightmare_victory", group: "nightmare", nameTr: "Kabusun Sonu", nameEn: "End of Nightmare", descTr: "Kabus (Nightmare) modunda labirentten başarıyla kaç.", descEn: "Successfully escape the maze on Nightmare difficulty.", icon: "💀" },
      { id: "read_all_lore", group: "general", nameTr: "Kayıp Parşömenler", nameEn: "Lore Keeper", descTr: "Labirentteki 3 hikaye parşömeninin tamamını bul ve oku.", descEn: "Find and read all 3 lore papers scattered in the maze.", icon: "📜" },
      { id: "solve_all_quests", group: "general", nameTr: "İyilik Meleği", nameEn: "Soul Liberator", descTr: "Çocuk ve Fare yan görevlerinin ikisini de aynı oyunda tamamla.", descEn: "Complete both the Child and Mouse side quests in a single game.", icon: "💖" },
      { id: "gold_collector", group: "general", nameTr: "Altın Avcısı", nameEn: "Gold Digger", descTr: "Bir oyunda en az 30 altın biriktir.", descEn: "Accumulate at least 30 gold in a single game.", icon: "💰" },
      { id: "solve_all_gates", group: "general", nameTr: "Zırhlı Kapılar", nameEn: "Keymaster", descTr: "3 kilitli kapının/şifrenin tamamını çözerek aç.", descEn: "Resolve and open all 3 locked doors/puzzles in the maze.", icon: "🔑" }
    ];

    // Level progression
    this.currentLevel = parseInt(localStorage.getItem("maze_level")) || 1;

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
      if (k === "f") this.toggleLantern(); // F to Toggle Lantern
      if (k === "m") this.useInventoryItem("map_piece");
      if (k === "c") this.useInventoryItem("compass");
      if (k === "e" || e.key === " ") {
        this.interactWithClosest();
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

  initNewGame(isRetry = false) {
    // Always roll a random variation (0, 1, or 2) out of the 3 static level variations to keep it fresh and prevent simple memorization!
    this.currentVariation = Math.floor(Math.random() * 3);

    // 1. Calculate dimensions and floors based on 20 levels progression
    let size = 21 + (this.currentLevel - 1) * 2;
    size = Math.min(39, size); // Cap at 39x39 for excellent performance
    if (size % 2 === 0) size += 1;

    let numFloors = 1;
    if (this.currentLevel >= 7 && this.currentLevel <= 13) numFloors = 2;
    else if (this.currentLevel >= 14) numFloors = 3;

    // Generate seeded deterministic maze
    const seed = (this.currentLevel * 100) + this.currentVariation;
    const rng = getSeededRandom(seed);
    const mazeData = generateMaze(size, size, numFloors, rng);
    
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
          rope: 0,
          compass: 0,
          map_piece: 0,
          fuel: 0,
          fuel_half: 0,
          cheese: 0
        }
      },

      quests: {
        childState: "unsolved",
        mouseState: "unsolved",
        wellState: "unsolved"
      },

      merchantStock: {
        fuel: { cost: 10, count: Math.floor(1 + Math.random() * 3) },
        rope: { cost: 25, count: 1 },
        axe: { cost: 20, count: 1 }
      },

      lastCheckPoint: { x: 1.5, y: 1.5, floor: 0 },
      shadowMonsters: (() => {
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

  startLoop() {
    if (this.loopRunning) return;
    this.loopRunning = true;
    this.lastTime = performance.now();

    const tick = (now) => {
      if (!this.loopRunning) return;
      
      const dt = Math.min(0.1, (now - this.lastTime) / 1000); // cap dt to 100ms
      this.lastTime = now;

      if (this.state && this.state.gameState === "playing") {
        this.updatePhysics(dt);
        this.checkSageDisappearance();
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
      if (this.keys["a"] || this.keys["arrowleft"]) strafeDir = -1;
      if (this.keys["d"] || this.keys["arrowright"]) strafeDir = 1;
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

    // Walking speed: 1.8 grid cells/sec, Running speed: 2.8 grid cells/sec
    const speed = isRunning ? 2.8 : 1.8;

    if (isRunning) {
      // Drain stamina when running forward (depletes in 4 seconds: 25 per second)
      p.stamina = Math.max(0, p.stamina - dt * 25);
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

    // Sync visual coordinates directly
    p.visualX = p.x;
    p.visualY = p.y;

    // 4. Update coordinates & trigger proximity interaction (Staircase & Exit ONLY!)
    const cellX = Math.floor(p.x);
    const cellY = Math.floor(p.y);
    const cell = grid[cellY][cellX];

    // Proximity cell transition random jumpscare chance (0.4% chance on entering a new cell)
    if (this.lastCellX === undefined) {
      this.lastCellX = cellX;
      this.lastCellY = cellY;
    }
    if (cellX !== this.lastCellX || cellY !== this.lastCellY) {
      this.lastCellX = cellX;
      this.lastCellY = cellY;
      
      const anyActiveMonster = this.state.shadowMonsters && this.state.shadowMonsters.some(sm => sm.active);
      if (this.state.gameState === "playing" && !anyActiveMonster) {
        if (Math.random() < 0.004) {
          this.state.gameState = "modal";
          this.audio.playJumpscare();
          this.audio.playHeartbeatRapid(6000); // 6 seconds of rapid heartbeat panic
          this.audio.playPanting(); // heavy breathing panic
          
          this.showJumpscare("normal");
          const overlay = document.getElementById("modal-jumpscare");
          if (overlay) {
            overlay.classList.remove("hidden");
            setTimeout(() => {
              overlay.classList.add("hidden");
              this.state.gameState = "playing";
              if (this.onStateChange) this.onStateChange();
            }, 1200);
          } else {
            this.state.gameState = "playing";
          }
        }
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

    // B. Check Staircase
    if (cell.staircase && this.state.staircaseCooldown <= 0) {
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
            if (this.showToast) {
              this.showToast(this.t("obstacles.ropePitSuccess"));
            }
          } else {
            // Block transition and show warning toast with a cooldown to prevent spamming
            this.state.staircaseCooldown = 2.0;
            if (this.showToast) {
              this.showToast(this.t("obstacles.ropePitWarning"));
            }
            return;
          }
        }

        this.state.staircaseCooldown = 2.0; // cooldown of 2 seconds
        this.audio.playUnlock();
        this.revealArea(cellX, cellY);
        
        if (typeof this.onFloorTransition === "function") {
          this.onFloorTransition(nextFloor, cell.staircase);
        } else {
          this.state.currentFloor = nextFloor;
        }
      }
    }

    // 5. Steps & event decrement (fuel consumption disabled)
    if (isMoving) {
      this.state.stepsTaken += dt * 15;

      // Footstep audio timing (runs faster when sprinting)
      this.stepSoundTimer += dt;
      const stepInterval = isRunning ? 0.28 : 0.45;
      if (this.stepSoundTimer > stepInterval) {
        this.audio.playStep(isRunning);
        this.stepSoundTimer = 0;
      }
    } else {
      this.stepSoundTimer = 999; // Prime step timer for instant sound on next move start
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
      if (this.difficulty === "easy") decayMult = 0.7;
      else if (this.difficulty === "hard") decayMult = 1.25;
      else if (this.difficulty === "nightmare") decayMult = 1.4;
      p.fuel = Math.max(0, p.fuel - dt * (100 / 240) * decayMult);
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
      this.showAchievementToast(ach.icon, name);
    }
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
      this.triggerDeathChoice();
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
            this.resolveObstacle(cell.obstacle);
            this.audio.playSlash();
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
            this.resolveObstacle(cell.obstacle);
            this.audio.playSlash();
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
      const content = chest.content;
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
    const title = this.lang === "tr" ? "Yırtık Bir Günlük Sayfası" : "A Torn Journal Page";
    const text = this.t(`lore.${loreId}`);

    // Track read lore for achievements
    if (this.state && this.state.readLore) {
      if (!this.state.readLore.includes(loreId)) {
        this.state.readLore.push(loreId);
        if (this.state.readLore.length >= 3) {
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

  // Interacting with NPCs
  triggerNPCInteraction(cell) {
    this.state.gameState = "modal";
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
            this.audio.playPickup();
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
      text = npc.currentText || this.t("npc.traveler.greeting");

      choices.push({
        text: this.t("npc.traveler.askWho"),
        action: () => {
          npc.currentText = this.t("npc.traveler.replyWho");
          this.triggerNPCInteraction(cell);
        }
      });
      choices.push({
        text: this.t("npc.traveler.askEscape"),
        action: () => {
          npc.currentText = this.t("npc.traveler.replyEscape");
          this.triggerNPCInteraction(cell);
        }
      });
      choices.push({
        text: this.t("npc.traveler.askMonster"),
        action: () => {
          npc.currentText = this.t("npc.traveler.replyMonster");
          this.triggerNPCInteraction(cell);
        }
      });
      choices.push({
        text: this.t("npc.traveler.farewell"),
        action: () => {
          this.state.gameState = "playing";
          npc.hasSpoken = true;
          npc.dialogueClosedTime = Date.now();
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
    
    while (qHead < queue.length) {
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

    s.shadowMonsters.forEach((sm) => {
      // Spawner logic
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

          const pCellX = Math.floor(p.x);
          const pCellY = Math.floor(p.y);
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

          // Fallback if no cells found in the safe range (e.g. at the edges of small floors)
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
        }
      }

      // Check if player's flashlight is shining on this shadow monster
      let isBurned = false;
      if (s.lanternOn) {
        if (dist < 8.0) {
          const lookX = Math.cos(p.angle);
          const lookY = Math.sin(p.angle);
          const dirX = (sm.x - p.x) / dist;
          const dirY = (sm.y - p.y) / dist;

          const dot = lookX * dirX + lookY * dirY;
          if (dot > 0.866) {
            const grid = s.floors[s.currentFloor];
            if (this.hasLineOfSight(p.x, p.y, sm.x, sm.y, grid, s.width, s.height)) {
              isBurned = true;
              sm.burnTime += dt;

              if (!this.lastBurnSoundTime || Date.now() - this.lastBurnSoundTime > 300) {
                this.audio.playShadowBurn();
                this.lastBurnSoundTime = Date.now();
              }

              if (sm.burnTime >= 2.0) {
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
                if (this.onStateChange) this.onStateChange();
                return;
              }
            }
          }
        }
      }

      if (!isBurned) {
        sm.burnTime = Math.max(0, sm.burnTime - dt * 0.5);
      }

      const grid = s.floors[s.currentFloor];

      if (sm.burnTime > 0) {
        // Flee away from player
        let runX = sm.x - p.x;
        let runY = sm.y - p.y;
        const len = Math.hypot(runX, runY);
        if (len > 0.001) {
          runX = (runX / len) * sm.speed * 1.35 * dt;
          runY = (runY / len) * sm.speed * 1.35 * dt;
        }

        let nextX = sm.x + runX;
        let nextY = sm.y + runY;

        const canMoveTo = (tx, ty) => {
          const gx = Math.floor(tx);
          const gy = Math.floor(ty);
          if (gx < 0 || gx >= s.width || gy < 0 || gy >= s.height) return false;
          return grid[gy][gx].type !== "wall";
        };

        if (canMoveTo(nextX, sm.y)) sm.x = nextX;
        if (canMoveTo(sm.x, nextY)) sm.y = nextY;
      } else {
        // Chase player
        sm.pathRecalcTimer = (sm.pathRecalcTimer || 0) - dt;
        if (sm.pathRecalcTimer <= 0 || !sm.lastNextStep) {
          sm.pathRecalcTimer = 0.20;
          sm.lastNextStep = this.findPathToPlayer(sm.x, sm.y, p.x, p.y, grid, s.width, s.height);
        }

        const nextStep = sm.lastNextStep;
        if (nextStep) {
          let chaseX = nextStep.x - sm.x;
          let chaseY = nextStep.y - sm.y;
          const len = Math.hypot(chaseX, chaseY);
          if (len > 0.001) {
            sm.x += (chaseX / len) * sm.speed * dt;
            sm.y += (chaseY / len) * sm.speed * dt;
          }
        } else {
          let chaseX = p.x - sm.x;
          let chaseY = p.y - sm.y;
          const len = Math.hypot(chaseX, chaseY);
          if (len > 0.001) {
            sm.x += (chaseX / len) * sm.speed * dt;
            sm.y += (chaseY / len) * sm.speed * dt;
          }
        }
      }

      // Check Jumpscare range — monster must have line of sight to player (can't kill through walls)
      if (dist < 0.65 && this.hasLineOfSight(p.x, p.y, sm.x, sm.y, grid, s.width, s.height)) {
        this.triggerJumpscare();
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
    
    this.showJumpscare("normal");
    const overlay = document.getElementById("modal-jumpscare");
    if (overlay) {
      overlay.classList.remove("hidden");
      
      setTimeout(() => {
        overlay.classList.add("hidden");
        
        const p = s.player;
        p.health = 0; // Instant death when caught by the shadow monster
        s.tookMonsterDamage = true;
        
        this.triggerDeathChoice();
        
        if (this.onStateChange) this.onStateChange();
      }, 1500);
    } else {
      s.gameState = "playing";
    }
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

  triggerLevelVictory() {
    this.stopLoop();
    
    const gameCompleted = this.currentLevel === 20;
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

    if (gameCompleted) {
      this.currentLevel = 1;
      localStorage.setItem("maze_level", "1");
    } else {
      this.currentLevel = Math.min(20, this.currentLevel + 1);
      localStorage.setItem("maze_level", this.currentLevel.toString());
    }

    if (this.onGameEnd) this.onGameEnd(true, gameCompleted);
  }

  triggerGameOver() {
    this.stopLoop();
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
