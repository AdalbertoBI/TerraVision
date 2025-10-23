export class UIManager {
  constructor() {
    this.stageEl = document.querySelector('.stage');
    this.statusEl = document.getElementById('status');
    this.gazeDot = document.getElementById('gaze-dot');
    this.calibrateButton = document.querySelector('[data-action="calibrate"]');
    this.gazeState = 'idle';
    this.gazeFlashTimeout = null;
    this.cameraPreviewEl = null;
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
    if (this.statusEl) {
      this.statusEl.textContent = message;
    }
  }

  updateGazeDot(point, { state, clampToStage = true } = {}) {
    if (!this.gazeDot || !this.stageEl) {
      return;
    }
    if (!point) {
      this.setGazeState('lost');
      this.gazeDot.style.opacity = '0';
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
  }

  setGazeState(state) {
    if (!this.gazeDot) {
      return;
    }
    this.gazeState = state || 'tracking';
    this.gazeDot.dataset.state = this.gazeState;
  }

  attachCameraPreview(videoEl) {
    if (!this.stageEl || !videoEl) {
      return;
    }
    if (!this.stageEl.contains(videoEl)) {
      this.stageEl.appendChild(videoEl);
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
