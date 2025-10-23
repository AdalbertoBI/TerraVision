import { APP_CONFIG } from './config.js';
import { CalibrationModel } from './calibrationModel.js';

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
    this.model = new CalibrationModel();
    this.errorThreshold = 65;
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem(APP_CONFIG.calibrationStorageKey);
      if (!stored) {
        return;
      }
      this.model = CalibrationModel.deserialize(stored, {});
    } catch (error) {
      console.warn('Não foi possível carregar calibração anterior.', error);
    }
  }

  persistModel() {
    try {
      localStorage.setItem(APP_CONFIG.calibrationStorageKey, this.model.serialize());
    } catch (error) {
      console.warn('Não foi possível persistir calibração.', error);
    }
  }

  clear() {
    this.model.reset();
    localStorage.removeItem(APP_CONFIG.calibrationStorageKey);
  }

  isReady() {
    return this.model.isReady();
  }

  transform(point) {
    if (!point) {
      return null;
    }
    if (!this.model.isReady()) {
      return { ...point };
    }
    const predicted = this.model.predict(point);
    return {
      ...point,
      x: predicted.x,
      y: predicted.y
    };
  }

  async calibrate() {
    const overlay = this.buildOverlay();
    this.stageEl.appendChild(overlay);
    this.announce?.('Mire o olhar no alvo indicado e clique para registrar cada ponto.');

    this.model.reset();
    let recordedSamples = 0;

    for (const [index, point] of CALIBRATION_POINTS.entries()) {
      this.updateInstruction(overlay, `Ponto ${index + 1} de ${CALIBRATION_POINTS.length}. Clique no alvo.`);
      const sample = await this.collectPoint(overlay, point);
      if (sample) {
        recordedSamples += 1;
        this.model.update(sample.raw, sample.target);
      }
    }

    overlay.remove();

    if (!recordedSamples) {
      throw new Error('Nenhum dado coletado para calibração.');
    }

    this.persistModel();

    this.announce?.('Calibração concluída com sucesso.');
    const error = this.model.errorEstimate();
    return {
      success: true,
      warnings: error > this.errorThreshold ? 1 : 0,
      averageError: error
    };
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
    marker.dataset.phase = 'armed';
    marker.textContent = '●';

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
    marker.dataset.phase = 'armed';
    marker.textContent = '●';

    return new Promise((resolve) => {
      const handleClick = (event) => {
        event.preventDefault();
        marker.removeEventListener('click', handleClick);

        overlay.dataset.state = 'collecting';
        marker.disabled = true;
        marker.dataset.phase = 'collecting';
        marker.textContent = '⌛';
        this.updateInstruction(overlay, 'Mantenha o olhar no alvo. Coletando dados...');

        const rawSamples = [];
        const start = performance.now();

        const gather = () => {
          const gaze = this.getGaze?.();
          if (gaze && Number.isFinite(gaze.x) && Number.isFinite(gaze.y)) {
            rawSamples.push({ x: gaze.x, y: gaze.y });
          }

          const elapsed = performance.now() - start;
          if (rawSamples.length >= this.minSamplesPerPoint || elapsed >= this.sampleWindow) {
            marker.disabled = false;

            if (!rawSamples.length) {
              overlay.dataset.state = 'active';
              marker.dataset.phase = 'armed';
              marker.textContent = '●';
              this.updateInstruction(overlay, 'Não registramos o olhar. Ajuste sua posição e clique novamente.');
              marker.addEventListener('click', handleClick, { once: true });
              return;
            }

            const averagedRaw = rawSamples.reduce(
              (acc, sample) => {
                acc.x += sample.x;
                acc.y += sample.y;
                return acc;
              },
              { x: 0, y: 0 }
            );

            averagedRaw.x /= rawSamples.length;
            averagedRaw.y /= rawSamples.length;

            overlay.dataset.state = 'cooldown';
            marker.dataset.phase = 'confirmed';
            marker.textContent = '✔';
            this.updateInstruction(overlay, 'Ponto registrado!');
            resolve({
              raw: averagedRaw,
              target: { x: targetX, y: targetY }
            });
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

export default CalibrationManager;
