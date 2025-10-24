const DEFAULT_OPTIONS = {
  radius: 70,
  intensity: 0.35,
  fade: 0.06,
  decayInterval: 96,
  maxFps: 60,
  color: [79, 195, 247]
};

export class HeatmapRenderer {
  constructor(canvas, options = {}) {
    this.canvas = canvas ?? null;
    this.ctx = this.canvas ? this.canvas.getContext('2d', { alpha: true }) : null;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.pixelRatio = window.devicePixelRatio || 1;
    this.lastDecay = 0;
    this.processing = false;
    this.observer = null;

    if (this.canvas && this.ctx) {
      this.resize();
      this.observe();
    }
  }

  setCanvas(canvas) {
    if (canvas === this.canvas) {
      return;
    }
    this.disconnect();
    this.canvas = canvas ?? null;
    this.ctx = this.canvas ? this.canvas.getContext('2d', { alpha: true }) : null;
    if (this.canvas && this.ctx) {
      this.resize();
      this.observe();
    }
  }

  setOptions(options = {}) {
    this.options = { ...this.options, ...options };
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  observe() {
    if (!this.canvas || !window.ResizeObserver) {
      return;
    }
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(this.canvas);
  }

  resize() {
    if (!this.canvas || !this.ctx) {
      return;
    }
    const rect = this.canvas.getBoundingClientRect();
    const ratio = this.pixelRatio;
    if (this.canvas.width !== rect.width * ratio || this.canvas.height !== rect.height * ratio) {
      this.canvas.width = rect.width * ratio;
      this.canvas.height = rect.height * ratio;
    }
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.ctx.fillStyle = 'rgba(0,0,0,0)';
    this.ctx.fillRect(0, 0, rect.width, rect.height);
  }

  clear() {
    if (!this.ctx || !this.canvas) {
      return;
    }
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.clearRect(0, 0, rect.width, rect.height);
  }

  addPoint(x, y, strength = 0.5) {
    if (!this.ctx || !this.canvas) {
      return;
    }
    const now = performance.now();
    this.maybeDecay(now);

    const { radius, color, intensity } = this.options;
    const clampedStrength = Math.min(Math.max(strength ?? 0.5, 0.05), 1.5);
    const finalIntensity = intensity * clampedStrength;

    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
    const [r, g, b] = color;

    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${finalIntensity})`);
    gradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${finalIntensity * 0.45})`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

    this.ctx.globalCompositeOperation = 'lighter';
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    this.ctx.globalCompositeOperation = 'source-over';
  }

  maybeDecay(now = performance.now()) {
    if (!this.ctx || !this.canvas) {
      return;
    }
    if (now - this.lastDecay < this.options.decayInterval) {
      return;
    }
    this.lastDecay = now;
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.fillStyle = `rgba(5, 10, 20, ${this.options.fade})`;
    this.ctx.fillRect(0, 0, rect.width, rect.height);
  }
}
