export const APP_CONFIG = {
  dwellDuration: 1300,
  minConfidence: 0.45,
  notesEndpoint: 'notes.json',
  blinkThreshold: 0.22,
  blinkMinDuration: 80,
  blinkCooldown: 500,
  calibrationStorageKey: 'terra-vision-calibration',
  volumeStorageKey: 'terra-vision-volume',
  therapyStorageKey: 'terra-vision-therapy'
};

// Paleta baseada no kit Board Bells-08 (Terra Eletrônica)
export const DEFAULT_NOTES = [
  { id: 'c4', label: 'Dó', frequency: 261.63, color: '#d32f2f' },
  { id: 'd4', label: 'Ré', frequency: 293.66, color: '#ef6c00' },
  { id: 'e4', label: 'Mi', frequency: 329.63, color: '#fbc02d' },
  { id: 'f4', label: 'Fá', frequency: 349.23, color: '#388e3c' },
  { id: 'g4', label: 'Sol', frequency: 392.0, color: '#0288d1' },
  { id: 'a4', label: 'Lá', frequency: 440.0, color: '#303f9f' },
  { id: 'b4', label: 'Si', frequency: 493.88, color: '#9575cd' },
  { id: 'c5', label: 'Dó+', frequency: 523.25, color: '#d32f2f' }
];
