export class UIManager {
  constructor() {
    this.stageEl = document.querySelector('.stage');
    this.stageCenter = document.querySelector('.stage-center');
    this.statusEl = document.getElementById('status');
    this.statusMessageEl = document.getElementById('status-text');
    this.gazeDot = document.getElementById('gaze-dot');
    this.gazeCursor = document.getElementById('gazeCursor');
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
      if (this.gazeCursor) {
        delete this.gazeCursor.dataset.active;
      }
      return;
    }
    if (!point) {
      this.setGazeState('lost');
      this.gazeDot.style.opacity = '0';
      if (this.gazeCursor) {
        delete this.gazeCursor.dataset.active;
      }
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

    if (this.gazeCursor) {
      this.gazeCursor.style.left = `${point.x}px`;
      this.gazeCursor.style.top = `${point.y}px`;
      this.gazeCursor.dataset.active = 'true';
    }
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
