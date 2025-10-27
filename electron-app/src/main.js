/**
 * TerraVision Desktop - Main Application (Electron Version)
 * 
 * Versão otimizada para Electron com integração TensorFlow.js ML adaptativo
 * Combina WebGazer/MediaPipe com modelo de regressão personalizado
 */

import { gazeModel } from './ml_model.js';
import { audioEngine } from './audio_engine.js';

// Verificar se WebGazer está disponível (será carregado via libs copiadas)
const loadWebGazerScript = () => {
    return new Promise((resolve, reject) => {
        if (window.webgazer) {
            resolve(window.webgazer);
            return;
        }

        const script = document.createElement('script');
        script.src = '../libs/webgazer.js';
        script.onload = () => {
            if (window.webgazer) {
                console.log('[Main] ✅ WebGazer carregado');
                resolve(window.webgazer);
            } else {
                reject(new Error('WebGazer não disponível'));
            }
        };
        script.onerror = () => reject(new Error('Falha ao carregar WebGazer'));
        document.head.appendChild(script);
    });
};

/**
 * Aplicação principal TerraVision Desktop
 */
class TerraVisionDesktop {
    constructor() {
        this.webcamEl = null;
        this.pizzaCanvas = null;
        this.pizzaCtx = null;
        this.isTracking = false;
        this.currentSector = null;
        this.gazeHistory = [];
        
        // Pizza configuration (6 setores)
        this.sectors = [
            { label: 'C', frequency: 261.63, color: '#FF6B6B' },   // Dó
            { label: 'D', frequency: 293.66, color: '#4ECDC4' },   // Ré
            { label: 'E', frequency: 329.63, color: '#45B7D1' },   // Mi
            { label: 'F', frequency: 349.23, color: '#FFA07A' },   // Fá
            { label: 'G', frequency: 392.00, color: '#98D8C8' },   // Sol
            { label: 'A', frequency: 440.00, color: '#F7DC6F' }    // Lá
        ];
        
        // Performance tracking
        this.frameCount = 0;
        this.lastFrameTime = performance.now();
        
        // Estado de calibração
        this.calibrationSamples = 0;
        this.isCalibrating = false;
        
        console.log('[TerraVision] 🚀 Aplicação inicializada');
    }

    /**
     * Inicializa toda a aplicação
     */
    async initialize() {
        try {
            console.log('[TerraVision] 📋 Iniciando componentes...');
            
            // 1. Inicializar canvas pizza
            this.initializePizzaCanvas();
            
            // 2. Inicializar ML Model
            await gazeModel.initialize();
            this.updateStatus('Modelo ML carregado');
            
            // 3. Inicializar Audio Engine
            await audioEngine.initialize();
            this.updateStatus('Sistema de áudio carregado');
            
            // 4. Inicializar câmera (Electron API)
            await this.initializeCamera();
            
            // 5. Carregar WebGazer
            await loadWebGazerScript();
            
            // 6. Iniciar tracking
            await this.startTracking();
            
            // 7. Setup event handlers
            this.setupEventHandlers();
            
            this.updateStatus('🎯 Sistema pronto! Clique na pizza para calibrar');
            console.log('[TerraVision] ✅ Inicialização completa');
            
        } catch (error) {
            console.error('[TerraVision] ❌ Erro na inicialização:', error);
            this.updateStatus(`Erro: ${error.message}`);
        }
    }

    /**
     * Inicializa canvas da pizza
     */
    initializePizzaCanvas() {
        this.pizzaCanvas = document.getElementById('pizza-canvas');
        if (!this.pizzaCanvas) {
            throw new Error('Canvas pizza-canvas não encontrado');
        }
        
        this.pizzaCtx = this.pizzaCanvas.getContext('2d');
        
        // Resize para tela
        this.resizePizzaCanvas();
        window.addEventListener('resize', () => this.resizePizzaCanvas());
        
        // Desenhar pizza inicial
        this.drawPizza();
        
        console.log('[TerraVision] 🍕 Canvas pizza configurado');
    }

    /**
     * Redimensiona canvas pizza
     */
    resizePizzaCanvas() {
        const container = this.pizzaCanvas.parentElement;
        const size = Math.min(container.clientWidth, container.clientHeight) * 0.8;
        
        this.pizzaCanvas.width = size;
        this.pizzaCanvas.height = size;
        this.pizzaCanvas.style.width = `${size}px`;
        this.pizzaCanvas.style.height = `${size}px`;
        
        this.drawPizza();
    }

    /**
     * Desenha pizza com setores
     */
    drawPizza(highlightSector = null) {
        const ctx = this.pizzaCtx;
        const canvas = this.pizzaCanvas;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) * 0.9;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const anglePerSector = (2 * Math.PI) / this.sectors.length;
        
        this.sectors.forEach((sector, index) => {
            const startAngle = index * anglePerSector - Math.PI / 2;
            const endAngle = startAngle + anglePerSector;
            
            // Desenhar setor
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            
            // Cor de preenchimento (destacar se selecionado)
            if (index === highlightSector) {
                ctx.fillStyle = this.lightenColor(sector.color, 30);
                ctx.shadowBlur = 20;
                ctx.shadowColor = sector.color;
            } else {
                ctx.fillStyle = sector.color;
                ctx.shadowBlur = 0;
            }
            
            ctx.fill();
            
            // Borda
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Label
            const labelAngle = startAngle + anglePerSector / 2;
            const labelRadius = radius * 0.7;
            const labelX = centerX + Math.cos(labelAngle) * labelRadius;
            const labelY = centerY + Math.sin(labelAngle) * labelRadius;
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowBlur = 3;
            ctx.shadowColor = '#000';
            ctx.fillText(sector.label, labelX, labelY);
        });
        
        // Centro da pizza
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.15, 0, 2 * Math.PI);
        ctx.fillStyle = '#1a1a2e';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#000';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    /**
     * Clareia cor (para highlight)
     */
    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = ((num >> 8) & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        
        return '#' + (0x1000000 +
            (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
            (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
            (B < 255 ? (B < 1 ? 0 : B) : 255)
        ).toString(16).slice(1);
    }

    /**
     * Inicializa câmera via Electron API
     */
    async initializeCamera() {
        this.webcamEl = document.getElementById('webcam');
        
        if (!this.webcamEl) {
            throw new Error('Elemento video#webcam não encontrado');
        }
        
        try {
            // Usar Electron API para getUserMedia
            const constraints = {
                video: {
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                },
                audio: false
            };
            
            let stream;
            if (window.electronAPI && window.electronAPI.getUserMedia) {
                stream = await window.electronAPI.getUserMedia(constraints);
            } else {
                // Fallback para navegador
                stream = await navigator.mediaDevices.getUserMedia(constraints);
            }
            
            this.webcamEl.srcObject = stream;
            await this.webcamEl.play();
            
            this.updateCameraStatus('Ativa');
            console.log('[TerraVision] 📹 Câmera inicializada');
            
        } catch (error) {
            console.error('[TerraVision] ❌ Erro ao acessar câmera:', error);
            this.updateCameraStatus('Erro');
            throw error;
        }
    }

    /**
     * Inicia sistema de tracking
     */
    async startTracking() {
        if (!window.webgazer) {
            throw new Error('WebGazer não disponível');
        }
        
        // Configurar WebGazer
        window.webgazer
            .setRegression('ridge')
            .setTracker('TFFacemesh')  // MediaPipe via TensorFlow.js
            .showPredictionPoints(false)
            .showVideo(true)
            .showFaceOverlay(false)
            .showFaceFeedbackBox(false);
        
        // Callback de gaze
        window.webgazer.setGazeListener((data, timestamp) => {
            if (data) {
                this.handleGazeData(data, timestamp);
            }
        });
        
        // Iniciar
        await window.webgazer.begin();
        
        this.isTracking = true;
        this.updateCameraStatus('Rastreando');
        console.log('[TerraVision] 👁️ Tracking iniciado');
    }

    /**
     * Processa dados de gaze
     */
    handleGazeData(data, timestamp) {
        if (!data || !data.x || !data.y) return;
        
        this.frameCount++;
        
        // Atualizar FPS
        const now = performance.now();
        if (now - this.lastFrameTime >= 1000) {
            // FPS já é atualizado no index.html
            this.lastFrameTime = now;
            this.frameCount = 0;
        }
        
        // Normalizar coordenadas para ML model
        const normalizedX = data.x / window.innerWidth;
        const normalizedY = data.y / window.innerHeight;
        
        // Extrair eye features (simulado - WebGazer fornece landmarks internamente)
        const eyeFeatures = this.extractEyeFeaturesFromWebGazer(data);
        
        // Usar ML model se treinado
        let gazePoint = { x: data.x, y: data.y };
        
        if (gazeModel.samples.length >= gazeModel.config.minSamples) {
            const prediction = gazeModel.predict(eyeFeatures);
            if (prediction) {
                gazePoint = {
                    x: prediction.x * window.innerWidth,
                    y: prediction.y * window.innerHeight
                };
            }
        }
        
        // Atualizar cursor de gaze
        this.updateGazeCursor(gazePoint);
        
        // Determinar setor
        const sector = this.pointToSector(gazePoint);
        this.updateSector(sector);
    }

    /**
     * Extrai features dos olhos (simplificado)
     * Na prática, você precisaria acessar os landmarks do MediaPipe
     */
    extractEyeFeaturesFromWebGazer(data) {
        // Placeholder - em produção, acessar landmarks do tracker
        // Por enquanto, usar coordenadas normalizadas como features
        const features = new Float32Array(20);
        const normX = data.x / window.innerWidth;
        const normY = data.y / window.innerHeight;
        
        // Preencher com valores simulados
        for (let i = 0; i < 20; i += 2) {
            features[i] = normX + (Math.random() - 0.5) * 0.05;
            features[i + 1] = normY + (Math.random() - 0.5) * 0.05;
        }
        
        return features;
    }

    /**
     * Atualiza cursor de gaze na tela
     */
    updateGazeCursor(point) {
        const cursor = document.getElementById('gaze-cursor');
        if (cursor) {
            cursor.style.left = `${point.x}px`;
            cursor.style.top = `${point.y}px`;
            cursor.dataset.active = 'true';
        }
    }

    /**
     * Converte ponto para setor da pizza
     */
    pointToSector(point) {
        const rect = this.pizzaCanvas.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const dx = point.x - centerX;
        const dy = point.y - centerY;
        
        const distance = Math.sqrt(dx * dx + dy * dy);
        const radius = (rect.width / 2) * 0.9;
        
        // Verificar se está dentro da pizza
        if (distance > radius || distance < radius * 0.15) {
            return null;
        }
        
        // Calcular ângulo
        let angle = Math.atan2(dy, dx);
        angle = angle + Math.PI / 2; // Ajustar para começar do topo
        if (angle < 0) angle += 2 * Math.PI;
        
        const sectorIndex = Math.floor(angle / (2 * Math.PI / this.sectors.length));
        return sectorIndex % this.sectors.length;
    }

    /**
     * Atualiza setor atual
     */
    updateSector(sectorIndex) {
        if (this.currentSector === sectorIndex) return;
        
        this.currentSector = sectorIndex;
        this.drawPizza(sectorIndex);
        
        if (sectorIndex !== null) {
            const sector = this.sectors[sectorIndex];
            this.updateStatus(`Setor ${sector.label} em foco`);
            
            // Tocar som do setor
            audioEngine.playSector(sectorIndex);
        } else {
            audioEngine.stopCurrent();
        }
    }

    /**
     * Setup de event handlers
     */
    setupEventHandlers() {
        // Click para calibração
        this.pizzaCanvas.addEventListener('click', (e) => {
            this.handleCalibrationClick(e);
        });
        
        // Detecção de piscada (simplificado - WebGazer tem blink detection)
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                this.handleBlink();
            }
        });
        
        // Reset modelo
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyR' && e.ctrlKey) {
                gazeModel.reset();
                this.updateStatus('Modelo resetado');
            }
        });
    }

    /**
     * Processa clique de calibração
     */
    handleCalibrationClick(event) {
        const rect = this.pizzaCanvas.getBoundingClientRect();
        const x = event.clientX;
        const y = event.clientY;
        
        // Adicionar ao WebGazer
        if (window.webgazer && window.webgazer.recordScreenPosition) {
            window.webgazer.recordScreenPosition(x, y, 'click');
        }
        
        // Adicionar ao ML model
        const eyeFeatures = this.extractEyeFeaturesFromWebGazer({ x, y });
        const normalizedCoords = {
            x: x / window.innerWidth,
            y: y / window.innerHeight
        };
        
        gazeModel.addSample(eyeFeatures, normalizedCoords, false);
        this.calibrationSamples++;
        
        // Feedback visual
        this.showCalibrationFeedback(x, y);
        
        console.log(`[TerraVision] 🎯 Calibração: sample ${this.calibrationSamples}`);
    }

    /**
     * Mostra feedback visual de calibração
     */
    showCalibrationFeedback(x, y) {
        const feedback = document.createElement('div');
        feedback.style.position = 'fixed';
        feedback.style.left = `${x}px`;
        feedback.style.top = `${y}px`;
        feedback.style.width = '10px';
        feedback.style.height = '10px';
        feedback.style.background = '#4caf50';
        feedback.style.borderRadius = '50%';
        feedback.style.transform = 'translate(-50%, -50%)';
        feedback.style.pointerEvents = 'none';
        feedback.style.zIndex = '3000';
        feedback.style.animation = 'fadeOut 1s forwards';
        
        document.body.appendChild(feedback);
        
        setTimeout(() => feedback.remove(), 1000);
    }

    /**
     * Processa piscada
     */
    handleBlink() {
        console.log('[TerraVision] 👁️ Piscada detectada');
        
        if (this.currentSector !== null) {
            const sector = this.sectors[this.currentSector];
            this.updateStatus(`♫ Tocando ${sector.label}`);
            
            // Feedback de áudio
            audioEngine.playBlinkFeedback();
        }
        
        // Reforçar último sample de calibração
        if (gazeModel.samples.length > 0) {
            const lastSample = gazeModel.samples[gazeModel.samples.length - 1];
            gazeModel.addSample(lastSample.features, lastSample.coords, true);
        }
    }

    /**
     * Atualiza status na UI
     */
    updateStatus(message) {
        const statusEl = document.getElementById('status-text');
        if (statusEl) {
            statusEl.textContent = message;
        }
    }

    /**
     * Atualiza status da câmera
     */
    updateCameraStatus(status) {
        const cameraStatus = document.getElementById('camera-status');
        if (cameraStatus) {
            cameraStatus.textContent = status;
            cameraStatus.style.color = status === 'Rastreando' ? '#4caf50' : 
                                       status === 'Ativa' ? '#4fc3f7' : '#f44336';
        }
    }
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Main] 🌍 TerraVision Desktop Starting...');
    
    const app = new TerraVisionDesktop();
    await app.initialize();
    
    // Expor globalmente para debug
    window.terraVision = app;
});

// Adicionar estilo para feedback animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        to { opacity: 0; transform: translate(-50%, -50%) scale(2); }
    }
`;
document.head.appendChild(style);

console.log('[Main] 📦 Módulo principal carregado');
