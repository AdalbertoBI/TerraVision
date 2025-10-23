/**
 * Terra Vision - Main Application
 * Integra todos os módulos: rastreamento ocular, detecção de piscadas,
 * círculo pizza de notas e gerenciador de áudio
 */

class TerrVisionApp {
    /**
     * Inicializa a aplicação Terra Vision
     */
    constructor() {
        this.initialized = false;
        
        // Componentes
        this.audioManager = null;
        this.gazeTracker = null;
        this.blinkDetector = null;
        this.pizzaCircle = null;
        this.fullscreenManager = null;
        
        // Elementos do DOM
        this.elements = {
            videoElement: document.getElementById('webcam'),
            gazeCanvas: document.getElementById('gaze-canvas'),
            pizzaCanvas: document.getElementById('pizza-canvas'),
            pizzaContainer: document.querySelector('.pizza-circle-container'),
            gazeIndicator: document.getElementById('gaze-indicator'),
            focusFeedback: document.getElementById('focus-feedback'),
            focusNote: document.getElementById('focus-note'),
            
            startBtn: document.getElementById('start-btn'),
            stopBtn: document.getElementById('stop-btn'),
            calibrateBtn: document.getElementById('calibrate-btn'),
            
            statusText: document.getElementById('status-text'),
            eyeDetected: document.getElementById('eye-detected'),
            blinkCount: document.getElementById('blink-count'),
            confidence: document.getElementById('confidence'),
            
            permissionModal: document.getElementById('permission-modal'),
            allowCameraBtn: document.getElementById('allow-camera-btn'),
            denyCameraBtn: document.getElementById('deny-camera-btn')
        };
        
        // Estado
        this.isRunning = false;
        this.animationFrameId = null;
        
        this.setupEventListeners();
    }

    /**
     * Configura listeners de eventos
     */
    setupEventListeners() {
        this.elements.startBtn.addEventListener('click', () => this.start());
        this.elements.stopBtn.addEventListener('click', () => this.stop());
        this.elements.calibrateBtn.addEventListener('click', () => this.calibrate());
        
        this.elements.allowCameraBtn.addEventListener('click', () => this.initialize());
        this.elements.denyCameraBtn.addEventListener('click', () => this.closePermissionModal());
    }

    /**
     * Inicia a aplicação (solicita permissões)
     */
    start() {
        if (!this.initialized) {
            this.showPermissionModal();
        } else {
            this.startTracking();
        }
    }

    /**
     * Mostra modal de permissão
     */
    showPermissionModal() {
        this.elements.permissionModal.classList.remove('hidden');
    }

    /**
     * Fecha modal de permissão
     */
    closePermissionModal() {
        this.elements.permissionModal.classList.add('hidden');
    }

    /**
     * Inicializa a aplicação (obtém acesso à webcam)
     */
    async initialize() {
        try {
            this.closePermissionModal();
            this.updateStatus('Solicitando acesso à câmera...');
            
            // Solicita acesso à webcam
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });
            
            this.elements.videoElement.srcObject = stream;
            this.updateStatus('Câmera conectada. Inicializando rastreamento...');
            
            // Aguarda carregamento do vídeo
            await new Promise(resolve => {
                this.elements.videoElement.onloadedmetadata = () => {
                    this.elements.videoElement.play();
                    resolve();
                };
            });
            
            // Inicializa componentes
            this.initializeComponents();
            this.initialized = true;
            
            this.updateStatus('Sistema pronto! Clique em "Iniciar Rastreamento"');
            this.elements.startBtn.textContent = 'Iniciar Rastreamento';
            
        } catch (error) {
            console.error('✗ Erro ao acessar câmera:', error);
            
            if (error.name === 'NotAllowedError') {
                this.updateStatus('Permissão negada para câmera');
            } else if (error.name === 'NotFoundError') {
                this.updateStatus('Câmera não encontrada');
            } else {
                this.updateStatus('Erro ao acessar câmera: ' + error.message);
            }
            
            this.elements.eyeDetected.textContent = 'Erro';
        }
    }

    /**
     * Inicializa todos os componentes
     */
    initializeComponents() {
        // AudioManager
        this.audioManager = new AudioManager();
        console.log('✓ AudioManager inicializado');
        
        // GazeTracker
        this.gazeTracker = new GazeTracker(this.elements.gazeCanvas);
        this.gazeTracker.setOnGazeUpdate((data) => this.handleGazeUpdate(data));
        console.log('✓ GazeTracker inicializado');
        
        // BlinkDetector
        this.blinkDetector = new BlinkDetector();
        this.blinkDetector.setOnBlink((data) => this.handleBlink(data));
        console.log('✓ BlinkDetector inicializado');
        
        // PizzaCircle
        this.pizzaCircle = new PizzaCircle(
            this.elements.pizzaCanvas,
            this.audioManager,
            8
        );
        this.pizzaCircle.setOnSliceHover((index, note) => this.handleSliceHover(index, note));
        this.pizzaCircle.setOnSliceClick((index, note) => this.handleSliceClick(index, note));
        this.pizzaCircle.draw();
        console.log('✓ PizzaCircle inicializado');

        // Fullscreen Manager
        if (this.elements.pizzaCanvas) {
            this.fullscreenManager = new FullscreenManager(
                this.elements.pizzaCanvas,
                this.elements.pizzaContainer,
                this.audioManager
            );

            this.fullscreenManager.setupResizeListener();

            const controlsGroup = document.querySelector('.controls .control-group');
            if (controlsGroup) {
                this.fullscreenManager.createFullscreenButton(controlsGroup);
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
                        feedback: 'Calibração iniciada.',
                        onActivate: () => this.calibrate()
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
                        onActivate: () => this.showHelpMessage()
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
    }

    /**
     * Inicia o rastreamento
     */
    async startTracking() {
        try {
            if (this.isRunning) return;
            
            this.updateStatus('Inicializando WebGazer...');
            
            // Inicializa GazeTracker (WebGazer)
            await this.gazeTracker.initialize(this.elements.videoElement);
            this.gazeTracker.start();
            
            this.isRunning = true;
            this.updateStatus('Rastreamento ativo');
            
            // Atualiza botões
            this.elements.startBtn.classList.add('hidden');
            this.elements.stopBtn.classList.remove('hidden');
            this.elements.gazeIndicator.classList.add('active');
            
            // Loop de atualização
            this.animationFrame();
            
            console.log('✓ Rastreamento iniciado');
            
        } catch (error) {
            console.error('✗ Erro ao iniciar rastreamento:', error);
            this.updateStatus('Erro ao iniciar rastreamento');
        }
    }

    /**
     * Para o rastreamento
     */
    stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        
        // Para componentes
        if (this.gazeTracker) {
            this.gazeTracker.stop();
        }
        if (this.audioManager) {
            this.audioManager.stopAll();
        }
        
        // Para animação
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        // Atualiza UI
        this.updateStatus('Rastreamento pausado');
        this.elements.startBtn.classList.remove('hidden');
        this.elements.stopBtn.classList.add('hidden');
        this.elements.gazeIndicator.classList.remove('active');
        this.elements.focusFeedback.classList.add('hidden');
        this.pizzaCircle.clearFocus();
        
        console.log('✓ Rastreamento parado');
    }

    /**
     * Calibra o rastreamento
     */
    async calibrate() {
        if (!this.initialized) {
            this.updateStatus('Inicialize o sistema primeiro');
            return;
        }
        
        this.updateStatus('Calibrando... Olhe para os pontos na tela');
        this.elements.calibrateBtn.disabled = true;
        
        try {
            await this.gazeTracker.calibrate();
            this.updateStatus('Calibração concluída!');
        } catch (error) {
            console.error('✗ Erro durante calibração:', error);
            this.updateStatus('Erro na calibração');
        }
        
        this.elements.calibrateBtn.disabled = false;
    }

    /**
     * Loop de animação principal
     */
    animationFrame() {
        if (!this.isRunning) return;
        
        // Atualiza o círculo com posição atual de gaze
        if (this.gazeTracker) {
            const gazePos = this.gazeTracker.getGazePosition();
            
            // Atualiza círculo pizza
            if (this.pizzaCircle) {
                this.pizzaCircle.updateFocus(gazePos.x, gazePos.y);
            }
            
            // Atualiza indicador de gaze
            this.elements.gazeIndicator.style.left = gazePos.x + 'px';
            this.elements.gazeIndicator.style.top = gazePos.y + 'px';
            
            // Atualiza stats
            this.elements.eyeDetected.textContent = 'Sim';
            this.elements.confidence.textContent = Math.round(gazePos.confidence * 100) + '%';
        }
        
        // Atualiza contador de piscadas
        if (this.blinkDetector) {
            this.elements.blinkCount.textContent = this.blinkDetector.getBlinkCount();
        }
        
        this.animationFrameId = requestAnimationFrame(() => this.animationFrame());
    }

    /**
     * Handle de atualização de gaze
     * @param {Object} data - Dados de gaze
     */
    handleGazeUpdate(data) {
        this.fullscreenManager?.handleGazePoint(data);
    }

    /**
     * Handle de detecção de piscada
     * @param {Object} blinkData - Dados da piscada
     */
    handleBlink(blinkData) {
        if (this.fullscreenManager && this.fullscreenManager.handleBlink()) {
            return;
        }

        console.log(`👁️ Piscada detectada! Total: ${blinkData.count}`);
        
        // Se há uma fatia focada, toca a nota
        if (this.pizzaCircle) {
            const focusedSlice = this.pizzaCircle.getFocusedSlice();
            if (focusedSlice >= 0) {
                this.pizzaCircle.selectSlice(focusedSlice);
            }
        }
    }

    /**
     * Handle de hover em fatia
     * @param {number} index - Índice da fatia
     * @param {string} note - Nome da nota
     */
    handleSliceHover(index, note) {
        this.elements.focusNote.textContent = note;
        this.elements.focusFeedback.classList.remove('hidden');
    }

    /**
     * Handle de clique em fatia
     * @param {number} index - Índice da fatia
     * @param {string} note - Nome da nota
     */
    handleSliceClick(index, note) {
        console.log(`🎵 Nota clicada: ${note}`);
    }

    /**
     * Atualiza status na UI
     * @param {string} message - Mensagem de status
     */
    updateStatus(message) {
        this.elements.statusText.textContent = message;
        console.log('📊 Status: ' + message);
    }

    /**
     * Ajusta estado de áudio via gaze control
     * @param {boolean} active - true quando áudio deve ficar ligado
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
        this.updateStatus(active ? 'Áudio ativado' : 'Áudio silenciado');
    }

    /**
     * Exibe mensagem rápida de ajuda no status
     */
    showHelpMessage() {
        this.updateStatus('Dica: Foque em uma fatia e pisque para tocar a nota correspondente.');
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
     * Limpa e encerra a aplicação
     */
    shutdown() {
        this.stop();
        
        if (this.gazeTracker) {
            this.gazeTracker.shutdown();
        }
        
        if (this.elements.videoElement.srcObject) {
            this.elements.videoElement.srcObject.getTracks().forEach(track => track.stop());
        }
        
        console.log('✓ Aplicação encerrada');
    }
}

// Inicializa quando o DOM está pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Terra Vision iniciando...');
    window.app = new TerrVisionApp();
    console.log('✓ Terra Vision pronto!');
});

// Limpa ao sair da página
window.addEventListener('beforeunload', () => {
    if (window.app) {
        window.app.shutdown();
    }
});
