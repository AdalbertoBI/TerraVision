import { APP_CONFIG } from './config.js';
import { BlinkDetector } from './blinkDetector.js';
import { FaceMeshProcessor } from './faceMeshProcessor.js';

export class GazeTracker {
  constructor({ onGaze, onBlink, announce }) {
    this.onGaze = onGaze;
    this.onBlink = onBlink;
    this.announce = announce;
    this.blinkDetector = null;
    this.webgazerConfigured = false;
    this.minConfidence = APP_CONFIG.minConfidence;
    this.videoElement = null;
    this.videoStream = null;
  this.faceMesh = null;
  this.faceMeshAvailable = false;
  this.lastFaceMetrics = null;
  this.lastFaceMetricsAt = 0;
  this.refinementAlpha = 0.35;
  }

  setConfidenceThreshold(threshold) {
    this.minConfidence = threshold;
  }

  getConfidenceThreshold() {
    return this.minConfidence;
  }

  async setup() {
    if (!window.webgazer) {
      throw new Error('WebGazer não disponível. Verifique se o script foi carregado.');
    }

    if (this.webgazerConfigured) {
      return;
    }

    if (this.videoElement && window.webgazer.setVideoElement) {
      window.webgazer.setVideoElement(this.videoElement);
    } else if (this.videoElement && window.webgazer.params) {
      window.webgazer.params.videoElement = this.videoElement;
    }

    if (this.videoElement) {
      this.prepareFaceMesh();
    }

    if (this.videoStream && window.webgazer.setVideoStream) {
      window.webgazer.setVideoStream(this.videoStream);
    } else if (this.videoStream && window.webgazer.params) {
      window.webgazer.params.videoStream = this.videoStream;
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

      const refined = this.refineWithFaceMesh(gaze);
      this.onGaze?.(refined);
    });

    try {
      await window.webgazer.begin();
      this.webgazerConfigured = true;
      this.announce?.('Rastreamento ativo. Foque em uma fatia para tocar com piscada.');
      if (this.faceMeshAvailable) {
        this.announce?.('Piscadas são detectadas via MediaPipe Face Mesh para maior precisão.');
      }
    } catch (error) {
      console.error(error);
      throw new Error('Falha ao iniciar WebGazer. Permissões de câmera são necessárias.');
    }
  }

  setVideoElement(element) {
    this.videoElement = element ?? null;
    if (element && window.webgazer?.setVideoElement) {
      window.webgazer.setVideoElement(element);
    } else if (element && window.webgazer?.params) {
      window.webgazer.params.videoElement = element;
    }
    if (element) {
      this.prepareFaceMesh();
    }
  }

  setVideoStream(stream) {
    this.videoStream = stream ?? null;
    if (stream && window.webgazer?.setVideoStream) {
      window.webgazer.setVideoStream(stream);
    } else if (stream && window.webgazer?.params) {
      window.webgazer.params.videoStream = stream;
    }
  }

  async startBlinkDetector() {
    if (!this.blinkDetector) {
      this.blinkDetector = new BlinkDetector({
        threshold: APP_CONFIG.blinkThreshold,
        minDuration: APP_CONFIG.blinkMinDuration,
        cooldown: APP_CONFIG.blinkCooldown,
        onBlink: () => this.onBlink?.()
      });
    }

    if (!this.faceMesh && window.FaceMesh && this.videoElement) {
      this.prepareFaceMesh();
    }

    if (this.faceMesh) {
      this.blinkDetector.attachExternalSource((listener) => this.faceMesh.subscribe(listener));
      try {
        await this.faceMesh.start();
        this.faceMeshAvailable = true;
      } catch (error) {
        console.warn('Não foi possível iniciar o Face Mesh. Retornando ao detector padrão.', error);
        this.faceMeshAvailable = false;
        this.blinkDetector.detachExternalSource();
      }
    }

    this.blinkDetector.start();
    return true;
  }

  stop() {
    if (this.blinkDetector) {
      this.blinkDetector.stop();
    }
    window.webgazer?.pause?.();
    if (this.faceMesh) {
      this.faceMesh.stop();
    }
  }

  prepareFaceMesh() {
    if (!this.videoElement) {
      return;
    }
    if (this.faceMesh) {
      this.faceMesh.setVideoElement(this.videoElement);
      return;
    }
    if (!window.FaceMesh) {
      return;
    }
    this.faceMesh = new FaceMeshProcessor({
      videoElement: this.videoElement,
      maxFps: 28,
      onMetrics: (metrics) => this.handleFaceMetrics(metrics),
      onError: (error) => console.warn('[FaceMesh] erro', error)
    });
  }

  handleFaceMetrics(metrics) {
    if (!metrics) {
      return;
    }
    this.lastFaceMetrics = metrics;
    this.lastFaceMetricsAt = metrics.timestamp ?? performance.now();
  }

  refineWithFaceMesh(gaze) {
    const metrics = this.lastFaceMetrics;
    if (!metrics?.gaze || !this.videoElement) {
      return gaze;
    }
    const now = performance.now();
    if (now - this.lastFaceMetricsAt > 140) {
      return gaze;
    }

    const rect = this.videoElement.getBoundingClientRect?.();
    if (!rect || rect.width === 0 || rect.height === 0) {
      return gaze;
    }

    const clamp01 = (value) => Math.min(1, Math.max(0, value));
    const normalizedX = clamp01(metrics.gaze.x ?? 0.5);
    const normalizedY = clamp01(metrics.gaze.y ?? 0.5);

    const mirroredX = 1 - normalizedX;
    const faceX = rect.left + mirroredX * rect.width;
    const faceY = rect.top + normalizedY * rect.height;

    const alpha = clamp01(this.refinementAlpha ?? 0.35);

    return {
      ...gaze,
      x: gaze.x * (1 - alpha) + faceX * alpha,
      y: gaze.y * (1 - alpha) + faceY * alpha,
      confidence: Math.max(gaze.confidence ?? 0, metrics.ear ? 0.6 : 0.45)
    };
  }
}
