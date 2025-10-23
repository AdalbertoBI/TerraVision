/**
 * Módulo de Modo Terapêutico - Terra Vision
 * Sistema de sessões, registro de progresso e ajuste de dificuldade
 * 
 * Funcionalidades:
 * - Sessões de treinamento com duração configurável
 * - Registro de progresso e estatísticas
 * - Ajuste de dificuldade (velocidade, sensibilidade)
 * - Modo de relaxamento com feedback positivo
 * - Histórico de sessões
 */

class TherapyMode {
  constructor(pizzaCircle, audioManager, blinkDetector) {
    this.pizzaCircle = pizzaCircle;
    this.audioManager = audioManager;
    this.blinkDetector = blinkDetector;

    // Modos de terapia disponíveis
    this.therapyModes = {
      relaxation: {
        name: 'Relaxamento',
        description: 'Sessão relaxante com feedback positivo',
        duration: 10, // minutos
        difficulty: 1,
        feedbackIntensity: 'low'
      },
      training: {
        name: 'Treinamento',
        description: 'Treinamento para melhorar precisão',
        duration: 15,
        difficulty: 2,
        feedbackIntensity: 'medium'
      },
      concentration: {
        name: 'Concentração',
        description: 'Exercícios de foco prolongado',
        duration: 20,
        difficulty: 3,
        feedbackIntensity: 'high'
      },
      custom: {
        name: 'Personalizado',
        description: 'Configure conforme sua necessidade',
        duration: 5,
        difficulty: 1,
        feedbackIntensity: 'medium'
      }
    };

    // Estado atual da sessão
    this.currentSession = null;
    this.isSessionActive = false;
    this.sessionStats = {
      totalNotes: 0,
      correctNotes: 0,
      missedNotes: 0,
      focusTime: 0,
      startTime: null,
      endTime: null,
      gazeAccuracy: 0
    };

    // Histórico de sessões
    this.sessionHistory = this.loadSessionHistory();

    // Callbacks
    this.onSessionStart = null;
    this.onSessionEnd = null;
    this.onMilestone = null;
    this.onStatsUpdate = null;
    this.onDifficultyChange = null;

    console.log('🎯 Sistema de Modo Terapêutico Inicializado');
  }

  /**
   * Inicia uma nova sessão de terapia
   */
  async startSession(modeKey = 'relaxation', customSettings = {}) {
    if (this.isSessionActive) {
      console.warn('⚠️ Sessão já está ativa');
      return;
    }

    const mode = this.therapyModes[modeKey] || this.therapyModes.relaxation;
    
    this.currentSession = {
      id: Date.now(),
      mode: modeKey,
      modeDetails: mode,
      settings: { ...customSettings },
      startTime: new Date(),
      endTime: null,
      duration: mode.duration * 60 * 1000, // converter para ms
      pausedTime: 0,
      isPaused: false
    };

    this.sessionStats = {
      totalNotes: 0,
      correctNotes: 0,
      missedNotes: 0,
      focusTime: 0,
      startTime: Date.now(),
      endTime: null,
      gazeAccuracy: 0,
      averageFocusTime: 0,
      distractions: 0
    };

    this.isSessionActive = true;

    console.log(`🎯 Sessão iniciada: ${mode.name} (${mode.duration} min, Dificuldade: ${mode.difficulty})`);

    if (this.onSessionStart) {
      this.onSessionStart(this.currentSession);
    }

    // Som de início
    this.audioManager.playSuccess();

    // Monitora a sessão
    this.monitorSession();
  }

  /**
   * Pausa a sessão em progresso
   */
  pauseSession() {
    if (!this.isSessionActive || !this.currentSession) return;

    this.currentSession.isPaused = true;
    console.log('⏸️ Sessão pausada');
    this.audioManager.playNote('Lá', 0.15);
  }

  /**
   * Retoma a sessão pausada
   */
  resumeSession() {
    if (!this.isSessionActive || !this.currentSession) return;

    if (this.currentSession.isPaused) {
      this.currentSession.isPaused = false;
      console.log('▶️ Sessão retomada');
      this.audioManager.playNote('Mi', 0.15);
    }
  }

  /**
   * Finaliza a sessão
   */
  endSession() {
    if (!this.isSessionActive) return;

    this.isSessionActive = false;
    this.sessionStats.endTime = Date.now();

    // Calcula estatísticas finais
    const duration = (this.sessionStats.endTime - this.sessionStats.startTime) / 1000; // segundos
    const accuracy = this.sessionStats.totalNotes > 0
      ? (this.sessionStats.correctNotes / this.sessionStats.totalNotes) * 100
      : 0;

    const sessionData = {
      ...this.currentSession,
      stats: {
        ...this.sessionStats,
        duration: duration,
        accuracy: accuracy,
        focusPercentage: (this.sessionStats.focusTime / duration) * 100
      }
    };

    // Salva no histórico
    this.sessionHistory.push(sessionData);
    this.saveSessionHistory();

    console.log(`✅ Sessão finalizada!`);
    console.log(`   Acurácia: ${accuracy.toFixed(1)}%`);
    console.log(`   Duração: ${(duration / 60).toFixed(1)} min`);
    console.log(`   Notas corretas: ${this.sessionStats.correctNotes}/${this.sessionStats.totalNotes}`);

    if (this.onSessionEnd) {
      this.onSessionEnd(sessionData);
    }

    // Som de conclusão
    if (accuracy >= 80) {
      this.audioManager.playSequence(['Mi', 'Sol', 'Do'], 0.2);
    } else if (accuracy >= 60) {
      this.audioManager.playNote('Sol', 0.2);
    } else {
      this.audioManager.playNote('Lá', 0.2);
    }

    this.currentSession = null;
  }

  /**
   * Monitora sessão em tempo real
   */
  monitorSession() {
    if (!this.isSessionActive || !this.currentSession) return;

    const elapsed = Date.now() - this.currentSession.startTime;
    const timeRemaining = this.currentSession.duration - elapsed;

    if (timeRemaining <= 0) {
      this.endSession();
      return;
    }

    // Continua monitorando
    setTimeout(() => this.monitorSession(), 1000);
  }

  /**
   * Registra uma nota tocada (feedback de ação)
   */
  recordNoteAction(noteIndex, wasFocused = true) {
    if (!this.isSessionActive) return;

    this.sessionStats.totalNotes++;

    if (wasFocused) {
      this.sessionStats.correctNotes++;
    } else {
      this.sessionStats.missedNotes++;
    }

    // Verifica milestones
    this.checkMilestones();

    if (this.onStatsUpdate) {
      this.onStatsUpdate(this.getSessionStats());
    }
  }

  /**
   * Atualiza tempo de foco
   */
  updateFocusTime(duration) {
    if (!this.isSessionActive) return;

    this.sessionStats.focusTime += duration;
  }

  /**
   * Verifica milestones alcançados
   */
  checkMilestones() {
    const milestones = [10, 25, 50, 100];

    if (milestones.includes(this.sessionStats.correctNotes)) {
      const message = `🎉 Parabéns! ${this.sessionStats.correctNotes} notas corretas!`;
      console.log(message);

      if (this.onMilestone) {
        this.onMilestone({
          milestone: this.sessionStats.correctNotes,
          message: message
        });
      }

      this.audioManager.playSequence(['Do', 'Mi', 'Sol'], 0.15);
    }
  }

  /**
   * Ajusta dificuldade durante sessão
   */
  changeDifficulty(level) {
    if (!this.currentSession) return;

    // Nível 1: Fácil, Nível 2: Normal, Nível 3: Difícil
    const difficulty = Math.max(1, Math.min(3, level));

    this.currentSession.modeDetails.difficulty = difficulty;
    this.blinkDetector.blinkThreshold = 0.5 - (difficulty * 0.1); // Mais sensível em níveis altos

    console.log(`⚙️ Dificuldade alterada para: ${difficulty}`);

    if (this.onDifficultyChange) {
      this.onDifficultyChange(difficulty);
    }

    this.audioManager.playNote(['Do', 'Mi', 'Sol'][difficulty - 1], 0.2);
  }

  /**
   * Obtém estatísticas da sessão atual
   */
  getSessionStats() {
    if (!this.isSessionActive) return this.sessionStats;

    const elapsed = (Date.now() - this.sessionStats.startTime) / 1000; // segundos
    const accuracy = this.sessionStats.totalNotes > 0
      ? (this.sessionStats.correctNotes / this.sessionStats.totalNotes) * 100
      : 0;

    return {
      ...this.sessionStats,
      elapsedTime: elapsed,
      accuracy: accuracy,
      timeRemaining: Math.max(0, (this.currentSession.duration / 1000) - elapsed)
    };
  }

  /**
   * Obtém modo de terapia ativo
   */
  getCurrentMode() {
    return this.currentSession ? this.currentSession.mode : null;
  }

  /**
   * Obtém histórico completo de sessões
   */
  getSessionHistory() {
    return this.sessionHistory;
  }

  /**
   * Obtém estatísticas gerais do histórico
   */
  getProgressStats() {
    if (this.sessionHistory.length === 0) {
      return {
        totalSessions: 0,
        totalTime: 0,
        averageAccuracy: 0,
        bestAccuracy: 0,
        totalNotes: 0
      };
    }

    const totalTime = this.sessionHistory.reduce((sum, s) => sum + (s.stats?.duration || 0), 0);
    const totalNotes = this.sessionHistory.reduce((sum, s) => sum + (s.stats?.totalNotes || 0), 0);
    const accuracies = this.sessionHistory
      .map(s => s.stats?.accuracy || 0)
      .filter(a => a > 0);

    return {
      totalSessions: this.sessionHistory.length,
      totalTime: totalTime,
      averageAccuracy: accuracies.length > 0
        ? accuracies.reduce((a, b) => a + b, 0) / accuracies.length
        : 0,
      bestAccuracy: Math.max(...accuracies, 0),
      totalNotes: totalNotes,
      lastSession: this.sessionHistory[this.sessionHistory.length - 1]?.startTime
    };
  }

  /**
   * Carrega histórico de sessões
   */
  loadSessionHistory() {
    try {
      const stored = localStorage.getItem('terraVision_sessionHistory');
      if (stored) {
        console.log('📂 Histórico de sessões carregado');
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Erro ao carregar histórico:', e);
    }

    return [];
  }

  /**
   * Salva histórico de sessões
   */
  saveSessionHistory() {
    try {
      localStorage.setItem(
        'terraVision_sessionHistory',
        JSON.stringify(this.sessionHistory)
      );
      console.log('💾 Histórico de sessões salvo');
    } catch (e) {
      console.error('Erro ao salvar histórico:', e);
    }
  }

  /**
   * Limpa histórico de sessões
   */
  clearSessionHistory() {
    this.sessionHistory = [];
    localStorage.removeItem('terraVision_sessionHistory');
    console.log('🗑️ Histórico de sessões removido');
  }

  /**
   * Exporta dados de sessões como JSON
   */
  exportSessionData() {
    const data = {
      exportDate: new Date().toISOString(),
      totalSessions: this.sessionHistory.length,
      sessions: this.sessionHistory,
      progressStats: this.getProgressStats()
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Obtém modos de terapia disponíveis
   */
  getAvailableModes() {
    return Object.entries(this.therapyModes).map(([key, value]) => ({
      key,
      ...value
    }));
  }
}
