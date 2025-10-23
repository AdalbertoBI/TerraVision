export class PizzaRenderer {
  constructor(canvas, notes) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.notes = notes;
    this.radius = 0;
    this.center = { x: 0, y: 0 };
    this.activeIndex = null;
    this.viewWidth = 0;
    this.viewHeight = 0;
    this.columns = 4;
    this.resize();
  }

  setNotes(notes) {
    this.notes = notes;
    this.draw(this.activeIndex);
  }

  resize() {
    const container = this.canvas.parentElement;
    if (!container) {
      return;
    }

    const rect = container.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return;
    }

    const ratio = window.devicePixelRatio || 1;
    this.viewWidth = rect.width;
    this.viewHeight = rect.height;

    this.canvas.width = rect.width * ratio;
    this.canvas.height = rect.height * ratio;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(ratio, ratio);

    this.center = { x: rect.width / 2, y: rect.height / 2 };

    this.draw(this.activeIndex);
  }

  draw(highlightIndex = null) {
    if (!this.notes?.length) {
      return;
    }

    this.activeIndex = highlightIndex;
    const ctx = this.ctx;
    const width = this.viewWidth;
    const height = this.viewHeight;
    const cols = this.columns;
    const rows = Math.ceil(this.notes.length / cols);
    const cellWidth = width / cols;
    const cellHeight = height / rows;

    ctx.clearRect(0, 0, width, height);

    this.notes.forEach((note, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = col * cellWidth;
      const y = row * cellHeight;
      const isActive = highlightIndex === index;

      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, cellWidth, cellHeight);
      ctx.fillStyle = this.withAlpha(note.color, isActive ? 0.8 : 0.55);
      ctx.fill();

      ctx.strokeStyle = isActive ? 'rgba(255, 255, 255, 0.65)' : 'rgba(5, 8, 15, 0.25)';
      ctx.lineWidth = isActive ? Math.max(4, cellWidth * 0.01) : Math.max(2, cellWidth * 0.004);
      ctx.stroke();

      if (isActive) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.fillRect(x, y, cellWidth, cellHeight);
      }

      ctx.fillStyle = isActive ? '#fff' : 'rgba(255, 255, 255, 0.82)';
      ctx.font = `600 ${Math.max(cellWidth * 0.18, 18)}px "Segoe UI", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(5, 8, 15, 0.3)';
      ctx.shadowBlur = 6;
      const label = note.label || note.id || '';
      ctx.fillText(label, x + cellWidth / 2, y + cellHeight / 2);
      ctx.restore();
    });
  }

  withAlpha(color, alpha) {
    if (!color) {
      return `rgba(79, 195, 247, ${alpha})`;
    }

    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const chunk = hex.length === 3 ? hex.split('').map((char) => char + char) : hex.match(/.{1,2}/g);
      if (!chunk) {
        return `rgba(79, 195, 247, ${alpha})`;
      }
      const [r, g, b] = chunk.map((value) => parseInt(value, 16));
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    if (color.startsWith('rgb')) {
      const values = color
        .replace(/rgba?\(/, '')
        .replace(')', '')
        .split(',')
        .map((value) => value.trim())
        .slice(0, 3)
        .join(', ');
      return `rgba(${values}, ${alpha})`;
    }

    return color;
  }

  pointToSlice(x, y) {
    if (!this.viewWidth || !this.viewHeight) {
      return null;
    }
    const cols = this.columns;
    const rows = Math.ceil(this.notes.length / cols);
    const cellWidth = this.viewWidth / cols;
    const cellHeight = this.viewHeight / rows;

    const col = Math.floor(x / cellWidth);
    const row = Math.floor(y / cellHeight);
    if (col < 0 || row < 0 || col >= cols || row >= rows) {
      return null;
    }
    const index = row * cols + col;
    if (index >= this.notes.length) {
      return null;
    }
    return index;
  }
}
