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
import IntroSection from '../components/IntroSection';
import AlgorithmDeepDive from '../components/AlgorithmDeepDive';
import MathBlock, { M } from '../components/MathBlock';
import ComparisonTable from '../components/ComparisonTable';
import KeyTakeaways from '../components/KeyTakeaways';
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

const ALGORITHM_DIVES = [
    {
        id: 'randomForest', label: 'Random Forest', color: '#06D6A0', icon: '🌲',
        summary: 'Builds many decision trees on random data subsets and random feature subsets, then averages their votes.',
        intuition: 'One tree is unstable — change a few data points and the whole tree structure changes. But if you grow many trees, each on a slightly different random sample and with random feature subsets, their collective vote is much more stable. This is the "wisdom of crowds" applied to ML.',
        mathContent: (
            <>
                <MathBlock label="Ensemble Prediction">{'\\hat{y} = \\text{mode}\\{T_1(x), T_2(x), \\ldots, T_B(x)\\}'}</MathBlock>
                <MathBlock label="Variance Reduction">{'\\text{Var}(\\bar{T}) = \\rho \\sigma^2 + \\frac{1-\\rho}{B} \\sigma^2'}</MathBlock>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 8 }}>
                    <M>{'\\rho'}</M> = correlation between trees. Random feature subsets reduce <M>{'\\rho'}</M>, improving ensemble quality.
                </p>
            </>
        ),
        steps: [
            { title: 'Bootstrap sample —', text: 'Draw random sample with replacement from training data.' },
            { title: 'Random features —', text: 'At each split, consider only √p random features.' },
            { title: 'Grow tree —', text: 'Build full decision tree on this sample.' },
            { title: 'Aggregate —', text: 'Repeat B times, majority vote for classification.' },
        ],
        whenToUse: 'Best default ensemble. Works well on most tabular data. Rarely overfits. Great feature importance.',
        prosAndCons: {
            pros: ['Robust against overfitting', 'Handles missing values and mixed types', 'Built-in feature importance', 'Embarrassingly parallel'],
            cons: ['Less interpretable than single tree', 'Can be slow with many trees', 'Biased toward high-cardinality features', 'Does not optimize residuals like boosting'],
        },
    },
    {
        id: 'gradientBoosting', label: 'Gradient Boosting', color: '#9B5DE5', icon: '📈',
        summary: 'Builds trees sequentially — each new tree corrects the errors (residuals) of the previous ensemble.',
        intuition: 'Instead of growing trees independently, gradient boosting learns from mistakes. Tree 1 makes predictions, tree 2 fits the residuals of tree 1, tree 3 fits the residuals of (tree 1 + tree 2), and so on. Each tree makes a small correction, and they accumulate into a powerful model. Learning rate controls how much each tree contributes.',
        mathContent: (
            <>
                <MathBlock label="Additive Model">{'F_m(x) = F_{m-1}(x) + \\eta \\cdot h_m(x)'}</MathBlock>
                <MathBlock label="Fit Residuals">{'h_m = \\arg\\min_h \\sum_{i=1}^{n} L(y^{(i)}, F_{m-1}(x^{(i)}) + h(x^{(i)}))'}</MathBlock>
            </>
        ),
        steps: [
            { title: 'Initialize —', text: 'Start with a simple prediction (e.g., mean).' },
            { title: 'Compute residuals —', text: 'Calculate error of current ensemble.' },
            { title: 'Fit next tree —', text: 'Train a shallow tree on the residuals.' },
            { title: 'Update —', text: 'Add tree × learning rate to ensemble, repeat.' },
        ],
        whenToUse: 'When you need maximum accuracy on tabular data. Requires more careful tuning (learning rate, depth, n_estimators) than Random Forest.',
        prosAndCons: {
            pros: ['Often achieves best accuracy on tabular data', 'Reduces bias through sequential correction', 'Flexible loss functions', 'Feature importance available'],
            cons: ['Sequential — cannot parallelize tree building', 'Prone to overfitting without regularization', 'Sensitive to hyperparameters', 'Slower training than bagging'],
        },
    },
    {
        id: 'xgboost', label: 'XGBoost', color: '#F97316', icon: '⚡',
        summary: 'Optimized gradient boosting with built-in regularization, parallel computation, and pruning.',
        intuition: 'XGBoost is gradient boosting on steroids. It adds L1/L2 regularization to prevent overfitting, uses a second-order Taylor approximation for faster optimization, handles missing values natively, and parallelizes the split-finding process. It\'s the go-to algorithm for ML competitions.',
        mathContent: (
            <>
                <MathBlock label="Regularized Objective">{'\\mathcal{L} = \\sum_{i} l(y_i, \\hat{y}_i) + \\sum_{k} \\Omega(f_k) \\quad \\text{where } \\Omega(f) = \\gamma T + \\frac{1}{2}\\lambda \\|w\\|^2'}</MathBlock>
            </>
        ),
        steps: [
            { title: 'Compute gradients —', text: 'First and second order gradients of loss.' },
            { title: 'Find splits —', text: 'Histogram-based parallel split finding.' },
            { title: 'Prune —', text: 'Remove splits that don\'t improve regularized objective.' },
            { title: 'Update —', text: 'Add regularized weak learner to ensemble.' },
        ],
        whenToUse: 'Default choice for tabular ML competitions. Best when you need maximum performance with reasonable training time.',
        prosAndCons: {
            pros: ['State-of-the-art tabular performance', 'Built-in regularization', 'Handles missing values', 'Fast parallel training'],
            cons: ['Many hyperparameters to tune', 'Less interpretable', 'Can overfit on small data', 'Complex implementation'],
        },
    },
];

const BAGGING_VS_BOOSTING = [
    ['Bagging (RF, Extra Trees)', 'Independent trees', 'Reduced variance', 'Parallel', 'Moderate'],
    ['Boosting (GB, XGBoost)', 'Sequential correction', 'Reduced bias', 'Sequential', 'Higher (often best)'],
    ['AdaBoost', 'Re-weight misclassified', 'Reduced bias', 'Sequential', 'Good (simpler)'],
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
                    </div>
                    <div className={`explain-badge ${explainMode ? 'on' : 'off'}`} onClick={() => setExplainMode(!explainMode)}>
                        {explainMode ? '💡 Explain ON' : '💡 Explain OFF'}
                    </div>
                </div>
            </div>

            {/* ═══════ INTRODUCTION ═══════ */}
            <IntroSection
                title="What are Ensemble Methods?"
                subtitle="Combining many weak learners into one powerful predictor — the power of collective intelligence."
                goalText="Understand bagging vs boosting, how Random Forest reduces variance, how Gradient Boosting reduces bias, and when to use each ensemble family."
                paragraphs={[
                    'Ensemble methods combine multiple individual models (often decision trees) to produce a single, more accurate prediction. The core insight is that many imperfect models, when combined intelligently, can outperform any single complex model.',
                    'There are two main families: Bagging (e.g., Random Forest) trains models independently on random data subsets and averages them to reduce variance. Boosting (e.g., XGBoost) trains models sequentially, with each new model correcting the errors of the previous ones, reducing bias.',
                    'Ensemble methods dominate ML competitions and real-world tabular data tasks. Random Forest is the safest default for most problems, while XGBoost/LightGBM often achieve the best performance when properly tuned.',
                ]}
                realWorld={{
                    title: 'Where are Ensembles Used?',
                    items: [
                        { icon: '🏦', text: 'Credit scoring — banks use gradient boosting for loan default prediction' },
                        { icon: '🏆', text: 'Kaggle competitions — XGBoost/LightGBM win most tabular data competitions' },
                        { icon: '🔬', text: 'Drug discovery — Random Forest predicts molecular properties from structure' },
                        { icon: '📡', text: 'Radar/satellite — ensemble classifiers detect objects in noisy sensor data' },
                        { icon: '🛡️', text: 'Cybersecurity — ensemble detectors identify network intrusions' },
                        { icon: '📊', text: 'Business analytics — customer churn, sales forecasting, risk modeling' },
                    ],
                }}
                prerequisites={[
                    'Basic understanding of Decision Trees (splits, depth, overfitting)',
                    'Concept of bias-variance tradeoff',
                    'Familiarity with classification metrics (accuracy, F1)',
                ]}
            />

            {/* ═══════ MATHEMATICAL FOUNDATION ═══════ */}
            <div className="section-divider-labeled"><span>Mathematical Foundation</span></div>

            <motion.section className="math-foundation" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.45 }}>
                <h2>Bagging vs Boosting</h2>
                <div className="grid-2" style={{ gap: 24, alignItems: 'start' }}>
                    <div>
                        <h3 style={{ marginBottom: 12 }}>Bagging (Bootstrap Aggregating)</h3>
                        <MathBlock label="Ensemble Vote">{'\\hat{y} = \\text{mode}\\{h_1(x), h_2(x), \\ldots, h_B(x)\\}'}</MathBlock>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: 12 }}>
                            Each <M>{'h_b'}</M> is trained on a bootstrap sample. Independent training → variance reduction.
                        </p>
                    </div>
                    <div>
                        <h3 style={{ marginBottom: 12 }}>Boosting (Sequential)</h3>
                        <MathBlock label="Additive Model">{'F_M(x) = \\sum_{m=1}^{M} \\eta \\cdot h_m(x)'}</MathBlock>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: 12 }}>
                            Each <M>{'h_m'}</M> corrects the errors of <M>{'F_{m-1}'}</M>. Sequential correction → bias reduction.
                        </p>
                    </div>
                </div>
            </motion.section>

            {/* ═══════ ALGORITHM DEEP DIVES ═══════ */}
            <div className="section-divider-labeled"><span>Algorithm Deep Dives</span></div>

            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.45 }}>
                <h2 style={{ marginBottom: 8 }}>Key Ensemble Algorithms</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
                    Click to explore. The selected algorithm will be used in the Experiment step.
                </p>
                {ALGORITHM_DIVES.map((algo) => (
                    <AlgorithmDeepDive key={algo.id} {...algo} active={algorithm === algo.id} onSelect={setAlgorithm} />
                ))}
            </motion.section>

            {/* ═══════ COMPARISON TABLE ═══════ */}
            <ComparisonTable
                caption="📊 Bagging vs Boosting"
                headers={['Family', 'Tree Strategy', 'Primary Benefit', 'Training', 'Typical Accuracy']}
                rows={BAGGING_VS_BOOSTING}
            />

            {/* ═══════ INTERACTIVE LAB ═══════ */}
            <div className="section-divider-labeled"><span>Interactive Lab</span></div>

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
                        <h2>Concept Deep Dives</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                            Follow the story below — each ensemble strategy addresses a different weakness, building toward the most powerful approaches.
                        </p>

                        <div className="narrative-flow">

                            {/* ── 1. Bagging ── */}
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
                                Bagging reduces <strong>variance</strong> by averaging independent models. But what if the base learners are too weak to capture the real pattern? We need a strategy that directly fixes mistakes…
                            </div>

                            {/* ── 2. Boosting ── */}
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
                                Boosting builds sequentially, but what if we have <strong>different types</strong> of models that are each good at different things? We can combine their decisions democratically…
                            </div>

                            {/* ── 3. Voting ── */}
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
                                The ideas above are powerful, but naive implementations can overfit or be slow. Can we get <strong>regularized, optimized</strong> boosting that dominates competitions?
                            </div>

                            {/* ── 4. XGBoost Family ── */}
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

                        <div className="step-actions">
                            <button className="btn btn-primary" onClick={handleGoNext}>Next → Experiment 🧪</button>
                        </div>
                    </div>
                )}

                {step === 1 && (
                    <div className="step-content">
                        <h2>Configure</h2>

                        <h3 style={{ marginBottom: 12 }}>Choose Ensemble Method</h3>
                        <div className="algo-selector" style={{ marginBottom: 20 }}>
                            {ALGORITHMS.map(a => (
                                <button key={a.id} className={`algo-pill ${algorithm === a.id ? 'active' : ''}`}
                                    style={{ '--pill-color': a.color }} onClick={() => setAlgorithm(a.id)}>{a.label}</button>
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
