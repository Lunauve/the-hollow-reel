class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  public unlock(): void {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  private playTone(
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType = 'triangle',
    gainPeak = 0.14,
    delay = 0
  ): void {
    if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + duration);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(gainPeak, now + Math.min(0.015, duration * 0.2));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  private playNoise(duration: number, filterFreq: number, gainPeak = 0.08, delay = 0): void {
    if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
    const sampleRate = this.ctx.sampleRate;
    const length = Math.max(1, Math.floor(sampleRate * duration));
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = 1.4;

    const now = this.ctx.currentTime + delay;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainPeak, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    src.start(now);
  }

  public jump(): void {
    this.playTone(230, 520, 0.14, 'sine', 0.11);
  }

  public land(): void {
    this.playTone(125, 55, 0.08, 'triangle', 0.09);
  }

  public crumbleCrack(): void {
    this.playNoise(0.14, 900, 0.09);
    this.playTone(165, 85, 0.14, 'triangle', 0.07);
  }

  public slash(): void {
    this.playNoise(0.11, 1600, 0.12);
    this.playTone(480, 190, 0.09, 'triangle', 0.08);
  }

  public hitEnemy(): void {
    this.playTone(310, 110, 0.11, 'square', 0.09);
    this.playNoise(0.08, 950, 0.1);
  }

  public killEnemy(): void {
    this.playTone(420, 95, 0.2, 'sawtooth', 0.09);
    this.playNoise(0.14, 700, 0.11);
  }

  public batScreech(): void {
    this.playTone(1150, 740, 0.16, 'sine', 0.06);
  }

  public hurt(): void {
    this.playTone(170, 62, 0.24, 'sawtooth', 0.14);
    this.playNoise(0.18, 420, 0.12);
  }

  public checkpoint(): void {
    this.playTone(392, 392, 0.14, 'triangle', 0.1, 0);
    this.playTone(493.88, 493.88, 0.16, 'triangle', 0.1, 0.11);
    this.playTone(587.33, 587.33, 0.28, 'triangle', 0.11, 0.22);
  }

  public projectorSputter(): void {
    for (let i = 0; i < 6; i++) {
      this.playNoise(0.04, 1200 + i * 140, 0.06, i * 0.09);
    }
    this.playTone(110, 140, 0.55, 'sawtooth', 0.05, 0.15);
  }

  public bossTelegraph(): void {
    this.playTone(190, 290, 0.22, 'triangle', 0.1);
  }

  public bossSweep(): void {
    this.playNoise(0.28, 520, 0.14);
    this.playTone(180, 85, 0.26, 'sine', 0.12);
  }

  public bossSlam(): void {
    this.playTone(110, 36, 0.32, 'triangle', 0.2);
    this.playNoise(0.24, 280, 0.18);
  }

  public bossHit(): void {
    this.playTone(340, 130, 0.16, 'square', 0.11);
    this.playNoise(0.1, 1100, 0.11);
  }

  public bossMelt(): void {
    this.playTone(280, 48, 0.85, 'sawtooth', 0.11);
    this.playNoise(0.6, 480, 0.12);
  }

  public finChord(): void {
    this.playTone(261.63, 261.63, 0.65, 'triangle', 0.09, 0);
    this.playTone(329.63, 329.63, 0.65, 'triangle', 0.08, 0.06);
    this.playTone(392.0, 392.0, 0.8, 'triangle', 0.09, 0.12);
    this.playTone(523.25, 523.25, 1.0, 'sine', 0.08, 0.18);
  }
}

export const sound = new SoundEngine();
