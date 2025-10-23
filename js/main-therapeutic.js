/**
 * Terra Vision - Aplicação Principal Terapêutica
 * Integra todos os módulos: calibração, rastreamento, detecção de piscadas,
 * círculo pizza, modo terapêutico e gerenciamento de UI
 */

class TerrVisionAppTherapeutic {
    /**
     * Inicializa a aplicação Terra Vision Terapêutica
     */
    constructor() {
        this.initialized = false;
        this.isRunning = false;
        this.animationFrameId = null;
        
        // Componentes principais
        this.audioManager = null;
        this.gazeTracker = null;
        this.blinkDetector = null;
        this.pizzaCircle = null;
        this.calibration = null;
        this.therapyMode = null;
        this.uiManager = null;
    this.fullscreenManager = null;
        
        // Estado da sessão
        this.currentTherapyMode = null;
        this.sessionActive = false;
        
        // Elementos do DOM
        this.elements = {
            // Containers principais
            sessionContainer: document.getElementById('session-container'),
            initialScreen: document.getElementById('initial-screen'),
            startupModal: document.getElementById('startup-modal'),
            
            // Mídia
            videoElement: document.getElementById('webcam'),
            gazeCanvas: document.getElementById('gaze-canvas'),
            pizzaCanvas: document.getElementById('pizza-canvas'),
            pizzaContainer: document.getElementById('pizza-container') || document.querySelector('.pizza-circle-container'),
            
            // Indicadores
            gazeIndicator: document.getElementById('gaze-indicator'),
            focusFeedback: document.getElementById('focus-feedback'),
            focusNote: document.getElementById('focus-note'),
            statusText: document.getElementById('status-text'),
            
            // Estatísticas
            elapsedTime: document.getElementById('elapsed-time'),
            correctNotes: document.getElementById('correct-notes'),
            accuracy: document.getElementById('accuracy'),
            difficulty: document.getElementById('difficulty'),
            
            // Controles
            pauseBtn: document.getElementById('pause-btn'),
            difficultyDecrease: document.getElementById('difficulty-decrease'),
            difficultyIncrease: document.getElementById('difficulty-increase'),
            endSessionBtn: document.getElementById('end-session-btn'),
            settingsBtn: document.getElementById('settings-btn'),
            helpBtn: document.getElementById('help-btn'),
            
            // Modais
            settingsModal: document.getElementById('settings-modal'),
            notificationContainer: document.getElementById('notification-container')
        };
        
        console.log('🎯 Terra Vision Terapêutico Inicializando...');
        this.setupEventListeners();
    }

    /**
     * Configura event listeners
     */
    setupEventListeners() {
        // Controles de sessão
        if (this.elements.pauseBtn) {
            this.elements.pauseBtn.addEventListener('click', () => this.togglePauseSession());
        }
        
        if (this.elements.difficultyDecrease) {
            this.elements.difficultyDecrease.addEventListener('click', () => this.changeDifficulty(-1));
        }
        
        if (this.elements.difficultyIncrease) {
            this.elements.difficultyIncrease.addEventListener('click', () => this.changeDifficulty(1));
        }
        
        if (this.elements.endSessionBtn) {
            this.elements.endSessionBtn.addEventListener('click', () => this.endSession());
        }
        
        if (this.elements.settingsBtn) {
            this.elements.settingsBtn.addEventListener('click', () => this.showSettings());
        }
        
        if (this.elements.helpBtn) {
            this.elements.helpBtn.addEventListener('click', () => this.showHelp());
        }
    }

    /**
     * Inicia aplicação
     */
    async start() {
        try {
            console.log('🚀 Iniciando Terra Vision...');
            
            // Inicializa componentes
            this.audioManager = new AudioManager();
            this.gazeTracker = new GazeTracker();
            this.blinkDetector = new BlinkDetector();
            this.pizzaCircle = new PizzaCircle(
                this.elements.pizzaCanvas,
                this.audioManager
            );
            this.uiManager = new UIManager(this.audioManager);
            
            // Inicializa calibração
            this.calibration = new CalibrationSystem(
                this.gazeTracker,
                this.audioManager
            );
            
            // Inicializa modo terapêutico
            this.therapyMode = new TherapyMode(
                this.pizzaCircle,
                this.audioManager,
                this.blinkDetector
            );

            // Gerenciador fullscreen
            if (this.elements.pizzaCanvas) {
                this.fullscreenManager = new FullscreenManager(
                    this.elements.pizzaCanvas,
                    this.elements.pizzaContainer || this.elements.sessionContainer,
                    this.audioManager
                );

                this.fullscreenManager.setupResizeListener();

                const fullscreenAnchor = document.querySelector('[data-fullscreen-anchor]') || this.elements.sessionContainer?.querySelector('.session-actions') || document.querySelector('.controls .control-group');
                if (fullscreenAnchor) {
                    this.fullscreenManager.createFullscreenButton(fullscreenAnchor);
                }

                this.fullscreenManager.configureGazeControls({
                    dwellDuration: 1500,
                    requireBlink: true,
                    actions: [
                        {
                            id: 'calibrate',
                            label: 'Calibrar',
                            icon: '🎯',
                            side: 'left',
                            hint: 'Foque e pisque para recalibrar.',
                            confirmHint: 'Piscar inicia a calibração.',
                            feedback: 'Recalibração iniciada.',
                            onActivate: () => this.calibration?.recalibrate()
                        },
                        {
                            id: 'audio-toggle',
                            label: 'Áudio On',
                            icon: '🔊',
                            side: 'left',
                            hint: 'Foque para silenciar ou ativar áudio.',
                            confirmHint: 'Piscar alterna o áudio.',
                            feedback: 'Estado do áudio atualizado.',
                            toggleable: true,
                            active: true,
                            onActivate: ({ active }) => this.handleAudioToggle(active)
                        },
                        {
                            id: 'show-help',
                            label: 'Ajuda',
                            icon: '❓',
                            side: 'right',
                            hint: 'Foque para ver dicas rápidas.',
                            confirmHint: 'Piscar mostra dicas.',
                            feedback: 'Dica exibida.',
                            onActivate: () => this.showHelp()
                        },
                        {
                            id: 'exit-fullscreen',
                            label: 'Sair',
                            icon: '⏏️',
                            side: 'right',
                            hint: 'Foque para sair do fullscreen.',
                            confirmHint: 'Piscar sai do fullscreen.',
                            feedback: 'Fullscreen desativado.',
                            onActivate: () => this.fullscreenManager.exitFullscreen()
                        }
                    ]
                });

                this.fullscreenManager.onEnterFullscreen = () => {
                    this.fullscreenManager.scalePizzaToDimensions(window.innerWidth, window.innerHeight);
                    this.pizzaCircle?.draw();
                };

                this.fullscreenManager.onExitFullscreen = () => {
                    this.resetPizzaLayout();
                    this.pizzaCircle?.draw();
                };
            }
            
            this.setupTherapyCallbacks();
            this.initialized = true;
            
            console.log('✅ Todos os componentes inicializados');
            this.uiManager.showNotification('✅ Sistema inicializado', 'success');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar:', error);
            this.uiManager?.showNotification(`❌ Erro: ${error.message}`, 'error');
        }
    }

    /**
     * Configura callbacks do modo terapêutico
     */
    setupTherapyCallbacks() {
        if (!this.therapyMode) return;
        
        // Callback ao iniciar sessão
        this.therapyMode.onSessionStart = (session) => {
            this.sessionActive = true;
            this.currentTherapyMode = session.mode;
            this.showSessionUI();
            this.startTracking();
            console.log(`🎯 Sessão iniciada: ${session.mode}`);
        };
        
        // Callback ao finalizar sessão
        this.therapyMode.onSessionEnd = (sessionData) => {
            this.sessionActive = false;
            this.stopTracking();
            this.showSessionResults(sessionData);
            console.log('✅ Sessão finalizada');
        };
        
        // Callback ao atingir milestone
        this.therapyMode.onMilestone = (milestone) => {
            this.uiManager.showNotification(
                `🎉 ${milestone.message}`,
                'success',
                2000
            );
        };
        
        // Callback de atualização de stats
        this.therapyMode.onStatsUpdate = (stats) => {
            this.updateStatsDisplay(stats);
        };
        
        // Callback de mudança de dificuldade
        this.therapyMode.onDifficultyChange = (level) => {
            this.updateDifficultyDisplay(level);
        };
    }

    /**
     * Mostra UI de sessão
     */
    showSessionUI() {
        if (this.elements.initialScreen) {
            this.elements.initialScreen.classList.add('hidden');
        }
        if (this.elements.sessionContainer) {
            this.elements.sessionContainer.classList.remove('hidden');
        }
        if (this.elements.startupModal) {
            this.elements.startupModal.classList.remove('modal-active');
        }
    }

    /**
     * Oculta UI de sessão
     */
    hideSessionUI() {
        if (this.elements.sessionContainer) {
            this.elements.sessionContainer.classList.add('hidden');
        }
        if (this.elements.initialScreen) {
            this.elements.initialScreen.classList.remove('hidden');
        }
    }

    /**
     * Inicia rastreamento de câmera
     */
    async startTracking() {
        try {
            if (!this.gazeTracker) {
                throw new Error('GazeTracker não inicializado');
            }
            
            // Inicializa WebGazer
            await this.gazeTracker.initialize(this.elements.videoElement);
            await this.gazeTracker.start();
            this.gazeTracker.setOnGazeUpdate((data) => this.fullscreenManager?.handleGazePoint(data));
            
            // Configura callbacks de blink
            this.blinkDetector.onBlink = () => this.handleBlink();
            
            this.isRunning = true;
            console.log('👁️ Rastreamento iniciado');
            
            // Inicia loop de animação
            this.animationLoop();
            
        } catch (error) {
            console.error('❌ Erro ao iniciar rastreamento:', error);
            this.uiManager?.showNotification(
                `❌ Erro ao acessar câmera: ${error.message}`,
                'error'
            );
        }
    }

    /**
     * Para rastreamento
     */
    stopTracking() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        this.isRunning = false;
        this.gazeTracker?.stop();
        console.log('🛑 Rastreamento parado');
    }

    /**
     * Loop de animação principal
     */
    animationLoop() {
        if (!this.isRunning) return;
        
        try {
            // Obtém posição do gaze
            const gaze = this.gazeTracker?.getGazePosition();
            
            if (gaze && gaze.confidence > 0.5) {
                // Atualiza indicador de gaze
                if (this.elements.gazeIndicator) {
                    this.elements.gazeIndicator.style.left = gaze.x + 'px';
                    this.elements.gazeIndicator.style.top = gaze.y + 'px';
                }
                
                // Atualiza foco no círculo pizza
                if (this.pizzaCircle) {
                    this.pizzaCircle.updateFocus(gaze.x, gaze.y);
                    
                    // Obtém fatia em foco
                    const focusedSlice = this.pizzaCircle.getSliceAtPosition(gaze.x, gaze.y);
                    this.updateFocusDisplay(focusedSlice);
                }
                
                // Atualiza tempo de foco para terapia
                if (this.therapyMode && this.sessionActive) {
                    this.therapyMode.updateFocusTime(16); // ~60 FPS
                }

                this.fullscreenManager?.handleGazePoint(gaze);
            }
            
            // Processa frame para blink detection
            if (this.gazeTracker?.canvasContext) {
                const frameData = this.gazeTracker.canvasContext.getImageData(
                    0, 0,
                    this.gazeTracker.canvasContext.canvas.width,
                    this.gazeTracker.canvasContext.canvas.height
                );
                this.blinkDetector?.processFrame(frameData);
            }
            
            // Continua loop
            this.animationFrameId = requestAnimationFrame(() => this.animationLoop());
            
        } catch (error) {
            console.error('Erro no loop de animação:', error);
        }
    }

    /**
     * Manipula detecção de piscada
     */
    handleBlink() {
        if (this.fullscreenManager && this.fullscreenManager.handleBlink()) {
            return;
        }
        console.log('👁️ Piscada detectada!');
        
        // Reproduz som de piscada
        this.audioManager?.playNote('Do', 0.1);
        
        // Toca nota do círculo pizza se em foco
        if (this.pizzaCircle) {
            const focusedSlice = this.pizzaCircle.getFocusedSlice();
            if (focusedSlice !== null) {
                this.pizzaCircle.selectSlice(focusedSlice);
                
                // Registra ação na terapia
                if (this.therapyMode && this.sessionActive) {
                    this.therapyMode.recordNoteAction(focusedSlice, true);
                }
            }
        }
    }

    /**
     * Atualiza display de foco
     */
    updateFocusDisplay(sliceIndex) {
        if (sliceIndex !== null && this.elements.focusFeedback) {
            const notes = ['Do', 'Re', 'Mi', 'Fá', 'Sol', 'Lá', 'Si', 'Do+'];
            this.elements.focusFeedback.classList.remove('hidden');
            this.elements.focusNote.textContent = notes[sliceIndex] || 'N/A';
        }
    }

    /**
     * Atualiza display de estatísticas
     */
    updateStatsDisplay(stats) {
        if (this.elements.elapsedTime) {
            const minutes = Math.floor(stats.elapsedTime / 60);
            const seconds = Math.floor(stats.elapsedTime % 60);
            this.elements.elapsedTime.textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        if (this.elements.correctNotes) {
            this.elements.correctNotes.textContent = stats.correctNotes;
        }
        
        if (this.elements.accuracy && stats.accuracy !== undefined) {
            this.elements.accuracy.textContent = `${stats.accuracy.toFixed(1)}%`;
        }
    }

    /**
     * Atualiza display de dificuldade
     */
    updateDifficultyDisplay(level) {
        const stars = '⭐'.repeat(level);
        if (this.elements.difficulty) {
            this.elements.difficulty.textContent = stars;
        }
    }

    /**
     * Pausa/Retoma sessão
     */
    togglePauseSession() {
        if (!this.therapyMode || !this.sessionActive) return;
        
        if (this.therapyMode.currentSession?.isPaused) {
            this.therapyMode.resumeSession();
            if (this.elements.pauseBtn) {
                this.elements.pauseBtn.textContent = '⏸️ Pausar';
            }
        } else {
            this.therapyMode.pauseSession();
            if (this.elements.pauseBtn) {
                this.elements.pauseBtn.textContent = '▶️ Retomar';
            }
        }
    }

    /**
     * Altera dificuldade
     */
    changeDifficulty(delta) {
        if (!this.therapyMode || !this.sessionActive) return;
        
        const currentMode = this.therapyMode.currentSession?.modeDetails;
        if (!currentMode) return;
        
        const newDifficulty = Math.max(1, Math.min(3, currentMode.difficulty + delta));
        this.therapyMode.changeDifficulty(newDifficulty);
    }

    /**
     * Finaliza sessão
     */
    endSession() {
        if (!this.therapyMode || !this.sessionActive) return;
        
        this.uiManager?.showConfirmDialog(
            'Finalizar Sessão?',
            'Tem certeza que deseja finalizar? Os dados da sessão serão salvos.',
            () => {
                this.therapyMode.endSession();
                this.hideSessionUI();
            }
        );
    }

    /**
     * Mostra resultados da sessão
     */
    showSessionResults(sessionData) {
        const stats = sessionData.stats;
        
        this.uiManager?.showProgressDialog(
            '✅ Sessão Concluída!',
            {
                accuracy: stats.accuracy,
                correctNotes: stats.correctNotes,
                totalNotes: stats.totalNotes,
                duration: stats.duration
            }
        );
    }

    /**
     * Mostra configurações
     */
    showSettings() {
        if (!this.elements.settingsModal) return;
        
        const modal = new bootstrap.Modal(this.elements.settingsModal);
        modal.show();
        
        // Aplicar mudanças de configurações
        this.setupSettingsHandlers();
    }

    /**
     * Configura handlers de settings
     */
    setupSettingsHandlers() {
        // Tema
        document.querySelectorAll('input[name="theme"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.uiManager?.setTheme(e.target.value);
            });
        });
        
        // Volume
        const volumeSlider = document.getElementById('volume-slider');
        if (volumeSlider) {
            volumeSlider.addEventListener('change', (e) => {
                this.uiManager?.setVolume(e.target.value / 100);
            });
        }
        
        // Feedback sonoro
        const audioFeedback = document.getElementById('audio-feedback');
        if (audioFeedback) {
            audioFeedback.addEventListener('change', (e) => {
                this.uiManager?.toggleAudioFeedback(e.target.checked);
            });
        }
        
        // Alto contraste
        const highContrast = document.getElementById('high-contrast');
        if (highContrast) {
            highContrast.addEventListener('change', (e) => {
                this.uiManager?.toggleHighContrast(e.target.checked);
            });
        }
    }

    /**
     * Mostra ajuda
     */
    showHelp() {
        this.uiManager?.showNotification(
            `👁️ Terra Vision - Use o círculo para focar e pisque para tocar notas! 
            ⚙️ Ajuste dificuldade durante a sessão. 📊 Seu progresso é acompanhado.`,
            'info',
            5000
        );
    }

    /**
     * Ajusta áudio de acordo com estado do controle gaze
     * @param {boolean} active
     */
    handleAudioToggle(active) {
        if (!this.audioManager) return;
        this.audioManager.setMuted(!active);
        this.fullscreenManager?.updateActionState('audio-toggle', {
            icon: active ? '🔊' : '🔇',
            label: active ? 'Áudio On' : 'Áudio Off',
            hint: active ? 'Foque para silenciar o áudio.' : 'Foque para reativar o áudio.',
            active
        });
        this.uiManager?.showNotification(active ? '🔊 Áudio ativado' : '🔇 Áudio silenciado', 'info', 2000);
    }

    /**
     * Restaura layout padrão do canvas da pizza ao sair do fullscreen
     */
    resetPizzaLayout() {
        if (!this.elements.pizzaCanvas) return;
        const canvas = this.elements.pizzaCanvas;
        canvas.style.position = '';
        canvas.style.left = '';
        canvas.style.top = '';
        canvas.style.transform = '';
        canvas.style.margin = '';
        canvas.style.display = '';
        canvas.style.width = '';
        canvas.style.height = '';
    }

    /**
     * Obtém instância da aplicação (singleton)
     */
    static getInstance() {
        if (!window._terrVisionApp) {
            window._terrVisionApp = new TerrVisionAppTherapeutic();
        }
        return window._terrVisionApp;
    }
}

// Inicializa ao carregar
document.addEventListener('DOMContentLoaded', async () => {
    const app = TerrVisionAppTherapeutic.getInstance();
    await app.start();
    
    // Função global para selecionar modo de terapia
    window.selectTherapyMode = async (mode) => {
        if (app.therapyMode) {
            await app.therapyMode.startSession(mode);
        }
    };
    
    // Função global para mostrar seleção de modo
    window.showModeSelection = () => {
        if (app.elements.startupModal) {
            app.elements.startupModal.classList.add('modal-active');
        }
    };
});
