/**
 * Dimensionality Reduction Engine — PCA, t-SNE (simplified).
 *
 * PCA: eigendecomposition via power iteration.
 * t-SNE: simplified educational Barnes-Hut-style.
 */
import { createEngine } from './baseEngine';
import {
    mulberry32, normalRandom,
    mean, dot,
    matTranspose, matMul, matVecMul,
    vecNorm,
    generateBlobs, generateMoons, generateCircles, generateSpirals,
} from './mlUtils';

// ════════════════════════════════════════════════════
// DATA GENERATION
// ════════════════════════════════════════════════════

function generateData(config = {}) {
    const { nSamples = 100, nClasses = 3, nFeatures = 5, spread = 1.5, dataShape = 'blobs', seed = 42 } = config;

    if (nFeatures <= 2 || dataShape !== 'blobs') {
        let result;
        switch (dataShape) {
            case 'moons': result = generateMoons(nSamples, spread * 0.1, seed); break;
            case 'circles': result = generateCircles(nSamples, spread * 0.1, seed); break;
            case 'spirals': result = generateSpirals(nSamples, spread * 0.1, seed); break;
            case 'blobs': default: result = generateBlobs(nSamples, nClasses, spread, seed); break;
        }
        return { X: result.X, y: result.labels };
    }

    // Generate high-dimensional data
    const rng = mulberry32(seed);
    const X = [];
    const y = [];
    const centersPerClass = [];

    for (let c = 0; c < nClasses; c++) {
        const center = Array.from({ length: nFeatures }, () => (rng() - 0.5) * 8);
        centersPerClass.push(center);
    }

    const perClass = Math.floor(nSamples / nClasses);
    for (let c = 0; c < nClasses; c++) {
        for (let i = 0; i < perClass; i++) {
            const point = centersPerClass[c].map(v => v + normalRandom(rng) * spread);
            X.push(point);
            y.push(c);
        }
    }

    return { X, y };
}

// ════════════════════════════════════════════════════
// TRAINING
// ════════════════════════════════════════════════════

function trainModel(X, y, config = {}) {
    const { algorithm = 'pca', nComponents = 2, perplexity = 30, maxIter = 300, learningRate = 100, seed = 42 } = config;

    switch (algorithm) {
        case 'pca': return trainPCA(X, nComponents);
        case 'tsne': return trainTSNE(X, nComponents, perplexity, maxIter, learningRate, seed);
        default: return trainPCA(X, nComponents);
    }
}

function trainPCA(X, nComponents) {
    const n = X.length;
    const dim = X[0].length;

    // Center data
    const means = [];
    for (let j = 0; j < dim; j++) {
        means.push(mean(X.map(r => r[j])));
    }
    const centered = X.map(row => row.map((v, j) => v - means[j]));

    // Covariance matrix
    const Xt = matTranspose(centered);
    const cov = matMul(Xt, centered).map(row => row.map(v => v / (n - 1)));

    // Power iteration for top nComponents eigenvectors
    const components = [];
    const eigenvalues = [];
    let covCopy = cov.map(r => [...r]);

    for (let comp = 0; comp < Math.min(nComponents, dim); comp++) {
        let v = Array.from({ length: dim }, (_, i) => i === comp ? 1 : 0.1);

        for (let iter = 0; iter < 100; iter++) {
            const Av = matVecMul(covCopy, v);
            const norm = vecNorm(Av);
            if (norm < 1e-10) break;
            v = Av.map(x => x / norm);
        }

        const eigenvalue = dot(matVecMul(covCopy, v), v);
        eigenvalues.push(eigenvalue);
        components.push([...v]);

        // Deflate: remove this component from covariance
        for (let i = 0; i < dim; i++) {
            for (let j = 0; j < dim; j++) {
                covCopy[i][j] -= eigenvalue * v[i] * v[j];
            }
        }
    }

    // Project data
    const projected = centered.map(row => components.map(comp => dot(row, comp)));

    // Explained variance ratio
    const totalVariance = eigenvalues.reduce((s, v) => s + Math.abs(v), 0) || 1;
    const explainedRatio = eigenvalues.map(v => Math.abs(v) / totalVariance);

    return {
        algorithm: 'pca',
        projected,
        components,
        eigenvalues,
        explainedRatio,
        means,
        nComponents,
        originalDim: dim,
    };
}

function trainTSNE(X, nComponents, perplexity, maxIter, lr, seed) {
    const rng = mulberry32(seed);
    const n = X.length;

    // Initialize embedding randomly
    let Y = Array.from({ length: n }, () =>
        Array.from({ length: nComponents }, () => normalRandom(rng) * 0.01)
    );

    // Compute pairwise squared distances
    const dists = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            let d = 0;
            for (let k = 0; k < X[i].length; k++) d += (X[i][k] - X[j][k]) ** 2;
            dists[i][j] = d;
            dists[j][i] = d;
        }
    }

    // Compute P (joint probabilities in high-D space)
    const P = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++) {
        // Binary search for sigma
        let sigma = 1.0;
        let lo = 0.01, hi = 100;
        for (let iter = 0; iter < 50; iter++) {
            let sumP = 0;
            for (let j = 0; j < n; j++) {
                if (i !== j) {
                    P[i][j] = Math.exp(-dists[i][j] / (2 * sigma * sigma));
                    sumP += P[i][j];
                }
            }
            sumP = Math.max(sumP, 1e-10);
            let entropy = 0;
            for (let j = 0; j < n; j++) {
                if (i !== j) {
                    P[i][j] /= sumP;
                    if (P[i][j] > 1e-10) entropy -= P[i][j] * Math.log2(P[i][j]);
                }
            }
            const perp = 2 ** entropy;
            if (perp > perplexity) { hi = sigma; sigma = (lo + hi) / 2; }
            else { lo = sigma; sigma = (lo + hi) / 2; }
        }
    }

    // Symmetrize
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const sym = (P[i][j] + P[j][i]) / (2 * n);
            P[i][j] = sym;
            P[j][i] = sym;
        }
    }

    // Gradient descent
    let YPrev = Y.map(r => [...r]);

    for (let iter = 0; iter < maxIter; iter++) {
        // Compute Q (joint probabilities in low-D space)
        const qDists = Array.from({ length: n }, () => new Array(n).fill(0));
        let sumQ = 0;
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                let d = 0;
                for (let k = 0; k < nComponents; k++) d += (Y[i][k] - Y[j][k]) ** 2;
                const q = 1 / (1 + d);
                qDists[i][j] = q;
                qDists[j][i] = q;
                sumQ += 2 * q;
            }
        }
        sumQ = Math.max(sumQ, 1e-10);

        // Compute gradients
        const grads = Array.from({ length: n }, () => new Array(nComponents).fill(0));
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i === j) continue;
                const q = qDists[i][j] / sumQ;
                const mult = 4 * (P[i][j] - q) * qDists[i][j];
                for (let k = 0; k < nComponents; k++) {
                    grads[i][k] += mult * (Y[i][k] - Y[j][k]);
                }
            }
        }

        // Update with momentum
        const momentum = iter < 50 ? 0.5 : 0.8;
        const newY = Y.map((row, i) =>
            row.map((v, k) => v - lr * grads[i][k] + momentum * (v - YPrev[i][k]))
        );

        YPrev = Y;
        Y = newY;
    }

    return {
        algorithm: 'tsne',
        projected: Y,
        perplexity,
        nComponents,
        originalDim: X[0].length,
        iterations: maxIter,
    };
}

// ════════════════════════════════════════════════════
// PREDICTION & METRICS
// ════════════════════════════════════════════════════

function predict(X, model) {
    return model.projected;
}

function getMetrics(yTrue, yPred, data) {
    const model = data;
    if (model?.explainedRatio) {
        const totalExplained = model.explainedRatio.reduce((s, v) => s + v, 0);
        return {
            explainedVariance: model.explainedRatio,
            totalExplained,
            nComponents: model.nComponents,
            originalDim: model.originalDim,
        };
    }
    return {
        nComponents: model?.nComponents || 2,
        originalDim: model?.originalDim || '?',
        algorithm: model?.algorithm || 'unknown',
    };
}

// ════════════════════════════════════════════════════
// EXPLAIN
// ════════════════════════════════════════════════════

function explain(config, model) {
    if (model.algorithm === 'pca') {
        const pcts = model.explainedRatio.map(v => (v * 100).toFixed(1) + '%').join(' + ');
        const total = (model.explainedRatio.reduce((s, v) => s + v, 0) * 100).toFixed(1);
        return `PCA reduced ${model.originalDim}D → ${model.nComponents}D. Components explain ${pcts} = ${total}% of total variance. PCA finds directions of maximum spread in the data — like finding the "main axes" of a cloud of points.`;
    }
    return `t-SNE embedded ${model.originalDim}D data into ${model.nComponents}D using perplexity=${model.perplexity}. t-SNE preserves local neighborhoods: nearby high-D points stay near in the map, revealing cluster structure that linear methods miss.`;
}

// ── Export ──
export default createEngine('reduction', { generateData, trainModel, predict, getMetrics, explain });
export { generateData, trainModel, predict, getMetrics, explain };
