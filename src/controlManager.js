export class ControlManager {
  constructor(buttons, { dwellDuration, onActivate }) {
    this.dwellDuration = dwellDuration;
    this.onActivate = onActivate;
    this.paused = false;
    this.focusedButton = null;
    this.focusStart = null;
    this.awaitingBlink = false;

    this.buttons = Array.from(buttons).map((el) => ({
      el,
      action: el.dataset.action,
      rect: el.getBoundingClientRect(),
      progressEl: el.querySelector('.control-progress')
    }));

    this.buttonMap = new Map(this.buttons.map((btn) => [btn.action, btn]));

    window.addEventListener('resize', () => this.refreshRects());
  }

  setDwellDuration(value) {
    this.dwellDuration = value;
  }

  refreshRects() {
    this.buttons.forEach((btn) => {
      btn.rect = btn.el.getBoundingClientRect();
    });
  }

  setPaused(value) {
    this.paused = value;
    if (value) {
      this.clearFocus();
    }
  }

  handleGaze(point) {
    if (this.paused) {
      return false;
    }

    if (!point) {
      this.clearFocus();
      return false;
    }

    const target = this.buttons.find((btn) => this.pointInside(point, btn.rect));

    if (!target) {
      this.clearFocus();
      return false;
    }

    if (this.focusedButton?.action !== target.action) {
      this.setFocus(target);
      return true;
    }

    if (this.awaitingBlink) {
      return true;
    }

    const elapsed = performance.now() - this.focusStart;
    const progress = Math.min(1, elapsed / this.dwellDuration);
    this.updateProgress(this.focusedButton, progress);

    if (progress >= 1) {
      this.enterAwaitingBlink();
    }

    return true;
  }

  handleBlink() {
    if (!this.focusedButton || !this.awaitingBlink) {
      return false;
    }

    this.activate(this.focusedButton, 'blink');
    return true;
  }

  activateByAction(action, source = 'click') {
    const target = this.buttonMap.get(action);
    if (!target) {
      return;
    }
    this.activate(target, source);
  }

  setActiveState(action, isActive) {
    const target = this.buttonMap.get(action);
    if (!target) {
      return;
    }
    target.el.classList.toggle('is-active', Boolean(isActive));
  }

  setIcon(action, icon) {
    const target = this.buttonMap.get(action);
    if (!target) {
      return;
    }
    const iconSpan = target.el.querySelector('.control-icon');
    if (iconSpan) {
      iconSpan.textContent = icon;
    }
  }

  clearFocus() {
    if (!this.focusedButton) {
      return;
    }
    this.focusedButton.el.classList.remove('is-focus', 'is-awaiting');
    this.updateProgress(this.focusedButton, 0);
    this.focusedButton = null;
    this.focusStart = null;
    this.awaitingBlink = false;
  }

  setFocus(target) {
    if (this.focusedButton) {
      this.focusedButton.el.classList.remove('is-focus', 'is-awaiting');
      this.updateProgress(this.focusedButton, 0);
    }

    this.focusedButton = target;
    this.focusedButton.el.classList.add('is-focus');
    this.focusStart = performance.now();
    this.awaitingBlink = false;
    this.updateProgress(this.focusedButton, 0);
  }

  enterAwaitingBlink() {
    if (!this.focusedButton) {
      return;
    }
    this.awaitingBlink = true;
    this.focusedButton.el.classList.add('is-awaiting');
  }

  activate(target, source) {
    this.onActivate?.(target.action, source);
    this.updateProgress(target, 0);
    target.el.classList.remove('is-focus', 'is-awaiting');
    this.focusedButton = null;
    this.focusStart = null;
    this.awaitingBlink = false;
  }

  updateProgress(target, value) {
    if (!target || !target.progressEl) {
      return;
    }
    target.el.style.setProperty('--progress', value);
  }

  pointInside(point, rect) {
    if (!rect) {
      return false;
    }
    return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
  }
}
