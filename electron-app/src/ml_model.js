/**
 * TerraVision Desktop - ML Model (TensorFlow.js)
 * 
 * Sistema de aprendizado adaptativo para calibração de gaze
 * Utiliza regressão linear/polinomial para mapear landmarks dos olhos a coordenadas de tela
 * Persistência via IPC para armazenamento local entre sessões
 */

import * as tf from '@tensorflow/tfjs';

export class AdaptiveGazeModel {
    constructor() {
        this.model = null;
        this.trainingData = {
            inputs: [],  // Eye features (landmarks, pupil position, etc.)
            outputs: []  // Screen coordinates (x, y)
        };
        this.samples = [];
        this.isTraining = false;
        this.accuracy = 0;
        this.lastTrainingTime = null;
        
        // Configurações de modelo
        this.config = {
            minSamples: 5,           // Mínimo de samples para treinar
            retrainThreshold: 10,    // Re-treinar a cada N samples novos
            learningRate: 0.01,
            epochs: 50,
            batchSize: 32,
            validationSplit: 0.2
        };

        // Smoothing e filtros
        this.gazeHistory = [];
        this.maxHistoryLength = 5;
        
        console.log('[ML Model] 🧠 Modelo adaptativo inicializado');
    }

    /**
     * Inicializa ou carrega modelo persistente
     */
    async initialize() {
        try {
            // Tentar carregar modelo salvo
            const loaded = await this.loadModel();
            
            if (!loaded) {
                // Criar novo modelo
                this.createModel();
                console.log('[ML Model] ✨ Novo modelo criado');
            } else {
                console.log('[ML Model] 📦 Modelo carregado com sucesso');
            }
            
            // Atualizar UI
            this.updateMLInfo();
            
        } catch (error) {
            console.error('[ML Model] ❌ Erro na inicialização:', error);
            this.createModel(); // Fallback
        }
    }

    /**
     * Cria arquitetura do modelo (MLP simples)
     */
    createModel() {
        this.model = tf.sequential({
            layers: [
                // Input: features dos olhos (20 dimensões)
                tf.layers.dense({
                    units: 64,
                    activation: 'relu',
                    inputShape: [20],
                    kernelInitializer: 'heNormal'
                }),
                
                // Hidden layers para capturar não-linearidades
                tf.layers.dropout({ rate: 0.2 }),
                tf.layers.dense({
                    units: 32,
                    activation: 'relu',
                    kernelInitializer: 'heNormal'
                }),
                
                tf.layers.dropout({ rate: 0.1 }),
                tf.layers.dense({
                    units: 16,
                    activation: 'relu'
                }),
                
                // Output: coordenadas (x, y)
                tf.layers.dense({
                    units: 2,
                    activation: 'linear'
                })
            ]
        });

        // Compilar com otimizador Adam
        this.model.compile({
            optimizer: tf.train.adam(this.config.learningRate),
            loss: 'meanSquaredError',
            metrics: ['mae']
        });

        console.log('[ML Model] 🏗️ Arquitetura do modelo criada');
    }

    /**
     * Extrai features dos landmarks dos olhos
     * @param {Object} eyeLandmarks - Landmarks do MediaPipe
     * @returns {Float32Array} Features normalizadas
     */
    extractEyeFeatures(eyeLandmarks) {
        if (!eyeLandmarks || !eyeLandmarks.left || !eyeLandmarks.right) {
            return new Float32Array(20).fill(0);
        }

        const features = [];

        // Olho esquerdo (5 pontos-chave normalizados)
        const left = eyeLandmarks.left;
        features.push(
            left.center.x, left.center.y,
            left.inner.x, left.inner.y,
            left.outer.x, left.outer.y,
            left.top.x, left.top.y,
            left.bottom.x, left.bottom.y
        );

        // Olho direito (5 pontos-chave normalizados)
        const right = eyeLandmarks.right;
        features.push(
            right.center.x, right.center.y,
            right.inner.x, right.inner.y,
            right.outer.x, right.outer.y,
            right.top.x, right.top.y,
            right.bottom.x, right.bottom.y
        );

        return new Float32Array(features);
    }

    /**
     * Adiciona sample de calibração (clique ou piscada)
     * @param {Float32Array} eyeFeatures - Features dos olhos
     * @param {Object} screenCoords - {x, y} coordenadas normalizadas
     * @param {boolean} isReinforced - Se foi reforçado por piscada
     */
    addSample(eyeFeatures, screenCoords, isReinforced = false) {
        const sample = {
            features: eyeFeatures,
            coords: screenCoords,
            reinforced: isReinforced,
            timestamp: Date.now()
        };

        this.samples.push(sample);

        // Se reforçado, duplicar sample (aumenta peso)
        if (isReinforced) {
            this.samples.push({ ...sample });
            console.log('[ML Model] 💪 Sample reforçado por piscada');
        }

        console.log(`[ML Model] ➕ Sample adicionado (total: ${this.samples.length})`);

        // Treinar se atingiu threshold
        if (this.samples.length >= this.config.minSamples &&
            this.samples.length % this.config.retrainThreshold === 0) {
            this.train();
        }

        this.updateMLInfo();
    }

    /**
     * Treina modelo com samples coletados
     */
    async train() {
        if (this.isTraining || this.samples.length < this.config.minSamples) {
            return;
        }

        this.isTraining = true;
        console.log(`[ML Model] 🎓 Iniciando treinamento com ${this.samples.length} samples...`);

        try {
            // Preparar dados
            const inputs = this.samples.map(s => Array.from(s.features));
            const outputs = this.samples.map(s => [s.coords.x, s.coords.y]);

            const xs = tf.tensor2d(inputs);
            const ys = tf.tensor2d(outputs);

            // Treinar
            const history = await this.model.fit(xs, ys, {
                epochs: this.config.epochs,
                batchSize: this.config.batchSize,
                validationSplit: this.config.validationSplit,
                shuffle: true,
                verbose: 0,
                callbacks: {
                    onEpochEnd: (epoch, logs) => {
                        if (epoch % 10 === 0) {
                            console.log(`[ML Model] Epoch ${epoch}: loss=${logs.loss.toFixed(4)}, mae=${logs.mae.toFixed(4)}`);
                        }
                    }
                }
            });

            // Calcular acurácia (distância média em pixels)
            const finalLoss = history.history.loss[history.history.loss.length - 1];
            this.accuracy = Math.max(0, 100 - (finalLoss * 100));
            this.lastTrainingTime = new Date();

            console.log(`[ML Model] ✅ Treinamento concluído! Acurácia: ${this.accuracy.toFixed(1)}%`);

            // Limpar tensores
            xs.dispose();
            ys.dispose();

            // Salvar modelo
            await this.saveModel();

            this.updateMLInfo();

        } catch (error) {
            console.error('[ML Model] ❌ Erro no treinamento:', error);
        } finally {
            this.isTraining = false;
        }
    }

    /**
     * Prediz coordenadas de gaze a partir de eye features
     * @param {Float32Array} eyeFeatures - Features dos olhos
     * @returns {Object} {x, y} coordenadas preditas (normalizadas)
     */
    predict(eyeFeatures) {
        if (!this.model || this.samples.length < this.config.minSamples) {
            return null;
        }

        try {
            const input = tf.tensor2d([Array.from(eyeFeatures)]);
            const prediction = this.model.predict(input);
            const coords = prediction.dataSync();
            
            input.dispose();
            prediction.dispose();

            const result = {
                x: coords[0],
                y: coords[1]
            };

            // Aplicar smoothing temporal
            this.gazeHistory.push(result);
            if (this.gazeHistory.length > this.maxHistoryLength) {
                this.gazeHistory.shift();
            }

            return this.smoothGaze();

        } catch (error) {
            console.error('[ML Model] ❌ Erro na predição:', error);
            return null;
        }
    }

    /**
     * Suaviza predições usando média móvel
     */
    smoothGaze() {
        if (this.gazeHistory.length === 0) return null;

        const avgX = this.gazeHistory.reduce((sum, g) => sum + g.x, 0) / this.gazeHistory.length;
        const avgY = this.gazeHistory.reduce((sum, g) => sum + g.y, 0) / this.gazeHistory.length;

        return { x: avgX, y: avgY };
    }

    /**
     * Salva modelo via Electron IPC
     */
    async saveModel() {
        try {
            if (!window.electronAPI) {
                console.warn('[ML Model] ⚠️ Electron API não disponível para salvar');
                return;
            }

            // Serializar modelo para JSON
            const modelJSON = await this.model.save(tf.io.withSaveHandler(async (artifacts) => {
                const calibrationData = {
                    modelTopology: artifacts.modelTopology,
                    weightSpecs: artifacts.weightSpecs,
                    weightData: Array.from(new Uint8Array(artifacts.weightData)),
                    samples: this.samples.map(s => ({
                        features: Array.from(s.features),
                        coords: s.coords,
                        reinforced: s.reinforced,
                        timestamp: s.timestamp
                    })),
                    accuracy: this.accuracy,
                    lastTrainingTime: this.lastTrainingTime,
                    config: this.config
                };

                const result = await window.electronAPI.saveCalibrationData(calibrationData);
                console.log('[ML Model] 💾 Modelo salvo:', result.path);
                return { modelArtifactsInfo: { dateSaved: new Date() } };
            }));

        } catch (error) {
            console.error('[ML Model] ❌ Erro ao salvar modelo:', error);
        }
    }

    /**
     * Carrega modelo salvo via Electron IPC
     */
    async loadModel() {
        try {
            if (!window.electronAPI) {
                console.warn('[ML Model] ⚠️ Electron API não disponível para carregar');
                return false;
            }

            const result = await window.electronAPI.loadCalibrationData();
            
            if (!result.success) {
                console.log('[ML Model] ℹ️ Nenhum modelo salvo encontrado');
                return false;
            }

            const data = result.data;

            // Restaurar modelo
            const weightData = new Uint8Array(data.weightData).buffer;
            this.model = await tf.loadLayersModel(tf.io.fromMemory({
                modelTopology: data.modelTopology,
                weightSpecs: data.weightSpecs,
                weightData: weightData
            }));

            // Recompilar
            this.model.compile({
                optimizer: tf.train.adam(this.config.learningRate),
                loss: 'meanSquaredError',
                metrics: ['mae']
            });

            // Restaurar samples
            this.samples = data.samples.map(s => ({
                features: new Float32Array(s.features),
                coords: s.coords,
                reinforced: s.reinforced,
                timestamp: s.timestamp
            }));

            this.accuracy = data.accuracy || 0;
            this.lastTrainingTime = data.lastTrainingTime ? new Date(data.lastTrainingTime) : null;

            console.log(`[ML Model] 📦 Modelo carregado: ${this.samples.length} samples, ${this.accuracy.toFixed(1)}% acurácia`);
            
            return true;

        } catch (error) {
            console.error('[ML Model] ❌ Erro ao carregar modelo:', error);
            return false;
        }
    }

    /**
     * Reseta modelo e dados
     */
    reset() {
        this.samples = [];
        this.gazeHistory = [];
        this.accuracy = 0;
        this.lastTrainingTime = null;
        this.createModel();
        console.log('[ML Model] 🔄 Modelo resetado');
        this.updateMLInfo();
    }

    /**
     * Atualiza UI com informações do modelo
     */
    updateMLInfo() {
        const mlInfo = document.getElementById('ml-info');
        const sampleCount = document.getElementById('sample-count');
        const accuracyEl = document.getElementById('accuracy');
        const lastTraining = document.getElementById('last-training');
        const mlStatus = document.getElementById('ml-status');

        if (sampleCount) sampleCount.textContent = this.samples.length;
        if (accuracyEl) accuracyEl.textContent = `${this.accuracy.toFixed(1)}%`;
        if (lastTraining) {
            lastTraining.textContent = this.lastTrainingTime 
                ? this.lastTrainingTime.toLocaleTimeString('pt-BR')
                : 'Nunca';
        }

        if (mlStatus) {
            if (this.samples.length >= this.config.minSamples) {
                mlStatus.textContent = 'Ativo';
                mlStatus.style.color = '#4caf50';
            } else {
                mlStatus.textContent = `${this.config.minSamples - this.samples.length} samples`;
                mlStatus.style.color = '#ff9800';
            }
        }

        // Mostrar info se tiver samples
        if (mlInfo && this.samples.length > 0) {
            mlInfo.style.display = 'block';
        }
    }

    /**
     * Retorna métricas do modelo
     */
    getMetrics() {
        return {
            samples: this.samples.length,
            accuracy: this.accuracy,
            isActive: this.samples.length >= this.config.minSamples,
            lastTraining: this.lastTrainingTime
        };
    }
}

// Instância global
export const gazeModel = new AdaptiveGazeModel();

console.log('[ML Model] 🚀 Módulo de ML carregado');
