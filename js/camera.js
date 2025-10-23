/**
 * Módulo de Câmera Avançada - Terra Vision
 * Controles de zoom, resolução, foco e qualidade de imagem
 * 
 * Funcionalidades:
 * - Zoom digital (1x - 10x)
 * - Ajuste de resolução máxima
 * - Controle de foco manual
 * - Ajuste de contraste e brilho
 * - Visualização em tempo real
 * - Interface de controle intuitiva
 */

class AdvancedCamera {
  constructor(videoElement, canvasElement) {
    this.videoElement = videoElement;
    this.canvasElement = canvasElement;
    this.canvasContext = null;
    
    // Estado da câmera
    this.stream = null;
    this.isInitialized = false;
    this.isRunning = false;
    
    // Configurações de zoom
    this.zoomLevel = 1; // 1x a 10x
    this.minZoom = 1;
    this.maxZoom = 10;
    this.zoomStep = 0.5;
    
    // Configurações de imagem
    this.brightness = 100; // 0-200%
    this.contrast = 100; // 0-200%
    this.saturation = 100; // 0-200%
    this.blur = 0; // 0-10px
    
    // Configurações de resolução
    this.resolutionOptions = [
      { width: 1920, height: 1440, label: '2K' },
      { width: 1280, height: 960, label: '1280x960' },
      { width: 1024, height: 768, label: 'XGA' },
      { width: 640, height: 480, label: 'VGA' }
    ];
    this.currentResolution = { width: 1280, height: 960, label: '1280x960' };
    
    // Configurações de foco
    this.focusMode = 'auto'; // auto, manual, continuous
    this.focusDistance = 0; // 0-100
    
    // Callbacks
    this.onZoomChange = null;
    this.onBrightnessChange = null;
    this.onContrastChange = null;
    this.onResolutionChange = null;
    this.onError = null;
    
    // Inicializar canvas
    if (this.canvasElement) {
      this.canvasContext = this.canvasElement.getContext('2d');
    }
    
    console.log('📷 Câmera Avançada Inicializada');
  }

  /**
   * Inicializa a câmera com os melhores constraints disponíveis
   */
  async initialize() {
    try {
      console.log('📷 Inicializando câmera...');
      
      // Constraints otimizadas para rastreamento ocular
      const constraints = {
        video: {
          width: { 
            ideal: this.currentResolution.width,
            max: 1920 
          },
          height: { 
            ideal: this.currentResolution.height,
            max: 1440 
          },
          // Foco contínuo automático
          focusMode: ['continuous', 'auto'],
          facingMode: 'user',
          // Desabilitar ajustes automáticos prejudiciais
          autoGainControl: true,
          noiseSuppression: false,
          echoCancellation: false
        },
        audio: false
      };
      
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoElement.srcObject = this.stream;
      
      // Aguardar vídeo carregar
      return new Promise((resolve) => {
        this.videoElement.onloadedmetadata = () => {
          console.log(`✅ Câmera inicializada: ${this.videoElement.videoWidth}x${this.videoElement.videoHeight}`);
          this.isInitialized = true;
          
          // Atualizar resolução real
          this.currentResolution.width = this.videoElement.videoWidth;
          this.currentResolution.height = this.videoElement.videoHeight;
          
          resolve(true);
        };
      });
      
    } catch (error) {
      console.error('❌ Erro ao inicializar câmera:', error);
      if (this.onError) {
        this.onError(error);
      }
      throw error;
    }
  }

  /**
   * Inicia captura contínua de vídeo
   */
  start() {
    if (!this.isInitialized) {
      console.warn('⚠️ Câmera não inicializada');
      return false;
    }
    
    this.isRunning = true;
    this.videoElement.play();
    this.captureFrame();
    
    console.log('▶️ Captura de vídeo iniciada');
    return true;
  }

  /**
   * Para captura de vídeo
   */
  stop() {
    this.isRunning = false;
    this.videoElement.pause();
    
    console.log('⏹️ Captura de vídeo parada');
  }

  /**
   * Encerra a câmera completamente
   */
  shutdown() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    this.isInitialized = false;
    this.isRunning = false;
    
    console.log('🛑 Câmera encerrada');
  }

  /**
   * Captura frame e aplica filtros
   */
  captureFrame() {
    if (!this.isRunning || !this.canvasContext) return;
    
    const canvas = this.canvasElement;
    const ctx = this.canvasContext;
    
    // Dimensões do canvas
    canvas.width = this.videoElement.videoWidth;
    canvas.height = this.videoElement.videoHeight;
    
    // Aplicar zoom como escala
    const scale = this.zoomLevel;
    const scaledWidth = canvas.width / scale;
    const scaledHeight = canvas.height / scale;
    const offsetX = (canvas.width - scaledWidth) / 2;
    const offsetY = (canvas.height - scaledHeight) / 2;
    
    // Desenhar vídeo com zoom
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(scale, scale);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
    ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
    ctx.restore();
    
    // Aplicar filtros CSS/Canvas
    this.applyFilters();
    
    requestAnimationFrame(() => this.captureFrame());
  }

  /**
   * Aplica filtros de imagem (brilho, contraste, etc)
   */
  applyFilters() {
    // Aplicar filtros via CSS no elemento de vídeo
    const filterString = this.buildFilterString();
    this.videoElement.style.filter = filterString;
  }

  /**
   * Constrói string de filtro CSS
   */
  buildFilterString() {
    const filters = [];
    
    // Brilho (padrão: 100%)
    if (this.brightness !== 100) {
      filters.push(`brightness(${this.brightness}%)`);
    }
    
    // Contraste (padrão: 100%)
    if (this.contrast !== 100) {
      filters.push(`contrast(${this.contrast}%)`);
    }
    
    // Saturação (padrão: 100%)
    if (this.saturation !== 100) {
      filters.push(`saturate(${this.saturation}%)`);
    }
    
    // Blur (se necessário)
    if (this.blur > 0) {
      filters.push(`blur(${this.blur}px)`);
    }
    
    return filters.join(' ');
  }

  /**
   * Ajusta zoom
   */
  setZoom(level) {
    const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, level));
    
    if (newZoom !== this.zoomLevel) {
      this.zoomLevel = newZoom;
      
      console.log(`🔍 Zoom: ${newZoom.toFixed(1)}x`);
      
      if (this.onZoomChange) {
        this.onZoomChange(this.zoomLevel);
      }
    }
  }

  /**
   * Incrementa zoom
   */
  zoomIn(step = this.zoomStep) {
    this.setZoom(this.zoomLevel + step);
  }

  /**
   * Decrementa zoom
   */
  zoomOut(step = this.zoomStep) {
    this.setZoom(this.zoomLevel - step);
  }

  /**
   * Reset zoom ao padrão
   */
  resetZoom() {
    this.setZoom(1);
  }

  /**
   * Obtém zoom atual
   */
  getZoom() {
    return this.zoomLevel;
  }

  /**
   * Ajusta brilho
   */
  setBrightness(level) {
    this.brightness = Math.max(0, Math.min(200, level));
    this.applyFilters();
    
    if (this.onBrightnessChange) {
      this.onBrightnessChange(this.brightness);
    }
  }

  /**
   * Incrementa brilho
   */
  increaseBrightness(amount = 10) {
    this.setBrightness(this.brightness + amount);
  }

  /**
   * Reduz brilho
   */
  decreaseBrightness(amount = 10) {
    this.setBrightness(this.brightness - amount);
  }

  /**
   * Ajusta contraste
   */
  setContrast(level) {
    this.contrast = Math.max(0, Math.min(200, level));
    this.applyFilters();
    
    if (this.onContrastChange) {
      this.onContrastChange(this.contrast);
    }
  }

  /**
   * Incrementa contraste
   */
  increaseContrast(amount = 10) {
    this.setContrast(this.contrast + amount);
  }

  /**
   * Reduz contraste
   */
  decreaseContrast(amount = 10) {
    this.setContrast(this.contrast - amount);
  }

  /**
   * Ajusta saturação
   */
  setSaturation(level) {
    this.saturation = Math.max(0, Math.min(200, level));
    this.applyFilters();
  }

  /**
   * Reset de brilho, contraste e saturação
   */
  resetFilters() {
    this.brightness = 100;
    this.contrast = 100;
    this.saturation = 100;
    this.blur = 0;
    this.applyFilters();
    
    console.log('🔄 Filtros resetados');
  }

  /**
   * Altera resolução da câmera
   */
  async setResolution(width, height, label) {
    try {
      this.currentResolution = { width, height, label };
      
      // Fechar stream atual
      this.shutdown();
      
      // Reinicializar com nova resolução
      await this.initialize();
      
      if (this.onResolutionChange) {
        this.onResolutionChange(this.currentResolution);
      }
      
      console.log(`📐 Resolução alterada para: ${label}`);
      
      // Se estava rodando, retomar
      if (this.isRunning) {
        this.start();
      }
      
    } catch (error) {
      console.error('❌ Erro ao alterar resolução:', error);
      if (this.onError) {
        this.onError(error);
      }
    }
  }

  /**
   * Obtém opções de resolução
   */
  getResolutionOptions() {
    return this.resolutionOptions;
  }

  /**
   * Obtém resolução atual
   */
  getCurrentResolution() {
    return this.currentResolution;
  }

  /**
   * Captura screenshot da câmera
   */
  captureScreenshot() {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.canvasElement.width;
    tempCanvas.height = this.canvasElement.height;
    
    const ctx = tempCanvas.getContext('2d');
    ctx.drawImage(this.canvasElement, 0, 0);
    
    return tempCanvas.toDataURL('image/png');
  }

  /**
   * Salva screenshot em arquivo
   */
  downloadScreenshot(filename = 'screenshot.png') {
    const dataUrl = this.captureScreenshot();
    
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.click();
    
    console.log(`💾 Screenshot salvo: ${filename}`);
  }

  /**
   * Obtém configurações atuais
   */
  getSettings() {
    return {
      zoom: this.zoomLevel,
      brightness: this.brightness,
      contrast: this.contrast,
      saturation: this.saturation,
      resolution: this.currentResolution,
      focusMode: this.focusMode
    };
  }

  /**
   * Aplica configurações salvas
   */
  applySettings(settings) {
    if (settings.zoom !== undefined) {
      this.setZoom(settings.zoom);
    }
    
    if (settings.brightness !== undefined) {
      this.setBrightness(settings.brightness);
    }
    
    if (settings.contrast !== undefined) {
      this.setContrast(settings.contrast);
    }
    
    if (settings.saturation !== undefined) {
      this.setSaturation(settings.saturation);
    }
    
    console.log('⚙️ Configurações aplicadas');
  }

  /**
   * Salva configurações no localStorage
   */
  saveSettings() {
    try {
      localStorage.setItem(
        'terraVision_cameraSettings',
        JSON.stringify(this.getSettings())
      );
      console.log('💾 Configurações da câmera salvas');
    } catch (e) {
      console.error('Erro ao salvar configurações:', e);
    }
  }

  /**
   * Carrega configurações do localStorage
   */
  loadSettings() {
    try {
      const stored = localStorage.getItem('terraVision_cameraSettings');
      if (stored) {
        const settings = JSON.parse(stored);
        this.applySettings(settings);
        console.log('📂 Configurações da câmera carregadas');
      }
    } catch (e) {
      console.error('Erro ao carregar configurações:', e);
    }
  }

  /**
   * Limpa configurações
   */
  clearSettings() {
    localStorage.removeItem('terraVision_cameraSettings');
    console.log('🗑️ Configurações da câmera removidas');
  }
}
