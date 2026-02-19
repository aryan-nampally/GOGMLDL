/**
 * Base Engine Template — Abstract factory for all ML engines.
 *
 * Every ML module in ML ATLAS follows this contract:
 *   generateData(config)          → { X, y } or { X, labels }
 *   trainModel(X, y, config)      → model object
 *   predict(X, model)             → predictions array
 *   getMetrics(yTrue, yPred, ...)  → metrics object
 *   explain(config, model, metrics) → human-readable string
 *
 * Usage:
 *   import { createEngine } from './baseEngine';
 *   export default createEngine({ generateData, trainModel, predict, getMetrics, explain });
 */

/**
 * @typedef {Object} StandardMLResult
 * @property {number[]} predictions - Array of predicted values or labels
 * @property {number[][]} [probabilities] - Array of probability arrays (for classification)
 * @property {Object} metrics - Key performance metrics
 * @property {number} [metrics.accuracy]
 * @property {number} [metrics.precision]
 * @property {number} [metrics.recall]
 * @property {number} [metrics.f1]
 * @property {number} [metrics.r2]
 * @property {number} [metrics.mse]
 * @property {number} [metrics.rmse]
 * @property {number} [metrics.mae]
 * @property {number} [metrics.silhouette]
 * @property {Object} modelParams - Trained model parameters (weights, centroids, trees, etc.)
 * @property {Object} [debug] - internal state for educational visualization (e.g. iterations)
 * @property {Object} visualizationData - Structure-agnostic data for UI rendering
 */

const REQUIRED_METHODS = ['generateData', 'trainModel', 'predict', 'getMetrics', 'explain'];

/**
 * Create a validated engine from a config object.
 * Throws at import-time if any required method is missing — fail fast.
 *
 * @param {string} name — Engine name for error messages
 * @param {object} methods — Object with the 5 required methods
 * @returns {object} Frozen engine object
 */
export function createEngine(name, methods) {
    // Validate all required methods exist
    for (const method of REQUIRED_METHODS) {
        if (typeof methods[method] !== 'function') {
            throw new Error(
                `[${name}Engine] Missing required method: "${method}". ` +
                `All engines must implement: ${REQUIRED_METHODS.join(', ')}`
            );
        }
    }

    // Return a frozen engine — immutable, no accidental mutation
    return Object.freeze({
        name,
        ...methods,
    });
}

/**
 * Executes a machine learning pipeline (Generate -> Train -> Predict -> Evaluate).
 * Enforces StandardMLResult schema.
 * 
 * @param {Object} engine - The ML engine (regression, classification, etc.)
 * @param {Object} config - Hyperparameters and configuration
 * @returns {StandardMLResult & Object} - Standardized result merged with legacy properties for backward compatibility
 */
export function runPipeline(engine, config) {
    const { generateData, trainModel, predict, getMetrics, explain } = engine;

    // 1. Generate Data
    const data = generateData(config);

    // 2. Train Model
    const model = trainModel(data.X, data.y, config);

    // 3. Predict
    // Some engines might return { predictions, probabilities } or just predictions
    const rawPredictions = predict(data.X, model);
    const predictions = Array.isArray(rawPredictions) ? rawPredictions : rawPredictions.predictions;
    const probabilities = !Array.isArray(rawPredictions) && rawPredictions.probabilities ? rawPredictions.probabilities : undefined;

    // 4. Evaluate
    const metricResults = getMetrics(data.y, predictions, data);
    // Some evaluate() functions return { metrics, summary } or just metrics
    const metrics = metricResults.metrics || metricResults;

    // 5. Explain
    const summary = explain(config, model, metrics);

    // 6. Construct Standard Result
    const standardResult = {
        predictions,
        probabilities,
        metrics,
        modelParams: model,
        visualizationData: {
            X: data.X,
            y: data.y,
            ...model // fallback: include model data in viz data
        },
        // Legacy support stuff (to be deprecated)
        data,
        model,
        summary,
    };

    return standardResult;
}
