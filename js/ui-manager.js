/**
 * Módulo UI - Terra Vision
 * Componentes de interface, feedback visual/auditivo e acessibilidade
 * 
 * Funcionalidades:
 * - Componentes reutilizáveis
 * - Feedback visual interativo
 * - Controles de acessibilidade
 * - Gerenciamento de temas
 * - Navegação responsiva
 */

class UIManager {
  constructor(audioManager) {
    this.audioManager = audioManager;
    this.currentTheme = this.loadTheme();
    this.accessibility = this.loadAccessibilitySettings();
    
    console.log('🎨 Sistema UI Inicializado');
    this.initializeTheme();
  }

  /**
   * Inicializa o tema visual
   */
  initializeTheme() {
    const root = document.documentElement;
    
    if (this.currentTheme === 'dark') {
      root.setAttribute('data-theme', 'dark');
      root.style.setProperty('--bg-primary', '#0a0e27');
      root.style.setProperty('--bg-secondary', '#151a3a');
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--text-secondary', '#b0b9c1');
    } else if (this.currentTheme === 'light') {
      root.setAttribute('data-theme', 'light');
      root.style.setProperty('--bg-primary', '#ffffff');
      root.style.setProperty('--bg-secondary', '#f5f5f5');
      root.style.setProperty('--text-primary', '#000000');
      root.style.setProperty('--text-secondary', '#666666');
    } else if (this.currentTheme === 'highcontrast') {
      root.setAttribute('data-theme', 'highcontrast');
      root.style.setProperty('--bg-primary', '#000000');
      root.style.setProperty('--bg-secondary', '#1a1a1a');
      root.style.setProperty('--text-primary', '#ffff00');
      root.style.setProperty('--text-secondary', '#00ff00');
    }
  }

  /**
   * Altera o tema visual
   */
  setTheme(theme) {
    if (['dark', 'light', 'highcontrast'].includes(theme)) {
      this.currentTheme = theme;
      this.saveTheme();
      this.initializeTheme();
      console.log(`🎨 Tema alterado para: ${theme}`);
    }
  }

  /**
   * Ativa/desativa modo de alto contraste
   */
  toggleHighContrast(enabled) {
    this.accessibility.highContrast = enabled;
    this.saveAccessibilitySettings();
    
    if (enabled) {
      this.setTheme('highcontrast');
      console.log('🔆 Modo alto contraste ativado');
    } else {
      this.setTheme('dark');
      console.log('🔅 Modo alto contraste desativado');
    }
  }

  /**
   * Configura tamanho de fonte
   */
  setFontSize(size) {
    const validSizes = ['small', 'normal', 'large', 'xlarge'];
    
    if (validSizes.includes(size)) {
      this.accessibility.fontSize = size;
      this.saveAccessibilitySettings();
      
      const root = document.documentElement;
      
      switch(size) {
        case 'small':
          root.style.setProperty('--font-size-base', '12px');
          break;
        case 'normal':
          root.style.setProperty('--font-size-base', '14px');
          break;
        case 'large':
          root.style.setProperty('--font-size-base', '16px');
          break;
        case 'xlarge':
          root.style.setProperty('--font-size-base', '20px');
          break;
      }
      
      console.log(`📝 Tamanho de fonte: ${size}`);
    }
  }

  /**
   * Ativa/desativa feedback sonoro
   */
  toggleAudioFeedback(enabled) {
    this.accessibility.audioFeedback = enabled;
    this.saveAccessibilitySettings();
    console.log(`🔊 Feedback sonoro: ${enabled ? 'ativado' : 'desativado'}`);
  }

  /**
   * Define volume geral
   */
  setVolume(level) {
    const volume = Math.max(0, Math.min(1, level));
    this.accessibility.volume = volume;
    this.saveAccessibilitySettings();
    this.audioManager.setVolume(volume);
    console.log(`🔊 Volume: ${(volume * 100).toFixed(0)}%`);
  }

  /**
   * Mostra notificação visual
   */
  showNotification(message, type = 'info', duration = 3000) {
    const notificationContainer = document.getElementById('notification-container') || 
                                   this.createNotificationContainer();
    
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'polite');
    
    const icon = this.getNotificationIcon(type);
    notification.innerHTML = `
      <span class="notification__icon">${icon}</span>
      <span class="notification__message">${this.escapeHtml(message)}</span>
      <button class="notification__close" aria-label="Fechar notificação">×</button>
    `;

    notificationContainer.appendChild(notification);

    // Feedback sonoro
    if (this.accessibility.audioFeedback) {
      if (type === 'success') this.audioManager.playSuccess();
      else if (type === 'error') this.audioManager.playError();
      else this.audioManager.playNote('Do', 0.1);
    }

    // Fechar ao clicar
    notification.querySelector('.notification__close').addEventListener('click', () => {
      notification.remove();
    });

    // Remover automaticamente
    if (duration > 0) {
      setTimeout(() => {
        notification.remove();
      }, duration);
    }
  }

  /**
   * Mostra modal de confirmação
   */
  showConfirmDialog(title, message, onConfirm, onCancel) {
    const modal = document.createElement('div');
    modal.className = 'modal modal--confirm';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-labelledby', 'modal-title');
    
    modal.innerHTML = `
      <div class="modal__overlay"></div>
      <div class="modal__content">
        <h2 id="modal-title" class="modal__title">${this.escapeHtml(title)}</h2>
        <p class="modal__message">${this.escapeHtml(message)}</p>
        <div class="modal__actions">
          <button class="button button--secondary" data-action="cancel">Cancelar</button>
          <button class="button button--primary" data-action="confirm">Confirmar</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const confirmBtn = modal.querySelector('[data-action="confirm"]');
    const cancelBtn = modal.querySelector('[data-action="cancel"]');
    const overlay = modal.querySelector('.modal__overlay');

    confirmBtn.addEventListener('click', () => {
      modal.remove();
      if (onConfirm) onConfirm();
    });

    cancelBtn.addEventListener('click', () => {
      modal.remove();
      if (onCancel) onCancel();
    });

    overlay.addEventListener('click', () => {
      modal.remove();
      if (onCancel) onCancel();
    });

    confirmBtn.focus();
  }

  /**
   * Mostra modal de progresso
   */
  showProgressDialog(title, stats) {
    const modal = document.createElement('div');
    modal.className = 'modal modal--progress';
    modal.setAttribute('role', 'dialog');
    
    let statsHtml = '<div class="stats-grid">';
    
    if (stats.accuracy !== undefined) {
      statsHtml += `
        <div class="stat-item">
          <span class="stat-label">Acurácia</span>
          <span class="stat-value">${stats.accuracy.toFixed(1)}%</span>
        </div>
      `;
    }

    if (stats.totalNotes !== undefined) {
      statsHtml += `
        <div class="stat-item">
          <span class="stat-label">Notas Corretas</span>
          <span class="stat-value">${stats.correctNotes}/${stats.totalNotes}</span>
        </div>
      `;
    }

    if (stats.duration !== undefined) {
      statsHtml += `
        <div class="stat-item">
          <span class="stat-label">Duração</span>
          <span class="stat-value">${(stats.duration / 60).toFixed(1)} min</span>
        </div>
      `;
    }

    statsHtml += '</div>';

    modal.innerHTML = `
      <div class="modal__overlay"></div>
      <div class="modal__content">
        <h2 class="modal__title">${this.escapeHtml(title)}</h2>
        ${statsHtml}
        <div class="modal__actions">
          <button class="button button--primary" data-action="close">Fechar</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('[data-action="close"]');
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });

    closeBtn.focus();
  }

  /**
   * Cria barra de progresso
   */
  createProgressBar(container, initialValue = 0) {
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.innerHTML = `
      <div class="progress-bar__fill" style="width: ${initialValue}%"></div>
      <span class="progress-bar__text">${initialValue}%</span>
    `;

    container.appendChild(progressBar);

    return {
      element: progressBar,
      setValue: (value) => {
        const fill = progressBar.querySelector('.progress-bar__fill');
        const text = progressBar.querySelector('.progress-bar__text');
        fill.style.width = `${Math.min(100, Math.max(0, value))}%`;
        text.textContent = `${Math.round(value)}%`;
      }
    };
  }

  /**
   * Habilita dicas de teclado (accessibility)
   */
  enableKeyboardHints() {
    this.showNotification(
      '💡 Use TAB para navegar, ENTER para ativar, ESC para sair',
      'info',
      5000
    );
  }

  /**
   * Salva tema no localStorage
   */
  saveTheme() {
    localStorage.setItem('terraVision_theme', this.currentTheme);
  }

  /**
   * Carrega tema do localStorage
   */
  loadTheme() {
    try {
      return localStorage.getItem('terraVision_theme') || 'dark';
    } catch (e) {
      return 'dark';
    }
  }

  /**
   * Salva configurações de acessibilidade
   */
  saveAccessibilitySettings() {
    try {
      localStorage.setItem(
        'terraVision_accessibility',
        JSON.stringify(this.accessibility)
      );
    } catch (e) {
      console.error('Erro ao salvar acessibilidade:', e);
    }
  }

  /**
   * Carrega configurações de acessibilidade
   */
  loadAccessibilitySettings() {
    try {
      const stored = localStorage.getItem('terraVision_accessibility');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Erro ao carregar acessibilidade:', e);
    }

    return {
      highContrast: false,
      fontSize: 'normal',
      audioFeedback: true,
      volume: 0.5
    };
  }

  /**
   * Cria container de notificações
   */
  createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notification-container';
    container.className = 'notification-container';
    document.body.appendChild(container);
    return container;
  }

  /**
   * Obtém ícone de notificação
   */
  getNotificationIcon(type) {
    const icons = {
      'success': '✅',
      'error': '❌',
      'warning': '⚠️',
      'info': 'ℹ️'
    };
    return icons[type] || '📌';
  }

  /**
   * Escapa caracteres HTML
   */
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, char => map[char]);
  }

  /**
   * Obtém configurações atuais
   */
  getSettings() {
    return {
      theme: this.currentTheme,
      accessibility: this.accessibility
    };
  }

  /**
   * Define configurações
   */
  applySettings(settings) {
    if (settings.theme) {
      this.setTheme(settings.theme);
    }

    if (settings.accessibility) {
      if (settings.accessibility.highContrast !== undefined) {
        this.toggleHighContrast(settings.accessibility.highContrast);
      }
      if (settings.accessibility.fontSize) {
        this.setFontSize(settings.accessibility.fontSize);
      }
      if (settings.accessibility.audioFeedback !== undefined) {
        this.toggleAudioFeedback(settings.accessibility.audioFeedback);
      }
      if (settings.accessibility.volume !== undefined) {
        this.setVolume(settings.accessibility.volume);
      }
    }
  }
}
