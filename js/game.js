import { generateMaze } from "./maze.js";
import { AudioEngine } from "./audio.js";
import { CanvasRenderer } from "./canvas.js";
import { translations } from "./translations.js";
import { randomEvents, deathEvents } from "./events.js";

export class Game {
  constructor() {
    this.lang = localStorage.getItem("maze_lang") || "tr";
    this.audioEnabled = localStorage.getItem("maze_audio") !== "false";
    this.difficulty = localStorage.getItem("maze_diff") || "medium";

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
      if (k === "r") this.useInventoryItem("fuel"); // R to Refill Lantern fuel
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

  setCanvas(canvasElement) {
    this.canvas = canvasElement;
    this.renderer = new CanvasRenderer(canvasElement);
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

  initNewGame() {
    // 1. Calculate dimensions based on level and difficulty settings (increased by ~100% in area)
    let baseSize = 29; // Easy starting size (14x14 rooms = 196 rooms)
    if (this.difficulty === "medium") baseSize = 39; // Medium starting size (19x19 rooms = 361 rooms)
    else if (this.difficulty === "hard") baseSize = 49; // Hard starting size (24x24 rooms = 576 rooms)

    // Increment size based on level progression
    const levelBonus = Math.floor((this.currentLevel - 1) / 5) * 2;
    let size = baseSize + levelBonus;
    size = Math.min(61, size); // Cap size to prevent lag while keeping maps massive
    if (size % 2 === 0) size += 1; // Ensure size is odd for DFS maze carver

    // Calculate floors based on level
    let numFloors = 1 + Math.floor((this.currentLevel - 1) / 10);
    numFloors = Math.min(3, numFloors); // Cap at max 3 floors

    const mazeData = generateMaze(size, size, numFloors);
    
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
      playerTrail: [{ x: 1, y: 1 }], // Track player path coordinates

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
          fuel: 1,
          cheese: 0
        }
      },

      quests: {
        childState: "unsolved",
        mouseState: "unsolved",
        wellState: "unsolved"
      },

      merchantStock: {
        rope: { cost: 15, count: 2 },
        axe: { cost: 20, count: 1 }, // Added axe so player can clear roadblocks
        fuel: { cost: 5, count: 4 }
      },

      lastCheckPoint: { x: 1.5, y: 1.5, floor: 0 }
    };

    // Reveal start coordinates
    this.revealArea(1, 1);
    this.audio.init();

    if (this.renderer) {
      this.renderer.onEntityClick = (type, cell) => {
        if (this.state.gameState !== "playing") return;
        if (type === "chest") this.triggerChestInteraction(cell);
        else if (type === "npc") this.triggerNPCInteraction(cell);
        else if (type === "obstacle") this.triggerObstacleInteraction(cell);
        else if (type === "clue") this.triggerClueInteraction(cell);
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
    const radius = 10; // reveal cells up to 10 units away (prevents visible pop-in with linear fog)
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        // Euclidean distance check to make it a perfect circular reveal area
        if (dx * dx + dy * dy <= 110.25) { // 10.5 squared
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

      // Boundary constraints
      nextX = Math.max(0.1, Math.min(this.state.width - 1.1, nextX));
      nextY = Math.max(0.1, Math.min(this.state.height - 1.1, nextY));

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
        this.state.currentFloor = nextFloor;
        this.state.staircaseCooldown = 1.6; // cooldown of 1.6 seconds
        this.audio.playUnlock();
        this.revealArea(cellX, cellY);
      }
    }

    // 5. Steps & event decrement (fuel consumption disabled)
    if (isMoving) {
      p.fuel = 100; // Keep fuel at 100 always
      this.state.stepsTaken += dt * 15;

      // Footstep audio timing (runs faster when sprinting)
      this.stepSoundTimer += dt;
      const stepInterval = isRunning ? 0.28 : 0.45;
      if (this.stepSoundTimer > stepInterval) {
        this.audio.playStep(isRunning);
        this.stepSoundTimer = 0;
      }
    }

    // Out of breath heavy panting audio when stamina is low (20% and below)
    if (p.stamina <= 20.0) {
      if (this.pantSoundTimer === undefined) this.pantSoundTimer = 0;
      this.pantSoundTimer -= dt;
      if (this.pantSoundTimer <= 0) {
        this.audio.playPanting();
        // Dynamic interval: scales from 0.72s (rapid continuous loops at 0% stamina) to 1.10s (at 20% stamina)
        this.pantSoundTimer = 0.72 + (p.stamina / 20.0) * 0.38;
      }
    } else {
      this.pantSoundTimer = 0;
    }

    this.revealArea(cellX, cellY);

    // Update Checkpoint region level
    const lastCP = this.state.lastCheckPoint;
    const cpCell = this.state.floors[lastCP.floor][Math.floor(lastCP.y)][Math.floor(lastCP.x)];
    if (cell.region > cpCell.region) {
      this.state.lastCheckPoint = { x: p.x, y: p.y, floor: this.state.currentFloor };
    }

    // Trigger Random event
    if (this.state.stepsTaken >= this.state.nextEventSteps) {
      this.triggerRandomEvent();
      return;
    }

    // Update Day/Night Cycle (80-second loop: 40s Day, 40s Night)
    this.state.timeOfDay = (this.state.timeOfDay + dt * 0.0125) % 1.0;

    // Fuel consumption (disabled as per user request, fuel stays at 100)
    p.fuel = 100;

    // Track player trail (deduplicated cell visits)
    const currentCell = { x: Math.floor(p.x), y: Math.floor(p.y) };
    const lastTrail = this.state.playerTrail[this.state.playerTrail.length - 1];
    if (!lastTrail || lastTrail.x !== currentCell.x || lastTrail.y !== currentCell.y) {
      this.state.playerTrail.push(currentCell);
      if (this.onStateChange) this.onStateChange();
    }

    // Trigger UI updates if stamina has changed (so stamina bar updates in real-time while standing/walking)
    if (p.stamina !== prevStamina && this.onStateChange) {
      this.onStateChange();
    }
  }

  damagePlayer(amount) {
    this.state.player.health = Math.max(0, this.state.player.health - amount);
    if (this.state.player.health <= 0) {
      this.triggerDeathChoice();
    } else {
      if (this.onStateChange) this.onStateChange();
    }
  }

  toggleLantern() {
    if (this.state && this.state.gameState === "playing") {
      this.state.lanternOn = !this.state.lanternOn;
      this.audio.playPickup(); // Simple click/toggle sound
      if (this.onStateChange) this.onStateChange();
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
            cell.obstacle.resolved = true;
            this.audio.playUnlock();
            this.state.gameState = "playing";
          }
        });
      }
    } else if (type === "ivy") {
      if (inv.shears > 0) {
        choices.push({
          text: `${this.t("useItem")}: ${this.t("items.shears.name")} (x${inv.shears})`,
          action: () => {
            inv.shears--;
            cell.obstacle.resolved = true;
            this.audio.playSlash();
            this.state.gameState = "playing";
          }
        });
      }
    } else if (type === "barricade") {
      if (inv.axe > 0) {
        choices.push({
          text: `${this.t("useItem")}: ${this.t("items.axe.name")} (x${inv.axe})`,
          action: () => {
            inv.axe--;
            cell.obstacle.resolved = true;
            this.audio.playSlash();
            this.state.gameState = "playing";
          }
        });
      }
    } else if (type === "chasm") {
      if (inv.rope > 0) {
        choices.push({
          text: `${this.t("useItem")}: ${this.t("items.rope.name")} (x${inv.rope})`,
          action: () => {
            inv.rope--;
            cell.obstacle.resolved = true;
            this.audio.playUnlock();
            this.state.gameState = "playing";
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
                cell.obstacle.resolved = true;
                this.audio.playUnlock();
                this.state.gameState = "playing";
              } else {
                this.damagePlayer(10);
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
  hasLineOfSight(x1, y1, x2, y2, grid) {
    const steps = 10;
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const sx = x1 + (x2 - x1) * t;
      const sy = y1 + (y2 - y1) * t;
      const cx = Math.floor(sx);
      const cy = Math.floor(sy);
      if (cx >= 0 && cx < this.state.width && cy >= 0 && cy < this.state.height) {
        if (grid[cy][cx].type === "wall") {
          return false;
        }
      }
    }
    return true;
  }

  findClosestInteractable() {
    const p = this.state.player;
    const grid = this.state.floors[this.state.currentFloor];
    let closestCell = null;
    let closestType = null;
    let minDistance = 1.6; // max interaction range

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
          if (cell.chest) type = "chest";
          else if (cell.npc) type = "npc";
          else if (cell.obstacle) type = "obstacle";
          else if (cell.puzzleClue) type = "clue";
          
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
    if (this.state.gameState !== "playing") return;
    const interactable = this.findClosestInteractable();
    if (interactable) {
      if (interactable.type === "chest") this.triggerChestInteraction(interactable.cell);
      else if (interactable.type === "npc") this.triggerNPCInteraction(interactable.cell);
      else if (interactable.type === "obstacle") this.triggerObstacleInteraction(interactable.cell);
      else if (interactable.type === "clue") this.triggerClueInteraction(interactable.cell);
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

      if (content.type === "gold") {
        title = this.t("chest.rewardTitle");
        text = this.t("chest.goldReward", { amount: content.amount });
        this.state.player.gold += content.amount;
        this.audio.playPickup();
      } else if (content.type === "item") {
        title = this.t("chest.rewardTitle");
        const itemTrans = this.t(`items.${content.item}.name`);
        text = this.t("chest.itemReward", { item: itemTrans });
        this.state.player.inventory[content.item]++;
        if (content.gold) this.state.player.gold += content.gold;
        this.audio.playPickup();
      } else if (content.type === "trap") {
        title = this.t("chest.trapTitle");
        text = this.t("chest.trapText", { damage: content.damage });
        detail = { type: "trap", value: content.damage };
        this.audio.playHazard();
      } else if (content.type === "mimic") {
        title = this.t("chest.mimicTitle");
        text = this.t("chest.mimicText", { damage: content.damage });
        detail = { type: "mimic", value: content.damage };
        this.audio.playHazard();
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
            inv.bucket_full--;
            inv.bucket++;
            inv.key++;
            this.state.quests.childState = "solved";
            this.audio.playPickup();
            this.state.gameState = "playing";
            if (this.onStateChange) this.onStateChange();
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
            inv.cheese--;
            this.state.quests.mouseState = "solved";
            
            // Clear adjacent wall nodes
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

            this.audio.playUnlock();
            this.state.gameState = "playing";
            if (this.onStateChange) this.onStateChange();
          }
        });
      } else {
        text = this.t("npc.mouse.noCheese");
      }
    } else if (npc.id === "traveler") {
      choices.push({
        text: this.t("npc.traveler.askExit"),
        action: () => {
          const dx = this.state.exitCell.x - p.x;
          const dy = this.state.exitCell.y - p.y;
          
          let vert = dy > 0 ? "south" : "north";
          let horiz = dx > 0 ? "east" : "west";
          if (Math.abs(dy) < 2) vert = "";
          if (Math.abs(dx) < 2) horiz = "";
          
          const dirTrans = (vert && horiz) 
            ? `${this.t("directionNames." + vert)}-${this.t("directionNames." + horiz)}` 
            : this.t("directionNames." + (vert || horiz || "south"));

          text = this.t("npc.traveler.exitHint", { direction: dirTrans });
          choices = [{
            text: this.t("npc.traveler.farewell"),
            action: () => {
              this.state.gameState = "playing";
              if (this.onStateChange) this.onStateChange();
            }
          }];
          if (this.onDialog) this.onDialog({ title, text, choices });
        }
      });
      choices.push({
        text: this.t("npc.traveler.askCode"),
        action: () => {
          text = this.t("npc.traveler.codeHint");
          choices = [{
            text: this.t("npc.traveler.farewell"),
            action: () => {
              this.state.gameState = "playing";
              if (this.onStateChange) this.onStateChange();
            }
          }];
          if (this.onDialog) this.onDialog({ title, text, choices });
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
                this.triggerNPCInteraction(cell);
              } else {
                alert(this.t("npc.merchant.noGold"));
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
    if (this.state.gameState !== "playing") return;
    const p = this.state.player;
    if (p.inventory[itemId] <= 0) return;

    if (itemId === "fuel") {
      p.inventory.fuel--;
      p.fuel = Math.min(100, p.fuel + 30);
      this.audio.playPickup();
      if (this.onStateChange) this.onStateChange();
    } else if (itemId === "map_piece") {
      p.inventory.map_piece--;
      const radius = 2;
      const cellX = Math.floor(p.x);
      const cellY = Math.floor(p.y);
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = cellX + dx;
          const ny = cellY + dy;
          if (nx >= 0 && nx < this.state.width && ny >= 0 && ny < this.state.height) {
            this.state.visitedMap[this.state.currentFloor][ny][nx] = true;
          }
        }
      }
      this.audio.playPickup();
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
        
      alert(`${this.t("compassActive")} (${dirTrans})`);
      this.audio.playUnlock();
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
              alert(c.outcomeText[this.lang]);
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
    this.state.gameState = "victory";
    
    // Level progress increments
    this.currentLevel = Math.min(50, this.currentLevel + 1);
    localStorage.setItem("maze_level", this.currentLevel.toString());

    if (this.onGameEnd) this.onGameEnd(true);
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
}
