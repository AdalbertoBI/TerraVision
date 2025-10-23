import { APP_CONFIG } from './config.js';

const CALIBRATION_POINTS = [
  { x: 0.15, y: 0.15 },
  { x: 0.5, y: 0.15 },
  { x: 0.85, y: 0.15 },
  { x: 0.15, y: 0.5 },
  { x: 0.5, y: 0.5 },
  { x: 0.85, y: 0.5 },
  { x: 0.15, y: 0.85 },
  { x: 0.5, y: 0.85 },
  { x: 0.85, y: 0.85 }
];

export class CalibrationManager {
  constructor(stageEl, getGazeFn, announcer) {
    this.stageEl = stageEl;
    this.getGaze = getGazeFn;
    this.announce = announcer;
    this.sampleWindow = 1200;
    this.minSamplesPerPoint = 12;
    this.offset = { x: 0, y: 0 };
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem(APP_CONFIG.calibrationStorageKey);
      if (!stored) {
        return;
      }
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed.x === 'number' && typeof parsed.y === 'number') {
        this.offset = parsed;
      }
    } catch (error) {
      console.warn('Não foi possível carregar calibração anterior.', error);
    }
  }

  persistOffset() {
    try {
      localStorage.setItem(APP_CONFIG.calibrationStorageKey, JSON.stringify(this.offset));
    } catch (error) {
      console.warn('Não foi possível persistir calibração.', error);
    }
  }

  clear() {
    this.offset = { x: 0, y: 0 };
    localStorage.removeItem(APP_CONFIG.calibrationStorageKey);
  }

  getOffset() {
    return this.offset;
  }

  async calibrate() {
    const overlay = this.buildOverlay();
    this.stageEl.appendChild(overlay);
    this.announce?.('Mire o olhar no alvo indicado e clique para registrar cada ponto.');

    const offsets = [];

    for (const [index, point] of CALIBRATION_POINTS.entries()) {
      this.updateInstruction(overlay, `Ponto ${index + 1} de ${CALIBRATION_POINTS.length}. Clique no alvo.`);
      const sample = await this.collectPoint(overlay, point);
      offsets.push(sample);
    }

    overlay.remove();

    if (!offsets.length) {
      throw new Error('Nenhum dado coletado para calibração.');
    }

    const sum = offsets.reduce(
      (acc, item) => {
        acc.x += item.x;
        acc.y += item.y;
        return acc;
      },
      { x: 0, y: 0 }
    );

    this.offset = {
      x: sum.x / offsets.length,
      y: sum.y / offsets.length
    };

    this.persistOffset();

    this.announce?.('Calibração concluída com sucesso.');
    return { success: true, warnings: 0 };
  }

  buildOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'calibration-overlay';

    const instruction = document.createElement('p');
    instruction.className = 'calibration-instruction';
    instruction.textContent = 'Olhe para o alvo e clique para registrar.';

    const marker = document.createElement('button');
    marker.type = 'button';
    marker.className = 'calibration-target';
    marker.setAttribute('aria-label', 'Clique para registrar calibração');

    overlay.appendChild(instruction);
    overlay.appendChild(marker);
    overlay.dataset.state = 'ready';
    return overlay;
  }

  updateInstruction(overlay, message) {
    const el = overlay.querySelector('.calibration-instruction');
    if (el) {
      el.textContent = message;
    }
  }

  async collectPoint(overlay, point) {
    const marker = overlay.querySelector('.calibration-target');
    const rect = this.stageEl.getBoundingClientRect();

    const targetX = rect.left + rect.width * point.x;
    const targetY = rect.top + rect.height * point.y;

    marker.style.left = `${point.x * 100}%`;
    marker.style.top = `${point.y * 100}%`;
    overlay.dataset.state = 'active';

    return new Promise((resolve) => {
      const handleClick = (event) => {
        event.preventDefault();
        marker.removeEventListener('click', handleClick);

        overlay.dataset.state = 'collecting';
        marker.disabled = true;
        this.updateInstruction(overlay, 'Mantenha o olhar no alvo. Coletando dados...');

        const samples = [];
        const start = performance.now();

        const gather = () => {
          const gaze = this.getGaze?.();
          if (gaze && Number.isFinite(gaze.x) && Number.isFinite(gaze.y)) {
            samples.push({ x: gaze.x - targetX, y: gaze.y - targetY });
          }

          const elapsed = performance.now() - start;
          if (samples.length >= this.minSamplesPerPoint || elapsed >= this.sampleWindow) {
            marker.disabled = false;

            if (!samples.length) {
              overlay.dataset.state = 'active';
              this.updateInstruction(overlay, 'Não registramos o olhar. Ajuste sua posição e clique novamente.');
              marker.addEventListener('click', handleClick, { once: true });
              return;
            }

            const averaged = samples.reduce(
              (acc, sample) => {
                acc.x += sample.x;
                acc.y += sample.y;
                return acc;
              },
              { x: 0, y: 0 }
            );

            averaged.x /= samples.length;
            averaged.y /= samples.length;

            overlay.dataset.state = 'cooldown';
            this.updateInstruction(overlay, 'Ponto registrado!');
            resolve(averaged);
            return;
          }

          requestAnimationFrame(gather);
        };

        requestAnimationFrame(gather);
      };

      marker.addEventListener('click', handleClick, { once: true });
    });
  }
}
