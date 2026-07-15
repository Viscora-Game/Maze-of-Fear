const makeClueTexture = (code) => {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  
  // Aged, dirty parchment color
  ctx.fillStyle = "#d7c4a3"; // darker yellowed paper
  ctx.fillRect(0, 0, 128, 128);
  
  // Vignette/grunge corners on texture (with guard for headless mock compatibility)
  if (ctx.createRadialGradient) {
    const grad = ctx.createRadialGradient(64, 64, 30, 64, 64, 90);
    grad.addColorStop(0, "rgba(90, 60, 30, 0)");
    grad.addColorStop(1, "rgba(50, 30, 10, 0.45)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
  }
  
  // Draw some creepy blood splatters and smear marks on the note (wrapped in guard for headless mock compatibility)
  if (ctx.arc && ctx.stroke) {
    ctx.fillStyle = "#8a0303"; // dark blood red
    for (let i = 0; i < 8; i++) {
      const bx = Math.random() * 128;
      const by = Math.random() * 128;
      const br = 1 + Math.random() * 3.5;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
      
      // tiny drip
      if (Math.random() < 0.5) {
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + (Math.random() - 0.5) * 2, by + br * (1.5 + Math.random() * 2));
        ctx.lineWidth = br * 0.4;
        ctx.strokeStyle = "#8a0303";
        ctx.stroke();
      }
    }

    // Draw blood smear marks
    ctx.strokeStyle = "rgba(138, 3, 3, 0.35)";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(10, 20 + Math.random() * 30);
    ctx.lineTo(110, 30 + Math.random() * 30);
    ctx.stroke();
  }
  
  // Clue digits (spooky handwritten style)
  ctx.fillStyle = "#6b0000"; // dried coagulated blood red
  ctx.font = "italic bold 36px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 4;
  ctx.fillText(code, 64, 76);
  ctx.shadowBlur = 0; // reset
  
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
};

export class CanvasRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    
    // 1. Initialize WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(canvas.width, canvas.height);
    
    // Enable soft shadow mapping for premium depth
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // 2. Load Photographic Textures from public CDN
    const loader = new THREE.TextureLoader();

    this.brickTexture = loader.load("https://threejs.org/examples/textures/brick_diffuse.jpg");
    this.brickTexture.wrapS = THREE.RepeatWrapping;
    this.brickTexture.wrapT = THREE.RepeatWrapping;
    this.brickTexture.repeat.set(1.5, 1.5);

    this.brickBump = loader.load("https://threejs.org/examples/textures/brick_bump.jpg");
    this.brickBump.wrapS = THREE.RepeatWrapping;
    this.brickBump.wrapT = THREE.RepeatWrapping;
    this.brickBump.repeat.set(1.5, 1.5);

    this.hedgeTexture = loader.load("https://threejs.org/examples/textures/terrain/grasslight-big.jpg");
    this.hedgeTexture.wrapS = THREE.RepeatWrapping;
    this.hedgeTexture.wrapT = THREE.RepeatWrapping;
    this.hedgeTexture.repeat.set(1.5, 1.5);

    this.hedgeNormal = loader.load("https://threejs.org/examples/textures/terrain/grasslight-big-nm.jpg");
    this.hedgeNormal.wrapS = THREE.RepeatWrapping;
    this.hedgeNormal.wrapT = THREE.RepeatWrapping;
    this.hedgeNormal.repeat.set(1.5, 1.5);

    this.woodTexture = loader.load("https://threejs.org/examples/textures/hardwood2_diffuse.jpg");
    this.woodTexture.wrapS = THREE.RepeatWrapping;
    this.woodTexture.wrapT = THREE.RepeatWrapping;
    this.woodTexture.repeat.set(1.0, 1.0);

    this.woodBump = loader.load("https://threejs.org/examples/textures/hardwood2_bump.jpg");
    this.woodBump.wrapS = THREE.RepeatWrapping;
    this.woodBump.wrapT = THREE.RepeatWrapping;
    this.woodBump.repeat.set(1.0, 1.0);

    // Use brick texture tinted slate grey for the floor paths
    this.floorTexture = loader.load("https://threejs.org/examples/textures/brick_diffuse.jpg");
    this.floorTexture.wrapS = THREE.RepeatWrapping;
    this.floorTexture.wrapT = THREE.RepeatWrapping;
    this.floorTexture.repeat.set(2.0, 2.0);

    // Load jumpscare texture directly using URL constructor for Vite asset resolution compatibility
    const jumpscareUrl = new URL('../assets/jumpscare.png', import.meta.url).href;
    this.jumpscareTexture = loader.load(jumpscareUrl);

    // 3. Initialize Scene Graph & Fog (Gloomy, dark night-fog atmosphere - no day/night cycle)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#080a0f"); // Pitch black / dark night sky
    this.scene.fog = new THREE.Fog("#080a0f", 1.5, 6.0); // Dense dark fog: very close visibility for horror atmosphere

    // 4. Initialize Camera
    this.camera = new THREE.PerspectiveCamera(62, 1, 0.01, 100);

    // Camera smoothing trackers
    this.camX = null;
    this.camZ = null;
    this.lookX = null;
    this.lookY = null;
    this.lookZ = null;

    // Trackers
    this.currentFloorId = null;
    this.cellGroups = [];
    this.chestGoldMeshes = {};
    this.chestLidGroups = {}; // store lid group references for opening animation
    this.chestGroups = {};    // store chest groups for rotation
    this.obstacleMeshes = {};
    this.playerMesh = null;
    this.playerTorus = null;
    this.playerTorus2 = null;
    this.lantern = null;
    this.rollAngle = 0;
    this.lastVisualX = null;
    this.lastVisualY = null;
    this.lastEquippedItem = null;
    this.equippedAccessory = null;

    // Setup camera look around listeners: Click and drag anywhere on canvas, OR pointer lock mouse movement
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    
    this.canvas.addEventListener("mousedown", (e) => {
      if (document.pointerLockElement !== this.canvas) {
        isDragging = true;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }
    });
    
    window.addEventListener("mousemove", (e) => {
      if (!this.lastState) return;
      const p = this.lastState.player;
      if (p.pitch === undefined) p.pitch = 0.0;

      if (document.pointerLockElement === this.canvas) {
        // Pointer lock: direct mouse movement (ignore browser pointer lock entry/exit cursor centering jumps > 120px)
        if (Math.abs(e.movementX) > 120 || Math.abs(e.movementY) > 120) return;
        const sensitivity = 0.0022;
        p.angle += e.movementX * sensitivity;
        p.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, p.pitch - e.movementY * sensitivity));
      } else if (isDragging) {
        // Drag: clientX/Y difference
        const dx = e.clientX - prevMouseX;
        const dy = e.clientY - prevMouseY;
        
        // Ignore sudden coordinates jumps > 120px when clicking/dragging
        if (Math.abs(dx) > 120 || Math.abs(dy) > 120) {
          prevMouseX = e.clientX;
          prevMouseY = e.clientY;
          return;
        }
        
        const sensitivity = 0.0035;
        p.angle += dx * sensitivity;
        p.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, p.pitch - dy * sensitivity));
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }
    });
    
    window.addEventListener("mouseup", () => {
      isDragging = false;
    });

    // Multi-touch look controls for mobile - listen on window for seamless right-half swiping
    let lookTouchId = null;
    let lastLookX = 0;
    let lastLookY = 0;

    window.addEventListener("touchstart", (e) => {
      if (!this.lastState || this.lastState.gameState !== "playing") return;
      
      // Ignore if user touches an interactive button or HUD element
      const target = e.target;
      if (target.closest("button") || target.closest(".circle-btn") || target.closest("#hud-left-pill") || target.closest("#hud-right-pill") || target.closest(".btn-toggle")) {
        return;
      }
      
      // Look for a touch that starts on the right half of the screen
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        
        if (touch.clientX >= window.innerWidth / 2 && lookTouchId === null) {
          lookTouchId = touch.identifier;
          lastLookX = touch.clientX;
          lastLookY = touch.clientY;
          break;
        }
      }
    }, { passive: true });
    
    window.addEventListener("touchmove", (e) => {
      if (lookTouchId === null || !this.lastState) return;
      
      // Prevent page scrolling/bouncing from canceling touch drags
      if (e.cancelable) e.preventDefault();
      
      const p = this.lastState.player;
      if (p.pitch === undefined) p.pitch = 0.0;

      // Find the look touch
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        if (touch.identifier === lookTouchId) {
          const dx = touch.clientX - lastLookX;
          const dy = touch.clientY - lastLookY;
          
          // Ignore sudden coordinate jumps > 150px (multi-finger placement glitches)
          if (Math.abs(dx) > 150 || Math.abs(dy) > 150) {
            lastLookX = touch.clientX;
            lastLookY = touch.clientY;
            break;
          }
          
          const sensitivity = 0.007; // Slightly higher sensitivity for comfortable mobile look
          p.angle += dx * sensitivity;
          p.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, p.pitch - dy * sensitivity));
          
          lastLookX = touch.clientX;
          lastLookY = touch.clientY;
          break;
        }
      }
    }, { passive: false });
    
    const endLookTouch = (e) => {
      if (lookTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === lookTouchId) {
          lookTouchId = null;
          break;
        }
      }
    };

    window.addEventListener("touchend", endLookTouch);
    window.addEventListener("touchcancel", endLookTouch);

    // Request pointer lock on click if desired (only when playing and supported!)
    this.canvas.addEventListener("click", () => {
      if (this.lastState && this.lastState.gameState !== "playing") return;
      if (document.pointerLockElement !== this.canvas && this.canvas.requestPointerLock) {
        this.canvas.requestPointerLock();
      }
    });

    // Raycasting for 3D mouse pick clicking
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.lastState = null;
    this.onEntityClick = null;

    // Add canvas click event listener
    this.canvas.addEventListener("click", (e) => this.handleCanvasClick(e));

    // Particle Burst System for chest rewards
    this.particles = [];
    this.triggeredChests = new Set();
    this.npcGroups = {};
    this.exitPortals = [];
    this.mixers = [];
    this.clock = new THREE.Clock();

    // Load custom GLTF low-poly chest model
    this.chestModel = null;
    this.loadChestAsset();

    // Load custom FBX characters
    this.travelerModel = null;
    this.merchantModel = null;
    this.childModel = null;
    this.monsterModel = null;
    this.loadCharactersAsset();

    // Load custom GLTF low-poly black flashlight model
    this.flashlightModel = null;
    this.loadFlashlightAsset();

    // Load custom GLTF first-person arms model
    this.armsModel = null;
    this.armsAnimations = null;
    this.loadArmsAsset();

    // Load custom FBX decoration assets (flowers, rocks, grass)
    this.flowerModels = [];
    this.rockModels = [];
    this.grassModel = null;
    this.loadDecorationsAssets();
  }

  loadArmsAsset() {
    if (typeof THREE.GLTFLoader === "undefined") {
      console.warn("THREE.GLTFLoader is not available.");
      return;
    }
    const loader = new THREE.GLTFLoader();
    loader.load('assets/models/arms/arms_rig.glb', (gltf) => {
      this.armsModel = gltf.scene;
      this.armsAnimations = gltf.animations;
      
      // Apply nearest neighbor filtering to textures for retro look
      this.armsModel.traverse((child) => {
        if (child.isMesh) {
          if (child.material && child.material.map) {
            child.material.map.magFilter = THREE.NearestFilter;
            child.material.map.minFilter = THREE.NearestFilter;
          }
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      console.log("PSX First-Person Arms loaded successfully!");
      if (this.lastState) {
        this.rebuildScene(this.lastState);
      }
    }, undefined, (err) => {
      console.error("Failed to load GLTF arms model:", err);
    });
  }

  loadDecorationsAssets() {
    if (typeof THREE.FBXLoader === "undefined") {
      console.warn("THREE.FBXLoader is not available.");
      return;
    }
    const loader = new THREE.FBXLoader();
    
    // Helper to process loaded FBX model (stripping lights/cameras, disabling shadow casting for optimization)
    const processFBX = (fbx, scaleVal) => {
      const toRemove = [];
      fbx.traverse((child) => {
        if (child.isLight || child.isCamera) {
          toRemove.push(child);
        } else if (child.isMesh) {
          child.castShadow = false; // Disable shadow casting for decorations/foliage to eliminate FPS drops!
          child.receiveShadow = true;
          if (child.material) {
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach(m => {
              m.roughness = 0.95;
              m.metalness = 0.05;
              m.side = THREE.DoubleSide; // Double sided rendering for thin leaf/rock geometries
              
              // Force rock models to have a beautiful slate-grey stone color instead of default flat white
              const nameLower = child.name.toLowerCase();
              const parentNameLower = (child.parent && child.parent.name) ? child.parent.name.toLowerCase() : "";
              if (nameLower.includes("rock") || nameLower.includes("rocher") || 
                  parentNameLower.includes("rock") || parentNameLower.includes("rocher") ||
                  nameLower.includes("simple") || parentNameLower.includes("simple")) {
                m.color.set("#27272a"); // Charcoal dark grey
                if (m.emissive) m.emissive.set("#000000"); // Ensure absolutely no glowing
              } else if (nameLower.includes("flower") || nameLower.includes("fleur") || 
                         parentNameLower.includes("flower") || parentNameLower.includes("fleur")) {
                // Darken flowers by 70% to desaturate them and blend them into the gloomy environment
                if (m.color) {
                  m.color.multiplyScalar(0.30);
                }
              }
            });
          }
        }
      });
      toRemove.forEach(obj => {
        if (obj.parent) obj.parent.remove(obj);
      });
      fbx.scale.set(scaleVal, scaleVal, scaleVal);
      return fbx;
    };

    // Load Flowers
    const flowers = ['flower1.fbx', 'flower2.fbx', 'flower3.fbx'];
    let loadedCount = 0;
    const totalCount = 7;
    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount >= totalCount && this.lastState) {
        this.rebuildScene(this.lastState);
      }
    };

    flowers.forEach((name, idx) => {
      loader.load(`assets/models/decorations/${name}`, (fbx) => {
        const processed = processFBX(fbx, 0.0022);
        this.flowerModels[idx] = processed;
        console.log(`FBX Decoration ${name} loaded successfully!`);
        checkAllLoaded();
      }, undefined, (err) => {
        console.warn(`Failed to load FBX ${name}:`, err);
        loadedCount++; // still progress to not block loading
      });
    });

    // Load Rocks
    const rocks = ['rock1.fbx', 'rock2.fbx', 'rock3.fbx'];
    rocks.forEach((name, idx) => {
      loader.load(`assets/models/decorations/${name}`, (fbx) => {
        const processed = processFBX(fbx, 0.0006);
        this.rockModels[idx] = processed;
        console.log(`FBX Decoration ${name} loaded successfully!`);
        checkAllLoaded();
      }, undefined, (err) => {
        console.warn(`Failed to load FBX ${name}:`, err);
        loadedCount++;
      });
    });

    // Load Grass
    loader.load('assets/models/decorations/grass.fbx', (fbx) => {
      this.grassModel = processFBX(fbx, 0.0022);
      console.log("FBX Decoration grass.fbx loaded successfully!");
      checkAllLoaded();
    }, undefined, (err) => {
      console.warn("Failed to load FBX grass.fbx:", err);
      loadedCount++;
    });
  }

  loadFlashlightAsset() {
    if (typeof THREE.GLTFLoader === "undefined") {
      console.warn("THREE.GLTFLoader is not available.");
      return;
    }
    const loader = new THREE.GLTFLoader();
    
    // Load FlashLight_001 (Standard flashlight - black variation)
    loader.load('assets/models/flashlight/PsxFlashLights/GLB/FlashLight_001.glb', (gltf) => {
      const model = gltf.scene;
      
      // Load the BLACK texture (Variation 1 / FlashLight_1_ is the dark/black one)
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load('assets/models/flashlight/PsxFlashLights/Texture/Variation1/FlashLight_1_.png', (blackTexture) => {
        blackTexture.magFilter = THREE.NearestFilter;
        blackTexture.minFilter = THREE.NearestFilter;
        blackTexture.flipY = true; // TextureLoader default - matches external PNG texture
        if (THREE.sRGBEncoding) blackTexture.encoding = THREE.sRGBEncoding;
        
        model.traverse((child) => {
          if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
              map: blackTexture,
              roughness: 0.85,
              metalness: 0.15
            });
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        this.flashlightModel = model;
        console.log("PSX Flashlight 001 (BLACK) loaded successfully!");
        if (this.lastState) {
          this.rebuildScene(this.lastState);
        }
      });
    }, undefined, (err) => {
      console.error("Failed to load GLTF flashlight model:", err);
    });
  }

  loadChestAsset() {
    if (typeof THREE.GLTFLoader === "undefined") {
      console.warn("THREE.GLTFLoader is not available.");
      return;
    }
    const loader = new THREE.GLTFLoader();
    loader.load('assets/models/chest_simple.glb', (gltf) => {
      this.chestModel = gltf.scene;
      console.log("Low-poly GLTF chest model loaded successfully!");
      if (this.lastState) {
        this.rebuildScene(this.lastState);
      }
    }, undefined, (err) => {
      console.error("Failed to load GLTF chest model:", err);
    });
  }

  loadCharactersAsset() {
    if (typeof THREE.FBXLoader === "undefined") {
      console.warn("THREE.FBXLoader is not available.");
      return;
    }
    const loader = new THREE.FBXLoader();
    const textureLoader = new THREE.TextureLoader();

    const loadChar = (name, targetHeight, modelProp) => {
      loader.load(`assets/models/characters/${name}.fbx`, (fbx) => {
        textureLoader.load(`assets/models/characters/${name}.png`, (texture) => {
          texture.magFilter = THREE.NearestFilter;
          texture.minFilter = THREE.NearestFilter;
          if (THREE.sRGBEncoding) texture.encoding = THREE.sRGBEncoding;

          const toRemove = [];
          fbx.traverse((child) => {
            if (child.isLight || child.isCamera) {
              toRemove.push(child);
            } else if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (name === "monster") {
                // Scarier, darker transparent shadow look
                child.material = new THREE.MeshStandardMaterial({
                  map: texture,
                  color: new THREE.Color("#111111"), // very dark overlay
                  transparent: true,
                  opacity: 0.85,
                  roughness: 0.90,
                  metalness: 0.10
                });
              } else {
                child.material = new THREE.MeshStandardMaterial({
                  map: texture,
                  color: new THREE.Color("#444444"), // Dim base color to prevent overexposure/glowing under bright close flashlight
                  roughness: 0.95, // matte retro diffuse look
                  metalness: 0.05
                });
              }
            }
          });
          toRemove.forEach(obj => {
            if (obj.parent) obj.parent.remove(obj);
          });

          // Reset rotation (stand upright by default)
          fbx.rotation.set(0, 0, 0);

          // Get raw size to scale mathematically to target height (using max dimension as height)
          const box = new THREE.Box3().setFromObject(fbx);
          const size = new THREE.Vector3();
          box.getSize(size);
          const rawHeight = Math.max(size.x, size.y, size.z);
          const scaleFactor = targetHeight / (rawHeight > 0.001 ? rawHeight : 1.0);
          fbx.scale.set(scaleFactor, scaleFactor, scaleFactor);

          // Align feet to Y = 0 based on scaled bounding box
          const boxScaled = new THREE.Box3().setFromObject(fbx);
          fbx.position.y = -boxScaled.min.y;
          
          fbx.userData.initialY = fbx.position.y;
          fbx.userData.initialScaleX = scaleFactor;
          fbx.userData.initialScaleY = scaleFactor;
          fbx.userData.initialScaleZ = scaleFactor;
          
          this[modelProp] = fbx;
          console.log(`FBX Character ${name} loaded, scaled to ${targetHeight}m, and foot-aligned successfully!`);
          if (this.lastState) {
            this.rebuildScene(this.lastState);
          }
        });
      }, undefined, (err) => {
        console.error(`Failed to load FBX Character ${name}:`, err);
      });
    };

    loadChar('traveler', 0.75, 'travelerModel');
    loadChar('merchant', 0.75, 'merchantModel');
    loadChar('child', 0.45, 'childModel');
    // loadChar('monster', 0.85, 'monsterModel'); // Disabled to use custom smoke/mist demon model
  }

  hasLineOfSight(x1, y1, x2, y2, grid, width, height) {
    const px = Math.floor(x1);
    const py = Math.floor(y1);
    const cx = Math.floor(x2);
    const cy = Math.floor(y2);
    if (px === cx && py === cy) return true;

    // Cardinally adjacent: no cell in between, so line of sight is clear
    if (Math.abs(px - cx) + Math.abs(py - cy) === 1) return true;

    // Cardinally separated by 2 cells: check the middle cell for wall blockers
    if (px === cx && Math.abs(py - cy) === 2) {
      const midY = (py + cy) / 2;
      return grid[midY] && grid[midY][px] && grid[midY][px].type !== "wall";
    }
    if (py === cy && Math.abs(px - cx) === 2) {
      const midX = (px + cx) / 2;
      return grid[py] && grid[py][midX] && grid[py][midX].type !== "wall";
    }

    // Diagonally adjacent: check both corners
    if (Math.abs(px - cx) === 1 && Math.abs(py - cy) === 1) {
      const corner1 = (px < 0 || px >= width || cy < 0 || cy >= height) || (grid[cy] && grid[cy][px] && grid[cy][px].type === "wall");
      const corner2 = (cx < 0 || cx >= width || py < 0 || py >= height) || (grid[py] && grid[py][cx] && grid[py][cx].type === "wall");
      if (corner1 && corner2) return false;
      return true;
    }

    return false; // Beyond interaction range
  }

  handleCanvasClick(e) {
    if (!this.lastState || this.lastState.gameState !== "playing") return;

    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    for (let hit of intersects) {
      let obj = hit.object;
      while (obj && (!obj.userData || !obj.userData.type)) {
        obj = obj.parent;
      }

      if (obj && obj.userData && obj.userData.type) {
        const data = obj.userData;
        const p = this.lastState.player;
        const dist = Math.hypot(p.x - (data.x + 0.5), p.y - (data.y + 0.5));

        // Only allow interaction if close (Three.js 3D raycast already guarantees line of sight)
        if (dist <= 1.6) {
          if (this.onEntityClick) {
            this.onEntityClick(data.type, data.cell);
          }
          break; // Stop checking after successful interaction
        }
      }
    }
  }

  // Spawns a beautiful glowing burst of particles when a chest is opened
  spawnParticles(x, y, z) {
    const pCount = 18;
    const pGeo = new THREE.SphereGeometry(0.012, 4, 4);
    const pMat = new THREE.MeshBasicMaterial({ color: "#fbbf24" }); // Glowing gold
    
    for (let i = 0; i < pCount; i++) {
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.position.set(
        x + (Math.random() - 0.5) * 0.15,
        y + 0.05,
        z + (Math.random() - 0.5) * 0.15
      );
      this.scene.add(pMesh);
      
      this.particles.push({
        mesh: pMesh,
        vx: (Math.random() - 0.5) * 0.02,
        vy: 0.015 + Math.random() * 0.02,
        vz: (Math.random() - 0.5) * 0.02,
        life: 1.0,
        decay: 0.012 + Math.random() * 0.015
      });
    }
  }

  resize(containerWidth, containerHeight, mazeWidth, mazeHeight) {
    this.renderer.setSize(containerWidth, containerHeight);
    this.camera.aspect = containerWidth / containerHeight;
    this.camera.updateProjectionMatrix();
  }

  rebuildScene(state) {
    // Clear old children from the scene
    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }
    // Clear old children from the camera to prevent light/model accumulation on reload/resize
    while (this.camera.children.length > 0) {
      this.camera.remove(this.camera.children[0]);
    }

    this.cellGroups = [];
    this.chestGoldMeshes = {};
    this.chestLidGroups = {}; // store lid meshes for animation
    this.chestGroups = {};    // reset chest groups
    this.obstacleMeshes = {};
    this.npcGroups = {}; // reset NPC groups
    this.exitPortals = [];
    this.torches = []; // reset torches array
    this.shadowMonsterMesh = null;
    if (this.smokeTrailParticles) {
      this.smokeTrailParticles.forEach(p => {
        try { p.mesh.geometry.dispose(); } catch(e){}
        try { p.mesh.material.dispose(); } catch(e){}
      });
      this.smokeTrailParticles = [];
    }
    if (this.mixers) {
      this.mixers.forEach(m => {
        try { m.stopAllAction(); } catch(e){}
      });
      this.mixers = [];
    }
    this.shadowMonsterMixer = null;

    // 1. Lighting Setup (Creepy night fog - flashlight is the absolute primary light source)
    this.ambientLight = new THREE.AmbientLight("#0f172a", 0.04); // Extremely dark blue-grey ambient (barely visible outlines)
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight("#1e293b", 0.04); // Very weak moonlight fill to prevent total pure pitch black
    this.dirLight.position.set(10, 30, 10);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 60;
    const d = 12; // focused shadow orthographic volume around player
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0005;
    this.scene.add(this.dirLight);

    // Flashlight SpotLight - PRIMARY neutral white light source with realistic flashlight properties (decay = 1.1, range = 11.0m)
    this.lantern = new THREE.SpotLight("#ffffff", 4.5, 11.0, Math.PI / 6.0, 0.85, 1.1);
    this.lantern.castShadow = false; // Disable shadows to prevent hand/self-shadow blocking bugs
    this.scene.add(this.lantern);

    // Add default SpotLight target to scene space to track world coordinates
    if (!this.lantern.target) {
      this.lantern.target = new THREE.Object3D();
    }
    this.scene.add(this.lantern.target);

    // Detect mobile device to scale particle counts and ensure peak 60 FPS rendering on mobile GPUs
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

    // 1b. Rain Particles System (Gloomy, moody falling rain - dynamically scaled for mobile)
    const rainCount = isMobile ? 120 : 400;
    const rainGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(rainCount * 3);
    this.rainVelocities = [];
    
    for (let i = 0; i < rainCount; i++) {
      // Distribute rain particles initially in a 16x8x16 box around origin
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = Math.random() * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 16;
      this.rainVelocities.push(0.06 + Math.random() * 0.05); // falling speed
    }
    
    rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const rainMat = new THREE.PointsMaterial({
      color: "#9ca3af",
      size: 0.02,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    });
    
    this.rainParticles = new THREE.Points(rainGeo, rainMat);
    this.scene.add(this.rainParticles);

    // 1c. Low-Lying Ground Fog Particles System (Infinite player-locked drifting mist - dynamically scaled for mobile)
    const fogCount = isMobile ? 20 : 65;
    const fogGeo = new THREE.BufferGeometry();
    const fogPositions = new Float32Array(fogCount * 3);
    this.fogDriftVelocities = [];

    for (let i = 0; i < fogCount; i++) {
      fogPositions[i * 3] = (Math.random() - 0.5) * 14.0;
      fogPositions[i * 3 + 1] = 0.02 + Math.random() * 0.28;
      fogPositions[i * 3 + 2] = (Math.random() - 0.5) * 14.0;

      this.fogDriftVelocities.push({
        x: (Math.random() - 0.5) * 0.18,
        z: (Math.random() - 0.5) * 0.18
      });
    }

    fogGeo.setAttribute('position', new THREE.BufferAttribute(fogPositions, 3));

    // Canvas-based soft radial gradient for dust/fog particle texture
    const fogCanvas = document.createElement('canvas');
    fogCanvas.width = 64;
    fogCanvas.height = 64;
    const fogCtx = fogCanvas.getContext('2d');
    const grad = (fogCtx && typeof fogCtx.createRadialGradient === "function")
      ? fogCtx.createRadialGradient(32, 32, 0, 32, 32, 32)
      : null;
    
    if (grad) {
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.7)');
      grad.addColorStop(0.7, 'rgba(255, 255, 255, 0.15)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      fogCtx.fillStyle = grad;
    } else if (fogCtx) {
      fogCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    }
    if (fogCtx) {
      fogCtx.fillRect(0, 0, 64, 64);
    }
    const fogTexture = new THREE.CanvasTexture(fogCanvas);

    const fogMat = new THREE.PointsMaterial({
      color: "#9ca3af",
      size: 2.8,
      map: fogTexture,
      transparent: true,
      opacity: 0.10,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    this.groundFogParticles = new THREE.Points(fogGeo, fogMat);
    this.scene.add(this.groundFogParticles);

    // 2. Pre-allocate and reuse common geometries and materials to avoid GC stutters and GPU upload lag
    const floorGeo = new THREE.PlaneGeometry(1, 1);
    const floorMat = new THREE.MeshStandardMaterial({ 
      map: this.floorTexture,
      bumpMap: this.brickBump, // realistic stone relief bump map
      bumpScale: 0.07,
      color: "#2b2927", // dark warm charcoal stone/soil
      roughness: 0.85
    });

    const woodMat = new THREE.MeshStandardMaterial({ 
      map: this.woodTexture, 
      bumpMap: this.woodBump,
      bumpScale: 0.05,
      color: "#5c3a21", // rich dark antique oak wood color
      roughness: 0.85 
    });

    const pebbleGeo = new THREE.SphereGeometry(0.035, 5, 5);
    const pebbleMat = new THREE.MeshStandardMaterial({ color: "#4e4c4a", roughness: 0.9 }); // medium-dark wet stone grey
    
    const stemMGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.08, 4);
    const stemMMat = new THREE.MeshStandardMaterial({ color: "#4a3525", roughness: 0.95 });
    const capMGeo = new THREE.ConeGeometry(0.034, 0.044, 6);
    const capMMat = new THREE.MeshStandardMaterial({ color: "#f43f5e", roughness: 0.6 }); // red mushroom caps

    const stemFGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.12, 4);
    const stemFMat = new THREE.MeshStandardMaterial({ color: "#4ade80" });
    const petalsFGeo = new THREE.SphereGeometry(0.024, 6, 6);
    const petalsPinkMat = new THREE.MeshStandardMaterial({ color: "#581c87", roughness: 0.8 }); // Deep gothic purple
    const petalsGoldMat = new THREE.MeshStandardMaterial({ color: "#78350f", roughness: 0.8 }); // Muted autumn amber

    const wallGeo = new THREE.BoxGeometry(1.005, 1.28, 1.005);
    const wallCapGeo = new THREE.BoxGeometry(1.005, 0.05, 1.005);

    const hedgeMat = new THREE.MeshStandardMaterial({ 
      map: this.hedgeTexture, 
      color: "#0d120d", // Extremely dark, muted charcoal green (prevents walls being overly green)
      roughness: 0.98 
    });

    const capMat = new THREE.MeshStandardMaterial({
      map: this.brickTexture,
      bumpMap: this.brickBump,
      bumpScale: 0.05,
      color: "#64748b", // slate ruin cap
      roughness: 0.9
    });

    const { floors, width, height, currentFloor } = state;
    const grid = floors[currentFloor];

    for (let y = 0; y < height; y++) {
      const row = [];
      for (let x = 0; x < width; x++) {
        const cell = grid[y][x];
        const cellGroup = new THREE.Group();

        if (cell.type !== "wall") {
          // A. Path Floor Panel (Vibrant Garden Grass Lawn style)
          const floorMesh = new THREE.Mesh(floorGeo, floorMat);
          floorMesh.rotation.x = -Math.PI / 2;
          floorMesh.position.set(0, 0, 0);
          cellGroup.add(floorMesh);

          // Random Floor Details (ONLY small grass-like pieces and mushrooms)
          const randVal = Math.random();
          if (randVal < 0.15) {
            // Spooky Glowing Bioluminescent Mushrooms (Blue-cyan cap - performance optimized emissive material, no dynamic light)
            const mush = new THREE.Group();
            const stem = new THREE.Mesh(stemMGeo, stemMMat);
            stem.position.y = 0.04;
            
            const glowMushroomMat = new THREE.MeshStandardMaterial({
              color: "#1d4ed8", // deep rich blue
              emissive: "#1d4ed8", // glowing blue
              emissiveIntensity: 0.8, // soft glowing blue, avoids overexposure
              roughness: 0.95 // high roughness eliminates white specular washouts
            });
            const cap = new THREE.Mesh(capMGeo, glowMushroomMat);
            cap.position.y = 0.08;
            
            mush.add(stem, cap);
            mush.position.set((Math.random() - 0.5) * 0.35, 0, (Math.random() - 0.5) * 0.35);
            cellGroup.add(mush);
          } else if (randVal < 0.35) {
             // Creeping Dark Green Vines / Ivy Sprouts on the stone path
             const vineGroup = new THREE.Group();
             
             // Randomly choose between grass model or procedural leaves
             const chooseModel = Math.random();
              if (chooseModel < 0.60 && this.grassModel) {
                // Spawn actual FBX grass model!
                const grassClone = this.grassModel.clone();
                const s = 0.7 + Math.random() * 0.6;
                grassClone.scale.set(s * 0.0006, s * 0.0006, s * 0.0006);
                grassClone.position.set(0, 0, 0);
                grassClone.rotation.set(0, Math.random() * Math.PI, 0);
                vineGroup.add(grassClone);
              } else {
                // Fallback: Procedural green leaves (spheres)
                const leafMat = new THREE.MeshStandardMaterial({ 
                  map: this.hedgeTexture, 
                  color: "#0d120d", // deep rich muted charcoal green matching the walls
                  roughness: 0.95 
                });
                for (let i = 0; i < 3; i++) {
                  const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.04 + Math.random() * 0.02, 6, 6), leafMat);
                  leaf.scale.set(1.5, 0.2, 1.0);
                  leaf.position.set((Math.random() - 0.5) * 0.22, 0.005, (Math.random() - 0.5) * 0.22);
                  leaf.rotation.set(0, Math.random() * Math.PI, 0);
                  vineGroup.add(leaf);
                }
              }
              vineGroup.position.set((Math.random() - 0.5) * 0.35, 0, (Math.random() - 0.5) * 0.35);
              cellGroup.add(vineGroup);
          }



          // D. Wall Torches (Spawns a glowing warm torch on adjacent walls with a very low 5.5% probability)
          {
            const isWall = (tx, ty) => {
              if (tx < 0 || tx >= width || ty < 0 || ty >= height) return true;
              return grid[ty][tx].type === "wall";
            };

            const wallN = isWall(x, y - 1);
            const wallS = isWall(x, y + 1);
            const wallE = isWall(x + 1, y);
            const wallW = isWall(x - 1, y);

            if (wallN || wallS || wallE || wallW) {
              if (Math.random() < 0.055) { // 5.5% probability per path cell adjacent to a wall
                const walls = [];
                if (wallN) walls.push({ x: 0, z: -0.478, rotationY: 0 }); // mounts on North wall, faces South
                if (wallS) walls.push({ x: 0, z: 0.478, rotationY: Math.PI }); // mounts on South wall, faces North
                if (wallE) walls.push({ x: 0.478, z: 0, rotationY: -Math.PI / 2 }); // mounts on East wall, faces West
                if (wallW) walls.push({ x: -0.478, z: 0, rotationY: Math.PI / 2 }); // mounts on West wall, faces East

                if (walls.length > 0) {
                  const mount = walls[Math.floor(Math.random() * walls.length)];

                  const torchGroup = new THREE.Group();
                  torchGroup.name = "torch";

                  // 1. Backing metal wall plate (bracket)
                  const bracketGeo = new THREE.BoxGeometry(0.04, 0.10, 0.015);
                  const ironMat = new THREE.MeshPhongMaterial({ 
                    color: "#334155", // bright slate gray
                    emissive: "#291507", // warm orange glow response from fire
                    shininess: 30,
                    side: THREE.DoubleSide
                  });
                  const bracket = new THREE.Mesh(bracketGeo, ironMat);
                  bracket.position.set(0, 0.05, -0.01);
                  torchGroup.add(bracket);

                  // 2. Angled metal holding arm
                  const armGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.07, 6);
                  const arm = new THREE.Mesh(armGeo, ironMat);
                  arm.position.set(0, 0.03, 0.015);
                  arm.rotation.x = Math.PI / 4.0; // tilt outward
                  torchGroup.add(arm);

                  // 3. Create a unified tilted Stem Group (locks handle, cup, coal, and flame together)
                  const stemGroup = new THREE.Group();
                  stemGroup.position.set(0, 0.02, 0.015); // pivot base connecting to the arm

                  // A. Wooden handle/holder
                  const handleGeo = new THREE.CylinderGeometry(0.013, 0.009, 0.16, 8);
                  const handleMat = new THREE.MeshPhongMaterial({ 
                    color: "#5c4033", // warm brown wood
                    emissive: "#2d1608", // warm flame glow response
                    shininess: 10
                  });
                  const handle = new THREE.Mesh(handleGeo, handleMat);
                  handle.position.set(0, 0.08, 0); // centered along local Y axis
                  stemGroup.add(handle);

                  // B. Metal flared cup
                  const cupGeo = new THREE.CylinderGeometry(0.026, 0.014, 0.055, 8, 1, true);
                  const cup = new THREE.Mesh(cupGeo, ironMat);
                  cup.position.set(0, 0.15, 0); // positioned at the top of handle
                  stemGroup.add(cup);

                  // C. Burning glowing charcoal base (inside cup)
                  const coalGeo = new THREE.SphereGeometry(0.016, 8, 8);
                  const coalMat = new THREE.MeshPhongMaterial({
                    color: "#292524",
                    emissive: "#ef4444",
                    emissiveIntensity: 4.0,
                    shininess: 5
                  });
                  const coal = new THREE.Mesh(coalGeo, coalMat);
                  coal.position.set(0, 0.14, 0); // nestled inside the cup
                  stemGroup.add(coal);

                  // D. Layered volumetric flame (grouped to move dynamically relative to stem Y)
                  const flameGroup = new THREE.Group();
                  flameGroup.position.set(0, 0.175, 0); // positioned directly above the cup

                  // Outer flame (large soft orange glow)
                  const outerFlameGroup = new THREE.Group();
                  const outerBaseGeo = new THREE.SphereGeometry(0.024, 12, 12);
                  const outerFlameMat = new THREE.MeshBasicMaterial({ color: "#f97316", transparent: true, opacity: 0.70 });
                  const outerBase = new THREE.Mesh(outerBaseGeo, outerFlameMat);
                  outerBase.position.set(0, 0, 0);
                  outerFlameGroup.add(outerBase);

                  const outerTipGeo = new THREE.ConeGeometry(0.024, 0.072, 12);
                  const outerTip = new THREE.Mesh(outerTipGeo, outerFlameMat);
                  outerTip.position.set(0, 0.03, 0);
                  outerFlameGroup.add(outerTip);
                  flameGroup.add(outerFlameGroup);

                  // Inner flame (intense yellow core)
                  const innerFlameGroup = new THREE.Group();
                  const innerBaseGeo = new THREE.SphereGeometry(0.012, 12, 12);
                  const innerFlameMat = new THREE.MeshBasicMaterial({ color: "#fbbf24", transparent: true, opacity: 0.90 });
                  const innerBase = new THREE.Mesh(innerBaseGeo, innerFlameMat);
                  innerBase.position.set(0, 0, 0);
                  innerFlameGroup.add(innerBase);

                  const innerTipGeo = new THREE.ConeGeometry(0.012, 0.040, 12);
                  const innerTip = new THREE.Mesh(innerTipGeo, innerFlameMat);
                  innerTip.position.set(0, 0.02, 0);
                  innerFlameGroup.add(innerTip);
                  flameGroup.add(innerFlameGroup);

                  // Base hot blue core
                  const blueBaseGeo = new THREE.SphereGeometry(0.006, 8, 8);
                  const blueFlameMat = new THREE.MeshBasicMaterial({ color: "#0ea5e9", transparent: true, opacity: 0.75 });
                  const blueBase = new THREE.Mesh(blueBaseGeo, blueFlameMat);
                  blueBase.position.set(0, -0.012, 0);
                  flameGroup.add(blueBase);

                  stemGroup.add(flameGroup);

                  // E. PointLight (warm light source moving along with the tilted cup)
                  const torchLight = new THREE.PointLight("#ea580c", 2.2, 4.0);
                  torchLight.position.set(0, 0.19, 0.02);
                  torchLight.castShadow = false;
                  stemGroup.add(torchLight);

                  // Apply 30 degrees tilt forward to the entire stem assembly
                  stemGroup.rotation.x = Math.PI / 6.0;
                  torchGroup.add(stemGroup);

                  // Set position at eye level (y = 0.46)
                  torchGroup.position.set(mount.x, 0.46, mount.z);
                  torchGroup.rotation.y = mount.rotationY;

                  cellGroup.add(torchGroup);

                  // Register torch light and flame group for flickering animation
                  if (this.torches) {
                    this.torches.push({
                      light: torchLight,
                      flame: flameGroup,
                      baseIntensity: 2.2
                    });
                  }
                }
              }
            }
          }

          // C. Staircases
          if (cell.staircase) {
            const stairSubGroup = new THREE.Group();
            const steps = 5;
            const stepMat = new THREE.MeshStandardMaterial({ 
              color: cell.staircase === "down" ? "#4c0519" : "#022c22", 
              emissive: cell.staircase === "down" ? "#f43f5e" : "#10b981",
              emissiveIntensity: 0.7,
              roughness: 0.5 
            });
            for (let i = 0; i < steps; i++) {
              const stepGeo = new THREE.BoxGeometry(1, 1.25 / steps, 1 / steps);
              const stepMesh = new THREE.Mesh(stepGeo, stepMat);
              stepMesh.position.set(0, (i + 0.5) * (1.25 / steps) - 0.625, (i + 0.5) / steps - 0.5);
              stairSubGroup.add(stepMesh);
            }
            stairSubGroup.position.set(0, 0.625, 0);

            // Add a glowing vertical point light above the stairs to serve as a beacon in the fog
            const lightColor = cell.staircase === "down" ? "#f43f5e" : "#10b981";
            const stairLight = new THREE.PointLight(lightColor, 2.5, 3.5);
            stairLight.position.set(0, 0.40, 0); // positioned above the steps center
            stairSubGroup.add(stairLight);

            cellGroup.add(stairSubGroup);
          }

          // D. Exit Portal (Modern, beautiful gyroscopic dimensional portal aligned with corridor walls)
          if (cell.isExit) {
            const portalGroup = new THREE.Group();
            portalGroup.position.set(0, 0.58, 0);
            
            // Outer glowing purple ring
            const outerGeo = new THREE.TorusGeometry(0.32, 0.05, 8, 32);
            const outerMat = new THREE.MeshStandardMaterial({ 
              color: "#a855f7", 
              emissive: "#7e22ce", 
              emissiveIntensity: 2.5,
              roughness: 0.2,
              metalness: 0.8
            });
            const outerRing = new THREE.Mesh(outerGeo, outerMat);
            portalGroup.add(outerRing);
            
            // Inner glowing cyan ring (slightly smaller)
            const innerGeo = new THREE.TorusGeometry(0.24, 0.03, 8, 32);
            const innerMat = new THREE.MeshStandardMaterial({ 
              color: "#06b6d4", 
              emissive: "#0891b2", 
              emissiveIntensity: 2.5,
              roughness: 0.2,
              metalness: 0.8
            });
            const innerRing = new THREE.Mesh(innerGeo, innerMat);
            portalGroup.add(innerRing);
            
            // Vortex core disc (semi-transparent swirling dimensional membrane)
            const coreGeo = new THREE.CircleGeometry(0.22, 32);
            const coreMat = new THREE.MeshStandardMaterial({
              color: "#c084fc",
              emissive: "#a855f7",
              emissiveIntensity: 3.0,
              transparent: true,
              opacity: 0.7,
              depthWrite: false,
              side: THREE.DoubleSide
            });
            const coreMesh = new THREE.Mesh(coreGeo, coreMat);
            portalGroup.add(coreMesh);

            // Small orbital core energy spheres
            const energyGeo = new THREE.SphereGeometry(0.015, 6, 6);
            const energyMat = new THREE.MeshBasicMaterial({ color: "#22d3ee" });
            const energySpheres = [];
            for (let i = 0; i < 4; i++) {
              const sphere = new THREE.Mesh(energyGeo, energyMat);
              portalGroup.add(sphere);
              energySpheres.push(sphere);
            }
            
            // Soft cyan-purple point light for illumination - INCREASED RANGE/INTENSITY FOR GREATER VISIBILITY
            const portalLight = new THREE.PointLight("#a855f7", 4.0, 6.0);
            portalGroup.add(portalLight);

            // Glowing vertical beacon cylinder shooting up to the sky to make the exit highly visible from down the hall
            const beaconGeo = new THREE.CylinderGeometry(0.18, 0.18, 4.0, 16, 1, true);
            const beaconMat = new THREE.MeshBasicMaterial({
              color: "#c084fc",
              transparent: true,
              opacity: 0.25,
              side: THREE.DoubleSide,
              depthWrite: false
            });
            const beacon = new THREE.Mesh(beaconGeo, beaconMat);
            beacon.position.y = 1.5; // stand vertically centered
            portalGroup.add(beacon);
            
            // Set portal orientation based on corridor direction (faces the hallway path, blocks width)
            const isWall = (tx, ty) => {
              if (tx < 0 || tx >= width || ty < 0 || ty >= height) return true;
              return grid[ty][tx].type === "wall";
            };
            if (isWall(x - 1, y) && isWall(x + 1, y)) {
              portalGroup.rotation.y = 0; // Spans East-West (faces North-South corridor)
            } else if (isWall(x, y - 1) && isWall(x, y + 1)) {
              portalGroup.rotation.y = Math.PI / 2; // Spans North-South (faces East-West corridor)
            } else if (isWall(x - 1, y) || isWall(x + 1, y)) {
              portalGroup.rotation.y = 0;
            } else {
              portalGroup.rotation.y = Math.PI / 2;
            }

            cellGroup.add(portalGroup);
            
            // Save references for dynamic animation
            this.exitPortals.push({
              group: portalGroup,
              outerRing: outerRing,
              innerRing: innerRing,
              coreMesh: coreMesh,
              energySpheres: energySpheres,
              light: portalLight,
              timeOffset: Math.random() * 100
            });
          }

          // E. Chests (Detailed Wood & Gold Treasure Chest)
          if (cell.chest) {
            const chestSubGroup = new THREE.Group();
            chestSubGroup.userData = { type: "chest", x: x, y: y, cell: cell };

            if (this.chestModel) {
              // Load custom GLTF low-poly chest model!
              const chestClone = this.chestModel.clone();
              
              // Enable shadows and configure materials
              chestClone.traverse((child) => {
                if (child.isMesh) {
                  child.castShadow = true;
                  child.receiveShadow = true;
                  if (child.material) {
                    child.material.roughness = 0.8;
                  }
                }
              });

              // Scale to fit the 1x1 cell nicely (0.4 scale proportions it correctly with the corridor)
              chestClone.scale.set(0.4, 0.4, 0.4);
              // Make sure the bottom sits flat on the floor
              chestClone.position.set(0, 0.01, 0);
              // Find the lid part case-insensitively to animate opening without tipping the base
              let lid = null;
              chestClone.traverse((child) => {
                if (!lid && child.name && (child.name.toLowerCase().includes("top") || child.name.toLowerCase().includes("lid"))) {
                  lid = child;
                }
              });

              if (lid) {
                lid.userData.initialX = lid.rotation.x;
                this.chestLidGroups[`${x},${y}`] = lid;
              } else {
                // If lid is not found, fallback to animating the whole clone
                chestClone.userData.initialX = chestClone.rotation.x;
                this.chestLidGroups[`${x},${y}`] = chestClone;
              }

              chestSubGroup.add(chestClone);
            } else {
              // Fallback: Procedural Wood Base (Hollow box constructed from 5 panels)
              const bottom = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.02, 0.32), woodMat);
              bottom.position.y = 0.01;
              
              const wallF = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.20, 0.02), woodMat);
              wallF.position.set(0, 0.11, 0.15);
              
              const wallB = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.20, 0.02), woodMat);
              wallB.position.set(0, 0.11, -0.15);
              
              const wallL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.20, 0.28), woodMat);
              wallL.position.set(-0.20, 0.11, 0);
              
              const wallR = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.20, 0.28), woodMat);
              wallR.position.set(0.20, 0.11, 0);
              
              chestSubGroup.add(bottom, wallF, wallB, wallL, wallR);

              // Base Gold bands (Front & Back flat straps)
              const bandMat = new THREE.MeshStandardMaterial({ color: "#fbbf24", metalness: 0.9, roughness: 0.2 });
              const baseBandL_F = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.22, 0.01), bandMat);
              baseBandL_F.position.set(-0.14, 0.11, 0.16);
              const baseBandR_F = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.22, 0.01), bandMat);
              baseBandR_F.position.set(0.14, 0.11, 0.16);
              
              const baseBandL_B = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.22, 0.01), bandMat);
              baseBandL_B.position.set(-0.14, 0.11, -0.16);
              const baseBandR_B = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.22, 0.01), bandMat);
              baseBandR_B.position.set(0.14, 0.11, -0.16);
              
              chestSubGroup.add(baseBandL_F, baseBandR_F, baseBandL_B, baseBandR_B);

              // Chest Lid Group (Hinge placed at the back top edge: Z = -0.16, Y = 0.22)
              const lidGroup = new THREE.Group();
              lidGroup.position.set(0, 0.22, -0.16);

              // Lid geometry (half cylinder lying flat along X axis)
              const lidGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.42, 12, 1, false, 0, Math.PI);
              const lidMesh = new THREE.Mesh(lidGeo, woodMat);
              lidMesh.rotation.x = -Math.PI / 2; // lie flat
              lidMesh.rotation.z = Math.PI / 2; // length along X
              lidMesh.position.set(0, 0, 0.16);  // offset so local origin (hinge) is at the back
              lidGroup.add(lidMesh);

              // Cover plate for the flat bottom of the half-cylinder lid to make it look solid!
              const lidBottom = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.01, 0.32), woodMat);
              lidBottom.position.set(0, 0, 0.16);
              lidGroup.add(lidBottom);

              // Gold bands on the lid (Torus arcs wrapping over the curved lid)
              const torusGeo = new THREE.TorusGeometry(0.161, 0.012, 6, 12, Math.PI);
              const bandL = new THREE.Mesh(torusGeo, bandMat);
              bandL.rotation.y = Math.PI / 2; // lie in YZ plane
              bandL.position.set(-0.14, 0, 0.16); // concentric with lid
              
              const bandR = new THREE.Mesh(torusGeo, bandMat);
              bandR.rotation.y = Math.PI / 2;
              bandR.position.set(0.14, 0, 0.16);
              
              lidGroup.add(bandL, bandR);

              // Clasp lock on the lid (moves with the lid!)
              const lockGeo = new THREE.BoxGeometry(0.045, 0.07, 0.015);
              const lockMat = new THREE.MeshStandardMaterial({ color: "#9ca3af", metalness: 0.9, roughness: 0.1 });
              const lockMesh = new THREE.Mesh(lockGeo, lockMat);
              lockMesh.position.set(0, -0.025, 0.322); // positioned at the front-bottom edge of the lid
              lidGroup.add(lockMesh);

              chestSubGroup.add(lidGroup);
              this.chestLidGroups[`${x},${y}`] = lidGroup;
            }

            // Auto-rotate chest to face toward the open corridor path (away from walls)
            // In dead-ends (3 walls, 1 open), face the single open direction
            const chestIsWall = (tx, ty) => {
              if (tx < 0 || tx >= width || ty < 0 || ty >= height) return true;
              return grid[ty][tx].type === "wall";
            };
            const wallN = chestIsWall(x, y - 1);
            const wallS = chestIsWall(x, y + 1);
            const wallE = chestIsWall(x + 1, y);
            const wallW = chestIsWall(x - 1, y);
            
            // Build list of open directions
            const openDirs = [];
            if (!wallN) openDirs.push("N");
            if (!wallS) openDirs.push("S");
            if (!wallE) openDirs.push("E");
            if (!wallW) openDirs.push("W");
            
            // Face the chest toward the open path
            // rotation.y = 0 means facing +Z (south in our grid), PI means -Z (north), etc.
            if (openDirs.length === 1) {
              // Dead-end: face the only exit (where the player approaches from)
              if (openDirs[0] === "S") chestSubGroup.rotation.y = 0;              // face south (+Z)
              else if (openDirs[0] === "N") chestSubGroup.rotation.y = Math.PI;       // face north (-Z)
              else if (openDirs[0] === "W") chestSubGroup.rotation.y = -Math.PI / 2;  // face west (-X)
              else if (openDirs[0] === "E") chestSubGroup.rotation.y = Math.PI / 2;   // face east (+X)
            } else if (openDirs.length >= 2) {
              // Corridor or corner: mark as dynamically rotating to face the player's approach
              chestSubGroup.userData.dynamicFacing = true;
              
              // Set initial fallback rotation based on first open direction
              if (openDirs.includes("S")) chestSubGroup.rotation.y = 0;
              else if (openDirs.includes("N")) chestSubGroup.rotation.y = Math.PI;
              else if (openDirs.includes("W")) chestSubGroup.rotation.y = -Math.PI / 2;
              else if (openDirs.includes("E")) chestSubGroup.rotation.y = Math.PI / 2;
            }

            this.chestGroups[`${x},${y}`] = chestSubGroup;
            chestSubGroup.position.set(0, 0, 0);
            cellGroup.add(chestSubGroup);
          }

          // F. NPCs (Detailed Characters instead of placeholders)
          if (cell.npc) {
            const npcSubGroup = new THREE.Group();
            npcSubGroup.userData = { type: "npc", x: x, y: y, cell: cell };
            this.npcGroups[`${x},${y}`] = npcSubGroup;
            if (cell.npc.id === "mouse") {
              // 🐭 Detailed Realistic Low-Poly Mouse/Rat Model
              const furMat = new THREE.MeshStandardMaterial({ color: "#54463c", roughness: 0.95 }); // dark warm brown fur
              const skinMat = new THREE.MeshStandardMaterial({ color: "#f87171", roughness: 0.85 }); // soft pink skin for snout, tail, ears
              const eyeMat = new THREE.MeshStandardMaterial({ 
                color: "#ef4444", 
                emissive: "#dc2626", 
                emissiveIntensity: 3.0, // glowing red eyes in the dark!
                roughness: 0.2 
              });
              const whiskerMat = new THREE.MeshBasicMaterial({ color: "#1f2937" }); // dark slate whiskers

              // 1. Tiny legs with claws/paws
              const legGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.035, 5);
              const legLF = new THREE.Mesh(legGeo, furMat); legLF.position.set(-0.03, 0.015, 0.04);
              const legRF = new THREE.Mesh(legGeo, furMat); legRF.position.set(0.03, 0.015, 0.04);
              const legLB = new THREE.Mesh(legGeo, furMat); legLB.position.set(-0.04, 0.015, -0.04);
              const legRB = new THREE.Mesh(legGeo, furMat); legRB.position.set(0.04, 0.015, -0.04);
              
              // Small pink paws
              const pawGeo = new THREE.SphereGeometry(0.01, 5, 5);
              const pawLF = new THREE.Mesh(pawGeo, skinMat); pawLF.position.set(-0.03, 0.002, 0.052); pawLF.scale.set(1, 0.4, 1.5);
              const pawRF = new THREE.Mesh(pawGeo, skinMat); pawRF.position.set(0.03, 0.002, 0.052); pawRF.scale.set(1, 0.4, 1.5);
              const pawLB = new THREE.Mesh(pawGeo, skinMat); pawLB.position.set(-0.04, 0.002, -0.052); pawLB.scale.set(1, 0.4, 1.5);
              const pawRB = new THREE.Mesh(pawGeo, skinMat); pawRB.position.set(0.04, 0.002, -0.052); pawRB.scale.set(1, 0.4, 1.5);
              
              npcSubGroup.add(legLF, legRF, legLB, legRB, pawLF, pawRF, pawLB, pawRB);

              // 2. Tear-shaped organic body
              const body = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), furMat);
              body.scale.set(1.4, 0.8, 0.85); // teardrop shape
              body.position.set(0, 0.06, 0);
              npcSubGroup.add(body);

              // 3. Head (tapering forward)
              const head = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), furMat);
              head.position.set(0.08, 0.085, 0);
              head.scale.set(1.2, 1.0, 1.0);
              npcSubGroup.add(head);

              // 4. Muzzle/Snout
              const snout = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.05, 8), furMat);
              snout.rotation.z = -Math.PI / 2;
              snout.position.set(0.13, 0.075, 0);
              npcSubGroup.add(snout);

              // 5. Pink Nose Tip
              const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 6), skinMat);
              noseTip.position.set(0.156, 0.075, 0);
              npcSubGroup.add(noseTip);

              // 6. Glowing Red Eyes
              const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.01, 8, 8), eyeMat);
              eyeL.position.set(0.125, 0.115, 0.032);
              const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.01, 8, 8), eyeMat);
              eyeR.position.set(0.125, 0.115, -0.032);
              npcSubGroup.add(eyeL, eyeR);

              // 7. Dynamic layered ears (outer fur + inner pink)
              const earGroupL = new THREE.Group();
              const earOutL = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.004, 8), furMat);
              earOutL.rotation.x = Math.PI / 2;
              const earInL = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.004, 8), skinMat);
              earInL.rotation.x = Math.PI / 2;
              earInL.position.z = 0.002; // layer inside
              earGroupL.add(earOutL, earInL);
              earGroupL.rotation.set(0.2, -0.4, 0);
              earGroupL.position.set(0.07, 0.125, 0.038);

              const earGroupR = new THREE.Group();
              const earOutR = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.004, 8), furMat);
              earOutR.rotation.x = Math.PI / 2;
              const earInR = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.004, 8), skinMat);
              earInR.rotation.x = Math.PI / 2;
              earInR.position.z = -0.002; // layer inside
              earGroupR.add(earOutR, earInR);
              earGroupR.rotation.set(-0.2, 0.4, 0);
              earGroupR.position.set(0.07, 0.125, -0.038);

              npcSubGroup.add(earGroupL, earGroupR);

              // 8. Natural curved segmented pink tail
              const tailGroup = new THREE.Group();
              const t1 = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.004, 0.08, 5), skinMat);
              t1.position.set(0, 0.03, 0);
              t1.rotation.z = -Math.PI / 6;
              const t2 = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.002, 0.09, 5), skinMat);
              t2.position.set(0.02, 0.08, 0.01);
              t2.rotation.z = Math.PI / 4;
              tailGroup.add(t1, t2);
              tailGroup.position.set(-0.10, 0.02, 0);
              npcSubGroup.add(tailGroup);

              // 9. Detailed whiskers
              for (let i = -1; i <= 1; i++) {
                const whL = new THREE.Mesh(new THREE.CylinderGeometry(0.001, 0.001, 0.07, 4), whiskerMat);
                whL.rotation.x = Math.PI / 2;
                whL.rotation.y = i * 0.25;
                whL.position.set(0.13, 0.075, 0.02);
                
                const whR = new THREE.Mesh(new THREE.CylinderGeometry(0.001, 0.001, 0.07, 4), whiskerMat);
                whR.rotation.x = Math.PI / 2;
                whR.rotation.y = -i * 0.25;
                whR.position.set(0.13, 0.075, -0.02);
                npcSubGroup.add(whL, whR);
              }
             } else if (cell.npc.id === "traveler") {
               if (this.travelerModel) {
                 const clone = this.travelerModel.clone();
                 clone.position.set(0, 0, 0);
                 npcSubGroup.add(clone);
               } else {
                 const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.45, 8), new THREE.MeshStandardMaterial({ color: "#1a4731", roughness: 0.85 }));
                 coat.position.y = 0.50; npcSubGroup.add(coat);
                 const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), new THREE.MeshStandardMaterial({ color: "#dbb896", roughness: 0.8 }));
                 head.position.y = 0.85; npcSubGroup.add(head);
                 const hood = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: "#14532d", roughness: 0.9 }));
                 hood.position.set(0, 0.88, -0.02); npcSubGroup.add(hood);
                 const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 1.1, 6), new THREE.MeshStandardMaterial({ color: "#5c3310", roughness: 0.85 }));
                 staff.position.set(-0.20, 0.50, 0.18); npcSubGroup.add(staff);
               }
             } else if (cell.npc.id === "merchant") {
               if (this.merchantModel) {
                 const clone = this.merchantModel.clone();
                 clone.position.set(0, 0, 0);
                 npcSubGroup.add(clone);
               } else {
                 const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.20, 0.48, 8), new THREE.MeshStandardMaterial({ color: "#4c1d95", roughness: 0.8 }));
                 robe.position.y = 0.49; npcSubGroup.add(robe);
                 const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), new THREE.MeshStandardMaterial({ color: "#dbb896", roughness: 0.8 }));
                 head.position.y = 0.85; npcSubGroup.add(head);
                 const turban = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), new THREE.MeshStandardMaterial({ color: "#b45309", roughness: 0.6 }));
                 turban.position.y = 0.95; turban.scale.set(1.1, 0.75, 1.1); npcSubGroup.add(turban);
               }
            } else if (cell.npc.id === "well") {
              // Stone Well
              const wellBase = new THREE.Mesh(
                new THREE.CylinderGeometry(0.25, 0.25, 0.20, 12),
                new THREE.MeshStandardMaterial({ 
                  map: this.brickTexture, 
                  bumpMap: this.brickBump,
                  bumpScale: 0.06,
                  color: "#888888",
                  roughness: 0.9 
                })
              );
              wellBase.position.y = 0.1;
              npcSubGroup.add(wellBase);

              // Water
              const water = new THREE.Mesh(
                new THREE.CylinderGeometry(0.21, 0.21, 0.02, 10),
                new THREE.MeshStandardMaterial({ color: "#2563eb", roughness: 0.1, metalness: 0.8 })
              );
              water.position.y = 0.18;
              npcSubGroup.add(water);

              // Wooden posts & roof
              const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.38, 6), woodMat);
              postL.position.set(-0.2, 0.28, 0);
              const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.38, 6), woodMat);
              postR.position.set(0.2, 0.28, 0);
              npcSubGroup.add(postL, postR);

              const roof = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.03, 0.32), woodMat);
              roof.position.set(0, 0.46, 0);
              npcSubGroup.add(roof);
             } else if (cell.npc.id === "child") {
               if (this.childModel) {
                 const clone = this.childModel.clone();
                 clone.position.set(0, 0, 0);
                 npcSubGroup.add(clone);
               } else {
                 const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.24, 8), new THREE.MeshStandardMaterial({ color: "#ea580c", roughness: 0.8 }));
                 torso.position.y = 0.32; npcSubGroup.add(torso);
                 const head = new THREE.Mesh(new THREE.SphereGeometry(0.10, 10, 10), new THREE.MeshStandardMaterial({ color: "#f5d5b8", roughness: 0.8 }));
                 head.position.y = 0.56; npcSubGroup.add(head);
                 const cap = new THREE.Mesh(new THREE.SphereGeometry(0.105, 10, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: "#dc2626", roughness: 0.75 }));
                 cap.position.set(0, 0.60, 0); npcSubGroup.add(cap);
               }
             } else {
              const npcMesh = new THREE.Mesh(
                new THREE.SphereGeometry(0.10, 12, 12),
                new THREE.MeshStandardMaterial({ color: "#10b981", emissive: "#065f46", roughness: 0.2 })
              );
              npcMesh.position.y = 0.10;
              npcSubGroup.add(npcMesh);
            }
            // Auto-rotate NPC to face toward the player's approach direction (open corridor)
            const npcIsWall = (tx, ty) => {
              if (tx < 0 || tx >= width || ty < 0 || ty >= height) return true;
              return grid[ty][tx].type === "wall";
            };
            const nWallN = npcIsWall(x, y - 1);
            const nWallS = npcIsWall(x, y + 1);
            const nWallE = npcIsWall(x + 1, y);
            const nWallW = npcIsWall(x - 1, y);
            
            // Face toward the open side (where player approaches from)
            if (!nWallS && nWallN) npcSubGroup.rotation.y = 0;               // Face south
            else if (!nWallN && nWallS) npcSubGroup.rotation.y = Math.PI;    // Face north
            else if (!nWallW && nWallE) npcSubGroup.rotation.y = Math.PI / 2;  // Face west
            else if (!nWallE && nWallW) npcSubGroup.rotation.y = -Math.PI / 2; // Face east
            // Dead-end: face the only open direction
            else if (nWallN && nWallE && nWallW && !nWallS) npcSubGroup.rotation.y = 0;
            else if (nWallS && nWallE && nWallW && !nWallN) npcSubGroup.rotation.y = Math.PI;
            else if (nWallN && nWallS && nWallW && !nWallE) npcSubGroup.rotation.y = -Math.PI / 2;
            else if (nWallN && nWallS && nWallE && !nWallW) npcSubGroup.rotation.y = Math.PI / 2;

            cellGroup.add(npcSubGroup);
          }

          // F2. Clues (Mounted on adjacent wall at eye level)
          if (cell.puzzleClue) {
            const clueSubGroup = new THREE.Group();
            clueSubGroup.userData = { type: "clue", x: x, y: y, cell: cell };

            // Find an adjacent wall to mount the clue paper on
            let offsetX = 0, offsetZ = 0, rotY = 0;
            const dirs = [
              { dx: 0, dy: -1, ox: 0, oz: -0.49, r: 0 },         // North wall (clue faces South)
              { dx: 0, dy: 1, ox: 0, oz: 0.49, r: Math.PI },      // South wall (clue faces North)
              { dx: 1, dy: 0, ox: 0.49, oz: 0, r: -Math.PI / 2 },  // East wall (clue faces West)
              { dx: -1, dy: 0, ox: -0.49, oz: 0, r: Math.PI / 2 }  // West wall (clue faces East)
            ];
            
            let mounted = false;
            for (const d of dirs) {
              const nx = x + d.dx;
              const ny = y + d.dy;
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                if (grid[ny][nx].type === "wall") {
                  offsetX = d.ox;
                  offsetZ = d.oz;
                  rotY = d.r;
                  mounted = true;
                  break;
                }
              }
            }

            if (!mounted) {
              // Fallback to floor paper note
              const paperGeo = new THREE.BoxGeometry(0.24, 0.02, 0.32);
              const paperMat = new THREE.MeshPhongMaterial({ color: "#fef08a", shininess: 5 });
              const paperMesh = new THREE.Mesh(paperGeo, paperMat);
              paperMesh.position.set(0, 0.01, 0);
              clueSubGroup.add(paperMesh);
            } else {
              // Detailed Wall Signboard backing board
              const boardGeo = new THREE.BoxGeometry(0.24, 0.32, 0.015);
              const boardMesh = new THREE.Mesh(boardGeo, woodMat);
              
              // Parchment paper note with dynamic canvas text texture
              const paperGeo = new THREE.BoxGeometry(0.20, 0.28, 0.02);
              const paperMat = new THREE.MeshStandardMaterial({ 
                map: makeClueTexture(cell.puzzleClue),
                roughness: 0.95
              });
              const paperMesh = new THREE.Mesh(paperGeo, paperMat);
              paperMesh.position.set(0, 0, 0.005);
              
              const noteGroup = new THREE.Group();
              noteGroup.add(boardMesh, paperMesh);
              noteGroup.position.set(offsetX, 0.64, offsetZ);
              noteGroup.rotation.y = rotY;
              clueSubGroup.add(noteGroup);
            }

            const clueLight = new THREE.PointLight("#fbbf24", 1.2, 1.6);
            clueLight.position.set(offsetX, 0.64, offsetZ);
            clueSubGroup.add(clueLight);

            cellGroup.add(clueSubGroup);
          }

          // G. Obstacles (Stylized premium models instead of single blocks)
          if (cell.obstacle && !cell.obstacle.resolved) {
            const obsSubGroup = new THREE.Group();
            obsSubGroup.userData = { type: "obstacle", x: x, y: y, cell: cell };

            const type = cell.obstacle.type;
            if (type === "gate") {
              const ironMat = new THREE.MeshStandardMaterial({ color: "#27272a", metalness: 0.85, roughness: 0.2 });
              const goldTipMat = new THREE.MeshStandardMaterial({ color: "#eab308", metalness: 0.9, roughness: 0.1 });
              
              // Vertical bars (spanning from -0.48 to +0.48, touching the 1.0 corridor walls)
              for (let i = -0.48; i <= 0.48; i += 0.12) {
                const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.25), ironMat);
                bar.position.set(i, 0.625, 0);
                obsSubGroup.add(bar);
                
                // Gold spikes at the top (touching the ceiling)
                const spike = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.06, 6), goldTipMat);
                spike.position.set(i, 1.28, 0);
                obsSubGroup.add(spike);
              }
              // Horizontal crossbeams (top & bottom, scaled to block the 1.0 corridor)
              const beamTop = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.024, 0.024), ironMat);
              beamTop.position.set(0, 1.20, 0);
              const beamBottom = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.024, 0.024), ironMat);
              beamBottom.position.set(0, 0.08, 0);
              obsSubGroup.add(beamTop, beamBottom);
            } else if (type === "ivy") {
              // 🌿 Realistic Overgrown Thorny Ivy/Foliage Barricade
              const branchMat = new THREE.MeshStandardMaterial({ color: "#2d1a10", roughness: 0.95 }); // dark brown woody branches
              const leafMat = new THREE.MeshStandardMaterial({ 
                map: this.hedgeTexture, 
                color: "#1e3f20", // rich organic forest green tint
                roughness: 0.95 
              });
              const berryMat = new THREE.MeshStandardMaterial({ 
                color: "#ef4444", 
                emissive: "#b91c1c", 
                emissiveIntensity: 0.8,
                roughness: 0.4 
              });

              // 1. Cross-barrier branches (thorny vines)
              const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.02, 1.1, 6), branchMat);
              b1.position.set(0, 0.45, 0);
              b1.rotation.z = Math.PI / 4.5;
              b1.rotation.y = Math.PI / 8;
              const b2 = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.02, 1.1, 6), branchMat);
              b2.position.set(0, 0.45, 0);
              b2.rotation.z = -Math.PI / 4.5;
              b2.rotation.y = -Math.PI / 8;
              const b3 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.9, 6), branchMat);
              b3.position.set(0, 0.7, 0.05);
              b3.rotation.x = Math.PI / 2.2;
              obsSubGroup.add(b1, b2, b3);

              // 2. Multi-sphere overlapping leafy hedge structure (mapped with this.hedgeTexture)
              const foliageOffsets = [
                { x: 0, y: 0.25, z: 0, r: 0.22 },
                { x: -0.16, y: 0.22, z: 0.1, r: 0.18 },
                { x: 0.16, y: 0.22, z: -0.1, r: 0.18 },
                { x: -0.08, y: 0.42, z: -0.06, r: 0.16 },
                { x: 0.08, y: 0.42, z: 0.06, r: 0.16 },
                
                { x: -0.28, y: 0.35, z: 0, r: 0.15 },
                { x: 0.28, y: 0.35, z: 0, r: 0.15 },
                { x: 0, y: 0.55, z: -0.04, r: 0.16 },
                { x: -0.14, y: 0.58, z: 0.04, r: 0.13 },
                { x: 0.14, y: 0.58, z: -0.04, r: 0.13 },
                
                { x: -0.22, y: 0.72, z: 0.02, r: 0.14 },
                { x: 0.22, y: 0.72, z: -0.02, r: 0.14 },
                { x: 0, y: 0.85, z: 0, r: 0.15 }
              ];
              for (const o of foliageOffsets) {
                const foliage = new THREE.Mesh(new THREE.SphereGeometry(o.r, 8, 8), leafMat);
                foliage.position.set(o.x, o.y, o.z);
                // Random scale/rotation to make texture mapping look organic and non-repeating
                foliage.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
                foliage.scale.set(1.0, 0.95 + Math.random() * 0.1, 1.0);
                obsSubGroup.add(foliage);
              }

              // 3. Small poison berries (gives detail and color variation)
              const berryOffsets = [
                { x: -0.1, y: 0.3, z: 0.15 },
                { x: 0.1, y: 0.35, z: 0.12 },
                { x: -0.2, y: 0.45, z: -0.08 },
                { x: 0.2, y: 0.5, z: 0.06 },
                { x: 0, y: 0.65, z: 0.12 },
                { x: -0.08, y: 0.75, z: -0.08 },
                { x: 0.08, y: 0.8, z: 0.08 }
              ];
              for (const b of berryOffsets) {
                const berry = new THREE.Mesh(new THREE.SphereGeometry(0.016, 5, 5), berryMat);
                berry.position.set(b.x, b.y, b.z);
                 obsSubGroup.add(berry);
               }
            } else if (type === "barricade") {
              // Crossed planks bound together (widened to 0.95 to block the corridor)
              const plank1 = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.12, 0.04), woodMat);
              plank1.position.y = 0.32;
              plank1.rotation.z = Math.PI / 6;
              
              const plank2 = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.12, 0.04), woodMat);
              plank2.position.y = 0.32;
              plank2.rotation.z = -Math.PI / 6;
              plank2.position.z = 0.02; // layer slightly in front
              
              obsSubGroup.add(plank1, plank2);
              
              // Center metal connection rivet
              const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.06), new THREE.MeshStandardMaterial({ color: "#9ca3af", metalness: 0.8 }));
              bolt.rotation.x = Math.PI / 2;
              bolt.position.set(0, 0.32, 0.04);
              obsSubGroup.add(bolt);
            } else if (type === "chasm") {
              const chasm = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.85), new THREE.MeshBasicMaterial({ color: "#000" }));
              chasm.rotation.x = -Math.PI / 2;
              chasm.position.y = 0.01;
              obsSubGroup.add(chasm);
            } else if (type === "codeLock") {
              // Detailed Code Lock Gate: iron bars + a number pad panel in the center
              const ironMat = new THREE.MeshStandardMaterial({ color: "#27272a", metalness: 0.85, roughness: 0.2 });
              
              // Full-width iron bars (same as gate style)
              for (let i = -0.48; i <= 0.48; i += 0.16) {
                const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.25), ironMat);
                bar.position.set(i, 0.625, 0);
                obsSubGroup.add(bar);
              }
              // Horizontal crossbeams
              const beamT = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.024, 0.024), ironMat);
              beamT.position.set(0, 1.20, 0);
              const beamB = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.024, 0.024), ironMat);
              beamB.position.set(0, 0.08, 0);
              obsSubGroup.add(beamT, beamB);
              
              // Center control panel backing (dark metal plate)
              const panelBack = new THREE.Mesh(
                new THREE.BoxGeometry(0.28, 0.36, 0.03),
                new THREE.MeshStandardMaterial({ color: "#1c1917", metalness: 0.7, roughness: 0.3 })
              );
              panelBack.position.set(0, 0.58, 0.02);
              obsSubGroup.add(panelBack);
              
              // Green LCD screen
              const screenMat = new THREE.MeshStandardMaterial({ color: "#065f46", emissive: "#047857", emissiveIntensity: 0.6, roughness: 0.1 });
              const screen = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.08, 0.005), screenMat);
              screen.position.set(0, 0.70, 0.04);
              obsSubGroup.add(screen);
              
              // Number pad buttons (3x3 grid + bottom row)
              const btnMat = new THREE.MeshStandardMaterial({ color: "#a8a29e", metalness: 0.5, roughness: 0.4 });
              const btnSize = 0.04;
              for (let row = 0; row < 3; row++) {
                for (let col = 0; col < 3; col++) {
                  const btn = new THREE.Mesh(new THREE.BoxGeometry(btnSize, btnSize, 0.01), btnMat);
                  btn.position.set(
                    (col - 1) * 0.06,
                    0.56 - row * 0.06,
                    0.04
                  );
                  obsSubGroup.add(btn);
                }
              }
              // Enter button (wider, green)
              const enterBtn = new THREE.Mesh(
                new THREE.BoxGeometry(0.12, 0.04, 0.01),
                new THREE.MeshStandardMaterial({ color: "#16a34a", emissive: "#15803d", emissiveIntensity: 0.3, metalness: 0.5 })
              );
              enterBtn.position.set(0, 0.38, 0.04);
              obsSubGroup.add(enterBtn);
              
              // Red warning light on top
              const warningLight = new THREE.Mesh(
                new THREE.SphereGeometry(0.02, 8, 8),
                new THREE.MeshStandardMaterial({ color: "#ef4444", emissive: "#dc2626", emissiveIntensity: 0.8 })
              );
              warningLight.position.set(0, 0.80, 0.03);
              obsSubGroup.add(warningLight);
              
              // Small glow from the panel
              const panelGlow = new THREE.PointLight("#10b981", 0.5, 1.5);
              panelGlow.position.set(0, 0.58, 0.15);
              obsSubGroup.add(panelGlow);
            } else {
              // Unknown obstacle type fallback
              const keyPlate = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.26, 0.04), new THREE.MeshStandardMaterial({ color: "#ef4444" }));
              keyPlate.position.y = 0.36;
              obsSubGroup.add(keyPlate);
            }
            
            // Determine orientation of gate/barricade/codeLock obstacles based on adjacent regions and walls
            if (type === "gate" || type === "barricade" || type === "codeLock") {
              const isWall = (tx, ty) => {
                if (tx < 0 || tx >= width || ty < 0 || ty >= height) return true;
                return grid[ty][tx].type === "wall";
              };
              
              const reg = cell.region;
              
              // 1. Check if this is a region boundary node. If so, align perpendicular to the entry direction from the previous region.
              let prevRegionNeighbor = null;
              const borderDirs = [
                { dx: 0, dy: -1, dir: "N" },
                { dx: 0, dy: 1, dir: "S" },
                { dx: -1, dy: 0, dir: "W" },
                { dx: 1, dy: 0, dir: "E" }
              ];
              
              for (const d of borderDirs) {
                const nx = x + d.dx;
                const ny = y + d.dy;
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                  const neighborCell = grid[ny][nx];
                  if (neighborCell && neighborCell.type === "floor" && neighborCell.region < reg && neighborCell.region !== -1) {
                    prevRegionNeighbor = d.dir;
                    break;
                  }
                }
              }
              
              if (prevRegionNeighbor) {
                if (prevRegionNeighbor === "N" || prevRegionNeighbor === "S") {
                  obsSubGroup.rotation.y = 0; // blocks North-South corridor passage
                } else {
                  obsSubGroup.rotation.y = Math.PI / 2; // blocks East-West corridor passage
                }
              } else {
                // 2. Fallback to normal surrounding wall check
                if (isWall(x - 1, y) && isWall(x + 1, y)) {
                  // East/West are both walls: corridor runs North/South. Run East/West (rotation 0) to block.
                  obsSubGroup.rotation.y = 0;
                } else if (isWall(x, y - 1) && isWall(x, y + 1)) {
                  // North/South are both walls: corridor runs East/West. Run North/South (rotation 90deg) to block.
                  obsSubGroup.rotation.y = Math.PI / 2;
                } else if (isWall(x - 1, y) || isWall(x + 1, y)) {
                  // Fallback: West/East is wall, meaning corridor runs North/South. Run East/West (rotation 0) to block.
                  obsSubGroup.rotation.y = 0;
                } else {
                  // North/South is wall, meaning corridor runs East-West. Run North/South (rotation 90deg) to block.
                  obsSubGroup.rotation.y = Math.PI / 2;
                }
              }
            }

            cellGroup.add(obsSubGroup);
            this.obstacleMeshes[`${x},${y}`] = obsSubGroup;
          }

        } else {
          // H. Solid Wall (🌿 Overgrown Ruins style: continuous ivy hedges capped with stone)
          const colGroup = new THREE.Group();

          // 1. Thick ivy leaf block filling the cell to form continuous corridors
          const wallBlock = new THREE.Mesh(wallGeo, hedgeMat);
          wallBlock.position.set(0, 0.64, 0);
          colGroup.add(wallBlock);

          // 2. Stone brick cap on top of the hedge wall (placed at Y=1.305 to eliminate coplanar Z-fighting glitch)
          const stoneCap = new THREE.Mesh(wallCapGeo, capMat);
          stoneCap.position.set(0, 1.305, 0);
          colGroup.add(stoneCap);

          cellGroup.add(colGroup);
        }

        // Translate cell group to align exactly with physics AABB grid (centered at x+0.5, y+0.5)
        cellGroup.position.set(x + 0.5, 0, y + 0.5);
        this.scene.add(cellGroup);
        row.push(cellGroup);
      }
      this.cellGroups.push(row);
    }

    // 4. Create First Person Player (Sleeve & Hand holding Kerosene Lantern attached to Camera)
    // Clean up animation mixer from previous scene
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer = null;
    }
    // Clear camera children
    while (this.camera.children.length > 0) {
      this.camera.remove(this.camera.children[0]);
    }
    this.scene.add(this.camera);

    const flameMat = new THREE.MeshBasicMaterial({ color: "#fffbeb" }); // hot white-gold flame core

    this.playerMesh = new THREE.Group();
    
    // Position viewmodel closer to camera (eliminating floating look)
    this.playerMesh.position.set(0.08, -0.09, -0.12);
    this.playerMesh.rotation.y = -Math.PI / 10;
    this.playerMesh.scale.set(0.8, 0.8, 0.8);

    // D. Tactical Sleeve & Glove (Procedural hand holding the flashlight)
    const sleeveMat = new THREE.MeshStandardMaterial({ color: "#1e293b", roughness: 0.85 }); // Slate dark sleeve
    const gloveMat = new THREE.MeshStandardMaterial({ color: "#0f172a", roughness: 0.9, metalness: 0.1 }); // Matte dark grey/black glove

    // 1. Sleeve (Forearm extending from bottom-right corner)
    const sleeve = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.02, 0.18, 8),
      sleeveMat
    );
    sleeve.rotation.x = Math.PI / 2.3;
    sleeve.rotation.y = -Math.PI / 12;
    sleeve.position.set(0.03, -0.01, 0.05);
    this.playerMesh.add(sleeve);

    // 2. Glove Palm (main grip body)
    const gloveBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.025, 0.032),
      gloveMat
    );
    gloveBody.position.set(0.01, 0.01, -0.02);
    gloveBody.rotation.set(0, -Math.PI / 8, 0);
    this.playerMesh.add(gloveBody);

    // 3. Fingers wrapping around the flashlight handle
    const f1 = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.007, 0.007), gloveMat);
    f1.position.set(0.006, 0.015, -0.03);
    f1.rotation.y = -Math.PI / 8;
    
    const f2 = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.007, 0.007), gloveMat);
    f2.position.set(0.006, 0.015, -0.045);
    f2.rotation.y = -Math.PI / 8;
    
    const f3 = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.007, 0.007), gloveMat);
    f3.position.set(0.006, 0.015, -0.06);
    f3.rotation.y = -Math.PI / 8;

    const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.007, 0.014), gloveMat);
    thumb.position.set(-0.008, 0.022, -0.03);
    
    this.playerMesh.add(f1, f2, f3, thumb);

    // C. Flashlight (3D asset or procedural fallback)
    const flashlightGroup = new THREE.Group();

    if (this.flashlightModel) {
      // FlashLight_001: standard cylindrical flashlight
      // Rotate +90° on Y so the lens/head (at -X) points forward (-Z)
      const modelClone = this.flashlightModel.clone();
      modelClone.scale.set(0.65, 0.65, 0.65);
      modelClone.rotation.set(0, Math.PI / 2, 0); // X-axis body → -Z forward (lens end forward)
      modelClone.position.set(0, 0.015, -0.04);
      flashlightGroup.add(modelClone);

      // Glowing lens at front tip (pointing away from camera, at -0.04 - 0.18*0.65 = -0.157)
      this.lanternFlame = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.003, 8),
        flameMat
      );
      this.lanternFlame.rotation.x = Math.PI / 2;
      this.lanternFlame.position.set(0, 0.015, -0.158);
      flashlightGroup.add(this.lanternFlame);
    } else {
      // Procedural flashlight fallback - simple cylinder pointing forward
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.20, 8),
        new THREE.MeshStandardMaterial({ color: "#1f2937", metalness: 0.8, roughness: 0.2 })
      );
      body.rotation.x = Math.PI / 2;
      body.position.set(0, 0.015, -0.04);
      flashlightGroup.add(body);

      this.lanternFlame = new THREE.Mesh(
        new THREE.CylinderGeometry(0.022, 0.022, 0.004, 8),
        flameMat
      );
      this.lanternFlame.rotation.x = Math.PI / 2;
      this.lanternFlame.position.set(0, 0.015, -0.142);
      flashlightGroup.add(this.lanternFlame);
    }

    flashlightGroup.position.set(0, 0.015, -0.01);
    this.playerMesh.add(flashlightGroup);
    this.camera.add(this.playerMesh);

    // Enable shadow casting and receiving for all meshes in the scene graph
    this.scene.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
  }

  draw(state, interpolationFactor = 0.22) {
    this.lastState = state;
    if (this.clock && this.mixers) {
      const dt = this.clock.getDelta();
      this.mixers.forEach(mixer => {
        try { mixer.update(dt); } catch(e){}
      });
    }
    const { floors, width, height, player, currentFloor, visitedMap } = state;
    const grid = floors[currentFloor];

    // Exit pointer lock if the game is in a modal state to allow mouse clicks on PC
    if (state.gameState !== "playing" && document.pointerLockElement === this.canvas) {
      document.exitPointerLock();
    }

    // 0. Update HUD Compass Needle dynamically at 60fps (smooth relative rotation to exit)
    if (state.gameState === "playing") {
      const compassNeedle = document.getElementById("compass-needle");
      if (compassNeedle && compassNeedle.style && state.exitCell) {
        const dx = state.exitCell.x - player.visualX;
        const dy = state.exitCell.y - player.visualY;
        const worldAngle = Math.atan2(dy, dx);
        const relativeAngle = (worldAngle - player.angle) * (180 / Math.PI);
        compassNeedle.style.transform = `rotate(${relativeAngle}deg)`;
      }
    }

    // Update warm wall torches flickering effect (pulsing flame scales and PointLight intensities)
    if (this.torches && this.torches.length > 0) {
      const time = performance.now() * 0.005;
      let minTorchDist = 999.0;
      this.torches.forEach((t, i) => {
        const flicker = Math.sin(time * 3.3 + i) * 0.18 + Math.cos(time * 6.7 + i * 2.1) * 0.12 + Math.sin(time * 19.3 + i * 3.4) * 0.06;
        t.light.intensity = t.baseIntensity + flicker;
        if (t.flame) {
          const s = 1.0 + flicker * 0.45;
          t.flame.scale.set(s, s * 1.25, s);
          // Organic wind sway and wobble
          t.flame.position.x = Math.sin(time * 2.5 + i) * 0.003;
          t.flame.position.z = Math.cos(time * 3.1 + i * 1.7) * 0.003;
          t.flame.rotation.y = time * 2.0 + i; // gentle spin
          t.flame.rotation.z = Math.sin(time * 4.0 + i) * 0.05; // tilt sway
        }

        // Calculate distance to nearest torch to fade ambient fire crackle loop
        if (t.light && t.light.parent) {
          const torchPos = new THREE.Vector3();
          t.light.parent.getWorldPosition(torchPos);
          const dist = Math.hypot(player.visualX - torchPos.x, player.visualY - torchPos.z);
          if (dist < minTorchDist) {
            minTorchDist = dist;
          }

          // DYNAMIC LIGHT CULLING: Only enable heavy PointLight calculations if torch is within 5.0m of camera
          t.light.visible = (dist < 5.0);
        }
      });

      if (this.audio && typeof this.audio.updateFireVolume === "function") {
        this.audio.updateFireVolume(minTorchDist);
      }
    } else {
      if (this.audio && typeof this.audio.updateFireVolume === "function") {
        this.audio.updateFireVolume(999.0);
      }
    }

    // Rebuild Scene Graph when loading new floor
    const floorId = `${currentFloor}_${state.currentLevel}`;
    if (this.currentFloorId !== floorId) {
      this.rebuildScene(state);
      this.currentFloorId = floorId;
      this.camX = null;
      this.camZ = null;
      this.lookX = null;
      this.lookZ = null;
    }

    // 1. Static Gloomy Overcast Atmosphere (no day/night cycle)
    // Generate canvas-based gradient grey sky
    if (!this.skyCanvas) {
      this.skyCanvas = document.createElement("canvas");
      this.skyCanvas.width = 2;
      this.skyCanvas.height = 128;
      this.skyCtx = this.skyCanvas.getContext("2d");
      this.skyTexture = new THREE.CanvasTexture(this.skyCanvas);
      this.scene.background = this.skyTexture;
      const grad = this.skyCtx.createLinearGradient(0, 0, 0, 128);
      grad.addColorStop(0, "#020408"); // Pitch black sky top
      grad.addColorStop(0.5, "#080a10"); // Very dark slate grey mid
      grad.addColorStop(1, "#0d1117"); // Dark night horizon
      this.skyCtx.fillStyle = grad;
      this.skyCtx.fillRect(0, 0, 2, 128);
      this.skyTexture.needsUpdate = true;
    }

    // Keep fog and ambient constant (gloomy overcast)
    if (this.dirLight) {
      this.dirLight.position.set(player.visualX + 8, 16, player.visualY + 8);
      this.dirLight.target.position.set(player.visualX, 0, player.visualY);
      this.dirLight.target.updateMatrixWorld();
    }

    // Toggle lantern light and flame core visibility
    if (this.lantern) {
      if (state.lanternOn && player.fuel > 0) {
        this.lantern.intensity = 4.5; // Distance-decay flashlight beam to keep texture details and colors rich
        if (this.lanternFlame) this.lanternFlame.visible = true;
      } else {
        this.lantern.intensity = 0.0; // completely off
        if (this.lanternFlame) this.lanternFlame.visible = false;
      }
    }

    // Smoothly interpolate player visual coordinates
    if (player.visualX === null) {
      player.visualX = player.x;
      player.visualY = player.y;
      this.lastVisualX = player.visualX;
      this.lastVisualY = player.visualY;
    } else {
      this.lastVisualX = player.visualX;
      this.lastVisualY = player.visualY;
      player.visualX += (player.x - player.visualX) * interpolationFactor;
      player.visualY += (player.y - player.visualY) * interpolationFactor;
    }

    const dx = player.visualX - this.lastVisualX;
    const dy = player.visualY - this.lastVisualY;
    const isMoving = !!player.isMoving;
    if (isMoving) {
      this.rollAngle += dx * 0.4 + dy * 0.4;
    } else {
      this.rollAngle += (0 - this.rollAngle) * 0.15;
    }

    // 1. Sync Chests, Obstacles and Visibility Group states
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = grid[y][x];
        
        // Fog of war check + Dynamic Distance Culling (prevents CPU/WebGL mesh traversal overhead)
        const dx = x - player.visualX;
        const dy = y - player.visualY;
        const distSq = dx * dx + dy * dy;
        const isNear = distSq <= 132.25; // 11.5 cells radius (smoothly fades to 100% fog before culling)
        
        this.cellGroups[y][x].visible = state.devMode || isNear;

        if (cell.chest) {
          if (this.chestGoldMeshes[`${x},${y}`]) {
            this.chestGoldMeshes[`${x},${y}`].visible = cell.chest.opened;
          }
          if (cell.chest.opened) {
            // Spawn gold particle burst once when chest is opened!
            if (!this.triggeredChests.has(`${x},${y}`)) {
              this.triggeredChests.add(`${x},${y}`);
              this.spawnParticles(x + 0.5, 0.15, y + 0.5);
            }
          } else {
            // Reset trigger state if chest is closed (e.g. by undo choice)
            if (this.triggeredChests.has(`${x},${y}`)) {
              this.triggeredChests.delete(`${x},${y}`);
            }
          }
          if (this.chestLidGroups[`${x},${y}`]) {
            const lid = this.chestLidGroups[`${x},${y}`];
            const initialX = lid.userData && lid.userData.initialX !== undefined ? lid.userData.initialX : 0;
            const targetRot = cell.chest.opened ? initialX - 1.8 : initialX;
            lid.rotation.x += (targetRot - lid.rotation.x) * 0.15;
          }
        }
        if (cell.obstacle && this.obstacleMeshes[`${x},${y}`]) {
          this.obstacleMeshes[`${x},${y}`].visible = !cell.obstacle.resolved;
        }
      }
    }

    // Calculate mouse look rotation sway/lag
    const pitch = player.pitch || 0.0;
    const prevAngle = this.prevAngle !== undefined ? this.prevAngle : player.angle;
    const prevPitch = this.prevPitch !== undefined ? this.prevPitch : pitch;

    let deltaAngle = player.angle - prevAngle;
    // Normalize deltaAngle to shortest angular path [-PI, PI] to prevent wrapping glitches
    deltaAngle = Math.atan2(Math.sin(deltaAngle), Math.cos(deltaAngle));
    const deltaPitch = pitch - prevPitch;

    this.prevAngle = player.angle;
    this.prevPitch = pitch;

    this.swayX = this.swayX !== undefined ? this.swayX : 0;
    this.swayY = this.swayY !== undefined ? this.swayY : 0;

    // We want the viewmodel to sway/rotate opposite to the look direction and slowly catch up
    const targetSwayX = -deltaAngle * 0.55;
    const targetSwayY = -deltaPitch * 0.55;

    this.swayX += (targetSwayX - this.swayX) * 0.15;
    this.swayY += (targetSwayY - this.swayY) * 0.15;

    // Interpolate bobFactor to smoothly start and stop bobbing animations
    this.bobFactor = this.bobFactor !== undefined ? this.bobFactor : 0;
    const targetBobFactor = isMoving ? 1.0 : 0.0;
    this.bobFactor += (targetBobFactor - this.bobFactor) * 0.12;

    // Accumulate smooth phase only when moving to prevent CPU-timer micro-stuttering
    this.bobPhase = this.bobPhase !== undefined ? this.bobPhase : 0;
    const isRunning = !!player.isRunning;
    if (isMoving) {
      const baseIncrement = isRunning ? 0.22 : 0.13;
      this.bobPhase += baseIncrement;
    }

    // 2. First Person Hand & Lantern sway/bob animations (applied to local camera space children!)
    const bobIntensityY = isRunning ? 0.022 : 0.012;
    const bobIntensityX = isRunning ? 0.014 : 0.008;

    // Bobbing is calculated using the smooth, constant accumulated bobPhase
    const bobY = Math.sin(this.bobPhase) * bobIntensityY * this.bobFactor;
    const bobX = Math.cos(this.bobPhase * 0.5) * bobIntensityX * this.bobFactor;
    const swingZ = Math.sin(this.bobPhase) * (isRunning ? 0.12 : 0.06) * this.bobFactor;
    
    if (this.playerMesh) {
      this.playerMesh.position.set(0.08 + bobX - this.swayX * 0.03, -0.09 + bobY + this.swayY * 0.03, -0.12);
      this.playerMesh.rotation.set(
        this.swayY * 0.25,
        -Math.PI / 10 + this.swayX * 0.25,
        swingZ
      );
    }

    // Attach 3D accessory for equipped item (First Person Left Hand)
    if (this.lastEquippedItem !== player.equippedItem) {
      this.lastEquippedItem = player.equippedItem;
      // Clear old accessory
      if (this.equippedAccessory) {
        this.camera.remove(this.equippedAccessory);
        this.equippedAccessory = null;
      }

      // Add new accessory if equipped
      if (player.equippedItem) {
        const item = player.equippedItem;
        this.equippedAccessory = new THREE.Group();

        // Left Sleeve & Hand
        const sleeveMat = new THREE.MeshStandardMaterial({ color: "#5c3a21", roughness: 0.85 });
        const armGeo = new THREE.CylinderGeometry(0.016, 0.02, 0.22, 8);
        const arm = new THREE.Mesh(armGeo, sleeveMat);
        arm.rotation.x = Math.PI / 2.2;
        arm.position.set(0, 0, 0.11);
        this.equippedAccessory.add(arm);

        const skinMat = new THREE.MeshStandardMaterial({ color: "#fbcfe8", roughness: 0.8 });
        const hand = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), skinMat);
        hand.position.set(0, 0.015, -0.01);
        this.equippedAccessory.add(hand);

        let mesh;
        if (item === "key") {
          mesh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.015, 0.14, 8),
            new THREE.MeshPhongMaterial({ color: "#fbbf24", shininess: 50 })
          );
          mesh.rotation.x = Math.PI / 2;
          mesh.position.set(0, 0.02, -0.06);
        } else if (item === "shears") {
          mesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.03, 0.10, 0.06),
            new THREE.MeshPhongMaterial({ color: "#9ca3af" })
          );
          mesh.position.set(0, 0.02, -0.04);
        } else if (item === "axe") {
          const axeGroup = new THREE.Group();
          const handle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.008, 0.008, 0.22, 8),
            new THREE.MeshPhongMaterial({ color: "#78350f" })
          );
          handle.rotation.x = Math.PI / 2;
          handle.position.set(0, 0.02, -0.06);
          const blade = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.04, 0.015),
            new THREE.MeshPhongMaterial({ color: "#ef4444" })
          );
          blade.position.set(0, 0.04, -0.14);
          axeGroup.add(handle);
          axeGroup.add(blade);
          mesh = axeGroup;
        } else if (item === "compass") {
          mesh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.05, 0.02, 12),
            new THREE.MeshPhongMaterial({ color: "#06b6d4" })
          );
          mesh.rotation.x = Math.PI / 3;
          mesh.position.set(0, 0.03, -0.03);
        } else if (item === "rope") {
          mesh = new THREE.Mesh(
            new THREE.TorusGeometry(0.04, 0.014, 8, 16),
            new THREE.MeshPhongMaterial({ color: "#b45309" })
          );
          mesh.position.set(0, 0.02, -0.04);
        } else if (item === "bucket" || item === "bucket_full") {
          mesh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.04, 0.08, 10),
            new THREE.MeshPhongMaterial({ color: item === "bucket" ? "#4b5563" : "#3b82f6" })
          );
          mesh.position.set(0, 0.02, -0.05);
        } else {
          mesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 0.06, 0.06),
            new THREE.MeshPhongMaterial({ color: "#a855f7" })
          );
          mesh.position.set(0, 0.02, -0.04);
        }

        if (mesh) {
          this.equippedAccessory.add(mesh);
        }

        this.equippedAccessory.position.set(-0.12, -0.12, -0.18);
        this.equippedAccessory.rotation.y = Math.PI / 8;
        this.equippedAccessory.scale.set(0.7, 0.7, 0.7); // scaled down for closer view Z = -0.18 (prevents wall clipping)
        this.camera.add(this.equippedAccessory);
      }
    }

    if (this.equippedAccessory) {
      this.equippedAccessory.position.set(-0.12 - bobX + this.swayX * 0.03, -0.12 + bobY + this.swayY * 0.03, -0.18);
      this.equippedAccessory.rotation.set(
        this.swayY * 0.25,
        Math.PI / 8 + this.swayX * 0.25,
        -swingZ
      );
    }

    // 3. First Person Camera Positioning (with organic height bobbing)
    const targetCamX = player.visualX;
    const targetCamZ = player.visualY;
    
    // Bob the camera height slightly based on movement (frequency matches steps)
    const bobAmp = isRunning ? 0.016 : 0.007; // subtle height shift
    const camBobY = Math.sin(this.bobPhase) * bobAmp * this.bobFactor;
    const camHeight = 0.58 + camBobY;

    const lookX = player.visualX + Math.cos(player.angle) * Math.cos(pitch) * 1.0;
    const lookZ = player.visualY + Math.sin(player.angle) * Math.cos(pitch) * 1.0;
    const lookY = camHeight + Math.sin(pitch) * 1.0;

    // Smooth camera look interpolation
    if (this.camX === null) {
      this.camX = targetCamX;
      this.camZ = targetCamZ;
      this.lookX = lookX;
      this.lookY = lookY;
      this.lookZ = lookZ;
    } else {
      this.camX += (targetCamX - this.camX) * 0.22;
      this.camZ += (targetCamZ - this.camZ) * 0.22;
      this.lookX += (lookX - this.lookX) * 0.22;
      this.lookY += (lookY - this.lookY) * 0.22;
      this.lookZ += (lookZ - this.lookZ) * 0.22;
    }

    this.camera.position.set(this.camX, camHeight, this.camZ);
    this.camera.lookAt(this.lookX, this.lookY, this.lookZ);

    // 4. Smoothly rotate character NPCs to face the player (since player can approach from multiple directions) and apply procedural idle breathing/arm sways
    if (this.npcGroups) {
      const time = Date.now() * 0.0035;
      for (const key in this.npcGroups) {
        const npcGroup = this.npcGroups[key];
        const { x, y, cell } = npcGroup.userData;
        
        if (cell.npc && cell.npc.id !== "well") {
          if (cell.npc.id === "mouse" && cell.npc.disappearing) {
            const elapsed = (Date.now() - cell.npc.disappearStartTime) / 1000;
            if (cell.npc.facingAngle === undefined) {
              cell.npc.facingAngle = npcGroup.rotation.y;
            }

            // Move forward along the direction it was looking when it started running
            // Snout points towards local +X, so dx = cos(angle), dz = -sin(angle)
            const distTraveled = elapsed * 0.65; // speed of 0.65 units per second
            npcGroup.position.x = (x + 0.5) + distTraveled * Math.cos(cell.npc.facingAngle);
            npcGroup.position.z = (y + 0.5) - distTraveled * Math.sin(cell.npc.facingAngle);
            npcGroup.rotation.y = cell.npc.facingAngle;

            // Running waddle (rapid bobbing on Y)
            const model = npcGroup.children[0];
            if (model) {
              model.position.y = Math.abs(Math.sin(elapsed * 25)) * 0.025;
            }

            // Shrink to zero over 3 seconds
            const scaleFactor = Math.max(0, 1 - (elapsed / 3.0));
            npcGroup.scale.set(scaleFactor, scaleFactor, scaleFactor);
          } else if (cell.npc.id !== "mouse" && cell.npc.disappearing) {
            const elapsed = (Date.now() - cell.npc.disappearStartTime) / 1000;
            const model = npcGroup.children[0];
            if (model) {
              // 1. From 0.0s to 1.8s: Turn into a dark shadow (multiply color by factor going from 1.0 to 0.0)
              // 2. From 1.8s to 3.8s: Fade out opacity from 1.0 to 0.0
              const shadowFactor = Math.max(0.0, 1.0 - (elapsed / 1.8));
              const alphaFactor = Math.max(0.0, 1.0 - Math.max(0.0, (elapsed - 1.8) / 2.0));
              
              model.traverse((child) => {
                if (child.isMesh && child.material) {
                  const mats = Array.isArray(child.material) ? child.material : [child.material];
                  mats.forEach(m => {
                    if (m.userData) {
                      // Store original color if not already stored
                      if (!m.userData.originalColor) {
                        m.userData.originalColor = m.color.clone();
                      }
                      m.color.copy(m.userData.originalColor).multiplyScalar(shadowFactor);
                    }
                    m.transparent = true;
                    m.opacity = alphaFactor;
                  });
                }
              });
              
              // Haunting rise upwards as they fade into the afterworld
              const initY = (model.userData && model.userData.initialY !== undefined) ? model.userData.initialY : 0.32;
              model.position.y = initY + elapsed * 0.08;
            }
            
            if (elapsed >= 3.8) {
              cell.npc = null;
              if (this.lastState) this.rebuildScene(this.lastState);
            }
          } else {
            const dx = player.visualX - (x + 0.5);
            const dz = player.visualY - (y + 0.5);
            const dist = Math.hypot(dx, dz);
            
            if (dist < 20.0) {
              const targetAngle = Math.atan2(dx, dz);
              // Both mouse and FBX human models face +X locally, so offset by -Math.PI / 2 to face player directly
              const baseAngle = targetAngle - Math.PI / 2;
              
              let diff = baseAngle - npcGroup.rotation.y;
              // Shortest path angle wrap-around interpolation
              diff = Math.atan2(Math.sin(diff), Math.cos(diff));
              npcGroup.rotation.y += diff * 0.12;
            }

            // Procedural Idle animations to make them feel alive (breathing and minor arm sways)
            if (cell.npc.id !== "mouse") {
              const model = npcGroup.children[0];
              if (model) {
                const hasInitialY = model.userData && model.userData.initialY !== undefined;
                const hasInitialScaleY = model.userData && model.userData.initialScaleY !== undefined;

                if (hasInitialY && hasInitialScaleY) {
                  // Ensure Y-position is locked to its initial Y feet alignment offset to prevent leg clipping!
                  model.position.y = model.userData.initialY;

                  // Scale Y breathing (feet remain anchored, chest/torso expands up and down slightly!)
                  const breathingScale = 1.0 + Math.sin(time) * 0.015;
                  model.scale.y = model.userData.initialScaleY * breathingScale;
                } else {
                  // Fallback for placeholder meshes (cylinders/spheres)
                  model.position.y = 0.32 + Math.sin(time) * 0.012; // fallback Y bobbing
                }

                // Arms breathing/swaying (if skeletal bones are loaded)
                const armL = typeof model.getObjectByName === "function" ? (model.getObjectByName("upper_arm.L") || model.getObjectByName("shoulder.L")) : null;
                const armR = typeof model.getObjectByName === "function" ? (model.getObjectByName("upper_arm.R") || model.getObjectByName("shoulder.R")) : null;
                if (armL) armL.rotation.z = Math.sin(time * 0.8) * 0.05;
                if (armR) armR.rotation.z = -Math.sin(time * 0.8) * 0.05;
              }
            } else {
              // Mouse idle sniffing (slight head wiggle)
              const model = npcGroup.children[0];
              if (model) {
                model.position.y = Math.sin(time * 2.0) * 0.004;
              }
            }
          }
        }
      }
    }

    // 5. Update dynamic Flashlight SpotLight position & Target in world space (real-life flashlight tracking)
    if (this.lantern && this.lantern.target) {
      const dir = new THREE.Vector3();
      this.camera.getWorldDirection(dir);

      // Position the light source 0.15 units behind the camera to prevent clipping when looking nose-to-nose with walls
      const lightPos = new THREE.Vector3().copy(this.camera.position).addScaledVector(dir, -0.15);
      this.lantern.position.copy(lightPos);

      // Position the target 5 units straight ahead in world coordinates
      this.lantern.target.position.copy(this.camera.position).addScaledVector(dir, 5.0);

      // Force immediate matrix updates to make sure the renderer compiles positions correctly
      this.lantern.updateMatrixWorld(true);
      this.lantern.target.updateMatrixWorld(true);
    }

    // Update Shadow Monster visual mesh
    if (state.shadowMonster) {
      const sm = state.shadowMonster;
      if (sm.active) {
        if (!this.shadowMonsterMesh) {
          this.shadowMonsterMesh = new THREE.Group();
          
          // 1. Billboard Jumpscare Face Plane
          const faceGeom = new THREE.PlaneGeometry(1.2, 1.2);
          const ShaderMatClass = THREE.ShaderMaterial || THREE.MeshBasicMaterial;
          const faceMat = new ShaderMatClass({
            uniforms: {
              map: { value: this.jumpscareTexture },
              opacity: { value: 1.0 },
              time: { value: 0.0 }
            },
            vertexShader: `
              varying vec2 vUv;
              void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `,
            fragmentShader: `
              uniform sampler2D map;
              uniform float opacity;
              uniform float time;
              varying vec2 vUv;
              void main() {
                // 1. Gaseous boiling ripple distortion
                vec2 distortedUv = vUv;
                distortedUv.x += sin(vUv.y * 8.0 + time * 3.5) * 0.012;
                distortedUv.y += cos(vUv.x * 8.0 + time * 2.8) * 0.012;
                
                vec4 texColor = texture2D(map, distortedUv);
                
                // 2. Discard black/dark background pixels
                if (texColor.r < 0.14 && texColor.g < 0.14 && texColor.b < 0.14) {
                  discard;
                }
                
                // 3. Smooth vignette edge fade (makes plane boundaries perfectly invisible)
                float dist = distance(vUv, vec2(0.5, 0.5));
                float edgeFade = 1.0 - smoothstep(0.32, 0.50, dist);
                
                gl_FragColor = vec4(texColor.rgb, texColor.a * opacity * edgeFade);
              }
            `,
            // Fallback parameters for MeshBasicMaterial
            map: this.jumpscareTexture,
            transparent: true,
            opacity: 1.0,
            side: THREE.DoubleSide,
            depthWrite: false
          });
          const faceMesh = new THREE.Mesh(faceGeom, faceMat);
          faceMesh.name = "face";
          faceMesh.position.set(0, 0.75, 0.25); // Lowered to player eye level (y=0.75) and shifted slightly forward (z=0.25)
          this.shadowMonsterMesh.add(faceMesh);
          
          // 3. Volumetric Smoke Body (15 overlapping black/dark spheres)
          const smokeGroup = new THREE.Group();
          smokeGroup.name = "smokeGroup";
          this.shadowMonsterMesh.add(smokeGroup);
          
          for (let i = 0; i < 15; i++) {
            const size = 0.25 + Math.random() * 0.25; // Smaller, more compact smoke body spheres (0.25m to 0.50m)
            const geom = new THREE.SphereGeometry(size, 8, 8);
            const mat = new THREE.MeshBasicMaterial({
              color: 0x080808,
              transparent: true,
              opacity: 0.25,
              depthWrite: false
            });
            const mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(
              (Math.random() - 0.5) * 0.45,
              0.75 + (Math.random() - 0.5) * 0.45, // Lowered center height to y=0.75
              -0.10 + (Math.random() - 0.5) * 0.3 // offset backward so it acts as background/body
            );
            mesh.userData = {
              initialPos: new THREE.Vector3(mesh.position.x, mesh.position.y, mesh.position.z),
              speedX: 0.5 + Math.random() * 1.5,
              speedY: 0.5 + Math.random() * 1.5,
              speedZ: 0.5 + Math.random() * 1.5,
              phase: Math.random() * Math.PI * 2,
              pulseSpeed: 1.0 + Math.random() * 2.0
            };
            smokeGroup.add(mesh);
          }
          
          // 4. Red Point Light casting eerie glow on walls
          const shadowLight = new THREE.PointLight(0xff0000, 1.2, 5.0);
          shadowLight.name = "shadowLight";
          shadowLight.position.set(0, 0.75, 0.2); // Lowered center height to y=0.75
          this.shadowMonsterMesh.add(shadowLight);
          
          this.scene.add(this.shadowMonsterMesh);
        }
        
        const time = Date.now() * 0.005;
        const burnRatio = Math.max(0.15, 1.0 - (sm.burnTime / 2.0));
        
        // Floating/bobbing height offset to y position (around 0.15 height with 0.08 amplitude)
        this.shadowMonsterMesh.position.set(sm.x, 0.15 + Math.sin(time) * 0.08, sm.y);
        
        // Face player camera
        const dx = this.camera.position.x - sm.x;
        const dz = this.camera.position.z - sm.y;
        this.shadowMonsterMesh.rotation.y = Math.atan2(dx, dz);
        
        // Update eye pulse and opacity
        const eyeL = this.shadowMonsterMesh.getObjectByName("eyeL");
        const eyeR = this.shadowMonsterMesh.getObjectByName("eyeR");
        const eyePulse = 1.0 + Math.sin(Date.now() * 0.025) * 0.15;
        if (eyeL) {
          eyeL.scale.set(eyePulse, eyePulse, eyePulse);
          if (eyeL.material) eyeL.material.opacity = burnRatio;
        }
        if (eyeR) {
          eyeR.scale.set(eyePulse, eyePulse, eyePulse);
          if (eyeR.material) eyeR.material.opacity = burnRatio;
        }
        
        // Update face animations and shader uniforms (supporting both ShaderMaterial uniforms and MeshBasicMaterial fallback)
        const face = this.shadowMonsterMesh.getObjectByName("face");
        if (face) {
          // 1. Subtle breathing scale pulse and side-to-side rotation sway
          const faceScale = 1.0 + Math.sin(time * 1.5) * 0.05;
          face.scale.set(faceScale, faceScale, faceScale);
          face.rotation.z = Math.sin(time * 2.0) * 0.06;
          
          if (face.material) {
            if (face.material.uniforms) {
              if (face.material.uniforms.opacity) face.material.uniforms.opacity.value = burnRatio;
              if (face.material.uniforms.time) face.material.uniforms.time.value = time;
            } else {
              face.material.opacity = burnRatio;
            }
          }
        }
        
        // Update point light intensity
        const shadowLight = this.shadowMonsterMesh.getObjectByName("shadowLight");
        if (shadowLight) {
          shadowLight.intensity = 1.2 * burnRatio;
        }
        
        // Animate individual smoke spheres for boiling/turbulent effect
        const smokeGroup = this.shadowMonsterMesh.getObjectByName("smokeGroup");
        if (smokeGroup) {
          smokeGroup.rotation.y = time * 0.2;
          smokeGroup.rotation.x = time * 0.1;
          smokeGroup.children.forEach((sphere) => {
            const ud = sphere.userData;
            if (ud && ud.initialPos) {
              const pulse = 1.0 + Math.sin(time * ud.pulseSpeed + ud.phase) * 0.12;
              sphere.scale.set(pulse, pulse, pulse);
              
              sphere.position.x = ud.initialPos.x + Math.sin(time * ud.speedX + ud.phase) * 0.05;
              sphere.position.y = ud.initialPos.y + Math.cos(time * ud.speedY + ud.phase) * 0.05;
              sphere.position.z = ud.initialPos.z + Math.sin(time * ud.speedZ + ud.phase) * 0.05;
              
              if (sphere.material) {
                sphere.material.opacity = 0.25 * burnRatio;
              }
            }
          });
        }
        
        // Spawning and fading out trail particles (volumetric smoke trail)
        if (!this.smokeTrailParticles) {
          this.smokeTrailParticles = [];
        }
        
        const now = Date.now();
        if (!this.lastTrailSpawnTime) this.lastTrailSpawnTime = 0;
        if (now - this.lastTrailSpawnTime > 60) { // Spawns every 60ms (faster rate)
          this.lastTrailSpawnTime = now;
          
          const count = 2 + Math.floor(Math.random() * 2); // 2-3 particles per tick
          for (let tIdx = 0; tIdx < count; tIdx++) {
            const trailGeom = new THREE.SphereGeometry(0.35 + Math.random() * 0.35, 8, 8); // Slightly larger
            const trailMat = new THREE.MeshBasicMaterial({
              color: 0x050505,
              transparent: true,
              opacity: 0.22, // Higher initial opacity
              depthWrite: false
            });
            const trailMesh = new THREE.Mesh(trailGeom, trailMat);
            
            // Align spawn position with the monster's actual eye level height (y=0.75)
            trailMesh.position.set(
              sm.x + (Math.random() - 0.5) * 0.4,
              this.shadowMonsterMesh.position.y + 0.75 + (Math.random() - 0.5) * 0.4,
              sm.y + (Math.random() - 0.5) * 0.4
            );
            this.scene.add(trailMesh);
            
            this.smokeTrailParticles.push({
              mesh: trailMesh,
              spawnTime: now,
              lifeTime: 1500 + Math.random() * 500, // Longer lifetime for longer trailing tail
              initialScale: 1.0,
              initialOpacity: 0.22
            });
          }
        }
        
        // Update trail particles
        if (this.smokeTrailParticles) {
          const currentTime = Date.now();
          for (let i = this.smokeTrailParticles.length - 1; i >= 0; i--) {
            const p = this.smokeTrailParticles[i];
            const elapsed = currentTime - p.spawnTime;
            if (elapsed >= p.lifeTime) {
              this.scene.remove(p.mesh);
              if (p.mesh.geometry) {
                try { p.mesh.geometry.dispose(); } catch(e) {}
              }
              if (p.mesh.material) {
                try { p.mesh.material.dispose(); } catch(e) {}
              }
              this.smokeTrailParticles.splice(i, 1);
            } else {
              const ratio = elapsed / p.lifeTime;
              const scale = 1.0 + ratio * 1.5;
              p.mesh.scale.set(scale, scale, scale);
              if (p.mesh.material) {
                p.mesh.material.opacity = p.initialOpacity * (1.0 - ratio) * burnRatio;
              }
            }
          }
        }
        
        this.shadowMonsterMesh.visible = true;
      } else {
        if (this.shadowMonsterMesh) {
          this.scene.remove(this.shadowMonsterMesh);
          this.shadowMonsterMesh = null;
        }
        if (this.smokeTrailParticles) {
          this.smokeTrailParticles.forEach(p => {
            this.scene.remove(p.mesh);
            if (p.mesh.geometry) {
              try { p.mesh.geometry.dispose(); } catch(e) {}
            }
            if (p.mesh.material) {
              try { p.mesh.material.dispose(); } catch(e) {}
            }
          });
          this.smokeTrailParticles = [];
        }
      }
    }

    // Update rain particles (highly optimized direct typed array manipulation to prevent FPS drops)
    if (this.rainParticles && this.rainVelocities) {
      const posAttr = this.rainParticles.geometry.attributes.position;
      const len = this.rainVelocities.length;
      const array = posAttr.array || new Float32Array(len * 3);
      const camX = this.camera.position.x;
      const camZ = this.camera.position.z;
      
      for (let i = 0; i < len; i++) {
        const idx = i * 3;
        let y = array[idx + 1] - this.rainVelocities[i]; // fall down
        let x = array[idx];
        let z = array[idx + 2];
        
        const dx = x - camX;
        const dz = z - camZ;
        if (y < 0.0 || Math.abs(dx) > 8.0 || Math.abs(dz) > 8.0) {
          y = 5.0 + Math.random() * 3.0; // reset high up
          x = camX + (Math.random() - 0.5) * 16.0; // random offset around camera
          z = camZ + (Math.random() - 0.5) * 16.0;
        }
        
        array[idx] = x;
        array[idx + 1] = y;
        array[idx + 2] = z;
      }
      posAttr.needsUpdate = true;
    }

    // Update low-lying ground fog particles (localized around player with GPU hardware acceleration)
    if (this.groundFogParticles && this.fogDriftVelocities) {
      const posAttr = this.groundFogParticles.geometry.attributes.position;
      const len = this.fogDriftVelocities.length;
      const array = posAttr.array || new Float32Array(len * 3);
      const camX = this.camera.position.x;
      const camZ = this.camera.position.z;

      for (let i = 0; i < len; i++) {
        const idx = i * 3;
        
        let x = array[idx] + this.fogDriftVelocities[i].x * 0.05;
        let z = array[idx + 2] + this.fogDriftVelocities[i].z * 0.05;
        let y = array[idx + 1];

        let dx = x - camX;
        let dz = z - camZ;

        // Wrap around camera bounds (infinite player-locked coverage)
        if (dx > 7.0) { x = camX - 7.0; }
        else if (dx < -7.0) { x = camX + 7.0; }

        if (dz > 7.0) { z = camZ - 7.0; }
        else if (dz < -7.0) { z = camZ + 7.0; }

        array[idx] = x;
        array[idx + 1] = y;
        array[idx + 2] = z;
      }
      posAttr.needsUpdate = true;
    }

    // Update dynamic chests to face the player's approach direction in open corridors
    if (this.chestGroups) {
      const camX = this.camera.position.x;
      const camZ = this.camera.position.z;
      for (const key in this.chestGroups) {
        const chestGroup = this.chestGroups[key];
        if (chestGroup && chestGroup.userData && chestGroup.userData.dynamicFacing) {
          const cellX = chestGroup.userData.x + 0.5;
          const cellZ = chestGroup.userData.y + 0.5;
          const dx = camX - cellX;
          const dz = camZ - cellZ;
          // Rotate around Y axis to face the camera directly
          chestGroup.rotation.y = Math.atan2(dx, dz);
        }
      }
    }

    // Update active particles in the scene
    if (this.particles) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.mesh.position.x += p.vx;
        p.mesh.position.y += p.vy;
        p.mesh.position.z += p.vz;
        p.vy -= 0.0008; // slow downward gravity pull
        p.life -= p.decay;
        
        if (p.life <= 0) {
          this.scene.remove(p.mesh);
          p.mesh.geometry.dispose();
          this.particles.splice(i, 1);
        } else {
          p.mesh.scale.set(p.life, p.life, p.life);
        }
      }
    }

    // Update exit portals (swirling core, opposite ring rotations, and orbital energy spheres)
    if (this.exitPortals && this.exitPortals.length > 0) {
      this.exitPortals.forEach(portal => {
        const t = (Date.now() * 0.001) + portal.timeOffset;
        
        // 1. Swirl and pulse core disc
        if (portal.coreMesh) {
          portal.coreMesh.rotation.z = t * 0.5; // spin vortex
          const s = 1.0 + Math.sin(t * 3.0) * 0.06; // breathing pulse
          portal.coreMesh.scale.set(s, s, 1.0);
        }
        
        // 2. Rotate outer & inner rings in opposite directions
        if (portal.outerRing) {
          portal.outerRing.rotation.z = t * 0.8;
          portal.outerRing.rotation.x = Math.sin(t * 0.4) * 0.15;
        }
        if (portal.innerRing) {
          portal.innerRing.rotation.z = -t * 1.2;
          portal.innerRing.rotation.y = Math.cos(t * 0.5) * 0.15;
        }
        
        // 3. Orbit energy spheres around the center core
        if (portal.energySpheres && portal.energySpheres.length > 0) {
          const numSpheres = portal.energySpheres.length;
          for (let i = 0; i < numSpheres; i++) {
            const sphere = portal.energySpheres[i];
            const angle = (t * 2.0) + (i * Math.PI * 2 / numSpheres);
            const radius = 0.14 + Math.sin(t * 4.0 + i) * 0.02; // waving radius
            sphere.position.set(
              Math.cos(angle) * radius,
              Math.sin(angle) * radius,
              Math.sin(t * 5.0 + i) * 0.02 // slight forward/back bobbing
            );
          }
        }
        
        // 4. Pulse light intensity slightly
        if (portal.light) {
          portal.light.intensity = 1.6 + Math.sin(t * 4.0) * 0.3;
        }
      });
    }

    // 5. Render Scene to WebGL Viewport
    this.renderer.render(this.scene, this.camera);
  }
}
