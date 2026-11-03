export type SoundEvent =
  | "message"
  | "typing"
  | "correct"
  | "wrong"
  | "room-enter"
  | "final";

export interface AmbientConfig {
  baseFreq: number;
  harmonicFreq: number;
  filterFreq: number;
  oscType: OscillatorType;
  lfoRate: number;
  lfoDepth: number;
  name: string;
}

export interface DegradationParams {
  level: number; // 0 to 4
  noiseGain: number;
  filterScale: number;
  dropoutChance: number;
}

export const VOLUME_HARD_CAP = 0.30;
export const MUTED_STORAGE_KEY = "sz_audio_muted";
export const VOLUME_STORAGE_KEY = "sz_audio_volume";

/**
 * Pure function: Clamps volume input between 0.0 and 1.0.
 */
export function clampVolume(volume: number): number {
  if (isNaN(volume)) return 0;
  return Math.max(0, Math.min(1, volume));
}

/**
 * Pure function: Maps room ID (1..5) to ambient synthesizer parameters.
 */
export function getAmbientConfigForRoom(roomId: number): AmbientConfig {
  switch (roomId) {
    case 1:
      // Monitoring Station: faint electrical hum
      return {
        baseFreq: 60,
        harmonicFreq: 120,
        filterFreq: 320,
        oscType: "sine",
        lfoRate: 0.15,
        lfoDepth: 25,
        name: "monitoring_station",
      };
    case 2:
      // Network Room: layered server whir
      return {
        baseFreq: 110,
        harmonicFreq: 220,
        filterFreq: 450,
        oscType: "sawtooth",
        lfoRate: 0.3,
        lfoDepth: 40,
        name: "network_room",
      };
    case 3:
      // Central AI Core: deeper hum with slow pulse
      return {
        baseFreq: 48,
        harmonicFreq: 96,
        filterFreq: 280,
        oscType: "triangle",
        lfoRate: 0.08,
        lfoDepth: 35,
        name: "ai_core",
      };
    case 4:
      // Classified Archive: near-silence with rare faint low rustle
      return {
        baseFreq: 35,
        harmonicFreq: 70,
        filterFreq: 180,
        oscType: "sine",
        lfoRate: 0.04,
        lfoDepth: 15,
        name: "archive",
      };
    case 5:
      // Containment Chamber: low sub drone with occasional metallic resonance
      return {
        baseFreq: 40,
        harmonicFreq: 80,
        filterFreq: 220,
        oscType: "triangle",
        lfoRate: 0.1,
        lfoDepth: 30,
        name: "containment_chamber",
      };
    default:
      // Prologue / standby baseline
      return {
        baseFreq: 55,
        harmonicFreq: 110,
        filterFreq: 250,
        oscType: "sine",
        lfoRate: 0.1,
        lfoDepth: 20,
        name: "facility_baseline",
      };
  }
}

/**
 * Pure function: Maps connection status to degradation filter and noise parameters.
 */
export function getDegradationParams(status: string): DegradationParams {
  const normalized = (status || "").toUpperCase().trim();
  switch (normalized) {
    case "DEGRADED":
      return { level: 1, noiseGain: 0.012, filterScale: 0.88, dropoutChance: 0.05 };
    case "MEMORY FAILURE":
      return { level: 2, noiseGain: 0.024, filterScale: 0.75, dropoutChance: 0.10 };
    case "CRITICAL":
      return { level: 3, noiseGain: 0.038, filterScale: 0.60, dropoutChance: 0.18 };
    case "CONNECTION CRITICAL":
      return { level: 4, noiseGain: 0.055, filterScale: 0.45, dropoutChance: 0.28 };
    case "UNSTABLE":
    default:
      return { level: 0, noiseGain: 0.003, filterScale: 1.0, dropoutChance: 0.0 };
  }
}

/**
 * Web Audio API Sound Engine
 * Synthesizes all game audio dynamically (zero audio files, zero external deps).
 */
export class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;

  // Active room ambient nodes
  private currentOscA: OscillatorNode | null = null;
  private currentOscB: OscillatorNode | null = null;
  private currentFilter: BiquadFilterNode | null = null;
  private currentLfo: OscillatorNode | null = null;
  private currentLfoGain: GainNode | null = null;
  private currentRoomId = 0;

  // Degradation noise
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseGainNode: GainNode | null = null;

  private isMuted = true;
  private volume = 0.5; // 0.0 to 1.0
  private lastTypingSoundTime = 0;

  // Dedicated HTML5 audio element for round soundtrack MP3s
  private currentAudioElement: HTMLAudioElement | null = null;
  private currentPlayingRoom: number | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const storedMute = localStorage.getItem(MUTED_STORAGE_KEY);
        this.isMuted = storedMute !== null ? storedMute === "true" : true;

        const storedVol = localStorage.getItem(VOLUME_STORAGE_KEY);
        if (storedVol !== null) {
          this.volume = clampVolume(parseFloat(storedVol));
        }
      } catch {
        // Ignore localStorage restrictions
      }
    }
  }

  /**
   * Initializes AudioContext upon user gesture.
   */
  public ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;

    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return null;

      this.ctx = new AudioCtxClass();

      // Master output with hard cap
      this.masterGain = this.ctx.createGain();
      this.ambientGain = this.ctx.createGain();

      this.masterGain.connect(this.ctx.destination);
      this.ambientGain.connect(this.masterGain);

      this.applyMasterGain();
      this.startAmbientBed(this.currentRoomId || 1);
      this.setupNoiseBed();
    }

    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public getVolume(): number {
    return this.volume;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    try {
      localStorage.setItem(MUTED_STORAGE_KEY, String(muted));
    } catch {}

    if (this.currentAudioElement) {
      this.currentAudioElement.volume = muted ? 0 : clampVolume(this.volume) * 0.45;
      if (!muted && this.currentAudioElement.paused) {
        this.currentAudioElement.play().catch(() => {});
      }
    }

    if (!muted) {
      this.ensureContext();
    }
    this.applyMasterGain();
  }

  public setVolume(vol: number): void {
    this.volume = clampVolume(vol);
    try {
      localStorage.setItem(VOLUME_STORAGE_KEY, String(this.volume));
    } catch {}

    if (this.currentAudioElement) {
      this.currentAudioElement.volume = this.isMuted ? 0 : clampVolume(this.volume) * 0.45;
    }

    this.applyMasterGain();
  }

  private applyMasterGain(): void {
    if (!this.masterGain || !this.ctx) return;
    const targetGain = this.isMuted ? 0 : this.volume * VOLUME_HARD_CAP;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setTargetAtTime(targetGain, now, 0.05);
  }

  /**
   * Starts ambient soundtrack for a specific room (/audio/round1.mp3 ... /audio/round5.mp3).
   */
  public setRoom(roomId: number): void {
    if (this.currentPlayingRoom === roomId && this.currentAudioElement && !this.currentAudioElement.paused) {
      return;
    }
    this.currentPlayingRoom = roomId;
    this.currentRoomId = roomId;

    if (typeof window !== "undefined") {
      if (this.currentAudioElement) {
        try {
          this.currentAudioElement.pause();
          this.currentAudioElement.currentTime = 0;
        } catch {}
        this.currentAudioElement = null;
      }

      try {
        const audio = new Audio(`/audio/round${roomId}.mp3`);
        audio.loop = true;
        audio.volume = this.isMuted ? 0 : clampVolume(this.volume) * 0.45;
        this.currentAudioElement = audio;

        if (!this.isMuted) {
          audio.play().catch(() => {
            // Autoplay may wait for user interaction
          });
        }
      } catch (err) {
        console.warn("[SoundEngine] Failed to load round audio track:", err);
      }
    }

    if (!this.ctx || !this.ambientGain) return;

    const oldOscA = this.currentOscA;
    const oldOscB = this.currentOscB;
    const oldLfo = this.currentLfo;
    const oldFilter = this.currentFilter;
    const now = this.ctx.currentTime;

    // Crossfade: fade out old ambient over 2.0 seconds
    if (oldFilter && oldOscA) {
      oldFilter.gain?.cancelScheduledValues?.(now);
      setTimeout(() => {
        try {
          oldOscA.stop();
          oldOscB?.stop();
          oldLfo?.stop();
          oldOscA.disconnect();
          oldOscB?.disconnect();
          oldLfo?.disconnect();
        } catch {}
      }, 2100);
    }

    this.startAmbientBed(roomId);
  }

  private startAmbientBed(roomId: number): void {
    if (!this.ctx || !this.ambientGain) return;

    const config = getAmbientConfigForRoom(roomId);
    const now = this.ctx.currentTime;

    const oscA = this.ctx.createOscillator();
    const oscB = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();

    oscA.type = config.oscType;
    oscA.frequency.setValueAtTime(config.baseFreq, now);

    oscB.type = "sine";
    oscB.frequency.setValueAtTime(config.harmonicFreq, now);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(config.filterFreq, now);

    lfo.type = "sine";
    lfo.frequency.setValueAtTime(config.lfoRate, now);
    lfoGain.gain.setValueAtTime(config.lfoDepth, now);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const roomGain = this.ctx.createGain();
    roomGain.gain.setValueAtTime(0.001, now);
    roomGain.gain.exponentialRampToValueAtTime(0.35, now + 2.0); // 2-second gentle crossfade

    oscA.connect(filter);
    oscB.connect(filter);
    filter.connect(roomGain);
    roomGain.connect(this.ambientGain);

    oscA.start();
    oscB.start();
    lfo.start();

    this.currentOscA = oscA;
    this.currentOscB = oscB;
    this.currentFilter = filter;
    this.currentLfo = lfo;
    this.currentLfoGain = lfoGain;
  }

  private setupNoiseBed(): void {
    if (!this.ctx || !this.ambientGain) return;

    // Create 1 second buffer of white noise, looped
    const bufferSize = this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 800;
    filter.Q.value = 1.5;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.002;

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain);

    whiteNoise.start();
    this.noiseNode = whiteNoise;
    this.noiseGainNode = gain;
  }

  public setConnectionStatus(status: string): void {
    if (!this.ctx || !this.noiseGainNode) return;
    const params = getDegradationParams(status);
    const now = this.ctx.currentTime;
    this.noiseGainNode.gain.cancelScheduledValues(now);
    this.noiseGainNode.gain.setTargetAtTime(params.noiseGain, now, 0.5);

    if (this.currentFilter) {
      const baseFilter = getAmbientConfigForRoom(this.currentRoomId).filterFreq;
      this.currentFilter.frequency.setTargetAtTime(
        baseFilter * params.filterScale,
        now,
        0.5
      );
    }
  }

  /**
   * Synthesizes transient audio events without audio files.
   */
  public play(event: SoundEvent): void {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;

    switch (event) {
      case "message": {
        // Soft digital tick
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.02);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.03);
        break;
      }

      case "typing": {
        // Throttled & very quiet tick (max 1 per 75ms)
        const wallNow = Date.now();
        if (wallNow - this.lastTypingSoundTime < 75) return;

        // Skip if prefers-reduced-motion
        if (
          typeof window !== "undefined" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ) {
          return;
        }

        this.lastTypingSoundTime = wallNow;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(750 + Math.random() * 100, now);

        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.012);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.015);
        break;
      }

      case "correct": {
        // Short muted-green rising tone (dual oscillator chord)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = "sine";
        osc2.type = "triangle";

        osc1.frequency.setValueAtTime(440, now);
        osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.14);

        osc2.frequency.setValueAtTime(554.37, now);
        osc2.frequency.exponentialRampToValueAtTime(880, now + 0.14);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.masterGain);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.2);
        osc2.stop(now + 0.2);
        break;
      }

      case "wrong": {
        // Short low buzz
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(280, now);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.18);
        break;
      }

      case "room-enter": {
        // Low door-like mechanical thud
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(85, now);
        osc.frequency.exponentialRampToValueAtTime(32, now + 0.35);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(200, now);

        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.4);
        break;
      }

      case "final": {
        // Ambient drone cuts out, single faint red alert pulse
        if (this.ambientGain) {
          this.ambientGain.gain.setValueAtTime(0.0001, now);
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, now); // D5

        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.65);
        break;
      }
    }
  }

  /**
   * Pauses AudioContext and background track when tab is hidden or game is paused.
   */
  public pause(): void {
    if (this.currentAudioElement && !this.currentAudioElement.paused) {
      this.currentAudioElement.pause();
    }
    if (this.ctx && this.ctx.state === "running") {
      this.ctx.suspend().catch(() => {});
    }
  }

  /**
   * Resumes AudioContext and background track when tab returns to visibility.
   */
  public resume(): void {
    if (this.currentAudioElement && this.currentAudioElement.paused && !this.isMuted) {
      this.currentAudioElement.play().catch(() => {});
    }
    if (this.ctx && this.ctx.state === "suspended" && !this.isMuted) {
      this.ctx.resume().catch(() => {});
    }
  }

  /**
   * Stops all ambient sounds and soundtrack when game is paused or ended.
   */
  public stopAll(): void {
    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.pause();
        this.currentAudioElement.currentTime = 0;
      } catch {}
      this.currentAudioElement = null;
    }
    this.currentPlayingRoom = null;

    if (this.ambientGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.ambientGain.gain.cancelScheduledValues(now);
      this.ambientGain.gain.setTargetAtTime(0, now, 0.05);
    }
  }
}

// Global audio engine singleton
let soundEngineInstance: SoundEngine | null = null;

export function getSoundEngine(): SoundEngine {
  if (!soundEngineInstance) {
    soundEngineInstance = new SoundEngine();
  }
  return soundEngineInstance;
}
