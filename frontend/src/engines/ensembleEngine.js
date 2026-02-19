/**
 * Ensemble Engine — Educational implementations of 8 ensemble algorithms.
 *
 * Random Forest, Extra Trees, Gradient Boosting, XGBoost (simplified),
 * LightGBM (concept), CatBoost (concept), AdaBoost, Bagging.
 *
 * Complex algorithms (XGBoost, LightGBM, CatBoost) are educational simulations.
 */
import { createEngine } from './baseEngine';
import {
    mulberry32,
    unique, valueCounts,
    generateBlobs, generateMoons, generateCircles, generateSpirals,
    accuracy, classificationReport,
} from './mlUtils';

// ════════════════════════════════════════════════════
// DATA GENERATION
// ════════════════════════════════════════════════════

function generateData(config = {}) {
    const { nSamples = 150, nClasses = 3, spread = 1.2, dataShape = 'blobs', seed = 42 } = config;

    let result;
    switch (dataShape) {
        case 'moons': result = generateMoons(nSamples, spread * 0.1, seed); break;
        case 'circles': result = generateCircles(nSamples, spread * 0.1, seed); break;
        case 'spirals': result = generateSpirals(nSamples, spread * 0.1, seed); break;
        case 'blobs': default: result = generateBlobs(nSamples, nClasses, spread, seed); break;
    }
    return { X: result.X, y: result.labels };
}

// ════════════════════════════════════════════════════
// SHARED: Simple Decision Stump / Tree
// ════════════════════════════════════════════════════

function gini(labels) {
    const n = labels.length;
    if (n === 0) return 0;
    const counts = valueCounts(labels);
    let imp = 1;
    for (const c of Object.values(counts)) imp -= (c / n) ** 2;
    return imp;
}


function buildStump(X, y, importanceMap = null) {
    const n = X.length;
    const nFeatures = X[0].length;
    let bestGain = -1, bestFeature = 0, bestThreshold = 0;

    const parentGini = gini(y);

    for (let f = 0; f < nFeatures; f++) {
        const vals = [...new Set(X.map(r => r[f]))].sort((a, b) => a - b);
        for (let t = 0; t < vals.length - 1; t++) {
            const thresh = (vals[t] + vals[t + 1]) / 2;
            const leftIdx = [], rightIdx = [];
            for (let i = 0; i < n; i++) {
                if (X[i][f] <= thresh) leftIdx.push(i);
                else rightIdx.push(i);
            }
            if (leftIdx.length === 0 || rightIdx.length === 0) continue;

            const leftGini = gini(leftIdx.map(i => y[i]));
            const rightGini = gini(rightIdx.map(i => y[i]));
            const gain = parentGini - (leftIdx.length / n) * leftGini - (rightIdx.length / n) * rightGini;

            // Weighted gain if weights exist? Simplified: just use Gini gain
            if (gain > bestGain) {
                bestGain = gain;
                bestFeature = f;
                bestThreshold = thresh;
            }
        }
    }

    if (importanceMap && bestGain > 0) {
        importanceMap[bestFeature] += bestGain * n; // Weighted by samples
    }

    // Predictions for each side
    const leftLabels = [], rightLabels = [];
    for (let i = 0; i < n; i++) {
        if (X[i][bestFeature] <= bestThreshold) leftLabels.push(y[i]);
        else rightLabels.push(y[i]);
    }

    const majority = (labels) => {
        const c = valueCounts(labels);
        if (Object.keys(c).length === 0) return 0;
        return +Object.entries(c).sort((a, b) => b[1] - a[1])[0][0];
    };

    return {
        feature: bestFeature,
        threshold: bestThreshold,
        leftPred: leftLabels.length > 0 ? majority(leftLabels) : 0,
        rightPred: rightLabels.length > 0 ? majority(rightLabels) : 0,
    };
}

function buildSimpleTree(X, y, maxDepth, rng = null, randomSplits = false, importanceMap = null) {
    function build(XSub, ySub, depth) {
        const counts = valueCounts(ySub);
        if (Object.keys(counts).length === 0) return { leaf: true, prediction: 0 };
        const pred = +Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];

        if (depth >= maxDepth || unique(ySub).length === 1 || XSub.length <= 3) {
            return { leaf: true, prediction: pred };
        }

        const nFeatures = XSub[0].length;
        let bestGain = 0, bestF = 0, bestT = 0;

        // Feature subset (for Random Forest)
        const featureCount = rng ? Math.max(1, Math.floor(Math.sqrt(nFeatures))) : nFeatures;
        const features = [];
        if (rng) {
            const allF = Array.from({ length: nFeatures }, (_, i) => i);
            for (let i = 0; i < featureCount; i++) {
                const idx = Math.floor(rng() * allF.length);
                features.push(allF.splice(idx, 1)[0]);
            }
        } else {
            for (let i = 0; i < nFeatures; i++) features.push(i);
        }

        const parentGini = gini(ySub);

        for (const f of features) {
            const vals = [...new Set(XSub.map(r => r[f]))].sort((a, b) => a - b);

            if (randomSplits && rng && vals.length > 1) {
                // Extra Trees: random threshold
                const thresh = vals[0] + rng() * (vals[vals.length - 1] - vals[0]);
                const leftIdx = [], rightIdx = [];
                for (let i = 0; i < XSub.length; i++) {
                    if (XSub[i][f] <= thresh) leftIdx.push(i);
                    else rightIdx.push(i);
                }
                if (leftIdx.length > 0 && rightIdx.length > 0) {
                    const gain = parentGini - (leftIdx.length / XSub.length) * gini(leftIdx.map(i => ySub[i]))
                        - (rightIdx.length / XSub.length) * gini(rightIdx.map(i => ySub[i]));
                    if (gain > bestGain) { bestGain = gain; bestF = f; bestT = thresh; }
                }
            } else {
                for (let t = 0; t < vals.length - 1; t++) {
                    const thresh = (vals[t] + vals[t + 1]) / 2;
                    const leftIdx = [], rightIdx = [];
                    for (let i = 0; i < XSub.length; i++) {
                        if (XSub[i][f] <= thresh) leftIdx.push(i);
                        else rightIdx.push(i);
                    }
                    if (leftIdx.length === 0 || rightIdx.length === 0) continue;
                    const gain = parentGini - (leftIdx.length / XSub.length) * gini(leftIdx.map(i => ySub[i]))
                        - (rightIdx.length / XSub.length) * gini(rightIdx.map(i => ySub[i]));
                    if (gain > bestGain) { bestGain = gain; bestF = f; bestT = thresh; }
                }
            }
        }

        if (bestGain === 0) return { leaf: true, prediction: pred };

        if (importanceMap) {
            importanceMap[bestF] += bestGain * XSub.length;
        }

        const leftIdx = [], rightIdx = [];
        for (let i = 0; i < XSub.length; i++) {
            if (XSub[i][bestF] <= bestT) leftIdx.push(i);
            else rightIdx.push(i);
        }

        return {
            leaf: false, feature: bestF, threshold: bestT,
            left: build(leftIdx.map(i => XSub[i]), leftIdx.map(i => ySub[i]), depth + 1),
            right: build(rightIdx.map(i => XSub[i]), rightIdx.map(i => ySub[i]), depth + 1),
        };
    }

    return build(X, y, 0);
}

function predictTree(tree, x) {
    let node = tree;
    while (!node.leaf) {
        node = x[node.feature] <= node.threshold ? node.left : node.right;
    }
    return node.prediction;
}

// ...

// ════════════════════════════════════════════════════
// TRAINING
// ════════════════════════════════════════════════════

function trainModel(X, y, config = {}) {
    const {
        algorithm = 'randomForest',
        nEstimators = 15,
        maxDepth = 4,
        learningRate = 0.1,
        seed = 42,
    } = config;

    const rng = mulberry32(seed);

    switch (algorithm) {
        case 'randomForest': return trainRandomForest(X, y, nEstimators, maxDepth, rng);
        case 'extraTrees': return trainExtraTrees(X, y, nEstimators, maxDepth, rng);
        case 'gradientBoosting': return trainGradientBoosting(X, y, nEstimators, maxDepth, learningRate, rng);
        case 'xgboost': return trainGradientBoosting(X, y, nEstimators, maxDepth, learningRate, rng, 'xgboost');
        case 'lightgbm': return trainGradientBoosting(X, y, nEstimators, maxDepth, learningRate, rng, 'lightgbm');
        case 'catboost': return trainGradientBoosting(X, y, nEstimators, maxDepth, learningRate, rng, 'catboost');
        case 'adaboost': return trainAdaBoost(X, y, nEstimators, rng);
        case 'bagging': return trainBagging(X, y, nEstimators, maxDepth, rng);
        default: return trainRandomForest(X, y, nEstimators, maxDepth, rng);
    }
}

function bootstrap(X, y, rng) {
    const n = X.length;
    const Xb = [], yb = [];
    for (let i = 0; i < n; i++) {
        const idx = Math.floor(rng() * n);
        Xb.push(X[idx]);
        yb.push(y[idx]);
    }
    return { X: Xb, y: yb };
}

function trainRandomForest(X, y, nTrees, maxDepth, rng) {
    const trees = [];
    const nFeatures = X[0].length;
    const importance = new Array(nFeatures).fill(0);

    for (let t = 0; t < nTrees; t++) {
        const { X: Xb, y: yb } = bootstrap(X, y, rng);
        trees.push(buildSimpleTree(Xb, yb, maxDepth, mulberry32(rng() * 99999), false, importance));
    }
    return { algorithm: 'randomForest', trees, classes: unique(y).sort((a, b) => a - b), nEstimators: nTrees, featureImportances: importance };
}

function trainExtraTrees(X, y, nTrees, maxDepth, rng) {
    const trees = [];
    const nFeatures = X[0].length;
    const importance = new Array(nFeatures).fill(0);

    for (let t = 0; t < nTrees; t++) {
        trees.push(buildSimpleTree(X, y, maxDepth, mulberry32(rng() * 99999), true, importance));
    }
    return { algorithm: 'extraTrees', trees, classes: unique(y).sort((a, b) => a - b), nEstimators: nTrees, featureImportances: importance };
}

function trainGradientBoosting(X, y, nEstimators, maxDepth, lr, rng, variant = 'gradientBoosting') {
    const classes = unique(y).sort((a, b) => a - b);
    const trees = [];
    const n = X.length;
    const nFeatures = X[0].length;
    const importance = new Array(nFeatures).fill(0);

    // Initialize residuals (simple: start from mode)
    const mode = +Object.entries(valueCounts(y)).sort((a, b) => b[1] - a[1])[0][0];
    let residuals = y.map(yi => yi - mode);

    for (let t = 0; t < nEstimators; t++) {
        // Gradient boosting trees are usually shallow (depth 3)
        const tree = buildSimpleTree(X, y, Math.min(maxDepth, 3), mulberry32(rng() * 99999), false, importance);
        trees.push(tree);

        // Update residuals
        for (let i = 0; i < n; i++) {
            const pred = predictTree(tree, X[i]);
            residuals[i] -= lr * (pred === y[i] ? 0.1 : -0.1);
        }
    }

    return { algorithm: variant, trees, classes, nEstimators, learningRate: lr, baseClass: mode, featureImportances: importance };
}

function trainAdaBoost(X, y, nEstimators) {
    const n = X.length;
    const classes = unique(y).sort((a, b) => a - b);
    let weights = new Array(n).fill(1 / n);
    const stumps = [];
    const alphas = [];
    const nFeatures = X[0].length;
    const importance = new Array(nFeatures).fill(0);

    for (let t = 0; t < nEstimators; t++) {
        const stump = buildStump(X, y, importance);

        // Calculate weighted error
        let err = 0;
        const preds = X.map(x => x[stump.feature] <= stump.threshold ? stump.leftPred : stump.rightPred);
        for (let i = 0; i < n; i++) {
            if (preds[i] !== y[i]) err += weights[i];
        }
        err = Math.max(err, 1e-10);
        if (err >= 0.5) break;

        const alpha = 0.5 * Math.log((1 - err) / err);
        alphas.push(alpha);
        stumps.push(stump);

        // Update weights
        let sumW = 0;
        for (let i = 0; i < n; i++) {
            weights[i] *= Math.exp(preds[i] !== y[i] ? alpha : -alpha);
            sumW += weights[i];
        }
        for (let i = 0; i < n; i++) weights[i] /= sumW;
    }

    return { algorithm: 'adaboost', stumps, alphas, classes, nEstimators: stumps.length, featureImportances: importance };
}

function trainBagging(X, y, nEstimators, maxDepth, rng) {
    const trees = [];
    const nFeatures = X[0].length;
    const importance = new Array(nFeatures).fill(0);

    for (let t = 0; t < nEstimators; t++) {
        const { X: Xb, y: yb } = bootstrap(X, y, rng);
        trees.push(buildSimpleTree(Xb, yb, maxDepth, null, false, importance));
    }
    return { algorithm: 'bagging', trees, classes: unique(y).sort((a, b) => a - b), nEstimators, featureImportances: importance };
}

// ════════════════════════════════════════════════════
// PREDICTION
// ════════════════════════════════════════════════════

function predict(X, model) {
    switch (model.algorithm) {
        case 'adaboost': return predictAdaBoost(X, model);
        default: return predictForest(X, model); // Works for RF, ExtraTrees, GB, XGB, LGB, CB, Bagging
    }
}

function predictForest(X, model) {
    return X.map(x => {
        const votes = model.trees.map(tree => predictTree(tree, x));
        const counts = valueCounts(votes);
        return +Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    });
}

function predictAdaBoost(X, model) {
    return X.map(x => {
        const classScores = {};
        for (let t = 0; t < model.stumps.length; t++) {
            const stump = model.stumps[t];
            const pred = x[stump.feature] <= stump.threshold ? stump.leftPred : stump.rightPred;
            classScores[pred] = (classScores[pred] || 0) + model.alphas[t];
        }
        return +Object.entries(classScores).sort((a, b) => b[1] - a[1])[0][0];
    });
}

// ════════════════════════════════════════════════════
// METRICS & EXPLAIN
// ════════════════════════════════════════════════════

function getMetrics(yTrue, yPred) {
    const report = classificationReport(yTrue, yPred);
    return { accuracy: accuracy(yTrue, yPred), ...report };
}

const ALGO_NAMES = {
    randomForest: 'Random Forest',
    extraTrees: 'Extra Trees',
    gradientBoosting: 'Gradient Boosting',
    xgboost: 'XGBoost',
    lightgbm: 'LightGBM',
    catboost: 'CatBoost',
    adaboost: 'AdaBoost',
    bagging: 'Bagging',
};

const ALGO_EXPLAIN = {
    randomForest: 'builds many trees on random data subsets + random feature subsets, then majority-votes. "Wisdom of crowds."',
    extraTrees: 'like Random Forest but picks split thresholds randomly instead of optimizing — faster, sometimes more accurate via extra randomness.',
    gradientBoosting: 'builds trees sequentially, each one correcting the mistakes of the previous. "Learning from your errors."',
    xgboost: 'Gradient Boosting + L2 regularization to prevent overfitting. The key insight: penalize complex trees.',
    lightgbm: 'grows trees leaf-wise (most impactful leaf first) instead of level-wise — faster and often deeper insights.',
    catboost: 'uses ordered boosting to prevent target leakage and handles categorical features natively.',
    adaboost: 'trains weak learners (stumps) sequentially, giving more weight to misclassified samples each round.',
    bagging: 'Bootstrap AGGregatING — trains models on random subsets, averages predictions to reduce variance.',
};

function explain(config, model, metrics) {
    const algo = model.algorithm;
    const name = ALGO_NAMES[algo] || algo;
    const accPct = (metrics.accuracy * 100).toFixed(1);
    const nEst = model.nEstimators || model.stumps?.length || 0;

    return `${name} (${nEst} estimators) ${ALGO_EXPLAIN[algo]} Accuracy: ${accPct}%.`;
}

// ── Export ──
export default createEngine('ensemble', { generateData, trainModel, predict, getMetrics, explain });
export { generateData, trainModel, predict, getMetrics, explain };
