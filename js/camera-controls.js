/**
 * Painel de Controles de Câmera - Terra Vision
 * Interface para zoom, brilho, contraste e resolução
 */

class CameraControlsPanel {
  constructor(advancedCamera, containerSelector) {
    this.camera = advancedCamera;
    this.container = document.querySelector(containerSelector);
    
    if (!this.container) {
      console.warn('⚠️ Container para painel de câmera não encontrado');
      return;
    }
    
    this.controls = {};
    this.createPanel();
    this.setupListeners();
    
    console.log('📹 Painel de Controles de Câmera Criado');
  }

  /**
   * Cria painel de controles
   */
  createPanel() {
    this.container.innerHTML = `
      <div class="camera-controls-panel">
        <div class="controls-section">
          <h4>🔍 Zoom</h4>
          <div class="control-group">
            <button class="btn btn-sm btn-outline-secondary" id="zoom-out-btn" title="Diminuir zoom (-)">
              −
            </button>
            <input 
              type="range" 
              id="zoom-slider" 
              class="form-range" 
              min="1" 
              max="10" 
              step="0.5" 
              value="1"
              title="Nível de zoom"
            >
            <button class="btn btn-sm btn-outline-secondary" id="zoom-in-btn" title="Aumentar zoom (+)">
              +
            </button>
            <span id="zoom-value" class="control-value">1.0x</span>
            <button class="btn btn-sm btn-outline-secondary" id="zoom-reset-btn" title="Resetar zoom">
              🔄
            </button>
          </div>
        </div>

        <div class="controls-section">
          <h4>☀️ Brilho</h4>
          <div class="control-group">
            <button class="btn btn-sm btn-outline-secondary" id="brightness-decrease-btn" title="Diminuir brilho">
              −
            </button>
            <input 
              type="range" 
              id="brightness-slider" 
              class="form-range" 
              min="0" 
              max="200" 
              value="100"
              title="Nível de brilho"
            >
            <button class="btn btn-sm btn-outline-secondary" id="brightness-increase-btn" title="Aumentar brilho">
              +
            </button>
            <span id="brightness-value" class="control-value">100%</span>
            <button class="btn btn-sm btn-outline-secondary" id="brightness-reset-btn" title="Resetar brilho">
              🔄
            </button>
          </div>
        </div>

        <div class="controls-section">
          <h4>◉ Contraste</h4>
          <div class="control-group">
            <button class="btn btn-sm btn-outline-secondary" id="contrast-decrease-btn" title="Diminuir contraste">
              −
            </button>
            <input 
              type="range" 
              id="contrast-slider" 
              class="form-range" 
              min="0" 
              max="200" 
              value="100"
              title="Nível de contraste"
            >
            <button class="btn btn-sm btn-outline-secondary" id="contrast-increase-btn" title="Aumentar contraste">
              +
            </button>
            <span id="contrast-value" class="control-value">100%</span>
            <button class="btn btn-sm btn-outline-secondary" id="contrast-reset-btn" title="Resetar contraste">
              🔄
            </button>
          </div>
        </div>

        <div class="controls-section">
          <h4>📐 Resolução</h4>
          <div class="control-group">
            <select id="resolution-select" class="form-select" title="Alterar resolução da câmera">
              <option value="1920x1440">2K (1920x1440)</option>
              <option value="1280x960" selected>1280x960</option>
              <option value="1024x768">XGA (1024x768)</option>
              <option value="640x480">VGA (640x480)</option>
            </select>
          </div>
        </div>

        <div class="controls-section">
          <h4>⚙️ Ações</h4>
          <div class="control-group">
            <button class="btn btn-sm btn-primary" id="screenshot-btn" title="Capturar screenshot">
              📷 Screenshot
            </button>
            <button class="btn btn-sm btn-secondary" id="reset-all-btn" title="Resetar todos os filtros">
              🔄 Resetar Tudo
            </button>
          </div>
        </div>

        <div class="camera-info">
          <p id="camera-resolution">Resolução: -</p>
          <p id="camera-zoom">Zoom: -</p>
        </div>
      </div>
    `;

    // Armazenar referências
    this.controls = {
      zoomSlider: document.getElementById('zoom-slider'),
      zoomValue: document.getElementById('zoom-value'),
      zoomInBtn: document.getElementById('zoom-in-btn'),
      zoomOutBtn: document.getElementById('zoom-out-btn'),
      zoomResetBtn: document.getElementById('zoom-reset-btn'),
      
      brightnessSlider: document.getElementById('brightness-slider'),
      brightnessValue: document.getElementById('brightness-value'),
      brightnessIncreaseBtn: document.getElementById('brightness-increase-btn'),
      brightnessDecreaseBtn: document.getElementById('brightness-decrease-btn'),
      brightnessResetBtn: document.getElementById('brightness-reset-btn'),
      
      contrastSlider: document.getElementById('contrast-slider'),
      contrastValue: document.getElementById('contrast-value'),
      contrastIncreaseBtn: document.getElementById('contrast-increase-btn'),
      contrastDecreaseBtn: document.getElementById('contrast-decrease-btn'),
      contrastResetBtn: document.getElementById('contrast-reset-btn'),
      
      resolutionSelect: document.getElementById('resolution-select'),
      
      screenshotBtn: document.getElementById('screenshot-btn'),
      resetAllBtn: document.getElementById('reset-all-btn'),
      
      cameraResolution: document.getElementById('camera-resolution'),
      cameraZoom: document.getElementById('camera-zoom')
    };
  }

  /**
   * Configura event listeners
   */
  setupListeners() {
    // Zoom
    this.controls.zoomSlider?.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      this.camera.setZoom(value);
      this.updateZoomDisplay(value);
    });

    this.controls.zoomInBtn?.addEventListener('click', () => {
      this.camera.zoomIn();
      this.updateZoomDisplay(this.camera.getZoom());
    });

    this.controls.zoomOutBtn?.addEventListener('click', () => {
      this.camera.zoomOut();
      this.updateZoomDisplay(this.camera.getZoom());
    });

    this.controls.zoomResetBtn?.addEventListener('click', () => {
      this.camera.resetZoom();
      this.updateZoomDisplay(this.camera.getZoom());
    });

    // Brilho
    this.controls.brightnessSlider?.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      this.camera.setBrightness(value);
      this.updateBrightnessDisplay(value);
    });

    this.controls.brightnessIncreaseBtn?.addEventListener('click', () => {
      this.camera.increaseBrightness();
      this.updateBrightnessDisplay(this.camera.brightness);
    });

    this.controls.brightnessDecreaseBtn?.addEventListener('click', () => {
      this.camera.decreaseBrightness();
      this.updateBrightnessDisplay(this.camera.brightness);
    });

    this.controls.brightnessResetBtn?.addEventListener('click', () => {
      this.camera.setBrightness(100);
      this.updateBrightnessDisplay(100);
    });

    // Contraste
    this.controls.contrastSlider?.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      this.camera.setContrast(value);
      this.updateContrastDisplay(value);
    });

    this.controls.contrastIncreaseBtn?.addEventListener('click', () => {
      this.camera.increaseContrast();
      this.updateContrastDisplay(this.camera.contrast);
    });

    this.controls.contrastDecreaseBtn?.addEventListener('click', () => {
      this.camera.decreaseContrast();
      this.updateContrastDisplay(this.camera.contrast);
    });

    this.controls.contrastResetBtn?.addEventListener('click', () => {
      this.camera.setContrast(100);
      this.updateContrastDisplay(100);
    });

    // Resolução
    this.controls.resolutionSelect?.addEventListener('change', (e) => {
      const [width, height] = e.target.value.split('x').map(Number);
      this.camera.setResolution(width, height, e.target.options[e.target.selectedIndex].text);
    });

    // Ações
    this.controls.screenshotBtn?.addEventListener('click', () => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      this.camera.downloadScreenshot(`terra-vision-${timestamp}.png`);
    });

    this.controls.resetAllBtn?.addEventListener('click', () => {
      this.camera.resetFilters();
      this.camera.resetZoom();
      this.updateAllDisplays();
    });

    // Configurar callbacks da câmera
    this.camera.onZoomChange = (zoom) => this.updateZoomDisplay(zoom);
    this.camera.onBrightnessChange = (brightness) => this.updateBrightnessDisplay(brightness);
    this.camera.onContrastChange = (contrast) => this.updateContrastDisplay(contrast);
  }

  /**
   * Atualiza display de zoom
   */
  updateZoomDisplay(value) {
    if (this.controls.zoomSlider) {
      this.controls.zoomSlider.value = value;
    }
    if (this.controls.zoomValue) {
      this.controls.zoomValue.textContent = `${value.toFixed(1)}x`;
    }
  }

  /**
   * Atualiza display de brilho
   */
  updateBrightnessDisplay(value) {
    if (this.controls.brightnessSlider) {
      this.controls.brightnessSlider.value = value;
    }
    if (this.controls.brightnessValue) {
      this.controls.brightnessValue.textContent = `${value}%`;
    }
  }

  /**
   * Atualiza display de contraste
   */
  updateContrastDisplay(value) {
    if (this.controls.contrastSlider) {
      this.controls.contrastSlider.value = value;
    }
    if (this.controls.contrastValue) {
      this.controls.contrastValue.textContent = `${value}%`;
    }
  }

  /**
   * Atualiza todos os displays
   */
  updateAllDisplays() {
    this.updateZoomDisplay(this.camera.getZoom());
    this.updateBrightnessDisplay(this.camera.brightness);
    this.updateContrastDisplay(this.camera.contrast);
    this.updateCameraInfo();
  }

  /**
   * Atualiza informações da câmera
   */
  updateCameraInfo() {
    const res = this.camera.getCurrentResolution();
    if (this.controls.cameraResolution) {
      this.controls.cameraResolution.textContent = 
        `Resolução: ${res.width}x${res.height} (${res.label})`;
    }
    if (this.controls.cameraZoom) {
      this.controls.cameraZoom.textContent = 
        `Zoom: ${this.camera.getZoom().toFixed(1)}x`;
    }
  }

  /**
   * Mostra/oculta painel
   */
  toggle() {
    this.container.style.display = 
      this.container.style.display === 'none' ? 'block' : 'none';
  }

  /**
   * Mostra painel
   */
  show() {
    this.container.style.display = 'block';
  }

  /**
   * Oculta painel
   */
  hide() {
    this.container.style.display = 'none';
  }
}
