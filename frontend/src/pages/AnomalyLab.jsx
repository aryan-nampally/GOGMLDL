/**
 * AnomalyLab — Isolation Forest & LOF interactive lab.
 */
import { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { useFocus } from '../context/FocusContext';
import { PAGE_TRANSITION, STEP_SWITCH, REVEAL, POP } from '../utils/motion';
import TeachingFrame from '../components/TeachingFrame';
import LearningJourney from '../components/LearningJourney';
import './AnomalyLab.css';

const AnomalyChart = lazy(() => import('../components/MLCharts').then(m => ({ default: m.AnomalyChart })));
const SnapshotCompare = lazy(() => import('../components/SnapshotCompare'));
const ChartLoader = () => (
    <div style={{ height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading chart…</div>
);

const ALGORITHMS = [
    { id: 'isolationForest', label: 'Isolation Forest', color: '#06D6A0' },
    { id: 'lof', label: 'LOF', color: '#F97316' },
];

const STEPS = [
    { label: 'Understand', icon: '💡' },
    { label: 'Experiment', icon: '🧪' },
    { label: 'Results', icon: '📊' },
    { label: 'Challenge', icon: '🏆' },
];

const STORY_BEATS = [
    {
        title: 'Frame the anomaly detection problem',
        text: 'Understand why rare-event detection is different from normal classification tasks.',
    },
    {
        title: 'Tune sensitivity with intent',
        text: 'Adjust contamination and model parameters to balance false alarms against missed anomalies.',
    },
    {
        title: 'Measure what matters for rare events',
        text: 'Use precision, recall, and F1 to assess detector usefulness under imbalance.',
    },
    {
        title: 'Operationalize detection choices',
        text: 'Complete the challenge by choosing settings that align with business risk tolerance.',
    },
];

export default function AnomalyLab() {
    const [step, setStep] = useState(0);
    const { awardXP, awardBadge } = useGame();
    const { enterFocus, exitFocus } = useFocus();
    const [explainMode, setExplainMode] = useState(true);

    const [algorithm, setAlgorithm] = useState('isolationForest');
    const [nSamples, setNSamples] = useState(150);
    const [anomalyRatio, setAnomalyRatio] = useState(0.1);
    const [nEstimators, setNEstimators] = useState(50);
    const [k, setK] = useState(10);
    const [contamination, setContamination] = useState(0.1);
    const [dataShape, setDataShape] = useState('blobs');

    const config = useMemo(() => ({
        nSamples, anomalyRatio, algorithm, nEstimators, k, contamination, dataShape, seed: 42,
    }), [nSamples, anomalyRatio, algorithm, nEstimators, k, contamination, dataShape]);

    const [results, setResults] = useState(null);
    const [isComputing, setIsComputing] = useState(false);
    const [conceptStep, setConceptStep] = useState(0);

    const conceptCards = [
        {
            title: '🌲 Isolation Forest',
            background: 'Outliers are usually easier to isolate than dense normal regions.',
            what: 'Isolation Forest uses random splits and path length as anomaly signal.',
            why: 'It detects anomalies without needing strong distribution assumptions.',
            how: 'Build many random trees → compute average isolation depth per point.',
            tryThis: 'Increase contamination and watch precision/recall shift.',
        },
        {
            title: '📍 LOF (Local Outlier Factor)',
            background: 'Some anomalies are only anomalous relative to nearby points.',
            what: 'LOF compares local density of a point versus neighbor densities.',
            why: 'It catches contextual anomalies missed by global distance methods.',
            how: 'Compute k-neighborhood reachability density and density ratio.',
            tryThis: 'Change k and observe sensitivity of outlier labels.',
        },
        {
            title: '⚖️ Imbalance Problem',
            background: 'Most real datasets have far fewer anomalies than normal points.',
            what: 'Class imbalance means naive accuracy can look high but be useless.',
            why: 'Missing rare true anomalies is often costlier than overall accuracy.',
            how: 'Evaluate with precision, recall, and F1—not accuracy alone.',
            tryThis: 'Track F1 while tuning contamination and anomaly ratio.',
        },
        {
            title: '🎚️ Contamination Rate',
            background: 'Detectors need a threshold to separate normal points from outliers.',
            what: 'Contamination approximates expected anomaly percentage in data.',
            why: 'It calibrates sensitivity and controls false alarms vs misses.',
            how: 'Sort anomaly scores and cut based on contamination proportion.',
            tryThis: 'Set contamination near true anomaly ratio, then compare metrics.',
        },
    ];

    useEffect(() => {
        setIsComputing(true);
        const worker = new Worker(new URL('../workers/mlWorker.js', import.meta.url), { type: 'module' });

        worker.postMessage({ type: 'anomaly', config });

        worker.onmessage = (e) => {
            if (e.data.status === 'success') {
                const r = e.data.result;
                setResults({
                    ...r,
                    X: r.data.X,
                    y: r.data.y,
                    yPred: r.predictions, // Anomaly uses yPred
                    model: r.modelParams || r.model
                });
            } else {
                console.error('Worker error:', e.data.error);
            }
            setIsComputing(false);
        };

        return () => worker.terminate();
    }, [config]);

    if (!results && isComputing) {
        return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Detecting Anomalies...</div>;
    }
    const handleStepChange = (n) => { if (n <= step) { setStep(n); n === 1 ? enterFocus() : exitFocus(); } };
    const handleGoNext = () => { if (step < 3) { const n = step + 1; setStep(n); n === 1 ? enterFocus() : exitFocus(); } };

    return (
        <motion.div className="anomaly-page" variants={PAGE_TRANSITION} initial="initial" animate="animate" exit="exit">
            <div className="lab-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div><h1 className="gradient-text">Anomaly Detection Lab</h1><p style={{ color: 'var(--text-secondary)', margin: '4px 0 0' }}>Find the needle in the haystack 🔍</p></div>
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
                                <label className="config-label">Anomaly Ratio: <strong>{(anomalyRatio * 100).toFixed(0)}%</strong></label>
                                <input type="range" min="0.02" max="0.3" step="0.02" value={anomalyRatio} onChange={e => setAnomalyRatio(+e.target.value)} />
                            </div>
                            <div className="config-section">
                                <label className="config-label">Contamination: <strong>{(contamination * 100).toFixed(0)}%</strong></label>
                                <input type="range" min="0.01" max="0.3" step="0.01" value={contamination} onChange={e => setContamination(+e.target.value)} />
                                {explainMode && <span className="reg-hint">Match this to the actual anomaly ratio for best results</span>}
                            </div>
                            {algorithm === 'isolationForest' && (
                                <div className="config-section">
                                    <label className="config-label">Trees: <strong>{nEstimators}</strong></label>
                                    <input type="range" min="10" max="100" step="10" value={nEstimators} onChange={e => setNEstimators(+e.target.value)} />
                                </div>
                            )}
                            {algorithm === 'lof' && (
                                <div className="config-section">
                                    <label className="config-label">K (neighbors): <strong>{k}</strong></label>
                                    <input type="range" min="3" max="20" step="1" value={k} onChange={e => setK(+e.target.value)} />
                                </div>
                            )}
                        </div>
                        <div className="step-actions"><button className="btn btn-primary" onClick={handleGoNext}>Next → Results 📊</button></div>
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
                            <MetricCard value={(results.metrics.precision * 100).toFixed(1) + '%'} label="Precision" gradient />
                            <MetricCard value={(results.metrics.recall * 100).toFixed(1) + '%'} label="Recall" color="var(--emerald)" />
                            <MetricCard value={results.metrics.f1.toFixed(3)} label="F1 Score" color="var(--purple)" />
                            <MetricCard value={`${results.metrics.tp}/${results.metrics.tp + results.metrics.fn}`} label="Anomalies Found" color="var(--orange)" />
                        </div>
                        <div className="glass-card" style={{ padding: 16 }}>
                            <Suspense fallback={<ChartLoader />}>
                                <AnomalyChart X={results.X} yTrue={results.y} yPred={results.yPred} title="Anomaly Detection Map" />
                            </Suspense>
                        </div>

                        {/* Snapshot Compare */}
                        <div style={{ marginTop: 24 }}>
                            <Suspense fallback={null}>
                                <SnapshotCompare
                                    labId="anomaly"
                                    currentConfig={config}
                                    currentMetrics={results.metrics}
                                />
                            </Suspense>
                        </div>
                        <div className="step-actions"><button className="btn btn-primary" onClick={handleGoNext}>Next → Challenge 🏆</button></div>
                    </div>
                )}

                {step === 3 && (
                    <div className="step-content">
                        <div className="challenge-card glass-card">
                            <h2>🏆 Anomaly Detection Challenge</h2>
                            <p style={{ color: 'var(--text-secondary)', marginTop: 8, marginBottom: 20 }}>
                                Achieve F1 score above <strong style={{ color: 'var(--emerald)' }}>0.6</strong>.
                            </p>
                            <div className="challenge-r2">
                                <div className="challenge-r2-bar">
                                    <div className="challenge-r2-fill" style={{
                                        width: `${Math.min(results.metrics.f1 * 100, 100)}%`,
                                        background: results.metrics.f1 > 0.6 ? 'linear-gradient(90deg, var(--emerald), #04b88a)' : 'linear-gradient(90deg, var(--orange), var(--pink))',
                                    }} />
                                    <div className="challenge-r2-target" style={{ left: '60%' }} />
                                </div>
                            </div>
                            {results.metrics.f1 > 0.6 && (
                                <motion.div {...POP} className="success-card" style={{ marginTop: 20 }}>
                                    <p><strong>🎉 Anomaly Detector!</strong></p>
                                    <ChallengeUnlock awardBadge={awardBadge} awardXP={awardXP} badge="Anomaly Detector" />
                                </motion.div>
                            )}
                            <div className="step-actions"><button className="btn btn-ghost" onClick={() => handleStepChange(1)}>← Back</button></div>
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
