/**
 * Procedural electronic stage music inspired by the Prometheus (2012) score —
 * sequenced synth arps, FM tones, square/saw bass, and megastructure pulses.
 * Synthesized in-browser; no copyrighted audio files.
 */

const STORAGE_KEY = "echoes-music-volume";
const DEFAULT_VOLUME = 0.55;

/** @typedef {object} StageMusicProfile */
const STAGE_PROFILES = {
  menu: {
    title: "Meridian Approach",
    ref: "Synth scan · void telemetry",
    root: 43,
    arp: [0, 7, 12, 7, 4, 7],
    arpRate: 4.2,
    pad: [220, 277, 330],
    fmRatio: 2.01,
    pulse: 0.05,
    glitch: 0.02,
    cutoff: 2400,
    resonance: 6,
    delay: 0.38,
    reverb: 0.55,
    darkness: 0.35,
    leadWave: "square",
    bassWave: "sawtooth",
  },
  1: {
    title: "Life",
    ref: "Map room · crystalline synth beacon",
    root: 45,
    arp: [0, 4, 7, 12, 7, 4, 0, 7],
    arpRate: 5.5,
    pad: [220, 262, 330],
    fmRatio: 1.5,
    pulse: 0.07,
    glitch: 0.025,
    cutoff: 3200,
    resonance: 5,
    delay: 0.32,
    reverb: 0.48,
    darkness: 0.4,
    leadWave: "square",
    bassWave: "sawtooth",
  },
  2: {
    title: "Going Home",
    ref: "Bridge crossing · wide analog pad",
    root: 42,
    arp: [0, 7, 14, 7, 11, 7, 4, 0],
    arpRate: 3.8,
    pad: [185, 233, 277],
    fmRatio: 2.5,
    pulse: 0.04,
    glitch: 0.015,
    cutoff: 4200,
    resonance: 4,
    delay: 0.48,
    reverb: 0.62,
    darkness: 0.3,
    leadWave: "triangle",
    bassWave: "sawtooth",
  },
  3: {
    title: "Black Liquid",
    ref: "Vault · pulsing FM dread",
    root: 40,
    arp: [0, 1, 6, 1, 0, 1, 3, 1],
    arpRate: 7.2,
    pad: [130, 155, 196],
    fmRatio: 3.2,
    pulse: 0.14,
    glitch: 0.045,
    cutoff: 1200,
    resonance: 9,
    delay: 0.22,
    reverb: 0.42,
    darkness: 0.72,
    leadWave: "square",
    bassWave: "square",
  },
  4: {
    title: "Friend from the Stars",
    ref: "Sanctum · cathedral synth organ",
    root: 37,
    arp: [0, 4, 7, 11, 7, 4, 12, 7],
    arpRate: 4.8,
    pad: [185, 220, 277],
    fmRatio: 1.41,
    pulse: 0.09,
    glitch: 0.03,
    cutoff: 2800,
    resonance: 7,
    delay: 0.42,
    reverb: 0.65,
    darkness: 0.55,
    leadWave: "sawtooth",
    bassWave: "sawtooth",
  },
  5: {
    title: "Hyper Sleep",
    ref: "Gallery I · soft digital arp",
    root: 43,
    arp: [0, 7, 12, 16, 12, 7],
    arpRate: 6,
    pad: [196, 247, 294],
    fmRatio: 2,
    pulse: 0.06,
    glitch: 0.02,
    cutoff: 3600,
    resonance: 5,
    delay: 0.36,
    reverb: 0.52,
    darkness: 0.38,
    leadWave: "square",
    bassWave: "triangle",
  },
  6: {
    title: "Dawn",
    ref: "Baroque deck · minor-seq tension",
    root: 41,
    arp: [0, 3, 7, 3, 0, 8, 7, 3],
    arpRate: 6.8,
    pad: [174, 207, 262],
    fmRatio: 2.8,
    pulse: 0.1,
    glitch: 0.035,
    cutoff: 1800,
    resonance: 8,
    delay: 0.28,
    reverb: 0.48,
    darkness: 0.48,
    leadWave: "square",
    bassWave: "sawtooth",
  },
  7: {
    title: "Space",
    ref: "Stairwell rise · bright lead seq",
    root: 44,
    arp: [0, 7, 12, 19, 12, 7, 4, 12],
    arpRate: 7.5,
    pad: [208, 262, 311],
    fmRatio: 1.73,
    pulse: 0.08,
    glitch: 0.022,
    cutoff: 4800,
    resonance: 4,
    delay: 0.4,
    reverb: 0.58,
    darkness: 0.42,
    leadWave: "square",
    bassWave: "sawtooth",
  },
  8: {
    title: "The Engineer",
    ref: "Alien gallery · harsh resonance",
    root: 39,
    arp: [0, 1, 4, 1, 0, 6, 4, 1],
    arpRate: 8,
    pad: [130, 155, 185],
    fmRatio: 3.5,
    pulse: 0.12,
    glitch: 0.05,
    cutoff: 1400,
    resonance: 10,
    delay: 0.24,
    reverb: 0.45,
    darkness: 0.62,
    leadWave: "square",
    bassWave: "square",
  },
  9: {
    title: "Hammerpede",
    ref: "Relic attune · staccato FM",
    root: 38,
    arp: [0, 2, 3, 2, 0, 5, 3, 2],
    arpRate: 9,
    pad: [117, 139, 175],
    fmRatio: 4,
    pulse: 0.15,
    glitch: 0.055,
    cutoff: 1000,
    resonance: 11,
    delay: 0.18,
    reverb: 0.4,
    darkness: 0.75,
    leadWave: "square",
    bassWave: "square",
  },
  10: {
    title: "The Med Pod",
    ref: "Defense grid · clinical synth pulse",
    root: 42,
    arp: [0, 4, 7, 4, 0, 7, 11, 7],
    arpRate: 7,
    pad: [175, 208, 262],
    fmRatio: 2.2,
    pulse: 0.11,
    glitch: 0.04,
    cutoff: 2200,
    resonance: 7,
    delay: 0.3,
    reverb: 0.5,
    darkness: 0.58,
    leadWave: "sawtooth",
    bassWave: "sawtooth",
  },
  11: {
    title: "Temptation",
    ref: "Deep gallery · detuned seq",
    root: 40,
    arp: [0, 3, 6, 10, 6, 3, 0, 6],
    arpRate: 7.8,
    pad: [131, 156, 196],
    fmRatio: 2.6,
    pulse: 0.13,
    glitch: 0.042,
    cutoff: 1600,
    resonance: 9,
    delay: 0.26,
    reverb: 0.46,
    darkness: 0.68,
    leadWave: "square",
    bassWave: "square",
  },
  12: {
    title: "Debirth",
    ref: "Dark stairwell · low bit-crush feel",
    root: 37,
    arp: [0, 1, 3, 1, 0, 1, 6, 1],
    arpRate: 10,
    pad: [110, 131, 165],
    fmRatio: 3.8,
    pulse: 0.16,
    glitch: 0.06,
    cutoff: 900,
    resonance: 12,
    delay: 0.16,
    reverb: 0.38,
    darkness: 0.8,
    leadWave: "square",
    bassWave: "square",
  },
  13: {
    title: "Cargo Lift",
    ref: "Final decks · ascending synth run",
    root: 43,
    arp: [0, 4, 7, 11, 14, 11, 7, 4],
    arpRate: 8.5,
    pad: [196, 247, 294],
    fmRatio: 1.88,
    pulse: 0.1,
    glitch: 0.028,
    cutoff: 3800,
    resonance: 5,
    delay: 0.38,
    reverb: 0.58,
    darkness: 0.5,
    leadWave: "square",
    bassWave: "sawtooth",
  },
  14: {
    title: "Install",
    ref: "Cryo threshold · gated arp",
    root: 41,
    arp: [0, 7, 12, 7, 0, 12, 16, 12],
    arpRate: 6.5,
    pad: [185, 220, 277],
    fmRatio: 2.1,
    pulse: 0.12,
    glitch: 0.032,
    cutoff: 3000,
    resonance: 6,
    delay: 0.44,
    reverb: 0.62,
    darkness: 0.6,
    leadWave: "sawtooth",
    bassWave: "sawtooth",
  },
  ascension: {
    title: "Earth",
    ref: "Cryo launch · soaring lead line",
    root: 45,
    arp: [0, 4, 7, 12, 16, 19, 16, 12],
    arpRate: 5,
    pad: [220, 277, 330],
    fmRatio: 1.5,
    pulse: 0.05,
    glitch: 0.01,
    cutoff: 5200,
    resonance: 3,
    delay: 0.52,
    reverb: 0.72,
    darkness: 0.2,
    leadWave: "triangle",
    bassWave: "sawtooth",
  },
  win: {
    title: "Postlude",
    ref: "Escape · open fifths seq",
    root: 47,
    arp: [0, 7, 12, 19, 24, 19, 12, 7],
    arpRate: 4,
    pad: [233, 294, 349],
    fmRatio: 1.33,
    pulse: 0.03,
    glitch: 0.008,
    cutoff: 6000,
    resonance: 2,
    delay: 0.55,
    reverb: 0.78,
    darkness: 0.15,
    leadWave: "triangle",
    bassWave: "triangle",
  },
  lose: {
    title: "Aftermath",
    ref: "Signal lost · broken telemetry",
    root: 36,
    arp: [0, 1, 0, 1, 0, 6, 1, 0],
    arpRate: 11,
    pad: [98, 117, 147],
    fmRatio: 5,
    pulse: 0.18,
    glitch: 0.07,
    cutoff: 700,
    resonance: 14,
    delay: 0.12,
    reverb: 0.32,
    darkness: 0.9,
    leadWave: "square",
    bassWave: "square",
  },
};

function makeReverbImpulse(ctx, seconds = 2.4, decay = 2.2) {
  const rate = ctx.sampleRate;
  const length = rate * seconds;
  const impulse = ctx.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return impulse;
}

function midiToHz(n) {
  return 440 * Math.pow(2, (n - 69) / 12);
}

function makeDistortionCurve(amount = 20) {
  const n = 44100;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((3 + amount) * x * 20 * (Math.PI / 180)) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

export class StageMusic {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.reverb = null;
    this.dry = null;
    this.wet = null;
    this.layers = null;
    this.activeKey = null;
    this.initialized = false;
    this.enabled = true;
    this.volume = Number(localStorage.getItem(STORAGE_KEY)) || DEFAULT_VOLUME;
    this.time = 0;
  }

  getProfile(stage) {
    return STAGE_PROFILES[stage] ?? STAGE_PROFILES[1];
  }

  getStageLabel(stage) {
    const p = this.getProfile(stage);
    return `${p.title} — ${p.ref}`;
  }

  async init() {
    if (this.initialized) {
      if (this.ctx.state === "suspended") await this.ctx.resume();
      return;
    }

    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = this.enabled ? this.volume : 0;

    const reverb = ctx.createConvolver();
    reverb.buffer = makeReverbImpulse(ctx);

    const dry = ctx.createGain();
    const wet = ctx.createGain();
    dry.gain.value = 0.62;
    wet.gain.value = 0.38;

    dry.connect(master);
    wet.connect(master);
    reverb.connect(wet);
    master.connect(ctx.destination);

    this.ctx = ctx;
    this.master = master;
    this.reverb = reverb;
    this.dry = dry;
    this.wet = wet;
    this.initialized = true;

    await ctx.resume();
    this.setStage("menu", { immediate: true });
  }

  setEnabled(on) {
    this.enabled = on;
    if (this.master) {
      this.master.gain.setTargetAtTime(on ? this.volume : 0, this.ctx.currentTime, 0.08);
    }
  }

  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));
    localStorage.setItem(STORAGE_KEY, String(this.volume));
    if (this.master && this.enabled) {
      this.master.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.06);
    }
  }

  _disposeLayers() {
    if (!this.layers) return;
    for (const node of this.layers.nodes) {
      try {
        node.stop?.();
        node.disconnect?.();
      } catch {
        /* already stopped */
      }
    }
    this.layers = null;
  }

  _connectToOutput(sourceNode, profile) {
    sourceNode.connect(this.dry);
    sourceNode.connect(this.reverb);
  }

  _buildLayers(profile) {
    const ctx = this.ctx;
    const bus = ctx.createGain();
    bus.gain.value = 0.0001;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = profile.cutoff;
    filter.Q.value = profile.resonance;

    const highpass = ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 55 + profile.darkness * 30;

    const shaper = ctx.createWaveShaper();
    shaper.curve = makeDistortionCurve(8 + profile.darkness * 12);
    shaper.oversample = "2x";

    const delay = ctx.createDelay(1.2);
    delay.delayTime.value = profile.delay * 0.55;
    const delayFb = ctx.createGain();
    delayFb.gain.value = profile.delay * 0.55;
    const delayMix = ctx.createGain();
    delayMix.gain.value = profile.delay * 0.45;

    bus.connect(highpass);
    highpass.connect(filter);
    filter.connect(shaper);
    shaper.connect(this.dry);
    shaper.connect(delay);
    delay.connect(delayFb);
    delayFb.connect(delay);
    delay.connect(delayMix);
    delayMix.connect(this.reverb);
    delayMix.connect(this.dry);

    this.wet.gain.setTargetAtTime(profile.reverb, ctx.currentTime, 0.4);
    this.dry.gain.setTargetAtTime(0.72 - profile.reverb * 0.2, ctx.currentTime, 0.4);

    const nodes = [];
    const rootHz = midiToHz(profile.root);

    // Electronic bass — filtered saw/square
    const bass = ctx.createOscillator();
    bass.type = profile.bassWave;
    bass.frequency.value = rootHz;
    const bassFilter = ctx.createBiquadFilter();
    bassFilter.type = "lowpass";
    bassFilter.frequency.value = 280 + profile.cutoff * 0.08;
    bassFilter.Q.value = profile.resonance * 0.4;
    const bassGain = ctx.createGain();
    bassGain.gain.value = 0.16;
    bass.connect(bassFilter);
    bassFilter.connect(bassGain);
    bassGain.connect(bus);
    bass.start();
    nodes.push(bass, bassFilter, bassGain);

    // Supersaw-style pad — detuned squares
    const padGains = [];
    for (let i = 0; i < profile.pad.length; i++) {
      for (const det of [-14, 0, 14]) {
        const osc = ctx.createOscillator();
        osc.type = "square";
        osc.frequency.value = profile.pad[i];
        osc.detune.value = det + (i - 1) * 5;
        const g = ctx.createGain();
        g.gain.value = 0.018;
        osc.connect(g);
        g.connect(bus);
        osc.start();
        nodes.push(osc, g);
        if (det === 0) padGains.push(g);
      }
    }

    // FM lead tone — metallic electronic timbre
    const fmCar = ctx.createOscillator();
    fmCar.type = profile.leadWave;
    fmCar.frequency.value = rootHz * 2;
    const fmMod = ctx.createOscillator();
    fmMod.type = "sine";
    fmMod.frequency.value = rootHz * 2 * profile.fmRatio;
    const fmDepth = ctx.createGain();
    fmDepth.gain.value = rootHz * 0.35;
    fmMod.connect(fmDepth);
    fmDepth.connect(fmCar.frequency);
    const fmFilter = ctx.createBiquadFilter();
    fmFilter.type = "bandpass";
    fmFilter.frequency.value = rootHz * 4;
    fmFilter.Q.value = profile.resonance;
    const fmGain = ctx.createGain();
    fmGain.gain.value = 0.055;
    fmCar.connect(fmFilter);
    fmFilter.connect(fmGain);
    fmGain.connect(bus);
    fmCar.start();
    fmMod.start();
    nodes.push(fmCar, fmMod, fmDepth, fmFilter, fmGain);

    // Arp lead — square/saw sequencer (frequency stepped in update())
    const arpOsc = ctx.createOscillator();
    arpOsc.type = profile.leadWave;
    arpOsc.frequency.value = rootHz * 4;
    const arpFilter = ctx.createBiquadFilter();
    arpFilter.type = "lowpass";
    arpFilter.frequency.value = profile.cutoff * 0.85;
    arpFilter.Q.value = profile.resonance * 0.6;
    const arpEnv = ctx.createGain();
    arpEnv.gain.value = 0.0001;
    arpOsc.connect(arpFilter);
    arpFilter.connect(arpEnv);
    arpEnv.connect(bus);
    arpOsc.start();
    nodes.push(arpOsc, arpFilter, arpEnv);

    // Digital glitch / telemetry noise
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() < 0.04 ? (Math.random() * 2 - 1) * 0.8 : Math.random() * 0.08 - 0.04;
    }
    const glitch = ctx.createBufferSource();
    glitch.buffer = noiseBuffer;
    glitch.loop = true;
    const glitchFilter = ctx.createBiquadFilter();
    glitchFilter.type = "bandpass";
    glitchFilter.frequency.value = 800 + profile.darkness * 600;
    glitchFilter.Q.value = 2.5;
    const glitchGain = ctx.createGain();
    glitchGain.gain.value = profile.glitch;
    glitch.connect(glitchFilter);
    glitchFilter.connect(glitchGain);
    glitchGain.connect(bus);
    glitch.start();
    nodes.push(glitch, glitchFilter, glitchGain);

    // Sub pulse — square octave below bass
    const sub = ctx.createOscillator();
    sub.type = "square";
    sub.frequency.value = rootHz * 0.5;
    const subGain = ctx.createGain();
    subGain.gain.value = 0.08;
    sub.connect(subGain);
    subGain.connect(bus);
    sub.start();
    nodes.push(sub, subGain);

    bus.gain.setTargetAtTime(0.9, ctx.currentTime + 0.05, 1.6);

    return {
      bus,
      filter,
      fmFilter,
      arpOsc,
      arpEnv,
      arpFilter,
      bassFilter,
      padGains,
      subGain,
      profile,
      rootHz,
      lastArpStep: -1,
      nodes,
    };
  }

  setStage(stage, { immediate = false } = {}) {
    if (!this.initialized) return;
    const key = stage;
    if (key === this.activeKey && !immediate) return;

    const profile = this.getProfile(key);
    const ctx = this.ctx;
    const fadeSec = immediate ? 0.02 : 2.2;

    if (this.layers?.bus) {
      this.layers.bus.gain.setTargetAtTime(0.0001, ctx.currentTime, fadeSec * 0.35);
      const old = this.layers;
      window.setTimeout(() => this._disposeLayerSet(old), fadeSec * 1000 + 120);
    }

    this.layers = this._buildLayers(profile);
    this.activeKey = key;
  }

  _disposeLayerSet(layerSet) {
    if (!layerSet?.nodes) return;
    for (const node of layerSet.nodes) {
      try {
        node.stop?.();
        node.disconnect?.();
      } catch {
        /* ignore */
      }
    }
  }

  update(delta) {
    if (!this.initialized || !this.layers) return;
    this.time += delta;
    const t = this.time;
    const {
      filter,
      fmFilter,
      arpOsc,
      arpEnv,
      arpFilter,
      bassFilter,
      profile,
      rootHz,
      bus,
      subGain,
    } = this.layers;

    const now = this.ctx.currentTime;
    const sweep = profile.cutoff * (0.78 + Math.sin(t * 0.09) * 0.22);
    filter.frequency.setTargetAtTime(sweep, now, 0.2);
    arpFilter.frequency.setTargetAtTime(sweep * 0.9, now, 0.2);
    bassFilter.frequency.setTargetAtTime(180 + sweep * 0.12, now, 0.25);
    fmFilter.frequency.setTargetAtTime(rootHz * 4 * (1 + Math.sin(t * 0.13) * 0.06), now, 0.3);

    // Sequencer — electronic arp steps
    const stepDur = 1 / profile.arpRate;
    const stepIndex = Math.floor(t / stepDur) % profile.arp.length;
    if (stepIndex !== this.layers.lastArpStep) {
      const semi = profile.arp[stepIndex];
      const hz = rootHz * Math.pow(2, (semi + 24) / 12);
      arpOsc.frequency.setValueAtTime(hz, now);
      arpEnv.gain.cancelScheduledValues(now);
      arpEnv.gain.setValueAtTime(0.16, now);
      arpEnv.gain.exponentialRampToValueAtTime(0.001, now + stepDur * 0.82);
      this.layers.lastArpStep = stepIndex;
    }

    const pulse = 0.78 + Math.sin(t * profile.pulse * Math.PI * 2) * 0.14;
    bus.gain.setTargetAtTime(pulse * 0.9, now, 0.25);
    subGain.gain.setTargetAtTime(0.06 + Math.sin(t * profile.pulse * Math.PI) * 0.04, now, 0.3);

    for (let i = 0; i < this.layers.padGains.length; i++) {
      const g = this.layers.padGains[i];
      g.gain.setTargetAtTime(
        0.014 + Math.sin(t * 0.18 + i * 1.4) * 0.006,
        now,
        0.35
      );
    }
  }

  stop() {
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.5);
    }
    window.setTimeout(() => {
      this._disposeLayers();
      this.activeKey = null;
    }, 600);
  }
}

export function createStageMusic() {
  return new StageMusic();
}

export { STAGE_PROFILES };

// Designed by Dang-Tue Hoang, AI Engineer
