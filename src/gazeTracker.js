import { APP_CONFIG } from './config.js';
import { BlinkDetector } from './blinkDetector.js';

export class GazeTracker {
  constructor({ onGaze, onBlink, announce }) {
    this.onGaze = onGaze;
    this.onBlink = onBlink;
    this.announce = announce;
    this.blinkDetector = null;
    this.webgazerConfigured = false;
    this.minConfidence = APP_CONFIG.minConfidence;
  }

  setConfidenceThreshold(threshold) {
    this.minConfidence = threshold;
  }

  async setup() {
    if (!window.webgazer) {
      throw new Error('WebGazer não disponível. Verifique se o script foi carregado.');
    }

    if (this.webgazerConfigured) {
      return;
    }

    window.webgazer.setRegression('ridge');
    window.webgazer.setTracker('TFFacemesh');
    window.webgazer.showVideo(false);
    window.webgazer.showFaceFeedbackBox(false);
    window.webgazer.showPredictionPoints(false);

    window.webgazer.setGazeListener((data) => {
      if (!data) {
        this.onGaze?.(null);
        return;
      }

      const gaze = {
        x: data.smoothX ?? data.x,
        y: data.smoothY ?? data.y,
        confidence: data.confidence ?? 0
      };

      if (gaze.confidence < this.minConfidence) {
        this.onGaze?.(null);
        return;
      }

      this.onGaze?.(gaze);
    });

    try {
      await window.webgazer.begin();
      this.webgazerConfigured = true;
      this.announce?.('Rastreamento ativo. Foque em uma fatia para tocar com piscada.');
    } catch (error) {
      console.error(error);
      throw new Error('Falha ao iniciar WebGazer. Permissões de câmera são necessárias.');
    }
  }

  startBlinkDetector() {
    if (this.blinkDetector) {
      this.blinkDetector.start();
      return;
    }

    this.blinkDetector = new BlinkDetector({
      threshold: APP_CONFIG.blinkThreshold,
      minDuration: APP_CONFIG.blinkMinDuration,
      cooldown: APP_CONFIG.blinkCooldown,
      onBlink: () => this.onBlink?.()
    });

    this.blinkDetector.start();
  }

  stop() {
    if (this.blinkDetector) {
      this.blinkDetector.stop();
    }
    window.webgazer?.pause?.();
  }
}
