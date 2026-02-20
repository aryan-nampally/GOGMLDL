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
import IntroSection from '../components/IntroSection';
import AlgorithmDeepDive from '../components/AlgorithmDeepDive';
import MathBlock, { M } from '../components/MathBlock';
import ComparisonTable from '../components/ComparisonTable';
import KeyTakeaways from '../components/KeyTakeaways';
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

const ALGORITHM_DIVES = [
    {
        id: 'isolationForest', label: 'Isolation Forest', color: '#06D6A0', icon: '🌲',
        summary: 'Detects anomalies by measuring how easily a point can be isolated via random splits.',
        intuition: 'Anomalies are rare and different. In a random binary tree, anomalous points sit far from normal data and can be isolated in fewer splits. Normal points are deep in the tree because they\'re surrounded by similar points. Short average path length = anomaly.',
        mathContent: (
            <>
                <MathBlock label="Anomaly Score">{'s(x, n) = 2^{-\\frac{E[h(x)]}{c(n)}}'}</MathBlock>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 8 }}>
                    <M>{'h(x)'}</M> = path length for point x, <M>{'c(n)'}</M> = average path length in a BST of n samples. Score near 1 = anomaly, near 0.5 = normal.
                </p>
            </>
        ),
        steps: [
            { title: 'Build random trees —', text: 'Each tree randomly selects feature and split value.' },
            { title: 'Measure path length —', text: 'Count splits needed to isolate each point.' },
            { title: 'Average across trees —', text: 'Short average path = likely anomaly.' },
            { title: 'Apply threshold —', text: 'Use contamination parameter to set cutoff.' },
        ],
        whenToUse: 'Best for general-purpose anomaly detection. Works well in high dimensions, scales linearly, and requires no distance computation.',
        prosAndCons: {
            pros: ['Linear time complexity O(n)', 'Works well in high dimensions', 'No distance computation needed', 'Handles large datasets efficiently'],
            cons: ['Assumes anomalies are few and different', 'Contamination parameter needs estimation', 'May miss clustered anomalies', 'Random — results vary between runs'],
        },
    },
    {
        id: 'lof', label: 'Local Outlier Factor (LOF)', color: '#F97316', icon: '📍',
        summary: 'Detects anomalies by comparing local density of a point to its neighbors\' densities.',
        intuition: 'A point in a sparse region surrounded by dense clusters is anomalous — even if it\'s not far from everything globally. LOF captures this by computing each point\'s local density relative to its k-nearest neighbors. If your density is much lower than your neighbors\', you\'re an outlier.',
        mathContent: (
            <>
                <MathBlock label="Local Outlier Factor">{'\\text{LOF}_k(p) = \\frac{\\sum_{o \\in N_k(p)} \\frac{\\text{lrd}_k(o)}{\\text{lrd}_k(p)}}{|N_k(p)|}'}</MathBlock>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 8 }}>
                    LOF ≈ 1 means similar density to neighbors (normal). LOF ≫ 1 means much less dense (anomaly).
                </p>
            </>
        ),
        steps: [
            { title: 'Find k-neighbors —', text: 'Compute k-nearest neighbors for each point.' },
            { title: 'Compute local density —', text: 'Local reachability density (lrd) from neighbor distances.' },
            { title: 'Compare densities —', text: 'Ratio of neighbor densities to point\'s own density.' },
            { title: 'Flag outliers —', text: 'High LOF ratio indicates anomaly.' },
        ],
        whenToUse: 'Best for detecting contextual anomalies where "outlier" depends on local neighborhood density, not just global distance.',
        prosAndCons: {
            pros: ['Detects local/contextual anomalies', 'No global density assumption', 'Produces interpretable scores', 'Works with varying-density data'],
            cons: ['O(n²) complexity for distance computation', 'Sensitive to k parameter', 'Struggles in very high dimensions', 'Not suitable for streaming data'],
        },
    },
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
                    <div><h1 className="gradient-text">Anomaly Detection Lab</h1></div>
                    <div className={`explain-badge ${explainMode ? 'on' : 'off'}`} onClick={() => setExplainMode(!explainMode)}>{explainMode ? '💡 Explain ON' : '💡 Explain OFF'}</div>
                </div>
            </div>

            {/* ═══════ INTRODUCTION ═══════ */}
            <IntroSection
                title="What is Anomaly Detection?"
                subtitle="Finding the needle in the haystack — identifying rare, unusual observations."
                goalText="Understand how anomaly detectors work without labeled anomalies, the critical role of contamination rate, and why standard accuracy metrics fail for rare events."
                paragraphs={[
                    'Anomaly detection (also called outlier detection) is the task of identifying data points that deviate significantly from the expected pattern. Unlike classification where you have labeled examples of each class, anomaly detection typically works with mostly normal data and must discover what "unusual" means.',
                    'The key challenge is the extreme class imbalance: anomalies might be 0.1% of data. A model that always predicts "normal" would be 99.9% accurate but completely useless. This is why we evaluate with Precision (how many flagged items are truly anomalous) and Recall (how many true anomalies did we catch).',
                    'Two main approaches exist: Isolation Forest assumes anomalies are easy to isolate via random splits, while LOF (Local Outlier Factor) compares each point\'s local density to its neighbors. Each captures different types of anomalies.',
                ]}
                realWorld={{
                    title: 'Where is Anomaly Detection Used?',
                    items: [
                        { icon: '💳', text: 'Credit card fraud — flagging unusual transactions in real-time' },
                        { icon: '🏭', text: 'Manufacturing — detecting defective products on production lines' },
                        { icon: '🖥️', text: 'Network intrusion — identifying unusual traffic patterns and cyberattacks' },
                        { icon: '🏥', text: 'Medical monitoring — alerting on abnormal vital signs or test results' },
                        { icon: '🛰️', text: 'Satellite imagery — detecting unusual changes in terrain or infrastructure' },
                        { icon: '📈', text: 'Financial markets — spotting insider trading or market manipulation' },
                    ],
                }}
                prerequisites={[
                    'Understanding that anomalies are rare events (typically < 5% of data)',
                    'Concept of distance and density in data space',
                    'Why accuracy is misleading with imbalanced classes',
                ]}
            />

            {/* ═══════ MATHEMATICAL FOUNDATION ═══════ */}
            <div className="section-divider-labeled"><span>Mathematical Foundation</span></div>

            <motion.section className="math-foundation" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.45 }}>
                <h2>Key Concepts</h2>
                <div className="grid-2" style={{ gap: 24, alignItems: 'start' }}>
                    <div>
                        <h3 style={{ marginBottom: 12 }}>The Imbalance Problem</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
                            With 5% anomaly rate, predicting "all normal" gives 95% accuracy but catches 0% of anomalies.
                        </p>
                        <MathBlock label="Precision (of flags)">{'P = \\frac{TP}{TP + FP}'}</MathBlock>
                        <MathBlock label="Recall (anomaly catch rate)">{'R = \\frac{TP}{TP + FN}'}</MathBlock>
                    </div>
                    <div>
                        <h3 style={{ marginBottom: 12 }}>Contamination</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
                            Contamination estimates the proportion of anomalies in data. It sets the score threshold for flagging.
                        </p>
                        <div className="info-card">
                            Set contamination ≈ actual anomaly ratio for balanced detection. Too low → misses anomalies. Too high → too many false alarms.
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* ═══════ ALGORITHM DEEP DIVES ═══════ */}
            <div className="section-divider-labeled"><span>Algorithm Deep Dives</span></div>

            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.45 }}>
                <h2 style={{ marginBottom: 8 }}>Understanding Each Detector</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>Click to explore. Selected algorithm will be used in the Experiment step.</p>
                {ALGORITHM_DIVES.map((algo) => (
                    <AlgorithmDeepDive key={algo.id} {...algo} active={algorithm === algo.id} onSelect={setAlgorithm} />
                ))}
            </motion.section>

            {/* ═══════ COMPARISON TABLE ═══════ */}
            <ComparisonTable
                caption="📊 Anomaly Detector Comparison"
                headers={['Algorithm', 'Approach', 'Complexity', 'Anomaly Type', 'Best For']}
                rows={[
                    ['Isolation Forest', 'Random isolation', 'O(n log n)', 'Global outliers', 'General purpose, high-D'],
                    ['LOF', 'Local density ratio', 'O(n²)', 'Contextual outliers', 'Varying-density data'],
                ]}
            />

            {/* ═══════ INTERACTIVE LAB ═══════ */}
            <div className="section-divider-labeled"><span>Interactive Lab</span></div>

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
                        <h2>Concept Deep Dives</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                            Follow the story below — from detection algorithms to the evaluation challenges that make anomaly detection uniquely tricky.
                        </p>

                        <div className="narrative-flow">

                            {/* ── 1. Isolation Forest ── */}
                            <div className="narrative-section">
                                <div className="narrative-header">
                                    <span className="narrative-step-badge">1</span>
                                    <h3>{conceptCards[0].title}</h3>
                                </div>
                                <TeachingFrame
                                    title={`${conceptCards[0].title} — Beginner Lens`}
                                    background={conceptCards[0].background}
                                    what={conceptCards[0].what}
                                    why={conceptCards[0].why}
                                    how={conceptCards[0].how}
                                    tryThis={conceptCards[0].tryThis}
                                />
                            </div>

                            <div className="narrative-transition">
                                Isolation Forest works globally — it isolates outliers based on overall data structure. But some anomalies are only unusual <strong>relative to their local neighborhood</strong>…
                            </div>

                            {/* ── 2. LOF ── */}
                            <div className="narrative-section">
                                <div className="narrative-header">
                                    <span className="narrative-step-badge">2</span>
                                    <h3>{conceptCards[1].title}</h3>
                                </div>
                                <TeachingFrame
                                    title={`${conceptCards[1].title} — Beginner Lens`}
                                    background={conceptCards[1].background}
                                    what={conceptCards[1].what}
                                    why={conceptCards[1].why}
                                    how={conceptCards[1].how}
                                    tryThis={conceptCards[1].tryThis}
                                />
                            </div>

                            <div className="narrative-transition">
                                We now have detectors, but can we trust accuracy as a metric? With 99% normal data, a model that always says "normal" gets 99% accuracy. The real challenge is <strong>class imbalance</strong>…
                            </div>

                            {/* ── 3. Imbalance Problem ── */}
                            <div className="narrative-section">
                                <div className="narrative-header">
                                    <span className="narrative-step-badge">3</span>
                                    <h3>{conceptCards[2].title}</h3>
                                </div>
                                <TeachingFrame
                                    title={`${conceptCards[2].title} — Beginner Lens`}
                                    background={conceptCards[2].background}
                                    what={conceptCards[2].what}
                                    why={conceptCards[2].why}
                                    how={conceptCards[2].how}
                                    tryThis={conceptCards[2].tryThis}
                                />
                            </div>

                            <div className="narrative-transition">
                                So accuracy is misleading, and we need precision/recall. But how does the detector decide <strong>how many</strong> points to flag? That's where the contamination rate comes in…
                            </div>

                            {/* ── 4. Contamination Rate ── */}
                            <div className="narrative-section">
                                <div className="narrative-header">
                                    <span className="narrative-step-badge">4</span>
                                    <h3>{conceptCards[3].title}</h3>
                                </div>
                                <TeachingFrame
                                    title={`${conceptCards[3].title} — Beginner Lens`}
                                    background={conceptCards[3].background}
                                    what={conceptCards[3].what}
                                    why={conceptCards[3].why}
                                    how={conceptCards[3].how}
                                    tryThis={conceptCards[3].tryThis}
                                />
                            </div>

                        </div>

                        <div className="step-actions"><button className="btn btn-primary" onClick={handleGoNext}>Next → Experiment 🧪</button></div>
                    </div>
                )}

                {step === 1 && (
                    <div className="step-content">
                        <h2>Configure</h2>

                        <h3 style={{ marginBottom: 12 }}>Choose Detector</h3>
                        <div className="algo-selector" style={{ marginBottom: 20 }}>
                            {ALGORITHMS.map(a => (
                                <button key={a.id} className={`algo-pill ${algorithm === a.id ? 'active' : ''}`} style={{ '--pill-color': a.color }} onClick={() => setAlgorithm(a.id)}>{a.label}</button>
                            ))}
                        </div>

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

function MetricCard({ value, label, gradient, color, tooltip }) {
    return (
        <div className="glass-card metric-card">
            <div className={`metric-value ${gradient ? 'gradient-text' : ''}`} style={color ? { color } : undefined}>{value}</div>
            <div className="metric-label">
                {tooltip ? (<span className="explain-tooltip">{label}<span className="explain-popup">{tooltip}</span></span>) : label}
            </div>
        </div>
    );
}



function ChallengeUnlock({ awardBadge, awardXP, badge }) {
    const [awarded, setAwarded] = useState(false);
    useEffect(() => {
        if (!awarded) {
            const timer = setTimeout(() => {
                awardBadge(badge);
                awardXP(100, `${badge} Complete`);
                setAwarded(true);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [awarded, awardBadge, awardXP, badge]);
    return null;
}
