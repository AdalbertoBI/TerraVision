/**
 * Módulo de Tela Cheia - Terra Vision
 * Gerencia modo fullscreen para visualização da pizza musical
 * 
 * Funcionalidades:
 * - Entrada/saída de tela cheia com API Fullscreen
 * - Centralização e escala dinâmica da pizza
 * - Transições suaves entre modos
 * - Suporte a desktop e dispositivos móveis
 * - Gestos para controle (toque, ESC)
 * - Controles de interface adaptados
 */

class FullscreenManager {
  constructor(pizzaCanvasElement, containerElement, audioManager = null) {
    this.pizzaCanvas = pizzaCanvasElement;
    this.container = containerElement;
    this.audioManager = audioManager;
    
    // Estado
    this.isFullscreen = false;
    this.isSupported = this.checkFullscreenSupport();
    this.originalWidth = null;
    this.originalHeight = null;
    
    // Elemento de controle fullscreen
    this.fullscreenButton = null;
    
    // Callbacks
    this.onEnterFullscreen = null;
    this.onExitFullscreen = null;
    this.onFullscreenChange = null;
  this.gazeControls = null;
    
    // Detectar mudanças de fullscreen
    this.setupFullscreenListeners();
    
    console.log(`📺 Gerenciador Fullscreen Inicializado (Suportado: ${this.isSupported})`);
  }

  /**
   * Verifica suporte a fullscreen
   */
  checkFullscreenSupport() {
    return !!(
      document.fullscreenEnabled ||
      document.webkitFullscreenEnabled ||
      document.mozFullScreenEnabled ||
      document.msFullscreenEnabled
    );
  }

  /**
   * Configura listeners de fullscreen
   */
  setupFullscreenListeners() {
    document.addEventListener('fullscreenchange', () => this.handleFullscreenChange());
    document.addEventListener('webkitfullscreenchange', () => this.handleFullscreenChange());
    document.addEventListener('mozfullscreenchange', () => this.handleFullscreenChange());
    document.addEventListener('msfullscreenchange', () => this.handleFullscreenChange());
    
    // Listener para ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isFullscreen) {
        this.exitFullscreen();
      }
    });
  }

  /**
   * Entra em modo fullscreen
   */
  async enterFullscreen() {
    if (!this.isSupported) {
      console.warn('⚠️ Fullscreen não suportado neste navegador');
      if (this.audioManager) {
        this.audioManager.playError();
      }
      return false;
    }

    try {
      // Armazenar dimensões originais
      this.originalWidth = this.pizzaCanvas.width;
      this.originalHeight = this.pizzaCanvas.height;
      
      // Preparar elemento para fullscreen
      const element = this.container || this.pizzaCanvas;
      
      // Adicionar classe CSS para fullscreen
      element.classList.add('pizza-fullscreen-active');
      
      // Requisitar fullscreen com fallbacks de navegador
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        await element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen();
      }
      
      // Reproduzir som de confirmação
      if (this.audioManager) {
        this.audioManager.playSuccess();
      }
      
      console.log('🖥️ Modo fullscreen ativado');
      return true;
      
    } catch (error) {
      console.error('❌ Erro ao entrar em fullscreen:', error);
      this.container?.classList.remove('pizza-fullscreen-active');
      if (this.audioManager) {
        this.audioManager.playError();
      }
      return false;
    }
  }

  /**
   * Sai do modo fullscreen
   */
  async exitFullscreen() {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        await document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }
      
      // Remover classe CSS
      this.container?.classList.remove('pizza-fullscreen-active');
      
      // Reproduzir som
      if (this.audioManager) {
        this.audioManager.playNote('Sol', 0.1);
      }
      
      console.log('🔙 Modo fullscreen desativado');
      return true;
      
    } catch (error) {
      console.error('❌ Erro ao sair de fullscreen:', error);
      return false;
    }
  }

  /**
   * Alterna modo fullscreen
   */
  async toggleFullscreen() {
    if (this.isFullscreen) {
      return await this.exitFullscreen();
    } else {
      return await this.enterFullscreen();
    }
  }

  /**
   * Handler para mudanças de fullscreen
   */
  handleFullscreenChange() {
    const wasFullscreen = this.isFullscreen;
    
    // Verificar estado atual
    const fullscreenElement = 
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement;
    
    this.isFullscreen = !!fullscreenElement;
    
    // Apenas processar se houve mudança real
    if (wasFullscreen !== this.isFullscreen) {
      this.updateUI();
      if (this.isFullscreen) {
        this.gazeControls?.activate();
      } else {
        this.gazeControls?.deactivate();
      }
      
      if (this.isFullscreen) {
        if (this.onEnterFullscreen) {
          this.onEnterFullscreen();
        }
      } else {
        if (this.onExitFullscreen) {
          this.onExitFullscreen();
        }
      }
      
      if (this.onFullscreenChange) {
        this.onFullscreenChange(this.isFullscreen);
      }
    }
  }

  /**
   * Atualiza UI baseado no estado fullscreen
   */
  updateUI() {
    if (this.fullscreenButton) {
      this.fullscreenButton.textContent = this.isFullscreen 
        ? '📺 Sair da Tela Cheia' 
        : '📺 Tela Cheia';
      
      this.fullscreenButton.classList.toggle('active', this.isFullscreen);
    }
  }

  /**
   * Centraliza e escala a pizza dinamicamente
   */
  scalePizzaToDimensions(width, height) {
    if (!this.pizzaCanvas) return;
    
    // Calcular escala para ocupar máximo espaço disponível
    const maxWidth = width * 0.95;
    const maxHeight = height * 0.95;
    
    // Pizza é quadrada
    const maxSize = Math.min(maxWidth, maxHeight);
    
    // Aplicar dimensões
    this.pizzaCanvas.width = maxSize;
    this.pizzaCanvas.height = maxSize;
    
    // Centralizar via CSS
    this.pizzaCanvas.style.display = 'block';
    this.pizzaCanvas.style.margin = '0 auto';
    this.pizzaCanvas.style.position = 'absolute';
    this.pizzaCanvas.style.left = '50%';
    this.pizzaCanvas.style.top = '50%';
    this.pizzaCanvas.style.transform = 'translate(-50%, -50%)';
    
    console.log(`📐 Pizza escalada: ${maxSize.toFixed(0)}px`);
    this.gazeControls?.refreshLayout();
  }

  /**
   * Cria botão de controle fullscreen
   */
  createFullscreenButton(parentElement) {
    this.fullscreenButton = document.createElement('button');
    this.fullscreenButton.className = 'btn-fullscreen';
    this.fullscreenButton.textContent = '📺 Tela Cheia';
    this.fullscreenButton.setAttribute('title', 'Ativar/Desativar tela cheia (F)');
    this.fullscreenButton.setAttribute('aria-label', 'Botão de tela cheia');
    
    this.fullscreenButton.addEventListener('click', () => this.toggleFullscreen());
    
    // Atalho de teclado (F)
    document.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.altKey) {
        this.toggleFullscreen();
      }
    });
    
    if (parentElement) {
      parentElement.appendChild(this.fullscreenButton);
    }
    
    return this.fullscreenButton;
  }

  /**
   * Verifica se está em fullscreen
   */
  getFullscreenState() {
    return this.isFullscreen;
  }

  /**
   * Obtém tamanho recomendado da pizza
   */
  getRecommendedSize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const maxSize = Math.min(width, height) * 0.9;
    
    return {
      width: maxSize,
      height: maxSize,
      size: maxSize
    };
  }

  /**
   * Configura listeners para redimensionamento
   */
  setupResizeListener() {
    window.addEventListener('resize', () => {
      if (this.isFullscreen) {
        const size = this.getRecommendedSize();
        this.scalePizzaToDimensions(window.innerWidth, window.innerHeight);
      }
      this.gazeControls?.refreshLayout();
    });
  }

  /**
   * Cria overlay de controle fullscreen
   */
  createFullscreenOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'fullscreen-overlay hidden';
    overlay.innerHTML = `
      <div class="fullscreen-controls">
        <button class="btn btn-primary" id="exit-fullscreen-btn">
          ✕ Sair (ESC)
        </button>
        <div class="fullscreen-hint">
          <p>Pressione <kbd>ESC</kbd> para sair | Pressione <kbd>F</kbd> para tela cheia</p>
        </div>
      </div>
    `;
    
    // Mostrar/ocultar overlay
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.id === 'exit-fullscreen-btn') {
        this.exitFullscreen();
      }
    });
    
    document.body.appendChild(overlay);
    
    return overlay;
  }

  /**
   * Obtém configurações atuais
   */
  getSettings() {
    return {
      isSupported: this.isSupported,
      isFullscreen: this.isFullscreen
    };
  }

  /**
   * Configura controles laterais guiados por gaze
   * @param {Object} options
   */
  configureGazeControls(options = {}) {
    if (this.gazeControls) {
      this.gazeControls.destroy();
    }

    const config = {
      manager: this,
      actions: options.actions || [],
      dwellDuration: options.dwellDuration,
      requireBlink: options.requireBlink,
      confidenceThreshold: options.confidenceThreshold,
      audioManager: this.audioManager,
      parent: options.parent || document.body
    };

    this.gazeControls = new FullscreenGazeControls(config);

    if (this.isFullscreen) {
      this.gazeControls.activate();
    }
  }

  /**
   * Processa coordenadas do olhar
   * @param {Object} data
   */
  handleGazePoint(data) {
    if (!this.isFullscreen || !this.gazeControls) {
      return;
    }
    this.gazeControls.handleGaze(data);
  }

  /**
   * Processa piscada para confirmação
   * @returns {boolean} true se ação foi disparada
   */
  handleBlink() {
    if (!this.isFullscreen || !this.gazeControls) {
      return false;
    }
    return this.gazeControls.handleBlink();
  }

  /**
   * Atualiza estado visual de um controle
   * @param {string} actionId
   * @param {Object} state
   */
  updateActionState(actionId, state = {}) {
    this.gazeControls?.updateActionState(actionId, state);
  }
}

/**
 * Extensão para controles de toque em modo fullscreen
 */
class TouchControls {
  constructor(pizzaCanvasElement, fullscreenManager) {
    this.canvas = pizzaCanvasElement;
    this.fullscreenManager = fullscreenManager;
    
    // Detectar duplo-toque para fullscreen
    this.lastTouchEnd = 0;
    this.setupTouchListeners();
  }

  /**
   * Configura listeners de toque
   */
  setupTouchListeners() {
    this.canvas.addEventListener('touchend', (e) => {
      const now = Date.now();
      const timesince = now - this.lastTouchEnd;
      
      // Duplo toque = fullscreen
      if (timesince < 300 && timesince > 0) {
        this.fullscreenManager.toggleFullscreen();
        e.preventDefault();
      }
      
      this.lastTouchEnd = now;
    }, false);
    
    // Pinch-zoom (apenas desktop - zoom da câmera)
    this.canvas.addEventListener('wheel', (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        // Zoom será tratado pela câmera
      }
    });
  }
}

class FullscreenGazeControls {
  constructor(options = {}) {
    this.manager = options.manager || null;
    this.parent = options.parent || document.body;
    this.dwellDuration = options.dwellDuration || 1200;
    this.requireBlink = options.requireBlink !== false;
    this.confidenceThreshold = options.confidenceThreshold || 0.55;
    this.audioManager = options.audioManager || null;
    this.actions = this.prepareActions(options.actions);
    this.overlay = null;
    this.rails = { left: null, right: null };
    this.statusHint = null;
    this.actionElements = new Map();
    this.active = false;
    this.focusedActionId = null;
    this.dwellStart = null;
    this.awaitingBlink = false;
    this.confirmationTimer = null;

    this.buildUI();
  }

  prepareActions(actions = []) {
    if (Array.isArray(actions) && actions.length > 0) {
      return actions.map(action => ({
        id: action.id,
        label: action.label || 'Ação',
        icon: action.icon || '⚙️',
        side: action.side === 'right' ? 'right' : 'left',
        hint: action.hint || 'Mantenha o olhar para iniciar',
        confirmHint: action.confirmHint || 'Piscar para confirmar',
        feedback: action.feedback || 'Comando executado',
        ariaLabel: action.ariaLabel || action.label || 'Comando',
        onActivate: action.onActivate || (() => {}),
        toggleable: Boolean(action.toggleable),
        active: Boolean(action.active)
      }));
    }

    return [
      {
        id: 'exit-fullscreen',
        label: 'Sair',
        icon: '⏏️',
        side: 'right',
        hint: 'Mantenha o olhar e pisque para sair',
        confirmHint: 'Piscar para sair',
        feedback: 'Fullscreen desativado',
        onActivate: () => this.manager?.exitFullscreen?.()
      }
    ];
  }

  buildUI() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'fullscreen-gaze-overlay hidden';
    this.overlay.setAttribute('aria-hidden', 'true');

    this.rails.left = document.createElement('div');
    this.rails.left.className = 'fullscreen-gaze-rail left';
    this.rails.right = document.createElement('div');
    this.rails.right.className = 'fullscreen-gaze-rail right';

    this.overlay.appendChild(this.rails.left);
    this.overlay.appendChild(this.rails.right);

    this.statusHint = document.createElement('div');
    this.statusHint.className = 'fullscreen-gaze-status';
    this.statusHint.textContent = 'Olhe para um comando lateral e mantenha o foco.';
    this.overlay.appendChild(this.statusHint);

    this.actions.forEach(action => {
      const element = this.createActionElement(action);
      const targetRail = action.side === 'right' ? this.rails.right : this.rails.left;
      targetRail.appendChild(element);
    });

    this.parent.appendChild(this.overlay);
    this.refreshLayout();
  }

  createActionElement(action) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'gaze-control';
    button.dataset.actionId = action.id;
    button.setAttribute('aria-label', action.ariaLabel);
    button.innerHTML = `
      <span class="gaze-icon">${action.icon}</span>
      <span class="gaze-label">${action.label}</span>
      <span class="gaze-progress"><span class="gaze-progress-fill"></span></span>
      <span class="gaze-hint">${action.hint}</span>
    `;

    button.addEventListener('click', () => this.triggerAction(action.id, 'click'));

    if (action.toggleable && action.active) {
      button.classList.add('active');
    }

    this.actionElements.set(action.id, {
      element: button,
      config: action,
      progressFill: button.querySelector('.gaze-progress-fill'),
      hintElement: button.querySelector('.gaze-hint'),
      rect: null
    });

    return button;
  }

  activate() {
    this.overlay.classList.remove('hidden');
    this.overlay.setAttribute('aria-hidden', 'false');
    this.active = true;
    this.statusHint.textContent = 'Olhe para um comando lateral e mantenha o foco.';
    this.refreshLayout();
    this.resetFocus();
  }

  deactivate() {
    this.overlay.classList.add('hidden');
    this.overlay.setAttribute('aria-hidden', 'true');
    this.active = false;
    this.resetFocus();
  }

  refreshLayout() {
    this.actionElements.forEach(record => {
      record.rect = record.element.getBoundingClientRect();
    });
  }

  handleGaze(data) {
    if (!this.active || !data) {
      return;
    }

    const x = typeof data.smoothX === 'number' ? data.smoothX : data.x;
    const y = typeof data.smoothY === 'number' ? data.smoothY : data.y;
    const confidence = typeof data.confidence === 'number' ? data.confidence : 1;

    if (x == null || y == null) {
      this.resetFocus();
      return;
    }

    if (confidence < this.confidenceThreshold) {
      this.resetFocus();
      return;
    }

    const actionId = this.getActionByPoint(x, y);

    if (!actionId) {
      this.resetFocus();
      return;
    }

    if (this.focusedActionId !== actionId) {
      this.setFocusedAction(actionId);
      return;
    }

    if (this.awaitingBlink) {
      return;
    }

    const now = performance.now();
    const elapsed = now - (this.dwellStart || now);
    const progress = Math.min(1, elapsed / this.dwellDuration);
    this.updateProgress(progress);

    if (progress >= 1) {
      if (this.requireBlink) {
        this.enterAwaitingBlink();
      } else {
        this.triggerAction(actionId, 'dwell');
      }
    }
  }

  handleBlink() {
    if (!this.active || !this.awaitingBlink || !this.focusedActionId) {
      return false;
    }

    this.triggerAction(this.focusedActionId, 'blink');
    return true;
  }

  setFocusedAction(actionId) {
    this.clearConfirmationTimer();
    this.awaitingBlink = false;
    this.focusedActionId = actionId;
    this.dwellStart = performance.now();
    this.actionElements.forEach(record => {
      record.element.classList.toggle('focus', record.config.id === actionId);
      record.element.classList.remove('awaiting-blink');
      if (record.hintElement) {
        record.hintElement.textContent = record.config.hint;
      }
      if (record.progressFill) {
        record.progressFill.style.width = '0%';
      }
    });

    const focused = this.actionElements.get(actionId);
    if (focused && focused.hintElement) {
      this.statusHint.textContent = focused.config.hint;
    }
  }

  updateProgress(value) {
    const focused = this.actionElements.get(this.focusedActionId);
    if (!focused || !focused.progressFill) {
      return;
    }
    const percent = Math.max(0, Math.min(100, value * 100));
    focused.progressFill.style.width = `${percent}%`;
  }

  enterAwaitingBlink() {
    this.awaitingBlink = true;
    const focused = this.actionElements.get(this.focusedActionId);
    if (!focused) {
      return;
    }

    focused.element.classList.add('awaiting-blink');
    if (focused.hintElement) {
      focused.hintElement.textContent = focused.config.confirmHint;
    }
    focused.progressFill.style.width = '100%';
    this.statusHint.textContent = 'Piscada rápida confirma o comando.';

    this.confirmationTimer = setTimeout(() => {
      this.statusHint.textContent = 'Tempo excedido. Refaça o foco.';
      this.resetFocus();
    }, 2500);

    if (this.audioManager && typeof this.audioManager.playNote === 'function') {
      this.audioManager.playNote('Si', 0.1);
    }
  }

  triggerAction(actionId, source) {
    const record = this.actionElements.get(actionId);
    if (!record) {
      return;
    }

    this.clearConfirmationTimer();
    this.awaitingBlink = false;

    if (record.config.toggleable) {
      record.config.active = !record.config.active;
      record.element.classList.toggle('active', record.config.active);
    }
    
    const activeState = record.config.toggleable ? record.config.active : true;

    try {
      record.config.onActivate({ actionId, source, active: activeState });
      this.statusHint.textContent = record.config.feedback;
      if (this.audioManager && typeof this.audioManager.playSuccess === 'function') {
        this.audioManager.playSuccess();
      }
    } catch (error) {
      console.error('Erro ao executar ação fullscreen:', error);
      this.statusHint.textContent = 'Erro ao executar comando.';
      if (this.audioManager && typeof this.audioManager.playError === 'function') {
        this.audioManager.playError();
      }
    }

    this.resetFocus();
  }

  getActionByPoint(x, y) {
    let target = null;
    this.actionElements.forEach((record, actionId) => {
      if (!record.rect) {
        return;
      }
      if (x >= record.rect.left && x <= record.rect.right && y >= record.rect.top && y <= record.rect.bottom) {
        target = actionId;
      }
    });
    return target;
  }

  resetFocus() {
    this.clearConfirmationTimer();
    this.awaitingBlink = false;
    this.dwellStart = null;
    this.focusedActionId = null;
    this.actionElements.forEach(record => {
      record.element.classList.remove('focus');
      record.element.classList.remove('awaiting-blink');
      if (record.progressFill) {
        record.progressFill.style.width = '0%';
      }
      if (record.hintElement) {
        record.hintElement.textContent = record.config.hint;
      }
    });

    if (this.statusHint) {
      this.statusHint.textContent = 'Olhe para um comando lateral e mantenha o foco.';
    }
  }

  updateActionState(actionId, state = {}) {
    const record = this.actionElements.get(actionId);
    if (!record) {
      return;
    }

    if (state.label) {
      const labelElement = record.element.querySelector('.gaze-label');
      if (labelElement) {
        labelElement.textContent = state.label;
      }
      record.config.label = state.label;
    }

    if (state.icon) {
      const iconElement = record.element.querySelector('.gaze-icon');
      if (iconElement) {
        iconElement.textContent = state.icon;
      }
      record.config.icon = state.icon;
    }

    if (typeof state.active === 'boolean' && record.config.toggleable) {
      record.config.active = state.active;
      record.element.classList.toggle('active', state.active);
    }

    if (state.hint && record.hintElement) {
      record.hintElement.textContent = state.hint;
      record.config.hint = state.hint;
    }

    this.refreshLayout();
  }

  clearConfirmationTimer() {
    if (this.confirmationTimer) {
      clearTimeout(this.confirmationTimer);
      this.confirmationTimer = null;
    }
  }

  destroy() {
    this.clearConfirmationTimer();
    this.actionElements.clear();
    if (this.overlay && this.overlay.parentElement) {
      this.overlay.parentElement.removeChild(this.overlay);
    }
    this.overlay = null;
    this.rails = { left: null, right: null };
    this.statusHint = null;
    this.active = false;
  }
}
