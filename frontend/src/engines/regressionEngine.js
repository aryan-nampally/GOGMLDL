/**
 * Regression Engine — Linear, Ridge, Lasso, Elastic Net.
 *
 * All 4 variants share generateData, predict, getMetrics, explain.
 * Only trainModel differs based on regularization type.
 *
 * Uses the baseEngine template + mlUtils math library.
 */
import { createEngine } from './baseEngine';
import {
    mulberry32, normalRandom,
    mean,
    matTranspose, matMul, matAdd, matScale, matIdentity, matVecMul, matInverse,
    r2Score, mse, rmse,
} from './mlUtils';

// ── Data Generation ──
function generateData(config = {}) {
    const {
        nSamples = 50,
        noise = 15,
        slope = 2.5,
        intercept = 0,
        seed = 42,
    } = config;

    const rng = mulberry32(seed);
    const X = [];
    const y = [];
    for (let i = 0; i < nSamples; i++) {
        const x = rng() * 10;
        const yVal = slope * x + intercept + normalRandom(rng) * noise;
        X.push(x);
        y.push(yVal);
    }
    return { X, y };
}

// ── Training (supports 4 regression types) ──
function trainModel(X, y, config = {}) {
    const {
        algorithm = 'linear',   // 'linear' | 'ridge' | 'lasso' | 'elasticnet'
        lambda = 1.0,            // Regularization strength
        l1Ratio = 0.5,           // Elastic Net: 0 = pure Ridge, 1 = pure Lasso
        maxIter = 1000,          // For iterative methods (Lasso, Elastic Net)
        tol = 1e-6,              // Convergence tolerance
    } = config;

    switch (algorithm) {
        case 'linear':
            return fitOLS(X, y);
        case 'ridge':
            return fitRidge(X, y, lambda);
        case 'lasso':
            return fitLasso(X, y, lambda, maxIter, tol);
        case 'elasticnet':
            return fitElasticNet(X, y, lambda, l1Ratio, maxIter, tol);
        default:
            return fitOLS(X, y);
    }
}

/** OLS Closed-form: β = (X'X)⁻¹ X'y */
function fitOLS(X, y) {
    const n = X.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
        sumX += X[i];
        sumY += y[i];
        sumXY += X[i] * y[i];
        sumX2 += X[i] * X[i];
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    return { slope, intercept, algorithm: 'linear', coefficients: [intercept, slope] };
}

/** Ridge: β = (X'X + λI)⁻¹ X'y — Closed-form with L2 penalty */
function fitRidge(X, y, lambda) {
    // Build design matrix [1, x] (with bias column)
    const Xmat = X.map((x) => [1, x]);
    const Xt = matTranspose(Xmat);
    const XtX = matMul(Xt, Xmat);

    // Add λI to XtX (don't regularize intercept — index 0)
    const penalty = matScale(matIdentity(2), lambda);
    penalty[0][0] = 0; // Don't penalize intercept
    const XtX_reg = matAdd(XtX, penalty);

    // Xty
    const Xty = matVecMul(Xt, y);

    // Solve
    const inv = matInverse(XtX_reg);
    if (!inv) return fitOLS(X, y); // fallback
    const beta = matVecMul(inv, Xty);

    return {
        slope: beta[1],
        intercept: beta[0],
        algorithm: 'ridge',
        lambda,
        coefficients: beta,
    };
}

/** Lasso: Coordinate Descent with L1 penalty */
function fitLasso(X, y, lambda, maxIter = 1000, tol = 1e-6) {
    const n = X.length;
    const meanX = mean(X);
    const meanY = mean(y);

    // Center data
    const Xc = X.map((x) => x - meanX);
    const Yc = y.map((yi) => yi - meanY);

    let slope = 0;

    // Precompute
    const sumX2 = Xc.reduce((s, x) => s + x * x, 0);

    for (let iter = 0; iter < maxIter; iter++) {
        const prevSlope = slope;

        // Compute residual without current feature
        const rho = Xc.reduce((s, x, i) => s + x * (Yc[i] - 0), 0); // residual dot

        // Soft threshold
        if (rho < -lambda * n / 2) {
            slope = (rho + lambda * n / 2) / sumX2;
        } else if (rho > lambda * n / 2) {
            slope = (rho - lambda * n / 2) / sumX2;
        } else {
            slope = 0;
        }

        // Check convergence
        if (Math.abs(slope - prevSlope) < tol) break;
    }

    const intercept = meanY - slope * meanX;

    return {
        slope,
        intercept,
        algorithm: 'lasso',
        lambda,
        coefficients: [intercept, slope],
        featureSelected: slope !== 0,
    };
}

/** Elastic Net: Coordinate Descent with L1 + L2 penalty */
function fitElasticNet(X, y, lambda, l1Ratio = 0.5, maxIter = 1000, tol = 1e-6) {
    const n = X.length;
    const meanX = mean(X);
    const meanY = mean(y);

    const Xc = X.map((x) => x - meanX);
    const Yc = y.map((yi) => yi - meanY);

    let slope = 0;
    const sumX2 = Xc.reduce((s, x) => s + x * x, 0);
    const l1 = lambda * l1Ratio;
    const l2 = lambda * (1 - l1Ratio);

    for (let iter = 0; iter < maxIter; iter++) {
        const prevSlope = slope;

        const rho = Xc.reduce((s, x, i) => s + x * Yc[i], 0);

        // Soft threshold with L2 in denominator
        const denom = sumX2 + l2 * n;
        if (rho < -l1 * n / 2) {
            slope = (rho + l1 * n / 2) / denom;
        } else if (rho > l1 * n / 2) {
            slope = (rho - l1 * n / 2) / denom;
        } else {
            slope = 0;
        }

        if (Math.abs(slope - prevSlope) < tol) break;
    }

    const intercept = meanY - slope * meanX;

    return {
        slope,
        intercept,
        algorithm: 'elasticnet',
        lambda,
        l1Ratio,
        coefficients: [intercept, slope],
        featureSelected: slope !== 0,
    };
}

// ── Prediction ──
function predict(X, model) {
    return X.map((x) => model.slope * x + model.intercept);
}

// ── Metrics ──
function getMetrics(y, yPred) {
    return {
        r2: r2Score(y, yPred),
        mse: mse(y, yPred),
        rmse: rmse(y, yPred),
    };
}

// ── Human-Readable Explanation ──
function explain(config, model, metrics) {
    const algo = model.algorithm || config.algorithm || 'linear';
    const slopeDir = model.slope > 0 ? 'increases' : 'decreases';
    const slopeAbs = Math.abs(model.slope).toFixed(2);
    const r2Pct = (metrics.r2 * 100).toFixed(1);

    let quality;
    if (metrics.r2 > 0.95) quality = 'excellent';
    else if (metrics.r2 > 0.85) quality = 'strong';
    else if (metrics.r2 > 0.7) quality = 'moderate';
    else if (metrics.r2 > 0.5) quality = 'weak';
    else quality = 'very weak';

    const lines = [];

    // Algorithm-specific explanation
    const algoNames = {
        linear: 'Linear Regression (OLS)',
        ridge: `Ridge Regression (λ=${model.lambda?.toFixed(2)})`,
        lasso: `Lasso Regression (λ=${model.lambda?.toFixed(2)})`,
        elasticnet: `Elastic Net (λ=${model.lambda?.toFixed(2)}, L1 ratio=${model.l1Ratio?.toFixed(2)})`,
    };

    lines.push(`${algoNames[algo]} found a slope of ${model.slope.toFixed(2)}, meaning each unit increase in X ${slopeDir} Y by ${slopeAbs}.`);

    // Regularization insight
    if (algo === 'ridge') {
        lines.push(`Ridge applied L2 regularization to shrink the coefficient — preventing overfitting by penalizing large weights.`);
    } else if (algo === 'lasso') {
        if (model.featureSelected === false) {
            lines.push(`⚡ Lasso's L1 penalty pushed the slope to exactly 0 — the model decided this feature isn't important enough (feature elimination).`);
        } else {
            lines.push(`Lasso's L1 penalty kept this feature but shrunk its coefficient. With more features, Lasso would zero out the weak ones.`);
        }
    } else if (algo === 'elasticnet') {
        lines.push(`Elastic Net combined L1 (sparsity) + L2 (shrinkage) at a ${((model.l1Ratio || 0.5) * 100).toFixed(0)}/${((1 - (model.l1Ratio || 0.5)) * 100).toFixed(0)} mix.`);
    }

    // Fit quality
    if (config.noise > 20) {
        lines.push(`High noise (${config.noise}) made the signal hard to find — ${quality} fit with R²=${r2Pct}%.`);
    } else if (config.noise < 5) {
        lines.push(`Low noise revealed a clear pattern — ${quality} fit with R²=${r2Pct}%.`);
    } else {
        lines.push(`The model explains ${r2Pct}% of variance — a ${quality} fit.`);
    }

    if (config.nSamples < 20) {
        lines.push(`⚠️ Only ${config.nSamples} samples — results may be unreliable.`);
    }

    return lines.join(' ');
}

// ── Export as validated engine ──
export default createEngine('regression', {
    generateData,
    trainModel,
    predict,
    getMetrics,
    explain,
});

// Also export individual functions for backward compatibility
export { generateData, trainModel, predict, getMetrics, explain };
