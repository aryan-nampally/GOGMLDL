/**
 * Clustering Engine — K-Means, DBSCAN, Hierarchical Clustering.
 */
import { createEngine } from './baseEngine';
import {
    mulberry32,
    unique, euclideanDistance, distanceMatrix,
    generateBlobs, generateMoons, generateCircles, generateSpirals,
} from './mlUtils';

// ════════════════════════════════════════════════════
// DATA GENERATION
// ════════════════════════════════════════════════════

function generateData(config = {}) {
    const { nSamples = 150, nClusters = 3, spread = 1.2, dataShape = 'blobs', seed = 42 } = config;

    let result;
    switch (dataShape) {
        case 'moons': result = generateMoons(nSamples, spread * 0.1, seed); break;
        case 'circles': result = generateCircles(nSamples, spread * 0.1, seed); break;
        case 'spirals': result = generateSpirals(nSamples, spread * 0.1, seed); break;
        case 'blobs': default: result = generateBlobs(nSamples, nClusters, spread, seed); break;
    }
    return { X: result.X, y: result.labels };
}

// ════════════════════════════════════════════════════
// TRAINING
// ════════════════════════════════════════════════════

function trainModel(X, y, config = {}) {
    const { algorithm = 'kmeans', k = 3, maxIter = 50, eps = 1.5, minPts = 5, linkage = 'average', seed = 42 } = config;
    switch (algorithm) {
        case 'kmeans': return trainKMeans(X, k, maxIter, seed);
        case 'dbscan': return trainDBSCAN(X, eps, minPts);
        case 'hierarchical': return trainHierarchical(X, k, linkage);
        default: return trainKMeans(X, k, maxIter, seed);
    }
}

function trainKMeans(X, k, maxIter, seed) {
    const rng = mulberry32(seed);
    const n = X.length;
    const dim = X[0].length;

    // Initialize centroids randomly from data
    const indices = [];
    while (indices.length < k) {
        const idx = Math.floor(rng() * n);
        if (!indices.includes(idx)) indices.push(idx);
    }
    let centroids = indices.map(i => [...X[i]]);
    let assignments = new Array(n).fill(0);
    let iterations = [];

    for (let iter = 0; iter < maxIter; iter++) {
        // Assign each point to nearest centroid
        const newAssignments = X.map(x => {
            let minDist = Infinity, bestC = 0;
            for (let c = 0; c < k; c++) {
                const d = euclideanDistance(x, centroids[c]);
                if (d < minDist) { minDist = d; bestC = c; }
            }
            return bestC;
        });

        // Save iteration state
        iterations.push({
            centroids: centroids.map(c => [...c]),
            assignments: [...newAssignments],
        });

        // Check convergence
        let converged = true;
        for (let i = 0; i < n; i++) {
            if (newAssignments[i] !== assignments[i]) { converged = true; break; }
        }
        assignments = newAssignments;

        // Update centroids
        const newCentroids = Array.from({ length: k }, () => new Array(dim).fill(0));
        const counts = new Array(k).fill(0);
        for (let i = 0; i < n; i++) {
            for (let d = 0; d < dim; d++) newCentroids[assignments[i]][d] += X[i][d];
            counts[assignments[i]]++;
        }
        for (let c = 0; c < k; c++) {
            if (counts[c] > 0) for (let d = 0; d < dim; d++) newCentroids[c][d] /= counts[c];
            else newCentroids[c] = [...centroids[c]];
        }
        centroids = newCentroids;

        if (converged && iter > 0) break;
    }

    // Compute inertia (sum of squared distances to centroids)
    let inertia = 0;
    for (let i = 0; i < n; i++) {
        inertia += euclideanDistance(X[i], centroids[assignments[i]]) ** 2;
    }

    return { algorithm: 'kmeans', centroids, assignments, iterations, k, inertia };
}

function trainDBSCAN(X, eps, minPts) {
    const n = X.length;
    const labels = new Array(n).fill(-1); // -1 = unvisited
    let clusterId = 0;

    const regionQuery = (idx) => {
        const neighbors = [];
        for (let i = 0; i < n; i++) {
            if (euclideanDistance(X[idx], X[i]) <= eps) neighbors.push(i);
        }
        return neighbors;
    };

    for (let i = 0; i < n; i++) {
        if (labels[i] !== -1) continue;

        const neighbors = regionQuery(i);
        if (neighbors.length < minPts) {
            labels[i] = -2; // Noise
            continue;
        }

        labels[i] = clusterId;
        const seedSet = [...neighbors.filter(j => j !== i)];

        for (let s = 0; s < seedSet.length; s++) {
            const j = seedSet[s];
            if (labels[j] === -2) labels[j] = clusterId; // Change noise to border
            if (labels[j] !== -1) continue;

            labels[j] = clusterId;
            const jNeighbors = regionQuery(j);
            if (jNeighbors.length >= minPts) {
                for (const nb of jNeighbors) {
                    if (!seedSet.includes(nb)) seedSet.push(nb);
                }
            }
        }

        clusterId++;
    }

    const nClusters = unique(labels.filter(l => l >= 0)).length;
    const nNoise = labels.filter(l => l < 0).length;

    return { algorithm: 'dbscan', assignments: labels, eps, minPts, nClusters, nNoise };
}

function trainHierarchical(X, k, linkage) {
    const n = X.length;
    const D = distanceMatrix(X);

    // Each point starts as its own cluster
    let clusters = Array.from({ length: n }, (_, i) => [i]);
    const mergeHistory = [];

    while (clusters.length > k) {
        let minDist = Infinity, mergeA = 0, mergeB = 1;

        for (let i = 0; i < clusters.length; i++) {
            for (let j = i + 1; j < clusters.length; j++) {
                let dist;
                if (linkage === 'single') {
                    dist = Infinity;
                    for (const a of clusters[i]) for (const b of clusters[j]) dist = Math.min(dist, D[a][b]);
                } else if (linkage === 'complete') {
                    dist = 0;
                    for (const a of clusters[i]) for (const b of clusters[j]) dist = Math.max(dist, D[a][b]);
                } else { // average
                    let sum = 0, count = 0;
                    for (const a of clusters[i]) for (const b of clusters[j]) { sum += D[a][b]; count++; }
                    dist = sum / count;
                }
                if (dist < minDist) { minDist = dist; mergeA = i; mergeB = j; }
            }
        }

        mergeHistory.push({ a: mergeA, b: mergeB, distance: minDist });
        clusters[mergeA] = [...clusters[mergeA], ...clusters[mergeB]];
        clusters.splice(mergeB, 1);
    }

    // Build assignments from final clusters
    const assignments = new Array(n).fill(0);
    clusters.forEach((cluster, cIdx) => {
        for (const idx of cluster) assignments[idx] = cIdx;
    });

    return { algorithm: 'hierarchical', assignments, k, linkage, mergeHistory, nClusters: k };
}

// ════════════════════════════════════════════════════
// PREDICTION & METRICS
// ════════════════════════════════════════════════════

function predict(X, model) {
    return model.assignments;
}

function getMetrics(yTrue, yPred, data) {
    // Silhouette score (simplified)
    const X = data?.X || [];
    const labels = yPred;
    const n = labels.length;
    let silhouetteSum = 0;
    const clusters = unique(labels.filter(l => l >= 0));

    if (clusters.length <= 1 || n < 2) {
        return { silhouette: 0, nClusters: clusters.length, inertia: 0 };
    }

    const silhouetteSamples = new Array(n).fill(0);

    for (let i = 0; i < n; i++) {
        if (labels[i] < 0) continue; // skip noise

        // a(i) = avg distance to same cluster
        let sameSum = 0, sameCount = 0;
        // b(i) = min avg distance to other clusters
        const otherSums = {};
        const otherCounts = {};

        for (let j = 0; j < n; j++) {
            if (i === j || labels[j] < 0) continue;
            const d = euclideanDistance(X[i], X[j]);

            if (labels[j] === labels[i]) {
                sameSum += d;
                sameCount++;
            } else {
                if (!otherSums[labels[j]]) { otherSums[labels[j]] = 0; otherCounts[labels[j]] = 0; }
                otherSums[labels[j]] += d;
                otherCounts[labels[j]]++;
            }
        }

        const a = sameCount > 0 ? sameSum / sameCount : 0;
        let b = Infinity;

        for (const c of Object.keys(otherSums)) {
            const meanDist = otherSums[c] / otherCounts[c];
            if (meanDist < b) b = meanDist;
        }
        if (b === Infinity) b = 0;

        const s = (b - a) / Math.max(a, b);
        silhouetteSamples[i] = s;
        silhouetteSum += s;
    }

    return {
        silhouette: silhouetteSum / n,
        silhouetteSamples, // Array of scores for each point
        nClusters: clusters.length,
    };
}

function explain(config, model, metrics) {
    const algo = model.algorithm;
    const sil = metrics.silhouette?.toFixed(3) || 'N/A';
    const nC = metrics.nClusters;

    const explanations = {
        kmeans: `K-Means (k=${model.k}) iteratively assigned points to the nearest centroid and recomputed centroids until convergence. It found ${nC} clusters with silhouette score ${sil} (closer to 1 = well-separated clusters).`,
        dbscan: `DBSCAN (ε=${model.eps}, minPts=${model.minPts}) found ${model.nClusters} clusters by density. Points with ≥${model.minPts} neighbors within ε=${model.eps} distance form clusters. ${model.nNoise} points were classified as noise.`,
        hierarchical: `Hierarchical Clustering (${model.linkage} linkage) merged the two closest clusters at each step until ${model.k} remained. Silhouette: ${sil}.`,
    };

    return explanations[algo] || `Clustering complete with ${nC} clusters.`;
}

// ── Export ──
export default createEngine('clustering', { generateData, trainModel, predict, getMetrics, explain });
export { generateData, trainModel, predict, getMetrics, explain };
