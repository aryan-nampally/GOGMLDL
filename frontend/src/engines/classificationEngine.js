/**
 * Classification Engine — Logistic Regression, KNN, SVM, Naive Bayes, Decision Tree.
 *
 * Each algorithm: generateData → trainModel → predict → getMetrics → explain
 * Follows the baseEngine pattern.
 */
import { createEngine } from './baseEngine';
import {
    mean, variance, dot,
    sigmoid, argmax, unique, valueCounts,
    euclideanDistance,
    generateBlobs, generateMoons, generateCircles, generateSpirals,
    accuracy, classificationReport,
} from './mlUtils';

// ════════════════════════════════════════════════════
// DATA GENERATION
// ════════════════════════════════════════════════════

function generateData(config = {}) {
    const {
        nSamples = 120,
        nClasses = 2,
        dataShape = 'blobs', // 'blobs' | 'moons' | 'circles' | 'spirals'
        spread = 1.0,
        seed = 42,
    } = config;

    let result;
    switch (dataShape) {
        case 'moons':
            result = generateMoons(nSamples, spread * 0.15, seed);
            break;
        case 'circles':
            result = generateCircles(nSamples, spread * 0.15, seed);
            break;
        case 'spirals':
            result = generateSpirals(nSamples, spread * 0.15, seed);
            break;
        case 'blobs':
        default:
            result = generateBlobs(nSamples, nClasses, spread, seed);
            break;
    }

    // Classification engine uses y (not labels) for pipeline compatibility
    return { X: result.X, y: result.labels };
}

// ════════════════════════════════════════════════════
// TRAINING
// ════════════════════════════════════════════════════

function trainModel(X, y, config = {}) {
    const {
        algorithm = 'logistic',
        learningRate = 0.1,
        maxIter = 200,
        k = 5,
        maxDepth = 5,
        C = 1.0,
    } = config;

    switch (algorithm) {
        case 'logistic':
            return trainLogistic(X, y, learningRate, maxIter);
        case 'knn':
            return trainKNN(X, y, k);
        case 'svm':
            return trainSVM(X, y, C, learningRate, maxIter);
        case 'naiveBayes':
            return trainNaiveBayes(X, y);
        case 'decisionTree':
            return trainDecisionTree(X, y, maxDepth);
        default:
            return trainLogistic(X, y, learningRate, maxIter);
    }
}

// ── Logistic Regression (Gradient Descent) ──
function trainLogistic(X, y, lr = 0.1, maxIter = 200) {
    const n = X.length;
    const nFeatures = X[0].length;
    const classes = unique(y).sort((a, b) => a - b);

    // Binary: direct sigmoid
    if (classes.length === 2) {
        let w = new Array(nFeatures).fill(0);
        let b = 0;

        for (let iter = 0; iter < maxIter; iter++) {
            let dw = new Array(nFeatures).fill(0);
            let db = 0;

            for (let i = 0; i < n; i++) {
                const z = dot(w, X[i]) + b;
                const pred = sigmoid(z);
                const err = pred - y[i];
                for (let j = 0; j < nFeatures; j++) {
                    dw[j] += err * X[i][j];
                }
                db += err;
            }

            for (let j = 0; j < nFeatures; j++) {
                w[j] -= (lr / n) * dw[j];
            }
            b -= (lr / n) * db;
        }

        return { algorithm: 'logistic', w, b, classes, type: 'binary' };
    }

    // Multiclass: one-vs-rest
    const models = classes.map((cls) => {
        const binaryY = y.map((yi) => (yi === cls ? 1 : 0));
        let w = new Array(nFeatures).fill(0);
        let b = 0;

        for (let iter = 0; iter < maxIter; iter++) {
            let dw = new Array(nFeatures).fill(0);
            let db = 0;

            for (let i = 0; i < n; i++) {
                const z = dot(w, X[i]) + b;
                const pred = sigmoid(z);
                const err = pred - binaryY[i];
                for (let j = 0; j < nFeatures; j++) {
                    dw[j] += err * X[i][j];
                }
                db += err;
            }

            for (let j = 0; j < nFeatures; j++) {
                w[j] -= (lr / n) * dw[j];
            }
            b -= (lr / n) * db;
        }

        return { w, b, cls };
    });

    return { algorithm: 'logistic', models, classes, type: 'multiclass' };
}

// ── K-Nearest Neighbors ──
function trainKNN(X, y, k = 5) {
    // KNN is lazy — store training data as the "model"
    return { algorithm: 'knn', X: [...X], y: [...y], k, classes: unique(y).sort((a, b) => a - b) };
}

// ── Support Vector Machine (Linear, Simplified SGD) ──
function trainSVM(X, y, C = 1.0, lr = 0.01, maxIter = 200) {
    const n = X.length;
    const nFeatures = X[0].length;
    const classes = unique(y).sort((a, b) => a - b);

    // Binary SVM: labels must be -1 and +1
    const binaryY = y.map((yi) => (yi === classes[0] ? -1 : 1));

    let w = new Array(nFeatures).fill(0);
    let b = 0;

    for (let iter = 0; iter < maxIter; iter++) {
        for (let i = 0; i < n; i++) {
            const margin = binaryY[i] * (dot(w, X[i]) + b);
            if (margin < 1) {
                // Misclassified or inside margin
                for (let j = 0; j < nFeatures; j++) {
                    w[j] += lr * (C * binaryY[i] * X[i][j] - w[j] / n);
                }
                b += lr * C * binaryY[i];
            } else {
                // Correctly classified, just regularize
                for (let j = 0; j < nFeatures; j++) {
                    w[j] -= lr * (w[j] / n);
                }
            }
        }
    }

    return { algorithm: 'svm', w, b, classes, C };
}

// ── Naive Bayes (Gaussian) ──
function trainNaiveBayes(X, y) {
    const classes = unique(y).sort((a, b) => a - b);
    const nFeatures = X[0].length;
    const n = X.length;

    const stats = {};
    const priors = {};

    for (const cls of classes) {
        const subset = X.filter((_, i) => y[i] === cls);
        priors[cls] = subset.length / n;
        stats[cls] = [];

        for (let j = 0; j < nFeatures; j++) {
            const col = subset.map((row) => row[j]);
            stats[cls].push({
                mean: mean(col),
                variance: variance(col) + 1e-9, // smoothing
            });
        }
    }

    return { algorithm: 'naiveBayes', stats, priors, classes };
}

// ── Decision Tree (CART with Gini Impurity) ──
function trainDecisionTree(X, y, maxDepth = 5) {
    const classes = unique(y).sort((a, b) => a - b);

    function gini(labels) {
        const n = labels.length;
        if (n === 0) return 0;
        const counts = valueCounts(labels);
        let imp = 1;
        for (const count of Object.values(counts)) {
            imp -= (count / n) ** 2;
        }
        return imp;
    }

    function bestSplit(XSub, ySub) {
        const n = XSub.length;
        if (n <= 1) return null;

        let bestGain = 0;
        let bestFeature = -1;
        let bestThreshold = 0;
        const parentGini = gini(ySub);

        const nFeatures = XSub[0].length;

        for (let f = 0; f < nFeatures; f++) {
            const values = XSub.map((row) => row[f]);
            const sorted = [...new Set(values)].sort((a, b) => a - b);

            for (let t = 0; t < sorted.length - 1; t++) {
                const threshold = (sorted[t] + sorted[t + 1]) / 2;
                const leftIdx = [];
                const rightIdx = [];

                for (let i = 0; i < n; i++) {
                    if (XSub[i][f] <= threshold) leftIdx.push(i);
                    else rightIdx.push(i);
                }

                if (leftIdx.length === 0 || rightIdx.length === 0) continue;

                const leftGini = gini(leftIdx.map((i) => ySub[i]));
                const rightGini = gini(rightIdx.map((i) => ySub[i]));
                const weightedGini = (leftIdx.length / n) * leftGini + (rightIdx.length / n) * rightGini;
                const gain = parentGini - weightedGini;

                if (gain > bestGain) {
                    bestGain = gain;
                    bestFeature = f;
                    bestThreshold = threshold;
                }
            }
        }

        if (bestGain === 0) return null;
        return { feature: bestFeature, threshold: bestThreshold, gain: bestGain };
    }

    function buildTree(XSub, ySub, depth) {
        const counts = valueCounts(ySub);
        const prediction = +Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];

        // Leaf conditions
        if (depth >= maxDepth || unique(ySub).length === 1 || XSub.length <= 2) {
            return { leaf: true, prediction, counts, samples: ySub.length };
        }

        const split = bestSplit(XSub, ySub);
        if (!split) {
            return { leaf: true, prediction, counts, samples: ySub.length };
        }

        const leftIdx = [];
        const rightIdx = [];
        for (let i = 0; i < XSub.length; i++) {
            if (XSub[i][split.feature] <= split.threshold) leftIdx.push(i);
            else rightIdx.push(i);
        }

        return {
            leaf: false,
            feature: split.feature,
            threshold: split.threshold,
            gain: split.gain,
            left: buildTree(
                leftIdx.map((i) => XSub[i]),
                leftIdx.map((i) => ySub[i]),
                depth + 1
            ),
            right: buildTree(
                rightIdx.map((i) => XSub[i]),
                rightIdx.map((i) => ySub[i]),
                depth + 1
            ),
            samples: ySub.length,
        };
    }

    const tree = buildTree(X, y, 0);
    return { algorithm: 'decisionTree', tree, classes, maxDepth };
}

// ════════════════════════════════════════════════════
// PREDICTION
// ════════════════════════════════════════════════════

// ════════════════════════════════════════════════════
// PREDICTION
// ════════════════════════════════════════════════════

function predict(X, model) {
    let results;
    switch (model.algorithm) {
        case 'logistic':
            results = predictLogistic(X, model);
            break;
        case 'knn':
            results = predictKNN(X, model);
            break;
        case 'svm':
            results = predictSVM(X, model);
            break;
        case 'naiveBayes':
            results = predictNaiveBayes(X, model);
            break;
        case 'decisionTree':
            results = predictDecisionTree(X, model);
            break;
        default:
            results = { predictions: X.map(() => 0) };
    }

    // Return object format for baseEngine to handle
    return {
        predictions: results.predictions,
        probabilities: results.probabilities
    };
}

function predictLogistic(X, model) {
    if (model.type === 'binary') {
        const probabilities = X.map((x) => {
            const z = dot(model.w, x) + model.b;
            return sigmoid(z);
        });
        const predictions = probabilities.map(p => p >= 0.5 ? model.classes[1] : model.classes[0]);
        return { predictions, probabilities };
    }

    // Multiclass
    const predictions = X.map((x) => {
        const scores = model.models.map((m) => sigmoid(dot(m.w, x) + m.b));
        return model.classes[argmax(scores)];
    });
    return { predictions };
}

function predictKNN(X, model) {
    const probabilities = [];
    const predictions = X.map((x) => {
        const dists = model.X.map((xi, i) => ({
            dist: euclideanDistance(x, xi),
            label: model.y[i],
        }));
        dists.sort((a, b) => a.dist - b.dist);
        const kNearest = dists.slice(0, model.k);

        // Count votes
        const votes = {};
        let posVotes = 0;
        kNearest.forEach(d => {
            votes[d.label] = (votes[d.label] || 0) + 1;
            if (d.label === 1) posVotes++; // Assumes class 1 is positive
        });

        probabilities.push(posVotes / model.k);
        return +Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0];
    });
    return { predictions, probabilities };
}

function predictSVM(X, model) {
    const probabilities = X.map((x) => {
        const score = dot(model.w, x) + model.b;
        // Platt scaling approximation for edu purposes
        return sigmoid(score);
    });
    const predictions = probabilities.map(p => p >= 0.5 ? model.classes[1] : model.classes[0]);
    return { predictions, probabilities };
}

function predictNaiveBayes(X, model) {
    const probabilities = [];
    const predictions = X.map((x) => {
        const logProbs = model.classes.map(cls => {
            let lp = Math.log(model.priors[cls]);
            for (let j = 0; j < x.length; j++) {
                const { mean: m, variance: v } = model.stats[cls][j];
                lp += -0.5 * Math.log(2 * Math.PI * v) - ((x[j] - m) ** 2) / (2 * v);
            }
            return lp;
        });

        // Softmax to get probabilities
        const maxLp = Math.max(...logProbs);
        const exps = logProbs.map(lp => Math.exp(lp - maxLp));
        const sumExps = exps.reduce((a, b) => a + b, 0);
        const probs = exps.map(e => e / sumExps);

        // Probability of class 1 (assumed to be index 1 if 2 classes)
        const posClassIdx = model.classes.indexOf(1);
        probabilities.push(posClassIdx >= 0 ? probs[posClassIdx] : 0);

        return model.classes[argmax(logProbs)];
    });
    return { predictions, probabilities };
}

function predictDecisionTree(X, model) {
    function traverse(node, x) {
        if (node.leaf) {
            // Leaf probability of class 1
            const count1 = node.counts['1'] || 0;
            const prob1 = count1 / node.samples;
            return { prediction: node.prediction, prob: prob1 };
        }
        if (x[node.feature] <= node.threshold) return traverse(node.left, x);
        return traverse(node.right, x);
    }

    const probabilities = [];
    const predictions = X.map((x) => {
        const res = traverse(model.tree, x);
        probabilities.push(res.prob);
        return res.prediction;
    });
    return { predictions, probabilities };
}

// ════════════════════════════════════════════════════
// METRICS
// ════════════════════════════════════════════════════

function getMetrics(yTrue, yPred) {
    const report = classificationReport(yTrue, yPred);
    return {
        accuracy: accuracy(yTrue, yPred),
        precision: report.precision,
        recall: report.recall,
        f1: report.f1,
        tp: report.tp,
        fp: report.fp,
        fn: report.fn,
        tn: report.tn,
    };
}

// ════════════════════════════════════════════════════
// EXPLANATIONS
// ════════════════════════════════════════════════════

function explain(config, model, metrics) {
    const algo = model.algorithm;
    const accPct = (metrics.accuracy * 100).toFixed(1);

    let quality;
    if (metrics.accuracy > 0.95) quality = 'excellent';
    else if (metrics.accuracy > 0.85) quality = 'strong';
    else if (metrics.accuracy > 0.7) quality = 'moderate';
    else if (metrics.accuracy > 0.5) quality = 'fair';
    else quality = 'poor';

    const lines = [];

    switch (algo) {
        case 'logistic':
            lines.push(`Logistic Regression learned a decision boundary using gradient descent.`);
            lines.push(`It uses the sigmoid function to squeeze predictions into probabilities (0-1), then classifies at the 0.5 threshold.`);
            break;
        case 'knn':
            lines.push(`KNN (K=${model.k}) classified each point by looking at its ${model.k} nearest neighbors and taking a majority vote.`);
            lines.push(`No actual "training" happens — it memorizes all data and decides at prediction time ("lazy learning").`);
            break;
        case 'svm':
            lines.push(`SVM found a linear decision boundary that maximizes the margin between classes.`);
            lines.push(`The regularization parameter C=${model.C?.toFixed(1)} controls the trade-off: higher C = tighter fit, lower C = wider margin.`);
            break;
        case 'naiveBayes':
            lines.push(`Gaussian Naive Bayes assumed each feature follows a bell curve (Gaussian distribution) within each class.`);
            lines.push(`It multiplies the probability of each feature given the class — "naive" because it assumes features are independent.`);
            break;
        case 'decisionTree':
            lines.push(`Decision Tree split the data using Gini impurity at each node, finding the best feature and threshold to separate classes.`);
            lines.push(`Max depth of ${model.maxDepth} prevents overfitting. Deeper trees memorize noise; shallower trees generalize better.`);
            break;
    }

    lines.push(`Accuracy: ${accPct}% — a ${quality} result on ${config.dataShape || 'blob'} data with ${config.nSamples || 120} samples.`);

    if (metrics.accuracy < 0.6) {
        lines.push(`⚠️ Low accuracy suggests the model structure doesn't match the data shape. Try a different algorithm or adjust settings.`);
    }

    return lines.join(' ');
}

// ── Export ──
export default createEngine('classification', {
    generateData,
    trainModel,
    predict,
    getMetrics,
    explain,
});

export { generateData, trainModel, predict, getMetrics, explain };
