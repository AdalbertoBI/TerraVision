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
  this.lastGaze = null;
  this.roiCanvas = null;
  this.roiContext = null;
  this.filteredGaze = null;
  this.smoothingAlpha = 0.3;
  this.roiZoomFactor = 2.0;
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

    // Carregar modelo salvo do localStorage se disponível
    try {
      if (window.webgazer.loadModelFromLocalStorage) {
        const loaded = await window.webgazer.loadModelFromLocalStorage();
        if (loaded) {
          console.log('[GazeTracker] Modelo carregado do localStorage com sucesso.');
        }
      }
    } catch (error) {
      console.warn('[GazeTracker] Não foi possível carregar modelo do localStorage:', error);
    }

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

      this.lastGaze = { ...smoothed };

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

    // Smoothing exponencial: alpha 0.3 para nova amostra, 0.7 para histórico
    const alpha = Number.isFinite(this.smoothingAlpha) ? this.smoothingAlpha : 0.3;
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
    let width = Math.max(8, Math.round((maxX - minX) * videoWidth));
    let height = Math.max(8, Math.round((maxY - minY) * videoHeight));

    if (width <= 0 || height <= 0) {
      return;
    }

    let sourceX = Math.round(minX * videoWidth);
    let sourceY = Math.round(minY * videoHeight);

    // Aplicar zoom 2x: aumentar região de interesse nos olhos
    const zoomFactor = this.roiZoomFactor ?? 2.0;
    const centerX = sourceX + width / 2;
    const centerY = sourceY + height / 2;
    const zoomedWidth = Math.round(width * zoomFactor);
    const zoomedHeight = Math.round(height * zoomFactor);
    sourceX = Math.max(0, Math.round(centerX - zoomedWidth / 2));
    sourceY = Math.max(0, Math.round(centerY - zoomedHeight / 2));
    sourceX = Math.min(sourceX, videoWidth - zoomedWidth);
    sourceY = Math.min(sourceY, videoHeight - zoomedHeight);
    width = Math.min(zoomedWidth, videoWidth - sourceX);
    height = Math.min(zoomedHeight, videoHeight - sourceY);

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
      
      // Aplicar contrast enhancement para melhorar detecção dos olhos
      this.enhanceContrast(this.roiContext, targetWidth, targetHeight);
      
      // Passar ROI com zoom para o WebGazer processar
      const tracker = window.webgazer?.getTracker?.();
      if (tracker?.processVideo) {
        tracker.processVideo(this.roiCanvas);
      }
    } catch (error) {
      console.warn('[GazeTracker][ROI]', error);
    }
  }

  enhanceContrast(context, width, height) {
    if (!context) {
      return;
    }

    try {
      const imageData = context.getImageData(0, 0, width, height);
      const data = imageData.data;
      
      // Aplicar aumento de contraste simples para melhorar detecção dos olhos
      const contrastFactor = 1.5;
      const brightness = 1.1;
      
      for (let i = 0; i < data.length; i += 4) {
        // Converter para escala de cinza e aplicar contraste
        const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const enhanced = Math.min(255, Math.max(0, gray * contrastFactor * brightness));
        
        data[i] = data[i + 1] = data[i + 2] = enhanced;
        // Alpha permanece inalterado (data[i + 3])
      }
      
      context.putImageData(imageData, 0, 0);
    } catch (error) {
      console.warn('[GazeTracker][enhanceContrast]', error);
    }
  }

  getCurrentEyeState() {
    const metrics = this.lastFaceMetrics;

    const clonePoint = (point) => (point ? { ...point } : null);
    const cloneBox = (box) =>
      box
        ? {
            minX: box.minX,
            minY: box.minY,
            maxX: box.maxX,
            maxY: box.maxY
          }
        : null;

    return {
      timestamp: performance.now(),
      gaze: this.lastGaze ? { ...this.lastGaze } : null,
      metrics: metrics
        ? {
            ear: metrics.ear,
            leftEar: metrics.leftEar,
            rightEar: metrics.rightEar,
            irisLeft: clonePoint(metrics.irisLeft),
            irisRight: clonePoint(metrics.irisRight),
            gaze: clonePoint(metrics.gaze),
            roi: cloneBox(metrics.roi)
          }
        : null
    };
  }

  async saveModelToStorage() {
    try {
      if (window.webgazer?.saveModelToLocalStorage) {
        await window.webgazer.saveModelToLocalStorage();
        console.log('[GazeTracker] Modelo salvo no localStorage com sucesso.');
        return true;
      }
    } catch (error) {
      console.warn('[GazeTracker] Falha ao salvar modelo no localStorage:', error);
    }
    return false;
  }

  async loadModelFromStorage() {
    try {
      if (window.webgazer?.loadModelFromLocalStorage) {
        const loaded = await window.webgazer.loadModelFromLocalStorage();
        if (loaded) {
          console.log('[GazeTracker] Modelo carregado do localStorage com sucesso.');
          return true;
        }
      }
    } catch (error) {
      console.warn('[GazeTracker] Falha ao carregar modelo do localStorage:', error);
    }
    return false;
  }

  clearStoredModel() {
    try {
      if (window.webgazer?.clearData) {
        window.webgazer.clearData();
        console.log('[GazeTracker] Modelo limpo do localStorage.');
        return true;
      }
    } catch (error) {
      console.warn('[GazeTracker] Falha ao limpar modelo:', error);
    }
    return false;
  }
}
