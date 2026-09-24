/**
 * Umbrafall: Shattered Dominion - Warm Cinematic Dark Synth & Gothic Soundtrack
 * Engineered for pleasant, non-fatiguing, atmospheric listening with deep sub-bass and warm tones.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private musicVolume: number = 0.32; // Comfortable, pleasant listening volume
  private sfxVolume: number = 0.55;
  
  // Audio Nodes
  private masterGain: GainNode | null = null;
  private masterFilter: BiquadFilterNode | null = null;
  private musicGain: GainNode | null = null;
  private musicFilter: BiquadFilterNode | null = null;
  private sfxGain: GainNode | null = null;

  // Music sequencer state
  private isMusicPlaying: boolean = false;
  private tempo: number = 118; // Smoother, atmospheric tempo
  private currentStep: number = 0;
  private timerId: number | null = null;
  private musicMood: 'ambient' | 'combat' | 'boss' = 'ambient';
  private biomeKeyIndex: number = 0;

  constructor() {
    // Initialized on first user interaction
  }

  public init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();

    // Master bus
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.9;

    // Master warm filter to cut off harsh ear-piercing high frequencies
    this.masterFilter = this.ctx.createBiquadFilter();
    this.masterFilter.type = 'lowpass';
    this.masterFilter.frequency.value = 3600; // Warm analog cutoff
    this.masterFilter.Q.value = 0.7;

    this.masterFilter.connect(this.ctx.destination);
    this.masterGain.connect(this.masterFilter);

    // SFX bus
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.sfxVolume;
    this.sfxGain.connect(this.masterGain);

    // Music bus with dedicated warm smoothing filter
    this.musicFilter = this.ctx.createBiquadFilter();
    this.musicFilter.type = 'lowpass';
    this.musicFilter.frequency.value = 2600;
    this.musicFilter.Q.value = 0.6;

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.musicVolume;
    
    this.musicGain.connect(this.musicFilter);
    this.musicFilter.connect(this.masterGain);
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMusicMood(mood: 'ambient' | 'combat' | 'boss', biomeIndex: number = 0) {
    this.musicMood = mood;
    this.biomeKeyIndex = biomeIndex % 6;
    if (mood === 'boss') {
      this.tempo = 126;
      if (this.musicFilter) this.musicFilter.frequency.value = 3000;
    } else if (mood === 'combat') {
      this.tempo = 118;
      if (this.musicFilter) this.musicFilter.frequency.value = 2600;
    } else {
      this.tempo = 106;
      if (this.musicFilter) this.musicFilter.frequency.value = 2200;
    }
  }

  public setMusicVolume(val: number) {
    this.musicVolume = Math.max(0, Math.min(1, val));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(this.musicVolume, this.ctx.currentTime, 0.05);
    }
  }

  public setSfxVolume(val: number) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.sfxVolume, this.ctx.currentTime, 0.05);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.9, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  public getMuted() {
    return this.isMuted;
  }

  // --- SOUNDTRACK SYNTHESIZER ---
  public startMusic() {
    this.init();
    this.resume();
    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;
    this.currentStep = 0;
    this.scheduleStep();
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  private scheduleStep() {
    if (!this.isMusicPlaying || !this.ctx || !this.musicGain) return;

    const stepInterval = (60 / this.tempo) / 4; // 16th note in seconds
    const now = this.ctx.currentTime;

    this.playSynthNotesForStep(this.currentStep, now);

    this.currentStep = (this.currentStep + 1) % 64;

    this.timerId = window.setTimeout(() => {
      this.scheduleStep();
    }, stepInterval * 1000);
  }

  private playSynthNotesForStep(step: number, time: number) {
    if (!this.ctx || !this.musicGain) return;

    // Harmonious minor tonalities (D, C, E, A, B, G)
    const rootPitches = [73.42, 65.41, 82.41, 55.00, 61.74, 98.00];
    const root = rootPitches[this.biomeKeyIndex] || 73.42;

    const bar = Math.floor(step / 16);
    const stepInBar = step % 16;

    // 1. Warm Tape-Style Drums
    // Kick: Warm 808 sub thud, smooth and punchy without click
    const kickHits = this.musicMood === 'boss'
      ? [0, 4, 8, 12, 14]
      : this.musicMood === 'combat'
      ? [0, 6, 8, 12]
      : [0, 8];

    if (kickHits.includes(stepInBar)) {
      this.triggerWarmKick(time);
    }

    // Snare / Rim: warm filtered body, no loud crack
    if (stepInBar === 4 || stepInBar === 12) {
      this.triggerVelvetSnare(time);
    }

    // Soft hi-hat / shaker: only soft filtered noise on 8th notes, very gentle
    if (stepInBar % 2 === 0) {
      this.triggerSoftShaker(time, stepInBar % 4 === 2);
    }

    // 2. Warm Moog-style Analog Bassline (Deep, round, zero harsh buzz)
    if (this.musicMood !== 'ambient' || stepInBar % 4 === 0) {
      let bassFreq = root;
      if (stepInBar === 6 || stepInBar === 14) {
        bassFreq = root * 1.05946; // minor second accent
      } else if (stepInBar === 10) {
        bassFreq = root * 1.33484; // fourth
      } else if (bar === 3 && stepInBar === 12) {
        bassFreq = root * 1.4983; // fifth
      }

      this.triggerWarmSubBass(time, bassFreq, 0.22);
    }

    // 3. Ambient Gothic Synth Pad (Every 16 steps = whole bar chord)
    if (stepInBar === 0) {
      const chordOffsets = [
        [1, 1.189, 1.498],      // Minor
        [1.189, 1.498, 1.782],  // III
        [0.891, 1.122, 1.335],  // Flat VII
        [1.059, 1.335, 1.587]   // Flat II
      ];
      const chord = chordOffsets[bar % chordOffsets.length];
      chord.forEach(mul => {
        this.triggerAtmosphericPad(time, root * 2 * mul, 1.8);
      });
    }

    // 4. Melodic Gothic Lead (Warm triangle wave with soft filter)
    if ((this.musicMood === 'boss' && stepInBar % 2 === 0) || (stepInBar === 2 || stepInBar === 8 || stepInBar === 14)) {
      const melodyNotes = [1.498, 1.334, 1.189, 1.0, 1.587, 2.0, 1.782];
      const noteIdx = (step * 2 + bar * 3) % melodyNotes.length;
      const noteFreq = root * 4 * melodyNotes[noteIdx];

      if (Math.random() > 0.35) {
        this.triggerMelodicLead(time, noteFreq, 0.3);
      }
    }
  }

  // --- WARM DRUM SYNTHESIS ---
  private triggerWarmKick(time: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Warm sine sweep from 95Hz to 38Hz (deep sub-bass punch)
    osc.type = 'sine';
    osc.frequency.setValueAtTime(95, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.14);

    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.21);
  }

  private triggerVelvetSnare(time: number) {
    if (!this.ctx || !this.musicGain) return;

    // Soft filtered noise (bandpassed to avoid harsh crack)
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.12);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1100;
    filter.Q.value = 1.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.11);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    noise.start(time);
    noise.stop(time + 0.12);

    // Warm body tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(70, time + 0.08);

    oscGain.gain.setValueAtTime(0.2, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    osc.connect(oscGain);
    oscGain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.09);
  }

  private triggerSoftShaker(time: number, isAccent: boolean) {
    if (!this.ctx || !this.musicGain) return;

    // Filtered gentle white noise
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.04);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.2;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2400; // Warm, not 6000+!
    filter.Q.value = 1.2;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isAccent ? 0.05 : 0.025, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.035);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    noise.start(time);
    noise.stop(time + 0.04);
  }

  // --- WARM SYNTH VOICES ---
  private triggerWarmSubBass(time: number, freq: number, dur: number) {
    if (!this.ctx || !this.musicGain) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    // Pure warm sine + triangle sub
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, time);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 0.5, time); // Sub-octave

    // Warm 280Hz lowpass filter
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, time);
    filter.Q.value = 1.5;

    gain.gain.setValueAtTime(0.26, time);
    gain.gain.exponentialRampToValueAtTime(0.005, time + dur);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + dur);
    osc2.stop(time + dur);
  }

  private triggerAtmosphericPad(time: number, freq: number, dur: number) {
    if (!this.ctx || !this.musicGain) return;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, time);
    filter.Q.value = 0.8;

    // Smooth swell envelope
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.05, time + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + dur);
  }

  private triggerMelodicLead(time: number, freq: number, dur: number) {
    if (!this.ctx || !this.musicGain) return;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1100, time);
    filter.Q.value = 1.2;

    gain.gain.setValueAtTime(0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + dur);
  }

  // --- SMOOTH & POLISHED SOUND EFFECTS (SFX) ---
  public playSlash(comboStep: number = 1) {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    const startFreq = comboStep === 3 ? 380 : 280;
    const endFreq = 90;
    const duration = 0.14;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  public playHitImpact(isCrit: boolean = false) {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isCrit ? 160 : 110, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

    gain.gain.setValueAtTime(isCrit ? 0.35 : 0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playParry() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    // Harmonious dual chime (F#5 & C#6)
    const tones = [740, 1108];
    tones.forEach(freq => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now);
      osc.stop(now + 0.39);
    });
  }

  public playDash() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.12);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, now);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playJump(isDouble: boolean = false) {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isDouble ? 280 : 160, now);
    osc.frequency.exponentialRampToValueAtTime(isDouble ? 480 : 260, now + 0.1);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.11);
  }

  public playRangedShoot() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playAbilityCast() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.linearRampToValueAtTime(320, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.35);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.36);
  }

  public playPotion() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const notes = [392, 523.25, 659.25]; // G4, C5, E5
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const noteTime = now + idx * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.16, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(noteTime);
      osc.stop(noteTime + 0.19);
    });
  }

  public playShardPickup() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08); // A5

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  public playEnemyDeath() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.16);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.17);
  }

  public playBossRoar() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(65, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.25);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.6);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.65);
  }
}

export const sound = new SoundEngine();
