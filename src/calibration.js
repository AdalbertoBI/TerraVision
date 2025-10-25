import { APP_CONFIG, DEFAULT_NOTES } from './config.js';
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
  this.sampleWindow = 1600;
  this.minSamplesPerPoint = 12;
    this.model = new CalibrationModel();
    this.errorThreshold = 65;
    this.blinkTrigger = null;
    this.activeOverlay = null;
    this.passiveOverlay = null;
    this.passiveDots = [];
    this.passiveCallbacks = null;
    this.passiveCompleted = false;
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
    this.activeOverlay = overlay;
    this.announce?.('Mire o olhar no alvo indicado e pisque para registrar cada ponto.');

    this.model.reset();
    let recordedSamples = 0;

    for (const [index, point] of CALIBRATION_POINTS.entries()) {
      this.updateInstruction(overlay, `Ponto ${index + 1} de ${CALIBRATION_POINTS.length}. Olhe e pisque para registrar.`);
      const sample = await this.collectPoint(overlay, point);
      if (sample) {
        recordedSamples += 1;
        this.model.update(sample.raw, sample.target);
      }
    }

    overlay.remove();
    this.activeOverlay = null;
    this.blinkTrigger = null;

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
    instruction.textContent = 'Olhe para o alvo e pisque para registrar.';

    const marker = document.createElement('button');
    marker.type = 'button';
    marker.className = 'calibration-target';
    marker.setAttribute('aria-label', 'Pisque ou clique para registrar calibração');
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
    marker.disabled = false;
    if (!marker.hasAttribute('tabindex')) {
      marker.setAttribute('tabindex', '0');
    }

    return new Promise((resolve) => {
      let collecting = false;
      let activePointerId = null;

      const setBlinkTrigger = () => {
        this.blinkTrigger = () => startCollection({ type: 'blink' });
      };

      const releasePointer = () => {
        if (activePointerId !== null && marker.releasePointerCapture && marker.hasPointerCapture?.(activePointerId)) {
          marker.releasePointerCapture(activePointerId);
        }
        activePointerId = null;
      };

      const detachListeners = () => {
        marker.removeEventListener('pointerdown', handlePointerDown);
        marker.removeEventListener('mousedown', handleMouseDown);
        marker.removeEventListener('touchstart', handleTouchStart);
        marker.removeEventListener('click', handleClickFallback);
        marker.removeEventListener('keydown', handleKeyDown);
        this.blinkTrigger = null;
      };

      const rearmTarget = () => {
        collecting = false;
        marker.disabled = false;
        overlay.dataset.state = 'active';
        marker.dataset.phase = 'armed';
        marker.textContent = '●';
        setBlinkTrigger();
        this.updateInstruction(overlay, 'Olhe e pisque para confirmar este ponto.');
        requestAnimationFrame(() => {
          try {
            marker.focus({ preventScroll: true });
          } catch (error) {
            marker.focus?.();
          }
        });
      };

      const startCollection = (event) => {
        if (collecting) {
          event?.preventDefault();
          return;
        }

        collecting = true;
        event?.preventDefault();
        event?.stopPropagation();
        this.blinkTrigger = null;

        if (event?.type === 'pointerdown') {
          activePointerId = event.pointerId ?? null;
          if (activePointerId !== null && marker.setPointerCapture) {
            try {
              marker.setPointerCapture(activePointerId);
            } catch (error) {
              activePointerId = null;
            }
          }
        } else {
          activePointerId = null;
        }

        overlay.dataset.state = 'collecting';
        marker.disabled = true;
        marker.dataset.phase = 'collecting';
        marker.textContent = '⌛';
  this.updateInstruction(overlay, 'Mantenha o olhar no alvo. Coletando dados após a piscada...');

        const rawSamples = [];
        const start = performance.now();

        const gather = () => {
          let gaze = this.getGaze?.();
          if ((!gaze || !Number.isFinite(gaze.x) || !Number.isFinite(gaze.y)) && window.webgazer?.getCurrentPrediction) {
            const prediction = window.webgazer.getCurrentPrediction();
            if (prediction && Number.isFinite(prediction.x) && Number.isFinite(prediction.y)) {
              gaze = {
                x: prediction.x,
                y: prediction.y
              };
            }
          }
          if (gaze && Number.isFinite(gaze.x) && Number.isFinite(gaze.y)) {
            rawSamples.push({ x: gaze.x, y: gaze.y });
          }

          const elapsed = performance.now() - start;
          if (rawSamples.length >= this.minSamplesPerPoint) {
            marker.disabled = false;

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

            window.webgazer?.recordScreenPosition?.(targetX, targetY, 'blink');

            // Salvar modelo no localStorage após cada ponto bem-sucedido
            try {
              if (window.webgazer?.saveModelToLocalStorage) {
                window.webgazer.saveModelToLocalStorage().catch((error) => {
                  console.warn('[Calibration] Falha ao salvar modelo:', error);
                });
              }
            } catch (error) {
              console.warn('[Calibration] Falha ao salvar modelo:', error);
            }

            overlay.dataset.state = 'cooldown';
            marker.dataset.phase = 'confirmed';
            marker.textContent = '✔';
            this.updateInstruction(overlay, 'Ponto registrado!');
            releasePointer();
            detachListeners();
            resolve({
              raw: averagedRaw,
              target: { x: targetX, y: targetY }
            });
            return;
          }

          if (elapsed >= this.sampleWindow) {
            marker.disabled = false;

            if (!rawSamples.length) {
              releasePointer();
              this.updateInstruction(overlay, 'Não registramos o olhar. Ajuste sua posição e pisque novamente.');
              rearmTarget();
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

            window.webgazer?.recordScreenPosition?.(targetX, targetY, 'blink');

            // Salvar modelo no localStorage após cada ponto bem-sucedido
            try {
              if (window.webgazer?.saveModelToLocalStorage) {
                window.webgazer.saveModelToLocalStorage().catch((error) => {
                  console.warn('[Calibration] Falha ao salvar modelo:', error);
                });
              }
            } catch (error) {
              console.warn('[Calibration] Falha ao salvar modelo:', error);
            }

            overlay.dataset.state = 'cooldown';
            marker.dataset.phase = 'confirmed';
            marker.textContent = '✔';
            this.updateInstruction(overlay, 'Ponto registrado!');
            releasePointer();
            detachListeners();
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

      const handlePointerDown = (event) => {
        startCollection(event);
      };

      const handleMouseDown = (event) => {
        startCollection(event);
      };

      const handleTouchStart = (event) => {
        startCollection(event);
      };

      const handleClickFallback = (event) => {
        startCollection(event);
      };

      const handleKeyDown = (event) => {
        if (event.key === ' ' || event.key === 'Enter') {
          startCollection(event);
        }
      };

      marker.addEventListener('pointerdown', handlePointerDown);
  marker.addEventListener('mousedown', handleMouseDown, { passive: false });
  marker.addEventListener('touchstart', handleTouchStart, { passive: false });
      marker.addEventListener('click', handleClickFallback);
      marker.addEventListener('keydown', handleKeyDown);
      setBlinkTrigger();

      try {
        marker.focus({ preventScroll: true });
      } catch (error) {
        marker.focus?.();
      }
    });
  }

  registerBlink() {
    if (typeof this.blinkTrigger === 'function') {
      this.blinkTrigger();
      return true;
    }
    return false;
  }

  startPassiveBootstrap({ pointCount = 9, onProgress, onComplete } = {}) {
    if (!this.stageEl || this.passiveOverlay) {
      return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'passive-bootstrap-overlay';

    const instruction = document.createElement('p');
    instruction.className = 'passive-bootstrap-instruction';
    instruction.textContent = 'Clique nos pontos onde você está olhando para ensinar o sistema.';

    const container = document.createElement('div');
    container.className = 'passive-bootstrap-dots';

    overlay.appendChild(instruction);
    overlay.appendChild(container);
    this.stageEl.appendChild(overlay);

    const points = this.generatePassivePoints(pointCount);
    const dots = points.map((point, index) => {
      const dot = document.createElement('span');
      dot.className = 'passive-bootstrap-dot';
      dot.style.setProperty('--dot-color', point.color);
      dot.style.left = `${(point.x * 100).toFixed(2)}%`;
      dot.style.top = `${(point.y * 100).toFixed(2)}%`;
      dot.dataset.index = String(index);
      container.appendChild(dot);
      return {
        element: dot,
        x: point.x,
        y: point.y,
        visited: false
      };
    });

    this.passiveOverlay = overlay;
    this.passiveDots = dots;
    this.passiveCallbacks = { onProgress, onComplete };
    this.passiveCompleted = false;

    const remaining = dots.filter((dot) => !dot.visited).length;
    onProgress?.(remaining);
  }

  stopPassiveBootstrap() {
    if (this.passiveOverlay && this.passiveOverlay.parentNode) {
      this.passiveOverlay.parentNode.removeChild(this.passiveOverlay);
    }
    this.passiveOverlay = null;
    this.passiveDots = [];
    this.passiveCallbacks = null;
    this.passiveCompleted = true;
  }

  registerPassiveClick({ x, y }) {
    if (!this.passiveOverlay || !this.passiveDots.length) {
      return null;
    }

    const rect = this.stageEl.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return null;
    }

    const localX = (x - rect.left) / rect.width;
    const localY = (y - rect.top) / rect.height;
    const maxDistance = 0.12;

    let hit = null;
    let shortest = Number.POSITIVE_INFINITY;

    for (const dot of this.passiveDots) {
      if (dot.visited) {
        continue;
      }
      const dx = localX - dot.x;
      const dy = localY - dot.y;
      const distance = Math.hypot(dx, dy);
      if (distance < shortest && distance <= maxDistance) {
        shortest = distance;
        hit = dot;
      }
    }

    if (hit) {
      hit.visited = true;
      hit.element.dataset.state = 'visited';
    }

    const remaining = this.passiveDots.filter((dot) => !dot.visited).length;
    if (remaining === 0 && !this.passiveCompleted) {
      this.passiveCompleted = true;
      this.passiveCallbacks?.onComplete?.();
      this.stopPassiveBootstrap();
      return { hit: Boolean(hit), remaining: 0, completed: true };
    }

    this.passiveCallbacks?.onProgress?.(remaining);
    return { hit: Boolean(hit), remaining, completed: false };
  }

  refreshPassiveBootstrap() {
    if (!this.passiveOverlay || !this.passiveDots.length) {
      return;
    }

    const points = this.generatePassivePoints(this.passiveDots.length);
    this.passiveDots.forEach((dot, index) => {
      const point = points[index];
      if (!point) {
        return;
      }
      dot.x = point.x;
      dot.y = point.y;
      dot.element.style.left = `${(point.x * 100).toFixed(2)}%`;
      dot.element.style.top = `${(point.y * 100).toFixed(2)}%`;
      dot.element.style.setProperty('--dot-color', point.color ?? '#4fc3f7');
    });
  }

  generatePassivePoints(count = 9) {
    const rect = this.stageEl.getBoundingClientRect();
    const width = rect.width || window.innerWidth || 1;
    const height = rect.height || window.innerHeight || 1;
    const radius = Math.min(width, height) * 0.24;
    const colors = DEFAULT_NOTES.map((note) => note.color).filter(Boolean);

    const points = [];
    const centerX = 0.5;
    const centerY = 0.5;
    points.push({ x: centerX, y: centerY, color: colors[0] ?? '#4fc3f7' });

    const ringCount = Math.max(0, count - 1);
    for (let i = 0; i < ringCount; i += 1) {
      const angle = (i / ringCount) * Math.PI * 2 - Math.PI / 2;
      const offsetX = (Math.cos(angle) * radius) / width;
      const offsetY = (Math.sin(angle) * radius) / height;
      const color = colors[(i + 1) % colors.length] ?? '#fbc02d';
      points.push({
        x: centerX + offsetX,
        y: centerY + offsetY,
        color
      });
    }

    return points;
  }
}

export default CalibrationManager;
