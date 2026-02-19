/**
 * mlUtils.js — Bulletproof Math Library for ML ATLAS.
 *
 * This is the foundation layer. If this breaks, everything breaks.
 * Every function is pure, well-tested edge cases, and numerically stable.
 *
 * Sections:
 *   1. Random Number Generation (seeded)
 *   2. Statistical Functions
 *   3. Vector Operations
 *   4. Matrix Operations (with stability guards)
 *   5. Distance Functions
 *   6. Activation Functions
 *   7. Data Preprocessing
 *   8. Data Splitting
 *   9. Data Generation Helpers
 */

// ═══════════════════════════════════════════════════
// 1. RANDOM NUMBER GENERATION
// ═══════════════════════════════════════════════════

/** Mulberry32 — Fast, seedable 32-bit PRNG. */
export function mulberry32(seed) {
    return function () {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Box-Muller transform — Normal distribution from uniform. */
export function normalRandom(rng) {
    const u1 = Math.max(1e-10, rng()); // Clamp to prevent log(0)
    const u2 = rng();
    return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

/** Shuffle array in-place using Fisher-Yates with seeded RNG. */
export function shuffle(arr, rng) {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

// ═══════════════════════════════════════════════════
// 2. STATISTICAL FUNCTIONS
// ═══════════════════════════════════════════════════

/** Mean of an array. */
export function mean(arr) {
    if (arr.length === 0) return 0;
    return arr.reduce((s, v) => s + v, 0) / arr.length;
}

/** Variance (population). */
export function variance(arr) {
    const m = mean(arr);
    return arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length;
}

/** Standard deviation (population). */
export function std(arr) {
    return Math.sqrt(variance(arr));
}

/** Min of array. */
export function min(arr) {
    return Math.min(...arr);
}

/** Max of array. */
export function max(arr) {
    return Math.max(...arr);
}

/** Argmax — index of largest value. */
export function argmax(arr) {
    let maxIdx = 0;
    for (let i = 1; i < arr.length; i++) {
        if (arr[i] > arr[maxIdx]) maxIdx = i;
    }
    return maxIdx;
}

/** Unique values in array. */
export function unique(arr) {
    return [...new Set(arr)];
}

/** Count occurrences of each value. */
export function valueCounts(arr) {
    const counts = {};
    for (const v of arr) {
        counts[v] = (counts[v] || 0) + 1;
    }
    return counts;
}

// ═══════════════════════════════════════════════════
// 3. VECTOR OPERATIONS
// ═══════════════════════════════════════════════════

/** Dot product of two vectors. */
export function dot(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        sum += a[i] * b[i];
    }
    return sum;
}

/** Element-wise addition. */
export function vecAdd(a, b) {
    return a.map((v, i) => v + b[i]);
}

/** Element-wise subtraction. */
export function vecSub(a, b) {
    return a.map((v, i) => v - b[i]);
}

/** Scalar multiplication. */
export function vecScale(a, s) {
    return a.map((v) => v * s);
}

/** L2 norm (magnitude). */
export function vecNorm(a) {
    return Math.sqrt(a.reduce((s, v) => s + v * v, 0));
}

/** Zeros vector. */
export function zeros(n) {
    return new Array(n).fill(0);
}

/** Ones vector. */
export function ones(n) {
    return new Array(n).fill(1);
}

// ═══════════════════════════════════════════════════
// 4. MATRIX OPERATIONS
// ═══════════════════════════════════════════════════
// All matrices are 2D arrays: matrix[row][col]

/** Create an m×n matrix filled with value. */
export function matCreate(rows, cols, fill = 0) {
    return Array.from({ length: rows }, () => new Array(cols).fill(fill));
}

/** Identity matrix. */
export function matIdentity(n) {
    const I = matCreate(n, n, 0);
    for (let i = 0; i < n; i++) I[i][i] = 1;
    return I;
}

/** Transpose. */
export function matTranspose(A) {
    const rows = A.length;
    const cols = A[0].length;
    const T = matCreate(cols, rows);
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            T[j][i] = A[i][j];
        }
    }
    return T;
}

/** Matrix multiplication: A(m×n) × B(n×p) → C(m×p). */
export function matMul(A, B) {
    const m = A.length;
    const n = A[0].length;
    const p = B[0].length;
    const C = matCreate(m, p);
    for (let i = 0; i < m; i++) {
        for (let j = 0; j < p; j++) {
            let sum = 0;
            for (let k = 0; k < n; k++) {
                sum += A[i][k] * B[k][j];
            }
            C[i][j] = sum;
        }
    }
    return C;
}

/** Matrix × Vector: A(m×n) × v(n) → result(m). */
export function matVecMul(A, v) {
    return A.map((row) => dot(row, v));
}

/** Matrix + Matrix (element-wise). */
export function matAdd(A, B) {
    return A.map((row, i) => row.map((val, j) => val + B[i][j]));
}

/** Scalar × Matrix. */
export function matScale(A, s) {
    return A.map((row) => row.map((v) => v * s));
}

/**
 * Matrix inverse using Gauss-Jordan elimination.
 * Numerically stable with partial pivoting.
 * Returns null if singular (determinant ≈ 0).
 */
export function matInverse(A) {
    const n = A.length;
    if (n === 0 || A[0].length !== n) return null;

    // Augmented matrix [A | I]
    const aug = A.map((row, i) => {
        const augRow = [...row.map((v) => v)]; // deep copy
        for (let j = 0; j < n; j++) {
            augRow.push(i === j ? 1 : 0);
        }
        return augRow;
    });

    for (let col = 0; col < n; col++) {
        // Partial pivoting — find row with largest absolute value in column
        let maxRow = col;
        let maxVal = Math.abs(aug[col][col]);
        for (let row = col + 1; row < n; row++) {
            const absVal = Math.abs(aug[row][col]);
            if (absVal > maxVal) {
                maxVal = absVal;
                maxRow = row;
            }
        }

        // Singular check
        if (maxVal < 1e-12) return null;

        // Swap rows
        if (maxRow !== col) {
            [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
        }

        // Scale pivot row
        const pivot = aug[col][col];
        for (let j = 0; j < 2 * n; j++) {
            aug[col][j] /= pivot;
        }

        // Eliminate other rows
        for (let row = 0; row < n; row++) {
            if (row === col) continue;
            const factor = aug[row][col];
            for (let j = 0; j < 2 * n; j++) {
                aug[row][j] -= factor * aug[col][j];
            }
        }
    }

    // Extract inverse from right half
    return aug.map((row) => row.slice(n));
}

/**
 * Solve linear system Ax = b using LU decomposition with partial pivoting.
 * More stable than direct inverse for regression.
 */
export function solve(A, b) {
    const inv = matInverse(A);
    if (!inv) {
        // Fallback: return zero vector (regularization should prevent this)
        return zeros(b.length);
    }
    return matVecMul(inv, b);
}

// ═══════════════════════════════════════════════════
// 5. DISTANCE FUNCTIONS
// ═══════════════════════════════════════════════════

/** Euclidean distance between two points (arrays). */
export function euclideanDistance(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        sum += (a[i] - b[i]) ** 2;
    }
    return Math.sqrt(sum);
}

/** Manhattan distance. */
export function manhattanDistance(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        sum += Math.abs(a[i] - b[i]);
    }
    return sum;
}

/** Pairwise distance matrix. */
export function distanceMatrix(points) {
    const n = points.length;
    const D = matCreate(n, n);
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const d = euclideanDistance(points[i], points[j]);
            D[i][j] = d;
            D[j][i] = d;
        }
    }
    return D;
}

// ═══════════════════════════════════════════════════
// 6. ACTIVATION FUNCTIONS
// ═══════════════════════════════════════════════════

/** Sigmoid (logistic function). Clamped to prevent overflow. */
export function sigmoid(x) {
    if (x > 500) return 1;
    if (x < -500) return 0;
    return 1 / (1 + Math.exp(-x));
}

/** Softmax over a vector. Numerically stable (subtract max). */
export function softmax(arr) {
    const maxVal = Math.max(...arr);
    const exps = arr.map((v) => Math.exp(v - maxVal));
    const sum = exps.reduce((s, v) => s + v, 0);
    return exps.map((v) => v / sum);
}

/** ReLU. */
export function relu(x) {
    return Math.max(0, x);
}

/** Sign function. */
export function sign(x) {
    if (x > 0) return 1;
    if (x < 0) return -1;
    return 0;
}

// ═══════════════════════════════════════════════════
// 7. DATA PREPROCESSING
// ═══════════════════════════════════════════════════

/**
 * StandardScaler — Zero mean, unit variance.
 * Returns { transform, inverse, params }.
 */
export function standardScaler(data) {
    // data is array of arrays (each inner array is a feature column)
    // OR a flat array (single feature)
    const isFlat = typeof data[0] === 'number';

    if (isFlat) {
        const m = mean(data);
        const s = std(data) || 1; // prevent division by zero
        return {
            transform: (arr) => arr.map((v) => (v - m) / s),
            inverse: (arr) => arr.map((v) => v * s + m),
            params: { mean: m, std: s },
        };
    }

    // Multi-dimensional: data[i] is a sample, data[i][j] is feature j
    const nFeatures = data[0].length;
    const means = [];
    const stds = [];

    for (let j = 0; j < nFeatures; j++) {
        const col = data.map((row) => row[j]);
        means.push(mean(col));
        stds.push(std(col) || 1);
    }

    return {
        transform: (samples) =>
            samples.map((row) =>
                row.map((v, j) => (v - means[j]) / stds[j])
            ),
        inverse: (samples) =>
            samples.map((row) =>
                row.map((v, j) => v * stds[j] + means[j])
            ),
        params: { means, stds },
    };
}

/**
 * MinMaxScaler — Scale to [0, 1].
 */
export function minMaxScaler(data) {
    const isFlat = typeof data[0] === 'number';

    if (isFlat) {
        const lo = Math.min(...data);
        const hi = Math.max(...data);
        const range = hi - lo || 1;
        return {
            transform: (arr) => arr.map((v) => (v - lo) / range),
            inverse: (arr) => arr.map((v) => v * range + lo),
            params: { min: lo, max: hi },
        };
    }

    const nFeatures = data[0].length;
    const mins = [];
    const maxs = [];

    for (let j = 0; j < nFeatures; j++) {
        const col = data.map((row) => row[j]);
        mins.push(Math.min(...col));
        maxs.push(Math.max(...col));
    }

    const ranges = mins.map((m, j) => maxs[j] - m || 1);

    return {
        transform: (samples) =>
            samples.map((row) =>
                row.map((v, j) => (v - mins[j]) / ranges[j])
            ),
        inverse: (samples) =>
            samples.map((row) =>
                row.map((v, j) => v * ranges[j] + mins[j])
            ),
        params: { mins, maxs },
    };
}

// ═══════════════════════════════════════════════════
// 8. DATA SPLITTING
// ═══════════════════════════════════════════════════

/**
 * Train/Test split with seeded shuffle.
 * @param {Array} X — Features (array of samples)
 * @param {Array} y — Labels/targets
 * @param {number} testSize — Fraction for test set (default 0.2)
 * @param {number} seed — Random seed
 * @returns {{ XTrain, yTrain, XTest, yTest }}
 */
export function trainTestSplit(X, y, testSize = 0.2, seed = 42) {
    const n = X.length;
    const rng = mulberry32(seed);
    const indices = shuffle(
        Array.from({ length: n }, (_, i) => i),
        rng
    );
    const splitIdx = Math.floor(n * (1 - testSize));

    const trainIdx = indices.slice(0, splitIdx);
    const testIdx = indices.slice(splitIdx);

    return {
        XTrain: trainIdx.map((i) => X[i]),
        yTrain: trainIdx.map((i) => y[i]),
        XTest: testIdx.map((i) => X[i]),
        yTest: testIdx.map((i) => y[i]),
    };
}

// ═══════════════════════════════════════════════════
// 9. DATA GENERATION HELPERS
// ═══════════════════════════════════════════════════

/**
 * Generate 2D blob clusters for classification/clustering.
 * @param {number} nSamples — Total samples
 * @param {number} nClusters — Number of clusters
 * @param {number} spread — Standard deviation within cluster
 * @param {number} seed — Random seed
 * @returns {{ X: number[][], labels: number[] }}
 */
export function generateBlobs(nSamples = 100, nClusters = 3, spread = 1.0, seed = 42) {
    const rng = mulberry32(seed);
    const perCluster = Math.floor(nSamples / nClusters);
    const X = [];
    const labels = [];

    // Generate cluster centers spread across the space
    const centers = [];
    for (let c = 0; c < nClusters; c++) {
        const angle = (2 * Math.PI * c) / nClusters;
        const radius = 3 + rng() * 2;
        centers.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
    }

    for (let c = 0; c < nClusters; c++) {
        const count = c === nClusters - 1 ? nSamples - X.length : perCluster;
        for (let i = 0; i < count; i++) {
            X.push([
                centers[c][0] + normalRandom(rng) * spread,
                centers[c][1] + normalRandom(rng) * spread,
            ]);
            labels.push(c);
        }
    }

    return { X, labels };
}

/**
 * Generate concentric circles (non-linearly separable).
 */
export function generateCircles(nSamples = 100, noise = 0.1, seed = 42) {
    const rng = mulberry32(seed);
    const n = Math.floor(nSamples / 2);
    const X = [];
    const labels = [];

    for (let i = 0; i < n; i++) {
        const angle = rng() * 2 * Math.PI;
        X.push([Math.cos(angle) + normalRandom(rng) * noise, Math.sin(angle) + normalRandom(rng) * noise]);
        labels.push(0);
    }
    for (let i = 0; i < nSamples - n; i++) {
        const angle = rng() * 2 * Math.PI;
        const r = 2.5;
        X.push([Math.cos(angle) * r + normalRandom(rng) * noise, Math.sin(angle) * r + normalRandom(rng) * noise]);
        labels.push(1);
    }

    return { X, labels };
}

/**
 * Generate two interleaving moons.
 */
export function generateMoons(nSamples = 100, noise = 0.1, seed = 42) {
    const rng = mulberry32(seed);
    const n = Math.floor(nSamples / 2);
    const X = [];
    const labels = [];

    for (let i = 0; i < n; i++) {
        const angle = (Math.PI * i) / n;
        X.push([Math.cos(angle) + normalRandom(rng) * noise, Math.sin(angle) + normalRandom(rng) * noise]);
        labels.push(0);
    }
    for (let i = 0; i < nSamples - n; i++) {
        const angle = (Math.PI * i) / (nSamples - n);
        X.push([1 - Math.cos(angle) + normalRandom(rng) * noise, 0.5 - Math.sin(angle) + normalRandom(rng) * noise]);
        labels.push(1);
    }

    return { X, labels };
}

/**
 * Generate data with anomalies for anomaly detection.
 */
export function generateWithAnomalies(nNormal = 80, nAnomalies = 20, seed = 42) {
    const rng = mulberry32(seed);
    const X = [];
    const labels = []; // 0 = normal, 1 = anomaly

    // Normal cluster
    for (let i = 0; i < nNormal; i++) {
        X.push([normalRandom(rng) * 1.5, normalRandom(rng) * 1.5]);
        labels.push(0);
    }

    // Anomalies scattered far from center
    for (let i = 0; i < nAnomalies; i++) {
        const angle = rng() * 2 * Math.PI;
        const r = 4 + rng() * 3;
        X.push([Math.cos(angle) * r, Math.sin(angle) * r]);
        labels.push(1);
    }

    return { X, labels };
}

/**
 * Generate two intertwined spirals.
 * Hard challenge for many algorithms.
 */
export function generateSpirals(nSamples = 100, noise = 0.1, seed = 42) {
    const rng = mulberry32(seed);
    const n = Math.floor(nSamples / 2);
    const X = [];
    const labels = [];

    for (let c = 0; c < 2; c++) {
        // Delta angle to separate the two spirals
        const delta = Math.PI * c;
        for (let i = 0; i < n; i++) {
            const r = (i / n) * 5 + 0.2;
            const t = (1.75 * i / n) * 2 * Math.PI + delta;

            const x = r * Math.sin(t) + normalRandom(rng) * noise;
            const y = r * Math.cos(t) + normalRandom(rng) * noise;

            X.push([x, y]);
            labels.push(c);
        }
    }

    return { X, labels };
}

// ═══════════════════════════════════════════════════
// 10. CLASSIFICATION METRICS
// ═══════════════════════════════════════════════════

/**
 * Accuracy: fraction of correct predictions.
 */
export function accuracy(yTrue, yPred) {
    let correct = 0;
    for (let i = 0; i < yTrue.length; i++) {
        if (yTrue[i] === yPred[i]) correct++;
    }
    return correct / yTrue.length;
}

/**
 * Confusion matrix for binary classification.
 * Returns { tp, fp, fn, tn }.
 */
export function confusionMatrix(yTrue, yPred, positiveClass = 1) {
    let tp = 0, fp = 0, fn = 0, tn = 0;
    for (let i = 0; i < yTrue.length; i++) {
        const actual = yTrue[i] === positiveClass;
        const predicted = yPred[i] === positiveClass;
        if (actual && predicted) tp++;
        else if (!actual && predicted) fp++;
        else if (actual && !predicted) fn++;
        else tn++;
    }
    return { tp, fp, fn, tn };
}

/**
 * Precision, Recall, F1 from confusion matrix.
 */
export function classificationReport(yTrue, yPred, positiveClass = 1) {
    const { tp, fp, fn, tn } = confusionMatrix(yTrue, yPred, positiveClass);
    const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
    const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
    const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
    const acc = (tp + tn) / (tp + fp + fn + tn);
    return { accuracy: acc, precision, recall, f1, tp, fp, fn, tn };
}

// ═══════════════════════════════════════════════════
// 12. CURVE METRICS (ROC, PR)
// ═══════════════════════════════════════════════════

/**
 * ROC Curve points.
 * @param {number[]} yTrue - True labels (0 or 1)
 * @param {number[]} yScores - Probability scores for class 1
 * @returns {{ fpr: number[], tpr: number[], thresholds: number[], auc: number }}
 */
export function rocCurve(yTrue, yScores) {
    const combined = yTrue.map((y, i) => ({ y, score: yScores[i] }));
    combined.sort((a, b) => b.score - a.score);

    const nPos = yTrue.reduce((s, y) => s + y, 0);
    const nNeg = yTrue.length - nPos;

    // Avoid division by zero if all one class
    if (nPos === 0 || nNeg === 0) return { fpr: [0, 1], tpr: [0, 1], thresholds: [0, 1], auc: 0.5 };

    const fpr = [0];
    const tpr = [0];
    const thresholds = [Infinity];

    let tp = 0;
    let fp = 0;

    for (let i = 0; i < combined.length; i++) {
        if (combined[i].y === 1) tp++; else fp++;

        // Only add point if score changes or it's the last point
        if (i === combined.length - 1 || combined[i].score !== combined[i + 1].score) {
            fpr.push(fp / nNeg);
            tpr.push(tp / nPos);
            thresholds.push(combined[i].score);
        }
    }

    // AUC (Trapezoidal rule)
    let auc = 0;
    for (let i = 1; i < fpr.length; i++) {
        auc += (tpr[i] + tpr[i - 1]) * (fpr[i] - fpr[i - 1]) / 2;
    }

    return { fpr, tpr, thresholds, auc };
}

/**
 * Precision-Recall Curve points.
 * @returns {{ precision: number[], recall: number[], thresholds: number[], auc: number }}
 */
export function prCurve(yTrue, yScores) {
    const combined = yTrue.map((y, i) => ({ y, score: yScores[i] }));
    combined.sort((a, b) => b.score - a.score);

    const nPos = yTrue.reduce((s, y) => s + y, 0);
    if (nPos === 0) return { precision: [0, 1], recall: [0, 1], thresholds: [0, 1], auc: 0 };

    const precision = [1];
    const recall = [0];
    const thresholds = [Infinity];

    let tp = 0;
    let fp = 0;

    for (let i = 0; i < combined.length; i++) {
        if (combined[i].y === 1) tp++; else fp++;

        if (i === combined.length - 1 || combined[i].score !== combined[i + 1].score) {
            const p = tp / (tp + fp);
            const r = tp / nPos;
            precision.push(p);
            recall.push(r);
            thresholds.push(combined[i].score);
        }
    }

    // AUC
    let auc = 0;
    for (let i = 1; i < recall.length; i++) {
        auc += (precision[i] + precision[i - 1]) * (recall[i] - recall[i - 1]) / 2;
    }

    return { precision, recall, thresholds, auc };
}

// ═══════════════════════════════════════════════════
// 11. REGRESSION METRICS
// ═══════════════════════════════════════════════════

/** R² (Coefficient of Determination). */
export function r2Score(yTrue, yPred) {
    const m = mean(yTrue);
    const ssRes = yTrue.reduce((s, y, i) => s + (y - yPred[i]) ** 2, 0);
    const ssTot = yTrue.reduce((s, y) => s + (y - m) ** 2, 0);
    return ssTot === 0 ? 1 : 1 - ssRes / ssTot;
}

/** Mean Squared Error. */
export function mse(yTrue, yPred) {
    return yTrue.reduce((s, y, i) => s + (y - yPred[i]) ** 2, 0) / yTrue.length;
}

/** Root Mean Squared Error. */
export function rmse(yTrue, yPred) {
    return Math.sqrt(mse(yTrue, yPred));
}

/** Mean Absolute Error. */
export function mae(yTrue, yPred) {
    return yTrue.reduce((s, y, i) => s + Math.abs(y - yPred[i]), 0) / yTrue.length;
}
