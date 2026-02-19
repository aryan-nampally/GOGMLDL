/**
 * EnsembleLab — Interactive lab for 8 ensemble methods.
 */
import { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { useFocus } from '../context/FocusContext';
import { PAGE_TRANSITION, STEP_SWITCH, REVEAL, POP } from '../utils/motion';
import TeachingFrame from '../components/TeachingFrame';
import LearningJourney from '../components/LearningJourney';
import './EnsembleLab.css';

const EnsembleChart = lazy(() => import('../components/MLCharts').then(m => ({ default: m.EnsembleChart })));
const FeatureImportanceChart = lazy(() => import('../components/MLCharts').then(m => ({ default: m.FeatureImportanceChart })));
const SnapshotCompare = lazy(() => import('../components/SnapshotCompare'));
const ChartLoader = () => (
    <div style={{ height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading chart…</div>
);

const ALGORITHMS = [
    { id: 'randomForest', label: 'Random Forest', color: '#06D6A0' },
    { id: 'extraTrees', label: 'Extra Trees', color: '#4F8BF9' },
    { id: 'gradientBoosting', label: 'Gradient Boost', color: '#9B5DE5' },
    { id: 'xgboost', label: 'XGBoost', color: '#F97316' },
    { id: 'lightgbm', label: 'LightGBM', color: '#EC4899' },
    { id: 'catboost', label: 'CatBoost', color: '#FBBF24' },
    { id: 'adaboost', label: 'AdaBoost', color: '#14B8A6' },
    { id: 'bagging', label: 'Bagging', color: '#8B5CF6' },
];

const STEPS = [
    { label: 'Understand', icon: '💡' },
    { label: 'Experiment', icon: '🧪' },
    { label: 'Results', icon: '📊' },
    { label: 'Challenge', icon: '🏆' },
];

const STORY_BEATS = [
    {
        title: 'From one weak learner to many',
        text: 'Learn why combining imperfect models can outperform any single model.',
    },
    {
        title: 'Engineer the ensemble',
        text: 'Tune estimators, depth, and learning rate to balance stability, bias, and compute cost.',
    },
    {
        title: 'Inspect collective intelligence',
        text: 'Use feature importance and metrics to see how and why the group prediction improved.',
    },
    {
        title: 'Apply ensemble judgment',
        text: 'Solve the challenge by selecting the right family and hyperparameters for robust performance.',
    },
];

export default function EnsembleLab() {
    const [step, setStep] = useState(0);
    const { awardXP, awardBadge } = useGame();
    const { enterFocus, exitFocus } = useFocus();
    const [explainMode, setExplainMode] = useState(true);

    const [algorithm, setAlgorithm] = useState('randomForest');
    const [nSamples, setNSamples] = useState(150);
    const [nEstimators, setNEstimators] = useState(15);
    const [maxDepth, setMaxDepth] = useState(4);
    const [learningRate, setLearningRate] = useState(0.1);
    const [dataShape, setDataShape] = useState('blobs');

    const config = useMemo(() => ({
        nSamples, nClasses: 3, spread: 1.2,
        algorithm, nEstimators, maxDepth, learningRate, dataShape, seed: 42,
    }), [nSamples, algorithm, nEstimators, maxDepth, learningRate, dataShape]);

    const [results, setResults] = useState(null);
    const [isComputing, setIsComputing] = useState(false);
    const [conceptStep, setConceptStep] = useState(0);

    const conceptCards = [
        {
            title: '🌲 Bagging (Bootstrap)',
            background: 'A single tree can be unstable. Small data changes can produce very different trees.',
            what: 'Bagging trains many trees on bootstrap samples and combines them.',
            why: 'Averaging reduces variance and improves reliability.',
            how: 'Sample with replacement → train many models → vote/average outputs.',
            tryThis: 'Increase estimator count and observe accuracy stability.',
        },
        {
            title: '📈 Boosting',
            background: 'Simple learners may underfit complex boundaries if used once.',
            what: 'Boosting builds learners sequentially, correcting prior mistakes.',
            why: 'Sequential correction reduces bias and captures harder patterns.',
            how: 'Train weak learner → weight errors/residuals → train next learner.',
            tryThis: 'Lower learning rate and compare with higher estimator count.',
        },
        {
            title: '🗳️ Voting',
            background: 'Different models make different mistakes on different regions.',
            what: 'Voting aggregates independent model decisions into one prediction.',
            why: 'Agreement among many learners is usually more robust than one model.',
            how: 'Collect predictions from each learner and choose majority class.',
            tryThis: 'Switch data shape to moons/spirals and compare ensemble behavior.',
        },
        {
            title: '⚡ XGBoost Family',
            background: 'Naive boosting can overfit and be computationally heavy at scale.',
            what: 'XGBoost-family methods add regularization + efficient optimization.',
            why: 'They often deliver top performance on tabular ML benchmarks.',
            how: 'Constrained tree growth, shrinkage, and optimized split search.',
            tryThis: 'Compare gradient boosting vs xgboost-style options on same config.',
        },
    ];

    useEffect(() => {
        setIsComputing(true);
        const worker = new Worker(new URL('../workers/mlWorker.js', import.meta.url), { type: 'module' });

        worker.postMessage({ type: 'ensemble', config });

        worker.onmessage = (e) => {
            if (e.data.status === 'success') {
                const r = e.data.result;
                setResults({
                    ...r,
                    X: r.data.X,
                    y: r.data.y,
                    yPred: r.predictions, // Ensemble uses yPred
                    model: r.modelParams || r.model
                });
            } else {
                console.error('Worker error:', e.data.error);
            }
            setIsComputing(false);
        };

        return () => worker.terminate();
    }, [config]);

    const handleStepChange = (n) => { if (n <= step) { setStep(n); n === 1 ? enterFocus() : exitFocus(); } };
    const handleGoNext = () => { if (step < 3) { const n = step + 1; setStep(n); n === 1 ? enterFocus() : exitFocus(); } };

    if (!results && isComputing) {
        return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Training Ensemble...</div>;
    }

    return (
        <motion.div className="ensemble-page" variants={PAGE_TRANSITION} initial="initial" animate="animate" exit="exit">
            <div className="lab-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <h1 className="gradient-text">Ensemble Lab</h1>
                        <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0' }}>Combine weak learners into powerful models</p>
                    </div>
                    <div className={`explain-badge ${explainMode ? 'on' : 'off'}`} onClick={() => setExplainMode(!explainMode)}>
                        {explainMode ? '💡 ON' : '💡 OFF'}
                    </div>
                </div>
                <div className="algo-selector" style={{ marginTop: 16 }}>
                    {ALGORITHMS.map(a => (
                        <button key={a.id} className={`algo-pill ${algorithm === a.id ? 'active' : ''}`}
                            style={{ '--pill-color': a.color }} onClick={() => setAlgorithm(a.id)}>{a.label}</button>
                    ))}
                </div>
            </div>

            <div className="step-indicator">
                {STEPS.map((s, i) => (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'center' }}>
                        <div className={`step-dot ${i === step ? 'active' : ''} ${i < step ? 'completed' : ''}`}
                            onClick={() => handleStepChange(i)} style={{ cursor: i <= step ? 'pointer' : 'default' }}>
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
                        <div className="step-actions">
                            <button className="btn btn-primary" onClick={handleGoNext}>Next → Experiment 🧪</button>
                        </div>
                    </div>
                )}

                {step === 1 && (
                    <div className="step-content">
                        <h2>Configure</h2>
                        <div className="config-grid">
                            <div className="config-section">
                                <label className="config-label">Samples: <strong>{nSamples}</strong></label>
                                <input type="range" min="50" max="300" step="10" value={nSamples} onChange={e => setNSamples(+e.target.value)} />
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
                                <label className="config-label">Estimators: <strong>{nEstimators}</strong></label>
                                <input type="range" min="3" max="50" step="1" value={nEstimators} onChange={e => setNEstimators(+e.target.value)} />
                                {explainMode && <span className="reg-hint">More trees = more stable but slower</span>}
                            </div>
                            <div className="config-section">
                                <label className="config-label">Max Depth: <strong>{maxDepth}</strong></label>
                                <input type="range" min="1" max="8" step="1" value={maxDepth} onChange={e => setMaxDepth(+e.target.value)} />
                            </div>
                            {['gradientBoosting', 'xgboost', 'lightgbm', 'catboost'].includes(algorithm) && (
                                <div className="config-section">
                                    <label className="config-label">Learning Rate: <strong>{learningRate.toFixed(2)}</strong></label>
                                    <input type="range" min="0.01" max="1" step="0.01" value={learningRate} onChange={e => setLearningRate(+e.target.value)} />
                                    {explainMode && <span className="reg-hint">Lower = more careful learning, needs more trees</span>}
                                </div>
                            )}
                        </div>
                        <div className="step-actions">
                            <button className="btn btn-primary" onClick={handleGoNext}>Next → Results 📊</button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="step-content">
                        <h2>Results</h2>
                        <motion.div {...REVEAL} className="insight-card" style={{ marginBottom: 24 }}>
                            <div className="insight-label">What Just Happened?</div>
                            {results.summary}
                        </motion.div>
                        <div className="grid-4" style={{ marginBottom: 24 }}>
                            <MetricCard value={(results.metrics.accuracy * 100).toFixed(1) + '%'} label="Accuracy" gradient />
                            <MetricCard value={(results.metrics.precision * 100).toFixed(1) + '%'} label="Precision" color="var(--purple)" />
                            <MetricCard value={(results.metrics.recall * 100).toFixed(1) + '%'} label="Recall" color="var(--emerald)" />
                            <MetricCard value={results.metrics.f1.toFixed(3)} label="F1 Score" color={results.metrics.f1 > 0.8 ? 'var(--emerald)' : 'var(--orange)'} />
                        </div>
                        <div className="charts-row" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 24, marginBottom: 24 }}>
                            <div className="glass-card" style={{ padding: 16 }}>
                                <Suspense fallback={<ChartLoader />}>
                                    <EnsembleChart X={results.X} y={results.y} yPred={results.yPred} title="Decision Boundary" />
                                </Suspense>
                            </div>
                            {results.model?.featureImportances && (
                                <div className="glass-card" style={{ padding: 16 }}>
                                    <Suspense fallback={<ChartLoader />}>
                                        <FeatureImportanceChart
                                            importances={results.model.featureImportances}
                                            featureNames={['Feature 1 (X)', 'Feature 2 (Y)']}
                                        />
                                    </Suspense>
                                </div>
                            )}
                        </div>

                        {/* Snapshot Compare */}
                        <div style={{ marginTop: 24 }}>
                            <Suspense fallback={null}>
                                <SnapshotCompare
                                    labId="ensemble"
                                    currentConfig={config}
                                    currentMetrics={results.metrics}
                                />
                            </Suspense>
                        </div>
                        <div className="step-actions">
                            <button className="btn btn-primary" onClick={handleGoNext}>Next → Challenge 🏆</button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="step-content">
                        <div className="challenge-card glass-card">
                            <h2>🏆 Ensemble Challenge</h2>
                            <p style={{ color: 'var(--text-secondary)', marginTop: 8, marginBottom: 20 }}>
                                Achieve <strong style={{ color: 'var(--emerald)' }}>95%+</strong> accuracy with any ensemble method.
                            </p>
                            <div className="challenge-r2">
                                <div className="challenge-r2-bar">
                                    <div className="challenge-r2-fill" style={{
                                        width: `${Math.min(results.metrics.accuracy * 100, 100)}%`,
                                        background: results.metrics.accuracy > 0.95 ? 'linear-gradient(90deg, var(--emerald), #04b88a)' : 'linear-gradient(90deg, var(--orange), var(--pink))',
                                    }} />
                                    <div className="challenge-r2-target" style={{ left: '95%' }} />
                                </div>
                            </div>
                            {results.metrics.accuracy > 0.95 && (
                                <motion.div {...POP} className="success-card" style={{ marginTop: 20 }}>
                                    <p><strong>🎉 Ensemble Master!</strong></p>
                                    <ChallengeUnlock awardBadge={awardBadge} awardXP={awardXP} badge="Ensemble Master" />
                                </motion.div>
                            )}
                            <div className="step-actions">
                                <button className="btn btn-ghost" onClick={() => handleStepChange(1)}>← Back to Experiment</button>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}

function MetricCard({ value, label, gradient, color }) {
    return (
        <div className="glass-card metric-card">
            <div className={`metric-value ${gradient ? 'gradient-text' : ''}`} style={color ? { color } : undefined}>{value}</div>
            <div className="metric-label">{label}</div>
        </div>
    );
}



function ChallengeUnlock({ awardBadge, awardXP, badge }) {
    const [awarded, setAwarded] = useState(false);
    if (!awarded) { setTimeout(() => { awardBadge(badge); awardXP(100, `${badge} Complete`); setAwarded(true); }, 500); }
    return null;
}
