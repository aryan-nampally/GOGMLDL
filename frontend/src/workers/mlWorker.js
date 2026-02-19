import { runPipeline } from '../engines/baseEngine';
import reductionEngine from '../engines/reductionEngine';
import ensembleEngine from '../engines/ensembleEngine';
import anomalyEngine from '../engines/anomalyEngine';
import clusteringEngine from '../engines/clusteringEngine';

const ENGINES = {
    reduction: reductionEngine,
    ensemble: ensembleEngine,
    anomaly: anomalyEngine,
    clustering: clusteringEngine,
};

self.onmessage = (e) => {
    const { id, type, config } = e.data;
    try {
        const engine = ENGINES[type];
        if (!engine) throw new Error(`Unknown engine type: ${type}`);

        // Run the full pipeline (Generate -> Train -> Predict -> Evaluate)
        // This returns a StandardMLResult object
        const result = runPipeline(engine, config);

        self.postMessage({ id, status: 'success', result });
    } catch (error) {
        self.postMessage({ id, status: 'error', error: error.message });
    }
};
