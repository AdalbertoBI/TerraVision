import { APP_CONFIG } from './config.js';

const DEFAULT_THERAPY_CONFIG = {
  sessionLength: 180,
  dwellMultiplier: 1,
  minimumConfidence: 0.55
};

export class TherapyMode {
  constructor() {
    this.config = this.loadConfig();
    this.active = false;
    this.stats = null;
    this.intervalId = null;
    this.callbacks = { onUpdate: () => {}, onComplete: () => {} };
  }

  loadConfig() {
    try {
      const stored = localStorage.getItem(APP_CONFIG.therapyStorageKey);
      if (!stored) {
        return { ...DEFAULT_THERAPY_CONFIG };
      }
      return { ...DEFAULT_THERAPY_CONFIG, ...JSON.parse(stored) };
    } catch (error) {
      console.warn('Falha ao carregar configuração terapêutica', error);
      return { ...DEFAULT_THERAPY_CONFIG };
    }
  }

  saveConfig(config) {
    try {
      localStorage.setItem(APP_CONFIG.therapyStorageKey, JSON.stringify(config));
    } catch (error) {
      console.warn('Falha ao salvar configuração terapêutica', error);
    }
  }

  getConfig() {
    return { ...this.config };
  }

  start(config, callbacks = {}) {
    if (this.active) {
      this.stop({ reason: 'restart' });
    }

    const sanitized = {
      sessionLength: Math.max(60, Math.round(config.sessionLength || this.config.sessionLength)),
      dwellMultiplier: Math.min(2, Math.max(0.5, Number(config.dwellMultiplier || this.config.dwellMultiplier))),
      minimumConfidence: Math.min(0.9, Math.max(0.4, Number(config.minimumConfidence || this.config.minimumConfidence)))
    };

    this.config = { ...this.config, ...sanitized };
    this.saveConfig(this.config);

    this.stats = {
      startedAt: performance.now(),
      hits: 0,
      attempts: 0,
      elapsed: 0
    };

    this.callbacks = {
      onUpdate: callbacks.onUpdate || (() => {}),
      onComplete: callbacks.onComplete || (() => {})
    };

    this.active = true;

    this.intervalId = window.setInterval(() => {
      this.stats.elapsed = Math.floor((performance.now() - this.stats.startedAt) / 1000);
      const remaining = Math.max(0, this.config.sessionLength - this.stats.elapsed);
      this.callbacks.onUpdate({
        elapsed: this.stats.elapsed,
        remaining,
        hits: this.stats.hits,
        total: this.stats.attempts
      });
      if (remaining <= 0) {
        this.stop({ reason: 'time' });
      }
    }, 1000);

    return this.getSessionState();
  }

  recordActivation({ success }) {
    if (!this.active || !this.stats) {
      return;
    }
    this.stats.attempts += 1;
    if (success) {
      this.stats.hits += 1;
    }
    this.callbacks.onUpdate({
      elapsed: this.stats.elapsed,
      remaining: Math.max(0, this.config.sessionLength - this.stats.elapsed),
      hits: this.stats.hits,
      total: this.stats.attempts
    });
  }

  stop({ reason = 'manual' } = {}) {
    if (!this.active) {
      return this.getSessionState();
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.stats.elapsed = Math.floor((performance.now() - this.stats.startedAt) / 1000);
    const summary = this.getSessionState();
    this.active = false;
    this.callbacks.onComplete(summary, reason);
    return summary;
  }

  getSessionState() {
    if (!this.stats) {
      return null;
    }
    const elapsed = Math.floor((performance.now() - this.stats.startedAt) / 1000);
    const remaining = Math.max(0, this.config.sessionLength - elapsed);
    return {
      ...this.stats,
      elapsed,
      remaining,
      config: { ...this.config }
    };
  }

  getAdjustedDwell(base) {
    return base * (this.config?.dwellMultiplier || 1);
  }

  getConfidenceThreshold(base) {
    return Math.max(base, this.config?.minimumConfidence || base);
  }
}
