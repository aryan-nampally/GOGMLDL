import { useState, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { useFocus } from '../context/FocusContext';
import regressionEngine from '../engines/regressionEngine';
import { runPipeline } from '../engines/baseEngine';
import { PAGE_TRANSITION, STEP_SWITCH, REVEAL, POP } from '../utils/motion';
import RopeAnalogy from '../components/concepts/RopeAnalogy';
import GradientDescent from '../components/concepts/GradientDescent';
import RSquaredViz from '../components/concepts/RSquared';
import Assumptions from '../components/concepts/Assumptions';
import ExperimentLab from '../components/ExperimentLab';
import Quiz from '../components/Quiz';
import TeachingFrame from '../components/TeachingFrame';
import LearningJourney from '../components/LearningJourney';
import './RegressionLab.css';

// Lazy load heavy visualization components
const RegressionChart = lazy(() => import('../components/RegressionChart'));
const ResidualChart = lazy(() => import('../components/ResidualChart'));
const CodeSnippet = lazy(() => import('../components/CodeSnippet'));
const SnapshotCompare = lazy(() => import('../components/SnapshotCompare'));

const ChartLoader = () => (
    <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Loading chart…
    </div>
);

const STEPS = [
    { label: 'Understand', icon: '💡' },
    { label: 'Experiment', icon: '🧪' },
    { label: 'Results', icon: '📊' },
    { label: 'Challenge', icon: '🏆' },
];

const STORY_BEATS = [
    {
        title: 'Build your mental model first',
        text: 'Start with intuition: what a best-fit line means, what error means, and why optimization is needed.',
    },
    {
        title: 'Take control of the model',
        text: 'Change data noise and regularization to feel how each knob changes fit quality and generalization.',
    },
    {
        title: 'Read the model like an engineer',
        text: 'Interpret metrics and residuals to decide whether the model is reliable or just looks good.',
    },
    {
        title: 'Prove mastery under constraints',
        text: 'Use what you learned to hit the challenge target with fewer guesses and clearer reasoning.',
    },
];

const CONCEPTS = ['Rope Analogy', 'Gradient Descent', 'R-Squared', 'Assumptions'];

const CONCEPT_GUIDES = [
    {
        background: 'You are fitting a straight line through noisy points. Think of the line as a flexible rod being pulled by springs attached to data points.',
        what: 'A visual model of prediction error and best-fit line behavior.',
        why: 'Beginners grasp fitting faster with physical intuition than equations first.',
        how: 'Watch how changing slope/intercept alters spring tension (error). Lower tension means better fit.',
        tryThis: 'Move slope and intercept mentally while watching the chart: which direction reduces spring stretch?',
    },
    {
        background: 'The model does not magically know the best line—it learns it by repeated small improvements.',
        what: 'Gradient descent is an optimization process that updates parameters step by step.',
        why: 'Most ML models are trained with iterative optimization, not closed-form shortcuts.',
        how: 'Compute error slope → move parameters opposite that slope → repeat until loss stabilizes.',
        tryThis: 'Lower noise and observe how quickly the model converges versus noisy data.',
    },
    {
        background: 'You need a simple score that tells how much of data variation your model explains.',
        what: 'R² compares model error against a naive baseline (predicting only the mean).',
        why: 'It translates model quality into an intuitive 0–1 scale.',
        how: 'If model error is much lower than baseline error, R² increases toward 1.',
        tryThis: 'Increase noise and observe R² dropping even when slope is roughly correct.',
    },
    {
        background: 'Linear regression works best when data follows specific patterns in residual behavior.',
        what: 'Assumptions define when predictions and interpretation are trustworthy.',
        why: 'Violations can make confidence, errors, and conclusions unreliable.',
        how: 'Inspect residual plots for patterns, changing spread, or non-linearity.',
        tryThis: 'Switch between assumption violations and see which metric degrades first.',
    },
];

const ALGORITHMS = [
    { id: 'linear', label: 'Linear (OLS)', color: '#4F8BF9', desc: 'Classic least squares — no regularization' },
    { id: 'ridge', label: 'Ridge (L2)', color: '#9B5DE5', desc: 'Shrinks coefficients to prevent overfitting' },
    { id: 'lasso', label: 'Lasso (L1)', color: '#06D6A0', desc: 'Pushes weak features to zero — feature selection' },
    { id: 'elasticnet', label: 'Elastic Net', color: '#F97316', desc: 'Best of both L1 + L2 regularization' },
];

export default function RegressionLab() {
    const [step, setStep] = useState(0);
    const [concept, setConcept] = useState(0);
    const { awardXP, awardBadge } = useGame();
    const { enterFocus, exitFocus } = useFocus();

    // Explain Mode
    const [explainMode, setExplainMode] = useState(true);

    // Algorithm selection
    const [algorithm, setAlgorithm] = useState('linear');
    const [lambda, setLambda] = useState(1.0);
    const [l1Ratio, setL1Ratio] = useState(0.5);

    // Experiment state
    const [labConfig, setLabConfig] = useState({
        nSamples: 50,
        noise: 15,
        slope: 2.5,
        intercept: 0,
    });

    // Run the engine with the selected algorithm
    const fullConfig = useMemo(() => ({
        ...labConfig,
        algorithm,
        lambda,
        l1Ratio,
    }), [labConfig, algorithm, lambda, l1Ratio]);

    const results = useMemo(() => {
        const { data, model, predictions, metrics, summary } = runPipeline(regressionEngine, fullConfig);
        return { X: data.X, y: data.y, model, yPred: predictions, metrics, summary };
    }, [fullConfig]);

    const activeAlgo = ALGORITHMS.find((a) => a.id === algorithm);

    const [showResiduals, setShowResiduals] = useState(false);
    const [showCode, setShowCode] = useState(false);

    const canAdvance = (s) => s <= step;

    // Focus Mode: enter when user switches to experiment step
    const handleStepChange = (newStep) => {
        if (canAdvance(newStep)) {
            setStep(newStep);
            if (newStep === 1) enterFocus();
            else exitFocus();
        }
    };

    const handleGoNext = () => {
        if (step < 3) {
            const next = step + 1;
            setStep(next);
            if (next === 1) enterFocus();
            else exitFocus();
        }
    };

    return (
        <motion.div
            className="regression-page"
            variants={PAGE_TRANSITION}
            initial="initial"
            animate="animate"
            exit="exit"
        >
            {/* Header */}
            <div className="lab-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <h1 className="gradient-text">Regression Lab</h1>
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

                {/* Regularization Controls */}
                {algorithm !== 'linear' && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="reg-controls"
                        style={{ marginTop: 12 }}
                    >
                        <div className="reg-slider">
                            <label>λ (Regularization): <strong>{lambda.toFixed(2)}</strong></label>
                            <input
                                type="range"
                                min="0.01"
                                max="10"
                                step="0.01"
                                value={lambda}
                                onChange={(e) => setLambda(+e.target.value)}
                            />
                            {explainMode && (
                                <span className="reg-hint">Higher λ = stronger penalty on coefficients</span>
                            )}
                        </div>
                        {algorithm === 'elasticnet' && (
                            <div className="reg-slider">
                                <label>L1 Ratio: <strong>{l1Ratio.toFixed(2)}</strong></label>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={l1Ratio}
                                    onChange={(e) => setL1Ratio(+e.target.value)}
                                />
                                {explainMode && (
                                    <span className="reg-hint">0 = pure Ridge · 1 = pure Lasso</span>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </div>

            {/* Step Indicator */}
            <div className="step-indicator">
                {STEPS.map((s, i) => (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'center' }}>
                        <div
                            className={`step-dot ${i === step ? 'active' : ''} ${i < step ? 'completed' : ''}`}
                            onClick={() => handleStepChange(i)}
                            style={{ cursor: canAdvance(i) ? 'pointer' : 'default' }}
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

                        <div className="concept-area">
                            {concept === 0 && <RopeAnalogy />}
                            {concept === 1 && <GradientDescent />}
                            {concept === 2 && <RSquaredViz />}
                            {concept === 3 && <Assumptions />}
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
                        <Quiz
                            id="q1"
                            question="In the rope analogy, what represents the 'Error'?"
                            options={[
                                'The length of the rope',
                                'The tension in the springs',
                                'The number of magnets',
                                'The color of the rod',
                            ]}
                            correctIdx={1}
                            explanation="The springs stretch to connect the points to the line. The more stretched they are (tension), the higher the error!"
                            xpReward={50}
                        />

                        <div style={{ height: 32 }} />

                        <ExperimentLab config={labConfig} onChange={setLabConfig} />

                        {/* Explain Mode: formula card */}
                        <AnimatePresence>
                            {explainMode && (
                                <motion.div {...REVEAL} className="info-card" style={{ marginTop: 16 }}>
                                    <strong>Formula:</strong> y = {labConfig.slope.toFixed(1)}x + {labConfig.intercept.toFixed(1)} + ε&nbsp;
                                    <span style={{ color: 'var(--text-muted)' }}>(where ε is random noise with σ={labConfig.noise})</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

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

                        {/* "What Just Happened?" insight */}
                        <motion.div {...REVEAL} className="insight-card" style={{ marginBottom: 24 }}>
                            <div className="insight-label">What Just Happened?</div>
                            {results.summary}
                        </motion.div>

                        {/* Metrics */}
                        <div className="grid-4" style={{ marginBottom: 24 }}>
                            <MetricCard value={results.model.slope.toFixed(2)} label="Learned Slope" gradient
                                tooltip={explainMode ? "How steep the line is. Higher = Y grows faster with X." : null} />
                            <MetricCard value={results.model.intercept.toFixed(2)} label="Learned Intercept" gradient
                                tooltip={explainMode ? "Where the line crosses the Y-axis (when X=0)." : null} />
                            <MetricCard value={results.metrics.r2.toFixed(4)} label="R² Score"
                                color={results.metrics.r2 > 0.85 ? 'var(--emerald)' : 'var(--orange)'}
                                tooltip={explainMode ? "How much data variance the model explains. 1.0 = perfect." : null} />
                            <MetricCard value={results.metrics.mse.toFixed(2)} label="MSE"
                                color="var(--pink)"
                                tooltip={explainMode ? "Average squared error. Lower = better predictions." : null} />
                        </div>

                        {/* Chart */}
                        <div className="glass-card" style={{ padding: 16 }}>
                            <Suspense fallback={<ChartLoader />}>
                                <RegressionChart
                                    X={results.X}
                                    y={results.y}
                                    slope={results.model.slope}
                                    intercept={results.model.intercept}
                                    title={`Best Fit: y = ${results.model.slope.toFixed(2)}x + ${results.model.intercept.toFixed(2)}`}
                                />
                            </Suspense>
                        </div>

                        {/* Progressive reveal */}
                        <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <button className="btn btn-ghost" onClick={() => setShowResiduals(!showResiduals)}>
                                {showResiduals ? 'Hide' : 'Show'} Residual Plot
                            </button>
                            <button className="btn btn-ghost" onClick={() => setShowCode(!showCode)}>
                                {showCode ? 'Hide' : 'See How It\'s Written in Python'} 💻
                            </button>
                        </div>

                        <AnimatePresence>
                            {showResiduals && (
                                <motion.div {...REVEAL} className="glass-card" style={{ marginTop: 16, padding: 16 }}>
                                    <Suspense fallback={<ChartLoader />}>
                                        <ResidualChart yTrue={results.y} yPred={results.yPred} />
                                    </Suspense>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {showCode && (
                                <motion.div {...REVEAL} style={{ marginTop: 16 }}>
                                    <Suspense fallback={<ChartLoader />}>
                                        <CodeSnippet
                                            slope={results.model.slope}
                                            intercept={results.model.intercept}
                                            nSamples={labConfig.nSamples}
                                        />
                                    </Suspense>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Snapshot Compare */}
                        <div style={{ marginTop: 24 }}>
                            <Suspense fallback={null}>
                                <SnapshotCompare
                                    labId="regression"
                                    currentConfig={labConfig}
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
                            <h2>🏆 Master Challenge</h2>
                            <p style={{ color: 'var(--text-secondary)', marginTop: 8, marginBottom: 20 }}>
                                Achieve an R² score above <strong style={{ color: 'var(--emerald)' }}>0.85</strong> to earn the <strong>Regression Master</strong> badge.
                            </p>

                            {/* Explain Mode: what R² means in context */}
                            <AnimatePresence>
                                {explainMode && (
                                    <motion.div {...REVEAL} className="info-card" style={{ marginBottom: 16 }}>
                                        💡 <strong>Hint:</strong> R² measures how well your model explains the data. Go back to Step 2 and try reducing the noise level — less noise = clearer patterns = higher R².
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="challenge-r2">
                                <div className="challenge-r2-bar">
                                    <div
                                        className="challenge-r2-fill"
                                        style={{
                                            width: `${Math.min(results.metrics.r2 * 100, 100)}%`,
                                            background: results.metrics.r2 > 0.85
                                                ? 'linear-gradient(90deg, var(--emerald), #04b88a)'
                                                : 'linear-gradient(90deg, var(--orange), var(--pink))',
                                        }}
                                    />
                                    <div className="challenge-r2-target" style={{ left: '85%' }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: 6 }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Current: {results.metrics.r2.toFixed(4)}</span>
                                    <span style={{ color: 'var(--text-muted)' }}>Target: 0.85</span>
                                </div>
                            </div>

                            {results.metrics.r2 > 0.85 ? (
                                <motion.div {...POP} className="success-card" style={{ marginTop: 20 }}>
                                    <p>
                                        <strong>🎉 Achievement Unlocked!</strong><br />
                                        You've mastered Linear Regression. The badge has been added to your collection.
                                    </p>
                                    <ChallengeUnlock awardBadge={awardBadge} awardXP={awardXP} />
                                </motion.div>
                            ) : (
                                <div className="info-card" style={{ marginTop: 20 }}>
                                    <p>💡 Go back to <strong>Step 2: Experiment</strong> and try reducing the <strong>Noise Level</strong> to get a higher R² score.</p>
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

// ── Metric Card with optional explain tooltip ──
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
                ) : (
                    label
                )}
            </div>
        </div>
    );
}

// ── Trigger badge only once ──
function ChallengeUnlock({ awardBadge, awardXP }) {
    const [awarded, setAwarded] = useState(false);
    if (!awarded) {
        setTimeout(() => {
            awardBadge('Regression Master');
            awardXP(100, 'Master Challenge Complete');
            setAwarded(true);
        }, 500);
    }
    return null;
}
