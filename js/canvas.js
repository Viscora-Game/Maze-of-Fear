const makeClueTexture = (code) => {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  
  // Aged, dirty parchment color
  ctx.fillStyle = "#cca462"; // Richer, darker yellowed paper base to prevent blowout
  ctx.fillRect(0, 0, 128, 128);
  
  // Vignette/grunge corners on texture (with guard for headless mock compatibility)
  if (ctx.createRadialGradient) {
    const grad = ctx.createRadialGradient(64, 64, 25, 64, 64, 90);
    grad.addColorStop(0, "rgba(80, 50, 20, 0)");
    grad.addColorStop(1, "rgba(35, 15, 5, 0.6)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
  }
  
  // Draw some creepy blood splatters and smear marks on the note (wrapped in guard for headless mock compatibility)
  if (ctx.arc && ctx.stroke) {
    ctx.fillStyle = "#8a0303"; // dark blood red
    for (let i = 0; i < 8; i++) {
      const bx = Math.random() * 128;
      const by = Math.random() * 128;
      const br = 1.2 + Math.random() * 3.8;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
      
      // tiny drip
      if (Math.random() < 0.5) {
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + (Math.random() - 0.5) * 2, by + br * (1.5 + Math.random() * 2));
        ctx.lineWidth = br * 0.55;
        ctx.strokeStyle = "#8a0303";
        ctx.stroke();
      }
    }

    // Draw blood smear marks (darker and thicker for better visibility under flashlight)
    ctx.strokeStyle = "rgba(100, 2, 2, 0.65)";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(10, 20 + Math.random() * 30);
    ctx.lineTo(110, 30 + Math.random() * 30);
    ctx.stroke();
  }
  
  // Clue digits (spooky handwritten style)
  ctx.fillStyle = "#550000"; // even darker dried blood red
  ctx.font = "italic bold 38px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0, 0, 0, 0.75)";
  ctx.shadowBlur = 5;
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
  ctx.fillStyle = "#cca462"; // Richer, darker aged paper base to prevent blowout
  ctx.fillRect(0, 0, 128, 128);
  
  // Vignette corners
  if (ctx.createRadialGradient) {
    const grad = ctx.createRadialGradient(64, 64, 25, 64, 64, 90);
    grad.addColorStop(0, "rgba(80, 50, 20, 0)");
    grad.addColorStop(1, "rgba(35, 15, 5, 0.6)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
  }
  
  // Draw some handwritten lines (darker and thicker for better legibility)
  ctx.strokeStyle = "rgba(25, 10, 2, 0.75)";
  ctx.lineWidth = 3;
  for (let i = 0; i < 6; i++) {
    const y = 30 + i * 15;
    ctx.beginPath();
    ctx.moveTo(20 + Math.random() * 5, y);
    ctx.lineTo(108 - Math.random() * 5, y);
    ctx.stroke();
  }

  // Draw a big fancy gothic celtic cross symbol (instead of system-dependent multi-colored scroll emoji)
  ctx.fillStyle = "#8a0303"; // crimson ink
  ctx.font = "bold 36px 'Georgia', serif";
  ctx.textAlign = "center";
  ctx.fillText("✥", 64, 78);
  
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
};

export class CanvasRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    
    // 1. Initialize WebGL Renderer (optimized for Android WebView & Mobile Play Store APKs)
    const isWebView = /wv|Android.*Version\/[0-9]/i.test(navigator.userAgent) || window.matchMedia('(display-mode: standalone)').matches;
    const isMobileDevice = isWebView || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: false,
      alpha: false,
      stencil: false,
      depth: true,
      powerPreference: isMobileDevice ? "default" : "high-performance",
      precision: isMobileDevice ? "mediump" : "highp",
      failIfMajorPerformanceCaveat: false
    });
    
    // Cap pixel ratio on mobile/WebView devices to 0.85 - 1.0 (prevents 2K/4K mobile screen GPU thermal throttling)
    const maxDPR = isWebView ? 0.85 : (isMobileDevice ? 1.0 : 1.5);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1.0, maxDPR));
    this.renderer.setSize(canvas.width, canvas.height);
    
    // Auto-migrate mobile performance settings (forces legacy savedShadows="true" to "false" on mobile)
    const mobilePerfKey = "maze_mobile_perf_v96";
    if (isMobileDevice && localStorage.getItem(mobilePerfKey) !== "true") {
      localStorage.setItem("maze_shadows", "false");
      localStorage.setItem(mobilePerfKey, "true");
    }

    // Dynamic shadow mapping switch (strictly OFF by default on mobile for 60 FPS fluidity)
    const savedShadows = localStorage.getItem("maze_shadows");
    this.shadowsEnabled = isMobileDevice ? (savedShadows === "true") : (savedShadows !== "false");
    this.renderer.shadowMap.enabled = this.shadowsEnabled;
    this.renderer.shadowMap.type = isMobileDevice ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
    
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

    this.brickTexture = this.buildBrickTexture();
    this.brickBump = this.buildBrickBump();
    this.hedgeTexture = this.buildHedgeTexture();
    this.hedgeBump = this.buildHedgeBump();
    this.woodTexture = this.buildWoodTexture();
    this.woodBump = null;
    this.floorTexture = this.buildFloorTexture();
    this.floorBump = this.buildFloorBump();

    // Load jumpscare texture directly using URL constructor for Vite asset resolution compatibility
    const jumpscareUrl = new URL('../assets/jumpscare.png', import.meta.url).href;
    const loader = new THREE.TextureLoader();
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

            // Discard transparent edges while preserving dark facial features
            if (diffuseColor.a < 0.05) {
              discard;
            }

            // Smooth circular edge vignette fade
            float dist = distance(vUv, vec2(0.5, 0.5));
            float edgeFade = 1.0 - smoothstep(0.38, 0.50, dist);
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
    this.occupiedWallFaces = new Set();
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
        try {
          const lockPromise = this.canvas.requestPointerLock();
          if (lockPromise && typeof lockPromise.catch === "function") {
            lockPromise.catch(() => {}); // Safely swallow browser pointer lock rejection warnings
          }
        } catch (e) {}
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

  buildBrickTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");

    // Base slate stone color
    ctx.fillStyle = "#2d3748"; 
    ctx.fillRect(0, 0, 256, 256);

    const rows = 8;
    const cols = 4;
    const rh = 256 / rows;
    const cw = 256 / cols;

    for (let r = 0; r < rows; r++) {
      const y = r * rh;
      const offset = (r % 2 === 0) ? 0 : cw / 2;
      
      // Mortar lines (darker recessed joints)
      ctx.strokeStyle = "#1a202c";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();

      for (let c = -1; c <= cols; c++) {
        const x = c * cw + offset;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + rh);
        ctx.stroke();

        ctx.save();
        ctx.rect(x + 2, y + 2, cw - 4, rh - 4);
        ctx.clip();
        
        // Deterministic stone shade variation
        const brickSeed = (r * 17 + c * 31) % 100;
        const shade = -12 + (brickSeed % 24);
        
        // Base brick fill with slight blue/grey slate variation
        ctx.fillStyle = `rgb(${45 + shade}, ${55 + shade}, ${72 + shade})`;
        ctx.fillRect(x, y, cw, rh);

        // Soft linear gradient for natural stone beveling/shading
        const grad = ctx.createLinearGradient(x, y, x + cw, y + rh);
        grad.addColorStop(0, "rgba(255,255,255,0.06)");
        grad.addColorStop(0.5, "rgba(0,0,0,0)");
        grad.addColorStop(1, "rgba(0,0,0,0.18)");
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, cw, rh);

        // Draw 1-2 subtle, realistic stone cracks
        if (brickSeed % 3 === 0) {
          ctx.strokeStyle = "rgba(0,0,0,0.3)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          const startX = x + 5 + (brickSeed % 20);
          const startY = y + 3;
          ctx.moveTo(startX, startY);
          ctx.lineTo(startX + (brickSeed % 10) - 5, startY + 12);
          if (brickSeed % 6 === 0) {
            ctx.lineTo(startX + (brickSeed % 15) - 7, startY + rh - 4);
          }
          ctx.stroke();
        }

        ctx.restore();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1.5, 1.5);
    return texture;
  }

  // Procedural grayscale brick bump map for realistic 3D stone relief
  buildBrickBump() {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");

    // Base midtone gray
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, 256, 256);

    const rows = 8;
    const cols = 4;
    const rh = 256 / rows;
    const cw = 256 / cols;

    for (let r = 0; r < rows; r++) {
      const y = r * rh;
      const offset = (r % 2 === 0) ? 0 : cw / 2;
      
      // Recessed horizontal mortar lines (dark gray = recessed)
      ctx.fillStyle = "#333333";
      ctx.fillRect(0, y, 256, 3);

      for (let c = -1; c <= cols; c++) {
        const x = c * cw + offset;
        // Recessed vertical mortar lines
        ctx.fillRect(x, y, 3, rh);

        const brickSeed = (r * 17 + c * 31) % 100;
        ctx.save();
        ctx.rect(x + 2, y + 2, cw - 4, rh - 4);
        ctx.clip();

        // Base brick face elevation
        const baseShade = 140 + (brickSeed % 25);
        
        // Beveled gradient (slopes up to top-left, slopes down to bottom-right)
        const grad = ctx.createLinearGradient(x, y, x + cw, y + rh);
        grad.addColorStop(0, `rgb(${baseShade + 20}, ${baseShade + 20}, ${baseShade + 20})`);
        grad.addColorStop(1, `rgb(${baseShade - 20}, ${baseShade - 20}, ${baseShade - 20})`);
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, cw, rh);

        // Matching cracks (darker lines = recessed)
        if (brickSeed % 3 === 0) {
          ctx.strokeStyle = "#444444";
          ctx.lineWidth = 1;
          ctx.beginPath();
          const startX = x + 5 + (brickSeed % 20);
          const startY = y + 3;
          ctx.moveTo(startX, startY);
          ctx.lineTo(startX + (brickSeed % 10) - 5, startY + 12);
          if (brickSeed % 6 === 0) {
            ctx.lineTo(startX + (brickSeed % 15) - 7, startY + rh - 4);
          }
          ctx.stroke();
        }

        ctx.restore();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1.5, 1.5);
    return texture;
  }

  buildHedgeTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");

    // Base dark slate color
    ctx.fillStyle = "#16191b";
    ctx.fillRect(0, 0, 512, 512);

    let seed = 3344;
    const rng = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    // Draw irregular ancient stone blocks
    const rowHeights = [70, 75, 80, 72, 78, 68, 69]; // Sums to ~512
    let currentY = 0;
    const blockRows = [];

    for (let r = 0; r < rowHeights.length; r++) {
      const h = rowHeights[r];
      let currentX = 0;
      const rowBlocks = [];

      // Generate random block widths
      while (currentX < 512) {
        const w = 90 + Math.floor(rng() * 110); // 90 to 200 width
        const blockW = Math.min(w, 512 - currentX + 50); // allow wrapping overhang
        rowBlocks.push({ x: currentX, w: blockW });
        currentX += w;
      }
      blockRows.push({ y: currentY, h: h, blocks: rowBlocks });
      currentY += h;
    }

    // Draw stone blocks with chiseled textures, moss, and cracks
    for (const row of blockRows) {
      for (const block of row.blocks) {
        ctx.save();
        
        // Base stone color with slight variation
        const baseShade = 24 + Math.floor(rng() * 15); // very dark slate
        const rColor = baseShade + Math.floor(rng() * 6);
        const gColor = baseShade + 6 + Math.floor(rng() * 4); // slightly green-mossy tint
        const bColor = baseShade + 2;
        ctx.fillStyle = `rgb(${rColor}, ${gColor}, ${bColor})`;
        ctx.fillRect(block.x, row.y, block.w, row.h);

        // Chiseled stone texture (inner noise & weathering)
        for (let j = 0; j < 15; j++) {
          const wx = block.x + rng() * block.w;
          const wy = row.y + rng() * row.h;
          const wRad = 10 + rng() * 30;
          const wShade = rng() > 0.5 ? 4 : -4;
          
          const wGrad = ctx.createRadialGradient(wx, wy, 0, wx, wy, wRad);
          wGrad.addColorStop(0.0, `rgba(255, 255, 255, ${wShade > 0 ? 0.05 : 0.0})`);
          wGrad.addColorStop(1.0, `rgba(0, 0, 0, ${wShade < 0 ? 0.15 : 0.0})`);
          
          ctx.fillStyle = wGrad;
          ctx.beginPath();
          ctx.arc(wx, wy, wRad, 0, Math.PI * 2);
          ctx.fill();
        }

        // Wet moss decay creeping from bottom and joints
        const mossGrad = ctx.createLinearGradient(block.x, row.y + row.h, block.x, row.y);
        mossGrad.addColorStop(0.0, "rgba(10, 22, 12, 0.45)"); // dark olive-black mold
        mossGrad.addColorStop(0.4, "rgba(15, 30, 18, 0.2)");
        mossGrad.addColorStop(1.0, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = mossGrad;
        ctx.fillRect(block.x, row.y, block.w, row.h);

        // Weathering lines/cracks inside the stone
        ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
        ctx.lineWidth = 1.0;
        if (rng() > 0.5) {
          ctx.beginPath();
          const cx = block.x + rng() * block.w;
          const cy = row.y;
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + (rng() - 0.5) * 15, cy + rng() * row.h * 0.6);
          ctx.stroke();
        }

        ctx.restore();
      }
    }

    // Draw deep mortar joints (black cracks) between blocks
    ctx.strokeStyle = "#08090a";
    ctx.lineWidth = 4;
    for (const row of blockRows) {
      // Horizontal joint
      ctx.beginPath();
      ctx.moveTo(0, row.y);
      ctx.lineTo(512, row.y);
      ctx.stroke();

      // Vertical joints
      for (const block of row.blocks) {
        ctx.beginPath();
        ctx.moveTo(block.x, row.y);
        ctx.lineTo(block.x, row.y + row.h);
        ctx.stroke();
      }
    }

    // Creeping ancient roots (dark grey-brown woody vines) wrapping around the ruins
    const drawRootBranch = (startX, startY, length, angle, startWidth) => {
      let cx = startX;
      let cy = startY;
      let w = startWidth;
      
      ctx.strokeStyle = "#1a1614"; // very dark root bark
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx, cy);

      const segments = Math.floor(15 + rng() * 20);
      const step = length / segments;

      for (let i = 0; i < segments; i++) {
        const dev = (rng() - 0.5) * 0.6;
        angle += dev;
        
        const nx = cx + Math.cos(angle) * step;
        const ny = cy + Math.sin(angle) * step;

        ctx.lineWidth = w;
        ctx.lineTo(nx, ny);

        w *= 0.94;
        cx = nx;
        cy = ny;

        const wrapX = cx < 0 ? cx + 512 : (cx > 512 ? cx - 512 : cx);
        const wrapY = cy < 0 ? cy + 512 : (cy > 512 ? cy - 512 : cy);

        if (w > 1.5 && rng() < 0.12) {
          drawRootBranch(wrapX, wrapY, length * 0.5, angle + (rng() > 0.5 ? 0.8 : -0.8), w * 0.7);
        }
      }
      ctx.stroke();

      // Draw subtle wet wood highlight on roots to catch spotlight
      cx = startX;
      cy = startY;
      w = startWidth;
      ctx.strokeStyle = "rgba(75, 65, 58, 0.4)"; // soft brown highlight
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      for (let i = 0; i < segments; i++) {
        const dev = (rng() - 0.5) * 0.6;
        angle += dev;
        const nx = cx + Math.cos(angle) * step;
        const ny = cy + Math.sin(angle) * step;
        ctx.lineWidth = w * 0.3;
        ctx.lineTo(nx, ny);
        w *= 0.94;
        cx = nx;
        cy = ny;
      }
      ctx.stroke();
    };

    // Spawn 5 main creeping root clusters climbing up from the base
    for (let r = 0; r < 5; r++) {
      const rx = rng() * 512;
      const ry = 512;
      drawRootBranch(rx, ry, 200 + rng() * 150, -Math.PI / 2 + (rng() - 0.5) * 0.5, 6.0 + rng() * 4.0);
    }

    // Add fine photographic slate texture noise
    const imgData = ctx.getImageData(0, 0, 512, 512);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (rng() - 0.5) * 8;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i+1] = Math.max(0, Math.min(255, data[i+1] + noise * 0.95));
      data[i+2] = Math.max(0, Math.min(255, data[i+2] + noise * 0.9));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1.0, 1.0); // 1:1 mapping is perfect for ruins
    return texture;
  }

  buildHedgeBump() {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");

    // Base stone height (medium gray)
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, 512, 512);

    let seed = 3344; // Match coordinate seed exactly
    const rng = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    // Calculate layout identical to color texture
    const rowHeights = [70, 75, 80, 72, 78, 68, 69];
    let currentY = 0;
    const blockRows = [];

    for (let r = 0; r < rowHeights.length; r++) {
      const h = rowHeights[r];
      let currentX = 0;
      const rowBlocks = [];
      while (currentX < 512) {
        const w = 90 + Math.floor(rng() * 110);
        const blockW = Math.min(w, 512 - currentX + 50);
        rowBlocks.push({ x: currentX, w: blockW });
        currentX += w;
      }
      blockRows.push({ y: currentY, h: h, blocks: rowBlocks });
      currentY += h;
    }

    // Draw stone bump variations (chisel patterns)
    for (const row of blockRows) {
      for (const block of row.blocks) {
        ctx.save();
        
        const baseHeight = 120 + Math.floor(rng() * 20); // 120 to 140
        ctx.fillStyle = `rgb(${baseHeight}, ${baseHeight}, ${baseHeight})`;
        ctx.fillRect(block.x, row.y, block.w, row.h);

        // Chisel weathering pits
        for (let j = 0; j < 15; j++) {
          const wx = block.x + rng() * block.w;
          const wy = row.y + rng() * row.h;
          const wRad = 10 + rng() * 30;
          const wShade = rng() > 0.5 ? 10 : -15; // indentations/protrusions
          
          const wGrad = ctx.createRadialGradient(wx, wy, 0, wx, wy, wRad);
          wGrad.addColorStop(0.0, `rgba(${128 + wShade}, ${128 + wShade}, ${128 + wShade}, 0.25)`);
          wGrad.addColorStop(1.0, "rgba(128, 128, 128, 0)");
          
          ctx.fillStyle = wGrad;
          ctx.beginPath();
          ctx.arc(wx, wy, wRad, 0, Math.PI * 2);
          ctx.fill();
        }

        if (rng() > 0.5) {
          rng();
          rng();
        }

        ctx.restore();
      }
    }

    // Draw deep mortar cracks (black channels in bump map)
    ctx.strokeStyle = "#101010"; // very deep recessed grooves
    ctx.lineWidth = 5;
    for (const row of blockRows) {
      ctx.beginPath();
      ctx.moveTo(0, row.y);
      ctx.lineTo(512, row.y);
      ctx.stroke();

      for (const block of row.blocks) {
        ctx.beginPath();
        ctx.moveTo(block.x, row.y);
        ctx.lineTo(block.x, row.y + row.h);
        ctx.stroke();
      }
    }

    // Draw roots as raised ridges (brighter values in bump map)
    const drawRootBumpBranch = (startX, startY, length, angle, startWidth) => {
      let cx = startX;
      let cy = startY;
      let w = startWidth;

      ctx.strokeStyle = "rgba(160, 160, 160, 0.4)"; // raised height ridge
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx, cy);

      const segments = Math.floor(15 + rng() * 20);
      const step = length / segments;

      for (let i = 0; i < segments; i++) {
        const dev = (rng() - 0.5) * 0.6;
        angle += dev;
        const nx = cx + Math.cos(angle) * step;
        const ny = cy + Math.sin(angle) * step;
        ctx.lineWidth = w;
        ctx.lineTo(nx, ny);
        w *= 0.94;
        cx = nx;
        cy = ny;

        const wrapX = cx < 0 ? cx + 512 : (cx > 512 ? cx - 512 : cx);
        const wrapY = cy < 0 ? cy + 512 : (cy > 512 ? cy - 512 : cy);

        if (w > 1.5 && rng() < 0.12) {
          drawRootBumpBranch(wrapX, wrapY, length * 0.5, angle + (rng() > 0.5 ? 0.8 : -0.8), w * 0.7);
        }
      }
      ctx.stroke();

      // Consume inner highlight RNG
      cx = startX;
      cy = startY;
      w = startWidth;
      for (let i = 0; i < segments; i++) {
        const dev = (rng() - 0.5) * 0.6;
        angle += dev;
        const nx = cx + Math.cos(angle) * step;
        const ny = cy + Math.sin(angle) * step;
        w *= 0.94;
        cx = nx;
        cy = ny;
      }
    };

    // Draw the identical 5 root clusters in bump map space
    for (let r = 0; r < 5; r++) {
      const rx = rng() * 512;
      const ry = 512;
      drawRootBumpBranch(rx, ry, 200 + rng() * 150, -Math.PI / 2 + (rng() - 0.5) * 0.5, 6.0 + rng() * 4.0);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1.0, 1.0);
    return texture;
  }


  buildWoodTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");

    // Base rich warm brown wood color
    ctx.fillStyle = "#451a03"; // Dark rich brown
    ctx.fillRect(0, 0, 256, 256);

    // Draw wood planks
    const numPlanks = 5;
    const pw = 256 / numPlanks;

    for (let i = 0; i < numPlanks; i++) {
      const x = i * pw;
      
      // Base variation for each plank
      ctx.fillStyle = (i % 2 === 0) ? "#451a03" : "#3b1702";
      ctx.fillRect(x, 0, pw, 256);

      // Wood grain lines
      ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
      ctx.lineWidth = 1;
      
      for (let j = 0; j < 6; j++) {
        ctx.beginPath();
        // Draw wavy lines using quadratic curves to simulate wood grains
        ctx.moveTo(x + (pw * 0.1) + (j * pw * 0.15), 0);
        ctx.quadraticCurveTo(
          x + (pw * 0.1) + (j * pw * 0.15) + Math.sin(j + i) * 15,
          128,
          x + (pw * 0.1) + (j * pw * 0.15) + Math.cos(j * 2) * 5,
          256
        );
        ctx.stroke();
      }

      // Plank separator lines (dark grout/shadows)
      ctx.strokeStyle = "#170500";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 256);
      ctx.stroke();

      // Knots in the wood
      if (i % 2 === 0) {
        ctx.fillStyle = "rgba(23, 5, 0, 0.6)";
        ctx.beginPath();
        ctx.arc(x + pw / 2, 60 + i * 40, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1.0, 1.0);
    return texture;
  }

  buildFloorTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");

    // Slate stone base color
    ctx.fillStyle = "#1e293b"; // Slate grey
    ctx.fillRect(0, 0, 256, 256);

    // Draw square floor stone tiles
    const rows = 4;
    const cols = 4;
    const tileSize = 256 / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * tileSize;
        const y = r * tileSize;

        // Base tile tone variations
        const tileSeed = (r * 17 + c * 23) % 100;
        const shade = -10 + (tileSeed % 20); // slightly lighter/darker
        ctx.fillStyle = `rgba(${30 + shade}, ${41 + shade}, ${59 + shade}, 1)`;
        ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);

        // Mortar grout lines
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, tileSize, tileSize);

        // Tonal cracks/details on stones
        if (tileSeed % 4 === 0) {
          ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x + 5, y + 5);
          ctx.lineTo(x + tileSize * 0.4, y + tileSize * 0.35);
          ctx.lineTo(x + tileSize * 0.45, y + tileSize * 0.7);
          ctx.stroke();
        }

        // Noise spots
        ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
        for (let i = 0; i < 5; i++) {
          const nx = x + 4 + ((tileSeed * i + 11) % (tileSize - 8));
          const ny = y + 4 + ((tileSeed * i + 43) % (tileSize - 8));
          ctx.fillRect(nx, ny, 2, 2);
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2.0, 2.0);
    return texture;
  }

  buildFloorBump() {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");

    // Base midtone gray
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, 256, 256);

    const rows = 4;
    const cols = 4;
    const tileSize = 256 / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * tileSize;
        const y = r * tileSize;

        // Recessed grout lines
        ctx.fillStyle = "#222222";
        ctx.fillRect(x, y, tileSize, 3);
        ctx.fillRect(x, y, 3, tileSize);

        // Tile face
        const tileSeed = (r * 17 + c * 23) % 100;
        const baseShade = 130 + (tileSeed % 30);
        
        ctx.save();
        ctx.rect(x + 2, y + 2, tileSize - 4, tileSize - 4);
        ctx.clip();

        // Beveled tile face gradient
        const grad = ctx.createLinearGradient(x, y, x + tileSize, y + tileSize);
        grad.addColorStop(0, `rgb(${baseShade + 15}, ${baseShade + 15}, ${baseShade + 15})`);
        grad.addColorStop(1, `rgb(${baseShade - 15}, ${baseShade - 15}, ${baseShade - 15})`);
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, tileSize, tileSize);

        // Matching cracks
        if (tileSeed % 4 === 0) {
          ctx.strokeStyle = "#444444";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x + 5, y + 5);
          ctx.lineTo(x + tileSize * 0.4, y + tileSize * 0.35);
          ctx.lineTo(x + tileSize * 0.45, y + tileSize * 0.7);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2.0, 2.0);
    return texture;
  }

  buildBloodTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");

    // Clear transparent background
    ctx.clearRect(0, 0, 128, 128);

    // 1. Organic main pool center (dark coagulated blood core)
    const coreGrad = ctx.createRadialGradient(64, 64, 4, 64, 64, 45);
    coreGrad.addColorStop(0.0, "rgba(45, 2, 4, 0.95)");    // Dark thick coagulated core
    coreGrad.addColorStop(0.35, "rgba(115, 6, 10, 0.85)");  // Rich crimson blood
    coreGrad.addColorStop(0.7, "rgba(165, 12, 18, 0.55)"); // Fresh semi-transparent blood
    coreGrad.addColorStop(1.0, "rgba(165, 12, 18, 0.0)");  // Feathered wet edge

    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(64, 64, 45, 0, Math.PI * 2);
    ctx.fill();

    // 2. Irregular organic splatter droplets around the pool
    ctx.fillStyle = "rgba(105, 5, 8, 0.78)";
    let seed = 1234;
    const rng = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    for (let i = 0; i < 20; i++) {
      const angle = rng() * Math.PI * 2;
      const dist = 18 + rng() * 34;
      const r = 1.2 + rng() * 4.2;
      const dx = 64 + Math.cos(angle) * dist;
      const dy = 64 + Math.sin(angle) * dist;

      ctx.beginPath();
      ctx.arc(dx, dy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  buildPaintingTexture(variant = 0) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 320;
    const ctx = canvas.getContext("2d");

    // Dark canvas background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 320);
    bgGrad.addColorStop(0, "#05070a");
    bgGrad.addColorStop(1, "#120a10");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 256, 320);

    if (variant === 0) {
      // "The Cursed Monarch" - Ominous shadow portrait with glowing red eyes
      const g = ctx.createRadialGradient(128, 120, 10, 128, 160, 120);
      g.addColorStop(0, "rgba(180, 20, 30, 0.35)");
      g.addColorStop(1, "rgba(0,0,0,0.95)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 320);

      // Head silhouette
      ctx.fillStyle = "#181418";
      ctx.beginPath();
      ctx.ellipse(128, 110, 42, 55, 0, 0, Math.PI * 2);
      ctx.fill();

      // Shoulders
      ctx.beginPath();
      ctx.moveTo(40, 260);
      ctx.quadraticCurveTo(128, 170, 216, 260);
      ctx.lineTo(216, 320);
      ctx.lineTo(40, 320);
      ctx.closePath();
      ctx.fill();

      // Glowing red eyes
      ctx.fillStyle = "#ef4444";
      ctx.shadowColor = "#ef4444";
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(112, 105, 4, 0, Math.PI * 2);
      ctx.arc(144, 105, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Crown outline
      ctx.strokeStyle = "#d97706";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(96, 62);
      ctx.lineTo(108, 45);
      ctx.lineTo(128, 55);
      ctx.lineTo(148, 45);
      ctx.lineTo(160, 62);
      ctx.stroke();
    } else if (variant === 1) {
      // "The Shadow Entity" - Dark figure under blood moon
      const g = ctx.createRadialGradient(128, 90, 5, 128, 90, 70);
      g.addColorStop(0, "rgba(220, 38, 38, 0.85)");
      g.addColorStop(0.5, "rgba(153, 27, 27, 0.4)");
      g.addColorStop(1, "rgba(5, 5, 10, 0.95)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 320);

      // Slender shadow figure
      ctx.fillStyle = "#09090b";
      ctx.beginPath();
      ctx.ellipse(128, 100, 18, 25, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(110, 125);
      ctx.lineTo(146, 125);
      ctx.lineTo(155, 320);
      ctx.lineTo(101, 320);
      ctx.closePath();
      ctx.fill();
    } else if (variant === 2) {
      // "The Eye of the Void" - Mystic cosmic eye
      const g = ctx.createRadialGradient(128, 160, 10, 128, 160, 110);
      g.addColorStop(0, "rgba(56, 189, 248, 0.65)");
      g.addColorStop(0.6, "rgba(139, 92, 246, 0.3)");
      g.addColorStop(1, "rgba(2, 4, 8, 0.95)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 320);

      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(50, 160);
      ctx.quadraticCurveTo(128, 90, 206, 160);
      ctx.quadraticCurveTo(128, 230, 50, 160);
      ctx.stroke();

      ctx.fillStyle = "#020617";
      ctx.beginPath();
      ctx.arc(128, 160, 32, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(128, 160, 12, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // "The Ghostly Maiden"
      const g = ctx.createRadialGradient(128, 130, 20, 128, 130, 100);
      g.addColorStop(0, "rgba(148, 163, 184, 0.35)");
      g.addColorStop(1, "rgba(2, 4, 10, 0.95)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 320);

      ctx.fillStyle = "#cbd5e1";
      ctx.beginPath();
      ctx.ellipse(128, 120, 35, 48, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#020617";
      ctx.beginPath();
      ctx.arc(114, 115, 8, 0, Math.PI * 2);
      ctx.arc(142, 115, 8, 0, Math.PI * 2);
      ctx.arc(128, 142, 7, 0, Math.PI * 2);
      ctx.fill();
    }

    // Heavy wooden ornate frame around painting
    ctx.strokeStyle = "#451a03";
    ctx.lineWidth = 16;
    ctx.strokeRect(8, 8, 240, 304);

    ctx.strokeStyle = "#d97706"; // gold inlay
    ctx.lineWidth = 4;
    ctx.strokeRect(16, 16, 224, 288);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  buildRunePlaqueTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");

    // Stone plaque background
    ctx.fillStyle = "#262e3b";
    ctx.fillRect(0, 0, 128, 128);

    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, 120, 120);

    // Glowing cyan carved runes
    ctx.strokeStyle = "#38bdf8";
    ctx.shadowColor = "#0284c7";
    ctx.shadowBlur = 10;
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(30, 30); ctx.lineTo(64, 98); ctx.lineTo(98, 30);
    ctx.moveTo(30, 98); ctx.lineTo(98, 98);
    ctx.moveTo(64, 20); ctx.lineTo(64, 108);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  buildBloodRuneTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, 128, 128);

    // Occult Blood Pentagram Symbol
    ctx.strokeStyle = "rgba(185, 28, 28, 0.9)";
    ctx.shadowColor = "#ef4444";
    ctx.shadowBlur = 12;
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.arc(64, 64, 52, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    const cx = 64, cy = 64, r = 48;
    for (let i = 0; i < 5; i++) {
      const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const x = cx + r * Math.cos(a);
      const y = cy + r * Math.sin(a);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  resize(containerWidth, containerHeight, mazeWidth, mazeHeight) {
    if (this.renderer && this.camera) {
      const isWebView = /wv|Android.*Version\/[0-9]/i.test(navigator.userAgent) || window.matchMedia('(display-mode: standalone)').matches;
      const isMobileDevice = isWebView || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
      const maxDPR = isWebView ? 0.85 : (isMobileDevice ? 1.0 : 1.5);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1.0, maxDPR));
      this.renderer.setSize(containerWidth, containerHeight);
      this.camera.aspect = containerWidth / containerHeight;
      this.camera.updateProjectionMatrix();
    }
  }

  resetFloorCache() {
    this.currentFloorId = null;
    this.camX = null;
    this.camZ = null;
    this.lookX = null;
    this.lookZ = null;
  }

  rebuildScene(state) {
    if (!state) return;
    this.currentFloorId = `${state.currentFloor}_${state.currentLevel}`;
    this.camX = null;
    this.camZ = null;
    this.lookX = null;
    this.lookZ = null;
    this.occupiedWallFaces = new Set();
    
    // Reset 3D mesh pool pointers so new floor scene re-creates fresh valid WebGL meshes!
    this.otherPlayerGroup = null;
    this.otherPlayerMesh = null;
    this.otherPlayerLight = null;
    this.otherPlayerHasRealFlashlight = false;
    this.shadowMonsterMeshes = [];
    this.shadowLightsPool = [];
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

    this.dirLight = new THREE.DirectionalLight("#551111", isUnderground ? 0.0 : 0.04); // Reddish blood moon directional light
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

    // 1c. Fixed PointLight Pool for static torches (keeps compilation count constant at exactly 6 lights)
    this.torchLightsPool = [];
    for (let i = 0; i < 6; i++) {
      const pLight = new THREE.PointLight("#ea580c", 0.0, 4.0);
      pLight.castShadow = false;
      pLight.visible = true; // Stay in scene graph to avoid shader recompiles
      this.scene.add(pLight);
      this.torchLightsPool.push(pLight);
    }

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
      this.scene.background = new THREE.Color("#020206");
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

    // 1d. 3D Starfield Dome & Blood Moon (Kanlı Ay) for outdoor floor (fog: false ensures 100% crisp visibility)
    if (!isUnderground) {
      // Soft glowing circular star particle texture (prevents default WebGL square points!)
      const starCanvas = document.createElement("canvas");
      starCanvas.width = 64;
      starCanvas.height = 64;
      const sCtx = starCanvas.getContext("2d");
      const sGrad = sCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
      sGrad.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
      sGrad.addColorStop(0.2, "rgba(255, 245, 225, 0.8)");
      sGrad.addColorStop(0.5, "rgba(240, 200, 255, 0.3)");
      sGrad.addColorStop(1.0, "rgba(0, 0, 0, 0.0)");
      sCtx.fillStyle = sGrad;
      sCtx.fillRect(0, 0, 64, 64);
      const starTex = new THREE.CanvasTexture(starCanvas);

      const starCount = 350;
      const starGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(starCount * 3);

      let seed = 12345;
      const rng = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };

      for (let i = 0; i < starCount; i++) {
        const theta = rng() * Math.PI * 2;
        const phi = 0.02 + rng() * 1.35;
        const radius = 35.0 + rng() * 15.0;

        const x = radius * Math.sin(phi) * Math.cos(theta);
        const z = radius * Math.sin(phi) * Math.sin(theta);
        const y = radius * Math.cos(phi);

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
      }

      starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      
      const starMat = new THREE.PointsMaterial({
        map: starTex,
        size: 0.40,
        transparent: true,
        opacity: 0.85,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false // Crucial: ignore scene fog so stars shine brightly!
      });

      this.starField = new THREE.Points(starGeometry, starMat);
      this.scene.add(this.starField);

      // 1e. High-Detail Luminous 3D Blood Moon (Kanlı Ay)
      try {
        const moonCanvas = document.createElement("canvas");
        moonCanvas.width = 512;
        moonCanvas.height = 512;
        const mCtx = moonCanvas.getContext("2d");

        // Outer Glow Aura
        const glowGrad = mCtx.createRadialGradient(256, 256, 120, 256, 256, 250);
        glowGrad.addColorStop(0.0, "rgba(239, 68, 68, 0.75)");
        glowGrad.addColorStop(0.4, "rgba(185, 28, 28, 0.35)");
        glowGrad.addColorStop(1.0, "rgba(0, 0, 0, 0.0)");
        mCtx.fillStyle = glowGrad;
        mCtx.beginPath();
        mCtx.arc(256, 256, 250, 0, Math.PI * 2);
        mCtx.fill();

        // Blood Moon Disc
        const mGrad = mCtx.createRadialGradient(210, 210, 20, 256, 256, 130);
        mGrad.addColorStop(0.0, "#fca5a5"); // Bright crimson highlight
        mGrad.addColorStop(0.3, "#ef4444"); // Blood red
        mGrad.addColorStop(0.7, "#991b1b"); // Deep blood maroon
        mGrad.addColorStop(1.0, "#450a0a"); // Shadowed limb
        mCtx.fillStyle = mGrad;
        mCtx.beginPath();
        mCtx.arc(256, 256, 130, 0, Math.PI * 2);
        mCtx.fill();

        // Realistic lunar mares & crater detail
        mCtx.fillStyle = "rgba(45, 10, 15, 0.4)";
        [
          { x: 210, y: 200, r: 35 }, { x: 280, y: 230, r: 45 }, { x: 240, y: 300, r: 40 },
          { x: 180, y: 270, r: 25 }, { x: 300, y: 170, r: 30 }, { x: 170, y: 190, r: 22 },
          { x: 260, y: 150, r: 28 }, { x: 210, y: 330, r: 32 }
        ].forEach(c => {
          mCtx.beginPath();
          mCtx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
          mCtx.fill();
        });

        // Soft lunar limb shadow overlay
        const shadowGrad = mCtx.createRadialGradient(310, 310, 50, 256, 256, 130);
        shadowGrad.addColorStop(0.0, "rgba(0, 0, 0, 0.0)");
        shadowGrad.addColorStop(0.7, "rgba(10, 2, 4, 0.5)");
        shadowGrad.addColorStop(1.0, "rgba(5, 1, 2, 0.85)");
        mCtx.fillStyle = shadowGrad;
        mCtx.beginPath();
        mCtx.arc(256, 256, 130, 0, Math.PI * 2);
        mCtx.fill();

        const moonTex = new THREE.CanvasTexture(moonCanvas);
        const moonGeo = new THREE.PlaneGeometry(10.0, 10.0);
        const moonMat = new THREE.MeshBasicMaterial({
          map: moonTex,
          transparent: true,
          opacity: 0.95,
          depthWrite: false,
          fog: false // Crucial: ignore scene fog so Blood Moon is 100% visible!
        });
        const moonMesh = new THREE.Mesh(moonGeo, moonMat);
        moonMesh.position.set(25.0, 38.0, -45.0);
        moonMesh.lookAt(0, 0, 0); // Face camera origin
        this.scene.add(moonMesh);
        this.bloodMoonGroup = moonMesh;
      } catch (e) {
        console.warn("Failed to create Blood Moon:", e);
      }
    }

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
      bumpMap: this.hedgeBump,
      bumpScale: 0.08,
      color: "#ffffff", 
      roughness: 0.85 
    });

    const capMat = new THREE.MeshStandardMaterial({
      map: this.brickTexture,
      bumpMap: this.brickBump,
      bumpScale: 0.05,
      color: "#2a2724", // dark weathered stone cap (matches wall naturally)
      roughness: 0.95
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
        bumpScale: 0.05,
        color: "#3a4454", // cold grey stone zindan
        roughness: 0.85
      });
      activeFloorMat = new THREE.MeshStandardMaterial({
        map: this.floorTexture,
        bumpMap: this.floorBump,
        bumpScale: 0.05,
        color: "#242830", // zindan zemin gri
        roughness: 0.9
      });
    } else {
      // Floor 2+ (Deepest floor - Crimson/Blood Vault Horror Theme)
      activeWallMat = new THREE.MeshStandardMaterial({
        map: this.brickTexture,
        bumpMap: this.brickBump,
        bumpScale: 0.06,
        color: "#4d2226", // nemli bordo/kızıl-kahve taşlar
        roughness: 0.80
      });
      activeFloorMat = new THREE.MeshStandardMaterial({
        map: this.floorTexture,
        bumpMap: this.floorBump,
        bumpScale: 0.06,
        color: "#2b1215", // nemli kan kırmızısı zemin
        roughness: 0.85
      });
    }

    // Pre-allocate shared puddle geometry and material to eliminate GPU allocation stutter
    if (!this.bloodTexture) {
      this.bloodTexture = this.buildBloodTexture();
    }
    const sharedPuddleGeo = new THREE.PlaneGeometry(1, 1);
    const sharedPuddleMat = new THREE.MeshStandardMaterial({
      map: this.bloodTexture,
      transparent: true,
      opacity: 0.82,
      roughness: 0.05,
      metalness: 0.25,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    });

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

          // Add realistic, wet, semi-transparent blood pools on paths!
          if (cell.type === "floor" && !(x === 1 && y === 1)) {
            const cellRand = Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
            const bloodChance = isDeepestFloor ? 0.20 : (isUnderground ? 0.12 : 0.07);
            
            if (cellRand < bloodChance) {
              const bloodGroup = new THREE.Group();
              const numDrops = 1 + Math.floor(cellRand * 30) % 2; // 1 to 2 pools
              for (let dIdx = 0; dIdx < numDrops; dIdx++) {
                const dropRandX = (Math.sin(x * 45.1 + y * 83.2 + dIdx * 19.3) * 43758.5453) % 1;
                const dropRandY = (Math.cos(x * 12.4 + y * 39.1 + dIdx * 97.4) * 43758.5453) % 1;
                const radiusRand = (Math.sin(x * 78.9 + y * 12.5 + dIdx * 54.1) * 43758.5453) % 1;
                
                const offsetX = (dropRandX * 2.0 - 1.0) * 0.25;
                const offsetY = (dropRandY * 2.0 - 1.0) * 0.25;
                const radius = 0.12 + Math.abs(radiusRand) * 0.22; // radius 0.12m to 0.34m
                
                const puddle = new THREE.Mesh(sharedPuddleGeo, sharedPuddleMat);
                puddle.scale.set(radius * 2, radius * 2, 1);
                puddle.rotation.x = -Math.PI / 2;
                puddle.rotation.z = dropRandX * Math.PI * 2;
                puddle.position.set(offsetX, 0.003, offsetY);
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

            if (!cell.loreParchment && !cell.chest && !cell.puzzleClue && !cell.npc && !cell.obstacle && (wallN || wallS || wallE || wallW)) {
              if (Math.random() < 0.055) { // 5.5% probability per path cell adjacent to a wall
                const walls = [];
                if (wallN && !this.occupiedWallFaces.has(`${x},${y - 1},S`)) walls.push({ x: 0, z: -0.478, rotationY: 0, wx: x, wy: y - 1, face: "S" }); // mounts on North wall, faces South
                if (wallS && !this.occupiedWallFaces.has(`${x},${y + 1},N`)) walls.push({ x: 0, z: 0.478, rotationY: Math.PI, wx: x, wy: y + 1, face: "N" }); // mounts on South wall, faces North
                if (wallE && !this.occupiedWallFaces.has(`${x + 1},${y},W`)) walls.push({ x: 0.478, z: 0, rotationY: -Math.PI / 2, wx: x + 1, wy: y, face: "W" }); // mounts on East wall, faces West
                if (wallW && !this.occupiedWallFaces.has(`${x - 1},${y},E`)) walls.push({ x: -0.478, z: 0, rotationY: Math.PI / 2, wx: x - 1, wy: y, face: "E" }); // mounts on West wall, faces East

                if (walls.length > 0) {
                  const mount = walls[Math.floor(Math.random() * walls.length)];
                  this.occupiedWallFaces.add(`${mount.wx},${mount.wy},${mount.face}`);

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
                  // Apply 30 degrees tilt forward to the entire stem assembly
                  stemGroup.rotation.x = Math.PI / 6.0;
                  torchGroup.add(stemGroup);

                  // Set position at eye level (y = 0.46)
                  torchGroup.position.set(mount.x, 0.46, mount.z);
                  torchGroup.rotation.y = mount.rotationY;

                  cellGroup.add(torchGroup);

                  // Register torch flame and world coordinates for dynamic light pooling in draw()
                  if (this.torches) {
                    const worldY = 0.46 + 0.19 * Math.cos(Math.PI / 6.0); // ~0.62m height
                    this.torches.push({
                      flame: flameGroup,
                      baseIntensity: 2.2,
                      worldX: x + 0.5 + mount.x,
                      worldY: worldY,
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
                lid.userData.gridX = x;
                lid.userData.gridY = y;
                this.chestLidGroups[`${x},${y}`] = lid;
              } else {
                // If lid is not found, fallback to animating the whole clone
                chestClone.userData.initialX = chestClone.rotation.x;
                chestClone.userData.gridX = x;
                chestClone.userData.gridY = y;
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

              lidGroup.userData = { gridX: x, gridY: y };
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

            // Cache bone lookups on model for O(1) animation updates
            const model = npcSubGroup.children[0];
            if (model) {
              model.userData.armL = typeof model.getObjectByName === "function" ? (model.getObjectByName("upper_arm.L") || model.getObjectByName("shoulder.L")) : null;
              model.userData.armR = typeof model.getObjectByName === "function" ? (model.getObjectByName("upper_arm.R") || model.getObjectByName("shoulder.R")) : null;
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
            let mountedDir = null;
            for (const d of dirs) {
              const nx = x + d.dx;
              const ny = y + d.dy;
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                if (grid[ny][nx].type === "wall") {
                  offsetX = d.ox;
                  offsetZ = d.oz;
                  rotY = d.r;
                  mounted = true;
                  mountedDir = d;
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
                color: "#959595",
                roughness: 0.95
              });
              const paperMesh = new THREE.Mesh(paperGeo, paperMat);
              paperMesh.position.set(0, 0, 0.005);
              
              const noteGroup = new THREE.Group();
              noteGroup.add(boardMesh, paperMesh);
              noteGroup.position.set(offsetX, 0.64, offsetZ);
              noteGroup.rotation.y = rotY;
              clueSubGroup.add(noteGroup);

              if (mountedDir) {
                const nx = x + mountedDir.dx;
                const ny = y + mountedDir.dy;
                const face = mountedDir.dy === -1 ? "S" : mountedDir.dy === 1 ? "N" : mountedDir.dx === 1 ? "W" : "E";
                this.occupiedWallFaces.add(`${nx},${ny},${face}`);
              }
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
            let mountedDir = null;
            for (const d of dirs) {
              const nx = x + d.dx;
              const ny = y + d.dy;
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                if (grid[ny][nx].type === "wall") {
                  offsetX = d.ox;
                  offsetZ = d.oz;
                  rotY = d.r;
                  mounted = true;
                  mountedDir = d;
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
                color: "#959595",
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
                color: "#959595",
                roughness: 0.95
              });
              const paperMesh = new THREE.Mesh(paperGeo, paperMat);
              paperMesh.position.set(0, 0, 0.005);
              
              const noteGroup = new THREE.Group();
              noteGroup.add(boardMesh, paperMesh);
              noteGroup.position.set(offsetX, 0.64, offsetZ);
              noteGroup.rotation.y = rotY;
              loreSubGroup.add(noteGroup);

              if (mountedDir) {
                const nx = x + mountedDir.dx;
                const ny = y + mountedDir.dy;
                const face = mountedDir.dy === -1 ? "S" : mountedDir.dy === 1 ? "N" : mountedDir.dx === 1 ? "W" : "E";
                this.occupiedWallFaces.add(`${nx},${ny},${face}`);
              }
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

            obsSubGroup.userData = { gridX: x, gridY: y };
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

          // 3. Floor-Specific Wall Decorations (Deterministic, zero-lag placement on wall faces facing open corridors)
          const wallRand = Math.abs(Math.sin(x * 37.129 + y * 91.83) * 43758.54) % 1;
          const isFloor = (tx, ty) => (tx >= 0 && tx < width && ty >= 0 && ty < height && grid[ty][tx].type !== "wall");

          let wallProp = null;

          if (!isUnderground) {
            // Floor 0 (Ruins & Hedge Maze): No random wall decorations (parchments are placed via maze generator)
          } else if (currentFloor === 1) {
            // Floor 1 (Stone Dungeon): Haunted Paintings, Rusted Iron Shackles/Chains, Iron Ventilation Grates
            if (wallRand < 0.22) { // 22% chance
              const propType = Math.floor(wallRand * 400) % 3;
              if (propType === 0) {
                // Haunted Oil Painting
                const variant = Math.floor(wallRand * 500) % 4;
                if (!this.paintingTextures) this.paintingTextures = [];
                if (!this.paintingTextures[variant]) this.paintingTextures[variant] = this.buildPaintingTexture(variant);
                
                const pGroup = new THREE.Group();
                const frameBox = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.52, 0.04), new THREE.MeshStandardMaterial({ color: "#451a03", roughness: 0.8 }));
                const canvasMesh = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.48, 0.03), new THREE.MeshStandardMaterial({ map: this.paintingTextures[variant], roughness: 0.7 }));
                canvasMesh.position.z = 0.01;
                pGroup.add(frameBox, canvasMesh);
                wallProp = pGroup;
              } else if (propType === 1) {
                // Rusted Iron Wall Shackle & Chains
                const cGroup = new THREE.Group();
                const plateMat = new THREE.MeshStandardMaterial({ color: "#27272a", metalness: 0.85, roughness: 0.3 });
                const plate = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.03), plateMat);
                
                const ringMat = new THREE.MeshStandardMaterial({ color: "#3f3f46", metalness: 0.9, roughness: 0.2 });
                const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.008, 6, 12), ringMat);
                ring1.position.set(-0.03, -0.04, 0.03);
                const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.008, 6, 12), ringMat);
                ring2.position.set(0.03, -0.04, 0.03);
                
                cGroup.add(plate, ring1, ring2);
                wallProp = cGroup;
              } else {
                // Rusted Iron Ventilation Grate
                const grateMat = new THREE.MeshStandardMaterial({ color: "#18181b", metalness: 0.9, roughness: 0.4 });
                const gGroup = new THREE.Group();
                const grateFrame = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.36, 0.03), grateMat);
                for (let b = -0.12; b <= 0.12; b += 0.06) {
                  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.32), grateMat);
                  bar.position.set(b, 0, 0.01);
                  gGroup.add(bar);
                }
                gGroup.add(grateFrame);
                wallProp = gGroup;
              }
            }
          } else {
            // Floor 2 (Deepest Crimson Horror Vault): Occult Blood Pentagram Runes, Haunted Paintings & Rusted Chains
            if (wallRand < 0.26) { // 26% chance
              const propType = Math.floor(wallRand * 400) % 3;
              if (propType === 0) {
                // Occult Blood-Red Glowing Pentagram Rune
                if (!this.bloodRuneTex) this.bloodRuneTex = this.buildBloodRuneTexture();
                const bloodMesh = new THREE.Mesh(
                  new THREE.PlaneGeometry(0.44, 0.44),
                  new THREE.MeshStandardMaterial({
                    map: this.bloodRuneTex,
                    transparent: true,
                    opacity: 0.9,
                    emissive: "#7f1d1d",
                    emissiveIntensity: 0.6,
                    depthWrite: false
                  })
                );
                wallProp = bloodMesh;
              } else if (propType === 1) {
                // Haunted Horror Painting
                const variant = Math.floor(wallRand * 500) % 4;
                if (!this.paintingTextures) this.paintingTextures = [];
                if (!this.paintingTextures[variant]) this.paintingTextures[variant] = this.buildPaintingTexture(variant);
                
                const pGroup = new THREE.Group();
                const frameBox = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.52, 0.04), new THREE.MeshStandardMaterial({ color: "#2b0a0a", roughness: 0.85 }));
                const canvasMesh = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.48, 0.03), new THREE.MeshStandardMaterial({ map: this.paintingTextures[variant], roughness: 0.7 }));
                canvasMesh.position.z = 0.01;
                pGroup.add(frameBox, canvasMesh);
                wallProp = pGroup;
              } else {
                // Hanging Iron Dungeon Chains
                const cGroup = new THREE.Group();
                const plateMat = new THREE.MeshStandardMaterial({ color: "#1c1917", metalness: 0.85, roughness: 0.3 });
                const plate = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.03), plateMat);
                
                const chainMat = new THREE.MeshStandardMaterial({ color: "#292524", metalness: 0.9, roughness: 0.2 });
                for (let c = 0; c < 3; c++) {
                  const link = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.007, 6, 10), chainMat);
                  link.position.set(0, -0.04 - c * 0.045, 0.02);
                  if (c % 2 === 1) link.rotation.y = Math.PI / 2;
                  cGroup.add(link);
                }
                cGroup.add(plate);
                wallProp = cGroup;
              }
            }
          }

          if (wallProp) {
            let mounted = false;
            if (isFloor(x, y + 1) && !this.occupiedWallFaces.has(`${x},${y},S`)) {
              wallProp.position.set(0, 0.65, 0.51);
              wallProp.rotation.y = 0;
              mounted = true;
              this.occupiedWallFaces.add(`${x},${y},S`);
            } else if (isFloor(x, y - 1) && !this.occupiedWallFaces.has(`${x},${y},N`)) {
              wallProp.position.set(0, 0.65, -0.51);
              wallProp.rotation.y = Math.PI;
              mounted = true;
              this.occupiedWallFaces.add(`${x},${y},N`);
            } else if (isFloor(x + 1, y) && !this.occupiedWallFaces.has(`${x},${y},E`)) {
              wallProp.position.set(0.51, 0.65, 0);
              wallProp.rotation.y = Math.PI / 2;
              mounted = true;
              this.occupiedWallFaces.add(`${x},${y},E`);
            } else if (isFloor(x - 1, y) && !this.occupiedWallFaces.has(`${x},${y},W`)) {
              wallProp.position.set(-0.51, 0.65, 0);
              wallProp.rotation.y = -Math.PI / 2;
              mounted = true;
              this.occupiedWallFaces.add(`${x},${y},W`);
            }

            if (mounted) {
              colGroup.add(wallProp);
            }
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
    
    // Position viewmodel on the right side in the right hand
    this.playerMesh.position.set(0.13, -0.11, -0.15);
    this.playerMesh.rotation.y = Math.PI / 20;
    this.playerMesh.scale.set(0.85, 0.85, 0.85);

    // D. Tactical Sleeve & Glove (Procedural right hand holding the flashlight)
    const sleeveMat = new THREE.MeshStandardMaterial({ color: "#1e293b", roughness: 0.85 }); // Slate dark sleeve
    const gloveMat = new THREE.MeshStandardMaterial({ color: "#0f172a", roughness: 0.9, metalness: 0.1 }); // Matte dark grey/black glove

    // 1. Sleeve (Forearm extending from bottom-right corner)
    const sleeve = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.02, 0.18, 8),
      sleeveMat
    );
    sleeve.rotation.x = Math.PI / 2.3;
    sleeve.rotation.y = Math.PI / 16;
    sleeve.position.set(0.01, -0.01, 0.05);
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
    this.shadowLightsPool = [];
    for (let i = 0; i < 2; i++) {
      const sLight = new THREE.PointLight(0xff0000, 0.0, 5.0);
      sLight.castShadow = false;
      sLight.visible = true; // Always visible in the scene graph to avoid recompilation
      this.scene.add(sLight);
      this.shadowLightsPool.push(sLight);
    }

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

      // Cache child sub-meshes in userData for O(1) rendering lookups
      mesh.userData.face = faceMesh;
      mesh.userData.smokeGroup = smokeGroup;

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
    const isUnderground = (currentFloor > 0);

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

      // Capping active lights to exactly 6 closest lights in the scene.
      // This maintains a constant light count of exactly 6 in the Three.js scene graph,
      // which completely prevents GPU shader recompilation stutters when walking between rooms.
      const activeLimit = Math.min(this.torches.length, 6);

      this.torches.forEach((t, i) => {
        const flicker = Math.sin(time * 3.3 + i) * 0.18 + Math.cos(time * 6.7 + i * 2.1) * 0.12 + Math.sin(time * 19.3 + i * 3.4) * 0.06;
        
        if (i < 6 && this.torchLightsPool && this.torchLightsPool[i]) {
          const pLight = this.torchLightsPool[i];
          pLight.position.set(t.worldX, t.worldY || 0.62, t.worldZ);
          // Only enable intensity if it is close enough to affect player visuals (under 6.5m)
          if (t.lastDist < 6.5) {
            pLight.intensity = t.baseIntensity + flicker;
          } else {
            pLight.intensity = 0.0;
          }
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

      // Ensure unused lights in the pool are turned off
      if (this.torchLightsPool) {
        for (let i = this.torches.length; i < 6; i++) {
          if (this.torchLightsPool[i]) {
            this.torchLightsPool[i].intensity = 0.0;
          }
        }
      }

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

    // Rebuild Scene Graph when loading new floor or if scene graph is empty
    const floorId = `${currentFloor}_${state.currentLevel}`;
    if (this.currentFloorId !== floorId || this.scene.children.length === 0) {
      this.rebuildScene(state);
    }

    // Floor background selection
    const isDeepestFloor = (currentFloor >= 2);
    if (isDeepestFloor) {
      this.scene.background = new THREE.Color("#0e0204");
    } else if (isUnderground) {
      this.scene.background = new THREE.Color("#010103");
    } else {
      this.scene.background = new THREE.Color("#020206");
    }

    // Keep light position synced with player
    if (this.dirLight) {
      this.dirLight.position.set(player.visualX + 8, 16, player.visualY + 8);
      this.dirLight.target.position.set(player.visualX, 0, player.visualY);
      this.dirLight.target.updateMatrixWorld();
    }

    // Lock starfield dome to player position so stars don't slide or vanish
    if (this.starField) {
      this.starField.position.set(player.visualX, 0, player.visualY);
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

    // Co-op remote player rendering
    if (state.otherPlayer) {
      if (!this.otherPlayerGroup) {
        this.otherPlayerGroup = new THREE.Group();
        this.scene.add(this.otherPlayerGroup);
        
        // SpotLight representing remote player's flashlight - added directly to scene for full wall lighting
        const light = new THREE.SpotLight("#ffffff", 0.0, 11.0, Math.PI / 6.0, 0.85, 1.1);
        light.castShadow = false;
        this.scene.add(light);
        this.otherPlayerLight = light;
        
        const targetObj = new THREE.Object3D();
        this.scene.add(targetObj);
        this.otherPlayerLight.target = targetObj;
      }
      
      // Lazily build or update the 3D Ghost character model (rebuilds if the real flashlight finishes loading)
      const hasRealFl = !!this.flashlightModel;
      if (!this.otherPlayerMesh || (hasRealFl && !this.otherPlayerHasRealFlashlight)) {
        // Clear any existing children
        while (this.otherPlayerGroup.children.length > 0) {
          this.otherPlayerGroup.remove(this.otherPlayerGroup.children[0]);
        }
        
        const ghostGroup = new THREE.Group();

        // 1. Ghost Head (Sphere)
        const headGeom = new THREE.SphereGeometry(0.12, 16, 16);
        const ghostMat = new THREE.MeshStandardMaterial({
          color: "#a78bfa", // violet sheet color
          emissive: "#5b21b6", // dark purple glow
          emissiveIntensity: 0.85,
          transparent: true,
          opacity: 0.65,
          roughness: 0.15,
          metalness: 0.1
        });
        const head = new THREE.Mesh(headGeom, ghostMat);
        head.position.y = 0.55;
        ghostGroup.add(head);

        // 2. Ghost Eyes (Two small glowing yellow beads)
        const eyeGeom = new THREE.SphereGeometry(0.016, 8, 8);
        const eyeMat = new THREE.MeshBasicMaterial({ color: "#fde047" });
        const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
        leftEye.position.set(0.045, 0.57, 0.10);
        const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
        rightEye.position.set(-0.045, 0.57, 0.10);
        ghostGroup.add(leftEye);
        ghostGroup.add(rightEye);

        // 3. Ghost Body (Cone pointing down to mimic a floating cloth shroud)
        const bodyGeom = new THREE.ConeGeometry(0.13, 0.40, 16, 1, true);
        bodyGeom.rotateX(Math.PI);
        const body = new THREE.Mesh(bodyGeom, ghostMat);
        body.position.y = 0.32;
        ghostGroup.add(body);

        // 4. Flashlight on the right side
        const handGroup = new THREE.Group();
        handGroup.position.set(0.16, 0.35, 0.08); // Right side
        
        if (hasRealFl) {
          const flModel = this.flashlightModel.clone();
          flModel.scale.set(0.5, 0.5, 0.5);
          flModel.rotation.set(0, -Math.PI / 2, 0); // point forward (rotates -X lens to +Z ghost face direction)
          handGroup.add(flModel);
        } else {
          // Fallback cylinder flashlight while loading assets
          const cylGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.1, 8);
          cylGeom.rotateX(Math.PI / 2);
          const cylMat = new THREE.MeshStandardMaterial({ color: "#1e293b", metalness: 0.8 });
          const fallbackFl = new THREE.Mesh(cylGeom, cylMat);
          handGroup.add(fallbackFl);
        }
        
        // 5. Glowing Flashlight Lens & Volumetric Light Beam Cone for Partner
        const lensMat = new THREE.MeshBasicMaterial({
          color: "#fef08a",
          transparent: true,
          opacity: 0.0
        });
        const lensMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.022, 0.022, 0.005, 12),
          lensMat
        );
        lensMesh.rotation.x = Math.PI / 2;
        lensMesh.position.set(0, 0, 0.12);
        handGroup.add(lensMesh);

        // Volumetric Light Cone extending from flashlight lens
        const coneGeom = new THREE.ConeGeometry(0.65, 3.5, 16, 1, true);
        coneGeom.rotateX(-Math.PI / 2);
        coneGeom.translate(0, 0, 1.75);

        const beamMat = new THREE.MeshBasicMaterial({
          color: "#fef08a",
          transparent: true,
          opacity: 0.0,
          side: THREE.DoubleSide,
          depthWrite: false
        });
        const beamMesh = new THREE.Mesh(coneGeom, beamMat);
        handGroup.add(beamMesh);

        ghostGroup.add(handGroup);
        ghostGroup.userData = { lensMat, beamMat };
        
        this.otherPlayerMesh = ghostGroup;
        this.otherPlayerGroup.add(this.otherPlayerMesh);
        this.otherPlayerHasRealFlashlight = hasRealFl;
      }
      
      const op = state.otherPlayer;
      if (!op || op.x === undefined || op.y === undefined) {
        if (this.otherPlayerGroup) this.otherPlayerGroup.visible = false;
        if (this.otherPlayerLight) this.otherPlayerLight.intensity = 0.0;
        return;
      }
      const localDist = Math.hypot(op.x - player.x, op.y - player.y);
      const isPartnerOnFloor = (Number(op.floor) === Number(currentFloor) && !op.isDead);
      
      if (isPartnerOnFloor) {
        if (op.visualX === undefined || op.visualX === null || Math.hypot(op.x - op.visualX, op.y - op.visualY) > 4.0) {
          op.visualX = op.x;
          op.visualY = op.y;
        } else {
          op.visualX += (op.x - op.visualX) * interpolationFactor;
          op.visualY += (op.y - op.visualY) * interpolationFactor;
        }
        
        // Float the ghost slightly and bob up/down using a sine wave
        const hoverY = 0.08 + Math.sin(Date.now() * 0.004) * 0.035;
        this.otherPlayerGroup.position.set(op.visualX, hoverY, op.visualY);
        
        // Orient character model to match look angle
        this.otherPlayerGroup.rotation.y = -op.angle + Math.PI / 2;

        // Hide ghost mesh only if camera is literally clipping inside body (<0.35m)
        this.otherPlayerGroup.visible = (localDist > 0.35);

        if (op.lanternOn) {
          const isMobileDevice = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
          let baseIntensity = isMobileDevice ? 2.5 : 4.5;
          this.otherPlayerLight.distance = isMobileDevice ? 7.0 : 10.0;

          // Dynamic low battery (<20%) flickering for partner's flashlight
          if (op.fuel !== undefined && op.fuel < 20) {
            const rand = Math.random();
            if (rand < 0.20) {
              baseIntensity = 0.4 + Math.random() * 1.0;
            } else if (rand < 0.40) {
              baseIntensity = 1.5 + Math.random() * 1.0;
            }
          }

          this.otherPlayerLight.position.set(op.visualX, hoverY + 0.35, op.visualY);
          
          const lookDirX = Math.cos(op.angle);
          const lookDirY = Math.sin(op.angle);
          const targetPitch = op.pitch || 0;
          
          this.otherPlayerLight.target.position.set(
            op.visualX + lookDirX * 5.0,
            hoverY + 0.35 + Math.sin(targetPitch) * 5.0,
            op.visualY + lookDirY * 5.0
          );
          
          this.otherPlayerLight.intensity = baseIntensity;
          this.otherPlayerLight.updateMatrixWorld(true);
          this.otherPlayerLight.target.updateMatrixWorld(true);

          // Update Flashlight Lens Bulb Glow and Light Beam Cone opacity with flickering sync
          if (this.otherPlayerMesh && this.otherPlayerMesh.userData) {
            const { lensMat, beamMat } = this.otherPlayerMesh.userData;
            const isFlickerDim = baseIntensity < 2.0;
            if (lensMat) lensMat.opacity = isFlickerDim ? 0.2 : 1.0;
            if (beamMat) beamMat.opacity = isFlickerDim ? 0.04 : 0.22;
          }
        } else {
          this.otherPlayerLight.intensity = 0.0;
          if (this.otherPlayerMesh && this.otherPlayerMesh.userData) {
            const { lensMat, beamMat } = this.otherPlayerMesh.userData;
            if (lensMat) lensMat.opacity = 0.0;
            if (beamMat) beamMat.opacity = 0.0;
          }
        }
      } else {
        this.otherPlayerGroup.visible = false;
        if (this.otherPlayerLight) {
          this.otherPlayerLight.intensity = 0.0;
        }
      }
    } else {
      if (this.otherPlayerGroup) {
        this.otherPlayerGroup.visible = false;
      }
      if (this.otherPlayerLight) {
        this.otherPlayerLight.intensity = 0.0;
      }
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
      const lid = this.chestLidGroups[key];
      const cx = lid.userData ? lid.userData.gridX : 0;
      const cy = lid.userData ? lid.userData.gridY : 0;
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
        const initialX = lid.userData && lid.userData.initialX !== undefined ? lid.userData.initialX : 0;
        const targetRot = cell.chest.opened ? initialX - 1.8 : initialX;
        lid.rotation.x += (targetRot - lid.rotation.x) * 0.15;
      }
    }

    // 3. Direct Obstacle mesh visibility sync
    for (const key in this.obstacleMeshes) {
      const obsMesh = this.obstacleMeshes[key];
      const ox = obsMesh.userData ? obsMesh.userData.gridX : 0;
      const oy = obsMesh.userData ? obsMesh.userData.gridY : 0;
      const cell = grid[oy] ? grid[oy][ox] : null;
      if (cell && cell.obstacle) {
        obsMesh.visible = !cell.obstacle.resolved;
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
        if (!npcGroup || !npcGroup.userData || !npcGroup.userData.cell) continue;
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
            // Target selection for NPC facing direction in co-op mode:
            // If Host and Guest are together/nearby, face Host.
            // If Host is far away, lock onto Guest if Guest is closer/near!
            let focusX = player.visualX;
            let focusZ = player.visualY;

            if (state && state.otherPlayer && Number(state.otherPlayer.floor) === Number(currentFloor) && !state.otherPlayer.isDead) {
              const op = state.otherPlayer;
              const dist1 = (player && !player.isDead) ? Math.hypot(player.visualX - (x + 0.5), player.visualY - (y + 0.5)) : 999;
              const dist2 = Math.hypot(op.visualX - (x + 0.5), op.visualY - (y + 0.5));

              // If Host is nearby (within 8m) and within 2.5m range of Guest, prioritize Host; otherwise pick closest player!
              if (dist1 < 8.0 && dist1 <= dist2 + 2.5) {
                focusX = player.visualX;
                focusZ = player.visualY;
              } else if (dist2 < dist1) {
                focusX = op.visualX;
                focusZ = op.visualY;
              }
            }

            const dx = focusX - (x + 0.5);
            const dz = focusZ - (y + 0.5);
            const dist = Math.hypot(dx, dz);
            
            if (dist < 25.0) {
              const targetAngle = Math.atan2(dx, dz);
              // Both mouse and FBX human models face +X locally, so offset by -Math.PI / 2 to face target directly
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
                const armL = model.userData ? model.userData.armL : null;
                const armR = model.userData ? model.userData.armR : null;
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
        if (!mesh) {
          // Construct the shadow monster mesh on demand
          mesh = new THREE.Group();
          mesh.visible = false;
          
          const faceMesh = new THREE.Mesh(this.monsterFaceGeom, this.createMonsterFaceMat());
          faceMesh.name = "face";
          faceMesh.position.set(0, 0.75, 0.15);
          faceMesh.renderOrder = 999;
          mesh.add(faceMesh);
          
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
          
          mesh.userData.face = faceMesh;
          mesh.userData.smokeGroup = smokeGroup;
          
          this.scene.add(mesh);
          this.shadowMonsterMeshes[index] = mesh;
          
          if (this.renderer) {
            try { this.renderer.compile(mesh, this.camera); } catch (e) {}
          }
        }

        if (!this.shadowLightsPool) {
          this.shadowLightsPool = [];
        }
        while (this.shadowLightsPool.length < state.shadowMonsters.length) {
          this.shadowLightsPool.push(null);
        }
        
        let shadowLight = this.shadowLightsPool[index];
        if (!shadowLight) {
          shadowLight = new THREE.PointLight(0xff0000, 0.0, 5.0);
          shadowLight.castShadow = false;
          shadowLight.visible = true;
          this.scene.add(shadowLight);
          this.shadowLightsPool[index] = shadowLight;
        }

        if (sm.active && Number(sm.floor) === Number(currentFloor)) {
          const time = Date.now() * 0.005 + index * 10.0;
          const burnRatio = Math.max(0.15, 1.0 - (sm.burnTime / 2.0));
          
          mesh.position.set(sm.x, 0.15 + Math.sin(time) * 0.08, sm.y);
          
          // Face player camera
          const dx = this.camera.position.x - sm.x;
          const dz = this.camera.position.z - sm.y;
          mesh.rotation.y = Math.atan2(dx, dz);
          
          // Update face via O(1) cached lookup
          const face = mesh.userData.face;
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
          
          if (shadowLight) {
            shadowLight.position.set(sm.x, 0.90 + Math.sin(time) * 0.08, sm.y);
            shadowLight.intensity = 1.2 * burnRatio;
          }
          
          // Animate individual smoke spheres via O(1) cached lookup
          const smokeGroup = mesh.userData.smokeGroup;
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
          if (shadowLight) {
            shadowLight.intensity = 0.0;
          }
        }
      });

      // Turn off any remaining pooled monster lights
      if (this.shadowLightsPool) {
        for (let i = state.shadowMonsters.length; i < 2; i++) {
          if (this.shadowLightsPool[i]) {
            this.shadowLightsPool[i].intensity = 0.0;
          }
        }
      }
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
              // Find an inactive trail particle from pool (O(N) index loop, 0 GC allocations)
              let p = null;
              for (let poolI = 0; poolI < this.smokeTrailPool.length; poolI++) {
                if (!this.smokeTrailPool[poolI].active) {
                  p = this.smokeTrailPool[poolI];
                  break;
                }
              }
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
