/**
 * TerraVision Desktop - Audio Engine (Howler.js)
 * 
 * Sistema de áudio terapêutico robusto usando Howler.js
 * Sons binaurais para estimulação cognitiva sem gesture policy (Electron)
 * Integração com eventos de gaze e calibração
 */

import { Howl, Howler } from 'howler';

export class AudioEngine {
    constructor() {
        this.sounds = new Map();
        this.currentSound = null;
        this.isPlaying = false;
        this.volume = 0.5;
        
        // Configurações de áudio terapêutico
        this.config = {
            fadeInDuration: 1000,    // ms
            fadeOutDuration: 800,    // ms
            autoStop: false,         // Tocar continuamente
            spatialAudio: true       // Áudio 3D
        };

        // Mapeamento de setores da pizza para sons
        this.sectorSounds = {
            0: 'relax',      // Relaxamento
            1: 'focus',      // Foco
            2: 'energy',     // Energia
            3: 'calm',       // Calma
            4: 'creative',   // Criatividade
            5: 'meditation'  // Meditação
        };

        console.log('[Audio Engine] 🎵 Sistema de áudio inicializado');
    }

    /**
     * Inicializa e carrega todos os sons
     */
    async initialize() {
        try {
            // Configurar Howler global
            Howler.volume(this.volume);
            Howler.autoUnlock = true;

            console.log('[Audio Engine] 📦 Carregando sons terapêuticos...');

            // Definir sons (usando URLs de exemplo - você pode substituir)
            const soundDefinitions = {
                relax: {
                    src: ['assets/sounds/binaural-relax.mp3', 'assets/sounds/relax.ogg'],
                    description: 'Relaxamento profundo (4-8 Hz)',
                    frequency: 6
                },
                focus: {
                    src: ['assets/sounds/binaural-focus.mp3', 'assets/sounds/focus.ogg'],
                    description: 'Concentração aumentada (12-15 Hz)',
                    frequency: 13
                },
                energy: {
                    src: ['assets/sounds/binaural-energy.mp3', 'assets/sounds/energy.ogg'],
                    description: 'Energia e vitalidade (30-40 Hz)',
                    frequency: 35
                },
                calm: {
                    src: ['assets/sounds/binaural-calm.mp3', 'assets/sounds/calm.ogg'],
                    description: 'Calma e paz (8-12 Hz)',
                    frequency: 10
                },
                creative: {
                    src: ['assets/sounds/binaural-creative.mp3', 'assets/sounds/creative.ogg'],
                    description: 'Criatividade (10-12 Hz)',
                    frequency: 11
                },
                meditation: {
                    src: ['assets/sounds/binaural-meditation.mp3', 'assets/sounds/meditation.ogg'],
                    description: 'Meditação profunda (4-7 Hz)',
                    frequency: 5
                }
            };

            // Carregar cada som
            for (const [key, def] of Object.entries(soundDefinitions)) {
                await this.loadSound(key, def);
            }

            // Sons de feedback
            await this.loadSound('blink', {
                src: ['assets/sounds/blink-feedback.mp3'],
                description: 'Feedback de piscada',
                volume: 0.3,
                sprite: { ping: [0, 200] }
            });

            await this.loadSound('calibration', {
                src: ['assets/sounds/calibration-success.mp3'],
                description: 'Calibração bem-sucedida',
                volume: 0.4,
                sprite: { success: [0, 500] }
            });

            console.log('[Audio Engine] ✅ Todos os sons carregados');
            this.updateAudioStatus('Pronto');

        } catch (error) {
            console.error('[Audio Engine] ❌ Erro ao inicializar áudio:', error);
            this.updateAudioStatus('Erro');
            
            // Criar sons de fallback (silêncio) para não quebrar app
            this.createFallbackSounds();
        }
    }

    /**
     * Carrega um som individual
     */
    async loadSound(key, definition) {
        return new Promise((resolve, reject) => {
            const sound = new Howl({
                src: definition.src,
                loop: !definition.sprite, // Loop para sons binaurais
                volume: definition.volume || this.volume,
                html5: true,  // Usar HTML5 Audio para streaming
                sprite: definition.sprite || undefined,
                preload: true,
                onload: () => {
                    console.log(`[Audio Engine] ✓ ${key} carregado: ${definition.description}`);
                    this.sounds.set(key, {
                        howl: sound,
                        definition: definition
                    });
                    resolve();
                },
                onerror: (id, error) => {
                    console.warn(`[Audio Engine] ⚠️ Erro ao carregar ${key}:`, error);
                    // Não rejeitar - continuar com outros sons
                    resolve();
                }
            });
        });
    }

    /**
     * Cria sons de fallback (silêncio) quando arquivos não disponíveis
     */
    createFallbackSounds() {
        console.log('[Audio Engine] 🔇 Criando sons de fallback (silêncio)...');
        
        // Gerar 1 segundo de silêncio em base64
        const silentMP3 = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAACAAABhADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/////////////////////////////////AAAAATPF2YSBsYXZjNTguMTM0LjEwMQAAAAAAAAAAAAAAACQCgAAAAAAAAAGE5j8QTgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//MUZAALACwAAAAAABpgAAAACAAAP8AAAAAAAAAAAAAAAAAAAAAAABVElQMQRFAAE=';
        
        Object.keys(this.sectorSounds).forEach(key => {
            const sound = new Howl({
                src: [silentMP3],
                loop: true,
                volume: 0
            });
            
            this.sounds.set(this.sectorSounds[key], {
                howl: sound,
                definition: { description: 'Fallback silence', frequency: 0 }
            });
        });
    }

    /**
     * Toca som de um setor específico da pizza
     * @param {number} sectorIndex - Índice do setor (0-5)
     */
    playSector(sectorIndex) {
        const soundKey = this.sectorSounds[sectorIndex];
        
        if (!soundKey) {
            console.warn('[Audio Engine] ⚠️ Setor inválido:', sectorIndex);
            return;
        }

        this.playSound(soundKey);
    }

    /**
     * Toca um som específico
     * @param {string} soundKey - Chave do som
     */
    playSound(soundKey) {
        const soundData = this.sounds.get(soundKey);
        
        if (!soundData) {
            console.warn('[Audio Engine] ⚠️ Som não encontrado:', soundKey);
            return;
        }

        // Se já está tocando o mesmo som, não fazer nada
        if (this.currentSound === soundKey && this.isPlaying) {
            return;
        }

        // Parar som atual com fade out
        if (this.currentSound && this.isPlaying) {
            this.stopCurrent();
        }

        const { howl, definition } = soundData;

        // Fade in
        if (!definition.sprite) {
            howl.volume(0);
            howl.play();
            howl.fade(0, this.volume, this.config.fadeInDuration);
        } else {
            // Sons curtos (sprites) sem fade
            howl.play(Object.keys(definition.sprite)[0]);
        }

        this.currentSound = soundKey;
        this.isPlaying = true;

        console.log(`[Audio Engine] ▶️ Tocando: ${definition.description}`);
    }

    /**
     * Para som atual com fade out
     */
    stopCurrent() {
        if (!this.currentSound) return;

        const soundData = this.sounds.get(this.currentSound);
        if (!soundData) return;

        const { howl } = soundData;

        if (!soundData.definition.sprite) {
            howl.fade(howl.volume(), 0, this.config.fadeOutDuration);
            setTimeout(() => {
                howl.stop();
            }, this.config.fadeOutDuration);
        } else {
            howl.stop();
        }

        this.isPlaying = false;
        console.log('[Audio Engine] ⏹️ Som parado');
    }

    /**
     * Para todos os sons
     */
    stopAll() {
        this.sounds.forEach(({ howl }) => {
            howl.stop();
        });
        this.currentSound = null;
        this.isPlaying = false;
        console.log('[Audio Engine] ⏹️ Todos os sons parados');
    }

    /**
     * Toca feedback de piscada
     */
    playBlinkFeedback() {
        this.playSound('blink');
    }

    /**
     * Toca feedback de calibração bem-sucedida
     */
    playCalibrationSuccess() {
        this.playSound('calibration');
    }

    /**
     * Define volume global
     * @param {number} level - Volume (0.0 a 1.0)
     */
    setVolume(level) {
        this.volume = Math.max(0, Math.min(1, level));
        Howler.volume(this.volume);
        console.log(`[Audio Engine] 🔊 Volume: ${(this.volume * 100).toFixed(0)}%`);
    }

    /**
     * Mute/Unmute
     */
    toggleMute() {
        const isMuted = Howler.mute();
        Howler.mute(!isMuted);
        console.log(`[Audio Engine] ${isMuted ? '🔊' : '🔇'} ${isMuted ? 'Unmuted' : 'Muted'}`);
        return !isMuted;
    }

    /**
     * Atualiza status na UI
     */
    updateAudioStatus(status) {
        const audioStatus = document.getElementById('audio-status');
        if (audioStatus) {
            audioStatus.textContent = status;
            audioStatus.style.color = status === 'Pronto' ? '#4caf50' : 
                                     status === 'Erro' ? '#f44336' : '#ff9800';
        }
    }

    /**
     * Informações sobre sons carregados
     */
    getInfo() {
        return {
            loaded: this.sounds.size,
            current: this.currentSound,
            isPlaying: this.isPlaying,
            volume: this.volume,
            sounds: Array.from(this.sounds.keys())
        };
    }
}

// Instância global
export const audioEngine = new AudioEngine();

console.log('[Audio Engine] 🚀 Módulo de áudio carregado');
