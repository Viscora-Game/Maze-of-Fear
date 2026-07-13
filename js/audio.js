export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.windNode = null;
    this.noiseBuffer = null;
    this.muted = false;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      return;
    }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.3, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.ctx.resume(); // Force immediate resume on user click gesture
      this.createNoiseBuffer();
      this.startWind();
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.3, this.ctx.currentTime);
    }
    return this.muted;
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

    // 4. Random Environmental Horror Sound Effects (Crows, Owls, Rustles, Abyssal Chasm Groans, and Ghostly Whispers)
    const environmentalSoundInterval = setInterval(() => {
      if (this.muted || !this.ctx) return;
      const r = Math.random();
      if (r < 0.20) {
        this.playCrow();
      } else if (r < 0.40) {
        this.playOwl();
      } else if (r < 0.60) {
        this.playRustle();
      } else if (r < 0.80) {
        this.playChasmGroan();
      } else {
        this.playWhisper();
      }
    }, 8000); // Check and play every 8 seconds

    // 5. Periodic Heartbeat Dread loop (Steady low double thuds to induce panic)
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
        osc.frequency.setValueAtTime(55, now + delay); // very deep sub-bass thump
        osc.frequency.exponentialRampToValueAtTime(30, now + delay + 0.12);
        
        filter.type = "lowpass";
        filter.frequency.value = 70; // muffle all harmonics for raw chest impact
        
        gain.gain.setValueAtTime(0, now + delay);
        gain.gain.linearRampToValueAtTime(0.24, now + delay + 0.02); // quick punchy attack
        gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.12);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(now + delay);
        osc.stop(now + delay + 0.15);
      });
    }, 1500); // Beats every 1.5 seconds (40 BPM slow tension heartbeat)

    this.windNode = { lfo, noise, windGain, droneOsc1, droneOsc2, droneGain, creepyInterval, environmentalSoundInterval, heartbeatInterval };
  }

  stopWind() {
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

  // Footstep sounds (Walk vs Run variations)
  playStep(isRunning = false) {
    if (this.muted || !this.ctx) return;
    this.init(); // Ensure initialized

    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";

    // Heavier, louder thuds for running steps
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
  }

  // Synthesize heavy, out-of-breath panting gasp cycle (Double lowpass-filtered deep warm breathing - ZERO cızırtı)
  playPanting() {
    if (this.muted) return;
    this.init(); // Ensure initialized and resumed
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Inhale phase (0.0s to 0.28s) - deep muffled gasp in
    const inhaleNoise = this.ctx.createBufferSource();
    inhaleNoise.buffer = this.noiseBuffer;
    
    // First lowpass filter (sweeps 320Hz to 480Hz)
    const inhaleFilter = this.ctx.createBiquadFilter();
    inhaleFilter.type = "lowpass";
    inhaleFilter.frequency.setValueAtTime(320, now);
    inhaleFilter.frequency.linearRampToValueAtTime(480, now + 0.25);
    inhaleFilter.Q.setValueAtTime(1.8, now); // resonant throat peak
    
    // Second lowpass filter to completely eliminate any high-frequency crackle/static hiss (cızırtı)
    const inhaleMuffle = this.ctx.createBiquadFilter();
    inhaleMuffle.type = "lowpass";
    inhaleMuffle.frequency.setValueAtTime(320, now);
    inhaleMuffle.frequency.linearRampToValueAtTime(480, now + 0.25);
    
    const inhaleGain = this.ctx.createGain();
    inhaleGain.gain.setValueAtTime(0, now);
    inhaleGain.gain.linearRampToValueAtTime(0.32, now + 0.15); // Clear, warm and audible over footsteps
    inhaleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    
    inhaleNoise.connect(inhaleFilter);
    inhaleFilter.connect(inhaleMuffle);
    inhaleMuffle.connect(inhaleGain);
    inhaleGain.connect(this.masterGain);
    
    inhaleNoise.start(now);
    inhaleNoise.stop(now + 0.3);
    
    // Exhale phase (0.3s to 0.7s) - deep muffled sigh out
    const exhaleTime = now + 0.3;
    const exhaleNoise = this.ctx.createBufferSource();
    exhaleNoise.buffer = this.noiseBuffer;
    
    // First lowpass filter (sweeps 420Hz to 280Hz)
    const exhaleFilter = this.ctx.createBiquadFilter();
    exhaleFilter.type = "lowpass";
    exhaleFilter.frequency.setValueAtTime(420, exhaleTime);
    exhaleFilter.frequency.linearRampToValueAtTime(280, exhaleTime + 0.35);
    exhaleFilter.Q.setValueAtTime(1.5, exhaleTime);
    
    // Second lowpass filter to completely eliminate high-frequency static hiss
    const exhaleMuffle = this.ctx.createBiquadFilter();
    exhaleMuffle.type = "lowpass";
    exhaleMuffle.frequency.setValueAtTime(420, exhaleTime);
    exhaleMuffle.frequency.linearRampToValueAtTime(280, exhaleTime + 0.35);
    
    const exhaleGain = this.ctx.createGain();
    exhaleGain.gain.setValueAtTime(0, exhaleTime);
    exhaleGain.gain.linearRampToValueAtTime(0.42, exhaleTime + 0.12); // Clear, warm and audible over footsteps
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
    const now = this.ctx.currentTime;
    
    // Play a shiny 3-note arpeggio (sine waves)
    const notes = [440, 554, 659]; // A4, C#5, E5
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
    const now = this.ctx.currentTime;

    // Metallic latch clicks
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
    const now = this.ctx.currentTime;
    
    // 1. Clattering heavy chains (5 quick metallic click-clanks)
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
    
    // 2. Heavy gate hinge squeal starting after chain clatter
    const squealTime = now + 0.35;
    const squealDur = 1.2;
    
    const squealOsc = this.ctx.createOscillator();
    const squealFilter = this.ctx.createBiquadFilter();
    const squealGain = this.ctx.createGain();
    
    squealOsc.type = "sawtooth";
    squealOsc.frequency.setValueAtTime(290, squealTime);
    squealOsc.frequency.linearRampToValueAtTime(220, squealTime + squealDur); // rusty creak pitch drops
    
    squealFilter.type = "bandpass";
    squealFilter.frequency.setValueAtTime(800, squealTime);
    squealFilter.Q.value = 3.0; // resonant metallic creak
    
    squealGain.gain.setValueAtTime(0, squealTime);
    squealGain.gain.linearRampToValueAtTime(0.06, squealTime + 0.2); // swell in
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
    const now = this.ctx.currentTime;
    
    const duration = 2.2;
    
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + duration); // rising pitch
    
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(1600, now + duration);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.09, now + 0.4); // swell in
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    
    // Ghostly wind whoosh
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
    const now = this.ctx.currentTime;
    
    // Low, vibrating hazard alarm (sawtooth)
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
    const now = this.ctx.currentTime;
    
    // Play two quick caws: "Caw! Caw!"
    for (let c = 0; c < 2; c++) {
      const startTime = now + c * 0.45;
      
      const carrier = this.ctx.createOscillator();
      const modulator = this.ctx.createOscillator();
      const modGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      
      carrier.type = "sawtooth";
      carrier.frequency.setValueAtTime(280, startTime);
      carrier.frequency.linearRampToValueAtTime(220, startTime + 0.3); // Pitch drops slightly
      
      // Ring modulation/FM to create harsh cawing vibration
      modulator.type = "sawtooth";
      modulator.frequency.setValueAtTime(38, startTime); // Harsh rattles
      modGain.gain.setValueAtTime(150, startTime);
      
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(800, startTime);
      filter.Q.value = 1.5;
      
      // Caw amplitude envelope (increased by ~35%)
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.055, startTime + 0.05); // quick onset
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
    const now = this.ctx.currentTime;
    
    // Owl double hoot sequence: "Hoo... Hoo-Hoo"
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
      filter.frequency.setValueAtTime(250, startTime); // Muffles the sine to sound deep and distant
      
      // Soft breathing volume envelope (increased by 30%)
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.065, startTime + 0.08); // gentle attack
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

  // Synthesize deep structural chasm groan (sweeping lowpass saw/triangle detuned nodes + sweeping bandpass noise)
  playChasmGroan() {
    if (this.muted || !this.ctx) return;
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
    osc2.frequency.setValueAtTime(41, now); // detune
    osc2.frequency.linearRampToValueAtTime(33, now + 3.0);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.8); // slow build
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
    const now = this.ctx.currentTime;
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.linearRampToValueAtTime(1400, now + 0.4);
    filter.frequency.exponentialRampToValueAtTime(500, now + 1.2);
    filter.Q.setValueAtTime(5.0, now); // sharp whistle/breath resonance
    
    // Add LFO to make it shudder/tremble like a shivering voice
    const lfo = this.ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 12.0; // 12 Hz vibration
    
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 180;
    
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.2); // sudden breath gasp
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    lfo.start(now);
    noise.start(now);
    lfo.stop(now + 1.3);
    noise.stop(now + 1.3);
  }

  playShadowSpawn() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.linearRampToValueAtTime(30, now + 1.5);
    
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.linearRampToValueAtTime(100, now + 1.5);
    
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 1.6);

    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(800, now);
    osc2.frequency.linearRampToValueAtTime(400, now + 1.2);
    
    gain2.gain.setValueAtTime(0.08, now);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
    
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(now);
    osc2.stop(now + 1.3);
  }

  playShadowBurn() {
    if (this.muted || !this.ctx) return;
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

  playJumpscare() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const noise = this.ctx.createBufferSource();
    
    const filterNoise = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    
    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(2000, now);
    osc1.frequency.linearRampToValueAtTime(400, now + 1.5);
    
    osc2.type = "sawtooth";
    osc2.frequency.setValueAtTime(120, now);
    osc2.frequency.linearRampToValueAtTime(40, now + 1.5);
    
    noise.buffer = this.noiseBuffer;
    filterNoise.type = "bandpass";
    filterNoise.frequency.setValueAtTime(1000, now);
    
    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
    
    osc1.connect(gain);
    osc2.connect(gain);
    noise.connect(filterNoise);
    filterNoise.connect(gain);
    
    gain.connect(this.masterGain);
    
    osc1.start(now);
    osc2.start(now);
    noise.start(now);
    
    osc1.stop(now + 1.6);
    osc2.stop(now + 1.6);
    noise.stop(now + 1.6);
  }

  playShadowGroan(distance) {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    
    const maxDist = 12.0;
    if (distance > maxDist) return;
    const volumeFactor = 1.0 - (distance / maxDist);
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
}
