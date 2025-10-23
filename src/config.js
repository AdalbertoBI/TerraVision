export const APP_CONFIG = {
  dwellDuration: 1300,
  minConfidence: 0.45,
  notesEndpoint: 'notes.json',
  blinkThreshold: 0.22,
  blinkMinDuration: 80,
  blinkCooldown: 260,
  calibrationStorageKey: 'terra-vision-calibration',
  volumeStorageKey: 'terra-vision-volume',
  therapyStorageKey: 'terra-vision-therapy'
};

export const DEFAULT_NOTES = [
  { id: 'c4', label: 'Dó', frequency: 261.63, color: '#ff6b6b' },
  { id: 'd4', label: 'Ré', frequency: 293.66, color: '#ffa94d' },
  { id: 'e4', label: 'Mi', frequency: 329.63, color: '#ffd43b' },
  { id: 'f4', label: 'Fá', frequency: 349.23, color: '#69db7c' },
  { id: 'g4', label: 'Sol', frequency: 392.0, color: '#38d9a9' },
  { id: 'a4', label: 'Lá', frequency: 440.0, color: '#4dabf7' },
  { id: 'b4', label: 'Si', frequency: 493.88, color: '#845ef7' },
  { id: 'c5', label: 'Dó+', frequency: 523.25, color: '#f783ff' }
];
