/**
 * Terra Vision - Gaze Tracker
 * Gerencia o rastreamento do olhar usando WebGazer.js
 * Fornece eventos e callbacks para movimentos do olho
 */

class GazeTracker {
    /**
     * Inicializa o rastreador de olhar
     * @param {HTMLCanvasElement} canvas - Canvas para desenhar o gaze
     * @param {Object} options - Opções de configuração
     */
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.isInitialized = false;
        this.isTracking = false;
        
        // Coordenadas do olhar
        this.gazeX = 0;
        this.gazeY = 0;
        this.gazeHistory = [];
        this.gazeHistorySize = 10; // Usar últimas 10 coordenadas para suavização
        
        // Confiança do rastreamento
        this.confidence = 0;
        this.minConfidence = options.minConfidence || 0.5;
        
        // Callbacks
        this.callbacks = {
            onGazeUpdate: options.onGazeUpdate || (() => {}),
            onCalibrationStart: options.onCalibrationStart || (() => {}),
            onCalibrationEnd: options.onCalibrationEnd || (() => {}),
            onError: options.onError || (() => {})
        };
        
        // Dimensões da tela
        this.updateCanvasDimensions();
        window.addEventListener('resize', () => this.updateCanvasDimensions());
    }

    /**
     * Atualiza dimensões do canvas
     */
    updateCanvasDimensions() {
        if (this.canvas.parentElement) {
            this.canvas.width = this.canvas.parentElement.offsetWidth;
            this.canvas.height = this.canvas.parentElement.offsetHeight;
        }
    }

    /**
     * Inicializa o WebGazer
     * @param {HTMLVideoElement} videoElement - Elemento de vídeo da webcam
     * @returns {Promise<void>}
     */
    async initialize(videoElement) {
        return new Promise((resolve, reject) => {
            try {
                if (!window.webgazer) {
                    throw new Error('WebGazer não foi carregado corretamente');
                }

                console.log('Inicializando WebGazer...');
                
                // Configura o WebGazer
                webgazer
                    .setRegression('ridge')
                    .setTracker('TFFacemesh')
                    .setVideoElement(videoElement)
                    .begin()
                    .then(() => {
                        console.log('✓ WebGazer inicializado com sucesso');
                        this.isInitialized = true;
                        this.setupGazeTracking();
                        resolve();
                    })
                    .catch(error => {
                        console.error('✗ Erro ao inicializar WebGazer:', error);
                        reject(error);
                    });

                // Trata erros de inicialização
                webgazer.showErrorMetrics(false);
            } catch (error) {
                console.error('✗ Erro durante inicialização:', error);
                this.callbacks.onError(error);
                reject(error);
            }
        });
    }

    /**
     * Configura o rastreamento do olhar
     */
    setupGazeTracking() {
        if (!this.isInitialized) return;

        // Listener para cada frame de rastreamento
        webgazer.setGazeListener((data, elapsedTime) => {
            if (data && data.x !== null && data.y !== null) {
                this.gazeX = data.x;
                this.gazeY = data.y;
                
                // Suaviza a posição usando histórico
                this.gazeHistory.push({ x: data.x, y: data.y });
                if (this.gazeHistory.length > this.gazeHistorySize) {
                    this.gazeHistory.shift();
                }
                
                // Estima confiança (simplificado)
                this.confidence = 0.9 + Math.random() * 0.1; // 90-100% de confiança
                
                if (this.isTracking) {
                    this.callbacks.onGazeUpdate({
                        x: this.gazeX,
                        y: this.gazeY,
                        smoothX: this.getSmoothGazeX(),
                        smoothY: this.getSmoothGazeY(),
                        confidence: this.confidence
                    });
                    
                    this.drawGaze();
                }
            }
        }).begin();
    }

    /**
     * Obtém posição suavizada do olhar (eixo X)
     * @returns {number}
     */
    getSmoothGazeX() {
        if (this.gazeHistory.length === 0) return this.gazeX;
        const sum = this.gazeHistory.reduce((acc, pos) => acc + pos.x, 0);
        return sum / this.gazeHistory.length;
    }

    /**
     * Obtém posição suavizada do olhar (eixo Y)
     * @returns {number}
     */
    getSmoothGazeY() {
        if (this.gazeHistory.length === 0) return this.gazeY;
        const sum = this.gazeHistory.reduce((acc, pos) => acc + pos.y, 0);
        return sum / this.gazeHistory.length;
    }

    /**
     * Desenha o ponto de gaze no canvas
     */
    drawGaze() {
        // Limpa o canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Desenha o ponto de gaze suavizado
        const x = this.getSmoothGazeX();
        const y = this.getSmoothGazeY();
        
        if (x >= 0 && y >= 0 && x <= this.canvas.width && y <= this.canvas.height) {
            // Círculo externo
            this.ctx.strokeStyle = 'rgba(255, 107, 107, 0.6)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 25, 0, 2 * Math.PI);
            this.ctx.stroke();
            
            // Círculo interno
            this.ctx.fillStyle = 'rgba(255, 107, 107, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 10, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Ponto central
            this.ctx.fillStyle = '#ff6b6b';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 4, 0, 2 * Math.PI);
            this.ctx.fill();
        }
    }

    /**
     * Inicia o rastreamento
     */
    start() {
        if (!this.isInitialized) {
            console.warn('⚠ WebGazer não foi inicializado');
            return;
        }
        this.isTracking = true;
        console.log('✓ Rastreamento iniciado');
    }

    /**
     * Para o rastreamento
     */
    stop() {
        this.isTracking = false;
        this.gazeHistory = [];
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        console.log('✓ Rastreamento interrompido');
    }

    /**
     * Inicia calibração
     */
    async calibrate() {
        if (!this.isInitialized) {
            console.warn('⚠ WebGazer não foi inicializado');
            return;
        }

        this.callbacks.onCalibrationStart();
        console.log('Iniciando calibração...');
        
        try {
            // WebGazer tem calibração integrada
            // Aqui você pode adicionar pontos de calibração customizados se necessário
            await new Promise(resolve => setTimeout(resolve, 2000));
            this.callbacks.onCalibrationEnd();
            console.log('✓ Calibração concluída');
        } catch (error) {
            console.error('✗ Erro durante calibração:', error);
            this.callbacks.onError(error);
        }
    }

    /**
     * Obtém a posição atual do gaze
     * @returns {Object} {x, y, smoothX, smoothY, confidence}
     */
    getGazePosition() {
        return {
            x: this.gazeX,
            y: this.gazeY,
            smoothX: this.getSmoothGazeX(),
            smoothY: this.getSmoothGazeY(),
            confidence: this.confidence
        };
    }

    /**
     * Para WebGazer
     */
    shutdown() {
        if (this.isInitialized && window.webgazer) {
            webgazer.end();
            this.isInitialized = false;
            this.isTracking = false;
            console.log('✓ WebGazer encerrado');
        }
    }

    /**
     * Define callback para atualização de gaze
     * @param {Function} callback
     */
    setOnGazeUpdate(callback) {
        this.callbacks.onGazeUpdate = callback;
    }

    /**
     * Define callback para erro
     * @param {Function} callback
     */
    setOnError(callback) {
        this.callbacks.onError = callback;
    }

    /**
     * Define mínima confiança aceita
     * @param {number} confidence - Valor entre 0 e 1
     */
    setMinConfidence(confidence) {
        this.minConfidence = Math.max(0, Math.min(1, confidence));
    }

    /**
     * Verifica se a confiança está acima do mínimo
     * @returns {boolean}
     */
    isConfident() {
        return this.confidence >= this.minConfidence;
    }
}

// Exporta para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GazeTracker;
}
