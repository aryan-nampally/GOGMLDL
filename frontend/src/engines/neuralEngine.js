/**
 * Neural Network Engine — from-scratch forward/backprop for teaching.
 *
 * Architecture: Configurable layers (input → hidden(s) → output).
 * Activations: ReLU / Sigmoid / Tanh.
 * Loss: MSE (regression) / Cross-Entropy (classification).
 *
 * The engine records every forward+backward pass so the UI can
 * replay the learning process step-by-step.
 */
import { createEngine } from './baseEngine';
import {
    mulberry32, normalRandom,
    generateBlobs, generateMoons, generateCircles,
    accuracy,
} from './mlUtils';

// ── Activation functions ──

function relu(x) { return Math.max(0, x); }
function reluDeriv(x) { return x > 0 ? 1 : 0; }

function sigmoidFn(x) { return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x)))); }
function sigmoidDeriv(x) { const s = sigmoidFn(x); return s * (1 - s); }

function tanhFn(x) { return Math.tanh(x); }
function tanhDeriv(x) { const t = Math.tanh(x); return 1 - t * t; }

const ACTIVATIONS = {
    relu: { fn: relu, deriv: reluDeriv },
    sigmoid: { fn: sigmoidFn, deriv: sigmoidDeriv },
    tanh: { fn: tanhFn, deriv: tanhDeriv },
};

// ── Matrix utilities ──

function zeros(rows, cols) {
    return Array.from({ length: rows }, () => new Float64Array(cols));
}

function heInit(rows, cols, rng) {
    const scale = Math.sqrt(2.0 / rows);
    return Array.from({ length: rows }, () =>
        Float64Array.from({ length: cols }, () => normalRandom(rng) * scale)
    );
}

// ── Data Generation ──

function generateData(config = {}) {
    const {
        nSamples = 120,
        dataShape = 'moons',  // 'moons' | 'circles' | 'blobs' | 'xor'
        spread = 1.0,
        seed = 42,
    } = config;

    if (dataShape === 'xor') {
        const rng = mulberry32(seed);
        const X = [];
        const y = [];
        for (let i = 0; i < nSamples; i++) {
            const x1 = rng() > 0.5 ? 1 : 0;
            const x2 = rng() > 0.5 ? 1 : 0;
            X.push([
                x1 + normalRandom(rng) * spread * 0.15,
                x2 + normalRandom(rng) * spread * 0.15,
            ]);
            y.push(x1 ^ x2);
        }
        return { X, y };
    }

    let result;
    switch (dataShape) {
        case 'circles':
            result = generateCircles(nSamples, spread * 0.15, seed);
            break;
        case 'blobs':
            result = generateBlobs(nSamples, 2, spread, seed);
            break;
        case 'moons':
        default:
            result = generateMoons(nSamples, spread * 0.15, seed);
            break;
    }
    return { X: result.X, y: result.labels };
}

// ── Forward Pass (single sample) ──

function forwardSample(x, weights, biases, act) {
    const L = weights.length;
    const preActs = [];  // z values per-layer (for backprop)
    const postActs = [x]; // a values per-layer

    let a = x;
    for (let l = 0; l < L; l++) {
        const W = weights[l];
        const b = biases[l];
        const outSize = W[0].length;
        const z = new Float64Array(outSize);
        for (let j = 0; j < outSize; j++) {
            let sum = b[j];
            for (let i = 0; i < a.length; i++) {
                sum += a[i] * W[i][j];
            }
            z[j] = sum;
        }
        preActs.push(z);

        // Last layer uses sigmoid for binary classification
        const isLast = l === L - 1;
        const activation = isLast ? sigmoidFn : act.fn;
        const aNext = Float64Array.from(z, v => activation(v));
        postActs.push(aNext);
        a = aNext;
    }

    return { preActs, postActs, output: a };
}

// ── Backpropagation ──

function backpropSample(preActs, postActs, target, weights, act) {
    const L = weights.length;
    const dW = weights.map(W => zeros(W.length, W[0].length));
    const dB = weights.map(W => new Float64Array(W[0].length));

    // Output layer (sigmoid + binary cross-entropy → dz = a - y)
    const aOut = postActs[L];
    const t = Array.isArray(target) ? target : [target];
    let delta = Float64Array.from(aOut, (a, i) => a - (t[i] || 0));

    for (let l = L - 1; l >= 0; l--) {
        const aPrev = postActs[l];
        // Accumulate gradients
        for (let j = 0; j < delta.length; j++) {
            dB[l][j] += delta[j];
            for (let i = 0; i < aPrev.length; i++) {
                dW[l][i][j] += delta[j] * aPrev[i];
            }
        }
        // Propagate to previous layer (skip for input layer)
        if (l > 0) {
            const W = weights[l];
            const z = preActs[l]; // pre-activation of current hidden layer
            const newDelta = new Float64Array(W.length);
            for (let i = 0; i < W.length; i++) {
                let sum = 0;
                for (let j = 0; j < delta.length; j++) {
                    sum += W[i][j] * delta[j];
                }
                newDelta[i] = sum * act.deriv(z[i]);
            }
            delta = newDelta;
        }
    }

    return { dW, dB };
}

// ── Training ──

function trainModel(X, y, config = {}) {
    const {
        hiddenLayers = [8, 6],
        activation = 'relu',
        learningRate = 0.05,
        epochs = 80,
        seed = 42,
    } = config;

    const rng = mulberry32(seed);
    const act = ACTIVATIONS[activation] || ACTIVATIONS.relu;
    const inputDim = X[0].length;
    const layerSizes = [inputDim, ...hiddenLayers, 1]; // binary output

    // Initialize weights
    const weights = [];
    const biases = [];
    for (let l = 0; l < layerSizes.length - 1; l++) {
        weights.push(heInit(layerSizes[l], layerSizes[l + 1], rng));
        biases.push(new Float64Array(layerSizes[l + 1]));
    }

    const n = X.length;
    const history = []; // { epoch, loss, acc }

    for (let ep = 0; ep < epochs; ep++) {
        let totalLoss = 0;
        const totalDW = weights.map(W => zeros(W.length, W[0].length));
        const totalDB = weights.map(W => new Float64Array(W[0].length));

        for (let i = 0; i < n; i++) {
            const { preActs, postActs, output } = forwardSample(X[i], weights, biases, act);

            // Binary cross-entropy loss
            const p = Math.max(1e-10, Math.min(1 - 1e-10, output[0]));
            const t = y[i];
            totalLoss += -(t * Math.log(p) + (1 - t) * Math.log(1 - p));

            // Backprop
            const { dW, dB } = backpropSample(preActs, postActs, [t], weights, act);
            for (let l = 0; l < weights.length; l++) {
                for (let r = 0; r < dW[l].length; r++) {
                    for (let c = 0; c < dW[l][r].length; c++) {
                        totalDW[l][r][c] += dW[l][r][c];
                    }
                }
                for (let j = 0; j < dB[l].length; j++) {
                    totalDB[l][j] += dB[l][j];
                }
            }
        }

        // Update weights (batch gradient descent)
        const lr = learningRate;
        for (let l = 0; l < weights.length; l++) {
            for (let r = 0; r < weights[l].length; r++) {
                for (let c = 0; c < weights[l][r].length; c++) {
                    weights[l][r][c] -= lr * totalDW[l][r][c] / n;
                }
            }
            for (let j = 0; j < biases[l].length; j++) {
                biases[l][j] -= lr * totalDB[l][j] / n;
            }
        }

        // Record history (every epoch for smooth plotting)
        const avgLoss = totalLoss / n;
        const preds = X.map(x => forwardSample(x, weights, biases, act).output[0] >= 0.5 ? 1 : 0);
        const acc = preds.reduce((s, p, i) => s + (p === y[i] ? 1 : 0), 0) / n;
        history.push({ epoch: ep, loss: avgLoss, accuracy: acc });
    }

    return {
        weights, biases, activation,
        layerSizes, history,
        algorithm: 'neural_network',
    };
}

// ── Predict ──

function predict(X, model) {
    const act = ACTIVATIONS[model.activation] || ACTIVATIONS.relu;
    return X.map(x => {
        const { output } = forwardSample(x, model.weights, model.biases, act);
        return output[0] >= 0.5 ? 1 : 0;
    });
}

// ── Decision boundary grid ──

function decisionGrid(model, resolution = 60) {
    const act = ACTIVATIONS[model.activation] || ACTIVATIONS.relu;
    const xs = [];
    const ys = [];
    const probs = [];
    const step = 1 / resolution;

    // Assume data is roughly in [-2, 4] range
    const xMin = -2, xMax = 4, yMin = -2, yMax = 4;
    for (let i = 0; i <= resolution; i++) {
        for (let j = 0; j <= resolution; j++) {
            const x = xMin + (xMax - xMin) * (i * step);
            const y = yMin + (yMax - yMin) * (j * step);
            xs.push(x);
            ys.push(y);
            const { output } = forwardSample([x, y], model.weights, model.biases, act);
            probs.push(output[0]);
        }
    }
    return { xs, ys, probs, resolution: resolution + 1 };
}

// ── Metrics ──

function getMetrics(yTrue, yPred) {
    const n = yTrue.length;
    let tp = 0, fp = 0, fn = 0, tn = 0;
    for (let i = 0; i < n; i++) {
        if (yPred[i] === 1 && yTrue[i] === 1) tp++;
        if (yPred[i] === 1 && yTrue[i] === 0) fp++;
        if (yPred[i] === 0 && yTrue[i] === 1) fn++;
        if (yPred[i] === 0 && yTrue[i] === 0) tn++;
    }
    const acc = (tp + tn) / n;
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;
    return { accuracy: acc, precision, recall, f1 };
}

// ── Explain ──

function explain(config, model, metrics) {
    const layers = model.layerSizes.join(' → ');
    const finalLoss = model.history[model.history.length - 1]?.loss.toFixed(4) || '?';
    return `Neural Network [${layers}] with ${config.activation || 'relu'} activation. `
        + `Trained ${config.epochs || 80} epochs (lr=${config.learningRate || 0.05}). `
        + `Final loss: ${finalLoss}. Accuracy: ${(metrics.accuracy * 100).toFixed(1)}%.`;
}

// ── Export ──

const neuralEngine = createEngine('NeuralNetwork', {
    generateData,
    trainModel,
    predict,
    getMetrics,
    explain,
});

export { decisionGrid };
export default neuralEngine;
