export class MultiplayerManager {
  constructor(game) {
    this.game = game;
    this.peer = null;
    this.conn = null;
    this.isHost = false;
    this.isConnected = false;
    this.roomCode = null;
    
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

    this.conn.on("open", () => {
      this.isConnected = true;
      this.updateStatus("Bağlantı kuruldu! Oyun başlıyor...");
      
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
        console.error("Failed to send data:", e);
      }
    }
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.peer && !this.peer.destroyed) {
        if (this.peer.socket && typeof this.peer.socket.send === "function") {
          try {
            this.peer.socket.send({ type: "PING" });
          } catch (e) {
            console.warn("Failed to send signaling heartbeat:", e);
          }
        }
      }
    }, 15000);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  cleanup() {
    this.isConnected = false;
    this.stopHeartbeat();
    if (this.conn) {
      try { this.conn.close(); } catch(e){}
      this.conn = null;
    }
    if (this.peer) {
      try { this.peer.destroy(); } catch(e){}
      this.peer = null;
    }
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
      this.game.initializeCoopGuestGame(data.seed, data.level, data.difficulty, data.variation);
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

      case "COOP_CHAT":
        this.game.showToast(`${this.game.lang === "tr" ? "Arkadaşın" : "Friend"}: ${data.text}`);
        break;

      case "SHOW_DIALOG":
        this.game.showCoopDialog(data.title, data.text, data.isClue);
        break;

      case "CLOSE_DIALOG":
        this.game.closeCoopDialog();
        break;

      case "GAME_OVER":
        this.game.triggerGameOver(true);
        break;

      case "VICTORY":
        this.game.triggerLevelVictory(true);
        break;
    }
  }
}
