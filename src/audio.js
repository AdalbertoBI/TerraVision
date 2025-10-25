import { APP_CONFIG } from './config.js';

export class AudioEngine {
  constructor() {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    this.context = new AudioContextCtor();
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0.45;
    this.masterGain.connect(this.context.destination);

    // Resume AudioContext no primeiro gesto do usuário
    this.setupGestureResume();

    this.volumeStates = [
      { id: 'mute', gain: 0, icon: '🔇', message: 'Áudio silenciado' },
      { id: 'low', gain: 0.18, icon: '🔈', message: 'Volume baixo' },
      { id: 'medium', gain: 0.45, icon: '🔉', message: 'Volume moderado' },
      { id: 'high', gain: 0.72, icon: '🔊', message: 'Volume alto' }
    ];

    const persisted = localStorage.getItem(APP_CONFIG.volumeStorageKey);
    this.volumeIndex = persisted ? Number(persisted) % this.volumeStates.length : 2;
    this.applyVolume();
  }

  setupGestureResume() {
    const resumeOnce = () => {
      if (this.context.state === 'suspended') {
        this.context.resume().then(() => {
          console.log('[AudioEngine] AudioContext resumed após gesto do usuário');
        }).catch((error) => {
          console.warn('[AudioEngine] Falha ao resumir AudioContext:', error);
        });
      }
    };

    // Resume no primeiro clique
    document.addEventListener('click', resumeOnce, { once: true });
    // Fallback para outros gestos
    document.addEventListener('touchstart', resumeOnce, { once: true });
    document.addEventListener('keydown', resumeOnce, { once: true });
  }

  applyVolume() {
    const target = this.volumeStates[this.volumeIndex];
    this.masterGain.gain.value = target.gain;
    return target;
  }

  async ensureRunning() {
    if (this.context.state === 'suspended') {
      try {
        await this.context.resume();
      } catch (error) {
        console.warn('Não foi possível retomar o contexto de áudio.', error);
      }
    }
  }

  async cycleVolume() {
    await this.ensureRunning();
    this.volumeIndex = (this.volumeIndex + 1) % this.volumeStates.length;
    localStorage.setItem(APP_CONFIG.volumeStorageKey, String(this.volumeIndex));
    return this.applyVolume();
  }

  async playFrequency(frequency, duration = 0.35) {
    await this.ensureRunning();

    if (!frequency || this.masterGain.gain.value === 0) {
      return;
    }

    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sine';
    osc.frequency.value = frequency;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.8, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }
}
