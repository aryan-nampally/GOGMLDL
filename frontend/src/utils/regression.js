/**
 * Pure JS linear regression utilities (OLS closed-form).
 * No Python backend needed — fully client-side.
 */

export function linearRegression(X, y) {
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
    return { slope, intercept };
}

export function predict(X, slope, intercept) {
    return X.map((x) => slope * x + intercept);
}

export function rSquared(y, yPred) {
    const mean = y.reduce((a, b) => a + b, 0) / y.length;
    const ssRes = y.reduce((sum, yi, i) => sum + (yi - yPred[i]) ** 2, 0);
    const ssTot = y.reduce((sum, yi) => sum + (yi - mean) ** 2, 0);
    return ssTot === 0 ? 1 : 1 - ssRes / ssTot;
}

export function mse(y, yPred) {
    return y.reduce((sum, yi, i) => sum + (yi - yPred[i]) ** 2, 0) / y.length;
}

// Seeded pseudo-random number generator (mulberry32)
function mulberry32(seed) {
    return function () {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// Box-Muller transform for normal distribution
function normalRandom(rng) {
    const u1 = rng();
    const u2 = rng();
    return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

export function generateLinearData(
    nSamples = 50,
    noise = 15,
    slope = 2.5,
    intercept = 0,
    seed = 42
) {
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
