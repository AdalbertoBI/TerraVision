import { APP_CONFIG } from './config.js';

const LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380];
const LEFT_IRIS_INDICES = [468, 469, 470, 471];
const RIGHT_IRIS_INDICES = [473, 474, 475, 476];

const DEFAULT_OPTIONS = {
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
};

export class FaceMeshProcessor {
  constructor({
    videoElement,
    maxFps = 30,
    onMetrics,
    onError
  } = {}) {
    this.videoElement = videoElement ?? null;
    this.maxFps = maxFps;
    this.onMetrics = onMetrics ?? null;
    this.onError = onError ?? ((error) => console.warn('[FaceMesh]', error));

    this.faceMesh = null;
    this.options = { ...DEFAULT_OPTIONS };
    this.listeners = new Set();
    this.active = false;
    this.processing = false;
    this.initialized = false;
    this.lastFrameTs = 0;
  }

  setVideoElement(element) {
    this.videoElement = element ?? null;
  }

  setOptions(options) {
    this.options = { ...DEFAULT_OPTIONS, ...(options ?? {}) };
    if (this.faceMesh) {
      this.faceMesh.setOptions(this.options);
    }
  }

  subscribe(listener) {
    if (typeof listener !== 'function') {
      return () => {};
    }
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async init() {
    if (this.initialized) {
      return true;
    }
    if (!window.FaceMesh) {
      throw new Error('MediaPipe FaceMesh não está disponível na janela global.');
    }

    this.faceMesh = new window.FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });
    this.faceMesh.setOptions(this.options);
    this.faceMesh.onResults((results) => this.handleResults(results));

    this.initialized = true;
    return true;
  }

  async start() {
    if (!this.initialized) {
      await this.init();
    }
    if (this.active) {
      return true;
    }
    this.active = true;
    this.scheduleNextFrame();
    return true;
  }

  stop() {
    this.active = false;
  }

  scheduleNextFrame() {
    if (!this.active) {
      return;
    }

    requestAnimationFrame(async () => {
      if (!this.active) {
        return;
      }
      if (!this.videoElement || this.videoElement.readyState < 2) {
        this.scheduleNextFrame();
        return;
      }
      const now = performance.now();
      if (this.processing || (this.maxFps > 0 && now - this.lastFrameTs < 1000 / this.maxFps)) {
        this.scheduleNextFrame();
        return;
      }

      this.processing = true;
      try {
        await this.faceMesh.send({ image: this.getVideoFrame() });
        this.lastFrameTs = now;
      } catch (error) {
        this.onError?.(error);
      } finally {
        this.processing = false;
        this.scheduleNextFrame();
      }
    });
  }

  getVideoFrame() {
    if (this.videoElement?.captureStream && typeof OffscreenCanvas !== 'undefined') {
      // Some browsers require a canvas frame; fall back to the element itself otherwise.
      return this.videoElement;
    }
    return this.videoElement;
  }

  handleResults(results) {
    const landmarks = results?.multiFaceLandmarks?.[0];
    if (!landmarks || !landmarks.length) {
      return;
    }

    const leftEar = this.computeEar(landmarks, LEFT_EYE_INDICES);
    const rightEar = this.computeEar(landmarks, RIGHT_EYE_INDICES);
    const ear = (leftEar + rightEar) / 2;

    const leftIris = this.averagePoint(landmarks, LEFT_IRIS_INDICES);
    const rightIris = this.averagePoint(landmarks, RIGHT_IRIS_INDICES);
    const gazePoint = this.averagePointFromCoords(leftIris, rightIris);

    const metrics = {
      timestamp: performance.now(),
      ear,
      leftEar,
      rightEar,
      irisLeft: leftIris,
      irisRight: rightIris,
      gaze: gazePoint,
      faceGeometry: results?.multiFaceGeometry?.[0] ?? null
    };

    if (this.onMetrics) {
      this.onMetrics(metrics);
    }
    this.listeners.forEach((listener) => {
      try {
        listener(metrics);
      } catch (error) {
        this.onError?.(error);
      }
    });
  }

  computeEar(landmarks, indices) {
    const points = indices.map((index) => landmarks[index]);
    if (points.some((p) => !p)) {
      return APP_CONFIG.blinkThreshold + 0.1;
    }

    const vertical1 = this.distance2d(points[1], points[5]);
    const vertical2 = this.distance2d(points[2], points[4]);
    const horizontal = this.distance2d(points[0], points[3]);

    if (!horizontal) {
      return APP_CONFIG.blinkThreshold + 0.1;
    }
    return (vertical1 + vertical2) / (2 * horizontal);
  }

  averagePoint(landmarks, indices) {
    const points = indices
      .map((index) => landmarks[index])
      .filter(Boolean);

    if (!points.length) {
      return null;
    }

    const sum = points.reduce(
      (acc, point) => {
        acc.x += point.x;
        acc.y += point.y;
        acc.z += point.z ?? 0;
        return acc;
      },
      { x: 0, y: 0, z: 0 }
    );

    return {
      x: sum.x / points.length,
      y: sum.y / points.length,
      z: sum.z / points.length
    };
  }

  averagePointFromCoords(left, right) {
    if (!left && !right) {
      return null;
    }
    if (left && right) {
      return {
        x: (left.x + right.x) / 2,
        y: (left.y + right.y) / 2,
        z: (left.z + right.z) / 2
      };
    }
    return left ?? right;
  }

  distance2d(a, b) {
    if (!a || !b) {
      return 0;
    }
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.hypot(dx, dy);
  }
}
