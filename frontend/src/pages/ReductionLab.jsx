/**
 * ReductionLab — PCA & t-SNE interactive lab.
 */
import { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocus } from '../context/FocusContext';
import { PAGE_TRANSITION, STEP_SWITCH, REVEAL, POP } from '../utils/motion';
import TeachingFrame from '../components/TeachingFrame';
import LearningJourney from '../components/LearningJourney';
import './ReductionLab.css';

const EmbeddingChart = lazy(() => import('../components/MLCharts').then(m => ({ default: m.EmbeddingChart })));
const VarianceChart = lazy(() => import('../components/MLCharts').then(m => ({ default: m.VarianceChart })));
const SnapshotCompare = lazy(() => import('../components/SnapshotCompare'));
const ChartLoader = () => (
    <div style={{ height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading chart…</div>
);

const ALGORITHMS = [
    { id: 'pca', label: 'PCA', color: '#4F8BF9', desc: 'Find axes of maximum variance' },
    { id: 'tsne', label: 't-SNE', color: '#EC4899', desc: 'Preserve local neighborhood structure' },
];

const STEPS = [
    { label: 'Understand', icon: '💡' },
    { label: 'Experiment', icon: '🧪' },
    { label: 'Results', icon: '📊' },
];

const STORY_BEATS = [
    {
        title: 'Understand why compression matters',
        text: 'Build intuition for high-dimensional complexity and why projection helps downstream ML.',
    },
    {
        title: 'Control projection behavior',
        text: 'Adjust dimensions and perplexity to shape what local and global structures are preserved.',
    },
    {
        title: 'Interpret the map carefully',
        text: 'Read explained variance and embeddings without over-claiming what 2D patterns mean.',
    },
];

export default function ReductionLab() {
    const [step, setStep] = useState(0);
    const { enterFocus, exitFocus } = useFocus();
    const [explainMode, setExplainMode] = useState(true);

    const [algorithm, setAlgorithm] = useState('pca');
    const [nSamples, setNSamples] = useState(100);
    const [nFeatures, setNFeatures] = useState(5);
    const [perplexity, setPerplexity] = useState(30);
    const [dataShape, setDataShape] = useState('blobs');

    const config = useMemo(() => ({
        nSamples, nClasses: 3, nFeatures, spread: 1.5,
        algorithm, nComponents: 2, perplexity, maxIter: 200, learningRate: 100, dataShape, seed: 42,
    }), [nSamples, nFeatures, algorithm, perplexity, dataShape]);

    const [results, setResults] = useState(null);
    const [isComputing, setIsComputing] = useState(false);
    const [conceptStep, setConceptStep] = useState(0);

    const conceptCards = [
        {
            title: '📐 PCA',
            background: 'High-dimensional features are often correlated and redundant.',
            what: 'PCA rotates data to principal axes and projects onto top components.',
            why: 'You keep most useful variation while simplifying representation.',
            how: 'Compute covariance → principal components → project onto top axes.',
            tryThis: 'Increase original dimensions and inspect explained variance chart.',
        },
        {
            title: '🗺️ t-SNE',
            background: 'Linear projections can miss local manifold structure.',
            what: 't-SNE preserves neighborhood relationships in a 2D map.',
            why: 'It reveals clusters and local groups that linear methods may hide.',
            how: 'Model pairwise similarities, then optimize low-D map to match them.',
            tryThis: 'Change perplexity and observe local-vs-global clustering changes.',
        },
        {
            title: '📉 Variance Explained',
            background: 'You need a quantitative way to justify dimensionality reduction.',
            what: 'Variance explained measures information retained by components.',
            why: 'It helps choose minimum dimensions before quality drops too much.',
            how: 'Accumulate component ratios until reaching your target retention.',
            tryThis: 'Try to keep >80% variance and note resulting component count.',
        },
        {
            title: '🎯 Curse of Dimensionality',
            background: 'As dimensions grow, distance-based intuition weakens quickly.',
            what: 'The curse describes sparse spaces where neighborhoods lose meaning.',
            why: 'Many ML algorithms degrade when high-D geometry becomes noisy.',
            how: 'Reduce dimensionality and re-map data to restore useful structure.',
            tryThis: 'Compare clustering behavior before/after projection in your mind.',
        },
    ];

    // Compute in background to avoid freezing UI
    useEffect(() => {
        setIsComputing(true);
        const worker = new Worker(new URL('../workers/mlWorker.js', import.meta.url), { type: 'module' });

        worker.postMessage({ type: 'reduction', config });

        worker.onmessage = (e) => {
            if (e.data.status === 'success') {
                const r = e.data.result;
                // Map StandardMLResult to lab-specific legacy keys
                setResults({
                    ...r,
                    X: r.data.X,
                    y: r.data.y,
                    projected: r.predictions, // Reduction engine predicts projection
                    model: r.modelParams || r.model
                });
            } else {
                console.error('Worker error:', e.data.error);
            }
            setIsComputing(false);
        };

        worker.onerror = (err) => {
            console.error('Worker error:', err);
            setIsComputing(false);
        };

        return () => worker.terminate();
    }, [config]);

    // Initial load state or if results are still null
    if (!results && isComputing) {
        return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Initializing Worker...</div>;
    }
    // If we have results, proceed (step logic handles content)

    const handleStepChange = (n) => { if (n <= step) { setStep(n); n === 1 ? enterFocus() : exitFocus(); } };
    const handleGoNext = () => { if (step < 2) { const n = step + 1; setStep(n); n === 1 ? enterFocus() : exitFocus(); } };

    return (
        <motion.div className="reduction-page" variants={PAGE_TRANSITION} initial="initial" animate="animate" exit="exit">
            <div className="lab-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div><h1 className="gradient-text">Dimensionality Reduction Lab</h1><p style={{ color: 'var(--text-secondary)', margin: '4px 0 0' }}>Compress high-D data into 2D while preserving structure</p></div>
                    <div className={`explain-badge ${explainMode ? 'on' : 'off'}`} onClick={() => setExplainMode(!explainMode)}>{explainMode ? '💡 ON' : '💡 OFF'}</div>
                </div>
                <div className="algo-selector" style={{ marginTop: 16 }}>
                    {ALGORITHMS.map(a => (
                        <button key={a.id} className={`algo-pill ${algorithm === a.id ? 'active' : ''}`} style={{ '--pill-color': a.color }} onClick={() => setAlgorithm(a.id)}>{a.label}</button>
                    ))}
                </div>
            </div>

            <div className="step-indicator">
                {STEPS.map((s, i) => (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'center' }}>
                        <div className={`step-dot ${i === step ? 'active' : ''} ${i < step ? 'completed' : ''}`} onClick={() => handleStepChange(i)} style={{ cursor: i <= step ? 'pointer' : 'default' }}>
                            <span>{s.icon}</span><span>{s.label}</span>
                        </div>
                        {i < STEPS.length - 1 && <div className={`step-connector ${i < step ? 'completed' : ''}`} />}
                    </div>
                ))}
            </div>

            <LearningJourney step={step} steps={STEPS} beats={STORY_BEATS} />

            <motion.div key={step} {...STEP_SWITCH}>
                {step === 0 && (
                    <div className="step-content">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={conceptStep}
                                className="glass-card concept-card-item"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.25 }}
                            >
                                    <TeachingFrame
                                        title={`${conceptCards[conceptStep].title} — Beginner Lens`}
                                        background={conceptCards[conceptStep].background}
                                        what={conceptCards[conceptStep].what}
                                        why={conceptCards[conceptStep].why}
                                        how={conceptCards[conceptStep].how}
                                        tryThis={conceptCards[conceptStep].tryThis}
                                    />
                                <div style={{ marginTop: 14, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                    Concept {conceptStep + 1} / {conceptCards.length}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                        <div className="step-actions" style={{ justifyContent: 'space-between' }}>
                            <button className="btn btn-ghost" onClick={() => setConceptStep((c) => Math.max(0, c - 1))} disabled={conceptStep === 0}>
                                ← Previous
                            </button>
                            <button className="btn btn-ghost" onClick={() => setConceptStep((c) => Math.min(conceptCards.length - 1, c + 1))} disabled={conceptStep === conceptCards.length - 1}>
                                Next Concept →
                            </button>
                        </div>
                        <div className="step-actions"><button className="btn btn-primary" onClick={handleGoNext}>Next → Experiment 🧪</button></div>
                    </div>
                )}

                {step === 1 && (
                    <div className="step-content">
                        <h2>Configure</h2>
                        <div className="config-grid">
                            <div className="config-section">
                                <label className="config-label">Samples: <strong>{nSamples}</strong></label>
                                <input type="range" min="30" max="200" step="10" value={nSamples} onChange={e => setNSamples(+e.target.value)} />
                            </div>
                            <div className="config-section">
                                <label className="config-label">Data Shape</label>
                                <div className="shape-selector">
                                    {['blobs', 'moons', 'circles', 'spirals'].map(s => (
                                        <button key={s} className={`shape-pill ${dataShape === s ? 'active' : ''}`} onClick={() => setDataShape(s)}>{s}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="config-section">
                                <label className="config-label">Original Dimensions: <strong>{nFeatures}</strong></label>
                                <input type="range" min="3" max="20" step="1" value={nFeatures} onChange={e => setNFeatures(+e.target.value)} />
                                {explainMode && <span className="reg-hint">More dimensions = more info to compress</span>}
                            </div>
                            {algorithm === 'tsne' && (
                                <div className="config-section">
                                    <label className="config-label">Perplexity: <strong>{perplexity}</strong></label>
                                    <input type="range" min="5" max="50" step="5" value={perplexity} onChange={e => setPerplexity(+e.target.value)} />
                                    {explainMode && <span className="reg-hint">Controls neighborhood size — higher = global, lower = local structure</span>}
                                </div>
                            )}
                        </div>
                        <div className="step-actions"><button className="btn btn-primary" onClick={handleGoNext}>Next → See Embedding 📊</button></div>
                    </div>
                )}

                {step === 2 && (
                    <div className="step-content">
                        <h2>Embedding Results</h2>
                        <motion.div {...REVEAL} className="insight-card" style={{ marginBottom: 24 }}>
                            <div className="insight-label">What Just Happened?</div>
                            {results.summary}
                        </motion.div>

                        {algorithm === 'pca' && results.model.explainedRatio && (
                            <div style={{ marginTop: 20 }}>
                                <Suspense fallback={<ChartLoader />}>
                                    <VarianceChart explained={results.model.explainedRatio} />
                                </Suspense>
                            </div>
                        )}

                        {/* Snapshot Compare */}
                        <div style={{ marginTop: 24 }}>
                            <Suspense fallback={null}>
                                <SnapshotCompare
                                    labId="reduction"
                                    currentConfig={config}
                                    currentMetrics={results.metrics}
                                />
                            </Suspense>
                        </div>

                        <div className="glass-card" style={{ padding: 16, marginTop: 24 }}>
                            <Suspense fallback={<ChartLoader />}>
                                <EmbeddingChart projected={results.projected} labels={results.y} />
                            </Suspense>
                        </div>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}


