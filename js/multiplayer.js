export class MultiplayerManager {
  constructor(game) {
    this.game = game;
    this.peer = null;
    this.conn = null;
    this.isHost = false;
    this.isConnected = false;
    this.roomCode = null;
    this.enableVoice = true;
    this.localAudioStream = null;
    this.activeCall = null;
    this.isMicMuted = false;
    
    // Callbacks
    this.onStatusChange = null;
  }
  
  generateRoomCode() {
    const chars = "ABCDEFGHJKLMNOPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  updateStatus(statusText, replacements = {}) {
    if (this.onStatusChange) {
      this.onStatusChange(statusText, replacements);
    }
  }

  hostRoom(onReady) {
    this.isHost = true;
    this.roomCode = this.generateRoomCode();
    const peerId = "mof-" + this.roomCode.toLowerCase();
    
    this.updateStatus("Oda kuruluyor...");
    
    // Clean up existing connections
    this.cleanup();

    try {
      const iceConfig = {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:stun3.l.google.com:19302" },
          { urls: "stun:stun4.l.google.com:19302" },
          { urls: "stun:global.stun.twilio.com:3478" },
          { urls: "stun:stun.cloudflare.com:3478" },
          { urls: "stun:stun.services.mozilla.com" }
        ],
        sdpSemantics: 'unified-plan'
      };

      this.peer = new Peer(peerId, {
        debug: 1,
        config: iceConfig
      });

      this.peer.on("open", (id) => {
        console.log("Hosted room with ID:", id);
        this.updateStatus("Oda kuruldu. Arkadaş bekleniyor...", { code: this.roomCode });
        this.startHeartbeat();
        if (onReady) onReady(this.roomCode);
      });

      this.peer.on("connection", (connection) => {
        if (this.conn) {
          connection.close();
          return;
        }
        this.conn = connection;
        this.setupConnection();
      });

      this.peer.on("error", (err) => {
        console.error("Peer error:", err);
        if (err.type === "unavailable-id") {
          // Retry with another code if by any chance the code is taken
          this.hostRoom(onReady);
        } else {
          this.updateStatus("Bağlantı hatası: " + err.message);
        }
      });
    } catch (e) {
      console.error("Failed to construct Peer:", e);
      this.updateStatus("PeerJS hatası: Tarayıcınız desteklemiyor olabilir.");
    }
  }

  joinRoom(code, onConnect) {
    this.isHost = false;
    let sanitizedCode = code || "";
    
    // Recursively extract room code if full or nested URLs are passed
    while (sanitizedCode.includes("room=")) {
      const idx = sanitizedCode.indexOf("room=");
      sanitizedCode = sanitizedCode.substring(idx + 5).split("&")[0].split(" ")[0];
    }
    
    if (sanitizedCode.includes("/")) {
      const parts = sanitizedCode.split("/");
      sanitizedCode = parts[parts.length - 1];
    }
    
    // Clean non-alphanumeric characters
    sanitizedCode = sanitizedCode.replace(/[^A-Za-z0-9]/g, "");
    
    this.roomCode = sanitizedCode.toUpperCase().trim();
    const peerId = "mof-" + this.roomCode.toLowerCase();
    
    this.updateStatus("Odaya bağlanılıyor...");
    
    // Clean up existing connections
    this.cleanup();

    try {
      // Create peer with random ID and STUN configs
      const iceConfig = {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:stun3.l.google.com:19302" },
          { urls: "stun:stun4.l.google.com:19302" },
          { urls: "stun:global.stun.twilio.com:3478" },
          { urls: "stun:stun.cloudflare.com:3478" },
          { urls: "stun:stun.services.mozilla.com" }
        ],
        sdpSemantics: 'unified-plan'
      };

      this.peer = new Peer({
        debug: 1,
        config: iceConfig
      });

      this.peer.on("open", (id) => {
        console.log("My peer ID:", id);
        const connection = this.peer.connect(peerId, {
          reliable: true
        });
        this.conn = connection;
        this.startHeartbeat();
        this.setupConnection(onConnect);
      });

      this.peer.on("error", (err) => {
        console.error("Peer error:", err);
        this.updateStatus("Bağlanılamadı. Kodu kontrol edin.");
      });
    } catch (e) {
      console.error("Failed to construct Peer:", e);
      this.updateStatus("PeerJS hatası: Tarayıcınız desteklemiyor olabilir.");
    }
  }

  setupConnection(onConnect) {
    if (!this.conn) return;

    if (this.peer) {
      this.peer.on("call", (call) => {
        if (!this.enableVoice) return;
        this.activeCall = call;
        call.answer(this.localAudioStream || undefined);
        call.on("stream", (remoteStream) => {
          this.playRemoteAudio(remoteStream);
        });
      });
    }

    this.conn.on("open", () => {
      this.isConnected = true;
      if (this.game && this.game.unlockAchievement) {
        this.game.unlockAchievement("coop_first_lobby");
      }
      this.updateStatus("Bağlantı kuruldu! Oyun başlıyor...");
      
      if (this.enableVoice) {
        this.initVoiceChat();
      }
      this.updateMicUI();

      if (onConnect) onConnect();
      this.game.startCoopGame(this.isHost);
    });

    this.conn.on("data", (data) => {
      this.handleData(data);
    });

    this.conn.on("close", () => {
      this.handleDisconnect();
    });

    this.conn.on("error", (err) => {
      console.error("Connection error:", err);
      this.handleDisconnect();
    });
  }

  send(data) {
    if (this.conn && this.isConnected) {
      try {
        this.conn.send(JSON.stringify(data));
      } catch (e) {
        console.error("Error sending data:", e);
      }
    }
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      this.send({ type: "PING" });
    }, 5000);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  cleanup() {
    this.stopHeartbeat();
    this.isConnected = false;

    if (this.conn) {
      try { this.conn.close(); } catch(e){}
      this.conn = null;
    }
    if (this.peer) {
      try { this.peer.destroy(); } catch(e){}
      this.peer = null;
    }

    // Stop microphone audio tracks completely
    if (this.localAudioStream) {
      try {
        this.localAudioStream.getTracks().forEach(track => track.stop());
      } catch (e) {}
      this.localAudioStream = null;
    }

    // Close WebRTC active call
    if (this.activeCall) {
      try { this.activeCall.close(); } catch (e) {}
      this.activeCall = null;
    }

    // Stop remote audio element
    const audioElem = document.getElementById("coop-remote-audio");
    if (audioElem) {
      audioElem.srcObject = null;
      try { audioElem.pause(); } catch(e){}
    }

    if (this.game) {
      if (this.game.state) {
        this.game.state.otherPlayer = null;
      }
      if (this.game.renderer) {
        if (this.game.renderer.otherPlayerGroup) this.game.renderer.otherPlayerGroup.visible = false;
        if (this.game.renderer.otherPlayerLight) this.game.renderer.otherPlayerLight.intensity = 0.0;
        this.game.renderer.otherPlayerGroup = null;
        this.game.renderer.otherPlayerMesh = null;
        this.game.renderer.otherPlayerLight = null;
      }
    }

    this.updateMicUI();
  }

  handleDisconnect() {
    const wasConnected = this.isConnected;
    this.isConnected = false;
    this.conn = null;
    this.stopHeartbeat();
    
    if (wasConnected) {
      this.updateStatus("Bağlantı koptu.");
      
      if (this.isHost) {
        // If Host, display a toast but let them continue playing singleplayer!
        const msg = this.game.lang === "tr" 
          ? "Arkadaşın oyundan ayrıldı. Tek başına devam ediyorsun!" 
          : "Your friend left the game. You are continuing in single-player!";
        this.game.showToast(msg);
        
        // Remove the Guest from the visual scene and state
        if (this.game.state) {
          this.game.state.otherPlayer = null;
        }
        if (this.game.renderer && this.game.renderer.otherPlayerGroup) {
          this.game.renderer.otherPlayerGroup.visible = false;
        }
        if (this.game.renderer && this.game.renderer.otherPlayerLight) {
          this.game.renderer.otherPlayerLight.intensity = 0.0;
        }
        
        // Clean up connection references but don't reload the page
        this.cleanup();
      } else {
        // If Guest, the Host has left. Reload and return to main menu.
        alert(this.game.lang === "tr" ? "Oda sahibi oyundan ayrıldı. Ana menüye dönülüyor." : "Host left the game. Returning to main menu.");
        window.location.reload();
      }
    } else {
      this.updateStatus("Bağlantı başarısız oldu.");
    }
  }

  handleData(dataStr) {
    let data;
    try {
      data = JSON.parse(dataStr);
    } catch (e) {
      console.error("Error parsing networking data:", e);
      return;
    }

    if (data && data.type === "SYNC_GAME") {
      if (data.enableVoice !== undefined) {
        this.enableVoice = data.enableVoice;
      }
      this.game.initializeCoopGuestGame(data.seed, data.level, data.difficulty, data.variation);
      if (this.enableVoice) {
        this.initVoiceChat();
      }
      this.updateMicUI();
      return;
    }

    const state = this.game.state;
    if (!state) return;

    switch (data.type) {

      case "PLAYER_POS":
        if (!state.otherPlayer) {
          state.otherPlayer = {
            x: 1.5,
            y: 1.5,
            visualX: 1.5,
            visualY: 1.5,
            floor: 0,
            angle: Math.PI / 2,
            pitch: 0,
            lanternOn: false,
            health: 100,
            isDead: false
          };
        }
        state.otherPlayer.x = data.x;
        state.otherPlayer.y = data.y;
        state.otherPlayer.floor = data.floor;
        state.otherPlayer.angle = data.angle;
        state.otherPlayer.pitch = data.pitch;
        state.otherPlayer.lanternOn = data.lanternOn;
        state.otherPlayer.fuel = data.fuel;
        state.otherPlayer.health = data.health;
        state.otherPlayer.isDead = data.isDead;
        
        // Sync fog of war map cells visited by remote player
        this.game.syncRemotePlayerVisited(data.x, data.y, data.floor);
        this.updateSpatialVoice();
        break;

      case "CHEST_OPENED":
        const floorGrid = state.floors[data.floor];
        if (floorGrid && floorGrid[data.cellY] && floorGrid[data.cellY][data.cellX]) {
          const cell = floorGrid[data.cellY][data.cellX];
          if (cell.chest) {
            cell.chest.opened = true;
            // Close UI chest modal if local player is interacting with it
            const modalChest = document.getElementById("modal-chest");
            if (modalChest && !modalChest.classList.contains("hidden")) {
              modalChest.classList.add("hidden");
              this.game.state.gameState = "playing";
            }
            this.game.showToast(this.game.lang === "tr" ? "Arkadaşın bir sandık açtı." : "Your friend opened a chest.");
            this.game.draw();
          }
        }
        break;

      case "RECEIVE_ITEM":
        this.game.state.player.inventory[data.item] = (this.game.state.player.inventory[data.item] || 0) + data.amount;
        
        let itemTransName = data.item;
        if (data.item === "revival_scroll") {
          itemTransName = this.game.lang === "tr" ? "Diriltme Ayini Parşömeni" : "Revival Ritual Scroll";
        } else {
          itemTransName = this.game.t(`items.${data.item}.name`);
        }

        this.game.showToast(
          this.game.lang === "tr" 
            ? `Arkadaşın sana ${itemTransName} gönderdi!` 
            : `Your friend sent you a ${itemTransName}!`
        );
        this.game.updateInventoryUI();
        break;

      case "COOP_ROPE_DESCEND_ALERT":
        this.game.showCoopRopeDescendToast();
        break;

      case "JUMPSCARE":
        this.game.showJumpscareForSpectator();
        break;

      case "REVIVE_PLAYER":
        this.game.revivePlayerFromCoop(data.spawnX, data.spawnY);
        break;

      case "MONSTER_SYNC":
        // Sync monster position & targets from Host
        if (state.shadowMonsters && state.shadowMonsters[data.index]) {
          const monster = state.shadowMonsters[data.index];
          monster.active = data.active;
          monster.x = data.x;
          monster.y = data.y;
          monster.floor = data.floor;
          monster.targetPlayer = data.targetPlayer;
          monster.spawnTimer = data.spawnTimer;
          monster.speed = data.speed;
          monster.burnTime = data.burnTime || 0;
        }
        break;

      case "GUEST_MONSTER_BURN":
        // Host receives flashlight burn hit from Guest player
        if (this.isHost && state.shadowMonsters && state.shadowMonsters[data.index]) {
          const monster = state.shadowMonsters[data.index];
          if (monster && monster.active) {
            monster.burnTime += (data.dt || 0.05) * 1.2;
          }
        }
        break;
      
      case "MONSTER_SPAWN_ALERT":
        // Display target alert if target is local player
        this.game.triggerMonsterSpawnAlert(data.targetPlayer, data.monsterIndex);
        break;

      case "OBSTACLE_RESOLVED":
        const obsFloorGrid = state.floors[data.floor];
        if (obsFloorGrid && obsFloorGrid[data.cellY] && obsFloorGrid[data.cellY][data.cellX]) {
          const obsCell = obsFloorGrid[data.cellY][data.cellX];
          if (obsCell.obstacle) {
            obsCell.obstacle.resolved = true;
            this.game.showToast(
              this.game.lang === "tr"
                ? "Arkadaşın bir engeli kaldırdı."
                : "Your friend cleared an obstacle."
            );
            this.game.draw();
          }
        }
        break;

      case "ROPE_DEPLOYED":
        const rFloorGrid = state.floors[data.floor];
        if (rFloorGrid && rFloorGrid[data.cellY] && rFloorGrid[data.cellY][data.cellX]) {
          rFloorGrid[data.cellY][data.cellX].staircaseDeployed = true;
        }
        if (data.nextFloor !== undefined) {
          const rNextFloorGrid = state.floors[data.nextFloor];
          if (rNextFloorGrid && rNextFloorGrid[data.cellY] && rNextFloorGrid[data.cellY][data.cellX]) {
            rNextFloorGrid[data.cellY][data.cellX].staircaseDeployed = true;
          }
        }
        if (this.game && this.game.showToast) {
          this.game.showToast(this.game.lang === "tr" ? "Arkadaşın bir halat sarkıttı!" : "Your friend deployed a rope!");
        }
        if (this.game && this.game.draw) this.game.draw();
        break;

      case "AUDIO_EVENT":
        if (this.game && this.game.audio) {
          if (this.game.audio.ctx && this.game.audio.ctx.state === "suspended") {
            this.game.audio.ctx.resume().catch(() => {});
          }
          if (data.sound === "shadow_spawn") {
            this.game.audio.playShadowSpawn();
          } else if (data.sound === "shadow_groan") {
            this.game.audio.playShadowGroan(data.dist || 5.0);
          } else if (data.sound === "shadow_burn") {
            this.game.audio.playShadowBurn();
          } else if (data.sound === "stop_shadow_burn") {
            this.game.audio.stopShadowBurn();
          } else if (data.sound === "jumpscare") {
            this.game.audio.playJumpscare();
          }
        }
        break;

      case "COOP_CHAT":
        this.game.showToast(`${this.game.lang === "tr" ? "Arkadaşın" : "Friend"}: ${data.text}`);
        break;

      case "SHOW_DIALOG":
        // Parchment / Clue dialogs are ONLY shown on partner screen if partner is dead & spectating!
        if (state.player && state.player.isDead) {
          this.game.showCoopDialog(data.title, data.text, data.isClue);
        }
        break;

      case "CLOSE_DIALOG":
        if (state.player && state.player.isDead) {
          this.game.closeCoopDialog();
        }
        break;

      case "GAME_OVER":
        this.game.triggerGameOver(true);
        break;

      case "VICTORY":
        this.game.triggerLevelVictory(true);
        break;
    }
  }

  async initVoiceChat() {
    if (!this.enableVoice) return;
    try {
      if (!this.localAudioStream) {
        this.localAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      }
      this.isMicMuted = false;
      this.updateMicUI();

      if (this.conn && this.conn.peer && this.peer) {
        const call = this.peer.call(this.conn.peer, this.localAudioStream);
        this.activeCall = call;
        call.on("stream", (remoteStream) => {
          this.playRemoteAudio(remoteStream);
        });
      }
    } catch (err) {
      console.warn("Voice chat mic permission denied or unavailable:", err);
      if (this.game && this.game.showToast) {
        this.game.showToast(this.game.lang === "tr" ? "Mikrofon izni alınamadı." : "Microphone permission denied.");
      }
    }
  }

  playRemoteAudio(stream) {
    const audioElem = document.getElementById("coop-remote-audio");
    if (!audioElem) return;
    audioElem.srcObject = stream;
    audioElem.play().catch(e => console.warn("Remote audio autoplay blocked:", e));

    if (!this.voiceAudioCtx && this.game.audio && this.game.audio.ctx) {
      try {
        const audioCtx = this.game.audio.ctx;
        this.voiceSourceNode = audioCtx.createMediaElementSource(audioElem);
        
        this.voiceFilterNode = audioCtx.createBiquadFilter();
        this.voiceFilterNode.type = "lowpass";
        this.voiceFilterNode.frequency.value = 12000;

        this.voiceGainNode = audioCtx.createGain();
        this.voiceGainNode.gain.value = 1.0;

        this.voiceSourceNode.connect(this.voiceFilterNode);
        this.voiceFilterNode.connect(this.voiceGainNode);
        this.voiceGainNode.connect(audioCtx.destination);
        this.voiceAudioCtx = audioCtx;
      } catch (e) {
        console.warn("Spatial voice Web Audio setup fallback:", e);
      }
    }
  }

  updateSpatialVoice() {
    if (!this.voiceGainNode || !this.voiceFilterNode || !this.game.state) return;
    const s = this.game.state;
    const p1 = s.player;
    const p2 = s.otherPlayer;
    if (!p1 || !p2) return;

    const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
    const sameFloor = (Number(p1.floor) === Number(p2.floor));

    let targetVolume = 1.0;
    let targetCutoff = 12000;

    if (!sameFloor) {
      targetVolume = 0.35; // Minimum 35% volume (never cut off completely!)
      targetCutoff = 450;  // Deep muffled echo through floor shaft
    } else {
      if (dist <= 5.0) {
        targetVolume = 1.0;
        targetCutoff = 12000;
      } else {
        const factor = Math.min(1.0, (dist - 5.0) / 25.0);
        targetVolume = 1.0 - factor * 0.65;    // Drops from 1.0 to 0.35 minimum
        targetCutoff = 12000 - factor * 11400; // Drops from 12000 Hz to 600 Hz (muffled through stone corridors)
      }
    }

    const now = this.voiceAudioCtx ? this.voiceAudioCtx.currentTime : 0;
    if (now) {
      this.voiceGainNode.gain.setTargetAtTime(targetVolume, now, 0.1);
      this.voiceFilterNode.frequency.setTargetAtTime(targetCutoff, now, 0.1);
    }
  }

  toggleMicMute() {
    if (!this.enableVoice) return;
    if (!this.localAudioStream) {
      this.initVoiceChat();
      return;
    }
    this.isMicMuted = !this.isMicMuted;
    this.localAudioStream.getAudioTracks().forEach(track => {
      track.enabled = !this.isMicMuted;
    });
    this.updateMicUI();
    if (this.game && this.game.showToast) {
      const msg = this.isMicMuted 
        ? (this.game.lang === "tr" ? "🔕 Mikrofonunuz Kapatıldı" : "🔕 Microphone Muted")
        : (this.game.lang === "tr" ? "🎤 Mikrofonunuz Açıldı" : "🎤 Microphone Active");
      this.game.showToast(msg);
    }
  }

  updateMicUI() {
    const btn = document.getElementById("btn-mic-toggle");
    if (!btn) return;
    if (!this.enableVoice || !this.isConnected) {
      btn.classList.add("hidden");
      return;
    }
    btn.classList.remove("hidden");
    if (this.isMicMuted) {
      btn.innerHTML = "🔇";
      btn.style.borderColor = "var(--red)";
      btn.style.background = "rgba(239, 68, 68, 0.35)";
    } else {
      btn.innerHTML = "🎤";
      btn.style.borderColor = "var(--emerald)";
      btn.style.background = "rgba(16, 185, 129, 0.35)";
    }
  }
}
