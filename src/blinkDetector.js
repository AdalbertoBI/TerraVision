export class BlinkDetector {
  constructor({ threshold, minDuration, cooldown, onBlink }) {
    this.threshold = threshold;
    this.minDuration = minDuration;
    this.cooldown = cooldown;
    this.onBlink = onBlink;
    this.isClosed = false;
    this.closedAt = 0;
    this.lastBlinkAt = 0;
    this.active = false;

    this.leftEyeIndices = [23, 24, 25, 26, 27, 28];
    this.rightEyeIndices = [29, 30, 31, 32, 33, 34];

    if (window.EyeGestures?.BlinkDetector) {
      this.eyeGestures = new window.EyeGestures.BlinkDetector({ onBlink });
    }
  }

  start() {
    if (this.eyeGestures) {
      this.eyeGestures.start();
      return;
    }
    this.active = true;
    requestAnimationFrame(() => this.loop());
  }

  stop() {
    this.active = false;
    if (this.eyeGestures) {
      this.eyeGestures.stop();
    }
  }

  loop() {
    if (!this.active) {
      return;
    }

    const tracker = window.webgazer?.getTracker?.();
    const positions = tracker?.clm?.getCurrentPosition?.();

    if (positions && positions.length > 34) {
      const earLeft = this.eyeAspectRatio(this.leftEyeIndices, positions);
      const earRight = this.eyeAspectRatio(this.rightEyeIndices, positions);
      const ear = (earLeft + earRight) / 2;
      const now = performance.now();

      if (ear < this.threshold) {
        if (!this.isClosed) {
          this.isClosed = true;
          this.closedAt = now;
        }
      } else if (this.isClosed) {
        const duration = now - this.closedAt;
        const sinceLast = now - this.lastBlinkAt;
        if (duration >= this.minDuration && sinceLast >= this.cooldown) {
          this.lastBlinkAt = now;
          this.onBlink?.();
        }
        this.isClosed = false;
      }
    }

    requestAnimationFrame(() => this.loop());
  }

  eyeAspectRatio(indices, points) {
    const [p1, p2, p3, p4, p5, p6] = indices.map((index) => points[index]);
    if (!p1 || !p2 || !p3 || !p4 || !p5 || !p6) {
      return 1;
    }

    const vertical1 = this.distance(p2, p6);
    const vertical2 = this.distance(p3, p5);
    const horizontal = this.distance(p1, p4);

    return horizontal === 0 ? 1 : (vertical1 + vertical2) / (2 * horizontal);
  }

  distance(a, b) {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    return Math.hypot(dx, dy);
  }
}
