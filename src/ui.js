export class UIManager {
  constructor() {
    this.stageEl = document.querySelector('.stage');
    this.statusEl = document.getElementById('status');
    this.gazeDot = document.getElementById('gaze-dot');
    this.calibrateButton = document.querySelector('[data-action="calibrate"]');
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

  updateGazeDot(point) {
    if (!this.gazeDot || !this.stageEl) {
      return;
    }
    if (!point) {
      this.gazeDot.style.opacity = '0';
      return;
    }
    const rect = this.stageEl.getBoundingClientRect();
    const x = point.x - rect.left;
    const y = point.y - rect.top;
    this.gazeDot.style.opacity = '1';
    this.gazeDot.style.left = `${x}px`;
    this.gazeDot.style.top = `${y}px`;
  }
}
