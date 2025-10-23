const DEFAULT_FILTERS = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  blur: 0,
  grayscale: 0,
  invert: 0
};

const DEFAULT_DIGITAL_ZOOM = 2.75;

const DEFAULT_CONSTRAINTS = {
  video: {
    facingMode: 'user',
    width: { ideal: 1280 },
    height: { ideal: 720 }
  },
  audio: false
};

export class CameraPreview {
  constructor({
    videoEl = null,
    overlayCanvas = null,
    constraints = DEFAULT_CONSTRAINTS,
    onStatusChange = () => {}
  } = {}) {
    this.constraints = constraints;
    this.onStatusChange = onStatusChange;

    this.videoEl = videoEl || this.#createVideoElement();
    this.overlayCanvas = overlayCanvas || null;
    this.canvasCtx = this.overlayCanvas?.getContext?.('2d') ?? null;

    this.stream = null;
    this.isRunning = false;
    this.stats = {
      startedAt: null,
      frames: 0,
      fps: 0,
      resolution: null
    };

    this.filters = { ...DEFAULT_FILTERS };
    this.statsTimer = null;
    this.frameRequest = null;
    this.baseTransform = 'scaleX(-1)';
    this.presentationZoom = 1;
    this.digitalZoomFallback = DEFAULT_DIGITAL_ZOOM;
    this.#applyPresentationZoom();
  }

  async start() {
    if (this.isRunning) {
      return true;
    }
    try {
      this.onStatusChange({ type: 'state', value: 'requesting-permission' });
      const stream = await navigator.mediaDevices.getUserMedia(this.constraints);
      await this.#optimizeTrackSettings(stream);
      await this.#attachStream(stream);
      this.isRunning = true;
      this.onStatusChange({ type: 'state', value: 'running' });
      return true;
    } catch (error) {
      console.error('CameraPreview.start failed', error);
      this.onStatusChange({ type: 'error', error });
      this.isRunning = false;
      throw error;
    }
  }

  async stop() {
    if (!this.isRunning) {
      return;
    }
    this.stream?.getTracks?.().forEach((track) => track.stop());
    this.stream = null;
    this.isRunning = false;
    this.#stopStatsLoop();
    this.onStatusChange({ type: 'state', value: 'stopped' });
  }

  isActive() {
    return this.isRunning;
  }

  getVideoElement() {
    return this.videoEl;
  }

  getStream() {
    return this.stream;
  }

  applyFilters(partial) {
    this.filters = {
      ...this.filters,
      ...partial
    };
    const filterString = this.#buildFilterString(this.filters);
    this.videoEl.style.filter = filterString;
    if (this.overlayCanvas) {
      this.overlayCanvas.style.filter = filterString;
    }
    return this.filters;
  }

  resetFilters() {
    return this.applyFilters(DEFAULT_FILTERS);
  }

  getFilters() {
    return { ...this.filters };
  }

  takeSnapshot() {
    if (!this.isRunning) {
      throw new Error('CameraPreview: cannot capture snapshot while stopped.');
    }
    const width = this.videoEl.videoWidth;
    const height = this.videoEl.videoHeight;
    if (!width || !height) {
      throw new Error('CameraPreview: video dimensions unavailable.');
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(this.videoEl, 0, 0, width, height);
    return canvas.toDataURL('image/png');
  }

  getStats() {
    const uptimeMs = this.stats.startedAt ? performance.now() - this.stats.startedAt : 0;
    return {
      ...this.stats,
      uptimeMs
    };
  }

  async #attachStream(stream) {
    this.stream = stream;
    this.videoEl.srcObject = stream;
    this.videoEl.playsInline = true;
    this.videoEl.muted = true;

    const playPromise = this.videoEl.play();
    if (playPromise instanceof Promise) {
      try {
        await playPromise;
      } catch (error) {
        console.warn('CameraPreview: autoplay was prevented, waiting for user gesture.');
      }
    }

    this.#startStatsLoop();
  }

  #createVideoElement() {
    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;
    video.setAttribute('data-camera-preview', 'true');
    video.style.cssText = `
      position: absolute;
      top: auto;
      right: 1.5rem;
      bottom: 1.5rem;
      left: auto;
      width: clamp(220px, 20vw, 320px);
      height: auto;
      border-radius: 0.75rem;
      box-shadow: 0 12px 35px rgba(5, 12, 24, 0.35);
      border: 2px solid rgba(79, 195, 247, 0.25);
      z-index: 7;
      pointer-events: none;
      object-fit: cover;
      background: #000;
      opacity: 0;
      transition: opacity 0.4s ease;
    `;
    video.style.transformOrigin = 'center';
    return video;
  }

  async #optimizeTrackSettings(stream) {
    const [videoTrack] = stream?.getVideoTracks?.() ?? [];
    if (!videoTrack?.getCapabilities || !videoTrack?.applyConstraints) {
      this.#applyPresentationZoom(this.digitalZoomFallback);
      return;
    }

    const capabilities = videoTrack.getCapabilities();
    const advancedSettings = {};
    let usedOpticalZoom = false;

    if (Array.isArray(capabilities.focusMode)) {
      if (capabilities.focusMode.includes('continuous')) {
        advancedSettings.focusMode = 'continuous';
      } else if (capabilities.focusMode.includes('auto')) {
        advancedSettings.focusMode = 'auto';
      }
    }

    if (Array.isArray(capabilities.exposureMode) && capabilities.exposureMode.includes('continuous')) {
      advancedSettings.exposureMode = 'continuous';
    }

    if (Array.isArray(capabilities.whiteBalanceMode) && capabilities.whiteBalanceMode.includes('continuous')) {
      advancedSettings.whiteBalanceMode = 'continuous';
    }

    const { zoom } = capabilities;
    if (zoom && Number.isFinite(zoom.min) && Number.isFinite(zoom.max) && zoom.max > zoom.min) {
      const desired = zoom.max;
      if (Number.isFinite(desired)) {
        if (Number.isFinite(zoom.step) && zoom.step > 0) {
          const steps = Math.round((desired - zoom.min) / zoom.step);
          advancedSettings.zoom = Math.min(zoom.max, zoom.min + steps * zoom.step);
        } else {
          advancedSettings.zoom = desired;
        }
        usedOpticalZoom = true;
      }
    }

    if (!Object.keys(advancedSettings).length) {
      this.#applyPresentationZoom(this.digitalZoomFallback);
      return;
    }

    try {
      await videoTrack.applyConstraints({ advanced: [advancedSettings] });
      if (advancedSettings.zoom && videoTrack.getSettings) {
        const appliedZoom = Number(videoTrack.getSettings().zoom);
        if (Number.isFinite(appliedZoom) && appliedZoom < (zoom?.max ?? appliedZoom)) {
          usedOpticalZoom = false;
        }
      }
    } catch (error) {
      console.warn('CameraPreview: não foi possível aplicar ajustes avançados ao vídeo.', error);
      usedOpticalZoom = false;
    }

    if (!usedOpticalZoom) {
      this.#applyPresentationZoom(this.digitalZoomFallback);
    } else {
      this.#applyPresentationZoom(1.2);
    }
  }

  #applyPresentationZoom(multiplier = this.presentationZoom) {
    const scale = Number.isFinite(multiplier) ? Math.max(1, multiplier) : 1;
    this.presentationZoom = scale;
    if (!this.videoEl) {
      return;
    }
    this.videoEl.style.transform = `${this.baseTransform} scale(${scale})`;
    if (scale > 1.01) {
      this.videoEl.style.objectPosition = '50% 35%';
    } else {
      this.videoEl.style.objectPosition = 'center';
    }
  }

  #buildFilterString(filters) {
    const {
      brightness,
      contrast,
      saturation,
      blur,
      grayscale,
      invert
    } = filters;
    return `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) ` +
      `blur(${blur}px) grayscale(${grayscale}%) invert(${invert}%)`;
  }

  #startStatsLoop() {
    this.stats.startedAt = performance.now();
    this.stats.frames = 0;
    this.stats.fps = 0;
    this.stats.resolution = null;

    const update = () => {
      if (!this.isRunning) {
        return;
      }
      const videoWidth = this.videoEl.videoWidth;
      const videoHeight = this.videoEl.videoHeight;
      if (videoWidth && videoHeight) {
        this.stats.frames += 1;
        const elapsedSeconds = (performance.now() - this.stats.startedAt) / 1000;
        if (elapsedSeconds > 0) {
          this.stats.fps = this.stats.frames / elapsedSeconds;
        }
        this.stats.resolution = { width: videoWidth, height: videoHeight };
        if (this.overlayCanvas && this.canvasCtx) {
          this.overlayCanvas.width = videoWidth;
          this.overlayCanvas.height = videoHeight;
          this.canvasCtx.drawImage(this.videoEl, 0, 0, videoWidth, videoHeight);
        }
      }
      this.frameRequest = requestAnimationFrame(update);
    };

    this.frameRequest = requestAnimationFrame(update);

    if (!this.statsTimer) {
      this.statsTimer = setInterval(() => {
        if (!this.isRunning) {
          return;
        }
        this.onStatusChange({ type: 'stats', stats: this.getStats() });
      }, 2000);
    }

    requestAnimationFrame(() => {
      this.videoEl.style.opacity = '1';
    });
  }

  #stopStatsLoop() {
    if (this.frameRequest) {
      cancelAnimationFrame(this.frameRequest);
      this.frameRequest = null;
    }
    if (this.statsTimer) {
      clearInterval(this.statsTimer);
      this.statsTimer = null;
    }
    this.videoEl.style.opacity = '0';
  }
}

export default CameraPreview;
