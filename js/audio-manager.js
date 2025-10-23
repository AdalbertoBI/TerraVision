/**
 * Terra Vision - Audio Manager
 * Gerencia a criação e emissão de notas musicais usando Web Audio API
 * Permite tocar notas individuais ou sequências de sons
 */

class AudioManager {
    /**
     * Inicializa o gerenciador de áudio
     * @param {number} sampleRate - Taxa de amostragem (padrão: 44100 Hz)
     */
    constructor(sampleRate = 44100) {
        // Contexto de áudio
        this.audioContext = null;
        this.sampleRate = sampleRate;
        
        // Osciladores ativos para evitar múltiplas emissões
        this.activeOscillators = new Map();
        
        // Notas musicais e suas frequências (em Hz)
        this.notes = {
            'Do': 261.63,      // C4
            'Re': 293.66,      // D4
            'Mi': 329.63,      // E4
            'Fá': 349.23,      // F4
            'Sol': 392.00,     // G4
            'Lá': 440.00,      // A4
            'Si': 493.88,      // B4
            'Do+': 523.25      // C5
        };
        
    // Notas em sequência (8 fatias da pizza)
    this.noteSequence = ['Do', 'Re', 'Mi', 'Fá', 'Sol', 'Lá', 'Si', 'Do+'];
    this.muted = false;
        
        this.initialize();
    }

    /**
     * Inicializa o contexto de áudio
     */
    initialize() {
        try {
            // Compatibilidade com navegadores
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContextClass();
            console.log('✓ Contexto de áudio inicializado');
        } catch (error) {
            console.error('✗ Erro ao inicializar contexto de áudio:', error);
        }
    }

    /**
     * Obtém a frequência de uma nota
     * @param {string|number} note - Nome da nota ou índice
     * @returns {number} Frequência em Hz
     */
    getFrequency(note) {
        if (typeof note === 'number') {
            return this.notes[this.noteSequence[note % this.noteSequence.length]];
        }
        return this.notes[note] || 440;
    }

    /**
     * Obtém o nome de uma nota pelo índice
     * @param {number} index - Índice da nota (0-7)
     * @returns {string} Nome da nota
     */
    getNoteName(index) {
        return this.noteSequence[index % this.noteSequence.length];
    }

    /**
     * Toca uma nota musical
     * @param {string|number} note - Nome ou índice da nota
     * @param {number} duration - Duração em segundos (padrão: 0.5)
     */
    playNote(note, duration = 0.5) {
        if (this.muted) {
            return;
        }

        if (!this.audioContext) {
            console.warn('⚠ Contexto de áudio não está disponível');
            return;
        }

        // Resume contexto de áudio se necessário (requerido por navegadores modernos)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(err => console.warn('⚠ Não foi possível retomar o contexto:', err));
        }

        const frequency = this.getFrequency(note);
        const currentTime = this.audioContext.currentTime;
        
        try {
            // Cria oscilador
            const oscillator = this.audioContext.createOscillator();
            oscillator.type = 'sine'; // Onda senoidal para som suave
            oscillator.frequency.value = frequency;

            // Cria envelope de amplitude (ADSR simplificado)
            const gainNode = this.audioContext.createGain();
            gainNode.gain.setValueAtTime(0.3, currentTime); // Ataque
            gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + duration * 0.9); // Decay/Release
            gainNode.gain.setValueAtTime(0, currentTime + duration);

            // Conecta nodes
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            // Toca a nota
            oscillator.start(currentTime);
            oscillator.stop(currentTime + duration);

            // Rastreia osciladores ativos
            const noteKey = `${frequency}`;
            this.activeOscillators.set(noteKey, oscillator);

            // Remove do rastreamento quando terminar
            oscillator.onended = () => {
                this.activeOscillators.delete(noteKey);
            };

            console.log(`♪ Tocando ${typeof note === 'string' ? note : this.getNoteName(note)} (${frequency.toFixed(2)} Hz)`);
        } catch (error) {
            console.error('✗ Erro ao tocar nota:', error);
        }
    }

    /**
     * Toca uma sequência de notas
     * @param {Array<string|number>} notes - Array com notas para tocar
     * @param {number} tempo - Tempo entre notas em segundos (padrão: 0.3)
     */
    playSequence(notes, tempo = 0.3) {
        if (!this.audioContext) {
            console.warn('⚠ Contexto de áudio não está disponível');
            return;
        }

        notes.forEach((note, index) => {
            setTimeout(() => {
                this.playNote(note, tempo * 0.8);
            }, index * tempo * 1000);
        });
    }

    /**
     * Toca um acorde (múltiplas notas simultaneamente)
     * @param {Array<string|number>} notes - Array com notas para tocar
     * @param {number} duration - Duração em segundos
     */
    playChord(notes, duration = 1) {
        notes.forEach(note => {
            this.playNote(note, duration);
        });
    }

    /**
     * Toca um som de erro/alerta
     */
    playError() {
        this.playNote(130.81, 0.2); // C3
        setTimeout(() => this.playNote(130.81, 0.2), 250);
    }

    /**
     * Toca um som de sucesso
     */
    playSuccess() {
        this.playSequence(['Sol', 'Do+'], 0.1);
    }

    /**
     * Para todos os osciladores ativos
     */
    stopAll() {
        const currentTime = this.audioContext?.currentTime || 0;
        this.activeOscillators.forEach(oscillator => {
            try {
                oscillator.stop(currentTime);
            } catch (error) {
                console.warn('⚠ Erro ao parar oscilador:', error);
            }
        });
        this.activeOscillators.clear();
    }

    /**
     * Retorna a lista de notas disponíveis
     * @returns {Array<string>} Array com nomes das notas
     */
    getNoteList() {
        return [...this.noteSequence];
    }

    /**
     * Retorna o número total de notas
     * @returns {number} Total de notas
     */
    getNoteCount() {
        return this.noteSequence.length;
    }

    /**
     * Alterna estado de mute global
     * @returns {boolean} true se áudio ficou mudo
     */
    toggleMute() {
        this.muted = !this.muted;
        if (this.muted) {
            this.stopAll();
        }
        return this.muted;
    }

    /**
     * Define estado de mute explicitamente
     * @param {boolean} state
     */
    setMuted(state) {
        const shouldMute = Boolean(state);
        if (this.muted === shouldMute) {
            return;
        }
        this.muted = shouldMute;
        if (this.muted) {
            this.stopAll();
        }
    }

    /**
     * Retorna estado de mute
     * @returns {boolean}
     */
    isMuted() {
        return this.muted;
    }
}

// Exporta para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioManager;
}
