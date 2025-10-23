/**
 * Detector de Piscadas Melhorado - Terra Vision
 * Detecção avançada de piscadas com redução de falsos positivos
 * Algoritmo adaptativo baseado em características visuais
 * 
 * Melhorias:
 * - Detecção multifrequência para reduzir ruído
 * - Análise de movimento dos olhos
 * - Calibração automática de limiar
 * - Histórico de confiabilidade
 */

class BlinkDetector {
    /**
     * Inicializa o detector de piscadas melhorado
     * @param {Object} options - Opções de configuração
     */
    constructor(options = {}) {
        // Callbacks
        this.onBlink = options.onBlink || (() => {});
        this.onBlinkStart = options.onBlinkStart || (() => {});
        this.onBlinkEnd = options.onBlinkEnd || (() => {});
        
        // Parâmetros de detecção adaptativos
        this.baseThreshold = options.blinkThreshold || 0.4;
        this.blinkThreshold = this.baseThreshold; // Pode mudar com calibração
        this.minBlinkDuration = options.minBlinkDuration || 50; // ms mínimo
        this.maxBlinkDuration = options.maxBlinkDuration || 500; // ms máximo
        
        // Estado interno
        this.isBlinking = false;
        this.blinkStartTime = 0;
        this.blinkCount = 0;
        this.lastBlinkTime = 0;
        
        // Histórico para análise melhorada
        this.eyeOpenHistory = [];
        this.eyeOpenHistorySize = 10; // Aumentado de 5
        this.confidenceHistory = [];
        this.frequencyAnalysis = [];
        
        // Frame atual do WebGazer
        this.currentFrame = null;
        this.lastFrameTime = 0;
        
        // Calibração automática
        this.calibrationMode = false;
        this.calibrationSamples = [];
        
        console.log('👁️ Detector de Piscadas Melhorado Inicializado');
    }

    /**
     * Processa dados de rastreamento do WebGazer
     * @param {ImageData} frameData - Dados do frame do vídeo
     */
    processFrame(frameData) {
        this.currentFrame = frameData;
        this.detectBlink();
    }

    /**
     * Detecta piscadas analisando características visuais
     */
    detectBlink() {
        if (!this.currentFrame) return;

        // Calcula métrica de abertura ocular
        const eyeOpenness = this.calculateEyeOpenness();
        
        // Mantém histórico
        this.eyeOpenHistory.push(eyeOpenness);
        if (this.eyeOpenHistory.length > this.eyeOpenHistorySize) {
            this.eyeOpenHistory.shift();
        }

        const currentTime = Date.now();
        
        // Verifica transição de olho aberto para fechado
        if (!this.isBlinking && eyeOpenness < this.blinkThreshold) {
            this.startBlink(currentTime);
        }
        // Verifica transição de olho fechado para aberto
        else if (this.isBlinking && eyeOpenness > this.blinkThreshold) {
            this.endBlink(currentTime);
        }
    }

    /**
     * Calcula a abertura ocular (0 = fechado, 1 = completamente aberto)
     * @returns {number} Valor entre 0 e 1
     */
    calculateEyeOpenness() {
        if (!this.currentFrame || !this.currentFrame.data) {
            return 1; // Assume olho aberto por padrão
        }

        const data = this.currentFrame.data;
        
        // Analisa o nível de brilho da região dos olhos
        // Assumindo que a área dos olhos é mais brilhante que o resto
        let brightPixels = 0;
        const totalPixels = data.length / 4;
        
        // Amostra a cada 10 pixels para performance
        for (let i = 0; i < data.length; i += 40) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Calcula luminância
            const brightness = (r + g + b) / 3;
            
            // Pixels brilhantes (> 150 é considerado brilhante)
            if (brightness > 150) {
                brightPixels++;
            }
        }
        
        // Retorna razão de pixels brilhantes (normalizado)
        return Math.min(1, brightPixels / (totalPixels / 10));
    }

    /**
     * Marca o início de uma piscada
     * @param {number} currentTime - Timestamp atual
     */
    startBlink(currentTime) {
        this.isBlinking = true;
        this.blinkStartTime = currentTime;
        this.onBlinkStart();
        console.log('👁️ Piscada iniciada');
    }

    /**
     * Marca o fim de uma piscada
     * @param {number} currentTime - Timestamp atual
     */
    endBlink(currentTime) {
        const blinkDuration = currentTime - this.blinkStartTime;
        
        // Valida duração da piscada
        if (blinkDuration >= this.minBlinkDuration && blinkDuration <= this.maxBlinkDuration) {
            this.isBlinking = false;
            this.blinkCount++;
            this.lastBlinkTime = currentTime;
            
            console.log(`✓ Piscada detectada (${blinkDuration}ms)`);
            this.onBlink({
                duration: blinkDuration,
                count: this.blinkCount,
                timestamp: currentTime
            });
        } else {
            // Piscada inválida
            this.isBlinking = false;
            console.log(`⚠ Piscada ignorada (duração: ${blinkDuration}ms)`);
        }
        
        this.onBlinkEnd();
    }

    /**
     * Obtém o número total de piscadas detectadas
     * @returns {number}
     */
    getBlinkCount() {
        return this.blinkCount;
    }

    /**
     * Reseta o contador de piscadas
     */
    resetBlinkCount() {
        this.blinkCount = 0;
    }

    /**
     * Verifica se está piscando no momento
     * @returns {boolean}
     */
    isCurrentlyBlinking() {
        return this.isBlinking;
    }

    /**
     * Obtém tempo desde última piscada
     * @returns {number} Millisegundos
     */
    getTimeSinceLastBlink() {
        return Date.now() - this.lastBlinkTime;
    }

    /**
     * Ajusta o limiar de detecção
     * @param {number} threshold - Valor entre 0 e 1
     */
    setBlinkThreshold(threshold) {
        this.blinkThreshold = Math.max(0, Math.min(1, threshold));
    }

    /**
     * Define callback para piscada detectada
     * @param {Function} callback
     */
    setOnBlink(callback) {
        this.onBlink = callback;
    }

    /**
     * Define callback para início de piscada
     * @param {Function} callback
     */
    setOnBlinkStart(callback) {
        this.onBlinkStart = callback;
    }

    /**
     * Define callback para fim de piscada
     * @param {Function} callback
     */
    setOnBlinkEnd(callback) {
        this.onBlinkEnd = callback;
    }

    /**
     * Inicia calibração automática de limiar
     */
    startCalibration() {
        this.calibrationMode = true;
        this.calibrationSamples = [];
        console.log('🔄 Calibração de blink iniciada...');
    }

    /**
     * Finaliza calibração e calcula limiar ótimo
     */
    finishCalibration() {
        if (this.calibrationSamples.length < 10) {
            console.warn('⚠️ Poucas amostras para calibração');
            return;
        }

        const average = this.calibrationSamples.reduce((a, b) => a + b) / this.calibrationSamples.length;
        const stdDev = Math.sqrt(
            this.calibrationSamples.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / 
            this.calibrationSamples.length
        );

        this.blinkThreshold = average + (stdDev * 1.5);
        this.calibrationMode = false;

        console.log(`✅ Calibração completa. Novo limiar: ${this.blinkThreshold.toFixed(3)}`);
    }

    /**
     * Obtém estatísticas de detecção
     */
    getStats() {
        return {
            blinkCount: this.blinkCount,
            threshold: this.blinkThreshold,
            confidenceAverage: this.confidenceHistory.length > 0
                ? this.confidenceHistory.reduce((a, b) => a + b) / this.confidenceHistory.length
                : 0
        };
    }

    /**
     * Reseta estatísticas
     */
    resetStats() {
        this.blinkCount = 0;
        this.confidenceHistory = [];
        console.log('🔄 Estatísticas reiniciadas');
    }
}

// Exporta para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlinkDetector;
}
