export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.windNode = null;
    this.noiseBuffer = null;
    this.muted = (localStorage.getItem("maze_muted") === "true");
    this.volume = Math.max(0.1, parseFloat(localStorage.getItem("maze_volume") || "1.0"));
    this.soundBuffers = {}; // Cache for loaded audio file buffers
    this._loadingPromises = {}; // Prevent duplicate loading
    this.rapidHeartbeatInterval = null;
    this.activePantingNode = null;
    this.activeScreamNode = null;
    this.ambientTimeout = null;
    this.lastScreamTime = 0;
    this.lastStingerTime = 0;
    this.lastGroanTime = 0;
  }

  init() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        const startingGain = this.muted ? (0.1 * 0.55) : (this.volume * 0.55);
        this.masterGain.gain.setValueAtTime(startingGain, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
        this.createNoiseBuffer();
        this.startWind();
      } catch (e) {
        console.warn("Web Audio API not supported", e);
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    this._preloadSounds(); // Always trigger preloading of SFX assets
  }

  // Preload all audio assets in the background
  _preloadSounds() {
    const files = [
      "jumpscare_scream", "monster_growl", "monster_breath", "ghost_moan",
      "monster_roar", "monster_hiss", "monster_grunt", "deep_moan", "monster_bite",
      "footstep_walk", "footstep_run", "flashlight_on", "flashlight_off",
      "breathing_fast", "gasp", "key_pickup", "coin_drop",
      "creepy_ambience", "drone_doom", "distant_scream", "metal_screech",
      "piano_stinger", "stinger", "suspense_rise", "slow_stinger",
      "door_squeak", "door_locked", "door_knock"
    ];
    files.forEach(name => this._loadSound(name));
  }

  // Load a single sound file into buffer cache
  _loadSound(name) {
    if (this.soundBuffers[name] || this._loadingPromises[name]) return;
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        const startingGain = this.muted ? (0.1 * 0.3) : (this.volume * 0.3);
        this.masterGain.gain.setValueAtTime(startingGain, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      } catch (e) {
        return;
      }
    }
    const url = `assets/audio/${name}.wav`;
    this._loadingPromises[name] = fetch(url)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.arrayBuffer();
      })
      .then(buf => this.ctx.decodeAudioData(buf))
      .then(decoded => { this.soundBuffers[name] = decoded; })
      .catch((err) => {
        console.warn(`Could not load audio asset ${name}:`, err);
      });
  }

  // Play a cached audio buffer with optional volume, playbackRate, and offset
  _playBuffer(name, volume = 1.0, playbackRate = 1.0, loop = false) {
    this.init();
    if (this.muted || !this.ctx) return null;
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    const buffer = this.soundBuffers[name];
    if (!buffer) {
      this._loadSound(name);
      return null;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = playbackRate;
    source.loop = loop;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);

    source.connect(gain);
    gain.connect(this.masterGain);
    source.start(this.ctx.currentTime);
    return { source, gain };
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem("maze_muted", this.muted.toString());
    if (this.masterGain && this.ctx) {
      // If muted, clamp to 10% volume (0.1 * 0.3) instead of 0!
      const targetGain = this.muted ? (0.1 * 0.3) : (this.volume * 0.3);
      this.masterGain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
    }
    return this.muted;
  }

  setVolume(vol) {
    this.volume = Math.max(0.1, vol); // Minimum volume is 10%
    localStorage.setItem("maze_volume", this.volume.toString());
    if (this.masterGain && this.ctx) {
      const targetGain = this.muted ? (0.1 * 0.3) : (this.volume * 0.3);
      this.masterGain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
    }
  }

  createNoiseBuffer() {
    const size = 2 * this.ctx.sampleRate;
    this.noiseBuffer = this.ctx.createBuffer(1, size, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < size; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }

  // Play background wind rumble + low atmospheric synthesizer drone with creepy tension melodies
  startWind() {
    if (this.muted || !this.ctx || this.windNode) return;

    // 1. Noise Wind Generator
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 150;
    filter.Q.value = 2.0;

    const lfo = this.ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.15; // Slow breeze

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 60; // mod depth for wind filter

    const windGain = this.ctx.createGain();
    windGain.gain.value = 0.065; // increased by 30% (from 0.05)

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    noise.connect(filter);
    filter.connect(windGain);
    windGain.connect(this.masterGain);

    lfo.start();
    noise.start();

    // 2. Low Atmospheric Synthesizer Drone (Creepy drifting ambient pad)
    const droneOsc1 = this.ctx.createOscillator();
    droneOsc1.type = "sawtooth";
    droneOsc1.frequency.value = 55; // A1
    
    const droneOsc2 = this.ctx.createOscillator();
    droneOsc2.type = "triangle";
    droneOsc2.frequency.value = 82.4; // E2 (Perfect fifth)

    // Detuning LFO modulator for eerie, unstable beating frequencies
    const droneLfoGain = this.ctx.createGain();
    droneLfoGain.gain.value = 1.2; // subtle pitch drift of ±1.2 Hz
    lfo.connect(droneLfoGain);
    droneLfoGain.connect(droneOsc1.frequency);
    droneLfoGain.connect(droneOsc2.frequency);

    const droneFilter = this.ctx.createBiquadFilter();
    droneFilter.type = "lowpass";
    droneFilter.frequency.value = 90; // deep lowpass muffles the buzz

    const droneGain = this.ctx.createGain();
    droneGain.gain.value = 0.091; // increased by 30% (from 0.07)

    droneOsc1.connect(droneFilter);
    droneOsc2.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(this.masterGain);

    droneOsc1.start();
    droneOsc2.start();

    // 3. Ghostly Horror/Mystery Melody Pluck Scheduler (Every 5 seconds with echo delay line)
    const creepyInterval = setInterval(() => {
      if (this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;

      // Tension intervals: Tritone (Eb/A), minor second clash (Bb/A), hollow open fifth, and minor ninth dissonance
      const chords = [
        [220.0, 311.1], // A3 + Eb4 (Tritone - horror theme)
        [220.0, 233.1], // A3 + Bb3 (Clashing minor second - intense tension)
        [146.8, 207.7], // D3 + Ab3 (Tritone)
        [164.8, 246.9, 329.6], // E3 + B3 + E4 (Hollow cold open fifth)
        [174.6, 261.6, 349.2], // F3 + C4 + F4
        [220.0, 440.0, 466.2]  // A3 + A4 + Bb4 (Ghostly minor ninth)
      ];
      const selectedChord = chords[Math.floor(Math.random() * chords.length)];

      selectedChord.forEach((freq) => {
        const playPluck = (delay, volScale) => {
          const osc = this.ctx.createOscillator();
          const oscGain = this.ctx.createGain();

          osc.type = "sine"; // pure soft spectral sine wave
          osc.frequency.setValueAtTime(freq, now + delay);

          // Slow ghostly pitch bend/glide
          const bendAmount = (Math.random() - 0.5) * 3.5;
          osc.frequency.exponentialRampToValueAtTime(freq + bendAmount, now + delay + 5.0);

          // Very slow spectral fade-in and long mysterious decay
          oscGain.gain.setValueAtTime(0, now + delay);
          oscGain.gain.linearRampToValueAtTime(0.020 * volScale, now + delay + 1.8);
          oscGain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 5.8);

          osc.connect(oscGain);
          oscGain.connect(this.masterGain);

          osc.start(now + delay);
          osc.stop(now + delay + 6.0);
        };

        // Play main pluck, echo 1 (0.4s delay), and echo 2 (0.8s delay)
        playPluck(0, 1.0);
        playPluck(0.4, 0.45);
        playPluck(0.8, 0.18);
      });
    }, 5000);

    // 4. Random Environmental Horror Sound Effects (Sound Director System)
    // Runs checks every 8 to 15 seconds, applying individual cooldowns to heavy sounds
    // and falling back to lighter sounds (whispers/rustles) to allow natural density without scream overlaps
    const scheduleNextAmbient = () => {
      if (this.ambientTimeout) {
        clearTimeout(this.ambientTimeout);
      }
      
      const randomDelay = 8000 + Math.random() * 7000; // Check every 8 to 15 seconds
      this.ambientTimeout = setTimeout(() => {
        if (this.inMenu || this.muted || !this.ctx) {
          if (!this.inMenu) scheduleNextAmbient();
          return;
        }
        
        // 35% chance of absolute silence during this check (creates silent pacing gaps)
        if (Math.random() < 0.35) {
          scheduleNextAmbient();
          return;
        }
        
        const now = Date.now();
        const r = Math.random();
        
        if (r < 0.20) {
          // Scream (Crow) - 45s Cooldown. Fallback to whisper if on cooldown
          if (now - this.lastScreamTime > 45000) {
            this.lastScreamTime = now;
            this.playCrow();
          } else {
            this.playWhisper();
          }
        } else if (r < 0.40) {
          // Owl (Slow stinger) - 30s Cooldown. Fallback to rustle if on cooldown
          if (now - this.lastStingerTime > 30000) {
            this.lastStingerTime = now;
            this.playOwl();
          } else {
            this.playRustle();
          }
        } else if (r < 0.60) {
          // Rustle - No cooldown, play freely
          this.playRustle();
        } else if (r < 0.80) {
          // Chasm Groan - 25s Cooldown. Fallback to whisper if on cooldown
          if (now - this.lastGroanTime > 25000) {
            this.lastGroanTime = now;
            this.playChasmGroan();
          } else {
            this.playWhisper();
          }
        } else {
          // Whisper - No cooldown, play freely
          this.playWhisper();
        }
        
        scheduleNextAmbient();
      }, randomDelay);
    };
    scheduleNextAmbient();
    const environmentalSoundInterval = null; // dummy placeholder for windNode destructuring compatibility

    // 5. Periodic Heartbeat Dread loop (Very subtle low double thuds for tension)
    const heartbeatInterval = setInterval(() => {
      if (this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;
      
      // Double thump timing: first thump at 0.0s, second thump at 0.28s
      const thumps = [0.0, 0.28];
      thumps.forEach((delay) => {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(45, now + delay); // deeper sub-bass
        osc.frequency.exponentialRampToValueAtTime(25, now + delay + 0.10);
        
        filter.type = "lowpass";
        filter.frequency.value = 55; // even more muffled
        
        gain.gain.setValueAtTime(0, now + delay);
        gain.gain.linearRampToValueAtTime(0.08, now + delay + 0.02); // much softer attack
        gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.10);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(now + delay);
        osc.stop(now + delay + 0.12);
      });
    }, 3500); // Beats every 3.5 seconds (much slower, subtle tension)

    this.windNode = { lfo, noise, windGain, droneOsc1, droneOsc2, droneGain, creepyInterval, environmentalSoundInterval, heartbeatInterval };
  }

  stopWind() {
    if (this.ambientTimeout) {
      clearTimeout(this.ambientTimeout);
      this.ambientTimeout = null;
    }
    this.activeScreamNode = null;
    this.activePantingNode = null;
    
    if (this.windNode) {
      try {
        this.windNode.lfo.stop();
        this.windNode.noise.stop();
        if (this.windNode.droneOsc1) this.windNode.droneOsc1.stop();
        if (this.windNode.droneOsc2) this.windNode.droneOsc2.stop();
        if (this.windNode.creepyInterval) clearInterval(this.windNode.creepyInterval);
        if (this.windNode.environmentalSoundInterval) clearInterval(this.windNode.environmentalSoundInterval);
        if (this.windNode.heartbeatInterval) clearInterval(this.windNode.heartbeatInterval);
      } catch(e){}
      this.windNode = null;
    }
  }

  playClick() {
    if (this.muted) return;
    if (this._playBuffer("ui_button_click", 0.35)) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {}
  }

  // Footstep sounds (Walk vs Run variations) - uses real audio assets
  playStep(isRunning = false) {
    this.init();
    if (this.muted || !this.ctx) return;

    this.stopStep();

    const sfxName = isRunning ? "footstep_run" : "footstep_walk";
    const vol = isRunning ? 0.30 : 0.18;
    const rate = 0.9 + Math.random() * 0.2; // slight pitch variation
    const res = this._playBuffer(sfxName, vol, rate);
    if (res) {
      this.activeStepSource = res.source;
      this.activeStepGain = res.gain;
      return;
    }

    // Synthesized fallback
    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";

    const gainVal = isRunning ? 0.35 : 0.2;
    const startFreq = isRunning ? 260 : 200;
    const endFreq = isRunning ? 100 : 80;
    const duration = isRunning ? 0.11 : 0.15;

    filter.frequency.setValueAtTime(startFreq, now);
    filter.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
    noise.stop(now + duration + 0.01);

    this.activeStepSource = noise;
    this.activeStepGain = gain;
  }

  stopStep() {
    if (this.activeStepSource && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        if (this.activeStepGain) {
          this.activeStepGain.gain.setValueAtTime(this.activeStepGain.gain.value, now);
          this.activeStepGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
        }
        const src = this.activeStepSource;
        setTimeout(() => {
          try { src.stop(); } catch(e){}
        }, 50);
      } catch (e) {}
      this.activeStepSource = null;
      this.activeStepGain = null;
    }
  }

  // Fast, intense heartbeat that fades and slows down over a given duration (default 6 seconds)
  playHeartbeatRapid(durationMs = 6000) {
    this.init();
    if (this.muted || !this.ctx) return;
    
    // Clear any existing rapid heartbeat interval to avoid overlap
    if (this.rapidHeartbeatInterval) {
      clearInterval(this.rapidHeartbeatInterval);
      this.rapidHeartbeatInterval = null;
    }
    
    const startTime = Date.now();
    this.rapidHeartbeatInterval = setInterval(() => {
      if (this.muted || !this.ctx) return;
      
      const elapsed = Date.now() - startTime;
      if (elapsed >= durationMs) {
        clearInterval(this.rapidHeartbeatInterval);
        this.rapidHeartbeatInterval = null;
        return;
      }
      
      // Calculate decay factor over time (so the heart rate volume fades out)
      const factor = 1.0 - (elapsed / durationMs);
      const now = this.ctx.currentTime;
      
      // Closer double thumps (at 0.0s and 0.18s) to represent high heart rate
      const thumps = [0.0, 0.18];
      thumps.forEach((delay) => {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(60, now + delay); // slightly higher pitch under adrenaline
        osc.frequency.exponentialRampToValueAtTime(32, now + delay + 0.10);
        
        filter.type = "lowpass";
        filter.frequency.value = 85; // muffled deep thuds
        
        gain.gain.setValueAtTime(0, now + delay);
        gain.gain.linearRampToValueAtTime(0.38 * factor, now + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.10);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(now + delay);
        osc.stop(now + delay + 0.12);
      });
    }, 480); // 125 BPM rapid heartbeat interval
  }

  // Heavy panting / breathing - uses real audio asset
  playPanting() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    // Stop any currently playing panting sound to prevent overlap
    if (this.activePantingNode) {
      try {
        this.activePantingNode.source.stop();
      } catch (e) {}
      this.activePantingNode = null;
    }

    // Try real breathing audio first
    const pantNode = this._playBuffer("breathing_fast", 0.5, 0.95 + Math.random() * 0.1);
    if (pantNode) {
      this.activePantingNode = pantNode;
      // Clear reference when the sound finishes playing
      pantNode.source.onended = () => {
        if (this.activePantingNode === pantNode) {
          this.activePantingNode = null;
        }
      };
      return;
    }

    // Synthesized fallback
    const now = this.ctx.currentTime;
    const inhaleNoise = this.ctx.createBufferSource();
    inhaleNoise.buffer = this.noiseBuffer;
    const inhaleFilter = this.ctx.createBiquadFilter();
    inhaleFilter.type = "lowpass";
    inhaleFilter.frequency.setValueAtTime(320, now);
    inhaleFilter.frequency.linearRampToValueAtTime(480, now + 0.25);
    inhaleFilter.Q.setValueAtTime(1.8, now);
    const inhaleMuffle = this.ctx.createBiquadFilter();
    inhaleMuffle.type = "lowpass";
    inhaleMuffle.frequency.setValueAtTime(320, now);
    inhaleMuffle.frequency.linearRampToValueAtTime(480, now + 0.25);
    const inhaleGain = this.ctx.createGain();
    inhaleGain.gain.setValueAtTime(0, now);
    inhaleGain.gain.linearRampToValueAtTime(0.32, now + 0.15);
    inhaleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    inhaleNoise.connect(inhaleFilter);
    inhaleFilter.connect(inhaleMuffle);
    inhaleMuffle.connect(inhaleGain);
    inhaleGain.connect(this.masterGain);
    inhaleNoise.start(now);
    inhaleNoise.stop(now + 0.3);

    const exhaleTime = now + 0.3;
    const exhaleNoise = this.ctx.createBufferSource();
    exhaleNoise.buffer = this.noiseBuffer;
    const exhaleFilter = this.ctx.createBiquadFilter();
    exhaleFilter.type = "lowpass";
    exhaleFilter.frequency.setValueAtTime(420, exhaleTime);
    exhaleFilter.frequency.linearRampToValueAtTime(280, exhaleTime + 0.35);
    exhaleFilter.Q.setValueAtTime(1.5, exhaleTime);
    const exhaleMuffle = this.ctx.createBiquadFilter();
    exhaleMuffle.type = "lowpass";
    exhaleMuffle.frequency.setValueAtTime(420, exhaleTime);
    exhaleMuffle.frequency.linearRampToValueAtTime(280, exhaleTime + 0.35);
    const exhaleGain = this.ctx.createGain();
    exhaleGain.gain.setValueAtTime(0, exhaleTime);
    exhaleGain.gain.linearRampToValueAtTime(0.42, exhaleTime + 0.12);
    exhaleGain.gain.exponentialRampToValueAtTime(0.0001, exhaleTime + 0.4);
    exhaleNoise.connect(exhaleFilter);
    exhaleFilter.connect(exhaleMuffle);
    exhaleMuffle.connect(exhaleGain);
    exhaleGain.connect(this.masterGain);
    exhaleNoise.start(exhaleTime);
    exhaleNoise.stop(exhaleTime + 0.45);
  }

  playPickup() {
    if (this.muted || !this.ctx) return;

    // Try real key/coin pickup sound
    if (this._playBuffer("key_pickup", 0.45)) return;
    if (this._playBuffer("coin_drop", 0.40)) return;

    // Synthesized fallback
    const now = this.ctx.currentTime;
    const notes = [440, 554, 659];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const noteTime = now + idx * 0.08;
      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0.15, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.25);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(noteTime);
      osc.stop(noteTime + 0.3);
    });
  }

  playUnlock() {
    if (this.muted || !this.ctx) return;

    // Try real door unlock sound
    if (this._playBuffer("door_locked", 0.35)) return;

    // Synthesized fallback
    const now = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const clickTime = now + i * 0.07;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1000 - i * 300, clickTime);
      gain.gain.setValueAtTime(0.12, clickTime);
      gain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.05);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(clickTime);
      osc.stop(clickTime + 0.06);
    }
  }

  playSlash() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Snip-snip double metal shear cut (high-pass filtered noise bursts + quick high plucks)
    const snips = [0.0, 0.14];
    snips.forEach((delay) => {
      const startTime = now + delay;
      const duration = 0.08;
      
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.setValueAtTime(2000, startTime);
      filter.frequency.exponentialRampToValueAtTime(800, startTime + duration);
      
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.24, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      
      // Metallic blade ring
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1200, startTime);
      osc.frequency.exponentialRampToValueAtTime(600, startTime + duration);
      
      oscGain.gain.setValueAtTime(0, startTime);
      oscGain.gain.linearRampToValueAtTime(0.06, startTime + 0.01);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      
      osc.connect(oscGain);
      oscGain.connect(this.masterGain);
      
      noise.start(startTime);
      osc.start(startTime);
      noise.stop(startTime + duration + 0.01);
      osc.stop(startTime + duration + 0.01);
    });
  }

  // Synthesize unlocking of heavy iron chain gate (rattling chain impact clicks + squealing rusty hinge open)
  playChainGate() {
    if (this.muted || !this.ctx) return;

    // Try real door squeak for chain gate
    if (this._playBuffer("door_squeak", 0.45)) {
      // Also play metal screech for dramatic effect
      setTimeout(() => this._playBuffer("metal_screech", 0.25), 200);
      return;
    }

    // Synthesized fallback
    const now = this.ctx.currentTime;
    for (let i = 0; i < 5; i++) {
      const clickTime = now + i * 0.08 + Math.random() * 0.03;
      const duration = 0.08 + Math.random() * 0.06;
      const osc = this.ctx.createOscillator();
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(450 + Math.random() * 400, clickTime);
      filter.Q.value = 4.0;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12, clickTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, clickTime + duration);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180 + Math.random() * 50, clickTime);
      const oscGain = this.ctx.createGain();
      oscGain.gain.setValueAtTime(0.04, clickTime);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, clickTime + duration);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.connect(oscGain);
      oscGain.connect(this.masterGain);
      noise.start(clickTime);
      osc.start(clickTime);
      noise.stop(clickTime + duration + 0.01);
      osc.stop(clickTime + duration + 0.01);
    }
    const squealTime = now + 0.35;
    const squealDur = 1.2;
    const squealOsc = this.ctx.createOscillator();
    const squealFilter = this.ctx.createBiquadFilter();
    const squealGain = this.ctx.createGain();
    squealOsc.type = "sawtooth";
    squealOsc.frequency.setValueAtTime(290, squealTime);
    squealOsc.frequency.linearRampToValueAtTime(220, squealTime + squealDur);
    squealFilter.type = "bandpass";
    squealFilter.frequency.setValueAtTime(800, squealTime);
    squealFilter.Q.value = 3.0;
    squealGain.gain.setValueAtTime(0, squealTime);
    squealGain.gain.linearRampToValueAtTime(0.06, squealTime + 0.2);
    squealGain.gain.exponentialRampToValueAtTime(0.0001, squealTime + squealDur);
    squealOsc.connect(squealFilter);
    squealFilter.connect(squealGain);
    squealGain.connect(this.masterGain);
    squealOsc.start(squealTime);
    squealOsc.stop(squealTime + squealDur + 0.05);
  }

  // Synthesize ghostly spirit ascension fade sound (rising pitch sine wave + sweeping resonant bandpass whoosh)
  playGhostFade() {
    if (this.muted || !this.ctx) return;

    // Try real ghost moan sound
    if (this._playBuffer("ghost_moan", 0.40)) return;

    // Synthesized fallback
    const now = this.ctx.currentTime;
    const duration = 2.2;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + duration);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(1600, now + duration);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.09, now + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(250, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(900, now + duration);
    noiseFilter.Q.value = 2.0;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.06, now + 0.6);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    osc.start(now);
    noise.start(now);
    osc.stop(now + duration + 0.05);
    noise.stop(now + duration + 0.05);
  }

  playHazard() {
    if (this.muted || !this.ctx) return;

    // Try real monster bite or metal screech first
    if (this._playBuffer("monster_bite", 0.60)) return;
    if (this._playBuffer("metal_screech", 0.35)) return;

    // Synthesized fallback
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.linearRampToValueAtTime(55, now + 0.4);
    
    osc2.type = "sawtooth";
    osc2.frequency.setValueAtTime(112, now); // Detuned for fat buzz
    osc2.frequency.linearRampToValueAtTime(56, now + 0.4);
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    
    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.45);
    osc2.stop(now + 0.45);
  }

  // Plays a cheesy, high-energy retro mock commercial jingle
  playAdMusic() {
    if (this.muted || !this.ctx) return null;
    this.stopWind(); // Silence the eerie wind
    
    const now = this.ctx.currentTime;
    const melody = [261.63, 329.63, 392.00, 523.25, 392.00, 523.25]; // C4, E4, G4, C5, G4, C5
    const duration = 0.15;
    const interval = 0.2;
    const oscillators = [];

    melody.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + idx * interval);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0.1, now + idx * interval);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * interval + duration);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * interval);
      osc.stop(now + idx * interval + duration + 0.05);
      oscillators.push(osc);
    });

    return {
      stop: () => {
        oscillators.forEach(o => {
          try { o.stop(); } catch(e){}
        });
        this.startWind();
      }
    };
  }

  // Synthesize guttural harsh crow caw (sawtooth carrier modulated by slow sawtooth LFO + bandpass filter)
  playCrow() {
    if (this.muted || !this.ctx) return;

    // Prevent overlapping distant screams/stingers
    if (this.activeScreamNode) return;

    // Try real distant scream or stinger first
    const screamNode = this._playBuffer("distant_scream", 0.35);
    if (screamNode) {
      this.activeScreamNode = screamNode;
      // Clear reference when the scream finishes
      screamNode.source.onended = () => {
        if (this.activeScreamNode === screamNode) {
          this.activeScreamNode = null;
        }
      };
      return;
    }

    // Synthesized fallback
    const now = this.ctx.currentTime;
    for (let c = 0; c < 2; c++) {
      const startTime = now + c * 0.45;
      const carrier = this.ctx.createOscillator();
      const modulator = this.ctx.createOscillator();
      const modGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      carrier.type = "sawtooth";
      carrier.frequency.setValueAtTime(280, startTime);
      carrier.frequency.linearRampToValueAtTime(220, startTime + 0.3);
      modulator.type = "sawtooth";
      modulator.frequency.setValueAtTime(38, startTime);
      modGain.gain.setValueAtTime(150, startTime);
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(800, startTime);
      filter.Q.value = 1.5;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.055, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.3);
      modulator.connect(modGain);
      modGain.connect(carrier.frequency);
      carrier.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      modulator.start(startTime);
      carrier.start(startTime);
      modulator.stop(startTime + 0.31);
      carrier.stop(startTime + 0.31);
    }
  }

  // Synthesize deep ghostly owl hoot (sine wave at 170Hz + lowpass filter + breathing envelope)
  playOwl() {
    if (this.muted || !this.ctx) return;

    // Try real slow stinger first for a spooky background tone
    if (this._playBuffer("slow_stinger", 0.25)) return;

    // Synthesized fallback
    const now = this.ctx.currentTime;
    const hoots = [
      { delay: 0.0, duration: 0.4, pitch: 170 },
      { delay: 0.7, duration: 0.2, pitch: 165 },
      { delay: 0.95, duration: 0.35, pitch: 160 }
    ];
    hoots.forEach((h) => {
      const startTime = now + h.delay;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(h.pitch, startTime);
      osc.frequency.linearRampToValueAtTime(h.pitch - 5, startTime + h.duration);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(250, startTime);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.065, startTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + h.duration);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(startTime);
      osc.stop(startTime + h.duration + 0.05);
    });
  }

  // Synthesize rustling bushes (micro-bursts of bandpassed white noise)
  playRustle() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Rustle is 6 micro-bursts of noise simulating leaves crackling
    const bursts = 6;
    for (let i = 0; i < bursts; i++) {
      const startTime = now + i * 0.06 + Math.random() * 0.02;
      const duration = 0.04 + Math.random() * 0.03;
      
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1600 + Math.random() * 400, startTime);
      filter.Q.value = 3.0;
      
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.08, startTime); // increased by ~33%
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      
      noise.start(startTime);
      noise.stop(startTime + duration + 0.01);
    }
  }

  // Synthesize paper unfolding / parchment rustle sound effect
  playPaperRustle() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    
    const duration = 0.35;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(2200, now + duration);
    filter.Q.value = 1.8;
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    noise.start(now);
    noise.stop(now + duration);
  }

  // Synthesize deep structural chasm groan (sweeping lowpass saw/triangle detuned nodes + sweeping bandpass noise)
  playChasmGroan() {
    if (this.muted || !this.ctx) return;

    // Try real deep drone doom first
    if (this._playBuffer("drone_doom", 0.50)) return;

    // Synthesized fallback
    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(140, now);
    filter.frequency.exponentialRampToValueAtTime(45, now + 3.0);
    filter.Q.value = 4.0;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(350, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(120, now + 3.0);
    noiseFilter.Q.value = 1.0;
    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(40, now);
    osc1.frequency.linearRampToValueAtTime(32, now + 3.0);
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(41, now);
    osc2.frequency.linearRampToValueAtTime(33, now + 3.0);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);
    osc1.connect(filter);
    osc2.connect(filter);
    noise.connect(noiseFilter);
    filter.connect(gain);
    noiseFilter.connect(gain);
    gain.connect(this.masterGain);
    osc1.start(now);
    osc2.start(now);
    noise.start(now);
    osc1.stop(now + 3.1);
    osc2.stop(now + 3.1);
    noise.stop(now + 3.1);
  }

  // Synthesize trembling voice whisper (tremolo modulated high-resonance bandpass white noise sweep)
  playWhisper() {
    if (this.muted || !this.ctx) return;

    // Try real ghost moan or breath first
    if (this._playBuffer("ghost_moan", 0.35)) return;
    if (this._playBuffer("monster_breath", 0.30)) return;

    // Synthesized fallback
    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.linearRampToValueAtTime(1400, now + 0.4);
    filter.frequency.exponentialRampToValueAtTime(500, now + 1.2);
    filter.Q.setValueAtTime(5.0, now);
    const lfo = this.ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 12.0;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 180;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    lfo.start(now);
    noise.start(now);
    lfo.stop(now + 1.3);
    noise.stop(now + 1.3);
  }

  // Shadow monster spawn sound - heavy monster roar/growl/grunt alert (no female scream)
  playShadowSpawn() {
    if (this.muted || !this.ctx) return;

    const spawnRoars = ["monster_roar", "monster_growl", "monster_grunt"];
    const pickRoar = spawnRoars[Math.floor(Math.random() * spawnRoars.length)];
    this._playBuffer(pickRoar, 0.85, 0.85 + Math.random() * 0.15);
    this._playBuffer("stinger", 0.75);
    return;
  }

  // Shadow monster burn sound (when flashlight hits it)
  playShadowBurn() {
    if (this.muted || !this.ctx) return;

    // Use real hiss sound
    if (this._playBuffer("monster_hiss", 0.45, 1.1)) return;

    // Synthesized fallback
    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(6000, now);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);
    noise.stop(now + 0.25);
  }

  // JUMPSCARE! Real ghost scream + stinger
  playJumpscare() {
    if (this.muted || !this.ctx) return;

    this._playBuffer("jumpscare_scream", 0.95, 1.0);
    this._playBuffer("monster_roar", 0.70, 0.9);
    setTimeout(() => this._playBuffer("stinger", 0.50), 100);
  }

  // Pure high-pitched female horror scream
  playFemaleScream() {
    if (this.muted || !this.ctx) return;
    this._playBuffer("jumpscare_scream", 0.95, 1.05);
    this._playBuffer("distant_scream", 0.75, 1.0);
  }

  // Shadow monster ambient groan/breath/grunt (distance-based volume with wide variety)
  playShadowGroan(distance) {
    if (this.muted || !this.ctx) return;

    const maxDist = 12.0;
    if (distance > maxDist) return;
    const volumeFactor = 1.0 - (distance / maxDist);

    // Randomly pick from full variety of preloaded monster audio files!
    const groanSounds = [
      "monster_growl", 
      "monster_breath", 
      "monster_grunt", 
      "deep_moan", 
      "ghost_moan", 
      "monster_hiss"
    ];
    const pick = groanSounds[Math.floor(Math.random() * groanSounds.length)];
    const vol = 0.42 * volumeFactor;
    const rate = 0.80 + Math.random() * 0.40; // pitch variation for organic realism

    if (this._playBuffer(pick, vol, rate)) return;

    // Synthesized fallback
    const now = this.ctx.currentTime;
    const volume = 0.20 * volumeFactor;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(250, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 1.8);
    filter.Q.setValueAtTime(4.0, now);
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(55, now);
    osc.frequency.linearRampToValueAtTime(45, now + 1.8);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(volume * 0.6, now);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    noise.start(now);
    osc.start(now);
    noise.stop(now + 1.9);
    osc.stop(now + 1.9);
  }

  // Flashlight toggle sounds
  playFlashlightOn() {
    this.init();
    if (this.muted || !this.ctx) return;
    this._playBuffer("flashlight_on", 0.75);
  }

  playFlashlightOff() {
    this.init();
    if (this.muted || !this.ctx) return;
    this._playBuffer("flashlight_off", 0.75);
  }

  // Gasp sound (for scary moments)
  playGasp() {
    if (this.muted || !this.ctx) return;
    this._playBuffer("gasp", 0.50);
  }

  // Door opening creak sound (with metallic screech)
  playDoorOpen() {
    if (this.muted || !this.ctx) return;
    if (this._playBuffer("metal_screech", 0.40, 1.05)) {
      setTimeout(() => this._playBuffer("door_squeak", 0.35), 100);
      return;
    }
    this._playBuffer("door_squeak", 0.35);
  }

  // Loop drone_doom.wav as terrifying background music for Main Menu & Lobby
  startMenuMusic() {
    this.inMenu = true;
    if (this.ambientTimeout) {
      clearTimeout(this.ambientTimeout);
      this.ambientTimeout = null;
    }
    if (this.muted || !this.ctx) return;
    if (this.menuMusicObj && this.menuMusicObj.source) return; // already playing

    try {
      const result = this._playBuffer("drone_doom", 0.001, 1.0, true);
      if (!result) return;

      this.menuMusicObj = result;
      // Smooth fade-in
      const now = this.ctx.currentTime;
      this.menuMusicObj.gain.gain.setValueAtTime(0.001, now);
      this.menuMusicObj.gain.gain.exponentialRampToValueAtTime(0.40, now + 2.0);
    } catch (e) {
      console.warn("Failed to start menu music:", e);
    }
  }

  stopMenuMusic() {
    this.inMenu = false;
    if (this.menuMusicObj && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        if (this.menuMusicObj.gain) {
          this.menuMusicObj.gain.gain.linearRampToValueAtTime(0.001, now + 1.0);
        }
        const obj = this.menuMusicObj;
        this.menuMusicObj = null;
        setTimeout(() => {
          if (obj && obj.source) {
            try { obj.source.stop(); } catch (e) {}
          }
        }, 1050);
      } catch (e) {
        this.menuMusicObj = null;
      }
    }
  }

  // Play a random ambient horror stinger
  playRandomStinger() {
    if (this.muted || !this.ctx) return;
    const stingers = ["piano_stinger", "stinger", "slow_stinger", "suspense_rise"];
    const pick = stingers[Math.floor(Math.random() * stingers.length)];
    this._playBuffer(pick, 0.25);
  }

  // Procedural Fire Synthesizer for warm wall torches (subtle, non-dominant, spatial volume)
  initFireSynth() {
    if (this.muted || !this.ctx || this.fireSynthInitialized) return;
    this.fireSynthInitialized = true;

    try {
      const bufferSize = this.ctx.sampleRate * 2.0;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2.0 - 1.0;
      }

      // Continuous Rumble (Low flame hum)
      this.fireRumbleNode = this.ctx.createBufferSource();
      this.fireRumbleNode.buffer = noiseBuffer;
      this.fireRumbleNode.loop = true;

      const rumbleFilter = this.ctx.createBiquadFilter();
      rumbleFilter.type = "lowpass";
      rumbleFilter.frequency.value = 140;

      this.fireRumbleGain = this.ctx.createGain();
      this.fireRumbleGain.gain.value = 0.0;

      this.fireRumbleNode.connect(rumbleFilter);
      rumbleFilter.connect(this.fireRumbleGain);
      this.fireRumbleGain.connect(this.ctx.destination);
      this.fireRumbleNode.start(0);
    } catch (e) {
      console.warn("Failed to initialize fire synthesizer:", e);
    }
  }

  updateFireVolume(distance) {
    if (this.muted || !this.ctx) {
      if (this.fireRumbleGain) this.fireRumbleGain.gain.setValueAtTime(0, this.ctx.currentTime);
      return;
    }

    if (!this.fireSynthInitialized) {
      this.initFireSynth();
    }
    if (!this.fireRumbleGain) return;

    const maxDist = 3.2;
    let targetVol = 0.0;
    if (distance < maxDist) {
      targetVol = (1.0 - (distance / maxDist)) * 0.055; // 0.055 max volume
    }

    const now = this.ctx.currentTime;
    this.fireRumbleGain.gain.setTargetAtTime(targetVol * 0.35, now, 0.12);
  }

  // Procedural Axe Wood Chop SFX (for Barricades)
  playWoodChop() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // 1. Heavy thud impact
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);
      oscGain.gain.setValueAtTime(0.7, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(oscGain);
      oscGain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.2);

      // 2. Wood splinter crack noise
      const bufferSize = this.ctx.sampleRate * 0.25;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.04));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(800, now);
      filter.Q.setValueAtTime(1.5, now);
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.6, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noise.start(now);

      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([70, 30, 100]);
      }
    } catch (e) {
      console.warn("Error playing playWoodChop:", e);
    }
  }

  // Procedural Shears Cut SFX (for Ivy/Vines)
  playShearsCut() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.15;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.02));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.setValueAtTime(2500, now);
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.5, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noise.start(now);

      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([40, 20, 40]);
      }
    } catch (e) {
      console.warn("Error playing playShearsCut:", e);
    }
  }

  // Procedural Water Fill SFX (for Bucket at Well)
  playWaterFill() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.8;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin(i * 0.05);
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(450, now);
      filter.frequency.exponentialRampToValueAtTime(1100, now + 0.7);
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.4, now);
      noiseGain.gain.linearRampToValueAtTime(0.6, now + 0.3);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.78);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noise.start(now);

      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([50, 40, 60, 40, 80]);
      }
    } catch (e) {
      console.warn("Error playing playWaterFill:", e);
    }
  }
}
