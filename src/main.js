import { APP_CONFIG, DEFAULT_NOTES } from './config.js';
import { AudioEngine } from './audio.js';
import { ControlManager } from './controlManager.js';
import { PizzaRenderer } from './pizzaRenderer.js';
import { UIManager } from './ui.js';
import { CalibrationManager } from './calibration.js';
import { GazeTracker } from './gazeTracker.js';

const WEBGAZER_LOCAL_SRC = 'libs/webgazer.js';
const WEBGAZER_CDN_SRC = 'https://webgazer.cs.brown.edu/webgazer.js';

let webgazerLoadPromise = null;

function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    script.async = false;
    script.crossOrigin = 'anonymous';
    script.dataset.webgazerLoader = 'dynamic';

    const cleanup = () => {
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
    };

    const handleLoad = () => {
      cleanup();
      resolve();
    };

    const handleError = () => {
      cleanup();
      script.remove();
      reject(new Error(`Falha ao carregar script ${src}`));
    };

    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });
    document.head.appendChild(script);
  });
}

function withTimeout(promise, timeout, label) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(label ?? 'Tempo limite excedido.'));
    }, timeout);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

async function loadWebGazer({ timeout = 5000 } = {}) {
  if (typeof window === 'undefined') {
    throw new Error('Ambiente sem suporte a window para carregar WebGazer.');
  }
  if (window.webgazer) {
    return window.webgazer;
  }
  if (webgazerLoadPromise) {
    return webgazerLoadPromise;
  }

  const attemptLoad = async () => {
    const localScript = document.querySelector(`script[src="${WEBGAZER_LOCAL_SRC}"]`);
    if (localScript && !localScript.hasAttribute('data-webgazer-preload')) {
      localScript.setAttribute('data-webgazer-preload', 'true');
    }

    try {
      if (!window.webgazer) {
        await withTimeout(loadScriptOnce(WEBGAZER_LOCAL_SRC), timeout, 'Timeout ao carregar WebGazer local.');
      }
    } catch (localError) {
      console.warn('[WebGazer] Falha ao carregar versão local. Tentando CDN...', localError);
      await withTimeout(loadScriptOnce(WEBGAZER_CDN_SRC), timeout, 'Timeout ao carregar WebGazer via CDN.');
    }

    if (!window.webgazer) {
      throw new Error('WebGazer carregado, porém objeto global indisponível.');
    }

    return window.webgazer;
  };

  webgazerLoadPromise = attemptLoad()
    .catch((error) => {
      webgazerLoadPromise = null;
      document.body?.setAttribute('data-webgazer-missing', 'true');
      throw error;
    });

  return webgazerLoadPromise;
}

class TerraVisionCore {
  constructor() {
    this.notes = [];
    this.audio = new AudioEngine();
    this.ui = new UIManager();
    this.renderer = null;
    this.calibration = null;
    this.controlManager = null;
    this.gazeTracker = null;
    this.webcamEl = null;
    this.cameraStream = null;

    this.lastGaze = null;
    this.rawGaze = null;
    this.focusedSlice = null;
    this.isTracking = false;
    this.isCalibrating = false;
    this.calibrationSummary = null;
    this.autoStartRegistered = false;
  this.mouseFallbackEnabled = false;
  this.mouseFallbackCleanup = null;
  this.webcamReadyHandled = false;
    this.pendingBlinkValidation = [];
    this.passiveLearningEnabled = true;
    this.passiveThrottleMs = 420;
    this.lastPassiveSampleAt = 0;
    this.isBootstrapComplete = Boolean(localStorage.getItem('terraCalibrationBootstrapped') === 'true');

    this.handleGaze = this.handleGaze.bind(this);
    this.handleBlink = this.handleBlink.bind(this);
  this.onWebcamLoaded = this.onWebcamLoaded.bind(this);
    this.handlePassiveClick = this.handlePassiveClick.bind(this);
  }

  async init() {
    await this.loadNotes();

    const canvas = document.getElementById('pizza-canvas');
    this.renderer = new PizzaRenderer(canvas, this.notes);

    this.calibration = new CalibrationManager(
      this.ui.stageEl,
      () => this.rawGaze,
      (message) => this.ui.updateStatus(message)
    );

    if (!this.isBootstrapComplete) {
      this.calibration.startPassiveBootstrap({
        pointCount: 9,
        onProgress: (remaining) => {
          if (remaining > 0) {
            this.ui.updateStatus(`Clique nos ${remaining} pontos destacados para ensinar o sistema.`);
          }
        },
        onComplete: () => {
          this.markBootstrapComplete();
        }
      });
    }

    this.gazeTracker = new GazeTracker({
      onGaze: this.handleGaze,
      onBlink: this.handleBlink,
      announce: (message) => this.ui.updateStatus(message)
    });

    this.webcamEl = document.getElementById('webcam');
    if (this.webcamEl) {
      this.ui.attachCameraPreview(this.webcamEl);
    }

    const buttons = this.ui.getControlButtons();
    if (buttons.length) {
      this.controlManager = new ControlManager(buttons, {
        dwellDuration: APP_CONFIG.dwellDuration,
        onActivate: (action, source) => {
          this.handleControlActivation(action, source);
        },
        onFocusChange: ({ state }) => {
          this.handleControlFocusState(state);
        }
      });
    }

    this.setupEventHandlers();
    this.setupResizeHandling();
    this.registerPassiveCalibration();

    if (!this.warnIfInsecureContext()) {
      if (this.isBootstrapComplete) {
        this.ui.updateStatus('Clique onde olhar para continuar ensinando o sistema enquanto toca com piscadas.');
      } else {
        this.ui.updateStatus('Clique nos pontos da pizza para o aprendizado inicial do gaze.');
      }
    }

    const cameraReady = await this.initCamera();
    let webgazerReady = true;
    try {
      await loadWebGazer();
    } catch (error) {
      webgazerReady = false;
      console.error('Falha ao carregar WebGazer durante a inicialização.', error);
      this.ui.updateStatus('Não foi possível carregar o WebGazer. Modo fallback por mouse ativado.');
      this.enableMouseFallback();
    }

    await this.ensureTrackingPipeline(cameraReady && webgazerReady);
  }

  warnIfInsecureContext() {
    const protocol = window.location.protocol;
    const host = window.location.hostname;
    if (protocol === 'file:') {
      this.ui.updateStatus('Execute o Terra Vision por meio de http://localhost usando um servidor local gratuito (ex.: python -m http.server 8000).');
      return true;
    }
    if (protocol === 'http:' && host && host !== 'localhost') {
      this.ui.updateStatus(`Use a URL http://localhost para ativar o WebGazer (endereço atual: ${host}).`);
      return true;
    }
    return false;
  }

  setupEventHandlers() {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'f') {
        this.requestFullscreen();
      }
      if (event.key === 'Escape') {
        this.exitFullscreen();
      }
    });
  }

  registerAutoStartFallback() {
    if (this.autoStartRegistered || this.isTracking) {
      return;
    }

    this.autoStartRegistered = true;
    this.ui.updateStatus('Autorize o acesso à câmera. Se o aviso não aparecer, clique ou toque na tela para tentar novamente.');

    const handleInteraction = async () => {
      document.removeEventListener('pointerdown', handleInteraction);
      this.autoStartRegistered = false;
      await this.initCamera(true);
      if (this.webcamEl) {
        this.gazeTracker.setVideoElement(this.webcamEl);
        this.gazeTracker.setVideoStream(this.cameraStream);
      }
      const started = await this.startTracking();
      if (!started) {
        this.registerAutoStartFallback();
      }
    };

    document.addEventListener('pointerdown', handleInteraction, { once: true });
  }

  registerPassiveCalibration() {
    if (!this.passiveLearningEnabled) {
      return;
    }

    document.removeEventListener('click', this.handlePassiveClick, true);
    document.addEventListener('click', this.handlePassiveClick, true);
  }

  handlePassiveClick(event) {
    if (!this.passiveLearningEnabled || !window.webgazer) {
      return;
    }
    if (event.button !== 0) {
      return;
    }

    const now = performance.now();
    if (now - this.lastPassiveSampleAt < this.passiveThrottleMs) {
      return;
    }
    this.lastPassiveSampleAt = now;

    const x = event.clientX;
    const y = event.clientY;
    const stageRect = this.ui.stageEl?.getBoundingClientRect();
    if (stageRect) {
      const insideStage = x >= stageRect.left && x <= stageRect.right && y >= stageRect.top && y <= stageRect.bottom;
      if (!insideStage) {
        return;
      }
    }
    const eyeState = this.gazeTracker?.getCurrentEyeState?.() ?? null;

    try {
      window.webgazer.recordScreenPosition?.(x, y, 'click', eyeState ?? undefined);
      
      // Salvar modelo persistente após cada clique
      if (window.webgazer.saveModelToLocalStorage) {
        window.webgazer.saveModelToLocalStorage().catch((error) => {
          console.warn('[PassiveCalibration] Falha ao salvar modelo:', error);
        });
      }
      
      console.log('[PassiveCalibration] Aprendido passivamente em', x, y);
    } catch (error) {
      console.warn('[PassiveCalibration] Falha ao registrar clique', error);
    }

    this.pendingBlinkValidation.push({
      timestamp: now,
      x,
      y,
      validated: false,
      eyeState
    });

    this.updateSliceFromScreenPoint({ x, y });

    if (!this.isBootstrapComplete) {
      const progress = this.calibration?.registerPassiveClick({ x, y });
      if (progress?.completed) {
        this.markBootstrapComplete();
      } else if (progress && Number.isFinite(progress.remaining) && progress.remaining > 0) {
        this.ui.updateStatus(`Restam ${progress.remaining} pontos para concluir o aprendizado inicial.`);
      }
    }
  }

  setupResizeHandling() {
    window.addEventListener('resize', () => {
      this.renderer?.resize();
      this.controlManager?.refreshRects();
      this.calibration?.refreshPassiveBootstrap?.();
    });
  }

  async initCamera(force = false) {
    if (this.cameraStream && !force) {
      return true;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      this.ui.updateStatus('Seu navegador não suporta captura de vídeo com getUserMedia.');
      return false;
    }
    if (!this.webcamEl) {
      this.webcamEl = document.getElementById('webcam');
      if (this.webcamEl) {
        this.ui.attachCameraPreview(this.webcamEl);
      }
    }
    if (!this.webcamEl) {
      this.ui.updateStatus('Elemento de vídeo não encontrado para iniciar a câmera.');
      return false;
    }

    this.webcamEl.width = 640;
    this.webcamEl.height = 480;
    this.webcamEl.setAttribute('playsinline', 'true');

    try {
      const constraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      this.cameraStream?.getTracks?.().forEach((track) => track.stop());
      this.cameraStream = stream;
      this.webcamEl.srcObject = stream;

      this.webcamReadyHandled = false;
      this.webcamEl.addEventListener('loadedmetadata', this.onWebcamLoaded, { once: true });
      if (this.webcamEl.readyState >= this.webcamEl.HAVE_METADATA) {
        this.onWebcamLoaded();
      }

      const playPromise = this.webcamEl.play?.();
      if (playPromise instanceof Promise) {
        await playPromise.catch(() => {});
      }

      this.webcamEl.style.display = 'block';
      this.mouseFallbackEnabled && this.disableMouseFallback();
      return true;
    } catch (error) {
      console.error('Falha ao iniciar a câmera:', error);
      this.ui.updateStatus('Permita o acesso à câmera para ativar o rastreamento ocular.');
      try {
        alert('Permita o acesso à câmera para o rastreamento por olhar.');
      } catch (alertError) {
        console.warn('Não foi possível exibir alerta de permissão.', alertError);
      }
      this.enableMouseFallback();
      return false;
    }
  }

  async ensureTrackingPipeline(cameraReady) {
    if (cameraReady && this.webcamEl) {
      this.setupGazeVideoBindings();
    }

    const trackingStarted = cameraReady ? await this.startTracking() : false;
    if (!trackingStarted) {
      this.registerAutoStartFallback();
    }
  }

  onWebcamLoaded() {
    if (this.webcamReadyHandled) {
      return;
    }
    this.webcamReadyHandled = true;
    this.ui.updateStatus('Câmera carregada com sucesso. Preparando rastreamento.');
    this.setupGazeVideoBindings();
    void this.startTracking();
  }

  setupGazeVideoBindings() {
    if (!this.webcamEl) {
      return;
    }
    this.gazeTracker.setVideoElement(this.webcamEl);
    if (this.cameraStream) {
      this.gazeTracker.setVideoStream(this.cameraStream);
    }
  }

  enableMouseFallback() {
    if (this.mouseFallbackEnabled) {
      return;
    }
    this.mouseFallbackEnabled = true;
    this.ui.updateStatus('Modo fallback por mouse ativo. Use o cursor para interagir enquanto a câmera não está disponível.');

    const handlePointerMove = (event) => {
      const synthetic = {
        x: event.clientX,
        y: event.clientY,
        confidence: 1
      };
      this.handleGaze(synthetic);
    };

    document.addEventListener('pointermove', handlePointerMove);
    this.mouseFallbackCleanup = () => {
      document.removeEventListener('pointermove', handlePointerMove);
    };

    if (window.webgazer?.params) {
      window.webgazer.params.showVideo = false;
    }
  }

  disableMouseFallback() {
    if (!this.mouseFallbackEnabled) {
      return;
    }
    this.mouseFallbackCleanup?.();
    this.mouseFallbackCleanup = null;
    this.mouseFallbackEnabled = false;
  }

  async loadNotes() {
    try {
      const response = await fetch(APP_CONFIG.notesEndpoint, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      this.notes = Array.isArray(data.notes) && data.notes.length ? data.notes : DEFAULT_NOTES;
    } catch (error) {
      console.warn('Falha ao carregar notes.json, aplicando fallback embutido.', error);
      this.notes = DEFAULT_NOTES;
    }
    this.applyNotePalette();
  }

  applyNotePalette() {
    const palette = DEFAULT_NOTES.map((note) => note.color).filter(Boolean);
    if (!palette.length) {
      return;
    }

    this.notes = this.notes.map((note, index) => {
      if (note.color) {
        return note;
      }
      const fallback = palette[index % palette.length] || palette[palette.length - 1];
      return { ...note, color: fallback };
    });

    this.renderer?.setNotes(this.notes);
  }

  async startTracking() {
    if (this.isTracking) {
      return true;
    }

    this.ui.updateStatus('Ativando rastreamento ocular. Permita o acesso à câmera quando solicitado.');

    try {
      const webgazerInstance = await loadWebGazer();
      if (!webgazerInstance) {
        throw new Error('WebGazer não carregou.');
      }
      const cameraReady = await this.initCamera();
      if (!cameraReady) {
        throw new Error('Não foi possível iniciar a câmera.');
      }
      await this.audio.ensureRunning();

      if (this.webcamEl) {
        this.gazeTracker.setVideoElement(this.webcamEl);
      }
      if (this.cameraStream) {
        this.gazeTracker.setVideoStream(this.cameraStream);
      }

      this.gazeTracker.setConfidenceThreshold(APP_CONFIG.minConfidence);
      await this.gazeTracker.setup();
      if (APP_CONFIG.showPredictionDots && window.webgazer?.showPredictionPoints) {
        window.webgazer.showPredictionPoints(true);
      }
  await this.gazeTracker.startBlinkDetector();

    this.isTracking = true;
      this.ui.updateStatus('Rastreamento ativo. Foque em uma fatia colorida e pisque para tocar.');
      return true;
    } catch (error) {
      console.error('Falha ao iniciar rastreamento:', error);
      this.isTracking = false;
      if (error?.message?.includes('WebGazer')) {
        this.ui.updateStatus('Não foi possível carregar o WebGazer. Utilizando modo fallback por mouse.');
        this.enableMouseFallback();
      } else {
        this.ui.updateStatus('Não foi possível acessar a câmera. Verifique permissões e tente novamente.');
      }
      return false;
    }
  }

  handleGaze(data) {
    if (!data) {
      this.rawGaze = null;
      this.lastGaze = null;
      this.ui.updateGazeDot(null);
      this.controlManager?.handleGaze(null);
      this.updateSlice(null);
      return;
    }

    this.rawGaze = data;
    const adjusted = this.calibration?.transform(data) ?? data;

    this.lastGaze = adjusted;

    const interactingWithControl = this.controlManager?.handleGaze(adjusted) ?? false;
    if (!interactingWithControl) {
      if (data.lowConfidence) {
        this.ui.setGazeState('low');
      } else {
        this.ui.setGazeState('tracking');
      }
      this.updateSliceFromScreenPoint(adjusted);
    } else {
      this.updateSlice(null);
    }

    const confidence = data.confidence ?? this.rawGaze?.confidence ?? APP_CONFIG.minConfidence;
    this.ui.updateHeatmap(adjusted, confidence);
    this.ui.updateGazeDot(adjusted, { state: data.lowConfidence ? 'low' : undefined, clampToStage: !data.lowConfidence });
  }

  handleBlink() {
    if (!this.isTracking && !this.mouseFallbackEnabled) {
      return;
    }
    this.ui.triggerBlinkAnimation();
    this.validateRecentPassiveSample();
    this.triggerBlinkInteraction();
    if (this.controlManager?.handleBlink()) {
      this.audio.playFrequency(880, 0.12);
      return;
    }

    if (this.focusedSlice !== null) {
      const note = this.notes[this.focusedSlice];
      if (note) {
        this.audio.playFrequency(note.frequency);
        this.ui.updateStatus(`Nota ${note.label} reproduzida.`);
      }
    }
  }

  triggerBlinkInteraction() {
    const gazeSource = this.lastGaze ?? this.rawGaze;
    if (!gazeSource) {
      return;
    }
    const target = document.elementFromPoint(gazeSource.x, gazeSource.y);
    if (!target) {
      return;
    }
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      clientX: gazeSource.x,
      clientY: gazeSource.y
    });
    target.dispatchEvent(clickEvent);
  }

  validateRecentPassiveSample() {
    if (!this.pendingBlinkValidation.length || typeof window.webgazer?.getRegressionModel !== 'function') {
      return;
    }

    const now = performance.now();
    const windowMs = 520;
    const latest = [...this.pendingBlinkValidation].reverse().find((sample) => !sample.validated && now - sample.timestamp <= windowMs);
    if (!latest) {
      this.pendingBlinkValidation = this.pendingBlinkValidation.filter((sample) => now - sample.timestamp <= windowMs * 2);
      return;
    }

    latest.validated = true;
    try {
      const model = window.webgazer.getRegressionModel?.();
      if (model?.addSample && latest.eyeState) {
        model.addSample(latest.eyeState, { x: latest.x, y: latest.y });
      }
      
      // Salvar modelo após reforço por piscada
      if (window.webgazer.saveModelToLocalStorage) {
        window.webgazer.saveModelToLocalStorage().catch((error) => {
          console.warn('[PassiveCalibration] Falha ao salvar modelo após piscada:', error);
        });
      }
      
      this.ui.updateStatus('Clique confirmado por piscada. Modelo reforçado e salvo.');
    } catch (error) {
      console.warn('[PassiveCalibration] Reforço por piscada falhou', error);
    }

    this.pendingBlinkValidation = this.pendingBlinkValidation.filter((sample) => now - sample.timestamp <= windowMs * 2);
  }

  markBootstrapComplete() {
    if (this.isBootstrapComplete) {
      return;
    }
    this.isBootstrapComplete = true;
    localStorage.setItem('terraCalibrationBootstrapped', 'true');
    this.calibration?.stopPassiveBootstrap?.();
    this.ui.updateStatus('Aprendizado inicial concluído. Continue clicando e piscando para refinar o modelo.');
  }

  updateSliceFromScreenPoint(point) {
    if (!this.renderer) {
      return;
    }

    const rect = this.renderer.canvas.getBoundingClientRect();
    const localX = point.x - rect.left;
    const localY = point.y - rect.top;
    const slice = this.renderer.pointToSlice(localX, localY);
    this.updateSlice(slice);
  }

  updateSlice(sliceIndex) {
    if (this.focusedSlice === sliceIndex) {
      return;
    }
    this.focusedSlice = sliceIndex;
    this.renderer?.draw(sliceIndex);
    if (sliceIndex === null) {
      return;
    }
    const note = this.notes[sliceIndex];
    if (note) {
      this.ui.updateStatus(`Fatia ${note.label} em foco. Pisque para tocar.`);
    }
  }

  async handleControlActivation(action, source) {
    switch (action) {
      case 'calibrate':
        if (this.isCalibrating) {
          this.ui.updateStatus('Calibração em andamento. Aguarde a conclusão.');
          return;
        }

        this.ui.setCalibrateBusy(true);
        try {
          if (!this.isTracking) {
            const started = await this.startTracking();
            if (!started) {
              this.registerAutoStartFallback();
              return;
            }
          }
          if (!this.cameraStream && !this.mouseFallbackEnabled) {
            this.ui.updateStatus('A calibração precisa da câmera ativa. Permita o acesso ou aguarde o fallback por mouse.');
            return;
          }
          await this.startCalibration();
        } finally {
          this.ui.setCalibrateBusy(false);
        }
        break;
      default:
        break;
    }
  }

  handleControlFocusState(state) {
    switch (state) {
      case 'focus':
        this.ui.setGazeState('control');
        break;
      case 'awaiting':
        this.ui.setGazeState('confirm');
        break;
      case 'activated':
        this.ui.flashGazeConfirmation();
        this.ui.setGazeState('tracking');
        break;
      case 'idle':
        this.ui.setGazeState('tracking');
        break;
      default:
        break;
    }
  }

  async startCalibration() {
    if (this.isCalibrating) {
      return;
    }

    this.isCalibrating = true;
    this.controlManager?.setPaused(true);
  const previousThreshold = this.gazeTracker?.getConfidenceThreshold?.() ?? APP_CONFIG.minConfidence;
  const calibrationThreshold = 0;
    if (this.gazeTracker && calibrationThreshold !== previousThreshold) {
      this.gazeTracker.setConfidenceThreshold(calibrationThreshold);
    }
    try {
      this.ui.updateStatus('Calibração iniciada. Olhe para cada alvo indicado e pisque para registrar.');
      const outcome = await this.calibration.calibrate();
      this.calibrationSummary = outcome;
      if (Number.isFinite(outcome?.averageError)) {
        const error = outcome.averageError.toFixed(1);
        this.ui.updateStatus(`Calibração concluída. Erro médio estimado: ${error}px.`);
      } else if (outcome?.warnings) {
        this.ui.updateStatus('Calibração concluída. Alguns pontos precisam de atenção.');
      } else {
        this.ui.updateStatus('Calibração concluída. Continue a tocar.');
      }
    } catch (error) {
      console.warn('Calibração interrompida.', error);
      this.ui.updateStatus('Calibração interrompida. Tente novamente.');
    } finally {
      if (this.gazeTracker && calibrationThreshold !== previousThreshold) {
        this.gazeTracker.setConfidenceThreshold(previousThreshold);
      }
      this.controlManager?.setPaused(false);
      this.isCalibrating = false;
    }
  }

  async requestFullscreen({ fromGesture = false } = {}) {
    if (document.fullscreenElement) {
      return;
    }

    const element = document.documentElement;
    const attemptPrimary = () => {
      if (element.requestFullscreen) {
        return element.requestFullscreen({ navigationUI: 'hide' });
      }
      if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
        return Promise.resolve();
      }
      throw new Error('API de tela cheia não está disponível neste navegador.');
    };

    try {
      await attemptPrimary();
      this.ui.updateStatus('Modo tela cheia ativo. Pressione Esc para sair.');
    } catch (error) {
      if (fromGesture) {
        throw error;
      }

      console.warn('Não foi possível entrar em fullscreen automaticamente.', error);
      try {
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
          element.webkitRequestFullscreen();
        }
        this.ui.updateStatus('Modo tela cheia ativo. Pressione Esc para sair.');
      } catch (fallbackError) {
        console.warn('Fallback de fullscreen também falhou.', fallbackError);
      }
    }
  }

  async exitFullscreen() {
    if (!document.fullscreenElement) {
      this.ui.updateStatus('Tela cheia já está desativada.');
      return;
    }

    try {
      await document.exitFullscreen();
      this.ui.updateStatus('Tela cheia desativada. Use a tecla F para retornar.');
    } catch (error) {
      console.warn('Falha ao sair do fullscreen', error);
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const app = new TerraVisionCore();
  await app.init();
});
