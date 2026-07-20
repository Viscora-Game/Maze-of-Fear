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

const makeLoreTexture = (loreId) => {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  
  // Aged, yellowed parchment color
  ctx.fillStyle = "#c5b393"; // old dark paper
  ctx.fillRect(0, 0, 128, 128);
  
  // Vignette corners
  if (ctx.createRadialGradient) {
    const grad = ctx.createRadialGradient(64, 64, 30, 64, 64, 90);
    grad.addColorStop(0, "rgba(90, 60, 30, 0)");
    grad.addColorStop(1, "rgba(40, 20, 5, 0.5)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
  }
  
  // Draw some handwritten lines to look like readable lore script
  ctx.strokeStyle = "rgba(40, 20, 5, 0.4)";
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 6; i++) {
    const y = 30 + i * 15;
    ctx.beginPath();
    ctx.moveTo(20 + Math.random() * 5, y);
    ctx.lineTo(108 - Math.random() * 5, y);
    ctx.stroke();
  }

  // Draw a big fancy title initial letter in red
  ctx.fillStyle = "#8a0303"; // crimson ink
  ctx.font = "italic bold 32px 'Georgia', serif";
  ctx.textAlign = "center";
  ctx.fillText("📜", 64, 75);
  
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
};

export class CanvasRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    
    // 1. Initialize WebGL Renderer (disable antialias on mobile for major GPU perf boost)
    const isMobileDevice = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: !isMobileDevice, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(canvas.width, canvas.height);
    
    // Dynamic shadow mapping switch (opt-in/opt-out for mobile performance boost)
    this.shadowsEnabled = localStorage.getItem("maze_shadows") !== "false";
    this.renderer.shadowMap.enabled = this.shadowsEnabled;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // 2. Setup Loading Manager & Load Photographic Textures
    const loadingScreen = document.getElementById("loading-screen");
    const loadingBar = document.getElementById("loading-bar");
    const loadingText = document.getElementById("loading-text");

    THREE.DefaultLoadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      // Only update if loading screen is already visible (shown by Play button)
      if (loadingScreen && !loadingScreen.classList.contains("hidden")) {
        const percentage = Math.round((itemsLoaded / itemsTotal) * 100);
        if (loadingBar) loadingBar.style.width = `${percentage}%`;
        if (loadingText) {
          const isEn = localStorage.getItem("maze_lang") === "en";
          loadingText.textContent = isEn
            ? `Loading the darkness... ${percentage}%`
            : `Karanlık yükleniyor... %${percentage}`;
        }
      }
    };

    THREE.DefaultLoadingManager.onError = (url) => {
      console.warn("Loading manager encountered error:", url);
    };

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

    // Precompiled Shadow Monster Geometries and Materials (prevents WebGL compile-time lag spikes during gameplay)
    this.monsterFaceGeom = new THREE.PlaneGeometry(1.2, 1.2);
    this.createMonsterFaceMat = (opacity = 1.0) => {
      const mat = new THREE.MeshBasicMaterial({
        map: this.jumpscareTexture,
        transparent: true,
        opacity: opacity,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      
      // Store time uniform in userData to update it dynamically in the loop
      mat.userData = {
        time: { value: 0.0 }
      };

      mat.onBeforeCompile = (shader) => {
        shader.uniforms.time = mat.userData.time;
        
        // Inject custom time uniform at the top of the fragment shader
        shader.fragmentShader = `
          uniform float time;
        ` + shader.fragmentShader;

        // Modify map sampling logic to include the wavy effect and custom pixel discard
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <map_fragment>',
          `
          #ifdef USE_MAP
            vec2 uv = vUv;
            // Spooky wavy distortion
            uv.x += sin(vUv.y * 12.0 + time * 4.0) * 0.015;
            uv.y += cos(vUv.x * 12.0 + time * 3.0) * 0.015;

            vec4 texelColor = texture2D( map, uv );
            texelColor = mapTexelToLinear( texelColor );
            diffuseColor *= texelColor;

            // Discard black background to remove the card edges (same logic as before)
            if (diffuseColor.r < 0.12 && diffuseColor.g < 0.12 && diffuseColor.b < 0.12) {
              discard;
            }

            // Smooth circular edge vignette fade
            float dist = distance(vUv, vec2(0.5, 0.5));
            float edgeFade = 1.0 - smoothstep(0.32, 0.50, dist);
            diffuseColor.a *= edgeFade;
          #endif
          `
        );
      };
      
      return mat;
    };

    this.monsterSmokeGeom = new THREE.SphereGeometry(1.0, 8, 8); // shared unit sphere
    this.monsterSmokeMat = new THREE.MeshBasicMaterial({
      color: 0x1a0707, // Eerie dark red smoke body for better visibility in dense grey fog
      transparent: true,
      opacity: 0.40,   // Slightly increased opacity to ensure visibility on mobile screens
      depthWrite: false
    });

    // Shared gold particle meshes for chest opening bursts
    this.chestParticleGeom = new THREE.SphereGeometry(0.012, 4, 4);
    this.chestParticleMat = new THREE.MeshBasicMaterial({ color: "#fbbf24" });

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
          child.castShadow = this.shadowsEnabled;
          child.receiveShadow = this.shadowsEnabled;
        }
      });
      
      console.log("PSX First-Person Arms loaded successfully!");
      if (this.renderer) {
        try { this.renderer.compile(gltf.scene, this.camera); } catch (e) { console.warn("Warmup compile failed for arms:", e); }
      }
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
      if (this.renderer) {
        try { this.renderer.compile(fbx, this.camera); } catch (e) { console.warn("Warmup compile failed for fbx decoration:", e); }
      }
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
            child.castShadow = this.shadowsEnabled;
            child.receiveShadow = this.shadowsEnabled;
          }
        });
        
        this.flashlightModel = model;
        console.log("PSX Flashlight 001 (BLACK) loaded successfully!");
        if (this.renderer) {
          try { this.renderer.compile(model, this.camera); } catch (e) { console.warn("Warmup compile failed for flashlight:", e); }
        }
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
      const scene = gltf.scene;
      
      // Wrap scene in a parent group to normalize offset coordinates
      const wrapper = new THREE.Group();
      wrapper.add(scene);
      
      // Calculate and apply centering of the model
      const box = new THREE.Box3().setFromObject(scene);
      const center = new THREE.Vector3();
      box.getCenter(center);
      
      // Shift child nodes inside scene so they are centered at (0, 0, 0)
      scene.position.x = -center.x;
      scene.position.z = -center.z;
      scene.position.y = -box.min.y;
      
      this.chestModel = wrapper;
      console.log("Low-poly GLTF chest model loaded and centered successfully!");
      if (this.renderer) {
        try { this.renderer.compile(wrapper, this.camera); } catch (e) { console.warn("Warmup compile failed for chest:", e); }
      }
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
              child.castShadow = this.shadowsEnabled;
              child.receiveShadow = this.shadowsEnabled;
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

          // Create a wrapper group to normalize positions and offsets
          const wrapper = new THREE.Group();
          wrapper.add(fbx);

          // Reset rotation (stand upright by default)
          fbx.rotation.set(0, 0, 0);

          // Get raw size to scale mathematically to target height (using max dimension as height)
          const box = new THREE.Box3().setFromObject(fbx);
          const size = new THREE.Vector3();
          box.getSize(size);
          const rawHeight = Math.max(size.x, size.y, size.z);
          const scaleFactor = targetHeight / (rawHeight > 0.001 ? rawHeight : 1.0);
          fbx.scale.set(scaleFactor, scaleFactor, scaleFactor);

          // Center horizontally and align feet to Y = 0 based on scaled bounding box
          const boxScaled = new THREE.Box3().setFromObject(fbx);
          const center = new THREE.Vector3();
          boxScaled.getCenter(center);

          fbx.position.x = -center.x;
          fbx.position.z = -center.z;
          fbx.position.y = -boxScaled.min.y;
          
          wrapper.userData = {
            initialY: 0,
            initialScaleX: 1.0,
            initialScaleY: 1.0,
            initialScaleZ: 1.0
          };
          
          this[modelProp] = wrapper;
          console.log(`FBX Character ${name} loaded, centered, scaled to ${targetHeight}m, and foot-aligned successfully!`);
          if (this.renderer) {
            try { this.renderer.compile(wrapper, this.camera); } catch (e) { console.warn("Warmup compile failed for character:", e); }
          }
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
    
    for (let i = 0; i < pCount; i++) {
      const pMesh = new THREE.Mesh(this.chestParticleGeom, this.chestParticleMat);
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

  buildStarrySkyTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");

    // 1. Dark cosmic gradient background (Deep space night)
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0.0, "#010206"); // Deep space black at zenith
    grad.addColorStop(0.4, "#030612"); // Dark midnight sky
    grad.addColorStop(0.75, "#070b1a"); // Eerie deep navy
    grad.addColorStop(1.0, "#0a0e1a"); // Horizon dark slate
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 512);

    // 2. Soft Milky Way / Cosmic Nebula dust cloud
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const nebGrad = ctx.createRadialGradient(480, 160, 20, 500, 180, 280);
    nebGrad.addColorStop(0.0, "rgba(56, 189, 248, 0.14)"); // Soft cyan glow
    nebGrad.addColorStop(0.4, "rgba(139, 92, 246, 0.09)"); // Subtle violet glow
    nebGrad.addColorStop(1.0, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = nebGrad;
    ctx.beginPath();
    ctx.arc(500, 180, 280, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. Random background stars (800+ tiny twinkling stars)
    let seed = 777;
    const rng = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    for (let i = 0; i < 800; i++) {
      const x = rng() * 1024;
      const y = rng() * 340; // Keep stars mostly in upper sky
      const radius = 0.35 + rng() * 1.4;
      const alpha = 0.2 + rng() * 0.8;
      
      const starColors = ["#ffffff", "#f0f9ff", "#e0f2fe", "#fef3c7", "#fed7aa", "#bae6fd"];
      const color = starColors[Math.floor(rng() * starColors.length)];

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Soft halo glow for brighter stars
      if (radius > 1.25) {
        ctx.globalAlpha = alpha * 0.35;
        ctx.beginPath();
        ctx.arc(x, y, radius * 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 4. Prominent Orion Constellation (Avcı Takımyıldızı)
    const ox = 512;
    const oy = 140;

    const orionStars = [
      { name: "Betelgeuse", dx: -42, dy: -58, r: 3.4, color: "#f97316" }, // Reddish-orange supergiant (Top-Left)
      { name: "Bellatrix",  dx:  44, dy: -50, r: 2.7, color: "#e0f2fe" }, // Blue-white giant (Top-Right)
      { name: "Meissa",     dx:   2, dy: -88, r: 2.1, color: "#ffffff" }, // Head star
      
      // Orion's Belt (3 perfectly aligned stars: Alnitak, Alnilam, Mintaka)
      { name: "Alnitak",   dx: -22, dy:   2, r: 2.7, color: "#38bdf8" }, // Left belt
      { name: "Alnilam",   dx:   0, dy:   0, r: 2.9, color: "#ffffff" }, // Center belt
      { name: "Mintaka",   dx:  22, dy:  -2, r: 2.7, color: "#38bdf8" }, // Right belt
      
      // Orion's Sword / Nebula
      { name: "M42 Nebula", dx:  -2, dy:  28, r: 2.4, color: "#c084fc", isNebula: true },
      { name: "Hatysa",     dx:  -4, dy:  45, r: 1.9, color: "#e0f2fe" },
      
      // Feet
      { name: "Saiph",      dx: -34, dy:  65, r: 2.5, color: "#e0f2fe" }, // Bottom-Left
      { name: "Rigel",      dx:  50, dy:  58, r: 3.6, color: "#60a5fa" }  // Bright bluish supergiant (Bottom-Right)
    ];

    // Delicate constellation connecting lines
    const lines = [
      [orionStars[0], orionStars[2]], // Betelgeuse to Meissa
      [orionStars[1], orionStars[2]], // Bellatrix to Meissa
      [orionStars[0], orionStars[3]], // Betelgeuse to Alnitak
      [orionStars[1], orionStars[5]], // Bellatrix to Mintaka
      [orionStars[3], orionStars[4]], // Belt 1-2
      [orionStars[4], orionStars[5]], // Belt 2-3
      [orionStars[3], orionStars[8]], // Alnitak to Saiph
      [orionStars[5], orionStars[9]], // Mintaka to Rigel
      [orionStars[4], orionStars[6]], // Belt center to Orion Nebula
      [orionStars[6], orionStars[7]]  // Nebula to Hatysa
    ];

    ctx.save();
    ctx.strokeStyle = "rgba(147, 197, 253, 0.22)"; // Eerie pale blue constellation lines
    ctx.lineWidth = 1.2;
    for (const [s1, s2] of lines) {
      ctx.beginPath();
      ctx.moveTo(ox + s1.dx, oy + s1.dy);
      ctx.lineTo(ox + s2.dx, oy + s2.dy);
      ctx.stroke();
    }
    ctx.restore();

    // Draw Orion Stars with glowing halos
    for (const s of orionStars) {
      const sx = ox + s.dx;
      const sy = oy + s.dy;

      ctx.save();
      const starGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, s.r * 3.8);
      starGrad.addColorStop(0.0, s.color);
      starGrad.addColorStop(0.4, s.isNebula ? "rgba(192, 132, 252, 0.45)" : "rgba(255, 255, 255, 0.35)");
      starGrad.addColorStop(1.0, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = starGrad;
      ctx.beginPath();
      ctx.arc(sx, sy, s.r * 3.8, 0, Math.PI * 2);
      ctx.fill();

      // Core star point
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(sx, sy, s.r * 0.75, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  rebuildScene(state) {
    // Traverse and dispose all geometry and material buffers to prevent WebGL VRAM memory leaks
    this.scene.traverse((node) => {
      if (node.isMesh) {
        if (node.geometry) {
          try { node.geometry.dispose(); } catch(e){}
        }
        if (node.material) {
          if (Array.isArray(node.material)) {
            node.material.forEach(mat => {
              try { mat.dispose(); } catch(e){}
            });
          } else {
            try { node.material.dispose(); } catch(e){}
          }
        }
      }
    });

    this.camera.traverse((node) => {
      if (node.isMesh) {
        if (node.geometry) {
          try { node.geometry.dispose(); } catch(e){}
        }
        if (node.material) {
          if (Array.isArray(node.material)) {
            node.material.forEach(mat => {
              try { mat.dispose(); } catch(e){}
            });
          } else {
            try { node.material.dispose(); } catch(e){}
          }
        }
      }
    });

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
    if (this.shadowMonsterMeshes) {
      this.shadowMonsterMeshes.forEach(mesh => {
        if (mesh) this.scene.remove(mesh);
      });
    }
    this.shadowMonsterMeshes = [];
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

    const isUnderground = (state.currentFloor > 0);
    const isDeepestFloor = (state.currentFloor >= 2);

    // 1. Lighting Setup (Floor 2+ is deepest pitch-black horror vault!)
    const ambientVal = isDeepestFloor ? 0.003 : (isUnderground ? 0.005 : 0.035);
    this.ambientLight = new THREE.AmbientLight("#0f172a", ambientVal);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight("#1e293b", isUnderground ? 0.0 : 0.04); // No moonlight underground!
    this.dirLight.position.set(10, 30, 10);
    this.dirLight.castShadow = isUnderground ? false : this.shadowsEnabled;
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    this.dirLight.shadow.mapSize.width = isMobile ? 512 : 1024;
    this.dirLight.shadow.mapSize.height = isMobile ? 512 : 1024;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 60;
    const d = 12; // focused shadow orthographic volume around player
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0005;
    this.scene.add(this.dirLight);

    // Configure Fog dynamically based on floor level
    if (this.scene.fog) {
      if (isDeepestFloor) {
        this.scene.fog.color.set("#0e0204"); // Crimson blood void dark fog
        this.scene.fog.near = 0.5;
        this.scene.fog.far = 3.2; // Ultra tight, claustrophobic horror visibility
      } else if (isUnderground) {
        this.scene.fog.color.set("#010103"); // Cold pitch-black zindan fog
        this.scene.fog.near = 0.8;
        this.scene.fog.far = 4.0;
      } else {
        this.scene.fog.color.set("#060913"); // Night sky outdoor fog
        this.scene.fog.near = 1.5;
        this.scene.fog.far = 6.0;
      }
    }
    // Update background color/texture
    if (isDeepestFloor) {
      this.scene.background = new THREE.Color("#0e0204");
    } else if (isUnderground) {
      this.scene.background = new THREE.Color("#010103");
    } else {
      if (!this.starrySkyTexture) {
        this.starrySkyTexture = this.buildStarrySkyTexture();
      }
      this.scene.background = this.starrySkyTexture;
    }

    // Flashlight SpotLight - PRIMARY neutral white light source with realistic flashlight properties (decay = 1.1, range = 11.0m)
    this.lantern = new THREE.SpotLight("#ffffff", 4.5, 11.0, Math.PI / 6.0, 0.85, 1.1);
    this.lantern.castShadow = false; // Disable shadows to prevent hand/self-shadow blocking bugs
    this.scene.add(this.lantern);

    // Add default SpotLight target to scene space to track world coordinates
    if (!this.lantern.target) {
      this.lantern.target = new THREE.Object3D();
    }
    this.scene.add(this.lantern.target);

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
    this.rainParticles.visible = !isUnderground; // Hide rain particles underground!
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
    this.groundFogParticles.visible = !isUnderground; // Hide ground fog particles underground!
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
      color: "#1d261d", // Slightly lighter green so it is visible under fener
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

    let activeWallMat;
    let activeFloorMat;

    if (currentFloor === 0) {
      activeWallMat = hedgeMat;
      activeFloorMat = floorMat;
    } else if (currentFloor === 1) {
      activeWallMat = new THREE.MeshStandardMaterial({
        map: this.brickTexture,
        bumpMap: this.brickBump,
        bumpScale: 0.08,
        color: "#3a4454", // cold grey stone zindan
        roughness: 0.85
      });
      activeFloorMat = new THREE.MeshStandardMaterial({
        map: this.floorTexture,
        bumpMap: this.brickBump,
        bumpScale: 0.08,
        color: "#242830", // zindan zemin gri
        roughness: 0.9
      });
    } else {
      // Floor 2+ (Deepest floor - Crimson/Blood Vault Horror Theme)
      activeWallMat = new THREE.MeshStandardMaterial({
        map: this.brickTexture,
        bumpMap: this.brickBump,
        bumpScale: 0.10,
        color: "#4d2226", // nemli bordo/kızıl-kahve taşlar
        roughness: 0.80
      });
      activeFloorMat = new THREE.MeshStandardMaterial({
        map: this.floorTexture,
        bumpMap: this.brickBump,
        bumpScale: 0.10,
        color: "#2b1215", // nemli kan kırmızısı zemin
        roughness: 0.85
      });
    }

    for (let y = 0; y < height; y++) {
      const row = [];
      for (let x = 0; x < width; x++) {
        const cell = grid[y][x];
        const cellGroup = new THREE.Group();

        if (cell.type !== "wall") {
          // A. Path Floor Panel
          const floorMesh = new THREE.Mesh(floorGeo, activeFloorMat);
          floorMesh.rotation.x = -Math.PI / 2;
          floorMesh.position.set(0, 0, 0);
          cellGroup.add(floorMesh);

          // Add tiny, creepy blood puddles on Floor 0 (Ground Floor) paths!
          if (!isUnderground && cell.type === "floor" && !(x === 1 && y === 1)) {
            // Seeded pseudo-random using cell coordinates (100% deterministic and lag-free)
            const cellRand = Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
            if (cellRand < 0.08) { // 8% chance per floor cell
              const bloodGroup = new THREE.Group();
              const numDrops = 1 + Math.floor(cellRand * 30) % 3; // 1 to 3 drops/puddles
              for (let dIdx = 0; dIdx < numDrops; dIdx++) {
                const dropRandX = (Math.sin(x * 45.1 + y * 83.2 + dIdx * 19.3) * 43758.5453) % 1;
                const dropRandY = (Math.cos(x * 12.4 + y * 39.1 + dIdx * 97.4) * 43758.5453) % 1;
                const radiusRand = (Math.sin(x * 78.9 + y * 12.5 + dIdx * 54.1) * 43758.5453) % 1;
                
                const offsetX = (dropRandX * 2.0 - 1.0) * 0.25; // offset [-0.25, 0.25]
                const offsetY = (dropRandY * 2.0 - 1.0) * 0.25;
                const radius = 0.04 + Math.abs(radiusRand) * 0.12; // radius between 0.04m and 0.16m
                
                const puddleGeo = new THREE.CircleGeometry(radius, 12);
                const puddleMat = new THREE.MeshStandardMaterial({
                  color: "#7f1d1d", // Dark crimson blood red
                  roughness: 0.08,  // Very glossy wet finish
                  metalness: 0.1,
                  transparent: true,
                  opacity: 0.85
                });
                const puddle = new THREE.Mesh(puddleGeo, puddleMat);
                puddle.rotation.x = -Math.PI / 2;
                puddle.position.set(offsetX, 0.003, offsetY); // slightly raised above floor
                puddle.userData.isDecoration = true;
                bloodGroup.add(puddle);
              }
              cellGroup.add(bloodGroup);
            }
          }

          // B. Ceilings (Only underground!)
          if (isUnderground) {
            const ceilingMesh = new THREE.Mesh(floorGeo, activeFloorMat);
            ceilingMesh.rotation.x = Math.PI / 2; // Facing down
            ceilingMesh.position.set(0, 1.25, 0); // At the top of the walls
            cellGroup.add(ceilingMesh);
          }

          // Random Floor Details (ONLY small grass-like pieces and mushrooms)
          const randVal = Math.random();
          if (randVal < 0.15) {
            // Spooky Glowing Bioluminescent Mushrooms (Blue-cyan cap - performance optimized emissive material, no dynamic light)
            const mush = new THREE.Group();
            const stem = new THREE.Mesh(stemMGeo, stemMMat);
            stem.position.y = 0.04;
            stem.userData.isDecoration = true;
            
            const glowMushroomMat = new THREE.MeshStandardMaterial({
              color: "#1d4ed8", // deep rich blue
              emissive: "#1d4ed8", // glowing blue
              emissiveIntensity: 0.8, // soft glowing blue, avoids overexposure
              roughness: 0.95 // high roughness eliminates white specular washouts
            });
            const cap = new THREE.Mesh(capMGeo, glowMushroomMat);
            cap.position.y = 0.08;
            cap.userData.isDecoration = true;
            
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
                  leaf.userData.isDecoration = true;
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
                      baseIntensity: 2.2,
                      worldX: x + 0.5 + mount.x,
                      worldZ: y + 0.5 + mount.z
                    });
                  }
                }
              }
            }
          }

          // C. Staircases (Rope Descent Pit or Rope Climb Point)
          if (cell.staircase) {
            const stairSubGroup = new THREE.Group();
            
            if (cell.staircase === "down") {
              // 1. Dark Pit Hole on floor
              const holeGeo = new THREE.PlaneGeometry(0.8, 0.8);
              const holeMat = new THREE.MeshBasicMaterial({ color: "#000000" });
              const holeMesh = new THREE.Mesh(holeGeo, holeMat);
              holeMesh.rotation.x = -Math.PI / 2;
              holeMesh.position.set(0, 0.005, 0); // slightly above floor to prevent Z-fighting
              stairSubGroup.add(holeMesh);

              // 2. Wooden Frame (Support beams on sides and crossbeam on top)
              const postMat = woodMat;
              const postGeo = new THREE.BoxGeometry(0.06, 1.2, 0.06);
              
              const leftPost = new THREE.Mesh(postGeo, postMat);
              leftPost.position.set(-0.35, 0.6, 0);
              const rightPost = new THREE.Mesh(postGeo, postMat);
              rightPost.position.set(0.35, 0.6, 0);
              
              const crossGeo = new THREE.BoxGeometry(0.76, 0.06, 0.06);
              const crossbeam = new THREE.Mesh(crossGeo, postMat);
              crossbeam.position.set(0, 1.15, 0);
              
              stairSubGroup.add(leftPost, rightPost, crossbeam);

              // 3. Rope hanging into the pit
              const ropeGeo = new THREE.CylinderGeometry(0.016, 0.016, 1.6, 6);
              const ropeMat = new THREE.MeshStandardMaterial({ color: "#7a5c3e", roughness: 0.95 }); // thick brown rope
              const ropeMesh = new THREE.Mesh(ropeGeo, ropeMat);
              ropeMesh.position.set(0, 0.35, 0); // hangs from 1.15 down past the floor (-0.45)
              stairSubGroup.add(ropeMesh);

              // Eerie red light glowing from bottom of the pit
              const pitLight = new THREE.PointLight("#ff1e1e", 3.0, 4.0);
              pitLight.position.set(0, 0.3, 0);
              stairSubGroup.add(pitLight);
            } else {
              // Staircase "up" (Rope Climb Point)
              // 1. Rope hanging from ceiling
              const ropeGeo = new THREE.CylinderGeometry(0.016, 0.016, 1.4, 6);
              const ropeMat = new THREE.MeshStandardMaterial({ color: "#7a5c3e", roughness: 0.95 });
              const ropeMesh = new THREE.Mesh(ropeGeo, ropeMat);
              ropeMesh.position.set(0, 0.6, 0); // hangs from ceiling (1.25) down to floor (0.1)
              stairSubGroup.add(ropeMesh);

              // Eerie green light glowing from escape hatch above
              const climbLight = new THREE.PointLight("#10b981", 3.0, 4.0);
              climbLight.position.set(0, 1.1, 0);
              stairSubGroup.add(climbLight);
            }

            cellGroup.add(stairSubGroup);
          }

          // D. Exit Portal (Modern, beautiful gyroscopic dimensional portal aligned with corridor walls)
          if (cell.isExit) {
            const portalGroup = new THREE.Group();
            portalGroup.position.set(0, 0.0, 0); // Ground-aligned gate

            const ironMat = new THREE.MeshStandardMaterial({ color: "#18181b", metalness: 0.8, roughness: 0.3 });
            const stoneMat = new THREE.MeshStandardMaterial({
              map: this.brickTexture,
              bumpMap: this.brickBump,
              bumpScale: 0.06,
              color: "#3f3f46", // Dark slate stone
              roughness: 0.95
            });

            // 1. Gothic Stone Archway (wider and positioned to touch the side walls exactly at -0.5 and +0.5)
            const colL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.25, 0.14), stoneMat);
            colL.position.set(-0.43, 0.625, 0);
            const colR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.25, 0.14), stoneMat);
            colR.position.set(0.43, 0.625, 0);
            const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.12, 0.16), stoneMat);
            lintel.position.set(0, 1.25, 0);
            portalGroup.add(colL, colR, lintel);

            // 2. Bright Golden Light Plane behind the doors (representing safety & sunlight beyond)
            const lightPlaneGeo = new THREE.PlaneGeometry(0.76, 1.18);
            const lightPlaneMat = new THREE.MeshBasicMaterial({ 
              color: "#fef08a", 
              side: THREE.DoubleSide
            });
            const lightPlane = new THREE.Mesh(lightPlaneGeo, lightPlaneMat);
            lightPlane.position.set(0, 0.59, -0.06);
            portalGroup.add(lightPlane);

            // 3. Ancient Heavy Wooden Dungeon Double-Doors (slightly ajar/open outwards)
            const doorL = new THREE.Mesh(new THREE.BoxGeometry(0.38, 1.15, 0.04), woodMat);
            doorL.position.set(-0.25, 0.575, 0.12);
            doorL.rotation.y = Math.PI / 4.0; // swing open left
            
            const doorR = new THREE.Mesh(new THREE.BoxGeometry(0.38, 1.15, 0.04), woodMat);
            doorR.position.set(0.25, 0.575, 0.12);
            doorR.rotation.y = -Math.PI / 4.0; // swing open right

            // Add iron hinges/bands to make them look reinforced
            const bandL1 = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.024, 0.045), ironMat);
            bandL1.position.set(-0.25, 0.35 + 0.575, 0.12);
            bandL1.rotation.y = Math.PI / 4.0;
            const bandL2 = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.024, 0.045), ironMat);
            bandL2.position.set(-0.25, -0.35 + 0.575, 0.12);
            bandL2.rotation.y = Math.PI / 4.0;

            const bandR1 = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.024, 0.045), ironMat);
            bandR1.position.set(0.25, 0.35 + 0.575, 0.12);
            bandR1.rotation.y = -Math.PI / 4.0;
            const bandR2 = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.024, 0.045), ironMat);
            bandR2.position.set(0.25, -0.35 + 0.575, 0.12);
            bandR2.rotation.y = -Math.PI / 4.0;

            portalGroup.add(doorL, doorR, bandL1, bandL2, bandR1, bandR2);

            // 4. Soft Golden point light leaking into the dark hallway
            const portalLight = new THREE.PointLight("#fbbf24", 5.0, 4.0);
            portalLight.position.set(0, 0.58, -0.15); // Behind the door
            portalGroup.add(portalLight);

            // Set portal orientation based on the entry path (always faces the player, blocks hallway width)
            const isFloor = (tx, ty) => {
              if (tx < 0 || tx >= width || ty < 0 || ty >= height) return false;
              return grid[ty][tx].type === "floor";
            };
            if (isFloor(x, y - 1) || isFloor(x, y + 1)) {
              portalGroup.rotation.y = 0; // Spans East-West (blocks North-South corridor entry)
            } else if (isFloor(x - 1, y) || isFloor(x + 1, y)) {
              portalGroup.rotation.y = Math.PI / 2; // Spans North-South (blocks East-West corridor entry)
            } else {
              portalGroup.rotation.y = 0;
            }

            cellGroup.add(portalGroup);
            
            // Save references for dynamic animation
            this.exitPortals.push({
              group: portalGroup,
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
                  child.castShadow = this.shadowsEnabled;
                  child.receiveShadow = this.shadowsEnabled;
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
              // Resized Stone Well Base (Formal scale, does not block the corridor passage)
              const wellBase = new THREE.Mesh(
                new THREE.CylinderGeometry(0.28, 0.28, 0.45, 14),
                new THREE.MeshStandardMaterial({ 
                  map: this.brickTexture, 
                  bumpMap: this.brickBump,
                  bumpScale: 0.05,
                  color: "#666666",
                  roughness: 0.9 
                })
              );
              wellBase.position.y = 0.225;
              npcSubGroup.add(wellBase);

              // Water inside: completely flat black to represent a deep, dark well
              const water = new THREE.Mesh(
                new THREE.CylinderGeometry(0.25, 0.25, 0.02, 10),
                new THREE.MeshBasicMaterial({ color: "#000000" })
              );
              water.position.y = 0.435;
              npcSubGroup.add(water);

              // Wooden posts on both sides (scaled to smaller proportions)
              const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.80, 6), woodMat);
              postL.position.set(-0.22, 0.40, 0);
              const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.80, 6), woodMat);
              postR.position.set(0.22, 0.40, 0);
              npcSubGroup.add(postL, postR);

              // Horizontal winding spool
              const spool = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.45, 6), woodMat);
              spool.rotation.z = Math.PI / 2;
              spool.position.set(0, 0.72, 0);
              npcSubGroup.add(spool);

              // Sloped wooden roof
              const roofL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.015, 0.38), woodMat);
              roofL.position.set(-0.12, 0.85, 0);
              roofL.rotation.z = -Math.PI / 8; // sloped left
              
              const roofR = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.015, 0.38), woodMat);
              roofR.position.set(0.12, 0.85, 0);
              roofR.rotation.z = Math.PI / 8; // sloped right

              npcSubGroup.add(roofL, roofR);
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
              // Beautiful wooden stand on the floor holding the textured clue
              const standGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.60, 6);
              const stand = new THREE.Mesh(standGeo, woodMat);
              stand.position.set(0, 0.30, 0);
              
              const topPlank = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 0.24), woodMat);
              topPlank.position.set(0, 0.60, 0);
              topPlank.rotation.x = Math.PI / 6; // slanted forward
              
              const paperGeo = new THREE.BoxGeometry(0.20, 0.20, 0.01);
              const paperMat = new THREE.MeshStandardMaterial({ 
                map: makeClueTexture(cell.puzzleClue),
                roughness: 0.95
              });
              const paperMesh = new THREE.Mesh(paperGeo, paperMat);
              paperMesh.position.set(0, 0.012, 0);
              topPlank.add(paperMesh);
              
              clueSubGroup.add(stand, topPlank);
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

            cellGroup.add(clueSubGroup);
          }

          // F3. Lore Parchments (Readable story logs)
          if (cell.loreParchment) {
            const loreSubGroup = new THREE.Group();
            loreSubGroup.userData = { type: "lore", x: x, y: y, cell: cell };

            // Find an adjacent wall to mount the lore paper on
            let offsetX = 0, offsetZ = 0, rotY = 0;
            const dirs = [
              { dx: 0, dy: -1, ox: 0, oz: -0.49, r: 0 },         // North wall
              { dx: 0, dy: 1, ox: 0, oz: 0.49, r: Math.PI },      // South wall
              { dx: 1, dy: 0, ox: 0.49, oz: 0, r: -Math.PI / 2 },  // East wall
              { dx: -1, dy: 0, ox: -0.49, oz: 0, r: Math.PI / 2 }  // West wall
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
              // Beautiful wooden stand on the floor holding the textured lore
              const standGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.60, 6);
              const stand = new THREE.Mesh(standGeo, woodMat);
              stand.position.set(0, 0.30, 0);
              
              const topPlank = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 0.24), woodMat);
              topPlank.position.set(0, 0.60, 0);
              topPlank.rotation.x = Math.PI / 6; // slanted forward
              
              const paperGeo = new THREE.BoxGeometry(0.20, 0.20, 0.01);
              const paperMat = new THREE.MeshStandardMaterial({ 
                map: makeLoreTexture(cell.loreParchment),
                roughness: 0.95
              });
              const paperMesh = new THREE.Mesh(paperGeo, paperMat);
              paperMesh.position.set(0, 0.012, 0);
              topPlank.add(paperMesh);
              
              loreSubGroup.add(stand, topPlank);
            } else {
              const boardGeo = new THREE.BoxGeometry(0.24, 0.32, 0.015);
              const boardMesh = new THREE.Mesh(boardGeo, woodMat);
              
              const paperGeo = new THREE.BoxGeometry(0.20, 0.28, 0.02);
              const paperMat = new THREE.MeshStandardMaterial({ 
                map: makeLoreTexture(cell.loreParchment),
                roughness: 0.95
              });
              const paperMesh = new THREE.Mesh(paperGeo, paperMat);
              paperMesh.position.set(0, 0, 0.005);
              
              const noteGroup = new THREE.Group();
              noteGroup.add(boardMesh, paperMesh);
              noteGroup.position.set(offsetX, 0.64, offsetZ);
              noteGroup.rotation.y = rotY;
              loreSubGroup.add(noteGroup);
            }

            cellGroup.add(loreSubGroup);
          }

          // G. Obstacles (Stylized premium models instead of single blocks)
          if (cell.obstacle && !cell.obstacle.resolved) {
            const obsSubGroup = new THREE.Group();
            obsSubGroup.userData = { type: "obstacle", x: x, y: y, cell: cell };

            const type = cell.obstacle.type;
            if (type === "gate") {
              const ironMat = new THREE.MeshStandardMaterial({ color: "#27272a", metalness: 0.85, roughness: 0.2 });
              const goldTipMat = new THREE.MeshStandardMaterial({ color: "#d97706", metalness: 0.9, roughness: 0.1 });
              
              // 0. Solid back wall panel (dark stone, blocks view behind gate)
              const backWallMat = new THREE.MeshStandardMaterial({ color: "#1a1a1e", roughness: 0.95, metalness: 0.1 });
              const backWall = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.25, 0.04), backWallMat);
              backWall.position.set(0, 0.625, -0.02);
              obsSubGroup.add(backWall);

              // 1. Solid Outer Door Frame (left post, right post, top header)
              const frameL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.25, 0.04), ironMat);
              frameL.position.set(-0.52, 0.625, 0);
              const frameR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.25, 0.04), ironMat);
              frameR.position.set(0.52, 0.625, 0);
              const frameTop = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.04, 0.04), ironMat);
              frameTop.position.set(0, 1.23, 0);
              obsSubGroup.add(frameL, frameR, frameTop);

              // 2. Vertical bars (spaced between the frames)
              for (let i = -0.40; i <= 0.40; i += 0.133) {
                const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.21), ironMat);
                bar.position.set(i, 0.605, 0);
                obsSubGroup.add(bar);
                
                // Gold spikes at the top (touching the ceiling)
                const spike = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.06, 6), goldTipMat);
                spike.position.set(i, 1.24, 0);
                obsSubGroup.add(spike);
              }
              // 3. Horizontal crossbeams (top & bottom structural support)
              const beamTop = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.024, 0.024), ironMat);
              beamTop.position.set(0, 1.15, 0);
              const beamBottom = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.024, 0.024), ironMat);
              beamBottom.position.set(0, 0.08, 0);
              
              // 4. Large Golden Padlock in the center (clearly signaling it is a locked door!)
              const lockBody = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.04), goldTipMat);
              lockBody.position.set(0, 0.60, 0.025);
              const lockShackle = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.01, 8, 12, Math.PI), ironMat);
              lockShackle.position.set(0, 0.65, 0.025);
              obsSubGroup.add(beamTop, beamBottom, lockBody, lockShackle);
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
              // Heavy Reinforced Medieval Wooden Barricade (Width: 1.05 for flush fit into corridor walls with ZERO side gaps)
              const barGroup = new THREE.Group();

              const darkWoodMat = new THREE.MeshStandardMaterial({ color: "#382010", roughness: 0.85, metalness: 0.05 });
              const plankWoodMat = new THREE.MeshStandardMaterial({ color: "#4a2d18", roughness: 0.80, metalness: 0.05 });
              const altWoodMat = new THREE.MeshStandardMaterial({ color: "#2f1b0c", roughness: 0.90, metalness: 0.05 });
              const ironBandMat = new THREE.MeshStandardMaterial({ color: "#2a2d32", roughness: 0.40, metalness: 0.85 });
              const rivetMat = new THREE.MeshStandardMaterial({ color: "#78818f", roughness: 0.30, metalness: 0.90 });

              // 1. Two Heavy Vertical Anchor Posts (anchored directly to corridor side walls)
              const leftPost = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 0.12), darkWoodMat);
              leftPost.position.set(-0.46, 0.55, 0);
              const rightPost = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 0.12), darkWoodMat);
              rightPost.position.set(0.46, 0.55, 0);
              barGroup.add(leftPost, rightPost);

              // 2. 5 Horizontal Weathered Wooden Planks (Width: 1.05 to penetrate wall edges)
              const plankHeights = [0.15, 0.35, 0.55, 0.75, 0.95];
              plankHeights.forEach((yPos, i) => {
                const mat = i % 2 === 0 ? plankWoodMat : altWoodMat;
                const plank = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.18, 0.05), mat);
                plank.position.set(0, yPos, (i % 2) * 0.01);
                barGroup.add(plank);

                // Iron reinforcement straps on edges
                const leftStrap = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.19, 0.065), ironBandMat);
                leftStrap.position.set(-0.42, yPos, 0.005);
                const rightStrap = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.19, 0.065), ironBandMat);
                rightStrap.position.set(0.42, yPos, 0.005);
                barGroup.add(leftStrap, rightStrap);

                // Metallic Rivet Bolts on straps
                const leftRivet = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.08, 6), rivetMat);
                leftRivet.rotation.x = Math.PI / 2;
                leftRivet.position.set(-0.42, yPos, 0.01);

                const rightRivet = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.08, 6), rivetMat);
                rightRivet.rotation.x = Math.PI / 2;
                rightRivet.position.set(0.42, yPos, 0.01);
                barGroup.add(leftRivet, rightRivet);
              });

              // 3. Heavy Diagonal Cross Braces (Mounted across front with central iron hub)
              const cross1 = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.12, 0.04), darkWoodMat);
              cross1.position.set(0, 0.55, 0.045);
              cross1.rotation.z = Math.atan2(0.8, 0.9);

              const cross2 = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.12, 0.04), darkWoodMat);
              cross2.position.set(0, 0.55, 0.065);
              cross2.rotation.z = -Math.atan2(0.8, 0.9);

              const hub = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.08), ironBandMat);
              hub.position.set(0, 0.55, 0.06);

              const hubRivet = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.10, 8), rivetMat);
              hubRivet.rotation.x = Math.PI / 2;
              hubRivet.position.set(0, 0.55, 0.07);

              barGroup.add(cross1, cross2, hub, hubRivet);
              obsSubGroup.add(barGroup);
            } else if (type === "chasm") {
              const chasm = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.85), new THREE.MeshBasicMaterial({ color: "#000" }));
              chasm.rotation.x = -Math.PI / 2;
              chasm.position.y = 0.01;
              obsSubGroup.add(chasm);
            } else if (type === "codeLock") {
              // Detailed Code Lock Gate: iron bars + a number pad panel in the center
              const ironMat = new THREE.MeshStandardMaterial({ color: "#27272a", metalness: 0.85, roughness: 0.2 });
              const goldTipMat = new THREE.MeshStandardMaterial({ color: "#d97706", metalness: 0.9, roughness: 0.1 });
              
              // 0. Solid back wall panel (dark stone, blocks view behind codeLock gate)
              const backWallMat = new THREE.MeshStandardMaterial({ color: "#1a1a1e", roughness: 0.95, metalness: 0.1 });
              const backWall = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.25, 0.04), backWallMat);
              backWall.position.set(0, 0.625, -0.02);
              obsSubGroup.add(backWall);

              // 1. Solid Outer Door Frame (left post, right post, top header)
              const frameL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.25, 0.04), ironMat);
              frameL.position.set(-0.52, 0.625, 0);
              const frameR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.25, 0.04), ironMat);
              frameR.position.set(0.52, 0.625, 0);
              const frameTop = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.04, 0.04), ironMat);
              frameTop.position.set(0, 1.23, 0);
              obsSubGroup.add(frameL, frameR, frameTop);

              // 2. Vertical bars (spaced between the frames)
              for (let i = -0.40; i <= 0.40; i += 0.16) {
                const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.21), ironMat);
                bar.position.set(i, 0.605, 0);
                obsSubGroup.add(bar);

                // Gold spikes at the top (touching the ceiling)
                const spike = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.06, 6), goldTipMat);
                spike.position.set(i, 1.24, 0);
                obsSubGroup.add(spike);
              }
              // 3. Horizontal crossbeams
              const beamT = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.024, 0.024), ironMat);
              beamT.position.set(0, 1.15, 0);
              const beamB = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.024, 0.024), ironMat);
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
              
              // PointLight removed for performance — emissive screen material provides sufficient glow
            } else {
              // Unknown obstacle type fallback
              const keyPlate = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.26, 0.04), new THREE.MeshStandardMaterial({ color: "#ef4444" }));
              keyPlate.position.y = 0.36;
              obsSubGroup.add(keyPlate);
            }
            
            // Determine orientation of gate/barricade/codeLock/ivy obstacles based strictly on physical corridor walls
            if (type === "gate" || type === "barricade" || type === "codeLock" || type === "ivy") {
              const isWall = (tx, ty) => {
                if (tx < 0 || tx >= width || ty < 0 || ty >= height) return true;
                return grid[ty][tx].type === "wall";
              };

              const westIsWall = isWall(x - 1, y);
              const eastIsWall = isWall(x + 1, y);
              const northIsWall = isWall(x, y - 1);
              const southIsWall = isWall(x, y + 1);

              if (westIsWall && eastIsWall) {
                // Corridor runs North-South (walls on West and East). Spans East-West (rotation 0) to block passage.
                obsSubGroup.rotation.y = 0;
              } else if (northIsWall && southIsWall) {
                // Corridor runs East-West (walls on North and South). Spans North-South (rotation 90deg) to block passage.
                obsSubGroup.rotation.y = Math.PI / 2;
              } else if (westIsWall || eastIsWall) {
                obsSubGroup.rotation.y = 0;
              } else {
                obsSubGroup.rotation.y = Math.PI / 2;
              }
            }

            cellGroup.add(obsSubGroup);
            this.obstacleMeshes[`${x},${y}`] = obsSubGroup;
          }

        } else {
          // H. Solid Wall (🌿 Overgrown Ruins style on Floor 0, 🧱 Solid Stone Dungeon underground)
          const colGroup = new THREE.Group();

          // 1. Wall block
          const wallBlock = new THREE.Mesh(wallGeo, activeWallMat);
          wallBlock.position.set(0, 0.64, 0);
          colGroup.add(wallBlock);

          // 2. Cap (Only ruins floor needs the stone brick cap on top of the hedge wall)
          if (!isUnderground) {
            const stoneCap = new THREE.Mesh(wallCapGeo, capMat);
            stoneCap.position.set(0, 1.305, 0);
            colGroup.add(stoneCap);
          }

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

    // 5. Pre-create and compile shadow monsters to prevent runtime allocation/compile stutters
    this.shadowMonsterMeshes = [];
    const maxMonsters = 2; // Nightmare mode can have at most 2 active monsters
    for (let i = 0; i < maxMonsters; i++) {
      const mesh = new THREE.Group();
      mesh.visible = false; // Start hidden

      // 1. Billboard Jumpscare Face Plane
      const faceMesh = new THREE.Mesh(this.monsterFaceGeom, this.createMonsterFaceMat());
      faceMesh.name = "face";
      faceMesh.position.set(0, 0.75, 0.25);
      mesh.add(faceMesh);

      // 3. Volumetric Smoke Body (15 overlapping black/dark spheres)
      const smokeGroup = new THREE.Group();
      smokeGroup.name = "smokeGroup";
      mesh.add(smokeGroup);

      for (let j = 0; j < 15; j++) {
        const size = 0.25 + Math.random() * 0.25;
        const smokeMesh = new THREE.Mesh(this.monsterSmokeGeom, this.monsterSmokeMat.clone());
        smokeMesh.scale.set(size, size, size);
        smokeMesh.position.set(
          (Math.random() - 0.5) * 0.45,
          0.75 + (Math.random() - 0.5) * 0.45,
          -0.10 + (Math.random() - 0.5) * 0.3
        );
        smokeMesh.userData = {
          initialPos: new THREE.Vector3(smokeMesh.position.x, smokeMesh.position.y, smokeMesh.position.z),
          speedX: 0.5 + Math.random() * 1.5,
          speedY: 0.5 + Math.random() * 1.5,
          speedZ: 0.5 + Math.random() * 1.5,
          phase: Math.random() * Math.PI * 2,
          pulseSpeed: 1.0 + Math.random() * 2.0
        };
        smokeGroup.add(smokeMesh);
      }

      // 4. Red Point Light casting eerie glow on walls (start disabled to prevent light-uniform recompilation)
      const shadowLight = new THREE.PointLight(0xff0000, 0.0, 5.0);
      shadowLight.name = "shadowLight";
      shadowLight.position.set(0, 0.75, 0.2);
      shadowLight.visible = false;
      mesh.add(shadowLight);

      this.scene.add(mesh);
      this.shadowMonsterMeshes.push(mesh);

      // Pre-compile the shadow monster mesh
      if (this.renderer) {
        try { this.renderer.compile(mesh, this.camera); } catch (e) { console.warn("Warmup compile failed for shadow monster:", e); }
      }
    }

    // 6. Pre-create and compile smoke trail particles pool
    this.smokeTrailPool = [];
    const poolSize = 40;
    for (let i = 0; i < poolSize; i++) {
      const trailMat = new THREE.MeshBasicMaterial({
        color: 0x1a0707,
        transparent: true,
        opacity: 0.15,
        depthWrite: false
      });
      const trailMesh = new THREE.Mesh(this.monsterSmokeGeom, trailMat);
      trailMesh.visible = false;
      this.scene.add(trailMesh);
      this.smokeTrailPool.push({
        mesh: trailMesh,
        material: trailMat,
        active: false,
        startTime: 0,
        duration: 0
      });

      // Pre-compile each trail particle
      if (this.renderer) {
        try { this.renderer.compile(trailMesh, this.camera); } catch (e) { console.warn("Warmup compile failed for smoke trail:", e); }
      }
    }

    // Enable shadow casting and receiving for all meshes in the scene graph (excluding decorations for performance)
    this.scene.traverse((node) => {
      if (node.isMesh) {
        node.receiveShadow = this.shadowsEnabled;
        if (!node.userData.isDecoration) {
          node.castShadow = this.shadowsEnabled;
        } else {
          node.castShadow = false;
        }
      }
    });

    // 7. GPU Warmup & Pre-compilation: Compile all materials/meshes to GPU memory before starting game
    if (this.renderer) {
      const visibilityState = [];
      this.scene.traverse((node) => {
        if (node.isMesh || node.isGroup || node.isLight) {
          visibilityState.push({ node, visible: node.visible });
          node.visible = true; // Force visible temporarily to allow compile
        }
      });
      
      try {
        this.renderer.compile(this.scene, this.camera);
      } catch (e) {
        console.warn("GPU Warmup failed:", e);
      }
      
      // Restore original visibility state
      visibilityState.forEach(({ node, visible }) => {
        node.visible = visible;
      });
    }
  }

  draw(state, interpolationFactor = 0.22) {
    this.lastState = state;
    if (this.clock && this.mixers) {
      const dt = Math.min(this.clock.getDelta(), 0.1); // Clamp delta time to 100ms max to prevent large loading spikes!
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

    // 0. Update HUD Compass Needle dynamically at 60fps (smooth relative rotation to exit or staircase)
    if (state.gameState === "playing") {
      const compassNeedle = document.getElementById("compass-needle");
      if (compassNeedle && compassNeedle.style && state.exitCell) {
        let targetX = state.exitCell.x;
        let targetY = state.exitCell.y;
        
        // If the exit is on a different floor, point the compass to the staircase leading to it!
        if (state.exitCell.floor !== currentFloor) {
          let foundStair = null;
          for (let y = 0; y < height; y++) {
            if (!grid[y]) continue;
            for (let x = 0; x < width; x++) {
              if (grid[y][x] && grid[y][x].staircase) {
                foundStair = grid[y][x];
                break;
              }
            }
            if (foundStair) break;
          }
          if (foundStair) {
            targetX = foundStair.x;
            targetY = foundStair.y;
          }
        }

        const dx = targetX - player.visualX;
        const dy = targetY - player.visualY;
        const worldAngle = Math.atan2(dy, dx);
        const relativeAngle = (worldAngle - player.angle) * (180 / Math.PI);
        compassNeedle.style.transform = `rotate(${relativeAngle}deg)`;
      }
    }

    const px = player.visualX;
    const py = player.visualY;

    // Update warm wall torches flickering effect (pulsing flame scales and PointLight intensities)
    if (this.torches && this.torches.length > 0) {
      const time = performance.now() * 0.005;
      let minTorchDist = 999.0;
      const playerMoved = (this.lastTorchCullX === undefined || Math.abs(px - this.lastTorchCullX) > 0.08 || Math.abs(py - this.lastTorchCullY) > 0.08);
      if (playerMoved) {
        this.lastTorchCullX = px;
        this.lastTorchCullY = py;
        
        // Batch calculate torch distances relative to player using fast square root to avoid Math.hypot overhead
        this.torches.forEach(t => {
          if (typeof t.worldX === "number") {
            const dx = px - t.worldX;
            const dz = py - t.worldZ;
            t.lastDist = Math.sqrt(dx * dx + dz * dz);
          } else {
            t.lastDist = 999.0;
          }
        });
        
        // Sort torches in-place by distance so the closest ones are at the front of the array
        this.torches.sort((a, b) => a.lastDist - b.lastDist);
      }

      // Capping visible lights to exactly 6 closest lights in the scene.
      // This maintains a constant light count of exactly 6 in the Three.js scene graph,
      // which completely prevents GPU shader recompilation stutters when walking between rooms.
      const activeLimit = Math.min(this.torches.length, 6);

      this.torches.forEach((t, i) => {
        const flicker = Math.sin(time * 3.3 + i) * 0.18 + Math.cos(time * 6.7 + i * 2.1) * 0.12 + Math.sin(time * 19.3 + i * 3.4) * 0.06;
        
        if (i < activeLimit) {
          t.light.visible = true;
          // Only enable intensity if it is close enough to affect player visuals (under 6.5m)
          if (t.lastDist < 6.5) {
            t.light.intensity = t.baseIntensity + flicker;
          } else {
            t.light.intensity = 0.0;
          }
        } else {
          t.light.visible = false;
          t.light.intensity = 0.0;
        }

        if (t.flame) {
          // Cull flame mesh scale/position matrix updates if too far to be visible to save CPU cycles
          if (t.lastDist < 8.0) {
            t.flame.visible = true;
            const s = 1.0 + flicker * 0.45;
            t.flame.scale.set(s, s * 1.25, s);
            t.flame.position.x = Math.sin(time * 2.5 + i) * 0.003;
            t.flame.position.z = Math.cos(time * 3.1 + i * 1.7) * 0.003;
            t.flame.rotation.y = time * 2.0 + i; // gentle spin
            t.flame.rotation.z = Math.sin(time * 4.0 + i) * 0.05; // tilt sway
          } else {
            t.flame.visible = false;
          }
        }
      });

      // The first element of the sorted list is always the closest torch!
      if (this.torches[0] && typeof this.torches[0].lastDist === "number") {
        minTorchDist = this.torches[0].lastDist;
      }

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

    // Floor background selection
    const isDeepestFloor = (currentFloor >= 2);
    if (isDeepestFloor) {
      this.scene.background = new THREE.Color("#0e0204");
    } else if (isUnderground) {
      this.scene.background = new THREE.Color("#010103");
    } else {
      if (!this.starrySkyTexture) {
        this.starrySkyTexture = this.buildStarrySkyTexture();
      }
      this.scene.background = this.starrySkyTexture;
    }

    // Keep light position synced with player
    if (this.dirLight) {
      this.dirLight.position.set(player.visualX + 8, 16, player.visualY + 8);
      this.dirLight.target.position.set(player.visualX, 0, player.visualY);
      this.dirLight.target.updateMatrixWorld();
    }

    // Toggle lantern light and flame core visibility
    if (this.lantern) {
      if (state.lanternOn && player.fuel > 0) {
        let baseIntensity = isDeepestFloor ? 4.0 : 4.5;
        // Low battery (<20%) OR deepest floor ancient curse causes dynamic flashlight flickering
        if (player.fuel < 20) {
          const rand = Math.random();
          if (rand < 0.18) {
            baseIntensity = 0.5 + Math.random() * 1.5;
          } else if (rand < 0.38) {
            baseIntensity = 2.2 + Math.random() * 1.2;
          }
        } else if (isDeepestFloor && Math.random() < 0.04) {
          // Paranormal subtle flicker in the deepest floor
          baseIntensity *= 0.55 + Math.random() * 0.35;
        }
        this.lantern.intensity = baseIntensity;
        if (this.lanternFlame) this.lanternFlame.visible = true;
      } else {
        this.lantern.intensity = 0.0;
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



    // 2. Direct Chest lid animation & gold particle burst sync (only loops over actual chest meshes, no grid loops)
    for (const key in this.chestLidGroups) {
      const [cx, cy] = key.split(",").map(Number);
      const cell = grid[cy] ? grid[cy][cx] : null;
      if (cell && cell.chest) {
        if (this.chestGoldMeshes[key]) {
          this.chestGoldMeshes[key].visible = cell.chest.opened;
        }
        if (cell.chest.opened) {
          if (!this.triggeredChests.has(key)) {
            this.triggeredChests.add(key);
            this.spawnParticles(cx + 0.5, 0.15, cy + 0.5);
          }
        } else {
          if (this.triggeredChests.has(key)) {
            this.triggeredChests.delete(key);
          }
        }
        const lid = this.chestLidGroups[key];
        const initialX = lid.userData && lid.userData.initialX !== undefined ? lid.userData.initialX : 0;
        const targetRot = cell.chest.opened ? initialX - 1.8 : initialX;
        lid.rotation.x += (targetRot - lid.rotation.x) * 0.15;
      }
    }

    // 3. Direct Obstacle mesh visibility sync
    for (const key in this.obstacleMeshes) {
      const [ox, oy] = key.split(",").map(Number);
      const cell = grid[oy] ? grid[oy][ox] : null;
      if (cell && cell.obstacle) {
        this.obstacleMeshes[key].visible = !cell.obstacle.resolved;
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

    // (3D left-hand equipped accessory removed per user request)

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
            // Snout points towards local +X, so dx = cos(angle), dz = sin(angle)
            const distTraveled = elapsed * 0.65; // speed of 0.65 units per second
            npcGroup.position.x = (x + 0.5) + distTraveled * Math.cos(cell.npc.facingAngle);
            npcGroup.position.z = (y + 0.5) + distTraveled * Math.sin(cell.npc.facingAngle);
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

    // Update Shadow Monsters visual meshes
    if (state.shadowMonsters && state.shadowMonsters.length > 0) {
      if (!this.shadowMonsterMeshes) {
        this.shadowMonsterMeshes = [];
      }
      
      // Ensure we have correct number of slots
      while (this.shadowMonsterMeshes.length < state.shadowMonsters.length) {
        this.shadowMonsterMeshes.push(null);
      }
      
      state.shadowMonsters.forEach((sm, index) => {
        let mesh = this.shadowMonsterMeshes[index];
        if (!mesh) return;

        if (sm.active) {
          const time = Date.now() * 0.005 + index * 10.0;
          const burnRatio = Math.max(0.15, 1.0 - (sm.burnTime / 2.0));
          
          mesh.position.set(sm.x, 0.15 + Math.sin(time) * 0.08, sm.y);
          
          // Face player camera
          const dx = this.camera.position.x - sm.x;
          const dz = this.camera.position.z - sm.y;
          mesh.rotation.y = Math.atan2(dx, dz);
          
          // Update face and light
          const face = mesh.getObjectByName("face");
          if (face) {
            const faceScale = 1.0 + Math.sin(time * 1.5) * 0.05;
            face.scale.set(faceScale, faceScale, faceScale);
            face.rotation.z = Math.sin(time * 2.0) * 0.06;
            
            if (face.material) {
              face.material.opacity = burnRatio;
              if (face.material.userData && face.material.userData.time) {
                face.material.userData.time.value = time;
              }
              if (face.material.uniforms) {
                if (face.material.uniforms.opacity) face.material.uniforms.opacity.value = burnRatio;
                if (face.material.uniforms.time) face.material.uniforms.time.value = time;
              }
            }
          }
          
          const shadowLight = mesh.getObjectByName("shadowLight");
          if (shadowLight) {
            shadowLight.visible = true;
            shadowLight.intensity = 1.2 * burnRatio;
          }
          
          // Animate individual smoke spheres
          const smokeGroup = mesh.getObjectByName("smokeGroup");
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
                if (sphere.material) sphere.material.opacity = 0.25 * burnRatio;
              }
            });
          }
          
          mesh.visible = true;
        } else {
          // Hide if not active (keep in pre-compiled pool)
          mesh.visible = false;
          const shadowLight = mesh.getObjectByName("shadowLight");
          if (shadowLight) {
            shadowLight.visible = false;
            shadowLight.intensity = 0.0;
          }
        }
      });
    }

    // Spawning and fading out trail particles (volumetric smoke trail) - Pooled System
    const now = Date.now();
    if (!this.lastTrailSpawnTime) this.lastTrailSpawnTime = 0;
    if (now - this.lastTrailSpawnTime > 60) {
      this.lastTrailSpawnTime = now;
      
      if (state.shadowMonsters && this.smokeTrailPool) {
        state.shadowMonsters.forEach((sm, index) => {
          if (sm.active) {
            const mesh = this.shadowMonsterMeshes[index];
            if (!mesh) return;
            
            const count = 1 + Math.floor(Math.random() * 2);
            for (let tIdx = 0; tIdx < count; tIdx++) {
              // Find an inactive trail particle from pool
              const p = this.smokeTrailPool.find(item => !item.active);
              if (p) {
                const trailScale = 0.35 + Math.random() * 0.35;
                p.active = true;
                p.spawnTime = now;
                p.lifeTime = 1200 + Math.random() * 400;
                p.initialScale = trailScale;
                p.initialOpacity = 0.30;
                p.burnRatio = Math.max(0.15, 1.0 - (sm.burnTime / 2.0));
                
                p.mesh.position.set(
                  sm.x + (Math.random() - 0.5) * 0.4,
                  mesh.position.y + 0.75 + (Math.random() - 0.5) * 0.4,
                  sm.y + (Math.random() - 0.5) * 0.4
                );
                p.mesh.scale.set(trailScale, trailScale, trailScale);
                p.material.opacity = 0.30;
                p.mesh.visible = true;
              }
            }
          }
        });
      }
    }
    
    // Update and fade active smoke trail particles from pool
    if (this.smokeTrailPool) {
      const currentTime = Date.now();
      this.smokeTrailPool.forEach(p => {
        if (p.active) {
          const elapsed = currentTime - p.spawnTime;
          if (elapsed >= p.lifeTime) {
            // Expire
            p.active = false;
            p.mesh.visible = false;
          } else {
            // Fade and expand particle size
            const ratio = elapsed / p.lifeTime;
            const scale = p.initialScale * (1.0 + ratio * 1.5);
            p.mesh.scale.set(scale, scale, scale);
            p.material.opacity = p.initialOpacity * (1.0 - ratio) * (p.burnRatio || 1.0);
            // Slowly drift upwards
            p.mesh.position.y += 0.005;
          }
        }
      });
    }

    // Update rain particles (highly optimized direct typed array manipulation to prevent FPS drops)
    if (this.rainParticles && this.rainParticles.visible && this.rainVelocities) {
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
    if (this.groundFogParticles && this.groundFogParticles.visible && this.fogDriftVelocities) {
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
          this.particles.splice(i, 1);
        } else {
          p.mesh.scale.set(p.life, p.life, p.life);
        }
      }
    }

    // Update exit portals (soft warm light pulse leaking from behind the gothic doors)
    if (this.exitPortals && this.exitPortals.length > 0) {
      this.exitPortals.forEach(portal => {
        const t = (Date.now() * 0.001) + portal.timeOffset;
        if (portal.light) {
          // Intense warm golden breathing pulse
          portal.light.intensity = 4.0 + Math.sin(t * 3.5) * 1.5;
        }
      });
    }

    // 5. Render Scene to WebGL Viewport
    this.renderer.render(this.scene, this.camera);
  }
}
