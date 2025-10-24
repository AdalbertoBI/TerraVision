import { HeatmapRenderer } from './heatmap.js';

export class UIManager {
  constructor() {
    this.stageEl = document.querySelector('.stage');
    this.stageCenter = document.querySelector('.stage-center');
    this.statusEl = document.getElementById('status');
    this.statusMessageEl = document.getElementById('status-text');
  this.gazeDot = document.getElementById('gaze-dot');
  this.gazeCursorEl = document.getElementById('gaze-cursor');
  this.eyeContainer = document.getElementById('animated-eye-container');
  this.pupilEl = document.getElementById('pupil');
  this.pupilReflection = document.getElementById('pupil-reflection');
  this.pupilReflectionSmall = document.getElementById('pupil-reflection-small');
  this.eyeBase = { x: 131, y: 117.5 };
  this.eyeTargetOffset = { x: 0, y: 0 };
  this.eyeCurrentOffset = { x: 0, y: 0 };
  this.eyeAnimationId = null;
  this.blinkTimeout = null;
    this.heatmapCanvas = document.getElementById('heatmap-canvas');
    this.calibrateButton = document.querySelector('[data-action="calibrate"]');
    this.gazeState = 'idle';
    this.gazeFlashTimeout = null;
    this.cameraPreviewEl = null;
    this.heatmap = this.heatmapCanvas ? new HeatmapRenderer(this.heatmapCanvas, { radius: 85 }) : null;
    if (this.gazeDot) {
      this.gazeDot.dataset.state = this.gazeState;
    }
  }

  getControlButtons() {
    return document.querySelectorAll('.control-button');
  }

  onCalibrate(handler) {
    if (!this.calibrateButton) {
      return;
    }
    this.calibrateButton.addEventListener('click', (event) => {
      event.preventDefault();
      handler?.();
    });
  }

  setCalibrateBusy(isBusy) {
    if (!this.calibrateButton) {
      return;
    }
    this.calibrateButton.disabled = isBusy;
    this.calibrateButton.classList.toggle('is-busy', isBusy);
  }

  updateStatus(message) {
    if (this.statusMessageEl) {
      this.statusMessageEl.textContent = message;
      return;
    }
    if (this.statusEl) {
      this.statusEl.textContent = message;
    }
  }

  updateGazeDot(point, { state, clampToStage = true } = {}) {
    if (!this.gazeDot || !this.stageEl) {
      this.updateGazeCursor(null);
      this.updateAnimatedEye(null);
      return;
    }
    if (!point) {
      this.setGazeState('lost');
      this.gazeDot.style.opacity = '0';
      this.updateGazeCursor(null);
      this.updateAnimatedEye(null);
      return;
    }
    const rect = this.stageEl.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) {
      return;
    }

    let x = point.x - rect.left;
    let y = point.y - rect.top;

    if (clampToStage) {
      x = Math.max(0, Math.min(rect.width, x));
      y = Math.max(0, Math.min(rect.height, y));
    }

    if (state) {
      this.setGazeState(state);
    } else if (!this.gazeState || this.gazeState === 'lost') {
      this.setGazeState('tracking');
    }

    this.gazeDot.style.opacity = '1';
    this.gazeDot.style.left = `${x}px`;
    this.gazeDot.style.top = `${y}px`;

    this.updateGazeCursor(point, { quality: state });
    this.updateAnimatedEye(point, { quality: state });
  }

  setGazeState(state) {
    if (!this.gazeDot) {
      return;
    }
    this.gazeState = state || 'tracking';
    this.gazeDot.dataset.state = this.gazeState;
  }

  updateGazeCursor(point, { quality } = {}) {
    if (!this.gazeCursorEl) {
      return;
    }
    if (!point) {
      delete this.gazeCursorEl.dataset.active;
      delete this.gazeCursorEl.dataset.quality;
      return;
    }

    this.gazeCursorEl.style.left = `${point.x}px`;
    this.gazeCursorEl.style.top = `${point.y}px`;
    this.gazeCursorEl.dataset.active = 'true';
    if (quality === 'low') {
      this.gazeCursorEl.dataset.quality = 'low';
    } else {
      delete this.gazeCursorEl.dataset.quality;
    }
  }

  updateAnimatedEye(point, { quality } = {}) {
    if (!this.eyeContainer || !this.pupilEl) {
      return;
    }

    if (!point) {
      delete this.eyeContainer.dataset.visible;
      delete this.eyeContainer.dataset.quality;
      this.setEyeTarget({ x: 0, y: 0 });
      return;
    }

    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const gazeX = clamp(point.x / viewportWidth, 0, 1);
    const gazeY = clamp(point.y / viewportHeight, 0, 1);

    const offsetX = (gazeX - 0.5) * 40;
    const offsetY = (gazeY - 0.5) * 40;

    this.setEyeTarget({ x: offsetX, y: offsetY });
    this.eyeContainer.dataset.visible = 'true';
    if (quality === 'low') {
      this.eyeContainer.dataset.quality = 'low';
    } else {
      delete this.eyeContainer.dataset.quality;
    }
  }

  setEyeTarget(offset) {
    this.eyeTargetOffset = {
      x: Number.isFinite(offset?.x) ? offset.x : 0,
      y: Number.isFinite(offset?.y) ? offset.y : 0
    };

    if (!this.eyeAnimationId) {
      this.eyeAnimationId = requestAnimationFrame(() => this.animateEye());
    }
  }

  animateEye() {
    const lerpFactor = 0.18;
    const dx = this.eyeTargetOffset.x - this.eyeCurrentOffset.x;
    const dy = this.eyeTargetOffset.y - this.eyeCurrentOffset.y;
    this.eyeCurrentOffset.x += dx * lerpFactor;
    this.eyeCurrentOffset.y += dy * lerpFactor;

    const cx = this.eyeBase.x + this.eyeCurrentOffset.x;
    const cy = this.eyeBase.y + this.eyeCurrentOffset.y;

    this.pupilEl.setAttribute('cx', cx.toFixed(2));
    this.pupilEl.setAttribute('cy', cy.toFixed(2));

    if (this.pupilReflection) {
      this.pupilReflection.setAttribute('cx', (cx - 20).toFixed(2));
      this.pupilReflection.setAttribute('cy', (cy - 15).toFixed(2));
    }
    if (this.pupilReflectionSmall) {
      this.pupilReflectionSmall.setAttribute('cx', (cx - 7).toFixed(2));
      this.pupilReflectionSmall.setAttribute('cy', (cy - 15).toFixed(2));
    }

    if (Math.abs(dx) > 0.2 || Math.abs(dy) > 0.2) {
      this.eyeAnimationId = requestAnimationFrame(() => this.animateEye());
    } else {
      this.eyeCurrentOffset = { ...this.eyeTargetOffset };
      this.eyeAnimationId = null;
    }
  }

  triggerBlinkAnimation(duration = 160) {
    if (!this.eyeContainer) {
      return;
    }
    this.eyeContainer.dataset.blink = 'closed';
    if (this.blinkTimeout) {
      clearTimeout(this.blinkTimeout);
    }
    this.blinkTimeout = setTimeout(() => {
      delete this.eyeContainer.dataset.blink;
    }, duration);
  }

  updateHeatmap(point, confidence = 0.5) {
    if (!this.heatmap || !this.stageEl || !point) {
      return;
    }
    const rect = this.stageEl.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) {
      return;
    }
    const x = point.x - rect.left;
    const y = point.y - rect.top;
    if (Number.isNaN(x) || Number.isNaN(y)) {
      return;
    }
    if (x < -40 || y < -40 || x > rect.width + 40 || y > rect.height + 40) {
      return;
    }
    const normalized = Math.min(Math.max(confidence ?? 0.45, 0.12), 1.35);
    this.heatmap.addPoint(x, y, normalized);
  }

  attachCameraPreview(videoEl) {
    if (!this.stageEl || !videoEl) {
      return;
    }
    const target = this.stageCenter || this.stageEl;
    if (!target.contains(videoEl)) {
      target.appendChild(videoEl);
    }
    this.cameraPreviewEl = videoEl;
  }

  toggleCameraPreview(isVisible) {
    if (!this.cameraPreviewEl) {
      return;
    }
    this.cameraPreviewEl.style.display = isVisible ? 'block' : 'none';
  }

  flashGazeConfirmation() {
    if (!this.gazeDot) {
      return;
    }
    this.gazeDot.dataset.flash = 'true';
    if (this.gazeFlashTimeout) {
      clearTimeout(this.gazeFlashTimeout);
    }
    this.gazeFlashTimeout = setTimeout(() => {
      if (this.gazeDot) {
        delete this.gazeDot.dataset.flash;
      }
      this.gazeFlashTimeout = null;
    }, 360);
  }
}
