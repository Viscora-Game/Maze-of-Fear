import { Game } from "./game.js?v=13";

const init = () => {
  const game = new Game();
  setupUI(game);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

function setupUI(game) {
  // 1. DOM Element Cache
  const screens = {
    menu: document.getElementById("screen-menu"),
    settings: document.getElementById("screen-settings"),
    howtoplay: document.getElementById("screen-howtoplay"),
    game: document.getElementById("screen-game"),
  };

  const hud = {
    healthVal: document.getElementById("hud-health-val"),
    healthBar: document.getElementById("hud-health-bar"),
    staminaVal: document.getElementById("hud-stamina-val"),
    staminaBar: document.getElementById("hud-stamina-bar"),
    goldVal: document.getElementById("hud-gold-val"),
    fuelVal: document.getElementById("hud-fuel-val"),
    fuelBar: document.getElementById("hud-fuel-bar"),
    questsList: document.getElementById("hud-quests-list"),
    compassNeedle: document.getElementById("compass-needle"),
    levelVal: document.getElementById("hud-level-val"),
    floorVal: document.getElementById("hud-floor-val"),
    maxFloorVal: document.getElementById("hud-max-floor-val"),
    btnOpenInventory: document.getElementById("btn-open-inventory"),
    btnCloseInventory: document.getElementById("btn-close-inventory"),
    modalInventory: document.getElementById("modal-inventory"),
    invGrid: document.getElementById("inv-grid"),
    invDetailPanel: document.getElementById("inv-detail-panel"),
    invItemTitle: document.getElementById("inv-item-title"),
    invItemDesc: document.getElementById("inv-item-desc"),
    btnInvUse: document.getElementById("btn-inv-use"),
    btnInvEquip: document.getElementById("btn-inv-equip"),
    equippedVal: document.getElementById("hud-equipped-val")
  };

  const modals = {
    dialog: document.getElementById("modal-dialog"),
    chest: document.getElementById("modal-chest"),
    keypad: document.getElementById("modal-keypad"),
    ad: document.getElementById("modal-ad"),
    end: document.getElementById("modal-end")
  };

  // 2. State & Screen Management Helper
  const showScreen = (screenName) => {
    Object.entries(screens).forEach(([name, el]) => {
      if (name === screenName) el.classList.remove("hidden");
      else el.classList.add("hidden");
    });
  };

  const translateUI = () => {
    // Translate all elements with [data-t]
    document.querySelectorAll("[data-t]").forEach(el => {
      const key = el.getAttribute("data-t");
      el.textContent = game.t(key);
    });

    // Translate input placeholders or specific tags
    document.querySelectorAll("[data-t-placeholder]").forEach(el => {
      const key = el.getAttribute("data-t-placeholder");
      el.placeholder = game.t(key);
    });

    // Re-render settings buttons check
    document.getElementById("btn-lang-tr").classList.toggle("active", game.lang === "tr");
    document.getElementById("btn-lang-en").classList.toggle("active", game.lang === "en");
    document.getElementById("btn-sound").textContent = game.audio.muted ? game.t("soundOff") : game.t("soundOn");

    // Difficulty buttons toggle
    const difficulties = ["easy", "medium", "hard"];
    difficulties.forEach(diff => {
      document.getElementById(`btn-diff-${diff}`).classList.toggle("active", game.difficulty === diff);
    });
  };

  // Initialize Canvas
  const canvas = document.getElementById("game-canvas");
  game.setCanvas(canvas);

  // Translate initial UI
  translateUI();

  // 3. Main Menu Event Listeners
  let settingsFromGame = false;

  const updateAnalogModeUI = () => {
    const joystickBase = document.getElementById("joystick-base");
    if (!joystickBase) return;
    
    document.getElementById("btn-analog-floating").classList.toggle("active", game.analogMode === "floating");
    document.getElementById("btn-analog-fixed").classList.toggle("active", game.analogMode === "fixed");
    
    if (game.analogMode === "floating") {
      joystickBase.style.opacity = "0";
    } else {
      joystickBase.style.opacity = "1";
    }
  };

  const applySavedHUDLayout = () => {
    const saved = localStorage.getItem("maze_hud_layout");
    if (!saved) return;
    try {
      const layout = JSON.parse(saved);
      const btnOpenMap = document.getElementById("btn-open-map");
      const btnToggleLantern = document.getElementById("btn-toggle-lantern");
      const btnRun = document.getElementById("btn-run");
      const btnInteract = document.getElementById("btn-interact");
      
      const buttonsToEdit = [
        { id: "btn-open-inventory", el: hud.btnOpenInventory },
        { id: "btn-open-map", el: btnOpenMap },
        { id: "btn-toggle-lantern", el: btnToggleLantern },
        { id: "btn-run", el: btnRun },
        { id: "btn-interact", el: btnInteract }
      ];
      
      buttonsToEdit.forEach(b => {
        const data = layout[b.id];
        if (data && b.el) {
          b.el.style.position = "fixed";
          b.el.style.left = `${data.left}px`;
          b.el.style.top = `${data.top}px`;
          b.el.style.margin = "0";
          b.el.style.transform = `scale(${data.scale})`;
          b.el.dataset.scale = data.scale.toString();
        }
      });
    } catch (e) {
      console.error("Error loading saved HUD layout:", e);
    }
  };

  const clampButtonsToScreen = () => {
    const btnOpenMap = document.getElementById("btn-open-map");
    const btnToggleLantern = document.getElementById("btn-toggle-lantern");
    const btnRun = document.getElementById("btn-run");
    const btnInteract = document.getElementById("btn-interact");
    
    const buttonsToEdit = [
      { el: hud.btnOpenInventory },
      { el: btnOpenMap },
      { el: btnToggleLantern },
      { el: btnRun },
      { el: btnInteract }
    ];
    buttonsToEdit.forEach(b => {
      if (b.el && b.el.style.position === "fixed") {
        let left = parseFloat(b.el.style.left || "0");
        let top = parseFloat(b.el.style.top || "0");
        
        left = Math.max(0, Math.min(window.innerWidth - b.el.clientWidth, left));
        top = Math.max(0, Math.min(window.innerHeight - b.el.clientHeight, top));
        
        b.el.style.left = `${left}px`;
        b.el.style.top = `${top}px`;
      }
    });
  };
  window.addEventListener("resize", clampButtonsToScreen);
  window.addEventListener("orientationchange", () => {
    setTimeout(clampButtonsToScreen, 200);
  });

  // HUD Layout Customizer Mode
  const customizeHUD = () => {
    const overlay = document.getElementById("hud-editor-overlay");
    const slider = document.getElementById("hud-editor-size-slider");
    const sliderVal = document.getElementById("hud-editor-size-val");
    const btnSettings = document.getElementById("btn-ingame-settings");
    
    const btnOpenMap = document.getElementById("btn-open-map");
    const btnToggleLantern = document.getElementById("btn-toggle-lantern");
    const btnRun = document.getElementById("btn-run");
    const btnInteract = document.getElementById("btn-interact");
    
    const buttonsToEdit = [
      { id: "btn-open-inventory", el: hud.btnOpenInventory },
      { id: "btn-open-map", el: btnOpenMap },
      { id: "btn-toggle-lantern", el: btnToggleLantern },
      { id: "btn-run", el: btnRun },
      { id: "btn-interact", el: btnInteract }
    ];
    
    let selectedButton = null;
    let dragActive = false;
    let dragTouchId = null;
    let dragStartX = 0, dragStartY = 0;
    let initialLeft = 0, initialTop = 0;
    
    const originalPositions = {};
    
    buttonsToEdit.forEach(b => {
      const rect = b.el.getBoundingClientRect();
      const currentScale = parseFloat(b.el.dataset.scale || "1.0");
      
      b.el.style.position = "fixed";
      b.el.style.left = `${rect.left}px`;
      b.el.style.top = `${rect.top}px`;
      b.el.style.margin = "0";
      b.el.style.transform = `scale(${currentScale})`;
      b.el.style.zIndex = "999";
      b.el.style.border = "2px dashed rgba(255, 255, 255, 0.4)";
      
      originalPositions[b.id] = {
        left: rect.left,
        top: rect.top,
        scale: currentScale
      };
    });
    
    overlay.classList.remove("hidden");
    
    const selectButton = (b) => {
      selectedButton = b;
      buttonsToEdit.forEach(btn => {
        if (btn.id === b.id) {
          btn.el.style.border = "3px solid var(--violet)";
          btn.el.style.boxShadow = "0 0 15px var(--violet)";
        } else {
          btn.el.style.border = "2px dashed rgba(255, 255, 255, 0.4)";
          btn.el.style.boxShadow = "";
        }
      });
      slider.disabled = false;
      const currentScale = parseFloat(b.el.dataset.scale || "1.0");
      slider.value = Math.round(currentScale * 100);
      sliderVal.textContent = `${slider.value}%`;
    };
    
    const touchStartHandler = (e) => {
      const touch = e.changedTouches[0];
      const target = e.target;
      
      const matchedBtn = buttonsToEdit.find(b => b.el.contains(target));
      if (!matchedBtn) return;
      
      e.preventDefault();
      selectButton(matchedBtn);
      
      dragActive = true;
      dragTouchId = touch.identifier;
      dragStartX = touch.clientX;
      dragStartY = touch.clientY;
      initialLeft = parseFloat(matchedBtn.el.style.left);
      initialTop = parseFloat(matchedBtn.el.style.top);
    };
    
    const touchMoveHandler = (e) => {
      if (!dragActive) return;
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        if (touch.identifier === dragTouchId) {
          e.preventDefault();
          const dx = touch.clientX - dragStartX;
          const dy = touch.clientY - dragStartY;
          
          let newLeft = initialLeft + dx;
          let newTop = initialTop + dy;
          
          newLeft = Math.max(0, Math.min(window.innerWidth - selectedButton.el.clientWidth, newLeft));
          newTop = Math.max(0, Math.min(window.innerHeight - selectedButton.el.clientHeight, newTop));
          
          selectedButton.el.style.left = `${newLeft}px`;
          selectedButton.el.style.top = `${newTop}px`;
          break;
        }
      }
    };
    
    const checkOverlap = (el1, el2) => {
      const r1 = el1.getBoundingClientRect();
      const r2 = el2.getBoundingClientRect();
      return !(r1.right < r2.left + 5 || 
               r1.left > r2.right - 5 || 
               r1.bottom < r2.top + 5 || 
               r1.top > r2.bottom - 5);
    };
    
    const touchEndHandler = (e) => {
      if (!dragActive) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === dragTouchId) {
          dragActive = false;
          dragTouchId = null;
          
          let overlap = false;
          for (let btn of buttonsToEdit) {
            if (btn.id !== selectedButton.id && checkOverlap(selectedButton.el, btn.el)) {
              overlap = true;
              break;
            }
          }
          
          if (btnSettings && checkOverlap(selectedButton.el, btnSettings)) {
            overlap = true;
          }
          
          if (overlap) {
            const orig = originalPositions[selectedButton.id];
            selectedButton.el.style.left = `${orig.left}px`;
            selectedButton.el.style.top = `${orig.top}px`;
            selectedButton.el.style.border = "3px solid var(--red)";
            setTimeout(() => {
              selectedButton.el.style.border = "3px solid var(--violet)";
            }, 300);
          } else {
            originalPositions[selectedButton.id].left = parseFloat(selectedButton.el.style.left);
            originalPositions[selectedButton.id].top = parseFloat(selectedButton.el.style.top);
          }
          break;
        }
      }
    };
    
    const sliderHandler = (e) => {
      if (!selectedButton) return;
      const scale = parseInt(e.target.value) / 100;
      sliderVal.textContent = `${e.target.value}%`;
      
      selectedButton.el.style.transform = `scale(${scale})`;
      selectedButton.el.dataset.scale = scale.toString();
      
      let overlap = false;
      for (let btn of buttonsToEdit) {
        if (btn.id !== selectedButton.id && checkOverlap(selectedButton.el, btn.el)) {
          overlap = true;
          break;
        }
      }
      if (btnSettings && checkOverlap(selectedButton.el, btnSettings)) {
        overlap = true;
      }
      
      if (overlap) {
        const orig = originalPositions[selectedButton.id];
        slider.value = Math.round(orig.scale * 100);
        sliderVal.textContent = `${slider.value}%`;
        selectedButton.el.style.transform = `scale(${orig.scale})`;
        selectedButton.el.dataset.scale = orig.scale.toString();
      } else {
        originalPositions[selectedButton.id].scale = scale;
      }
    };
    
    window.addEventListener("touchstart", touchStartHandler, { passive: false });
    window.addEventListener("touchmove", touchMoveHandler, { passive: false });
    window.addEventListener("touchend", touchEndHandler);
    window.addEventListener("touchcancel", touchEndHandler);
    slider.addEventListener("input", sliderHandler);
    
    const saveLayout = () => {
      const layout = {};
      buttonsToEdit.forEach(b => {
        const scale = parseFloat(b.el.dataset.scale || "1.0");
        layout[b.id] = {
          left: parseFloat(b.el.style.left),
          top: parseFloat(b.el.style.top),
          scale: scale
        };
        b.el.style.border = "";
        b.el.style.boxShadow = "";
        b.el.style.zIndex = "";
      });
      localStorage.setItem("maze_hud_layout", JSON.stringify(layout));
      
      cleanup();
      overlay.classList.add("hidden");
      showScreen("settings");
    };
    
    const resetLayout = () => {
      buttonsToEdit.forEach(b => {
        b.el.style.position = "";
        b.el.style.left = "";
        b.el.style.top = "";
        b.el.style.margin = "";
        b.el.style.transform = "";
        b.el.style.border = "";
        b.el.style.boxShadow = "";
        b.el.style.zIndex = "";
        delete b.el.dataset.scale;
      });
      localStorage.removeItem("maze_hud_layout");
      
      cleanup();
      overlay.classList.add("hidden");
      showScreen("settings");
    };
    
    const cleanup = () => {
      window.removeEventListener("touchstart", touchStartHandler);
      window.removeEventListener("touchmove", touchMoveHandler);
      window.removeEventListener("touchend", touchEndHandler);
      window.removeEventListener("touchcancel", touchEndHandler);
      slider.removeEventListener("input", sliderHandler);
      slider.disabled = true;
    };
    
    document.getElementById("btn-hud-editor-save").onclick = saveLayout;
    document.getElementById("btn-hud-editor-reset").onclick = resetLayout;
  };

  // Set up config on load
  game.analogMode = localStorage.getItem("maze_analog_mode") || "floating";
  setTimeout(() => {
    updateAnalogModeUI();
    applySavedHUDLayout();
  }, 100);

  document.getElementById("btn-play").addEventListener("click", () => {
    game.initNewGame();
    showScreen("game");
    game.state.gameState = "playing";
    game.resizeCanvas();
  });

  document.getElementById("btn-settings").addEventListener("click", () => {
    settingsFromGame = false;
    showScreen("settings");
  });

  // In-game Settings Gear button
  const btnIngameSettings = document.getElementById("btn-ingame-settings");
  if (btnIngameSettings) {
    btnIngameSettings.addEventListener("click", () => {
      settingsFromGame = true;
      game.state.gameState = "paused";
      showScreen("settings");
    });
  }

  document.getElementById("btn-howtoplay").addEventListener("click", () => {
    showScreen("howtoplay");
  });

  // Settings Menu Listeners
  document.getElementById("btn-lang-tr").addEventListener("click", () => {
    game.lang = "tr";
    localStorage.setItem("maze_lang", "tr");
    translateUI();
  });

  document.getElementById("btn-lang-en").addEventListener("click", () => {
    game.lang = "en";
    localStorage.setItem("maze_lang", "en");
    translateUI();
  });

  document.getElementById("btn-sound").addEventListener("click", () => {
    const isMuted = game.audio.toggleMute();
    localStorage.setItem("maze_audio", (!isMuted).toString());
    translateUI();
  });

  const difficulties = ["easy", "medium", "hard"];
  difficulties.forEach(diff => {
    document.getElementById(`btn-diff-${diff}`).addEventListener("click", () => {
      game.difficulty = diff;
      localStorage.setItem("maze_diff", diff);
      translateUI();
    });
  });

  // Analog Mode Toggles
  document.getElementById("btn-analog-floating").addEventListener("click", () => {
    game.analogMode = "floating";
    localStorage.setItem("maze_analog_mode", "floating");
    updateAnalogModeUI();
  });
  
  document.getElementById("btn-analog-fixed").addEventListener("click", () => {
    game.analogMode = "fixed";
    localStorage.setItem("maze_analog_mode", "fixed");
    updateAnalogModeUI();
  });

  // Custom HUD Customize trigger button
  document.getElementById("btn-edit-hud").addEventListener("click", () => {
    screens.settings.classList.add("hidden");
    customizeHUD();
  });

  // Back Buttons
  document.querySelectorAll(".btn-back").forEach(btn => {
    btn.addEventListener("click", () => {
      if (settingsFromGame) {
        settingsFromGame = false;
        game.state.gameState = "playing";
        showScreen("game");
      } else {
        showScreen("menu");
      }
    });
  });

  // 4. In-Game HUD & Inventory Sync
  game.onStateChange = () => {
    const s = game.state;
    const p = s.player;

    // Level and Floor
    if (hud.levelVal) hud.levelVal.textContent = s.currentLevel;
    if (hud.floorVal) hud.floorVal.textContent = s.currentFloor + 1;
    if (hud.maxFloorVal) hud.maxFloorVal.textContent = s.numFloors;

    // Health
    hud.healthVal.textContent = `${Math.ceil(p.health)}%`;
    hud.healthBar.style.width = `${p.health}%`;
    hud.healthBar.className = "progress-bar-fill " + (p.health < 30 ? "bg-red" : p.health < 60 ? "bg-orange" : "bg-green");

    // Stamina
    if (hud.staminaVal && hud.staminaBar) {
      const staminaPercent = Math.ceil((p.stamina || 0) / (p.maxStamina || 100) * 100);
      hud.staminaVal.textContent = `${staminaPercent}%`;
      hud.staminaBar.style.width = `${staminaPercent}%`;
      hud.staminaBar.className = "progress-bar-fill " + (staminaPercent < 25 ? "bg-red low-stamina-pulse" : "bg-gold");
    }

    // Gold
    hud.goldVal.textContent = p.gold;

    // Fuel
    if (hud.fuelVal && hud.fuelBar) {
      hud.fuelVal.textContent = `${Math.ceil(p.fuel)}%`;
      hud.fuelBar.style.width = `${p.fuel}%`;
      hud.fuelBar.className = "progress-bar-fill " + (p.fuel < 25 ? "bg-red-pulse" : "bg-gold");
    }

    // Toggle crosshair visibility in gameplay
    const crosshair = document.getElementById("fps-crosshair");
    if (crosshair) {
      crosshair.style.display = s.gameState === "playing" ? "block" : "none";
    }

    // Sync Lantern Button state (Toggles icon and glow border/background)
    const lanternBtn = document.getElementById("btn-toggle-lantern");
    if (lanternBtn) {
      if (s.lanternOn && p.fuel > 0) {
        lanternBtn.innerHTML = "🪔";
        lanternBtn.style.background = "rgba(251, 191, 38, 0.35)"; // Amber active background
        lanternBtn.style.borderColor = "rgba(251, 191, 38, 0.75)";  // Glowing amber border
        lanternBtn.style.boxShadow = "0 0 15px rgba(251, 191, 38, 0.4)";
      } else {
        lanternBtn.innerHTML = "🔦";
        lanternBtn.style.background = "rgba(15, 23, 42, 0.45)";    // Dark inactive background
        lanternBtn.style.borderColor = "rgba(251, 191, 38, 0.25)";  // Inactive border
        lanternBtn.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.3)";
      }
    }

    // Sync Sprint Button state (Toggles glow border/background based on shift state)
    const btnRun = document.getElementById("btn-run");
    if (btnRun) {
      if (game.keys && game.keys["shift"]) {
        btnRun.style.background = "rgba(249, 115, 22, 0.4)"; // Orange active background
        btnRun.style.borderColor = "rgba(249, 115, 22, 0.85)";  // Glowing orange border
        btnRun.style.boxShadow = "0 0 18px rgba(249, 115, 22, 0.5)";
      } else {
        btnRun.style.background = "rgba(15, 23, 42, 0.6)";    // Dark inactive background
        btnRun.style.borderColor = "rgba(249, 115, 22, 0.25)";  // Inactive border
        btnRun.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.3)";
      }
    }

    // Quests
    hud.questsList.innerHTML = "";
    
    // Main Quest
    const mainLi = document.createElement("li");
    mainLi.textContent = `🎯 ${game.t("exitFound")}`;
    hud.questsList.appendChild(mainLi);

    // Well & Child Quest
    if (s.quests.childState !== "solved" && p.inventory.bucket > 0) {
      const qLi = document.createElement("li");
      qLi.textContent = `💧 ${game.t("npc.well.drawWater")} (1/2)`;
      hud.questsList.appendChild(qLi);
    } else if (s.quests.childState !== "solved" && p.inventory.bucket_full > 0) {
      const qLi = document.createElement("li");
      qLi.textContent = `👶 ${game.t("npc.child.greeting")} (2/2)`;
      hud.questsList.appendChild(qLi);
    }

    // Mouse Quest
    if (s.quests.mouseState !== "solved" && p.inventory.cheese > 0) {
      const qLi = document.createElement("li");
      qLi.textContent = `🐭 ${game.t("npc.mouse.hasCheese")}`;
      hud.questsList.appendChild(qLi);
    }

    // Sync Equipped Item Val
    const equipped = p.equippedItem;
    if (equipped) {
      const emojiMap = {
        key: "🔑", shears: "✂️", bucket: "🪣", bucket_full: "💧", axe: "🪓", rope: "🪵", compass: "🧭", map_piece: "📜", fuel: "🛢️", cheese: "🧀"
      };
      if (hud.equippedVal) hud.equippedVal.textContent = `${emojiMap[equipped] || "📦"} ${game.t("items." + equipped + ".name")}`;
    } else {
      if (hud.equippedVal) hud.equippedVal.textContent = game.lang === "tr" ? "Boş" : "Empty";
    }
  };

  // 5. Virtual Joystick Setup (Mobile & Mouse)
  const joystickZone = document.getElementById("joystick-zone");
  const joystickBase = document.getElementById("joystick-base");
  const joystickHandle = document.getElementById("joystick-handle");

  if (joystickZone && joystickBase && joystickHandle) {
    let joystickActive = false;
    let joystickTouchId = null;
    let startX = 0;
    let startY = 0;
    const maxDistance = 40; // Max visual displacement in pixels

    const handleStart = (clientX, clientY, touchId = null) => {
      joystickActive = true;
      joystickTouchId = touchId;
      
      // Center the joystick base dynamically at the touch coordinate (base size is 120px, so 60px offset)
      joystickBase.style.position = "fixed";
      joystickBase.style.left = `${clientX - 60}px`;
      joystickBase.style.top = `${clientY - 60}px`;
      joystickBase.style.margin = "0";
      
      startX = clientX;
      startY = clientY;
    };

    const handleMove = (clientX, clientY) => {
      if (!joystickActive) return;

      let dx = clientX - startX;
      let dy = clientY - startY;
      const distance = Math.hypot(dx, dy);

      if (distance > maxDistance) {
        dx = (dx / distance) * maxDistance;
        dy = (dy / distance) * maxDistance;
      }

      // Move visual handle
      joystickHandle.style.transform = `translate(${dx}px, ${dy}px)`;

      // Map to game inputs:
      // X maps to strafeDir (left/right, positive is right)
      // Y maps to moveDir (forward/backward, positive Y is forward, so invert screen Y delta)
      if (game.joystick) {
        game.joystick.x = dx / maxDistance;
        game.joystick.y = -dy / maxDistance;
      }
    };

    const handleEnd = () => {
      if (!joystickActive) return;
      joystickActive = false;
      joystickTouchId = null;
      
      // Snap the joystick base back to its default layout position
      joystickBase.style.position = "";
      joystickBase.style.left = "";
      joystickBase.style.top = "";
      joystickBase.style.margin = "";
      
      // Reset position
      joystickHandle.style.transform = "translate(0px, 0px)";
      if (game.joystick) {
        game.joystick.x = 0;
        game.joystick.y = 0;
      }
    };

    // Listen to touchstart on window to allow dynamic floating/fixed joystick placement
    window.addEventListener("touchstart", (e) => {
      if (game.state.gameState !== "playing" || joystickActive) return;
      
      const target = e.target;
      const touch = e.changedTouches[0];
      
      // If we are in fixed mode, only start if touch is inside the joystick zone/base
      if (game.analogMode === "fixed") {
        if (target.closest("#joystick-zone") || target.closest(".joystick-base")) {
          joystickActive = true;
          joystickTouchId = touch.identifier;
          
          const rect = joystickBase.getBoundingClientRect();
          startX = rect.left + rect.width / 2;
          startY = rect.top + rect.height / 2;
        }
        return;
      }
      
      // Ignore if user touches an interactive button or HUD element in floating mode
      if (target.closest("button") || target.closest(".circle-btn") || target.closest("#hud-left-pill") || target.closest("#hud-right-pill") || target.closest(".btn-toggle")) {
        return;
      }
      
      // Only capture if touch is on the left half of the screen
      if (touch.clientX < window.innerWidth / 2) {
        handleStart(touch.clientX, touch.clientY, touch.identifier);
      }
    }, { passive: true });

    window.addEventListener("touchmove", (e) => {
      if (!joystickActive) return;
      if (e.cancelable) e.preventDefault(); // Prevent default page bounce/scrolling
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === joystickTouchId) {
          handleMove(e.touches[i].clientX, e.touches[i].clientY);
          break;
        }
      }
    }, { passive: false });

    window.addEventListener("touchend", (e) => {
      if (!joystickActive) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === joystickTouchId) {
          handleEnd();
          break;
        }
      }
    });

    window.addEventListener("touchcancel", (e) => {
      if (!joystickActive) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === joystickTouchId) {
          handleEnd();
          break;
        }
      }
    });

    // Mouse fallback for testing
    joystickZone.addEventListener("mousedown", (e) => {
      handleStart(e.clientX, e.clientY);
      
      const mouseMove = (me) => {
        handleMove(me.clientX, me.clientY);
      };
      
      const mouseUp = () => {
        handleEnd();
        window.removeEventListener("mousemove", mouseMove);
        window.removeEventListener("mouseup", mouseUp);
      };
      
      window.addEventListener("mousemove", mouseMove);
      window.addEventListener("mouseup", mouseUp);
    });
  }

  // Handle resizing window
  window.addEventListener("resize", () => {
    game.resizeCanvas();
  });

  // 7. Modal Callbacks
  // Dialogue Overlay (NPCs, Obstacles & Ancient Scrolls)
  game.onDialog = (config) => {
    modals.dialog.innerHTML = "";
    modals.dialog.classList.remove("hidden");

    // Render as a spooky ancient parchment note if it is a clue
    if (config.isClue) {
      const container = document.createElement("div");
      container.className = "parchment-container animate-fade-in";
      container.innerHTML = `
        <div class="parchment-scroll">
          <h2 class="parchment-title">${config.title}</h2>
          <p class="parchment-text">${config.text.replace(/\n/g, '<br>')}</p>
          <div class="parchment-buttons" id="dialog-buttons"></div>
        </div>
      `;
      modals.dialog.appendChild(container);

      const btnContainer = container.querySelector("#dialog-buttons");
      config.choices.forEach(c => {
        const btn = document.createElement("button");
        btn.className = "btn-parchment";
        btn.textContent = c.text;
        btn.addEventListener("click", () => {
          modals.dialog.classList.add("hidden");
          c.action();
        });
        btnContainer.appendChild(btn);
      });
      return;
    }

    // Determine NPC avatar/emoji
    let npcEmoji = "🚧";
    const titleLower = config.title.toLowerCase();
    if (titleLower.includes("gezgin") || titleLower.includes("traveler")) {
      npcEmoji = "🤠";
    } else if (titleLower.includes("tüccar") || titleLower.includes("merchant")) {
      npcEmoji = "👳";
    } else if (titleLower.includes("çocuk") || titleLower.includes("child") || titleLower.includes("genç") || titleLower.includes("youth") || titleLower.includes("teen")) {
      npcEmoji = "👦";
    } else if (titleLower.includes("fare") || titleLower.includes("sıçan") || titleLower.includes("mouse") || titleLower.includes("rat")) {
      npcEmoji = "🐀";
    }

    const container = document.createElement("div");
    container.className = "dialog-container";

    container.innerHTML = `
      <!-- NPC Speech Bubble on Left -->
      <div class="dialog-npc-side animate-fade-in-left">
        <div class="dialog-portrait-wrapper">
          <div class="dialog-avatar" style="background: var(--violet);">${npcEmoji}</div>
          <span class="dialog-name">${config.title}</span>
        </div>
        <div class="dialog-bubble">
          <p style="margin: 0;">${config.text}</p>
        </div>
      </div>

      <!-- Player Options Bubble on Right -->
      <div class="dialog-player-side animate-fade-in-right">
        <div class="dialog-portrait-wrapper">
          <div class="dialog-avatar" style="background: var(--cyan);">🕵️</div>
          <span class="dialog-name">${game.state.lang === "tr" ? "Kaşif" : "Explorer"}</span>
        </div>
        <div class="dialog-bubble" style="display: flex; flex-direction: column; gap: 8px;">
          <div class="modal-buttons" id="dialog-buttons" style="flex-direction: column; width: 100%;"></div>
        </div>
      </div>
    `;

    modals.dialog.appendChild(container);

    const btnContainer = container.querySelector("#dialog-buttons");
    config.choices.forEach(c => {
      const btn = document.createElement("button");
      btn.className = "btn-modal btn-primary";
      btn.style.width = "100%";
      btn.style.margin = "0";
      btn.textContent = c.text;
      btn.addEventListener("click", () => {
        modals.dialog.classList.add("hidden");
        c.action();
      });
      btnContainer.appendChild(btn);
    });
  };

  // Chest Overlay
  game.onChest = (config) => {
    modals.chest.innerHTML = "";
    modals.chest.classList.remove("hidden");

    const content = document.createElement("div");
    content.className = "modal-content glass text-center";

    if (config.isOpeningPrompt) {
      content.innerHTML = `
        <div class="chest-icon-anim animate-float">📦</div>
        <h3 class="modal-title glow-text" data-t="chest.prompt">${game.t("chest.prompt")}</h3>
        <div class="modal-buttons mt-6">
          <button class="btn-modal btn-success" id="btn-chest-open" data-t="chest.openBtn">${game.t("chest.openBtn")}</button>
          <button class="btn-modal btn-danger" id="btn-chest-leave" data-t="chest.leaveBtn">${game.t("chest.leaveBtn")}</button>
        </div>
      `;
      modals.chest.appendChild(content);

      content.querySelector("#btn-chest-open").addEventListener("click", config.onOpen);
      content.querySelector("#btn-chest-leave").addEventListener("click", config.onLeave);
    } else {
      // Chest opening outcome screen
      let adButtonHTML = "";
      if (config.detail) {
        // Only allow ad undo for traps
        adButtonHTML = `<button class="btn-modal btn-warning w-full" id="btn-chest-ad" data-t="chest.adUndo">${game.t("chest.adUndo")}</button>`;
      }

      content.innerHTML = `
        <div class="outcome-title text-violet glow-text text-2xl font-bold">${config.title}</div>
        <p class="modal-text my-6">${config.text}</p>
        <div class="modal-buttons flex-col gap-3">
          ${adButtonHTML}
          <button class="btn-modal btn-primary w-full" id="btn-chest-close">${config.detail ? game.t("chest.adClose") : game.t("close")}</button>
        </div>
      `;
      modals.chest.appendChild(content);

      if (config.detail) {
        content.querySelector("#btn-chest-ad").addEventListener("click", () => {
          modals.chest.classList.add("hidden");
          config.onWatchAd();
        });
      }
      content.querySelector("#btn-chest-close").addEventListener("click", () => {
        modals.chest.classList.add("hidden");
        config.onClose();
      });
    }
  };

  // Combination Keypad Overlay
  game.onKeypad = (correctCode, onSubmit) => {
    modals.keypad.innerHTML = "";
    modals.keypad.classList.remove("hidden");

    let entered = "";
    const content = document.createElement("div");
    content.className = "modal-content glass text-center max-w-sm";

    content.innerHTML = `
      <h3 class="modal-title text-cyan glow-text" data-t="puzzle.keypadTitle">${game.t("puzzle.keypadTitle")}</h3>
      <div class="keypad-display" id="keypad-display">----</div>
      <div class="keypad-grid">
        <button class="btn-key" data-num="1">1</button>
        <button class="btn-key" data-num="2">2</button>
        <button class="btn-key" data-num="3">3</button>
        <button class="btn-key" data-num="4">4</button>
        <button class="btn-key" data-num="5">5</button>
        <button class="btn-key" data-num="6">6</button>
        <button class="btn-key" data-num="7">7</button>
        <button class="btn-key" data-num="8">8</button>
        <button class="btn-key" data-num="9">9</button>
        <button class="btn-key btn-danger" id="btn-key-clear">C</button>
        <button class="btn-key" data-num="0">0</button>
        <button class="btn-key btn-success" id="btn-key-enter">OK</button>
      </div>
      <button class="btn-modal btn-primary mt-4 w-full" id="btn-keypad-close">${game.t("close")}</button>
    `;
    modals.keypad.appendChild(content);

    const display = content.querySelector("#keypad-display");

    const updateDisplay = () => {
      display.textContent = entered.padEnd(4, "-");
    };

    content.querySelectorAll(".btn-key[data-num]").forEach(btn => {
      btn.addEventListener("click", () => {
        if (entered.length < 4) {
          entered += btn.getAttribute("data-num");
          game.audio.playStep(); // button beep
          updateDisplay();
        }
      });
    });

    content.querySelector("#btn-key-clear").addEventListener("click", () => {
      entered = "";
      game.audio.playStep();
      updateDisplay();
    });

    content.querySelector("#btn-key-enter").addEventListener("click", () => {
      modals.keypad.classList.add("hidden");
      if (entered === correctCode) {
        alert(game.t("puzzle.keypadCorrect"));
        onSubmit(true);
      } else {
        alert(game.t("puzzle.keypadIncorrect"));
        onSubmit(false);
      }
    });

    content.querySelector("#btn-keypad-close").addEventListener("click", () => {
      modals.keypad.classList.add("hidden");
      game.state.gameState = "playing";
      if (game.onStateChange) game.onStateChange();
    });
  };

  // Random Event Dialogue overlay
  game.onEvent = (config) => {
    modals.dialog.innerHTML = "";
    modals.dialog.classList.remove("hidden");

    const content = document.createElement("div");
    content.className = "modal-content glass border-orange";

    content.innerHTML = `
      <h3 class="modal-title text-orange glow-text">⚠️ Olay / Event</h3>
      <p class="modal-text">${config.text}</p>
      <div class="modal-buttons" id="event-buttons"></div>
    `;

    modals.dialog.appendChild(content);

    const btnContainer = content.querySelector("#event-buttons");
    config.choices.forEach(c => {
      const btn = document.createElement("button");
      btn.className = "btn-modal btn-primary w-full text-left";
      btn.textContent = c.text;
      btn.addEventListener("click", () => {
        modals.dialog.classList.add("hidden");
        c.action();
      });
      btnContainer.appendChild(btn);
    });
  };

  // Mock Rewarded Ad Overlay
  game.onAd = (durationSeconds, onFinished, onSkip) => {
    modals.ad.innerHTML = "";
    modals.ad.classList.remove("hidden");

    const adMockBrands = [
      {
        title: "Angry Goblins 3D",
        desc: "CRUSH Goblins. DEFEND the Castle. Solve puzzles with explosions! Play FREE now!",
        icon: "💥"
      },
      {
        title: "Candy Match RPG",
        desc: "Connect 3 jellies to cast fireballs! Level 10,000 awaits! Extremely addictive!",
        icon: "🍬"
      },
      {
        title: "Subway Run 4D",
        desc: "Infinite running, now in 4 dimensions! Dodge temporal anomaly cars! Grab the coins!",
        icon: "🏃‍♂️"
      }
    ];

    const ad = adMockBrands[Math.floor(Math.random() * adMockBrands.length)];
    let timeLeft = durationSeconds;

    const content = document.createElement("div");
    content.className = "modal-content glass ad-mock text-center";

    content.innerHTML = `
      <div class="ad-label" data-t="adWatchTitle">${game.t("adWatchTitle")}</div>
      <div class="ad-card glass my-6">
        <div class="ad-icon animate-bounce">${ad.icon}</div>
        <h4 class="ad-name text-violet glow-text text-xl font-bold mt-2">${ad.title}</h4>
        <p class="ad-desc text-gray text-sm mt-3 px-4">${ad.desc}</p>
        <button class="btn-modal btn-success mt-4 scale-95 pointer-events-none">DOWNLOAD FREE</button>
      </div>
      <div class="progress-bar my-4 w-full">
        <div class="progress-bar-fill bg-violet" id="ad-progress" style="width: 100%;"></div>
      </div>
      <div class="flex justify-between items-center px-4">
        <span class="text-sm font-semibold text-gray" id="ad-timer">${game.t("adSeconds", { sec: timeLeft })}</span>
        <button class="btn-skip disabled" id="btn-ad-skip" disabled data-t="skip">${game.t("skip")}</button>
      </div>
    `;
    modals.ad.appendChild(content);

    const timerText = content.querySelector("#ad-timer");
    const progress = content.querySelector("#ad-progress");
    const skipBtn = content.querySelector("#btn-ad-skip");

    const interval = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(interval);
        progress.style.width = "0%";
        timerText.textContent = game.t("adRewardText");
        
        // Enable Skip to claim
        skipBtn.removeAttribute("disabled");
        skipBtn.className = "btn-skip active";
        skipBtn.textContent = game.t("close");
        skipBtn.addEventListener("click", () => {
          modals.ad.classList.add("hidden");
          onFinished();
        });
      } else {
        progress.style.width = `${(timeLeft / durationSeconds) * 100}%`;
        timerText.textContent = game.t("adSeconds", { sec: timeLeft });
      }
    }, 1000);

    // Initial skip button binds to early exit without reward
    skipBtn.addEventListener("click", () => {
      if (timeLeft > 0) {
        clearInterval(interval);
        modals.ad.classList.add("hidden");
        onSkip();
      }
    });
  };

  // Game End Screens (Victory / Game Over)
  game.onGameEnd = (isVictory) => {
    modals.end.innerHTML = "";
    modals.end.classList.remove("hidden");

    const content = document.createElement("div");
    content.className = `modal-content glass text-center ${isVictory ? "border-success" : "border-danger"}`;

    const title = isVictory ? game.t("victory") : game.t("gameOver");
    const desc = isVictory ? game.t("victoryDesc") : game.t("gameOverDesc");
    const emoji = isVictory ? "🏆" : "💀";
    const titleColor = isVictory ? "text-green" : "text-red";

    let adReviveBtn = "";
    if (!isVictory) {
      // Allow watch ad to revive
      adReviveBtn = `<button class="btn-modal btn-warning w-full py-3 mb-3 glow-box" id="btn-revive-ad">${game.t("reviveBtn")}</button>`;
    }

    content.innerHTML = `
      <div class="end-emoji animate-float">${emoji}</div>
      <h2 class="modal-title ${titleColor} glow-text text-3xl font-extrabold">${title}</h2>
      <p class="modal-text my-6 px-4">${desc}</p>
      
      <div class="stats-panel glass py-4 px-6 mb-6 inline-block text-left w-full">
        <div>💰 ${game.t("gold")}: <span class="font-bold text-gold">${game.state.player.gold}</span></div>
        <div>👣 ${game.t("back")} / Steps: <span class="font-bold text-violet">${game.state.stepsTaken}</span></div>
        <div>🧩 ${game.t("difficulty")}: <span class="font-bold text-cyan">${game.t("diff" + game.difficulty.charAt(0).toUpperCase() + game.difficulty.slice(1))}</span></div>
      </div>

      <div class="modal-buttons flex-col w-full">
        ${adReviveBtn}
        <button class="btn-modal btn-primary w-full py-3" id="btn-restart" data-t="restart">${game.t("restart")}</button>
        <button class="btn-modal btn-danger w-full py-3 mt-2" id="btn-main-menu">${game.t("back")}</button>
      </div>
    `;
    modals.end.appendChild(content);

    if (!isVictory) {
      content.querySelector("#btn-revive-ad").addEventListener("click", () => {
        modals.end.classList.add("hidden");
        game.revivePlayer();
      });
    }

    content.querySelector("#btn-restart").addEventListener("click", () => {
      modals.end.classList.add("hidden");
      game.initNewGame();
      game.state.gameState = "playing";
      game.draw();
    });

    content.querySelector("#btn-main-menu").addEventListener("click", () => {
      modals.end.classList.add("hidden");
      showScreen("menu");
    });
  };

  // --- RPG Inventory Modal Logic ---
  let selectedItemId = null;

  const renderInventory = () => {
    const s = game.state;
    const p = s.player;
    hud.invGrid.innerHTML = "";

    const emojiMap = {
      key: "🔑", shears: "✂️", bucket: "🪣", bucket_full: "💧", axe: "🪓", rope: "🪵", compass: "🧭", map_piece: "📜", fuel: "🛢️", cheese: "🧀"
    };

    Object.entries(p.inventory).forEach(([itemId, count]) => {
      if (count <= 0) return;

      const slot = document.createElement("div");
      slot.className = "inv-slot";
      if (selectedItemId === itemId) slot.classList.add("active");
      if (p.equippedItem === itemId) {
        slot.style.borderColor = "var(--gold)";
        slot.style.borderWidth = "2px";
      }

      slot.innerHTML = `
        <div class="inv-slot-emoji">${emojiMap[itemId] || "📦"}</div>
        <div class="inv-slot-count">x${count}</div>
      `;

      slot.addEventListener("click", () => {
        selectedItemId = itemId;
        renderInventory();
        showItemDetails(itemId);
      });

      hud.invGrid.appendChild(slot);
    });

    if (!selectedItemId || p.inventory[selectedItemId] <= 0) {
      hud.invDetailPanel.classList.add("hidden");
      selectedItemId = null;
    } else {
      showItemDetails(selectedItemId);
    }
  };

  const showItemDetails = (itemId) => {
    const p = game.state.player;
    hud.invDetailPanel.classList.remove("hidden");
    
    const name = game.t(`items.${itemId}.name`);
    const desc = game.t(`items.${itemId}.desc`);

    hud.invItemTitle.textContent = name;
    hud.invItemDesc.textContent = desc;

    // Use Button
    const usableItems = ["fuel", "map_piece", "compass"];
    if (usableItems.includes(itemId)) {
      hud.btnInvUse.style.display = "block";
      hud.btnInvUse.textContent = game.lang === "tr" ? "Kullan" : "Use";
      
      const newUse = hud.btnInvUse.cloneNode(true);
      hud.btnInvUse.replaceWith(newUse);
      hud.btnInvUse = newUse;
      
      hud.btnInvUse.addEventListener("click", () => {
        game.useInventoryItem(itemId);
        renderInventory();
        game.onStateChange();
      });
    } else {
      hud.btnInvUse.style.display = "none";
    }

    // Equip/Unequip Button
    const isEquipped = p.equippedItem === itemId;
    hud.btnInvEquip.textContent = isEquipped 
      ? (game.lang === "tr" ? "Bırak" : "Unequip") 
      : (game.lang === "tr" ? "Kuşan" : "Equip");

    const newEquip = hud.btnInvEquip.cloneNode(true);
    hud.btnInvEquip.replaceWith(newEquip);
    hud.btnInvEquip = newEquip;

    hud.btnInvEquip.addEventListener("click", () => {
      if (isEquipped) {
        p.equippedItem = null;
      } else {
        p.equippedItem = itemId;
      }
      renderInventory();
      game.onStateChange();
      game.draw();
    });
  };

  // Open Bag Button (Mobile touchstart & click support)
  if (hud.btnOpenInventory) {
    const handleOpenBag = (e) => {
      e.preventDefault();
      if (game.state.gameState !== "playing") return;
      game.state.gameState = "modal";
      hud.modalInventory.classList.remove("hidden");
      selectedItemId = null;
      renderInventory();
    };
    hud.btnOpenInventory.addEventListener("click", handleOpenBag);
    hud.btnOpenInventory.addEventListener("touchstart", handleOpenBag, { passive: false });
  }

  // Toggle Lantern Button
  const btnToggleLantern = document.getElementById("btn-toggle-lantern");
  if (btnToggleLantern) {
    const handleToggleLantern = (e) => {
      e.preventDefault();
      game.toggleLantern();
    };
    btnToggleLantern.addEventListener("click", handleToggleLantern);
    btnToggleLantern.addEventListener("touchstart", handleToggleLantern, { passive: false });
  }

  // Mobile Interact Button
  const btnInteract = document.getElementById("btn-interact");
  if (btnInteract) {
    const handleInteract = (e) => {
      e.preventDefault();
      if (game.state && game.state.gameState === "modal") {
        // Close modal if already in a modal view
        const escapeEvent = new KeyboardEvent("keydown", { key: "Escape" });
        window.dispatchEvent(escapeEvent);
      } else {
        game.interactWithClosest();
      }
    };
    btnInteract.addEventListener("click", handleInteract);
    btnInteract.addEventListener("touchstart", handleInteract, { passive: false });
  }

  // Run / Sprint Button Binding (Toggles shift key for ergonomics)
  const btnRun = document.getElementById("btn-run");
  if (btnRun) {
    const toggleRun = (e) => {
      e.preventDefault();
      if (game.keys && game.state && game.state.player) {
        if (game.state.player.exhausted) return;
        game.keys["shift"] = !game.keys["shift"];
      }
    };

    btnRun.addEventListener("touchstart", toggleRun, { passive: false });
    btnRun.addEventListener("click", toggleRun);
  }

  // Close Bag Button
  if (hud.btnCloseInventory) {
    const handleCloseBag = (e) => {
      e.preventDefault();
      game.state.gameState = "playing";
      hud.modalInventory.classList.add("hidden");
    };
    hud.btnCloseInventory.addEventListener("click", handleCloseBag);
    hud.btnCloseInventory.addEventListener("touchstart", handleCloseBag, { passive: false });
  }

  // Open Map / Close Map helpers
  let mapAnimId = null;
  const openMap = () => {
    if (game.state.gameState !== "playing") return;
    game.state.gameState = "modal";
    document.getElementById("modal-map").classList.remove("hidden");
    
    const updateMapLoop = () => {
      drawMap();
      if (!document.getElementById("modal-map").classList.contains("hidden")) {
        mapAnimId = requestAnimationFrame(updateMapLoop);
      }
    };
    updateMapLoop();
  };

  const closeMap = () => {
    game.state.gameState = "playing";
    document.getElementById("modal-map").classList.add("hidden");
    
    // Hide instructions and cancel reveal mode
    const instructions = document.getElementById("map-instructions");
    if (instructions) instructions.style.display = "none";
    if (game.state) game.state.mapRevealMode = false;
    
    if (mapAnimId) {
      cancelAnimationFrame(mapAnimId);
      mapAnimId = null;
    }
  };

  // Open Map Button Click
  const btnOpenMap = document.getElementById("btn-open-map");
  if (btnOpenMap) {
    const handleOpen = (e) => {
      e.preventDefault();
      const mapModal = document.getElementById("modal-map");
      if (mapModal && !mapModal.classList.contains("hidden")) {
        closeMap();
      } else {
        openMap();
      }
    };
    btnOpenMap.addEventListener("click", handleOpen);
    btnOpenMap.addEventListener("touchstart", handleOpen, { passive: false });
  }

  // Close Map Button Click & Backdrop Click (Mobile friendly!)
  const btnCloseMap = document.getElementById("btn-close-map");
  if (btnCloseMap) {
    const handleClose = (e) => {
      e.preventDefault();
      closeMap();
    };
    btnCloseMap.addEventListener("click", handleClose);
    btnCloseMap.addEventListener("touchstart", handleClose, { passive: false });
  }

  const modalMap = document.getElementById("modal-map");
  if (modalMap) {
    const handleBackdrop = (e) => {
      // Close map if user taps/clicks the dark background overlay itself
      if (e.target === modalMap) {
        e.preventDefault();
        closeMap();
      }
    };
    modalMap.addEventListener("click", handleBackdrop);
    modalMap.addEventListener("touchstart", handleBackdrop, { passive: false });
  }

  // Handle map click/touch for Map Piece target selection
  const mapCanvas = document.getElementById("map-canvas");
  if (mapCanvas) {
    const handleMapClick = (e) => {
      if (!game.state || !game.state.mapRevealMode) return;
      
      e.preventDefault();
      
      const rect = mapCanvas.getBoundingClientRect();
      let clientX, clientY;
      
      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if (e.changedTouches && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      
      const x = ((clientX - rect.left) / rect.width) * mapCanvas.width;
      const y = ((clientY - rect.top) / rect.height) * mapCanvas.height;
      
      game.revealMapAt(x, y, mapCanvas.width, mapCanvas.height);
      closeMap();
    };
    
    mapCanvas.addEventListener("click", handleMapClick);
    mapCanvas.addEventListener("touchstart", handleMapClick, { passive: false });
  }

  // Hotkeys (I/E/M and Modal Closers)
  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();

    // If a modal is active, allow closing it with Escape, Backspace, or E
    if (game.state && game.state.gameState === "modal") {
      if (e.key === "Escape" || e.key === "Backspace" || k === "e") {
        e.preventDefault();

        // 1. Dialogue Modal
        const dialogModal = document.getElementById("modal-dialog");
        if (dialogModal && !dialogModal.classList.contains("hidden")) {
          const btns = dialogModal.querySelectorAll(".btn-modal");
          if (btns.length > 0) {
            // Click the last option (always Close/Cancel/Leave)
            btns[btns.length - 1].click();
            return;
          }
        }

        // 2. Chest Modal
        const chestModal = document.getElementById("modal-chest");
        if (chestModal && !chestModal.classList.contains("hidden")) {
          const leaveBtn = chestModal.querySelector("#btn-chest-leave");
          const closeBtn = chestModal.querySelector("#btn-chest-close");
          if (leaveBtn) {
            leaveBtn.click();
          } else if (closeBtn) {
            closeBtn.click();
          }
          return;
        }

        // 3. Keypad Modal
        const keypadModal = document.getElementById("modal-keypad");
        if (keypadModal && !keypadModal.classList.contains("hidden")) {
          const closeBtn = keypadModal.querySelector("#btn-keypad-close");
          if (closeBtn) closeBtn.click();
          return;
        }

        // 4. Inventory Modal
        const invModal = document.getElementById("modal-inventory");
        if (invModal && !invModal.classList.contains("hidden")) {
          const closeBtn = document.getElementById("btn-close-inventory");
          if (closeBtn) closeBtn.click();
          return;
        }

        // 5. Map Modal
        const mapModal = document.getElementById("modal-map");
        if (mapModal && !mapModal.classList.contains("hidden")) {
          const closeBtn = document.getElementById("btn-close-map");
          if (closeBtn) closeBtn.click();
          return;
        }
      }
    }

    if (k === "i" || k === "b") {
      if (game.state && game.state.gameState === "playing") {
        e.preventDefault();
        game.state.gameState = "modal";
        hud.modalInventory.classList.remove("hidden");
        selectedItemId = null;
        renderInventory();
      } else if (game.state && game.state.gameState === "modal" && !hud.modalInventory.classList.contains("hidden")) {
        e.preventDefault();
        game.state.gameState = "playing";
        hud.modalInventory.classList.add("hidden");
      }
    } else if (k === "m") {
      if (game.state && game.state.gameState === "playing") {
        e.preventDefault();
        openMap();
      } else if (game.state && game.state.gameState === "modal" && !document.getElementById("modal-map").classList.contains("hidden")) {
        e.preventDefault();
        closeMap();
      }
    }
  });

  // Render 2D Treasure Map on canvas
  const drawMap = () => {
    const s = game.state;
    if (!s) return;
    
    const canvas = document.getElementById("map-canvas");
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    
    // Clear background to antique parchment
    ctx.fillStyle = "#eedcbe";
    ctx.fillRect(0, 0, w, h);
    
    const grid = s.floors[s.currentFloor];
    const cellSize = Math.min(w / s.width, h / s.height);
    const offsetX = (w - s.width * cellSize) / 2;
    const offsetY = (h - s.height * cellSize) / 2;
    
    // Draw cells with Fog of War (unvisited cells remain hidden in dark vintage parchment)
     for (let y = 0; y < s.height; y++) {
       for (let x = 0; x < s.width; x++) {
         const cell = grid[y][x];
         const cx = offsetX + x * cellSize;
         const cy = offsetY + y * cellSize;
         
         const visited = s.visitedMap && s.visitedMap[s.currentFloor] && s.visitedMap[s.currentFloor][y][x];
         if (!visited) {
           ctx.fillStyle = "#854d0e"; // Dark vintage parchment color
           ctx.fillRect(cx, cy, cellSize, cellSize);
           ctx.strokeStyle = "rgba(0, 0, 0, 0.05)";
           ctx.lineWidth = 1;
           ctx.strokeRect(cx, cy, cellSize, cellSize);
           continue;
         }
        
        if (cell.type === "wall") {
          // Draw hedge wall (leaf green)
          ctx.fillStyle = "#166534";
          ctx.fillRect(cx, cy, cellSize, cellSize);
          ctx.strokeStyle = "#14532d";
          ctx.lineWidth = 1;
          ctx.strokeRect(cx, cy, cellSize, cellSize);
        } else {
          // Draw floor paths (clean path beige)
          ctx.fillStyle = "#f5ebd6";
          ctx.fillRect(cx, cy, cellSize, cellSize);
          ctx.strokeStyle = "rgba(133, 77, 14, 0.08)";
          ctx.lineWidth = 1;
          ctx.strokeRect(cx, cy, cellSize, cellSize);
          
          // Draw start / exit indicators
          if (cell.isEntrance) {
            ctx.fillStyle = "#16a34a";
            ctx.font = `bold ${Math.floor(cellSize * 0.7)}px Arial`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("S", cx + cellSize/2, cy + cellSize/2);
          } else if (cell.isExit) {
            // Draw a bright cyan glowing background square to highlight the Exit clearly
            ctx.fillStyle = "rgba(34, 211, 238, 0.45)"; // Cyan glow background
            ctx.fillRect(cx, cy, cellSize, cellSize);
            
            // Draw glowing cyan border
            ctx.strokeStyle = "#06b6d4";
            ctx.lineWidth = 2;
            ctx.strokeRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2);

            // Draw a larger ladder emoji
            ctx.fillStyle = "#9333ea";
            ctx.font = `bold ${Math.floor(cellSize * 0.9)}px Arial`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("🪜", cx + cellSize/2, cy + cellSize/2);
          }
          
          // Draw chests
          if (cell.chest) {
            if (cell.chest.opened) {
              // Opened chest: draw chest emoji + red X
              ctx.font = `${Math.floor(cellSize * 0.65)}px Arial`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText("📦", cx + cellSize/2, cy + cellSize/2);
              
              ctx.strokeStyle = "#ef4444";
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.moveTo(cx + 2, cy + 2);
              ctx.lineTo(cx + cellSize - 2, cy + cellSize - 2);
              ctx.moveTo(cx + cellSize - 2, cy + 2);
              ctx.lineTo(cx + 2, cy + cellSize - 2);
              ctx.stroke();
            } else {
              // Closed chest: draw chest emoji
              ctx.font = `${Math.floor(cellSize * 0.65)}px Arial`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText("📦", cx + cellSize/2, cy + cellSize/2);
            }
          }
          
          // Draw NPCs (distinct colored markers with emojis per NPC type)
          if (cell.npc && !cell.npc.disappearing) {
            // Glowing ring for visibility
            ctx.strokeStyle = "#fbbf24";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx + cellSize/2, cy + cellSize/2, cellSize * 0.38, 0, Math.PI * 2);
            ctx.stroke();
            
            // Colored background circle per NPC type
            const npcColors = { well: "#2563eb", child: "#f97316", mouse: "#78716c", traveler: "#065f46", merchant: "#7c3aed" };
            ctx.fillStyle = npcColors[cell.npc.id] || "#0284c7";
            ctx.beginPath();
            ctx.arc(cx + cellSize/2, cy + cellSize/2, cellSize * 0.32, 0, Math.PI * 2);
            ctx.fill();
            
            // Emoji per NPC type
            const npcEmojis = { well: "💧", child: "👦", mouse: "🐭", traveler: "🧓", merchant: "💰" };
            ctx.font = `${Math.floor(cellSize * 0.5)}px Arial`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(npcEmojis[cell.npc.id] || "?", cx + cellSize/2, cy + cellSize/2);
          }
        }
      }
    }
    
    // Draw player trail
    if (s.playerTrail && s.playerTrail.length > 0) {
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = Math.max(3, cellSize * 0.2);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      
      // Draw dotted path line
      ctx.setLineDash([cellSize * 0.3, cellSize * 0.3]);
      ctx.beginPath();
      s.playerTrail.forEach((pos, idx) => {
        const cx = offsetX + (pos.x + 0.5) * cellSize;
        const cy = offsetY + (pos.y + 0.5) * cellSize;
        if (idx === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      });
      ctx.stroke();
      ctx.setLineDash([]); // reset dashes
    }
    
    // Draw player current position red dot
    const px = offsetX + s.player.x * cellSize;
    const py = offsetY + s.player.y * cellSize;
    
    // Blinking pulse ring
    const pulse = cellSize * 0.4 + Math.sin(Date.now() * 0.01) * cellSize * 0.15;
    ctx.fillStyle = "rgba(239, 68, 68, 0.35)";
    ctx.beginPath();
    ctx.arc(px, py, pulse, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner red dot
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(px, py, cellSize * 0.25, 0, Math.PI * 2);
    ctx.fill();
    
    // Direction arrow pointer (High-visibility golden compass arrowhead style)
    const angle = s.player.angle;
    
    // Tip of the arrow (pointing in facing direction)
    const tipX = px + Math.cos(angle) * cellSize * 0.75;
    const tipY = py + Math.sin(angle) * cellSize * 0.75;
    
    // Left and right base wings of the arrowhead
    const leftX = px + Math.cos(angle - 2.5) * cellSize * 0.35;
    const leftY = py + Math.sin(angle - 2.5) * cellSize * 0.35;
    
    const rightX = px + Math.cos(angle + 2.5) * cellSize * 0.35;
    const rightY = py + Math.sin(angle + 2.5) * cellSize * 0.35;
    
    ctx.fillStyle = "#fbbf24"; // Bright gold arrowhead
    ctx.strokeStyle = "#991b1b"; // Crimson outline
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(leftX, leftY);
    ctx.lineTo(px, py); // crease back to player center
    ctx.lineTo(rightX, rightY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  // Prevent pinch-to-zoom and gesture zooming globally on iOS/Safari
  document.addEventListener("gesturestart", (e) => {
    e.preventDefault();
  });
  document.addEventListener("gesturechange", (e) => {
    e.preventDefault();
  });
}
