/**
 * Anomaly Detection Engine — Isolation Forest, LOF (Local Outlier Factor).
 */
import { createEngine } from './baseEngine';
import {
    mulberry32,
    mean, euclideanDistance,
    generateBlobs, generateMoons, generateCircles, generateSpirals,
} from './mlUtils';

// ════════════════════════════════════════════════════
// DATA GENERATION (normal + anomalies)
// ════════════════════════════════════════════════════

function generateData(config = {}) {
    const { nSamples = 150, anomalyRatio = 0.1, dataShape = 'blobs', seed = 42 } = config;
    const nAnomalies = Math.max(1, Math.round(nSamples * anomalyRatio));
    const nNormal = nSamples - nAnomalies;

    let result;
    // Generate normal data
    switch (dataShape) {
        case 'moons': result = generateMoons(nNormal, 0.1, seed); break;
        case 'circles': result = generateCircles(nNormal, 0.1, seed); break;
        case 'spirals': result = generateSpirals(nNormal, 0.1, seed); break;
        case 'blobs': default: result = generateBlobs(nNormal, 1, 1.0, seed); break; // 1 cluster for normal
    }

    // Add anomalies (scattered uniformly in range [-3, 3])
    const rng = mulberry32(seed + 999);
    for (let i = 0; i < nAnomalies; i++) {
        const x = (rng() - 0.5) * 6; // -3 to 3
        const y = (rng() - 0.5) * 6; // -3 to 3
        result.X.push([x, y]);
        result.labels.push(1); // 1 = anomaly
    }

    // Ensure labels for normal data are 0
    // The utility functions might return 0,1 for classes. We force 0.
    for (let i = 0; i < nNormal; i++) {
        result.labels[i] = 0;
    }

    return { X: result.X, y: result.labels };
}

// ════════════════════════════════════════════════════
// TRAINING
// ════════════════════════════════════════════════════

function trainModel(X, y, config = {}) {
    const { algorithm = 'isolationForest', nEstimators = 50, contamination = 0.1, k = 10, seed = 42 } = config;

    switch (algorithm) {
        case 'isolationForest': return trainIsolationForest(X, nEstimators, contamination, seed);
        case 'lof': return trainLOF(X, k, contamination);
        default: return trainIsolationForest(X, nEstimators, contamination, seed);
    }
}

// ── Isolation Forest ──
function trainIsolationForest(X, nTrees, contamination, seed) {
    const rng = mulberry32(seed);
    const n = X.length;
    const dim = X[0].length;
    const maxHeight = Math.ceil(Math.log2(n));

    function buildITree(X, height, maxH) {
        if (height >= maxH || X.length <= 1) {
            return { leaf: true, size: X.length };
        }

        const f = Math.floor(rng() * dim); // random feature
        const vals = X.map(r => r[f]);
        const min = Math.min(...vals);
        const max = Math.max(...vals);

        if (min === max) return { leaf: true, size: X.length };

        const threshold = min + rng() * (max - min);
        const left = X.filter(r => r[f] < threshold);
        const right = X.filter(r => r[f] >= threshold);

        return {
            leaf: false,
            feature: f,
            threshold,
            left: buildITree(left, height + 1, maxH),
            right: buildITree(right, height + 1, maxH),
        };
    }

    // Build forest
    const trees = [];
    const sampleSize = Math.min(256, n);
    for (let t = 0; t < nTrees; t++) {
        // Subsample
        const subsample = [];
        for (let i = 0; i < sampleSize; i++) {
            subsample.push(X[Math.floor(rng() * n)]);
        }
        trees.push(buildITree(subsample, 0, maxHeight));
    }

    // Score all points
    function pathLength(node, x, depth) {
        if (node.leaf) {
            const c = node.size <= 1 ? 0 : 2 * (Math.log(node.size - 1) + 0.5772) - 2 * (node.size - 1) / node.size;
            return depth + c;
        }
        if (x[node.feature] < node.threshold) return pathLength(node.left, x, depth + 1);
        return pathLength(node.right, x, depth + 1);
    }

    const avgC = 2 * (Math.log(sampleSize - 1) + 0.5772) - 2 * (sampleSize - 1) / sampleSize;

    const scores = X.map(x => {
        const avgPath = mean(trees.map(tree => pathLength(tree, x, 0)));
        return Math.pow(2, -avgPath / avgC); // Anomaly score: higher = more anomalous
    });

    // Set threshold based on contamination
    const sortedScores = [...scores].sort((a, b) => b - a);
    const threshold = sortedScores[Math.floor(contamination * n)] || 0.5;

    const predictions = scores.map(s => s >= threshold ? 1 : 0); // 1 = anomaly

    return {
        algorithm: 'isolationForest',
        trees, scores, predictions, threshold, contamination,
        nEstimators: nTrees,
    };
}

// ── Local Outlier Factor ──
function trainLOF(X, k, contamination) {
    const n = X.length;

    // Compute pairwise distances
    const dists = Array.from({ length: n }, (_, i) =>
        Array.from({ length: n }, (_, j) => i === j ? Infinity : euclideanDistance(X[i], X[j]))
    );

    // k-distance and k-neighbors for each point
    const kDists = [];
    const kNeighbors = [];
    for (let i = 0; i < n; i++) {
        const sorted = dists[i]
            .map((d, j) => ({ d, j }))
            .sort((a, b) => a.d - b.d);
        kNeighbors.push(sorted.slice(0, k).map(s => s.j));
        kDists.push(sorted[k - 1].d);
    }

    // Reachability distance
    const reachDist = (a, b) => Math.max(kDists[b], dists[a][b]);

    // Local Reachability Density
    const lrd = [];
    for (let i = 0; i < n; i++) {
        const avgReach = mean(kNeighbors[i].map(j => reachDist(i, j)));
        lrd.push(avgReach > 0 ? 1 / avgReach : 1);
    }

    // LOF scores
    const lofScores = [];
    for (let i = 0; i < n; i++) {
        const score = mean(kNeighbors[i].map(j => lrd[j])) / lrd[i];
        lofScores.push(isFinite(score) ? score : 1);
    }

    // Threshold based on contamination
    const sortedScores = [...lofScores].sort((a, b) => b - a);
    const threshold = sortedScores[Math.floor(contamination * n)] || 1.5;

    const predictions = lofScores.map(s => s >= threshold ? 1 : 0);

    return {
        algorithm: 'lof',
        scores: lofScores,
        predictions,
        threshold,
        k,
        contamination,
    };
}

// ════════════════════════════════════════════════════
// PREDICTION & METRICS
// ════════════════════════════════════════════════════

function predict(X, model) {
    return model.predictions;
}

function getMetrics(yTrue, yPred) {
    const n = yTrue.length;
    let tp = 0, fp = 0, fn = 0, tn = 0;
    for (let i = 0; i < n; i++) {
        if (yTrue[i] === 1 && yPred[i] === 1) tp++;
        else if (yTrue[i] === 0 && yPred[i] === 1) fp++;
        else if (yTrue[i] === 1 && yPred[i] === 0) fn++;
        else tn++;
    }

    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;
    const accuracy = (tp + tn) / n;

    return { tp, fp, fn, tn, precision, recall, f1, accuracy };
}

function explain(config, model, metrics) {
    const algo = model.algorithm;
    const prec = (metrics.precision * 100).toFixed(1);
    const rec = (metrics.recall * 100).toFixed(1);

    if (algo === 'isolationForest') {
        return `Isolation Forest (${model.nEstimators} trees) isolates anomalies by randomly splitting features — anomalies need fewer splits to be isolated (shorter path = more anomalous). Precision: ${prec}%, Recall: ${rec}%.`;
    }
    return `LOF (k=${model.k}) computes each point's local density relative to its neighbors — points in sparse regions get high LOF scores (outliers). Precision: ${prec}%, Recall: ${rec}%.`;
}

// ── Export ──
export default createEngine('anomaly', { generateData, trainModel, predict, getMetrics, explain });
export { generateData, trainModel, predict, getMetrics, explain };
