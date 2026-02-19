/**
 * ClassificationLab — Interactive page for 5 classification algorithms.
 *
 * Step flow: Understand → Experiment → Results → Challenge
 * Features: Algorithm selector, data shape picker, decision boundary chart,
 * confusion matrix, metrics, explain mode.
 */
import { useState, useMemo, useRef, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { useFocus } from '../context/FocusContext';
import classificationEngine, { getMetrics } from '../engines/classificationEngine';
import { runPipeline } from '../engines/baseEngine';
import { rocCurve, prCurve } from '../engines/mlUtils';
import { PAGE_TRANSITION, STEP_SWITCH, REVEAL, POP } from '../utils/motion';
import KNNConcept from '../components/concepts/KNNConcept';
import LogisticRegressionConcept from '../components/concepts/LogisticRegressionConcept';
import TeachingFrame from '../components/TeachingFrame';
import LearningJourney from '../components/LearningJourney';
import './ClassificationLab.css';

const ClassificationChart = lazy(() => import('../components/MLCharts').then(m => ({ default: m.ClassificationChart })));
const ROCChart = lazy(() => import('../components/MLCharts').then(m => ({ default: m.ROCChart })));
const PRChart = lazy(() => import('../components/MLCharts').then(m => ({ default: m.PRChart })));
const SnapshotCompare = lazy(() => import('../components/SnapshotCompare'));
const ChartLoader = () => (
    <div style={{ height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading chart…</div>
);

const STEPS = [
    { label: 'Understand', icon: '💡' },
    { label: 'Experiment', icon: '🧪' },
    { label: 'Results', icon: '📊' },
    { label: 'Challenge', icon: '🏆' },
];

const STORY_BEATS = [
    {
        title: 'Turn labels into intuition',
        text: 'Learn how boundaries separate classes and why probabilities matter before touching controls.',
    },
    {
        title: 'Shape the decision boundary',
        text: 'Pick data geometry and algorithm settings to see overfit, underfit, and robust zones in action.',
    },
    {
        title: 'Evaluate beyond accuracy',
        text: 'Use confusion trends, ROC, and PR tradeoffs to judge model quality in real-world imbalance cases.',
    },
    {
        title: 'Make threshold decisions confidently',
        text: 'Solve the challenge by tuning threshold and model choice based on costs of wrong predictions.',
    },
];

const CONCEPTS = ['Logistic Regression', 'k-Nearest Neighbors'];

const CONCEPT_GUIDES = [
    {
        background: 'You want a model that predicts class probability, not just a raw line output.',
        what: 'Logistic Regression maps linear score to probability using a sigmoid curve.',
        why: 'Probability helps set thresholds based on business risk (false positives vs false negatives).',
        how: 'Compute weighted sum → apply sigmoid → compare probability with threshold.',
        tryThis: 'In Results, drag threshold and observe precision-recall tradeoff immediately.',
    },
    {
        background: 'Sometimes the best strategy is to use nearby examples instead of fitting one global formula.',
        what: 'KNN classifies by majority vote among closest neighbors.',
        why: 'It handles complex boundaries and non-linear shapes with minimal assumptions.',
        how: 'Pick k, compute distances, select nearest points, vote class.',
        tryThis: 'Use Moons data and compare k=1 vs k=15 to see overfit vs smooth boundaries.',
    },
];

const ALGORITHMS = [
    { id: 'logistic', label: 'Logistic Regression', color: '#4F8BF9', desc: 'S-curve probability → binary/multi-class via gradient descent' },
    { id: 'knn', label: 'KNN', color: '#9B5DE5', desc: 'Classify by majority vote of k nearest neighbors' },
    { id: 'svm', label: 'SVM', color: '#06D6A0', desc: 'Find the widest margin between classes' },
    { id: 'naiveBayes', label: 'Naive Bayes', color: '#F97316', desc: 'Assume feature independence, multiply probabilities' },
    { id: 'decisionTree', label: 'Decision Tree', color: '#EC4899', desc: 'Split data with yes/no questions until pure groups' },
];

const DATA_SHAPES = [
    { id: 'blobs', label: '● Blobs', desc: 'Gaussian clusters' },
    { id: 'moons', label: '🌙 Moons', desc: 'Interleaving crescents' },
    { id: 'circles', label: '◎ Circles', desc: 'Concentric rings' },
    { id: 'spirals', label: '🌀 Spirals', desc: 'Two intertwined spirals' },
];

export default function ClassificationLab() {
    const [step, setStep] = useState(0);
    const [concept, setConcept] = useState(0);
    const { awardXP, awardBadge } = useGame();
    const { enterFocus, exitFocus } = useFocus();

    const [explainMode, setExplainMode] = useState(true);
    const [algorithm, setAlgorithm] = useState('logistic');
    const [dataShape, setDataShape] = useState('blobs');
    const [nSamples, setNSamples] = useState(120);
    const [spread, setSpread] = useState(1.0);
    const [k, setK] = useState(5);
    const [maxDepth, setMaxDepth] = useState(5);
    const [C, setC] = useState(1.0);
    const [threshold, setThreshold] = useState(0.5);

    const config = useMemo(() => ({
        nSamples,
        dataShape,
        spread,
        seed: 42,
        algorithm,
        k,
        maxDepth,
        C,
    }), [nSamples, dataShape, spread, algorithm, k, maxDepth, C]);

    const baseResults = useMemo(() => {
        const { data, model, predictions, probabilities, metrics, summary } = runPipeline(classificationEngine, config);
        return { X: data.X, y: data.y, model, predictions, probabilities, metrics, summary };
    }, [config]);

    const results = useMemo(() => {
        // If we have probabilities, re-calculate based on threshold
        if (baseResults.probabilities && baseResults.probabilities.length > 0 && baseResults.model.classes.length === 2) {
            const yPred = baseResults.probabilities.map(p => p >= threshold ? 1 : 0); // Assumes class 1 is positive
            const metrics = getMetrics(baseResults.y, yPred);

            // Calculate curves
            const roc = rocCurve(baseResults.y, baseResults.probabilities);
            const pr = prCurve(baseResults.y, baseResults.probabilities);

            return {
                ...baseResults,
                yPred,
                metrics,
                roc,
                pr
            };
        }
        // Fallback for non-probabilistic or multiclass
        return { ...baseResults, yPred: baseResults.predictions };
    }, [baseResults, threshold]);

    const activeAlgo = ALGORITHMS.find((a) => a.id === algorithm);

    const handleStepChange = (newStep) => {
        if (newStep <= step) {
            setStep(newStep);
            if (newStep === 1) enterFocus(); else exitFocus();
        }
    };

    const handleGoNext = () => {
        if (step < 3) {
            const next = step + 1;
            setStep(next);
            if (next === 1) enterFocus(); else exitFocus();
        }
    };

    return (
        <motion.div
            className="classification-page"
            variants={PAGE_TRANSITION}
            initial="initial"
            animate="animate"
            exit="exit"
        >
            {/* Header */}
            <div className="lab-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <h1 className="gradient-text">Classification Lab</h1>
                        <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0' }}>{activeAlgo?.desc}</p>
                    </div>
                    <div
                        className={`explain-badge ${explainMode ? 'on' : 'off'}`}
                        onClick={() => setExplainMode(!explainMode)}
                    >
                        {explainMode ? '💡 Explain ON' : '💡 Explain OFF'}
                    </div>
                </div>

                {/* Algorithm Selector */}
                <div className="algo-selector" style={{ marginTop: 16 }}>
                    {ALGORITHMS.map((a) => (
                        <button
                            key={a.id}
                            className={`algo-pill ${algorithm === a.id ? 'active' : ''}`}
                            style={{ '--pill-color': a.color }}
                            onClick={() => setAlgorithm(a.id)}
                        >
                            {a.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Step Indicator */}
            <div className="step-indicator">
                {STEPS.map((s, i) => (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'center' }}>
                        <div
                            className={`step-dot ${i === step ? 'active' : ''} ${i < step ? 'completed' : ''}`}
                            onClick={() => handleStepChange(i)}
                            style={{ cursor: i <= step ? 'pointer' : 'default' }}
                        >
                            <span>{s.icon}</span>
                            <span>{s.label}</span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div className={`step-connector ${i < step ? 'completed' : ''}`} />
                        )}
                    </div>
                ))}
            </div>

            <LearningJourney step={step} steps={STEPS} beats={STORY_BEATS} />

            {/* Step Content */}
            <motion.div key={step} {...STEP_SWITCH}>

                {/* ──── STEP 1: UNDERSTAND ──── */}
                {step === 0 && (
                    <div className="step-content">
                        <div className="tab-bar">
                            {CONCEPTS.map((c, i) => (
                                <button
                                    key={c}
                                    className={i === concept ? 'active' : ''}
                                    onClick={() => setConcept(i)}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>

                        <TeachingFrame
                            title={`${CONCEPTS[concept]} — Beginner Lens`}
                            background={CONCEPT_GUIDES[concept].background}
                            what={CONCEPT_GUIDES[concept].what}
                            why={CONCEPT_GUIDES[concept].why}
                            how={CONCEPT_GUIDES[concept].how}
                            tryThis={CONCEPT_GUIDES[concept].tryThis}
                        />

                        <div className="concept-area" style={{ marginTop: 24 }}>
                            {concept === 0 && <LogisticRegressionConcept />}
                            {concept === 1 && <KNNConcept />}
                        </div>

                        <div className="step-actions">
                            <button className="btn btn-primary" onClick={handleGoNext}>
                                Next → Try It Yourself 🧪
                            </button>
                        </div>
                    </div>
                )}

                {/* ──── STEP 2: EXPERIMENT ──── */}
                {step === 1 && (
                    <div className="step-content">
                        <h2>Configure & Explore</h2>

                        {/* Data Shape */}
                        <div className="config-section">
                            <label className="config-label">Data Shape</label>
                            <div className="shape-selector">
                                {DATA_SHAPES.map((s) => (
                                    <button
                                        key={s.id}
                                        className={`shape-pill ${dataShape === s.id ? 'active' : ''}`}
                                        onClick={() => setDataShape(s.id)}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                            {explainMode && (
                                <span className="reg-hint">Moons & circles are non-linear — linear models will struggle!</span>
                            )}
                        </div>

                        {/* Sliders */}
                        <div className="config-grid">
                            <div className="config-section">
                                <label className="config-label">Samples: <strong>{nSamples}</strong></label>
                                <input type="range" min="30" max="300" step="10" value={nSamples}
                                    onChange={(e) => setNSamples(+e.target.value)} />
                            </div>
                            <div className="config-section">
                                <label className="config-label">Spread: <strong>{spread.toFixed(1)}</strong></label>
                                <input type="range" min="0.3" max="3" step="0.1" value={spread}
                                    onChange={(e) => setSpread(+e.target.value)} />
                                {explainMode && <span className="reg-hint">Higher spread = more overlap between classes</span>}
                            </div>

                            {/* Algorithm-specific params */}
                            {algorithm === 'knn' && (
                                <div className="config-section">
                                    <label className="config-label">K (neighbors): <strong>{k}</strong></label>
                                    <input type="range" min="1" max="21" step="2" value={k}
                                        onChange={(e) => setK(+e.target.value)} />
                                    {explainMode && <span className="reg-hint">Low k = complex boundary, high k = smoother</span>}
                                </div>
                            )}
                            {algorithm === 'decisionTree' && (
                                <div className="config-section">
                                    <label className="config-label">Max Depth: <strong>{maxDepth}</strong></label>
                                    <input type="range" min="1" max="10" step="1" value={maxDepth}
                                        onChange={(e) => setMaxDepth(+e.target.value)} />
                                    {explainMode && <span className="reg-hint">Deeper = more complex splits, risk of overfitting</span>}
                                </div>
                            )}
                            {algorithm === 'svm' && (
                                <div className="config-section">
                                    <label className="config-label">C (penalty): <strong>{C.toFixed(1)}</strong></label>
                                    <input type="range" min="0.01" max="10" step="0.1" value={C}
                                        onChange={(e) => setC(+e.target.value)} />
                                    {explainMode && <span className="reg-hint">High C = tight fit, low C = wider margin</span>}
                                </div>
                            )}
                        </div>

                        <div className="step-actions">
                            <button className="btn btn-primary" onClick={handleGoNext}>
                                Next → See Results 📊
                            </button>
                        </div>
                    </div>
                )}

                {/* ──── STEP 3: RESULTS ──── */}
                {step === 2 && (
                    <div className="step-content">
                        <h2 style={{ marginBottom: 20 }}>Model Results</h2>

                        {/* Insight */}
                        <motion.div {...REVEAL} className="insight-card" style={{ marginBottom: 24 }}>
                            <div className="insight-label">What Just Happened?</div>
                            {results.summary}
                        </motion.div>

                        {/* Threshold Slider (only for binary) */}
                        {results.probabilities && (
                            <div className="glass-card" style={{ padding: '16px 24px', marginBottom: 24 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <label style={{ fontWeight: 500 }}>Classification Threshold</label>
                                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>{threshold.toFixed(2)}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0" max="1" step="0.01"
                                    value={threshold}
                                    onChange={(e) => setThreshold(+e.target.value)}
                                    style={{ width: '100%' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                    <span>Prioritize Recall (Low)</span>
                                    <span>Balanced</span>
                                    <span>Prioritize Precision (High)</span>
                                </div>
                            </div>
                        )}

                        {/* Metrics */}
                        <div className="grid-4" style={{ marginBottom: 24 }}>
                            <MetricCard value={(results.metrics.accuracy * 100).toFixed(1) + '%'} label="Accuracy" gradient
                                tooltip={explainMode ? 'Fraction of correct predictions overall.' : null} />
                            <MetricCard value={(results.metrics.precision * 100).toFixed(1) + '%'} label="Precision"
                                color="var(--purple)"
                                tooltip={explainMode ? 'Of predicted positives, how many are actually positive?' : null} />
                            <MetricCard value={(results.metrics.recall * 100).toFixed(1) + '%'} label="Recall"
                                color="var(--emerald)"
                                tooltip={explainMode ? 'Of all actual positives, how many did we find?' : null} />
                            <MetricCard value={results.metrics.f1.toFixed(3)} label="F1 Score"
                                color={results.metrics.f1 > 0.8 ? 'var(--emerald)' : 'var(--orange)'}
                                tooltip={explainMode ? 'Harmonic mean of Precision & Recall. Best at 1.0.' : null} />
                        </div>

                        {/* Decision Boundary + Classification Chart */}
                        <div className="glass-card" style={{ padding: 16 }}>
                            <DecisionBoundaryCanvas
                                X={results.X}
                                y={results.y}
                                yPred={results.yPred}
                                model={results.model}
                                algorithm={algorithm}
                                engine={classificationEngine}
                            />
                        </div>
                        <div className="glass-card" style={{ padding: 16, marginTop: 16 }}>
                            <Suspense fallback={<ChartLoader />}>
                                <ClassificationChart X={results.X} y={results.y} yPred={results.yPred} title="Classification Scatter (Interactive)" />
                            </Suspense>
                        </div>

                        {/* ROC & PR Curves */}
                        {results.roc && (
                            <div className="grid-2-mobile" style={{ marginTop: 16 }}>
                                <div className="glass-card" style={{ padding: 16 }}>
                                    <Suspense fallback={<ChartLoader />}>
                                        <ROCChart fpr={results.roc.fpr} tpr={results.roc.tpr} auc={results.roc.auc} />
                                    </Suspense>
                                </div>
                                <div className="glass-card" style={{ padding: 16 }}>
                                    <Suspense fallback={<ChartLoader />}>
                                        <PRChart precision={results.pr.precision} recall={results.pr.recall} auc={results.pr.auc} />
                                    </Suspense>
                                </div>
                            </div>
                        )}

                        {/* Confusion Matrix */}
                        <div style={{ marginTop: 20 }}>
                            <ConfusionMatrix metrics={results.metrics} />
                        </div>

                        {/* Snapshot Compare */}
                        <div style={{ marginTop: 24 }}>
                            <Suspense fallback={null}>
                                <SnapshotCompare
                                    labId="classification"
                                    currentConfig={config}
                                    currentMetrics={results.metrics}
                                />
                            </Suspense>
                        </div>

                        <div className="step-actions">
                            <button className="btn btn-primary" onClick={handleGoNext}>
                                Next → Master Challenge 🏆
                            </button>
                        </div>
                    </div>
                )}

                {/* ──── STEP 4: CHALLENGE ──── */}
                {step === 3 && (
                    <div className="step-content">
                        <div className="challenge-card glass-card">
                            <h2>🏆 Classification Challenge</h2>
                            <p style={{ color: 'var(--text-secondary)', marginTop: 8, marginBottom: 20 }}>
                                Achieve accuracy above <strong style={{ color: 'var(--emerald)' }}>90%</strong> on <strong>Moons</strong> data to earn the <strong>Classification Master</strong> badge.
                            </p>

                            <AnimatePresence>
                                {explainMode && (
                                    <motion.div {...REVEAL} className="info-card" style={{ marginBottom: 16 }}>
                                        💡 <strong>Hint:</strong> Moons data is non-linear. Linear models (Logistic, SVM) will struggle. Try KNN or Decision Tree!
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="challenge-r2">
                                <div className="challenge-r2-bar">
                                    <div
                                        className="challenge-r2-fill"
                                        style={{
                                            width: `${Math.min(results.metrics.accuracy * 100, 100)}%`,
                                            background: results.metrics.accuracy > 0.9
                                                ? 'linear-gradient(90deg, var(--emerald), #04b88a)'
                                                : 'linear-gradient(90deg, var(--orange), var(--pink))',
                                        }}
                                    />
                                    <div className="challenge-r2-target" style={{ left: '90%' }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: 6 }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Current: {(results.metrics.accuracy * 100).toFixed(1)}%</span>
                                    <span style={{ color: 'var(--text-muted)' }}>Target: 90%</span>
                                </div>
                            </div>

                            {results.metrics.accuracy > 0.9 && dataShape === 'moons' ? (
                                <motion.div {...POP} className="success-card" style={{ marginTop: 20 }}>
                                    <p>
                                        <strong>🎉 Achievement Unlocked!</strong><br />
                                        You mastered non-linear classification!
                                    </p>
                                    <ChallengeUnlock awardBadge={awardBadge} awardXP={awardXP} />
                                </motion.div>
                            ) : (
                                <div className="info-card" style={{ marginTop: 20 }}>
                                    <p>💡 Switch to <strong>Moons</strong> data and pick an algorithm that handles non-linear boundaries.</p>
                                </div>
                            )}

                            <div className="step-actions">
                                <button className="btn btn-ghost" onClick={() => handleStepChange(1)}>
                                    ← Back to Experiment
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════

function ConceptCard({ title, icon, content }) {
    return (
        <motion.div className="glass-card concept-card-item" {...REVEAL}>
            <div className="concept-icon">{icon}</div>
            <h3>{title}</h3>
            <p>{content}</p>
        </motion.div>
    );
}

function MetricCard({ value, label, gradient, color, tooltip }) {
    return (
        <div className="glass-card metric-card">
            <div
                className={`metric-value ${gradient ? 'gradient-text' : ''}`}
                style={color ? { color } : undefined}
            >
                {value}
            </div>
            <div className="metric-label">
                {tooltip ? (
                    <span className="explain-tooltip">
                        {label}
                        <span className="explain-popup">{tooltip}</span>
                    </span>
                ) : label}
            </div>
        </div>
    );
}

function ConfusionMatrix({ metrics }) {
    const { tp, fp, fn, tn } = metrics;
    return (
        <div className="confusion-matrix glass-card">
            <h3 style={{ marginBottom: 12 }}>Confusion Matrix</h3>
            <div className="cm-grid">
                <div className="cm-header" />
                <div className="cm-header">Pred 0</div>
                <div className="cm-header">Pred 1</div>
                <div className="cm-label">Actual 0</div>
                <div className="cm-cell cm-tn">{tn}</div>
                <div className="cm-cell cm-fp">{fp}</div>
                <div className="cm-label">Actual 1</div>
                <div className="cm-cell cm-fn">{fn}</div>
                <div className="cm-cell cm-tp">{tp}</div>
            </div>
        </div>
    );
}

/**
 * Canvas-based decision boundary visualization.
 * Renders a heatmap of predictions across the 2D space, overlaid with data points.
 */
function DecisionBoundaryCanvas({ X, y, yPred, model, algorithm, engine }) {
    const canvasRef = useRef(null);
    const colors = ['#4F8BF9', '#EC4899', '#06D6A0', '#F97316', '#9B5DE5'];

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || X.length === 0) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;

        // Find data bounds with padding
        let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
        for (const pt of X) {
            if (pt[0] < xMin) xMin = pt[0];
            if (pt[0] > xMax) xMax = pt[0];
            if (pt[1] < yMin) yMin = pt[1];
            if (pt[1] > yMax) yMax = pt[1];
        }
        const pad = 1;
        xMin -= pad; xMax += pad; yMin -= pad; yMax += pad;

        // Render decision boundary heatmap
        const resolution = 2; // pixel skip for performance
        const gridX = [];
        for (let px = 0; px < w; px += resolution) {
            for (let py = 0; py < h; py += resolution) {
                const fx = xMin + (px / w) * (xMax - xMin);
                const fy = yMin + (1 - py / h) * (yMax - yMin); // flip y
                gridX.push([fx, fy]);
            }
        }

        const gridPred = engine.predict(gridX, model);

        ctx.clearRect(0, 0, w, h);

        // Draw boundary regions
        let idx = 0;
        for (let px = 0; px < w; px += resolution) {
            for (let py = 0; py < h; py += resolution) {
                const cls = gridPred[idx++];
                const c = colors[cls % colors.length];
                ctx.fillStyle = c + '25'; // Low alpha
                ctx.fillRect(px, py, resolution, resolution);
            }
        }

        // Draw data points
        for (let i = 0; i < X.length; i++) {
            const px = ((X[i][0] - xMin) / (xMax - xMin)) * w;
            const py = (1 - (X[i][1] - yMin) / (yMax - yMin)) * h;
            const correct = y[i] === yPred[i];

            // Outer ring (class color)
            ctx.beginPath();
            ctx.arc(px, py, 5, 0, Math.PI * 2);
            ctx.fillStyle = colors[y[i] % colors.length];
            ctx.fill();

            // Inner dot (white if correct, red if wrong)
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fillStyle = correct ? '#ffffff' : '#ff3333';
            ctx.fill();
        }

    }, [X, y, yPred, model, algorithm, engine]);

    return (
        <div>
            <h3 style={{ marginBottom: 8 }}>Decision Boundary</h3>
            <canvas
                ref={canvasRef}
                width={600}
                height={400}
                style={{ width: '100%', height: 'auto', borderRadius: 8, background: 'rgba(0,0,0,0.3)' }}
            />
        </div>
    );
}

function ChallengeUnlock({ awardBadge, awardXP }) {
    const [awarded, setAwarded] = useState(false);
    if (!awarded) {
        setTimeout(() => {
            awardBadge('Classification Master');
            awardXP(100, 'Classification Challenge Complete');
            setAwarded(true);
        }, 500);
    }
    return null;
}
