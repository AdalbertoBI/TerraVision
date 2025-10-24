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
  this.roiCanvas = null;
  this.roiContext = null;
  this.filteredGaze = null;
  this.smoothingAlpha = 0.2;
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
        this.resetSmoothing();
        this.onGaze?.(null);
        return;
      }

      const gaze = {
        x: data.smoothX ?? data.x,
        y: data.smoothY ?? data.y,
        confidence: data.confidence ?? 0
      };

      const refined = this.refineWithFaceMesh({ ...gaze });
      const smoothed = this.applySmoothing(refined);

      if (gaze.confidence < this.minConfidence) {
        this.onGaze?.({ ...smoothed, lowConfidence: true });
        return;
      }

      this.onGaze?.(smoothed);
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
    this.faceMesh.setOptions({
      refineLandmarks: true,
      minDetectionConfidence: 0.75,
      minTrackingConfidence: 0.75
    });
  }

  handleFaceMetrics(metrics) {
    if (!metrics) {
      return;
    }
    this.lastFaceMetrics = metrics;
    this.lastFaceMetricsAt = metrics.timestamp ?? performance.now();
    this.ensureRoiCanvas();
    this.updateEyeROI(metrics);
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

  applySmoothing(gaze) {
    if (!gaze || !Number.isFinite(gaze.x) || !Number.isFinite(gaze.y)) {
      return gaze;
    }

    if (!this.filteredGaze) {
      this.filteredGaze = { x: gaze.x, y: gaze.y, confidence: gaze.confidence ?? 0 };
      return { ...gaze };
    }

    const alpha = Number.isFinite(this.smoothingAlpha) ? this.smoothingAlpha : 0.2;
    this.filteredGaze.x = this.filteredGaze.x * (1 - alpha) + gaze.x * alpha;
    this.filteredGaze.y = this.filteredGaze.y * (1 - alpha) + gaze.y * alpha;
    const confidence = Math.max(gaze.confidence ?? 0, this.filteredGaze.confidence ?? 0);
    this.filteredGaze.confidence = confidence;

    return {
      ...gaze,
      x: this.filteredGaze.x,
      y: this.filteredGaze.y,
      confidence
    };
  }

  resetSmoothing() {
    this.filteredGaze = null;
  }

  ensureRoiCanvas() {
    if (this.roiCanvas && this.roiContext) {
      return;
    }
    const existing = document.getElementById('roi-canvas');
    if (existing && existing instanceof HTMLCanvasElement) {
      this.roiCanvas = existing;
      this.roiContext = existing.getContext('2d', { willReadFrequently: true });
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.id = 'roi-canvas';
    canvas.width = 240;
    canvas.height = 120;
    canvas.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:0;height:0;display:none;';
    document.body.appendChild(canvas);
    this.roiCanvas = canvas;
    this.roiContext = canvas.getContext('2d', { willReadFrequently: true });
  }

  updateEyeROI(metrics) {
    if (!this.videoElement || !this.roiCanvas || !this.roiContext) {
      return;
    }

    const bounds = metrics.roi ?? metrics.roiLeft ?? metrics.roiRight;
    if (!bounds) {
      return;
    }

    const videoWidth = this.videoElement.videoWidth || this.videoElement.width || this.videoElement.clientWidth || 0;
    const videoHeight = this.videoElement.videoHeight || this.videoElement.height || this.videoElement.clientHeight || 0;
    if (!videoWidth || !videoHeight) {
      return;
    }

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const minX = clamp(bounds.minX ?? 0, 0, 1);
    const minY = clamp(bounds.minY ?? 0, 0, 1);
    const maxX = clamp(bounds.maxX ?? 1, 0, 1);
    const maxY = clamp(bounds.maxY ?? 1, 0, 1);
    const width = Math.max(8, Math.round((maxX - minX) * videoWidth));
    const height = Math.max(8, Math.round((maxY - minY) * videoHeight));

    if (width <= 0 || height <= 0) {
      return;
    }

    const sourceX = Math.round(minX * videoWidth);
    const sourceY = Math.round(minY * videoHeight);

    const targetWidth = 240;
    const aspect = height / width;
    const targetHeight = Math.max(80, Math.round(targetWidth * aspect));

    if (this.roiCanvas.width !== targetWidth || this.roiCanvas.height !== targetHeight) {
      this.roiCanvas.width = targetWidth;
      this.roiCanvas.height = targetHeight;
    }

    try {
      this.roiContext.clearRect(0, 0, targetWidth, targetHeight);
      this.roiContext.drawImage(
        this.videoElement,
        sourceX,
        sourceY,
        width,
        height,
        0,
        0,
        targetWidth,
        targetHeight
      );
      const tracker = window.webgazer?.getTracker?.();
      if (tracker?.processVideo) {
        tracker.processVideo(this.roiCanvas);
      }
    } catch (error) {
      console.warn('[GazeTracker][ROI]', error);
    }
  }
}
