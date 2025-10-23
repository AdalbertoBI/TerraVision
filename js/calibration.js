/**
 * Módulo de Calibração Avançada - Terra Vision
 * Sistema de calibração com múltiplos pontos para rastreamento ocular terapêutico
 * 
 * Funcionalidades:
 * - Calibração com 9 pontos interativos
 * - Validação de sucesso/falha
 * - Armazenamento local de perfil de usuário
 * - Recalibração a qualquer momento
 * - Feedback visual e auditivo durante calibração
 */

class CalibrationSystem {
  constructor(gazeTracker, audioManager) {
    this.gazeTracker = gazeTracker;
    this.audioManager = audioManager;
    
    // 9 pontos de calibração em grid 3x3
    this.calibrationPoints = [
      { id: 0, x: 0.1, y: 0.1, label: 'Canto Superior Esquerdo' },
      { id: 1, x: 0.5, y: 0.1, label: 'Topo Centro' },
      { id: 2, x: 0.9, y: 0.1, label: 'Canto Superior Direito' },
      { id: 3, x: 0.1, y: 0.5, label: 'Meio Esquerdo' },
      { id: 4, x: 0.5, y: 0.5, label: 'Centro' },
      { id: 5, x: 0.9, y: 0.5, label: 'Meio Direito' },
      { id: 6, x: 0.1, y: 0.9, label: 'Canto Inferior Esquerdo' },
      { id: 7, x: 0.5, y: 0.9, label: 'Base Centro' },
      { id: 8, x: 0.9, y: 0.9, label: 'Canto Inferior Direito' }
    ];

    this.currentPointIndex = 0;
    this.gazeSamples = [];
    this.isCalibrating = false;
    this.calibrationProfile = this.loadCalibrationProfile();
    this.accuracyThreshold = 50; // pixels
    this.collectionTime = 2000; // ms para coletar amostras
    
    // Callbacks
    this.onCalibrationStart = null;
    this.onPointReady = null;
    this.onPointComplete = null;
    this.onCalibrationComplete = null;
    this.onCalibrationFailed = null;
    
    console.log('👁️ Sistema de Calibração Inicializado');
  }

  /**
   * Inicia processo de calibração com 9 pontos
   */
  async startCalibration() {
    this.isCalibrating = true;
    this.currentPointIndex = 0;
    this.gazeSamples = [];
    
    if (this.onCalibrationStart) {
      this.onCalibrationStart();
    }

    console.log('🎯 Iniciando calibração com 9 pontos...');
    
    // Reproduz som de início
    this.audioManager.playSuccess();
    
    // Aguarda um pouco antes de começar
    await this.delay(1000);
    
    // Processa cada ponto
    for (let i = 0; i < this.calibrationPoints.length; i++) {
      if (!this.isCalibrating) break;
      
      this.currentPointIndex = i;
      await this.calibratePoint(this.calibrationPoints[i]);
    }
    
    if (this.isCalibrating) {
      this.finishCalibration();
    }
  }

  /**
   * Calibra um único ponto
   */
  async calibratePoint(point) {
    return new Promise((resolve) => {
      const screenX = point.x * window.innerWidth;
      const screenY = point.y * window.innerHeight;
      
      if (this.onPointReady) {
        this.onPointReady(point, screenX, screenY);
      }

      console.log(`🎯 Ponto ${point.id + 1}/9: ${point.label}`);
      
      // Som de alerta
      this.audioManager.playNote('Do', 0.1);
      
      // Aguarda transição visual
      this.delay(500).then(() => {
        // Coleta amostras de gaze durante o tempo definido
        this.gazeSamples = [];
        const startTime = Date.now();
        
        const collectSample = () => {
          if (Date.now() - startTime < this.collectionTime && this.isCalibrating) {
            const gaze = this.gazeTracker.getGazePosition();
            
            if (gaze && gaze.confidence > 0.5) {
              this.gazeSamples.push({
                x: gaze.x,
                y: gaze.y,
                confidence: gaze.confidence
              });
            }
            
            requestAnimationFrame(collectSample);
          } else {
            this.validatePointCalibration(point, screenX, screenY);
            
            if (this.onPointComplete) {
              this.onPointComplete(point);
            }
            
            resolve();
          }
        };
        
        collectSample();
      });
    });
  }

  /**
   * Valida a calibração de um ponto
   */
  validatePointCalibration(point, screenX, screenY) {
    if (this.gazeSamples.length < 5) {
      console.warn(`⚠️ Ponto ${point.id}: Poucas amostras coletadas`);
      this.audioManager.playError();
      return false;
    }

    // Calcula média das amostras
    const avgX = this.gazeSamples.reduce((sum, s) => sum + s.x, 0) / this.gazeSamples.length;
    const avgY = this.gazeSamples.reduce((sum, s) => sum + s.y, 0) / this.gazeSamples.length;
    
    // Calcula distância do ponto esperado
    const distance = Math.sqrt(
      Math.pow(avgX - screenX, 2) + Math.pow(avgY - screenY, 2)
    );

    const success = distance < this.accuracyThreshold;
    
    if (success) {
      console.log(`✅ Ponto ${point.id}: Calibração bem-sucedida (erro: ${distance.toFixed(0)}px)`);
      
      // Armazena perfil de calibração
      if (!this.calibrationProfile.points) {
        this.calibrationProfile.points = {};
      }
      
      this.calibrationProfile.points[point.id] = {
        expected: { x: screenX, y: screenY },
        actual: { x: avgX, y: avgY },
        distance: distance,
        samples: this.gazeSamples.length
      };
      
      this.audioManager.playSuccess();
    } else {
      console.warn(`❌ Ponto ${point.id}: Falha na calibração (erro: ${distance.toFixed(0)}px > ${this.accuracyThreshold}px)`);
      this.audioManager.playError();
    }

    return success;
  }

  /**
   * Finaliza processo de calibração
   */
  finishCalibration() {
    this.isCalibrating = false;
    
    // Calcula acurácia geral
    const pointsCalibrated = Object.keys(this.calibrationProfile.points || {}).length;
    const accuracy = (pointsCalibrated / this.calibrationPoints.length) * 100;
    
    this.calibrationProfile.lastCalibration = new Date().toISOString();
    this.calibrationProfile.accuracy = accuracy;
    
    // Salva perfil
    this.saveCalibrationProfile();
    
    console.log(`🎉 Calibração Completa! Acurácia: ${accuracy.toFixed(1)}%`);
    
    if (this.onCalibrationComplete) {
      this.onCalibrationComplete({
        accuracy: accuracy,
        pointsCalibrated: pointsCalibrated,
        profile: this.calibrationProfile
      });
    }

    // Som de conclusão
    if (accuracy >= 80) {
      this.audioManager.playSequence(['Do', 'Mi', 'Sol'], 0.15);
    } else if (accuracy >= 60) {
      this.audioManager.playNote('Sol', 0.2);
    }
  }

  /**
   * Cancela calibração em progresso
   */
  cancelCalibration() {
    this.isCalibrating = false;
    console.log('⏹️ Calibração cancelada');
    this.audioManager.playError();
  }

  /**
   * Recalibra (reinicia do zero)
   */
  async recalibrate() {
    console.log('🔄 Iniciando recalibração...');
    this.calibrationProfile = {
      points: {},
      createdAt: new Date().toISOString()
    };
    await this.startCalibration();
  }

  /**
   * Carrega perfil de calibração do localStorage
   */
  loadCalibrationProfile() {
    try {
      const stored = localStorage.getItem('terraVision_calibrationProfile');
      if (stored) {
        const profile = JSON.parse(stored);
        console.log('📂 Perfil de calibração carregado');
        return profile;
      }
    } catch (e) {
      console.error('Erro ao carregar perfil:', e);
    }

    return {
      points: {},
      createdAt: new Date().toISOString(),
      accuracy: 0
    };
  }

  /**
   * Salva perfil de calibração no localStorage
   */
  saveCalibrationProfile() {
    try {
      localStorage.setItem(
        'terraVision_calibrationProfile',
        JSON.stringify(this.calibrationProfile)
      );
      console.log('💾 Perfil de calibração salvo');
    } catch (e) {
      console.error('Erro ao salvar perfil:', e);
    }
  }

  /**
   * Obtém acurácia da calibração atual
   */
  getAccuracy() {
    return this.calibrationProfile.accuracy || 0;
  }

  /**
   * Verifica se está calibrado
   */
  isCalibrated() {
    return this.calibrationProfile.accuracy >= 60 && 
           Object.keys(this.calibrationProfile.points || {}).length >= 7;
  }

  /**
   * Limpa calibração anterior
   */
  clearCalibration() {
    this.calibrationProfile = {
      points: {},
      createdAt: new Date().toISOString(),
      accuracy: 0
    };
    localStorage.removeItem('terraVision_calibrationProfile');
    console.log('🗑️ Calibração anterior removida');
  }

  /**
   * Utilitário: aguarda milissegundos
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtém informações da calibração
   */
  getCalibrationInfo() {
    return {
      isCalibrated: this.isCalibrated(),
      accuracy: this.getAccuracy(),
      lastCalibration: this.calibrationProfile.lastCalibration,
      pointsCalibrated: Object.keys(this.calibrationProfile.points || {}).length,
      createdAt: this.calibrationProfile.createdAt
    };
  }
}
