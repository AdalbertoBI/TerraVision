import { APP_CONFIG, DEFAULT_NOTES } from './config.js';
import { AudioEngine } from './audio.js';
import { ControlManager } from './controlManager.js';
import { PizzaRenderer } from './pizzaRenderer.js';
import { UIManager } from './ui.js';
import { CalibrationManager } from './calibration.js';
import { GazeTracker } from './gazeTracker.js';

class TerraVisionCore {
  constructor() {
    this.notes = [];
    this.audio = new AudioEngine();
    this.ui = new UIManager();
    this.renderer = null;
    this.calibration = null;
    this.controlManager = null;
    this.gazeTracker = null;

    this.lastGaze = null;
    this.rawGaze = null;
    this.focusedSlice = null;
    this.isTracking = false;
    this.isCalibrating = false;
    this.calibrationOffset = { x: 0, y: 0 };

    this.handleGaze = this.handleGaze.bind(this);
    this.handleBlink = this.handleBlink.bind(this);
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

    this.gazeTracker = new GazeTracker({
      onGaze: this.handleGaze,
      onBlink: this.handleBlink,
      announce: (message) => this.ui.updateStatus(message)
    });

    const buttons = this.ui.getControlButtons();
    if (buttons.length) {
      this.controlManager = new ControlManager(buttons, {
        dwellDuration: APP_CONFIG.dwellDuration,
        onActivate: (action, source) => {
          this.handleControlActivation(action, source);
        }
      });
    }

    this.setupEventHandlers();
    this.setupResizeHandling();

    if (!this.warnIfInsecureContext()) {
      this.ui.updateStatus('Olhe para a pizza colorida e use o alvo central para calibrar quando desejar.');
    }
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
    this.ui.onCalibrate(async () => {
      await this.handleControlActivation('calibrate', 'click');
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'f') {
        this.requestFullscreen();
      }
      if (event.key === 'Escape') {
        this.exitFullscreen();
      }
    });
  }

  setupResizeHandling() {
    window.addEventListener('resize', () => {
      this.renderer?.resize();
      this.controlManager?.refreshRects();
    });
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
      await this.requestCameraPermission();
      await this.audio.ensureRunning();

      this.gazeTracker.setConfidenceThreshold(APP_CONFIG.minConfidence);
      await this.gazeTracker.setup();
      this.gazeTracker.startBlinkDetector();

      this.isTracking = true;
      this.applyCalibrationOffset();
      this.ui.updateStatus('Rastreamento ativo. Foque em uma fatia colorida e pisque para tocar.');
      return true;
    } catch (error) {
      console.error('Falha ao iniciar rastreamento:', error);
      this.isTracking = false;
      this.ui.updateStatus('Não foi possível acessar a câmera. Verifique permissões e tente novamente.');
      return false;
    }
  }

  applyCalibrationOffset() {
    const offset = this.calibration.getOffset();
    this.calibrationOffset = offset || { x: 0, y: 0 };
  }

  async requestCameraPermission() {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('API getUserMedia indisponível neste navegador.');
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });
      stream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      throw new Error('Permissão de câmera negada ou indisponível.');
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
    const offset = this.calibrationOffset || { x: 0, y: 0 };
    const adjusted = {
      x: data.x - offset.x,
      y: data.y - offset.y,
      confidence: data.confidence
    };

    this.lastGaze = adjusted;
    this.ui.updateGazeDot(adjusted);

    const interactingWithControl = this.controlManager?.handleGaze(adjusted) ?? false;
    if (!interactingWithControl) {
      this.updateSliceFromScreenPoint(adjusted);
    } else {
      this.updateSlice(null);
    }
  }

  handleBlink() {
    if (!this.isTracking) {
      return;
    }
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

  async handleControlActivation(action) {
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
              return;
            }
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

  async startCalibration() {
    if (this.isCalibrating) {
      return;
    }

    this.isCalibrating = true;
    this.controlManager?.setPaused(true);
    try {
      this.ui.updateStatus('Calibração iniciada. Olhe para o alvo indicado e clique para prosseguir.');
      const outcome = await this.calibration.calibrate();
      this.applyCalibrationOffset();
      if (outcome?.warnings) {
        this.ui.updateStatus('Calibração concluída. Alguns pontos precisam de atenção.');
      } else {
        this.ui.updateStatus('Calibração concluída. Continue a tocar.');
      }
    } catch (error) {
      console.warn('Calibração interrompida.', error);
      this.ui.updateStatus('Calibração interrompida. Tente novamente.');
    } finally {
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
