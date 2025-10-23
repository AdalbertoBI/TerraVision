const FEATURE_SIZE = 3;
const OUTPUT_SIZE = 2;

function identityMatrix(size, value = 1) {
  const matrix = Array.from({ length: size }, () => Array(size).fill(0));
  for (let i = 0; i < size; i += 1) {
    matrix[i][i] = value;
  }
  return matrix;
}

function invert3x3(m) {
  const [a, b, c] = m;
  const det =
    a[0] * (b[1] * c[2] - b[2] * c[1]) -
    a[1] * (b[0] * c[2] - b[2] * c[0]) +
    a[2] * (b[0] * c[1] - b[1] * c[0]);

  if (Math.abs(det) < 1e-9) {
    return null;
  }

  const invDet = 1 / det;
  const inv = [
    [
      (b[1] * c[2] - b[2] * c[1]) * invDet,
      (a[2] * c[1] - a[1] * c[2]) * invDet,
      (a[1] * b[2] - a[2] * b[1]) * invDet
    ],
    [
      (b[2] * c[0] - b[0] * c[2]) * invDet,
      (a[0] * c[2] - a[2] * c[0]) * invDet,
      (a[2] * b[0] - a[0] * b[2]) * invDet
    ],
    [
      (b[0] * c[1] - b[1] * c[0]) * invDet,
      (a[1] * c[0] - a[0] * c[1]) * invDet,
      (a[0] * b[1] - a[1] * b[0]) * invDet
    ]
  ];
  return inv;
}

function multiplyMatrixVector(matrix, vector) {
  return matrix.map((row) => row.reduce((acc, value, index) => acc + value * vector[index], 0));
}

function multiplyMatrices(a, b) {
  const rows = a.length;
  const cols = b[0].length;
  const shared = b.length;
  const result = Array.from({ length: rows }, () => Array(cols).fill(0));
  for (let i = 0; i < rows; i += 1) {
    for (let k = 0; k < shared; k += 1) {
      const aik = a[i][k];
      if (aik === 0) {
        continue;
      }
      for (let j = 0; j < cols; j += 1) {
        result[i][j] += aik * b[k][j];
      }
    }
  }
  return result;
}

export class CalibrationModel {
  constructor({ regularization = 1e-3, decay = 0.995, minSamples = 6, historySize = 25 } = {}) {
    this.regularization = regularization;
    this.decay = decay;
    this.minSamples = minSamples;
    this.historySize = historySize;
    this.reset();
  }

  reset() {
    this.sampleCount = 0;
    this.XtX = identityMatrix(FEATURE_SIZE, this.regularization);
    this.XtY = Array.from({ length: FEATURE_SIZE }, () => Array(OUTPUT_SIZE).fill(0));
    this.weights = [
      [1, 0],
      [0, 1],
      [0, 0]
    ];
    this.errorHistory = [];
  }

  isReady() {
    return this.sampleCount >= this.minSamples;
  }

  update(rawPoint, targetPoint) {
    if (!rawPoint || !targetPoint) {
      return;
    }
    const features = [rawPoint.x, rawPoint.y, 1];
    if (!features.every((value) => Number.isFinite(value))) {
      return;
    }
    const target = [targetPoint.x, targetPoint.y];
    if (!target.every((value) => Number.isFinite(value))) {
      return;
    }

    // Apply exponential decay to accumulated matrices.
    for (let i = 0; i < FEATURE_SIZE; i += 1) {
      for (let j = 0; j < FEATURE_SIZE; j += 1) {
        this.XtX[i][j] *= this.decay;
      }
      for (let out = 0; out < OUTPUT_SIZE; out += 1) {
        this.XtY[i][out] *= this.decay;
      }
    }

    // Update XtX and XtY with new sample.
    for (let i = 0; i < FEATURE_SIZE; i += 1) {
      for (let j = 0; j < FEATURE_SIZE; j += 1) {
        this.XtX[i][j] += features[i] * features[j];
      }
      for (let out = 0; out < OUTPUT_SIZE; out += 1) {
        this.XtY[i][out] += features[i] * target[out];
      }
    }

    const regularized = this.XtX.map((row, rowIndex) =>
      row.map((value, colIndex) => (rowIndex === colIndex ? value + this.regularization : value))
    );

    const inverse = invert3x3(regularized);
    if (!inverse) {
      console.warn('CalibrationModel: matriz singular, mantendo pesos anteriores.');
      return;
    }

    this.weights = multiplyMatrices(inverse, this.XtY);
    this.sampleCount += 1;

    const prediction = this.predict(rawPoint);
    const errorX = prediction.x - targetPoint.x;
    const errorY = prediction.y - targetPoint.y;
    const distance = Math.hypot(errorX, errorY);
    this.#pushError(distance);
  }

  predict(rawPoint) {
    if (!rawPoint) {
      return { x: 0, y: 0 };
    }
    const features = [rawPoint.x, rawPoint.y, 1];
    const output = multiplyMatrixVector(this.weights, features);
    return {
      x: output[0],
      y: output[1]
    };
  }

  errorEstimate() {
    if (!this.errorHistory.length) {
      return 0;
    }
    const sumSquares = this.errorHistory.reduce((acc, value) => acc + value * value, 0);
    return Math.sqrt(sumSquares / this.errorHistory.length);
  }

  #pushError(value) {
    if (!Number.isFinite(value)) {
      return;
    }
    this.errorHistory.push(value);
    if (this.errorHistory.length > this.historySize) {
      this.errorHistory.shift();
    }
  }

  serialize() {
    return JSON.stringify({
      regularization: this.regularization,
      decay: this.decay,
      minSamples: this.minSamples,
      sampleCount: this.sampleCount,
      XtX: this.XtX,
      XtY: this.XtY,
      weights: this.weights,
      errorHistory: this.errorHistory
    });
  }

  static deserialize(serialized, fallbackParams = {}) {
    if (!serialized) {
      return new CalibrationModel(fallbackParams);
    }
    try {
      const parsed = typeof serialized === 'string' ? JSON.parse(serialized) : serialized;
      const model = new CalibrationModel({
        regularization: parsed.regularization ?? fallbackParams.regularization,
        decay: parsed.decay ?? fallbackParams.decay,
        minSamples: parsed.minSamples ?? fallbackParams.minSamples,
        historySize: parsed.historySize ?? fallbackParams.historySize
      });
      model.sampleCount = parsed.sampleCount ?? 0;
      model.XtX = parsed.XtX ?? identityMatrix(FEATURE_SIZE, model.regularization);
      model.XtY = parsed.XtY ?? Array.from({ length: FEATURE_SIZE }, () => Array(OUTPUT_SIZE).fill(0));
      model.weights = parsed.weights ?? model.weights;
      model.errorHistory = parsed.errorHistory ?? [];
      return model;
    } catch (error) {
      console.warn('CalibrationModel.deserialize falhou, usando novo modelo.', error);
      return new CalibrationModel(fallbackParams);
    }
  }
}

export default CalibrationModel;
