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
import IntroSection from '../components/IntroSection';
import AlgorithmDeepDive from '../components/AlgorithmDeepDive';
import MathBlock, { M } from '../components/MathBlock';
import ComparisonTable from '../components/ComparisonTable';
import KeyTakeaways from '../components/KeyTakeaways';
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

const ALGORITHM_DIVES = [
    {
        id: 'logistic', label: 'Logistic Regression', color: '#4F8BF9', icon: '📈',
        summary: 'Maps a linear score through a sigmoid function to output class probability between 0 and 1.',
        intuition: 'Instead of predicting a continuous value, we want a probability. Logistic regression computes a weighted sum of features (just like linear regression), then squashes the output through a sigmoid curve. This converts any real number into a probability between 0 and 1. A threshold (default 0.5) then decides the class.',
        mathContent: (
            <>
                <MathBlock label="Sigmoid Function">{'\\sigma(z) = \\frac{1}{1 + e^{-z}} \\quad \\text{where } z = \\theta^T x'}</MathBlock>
                <MathBlock label="Log-Loss (Binary Cross-Entropy)">{'J(\\theta) = -\\frac{1}{m} \\sum_{i=1}^{m} \\left[ y^{(i)} \\log(h_\\theta(x^{(i)})) + (1-y^{(i)}) \\log(1-h_\\theta(x^{(i)})) \\right]'}</MathBlock>
                <MathBlock label="Decision Rule">{'\\hat{y} = \\begin{cases} 1 & \\text{if } \\sigma(\\theta^T x) \\geq \\text{threshold} \\\\ 0 & \\text{otherwise} \\end{cases}'}</MathBlock>
            </>
        ),
        steps: [
            { title: 'Compute linear score —', text: 'z = θᵀx (weighted sum of features).' },
            { title: 'Apply sigmoid —', text: 'Convert z to probability p = σ(z).' },
            { title: 'Optimize —', text: 'Minimize log-loss via gradient descent.' },
            { title: 'Threshold —', text: 'Compare p with threshold to decide class.' },
        ],
        whenToUse: 'Best when you need probability estimates, interpretable coefficients, and a fast linear baseline. Works well for linearly separable classes.',
        prosAndCons: {
            pros: ['Outputs calibrated probabilities', 'Fast training, highly interpretable', 'Threshold tunable for precision/recall tradeoff', 'Regularization (L1/L2) available'],
            cons: ['Cannot capture non-linear boundaries', 'Requires feature engineering for complex patterns', 'Assumes linearity in log-odds', 'Sensitive to correlated features'],
        },
    },
    {
        id: 'knn', label: 'K-Nearest Neighbors', color: '#9B5DE5', icon: '👥',
        summary: 'Classifies by finding the k closest training points and taking a majority vote.',
        intuition: 'KNN is the ultimate "lazy" learner — it memorizes the entire training set and only does work at prediction time. To classify a new point, it measures distance to every stored example, picks the k closest ones, and takes a majority vote. Small k captures local patterns but is noisy; large k is smoother but may miss details.',
        mathContent: (
            <>
                <MathBlock label="Euclidean Distance">{'d(x, x\') = \\sqrt{\\sum_{j=1}^{n} (x_j - x\'_j)^2}'}</MathBlock>
                <MathBlock label="Prediction">{'\\hat{y} = \\text{mode}\\{ y^{(i)} : x^{(i)} \\in \\text{kNN}(x) \\}'}</MathBlock>
            </>
        ),
        steps: [
            { title: 'Store training data —', text: 'No training step, just memorize all examples.' },
            { title: 'Compute distances —', text: 'For new point, measure distance to all stored points.' },
            { title: 'Select k nearest —', text: 'Pick the k closest training examples.' },
            { title: 'Vote —', text: 'Majority class among neighbors wins.' },
        ],
        whenToUse: 'Best for small datasets with complex, non-linear boundaries. Great first baseline that requires no assumptions about data distribution.',
        prosAndCons: {
            pros: ['No training phase, simple to implement', 'Naturally handles multi-class', 'Can capture any decision boundary shape', 'Non-parametric — no assumptions'],
            cons: ['Slow prediction (O(n) per query)', 'Sensitive to irrelevant features and scale', 'Struggles in high dimensions (curse of dimensionality)', 'Requires choosing k and distance metric'],
        },
    },
    {
        id: 'svm', label: 'Support Vector Machine', color: '#06D6A0', icon: '🎯',
        summary: 'Finds the hyperplane that maximizes the margin between classes, supported by a few critical points.',
        intuition: 'Imagine drawing a line between two groups of points. Many lines could separate them, but SVM finds the one with the widest "highway" (margin) between classes. The points closest to this highway are called support vectors — they alone define the boundary. The wider the margin, the more robust the classifier.',
        mathContent: (
            <>
                <MathBlock label="Optimization Objective">{'\\min_{w,b} \\frac{1}{2} \\|w\\|^2 \\quad \\text{s.t. } y^{(i)}(w^T x^{(i)} + b) \\geq 1 \\; \\forall i'}</MathBlock>
                <MathBlock label="Soft-Margin (with slack)">{'\\min_{w,b,\\xi} \\frac{1}{2} \\|w\\|^2 + C \\sum_{i=1}^{m} \\xi_i'}</MathBlock>
            </>
        ),
        steps: [
            { title: 'Find separating hyperplane —', text: 'w·x + b = 0 that splits classes.' },
            { title: 'Maximize margin —', text: 'Push hyperplane to widest gap between classes.' },
            { title: 'Allow slack —', text: 'Soft margin (C parameter) permits some misclassification.' },
            { title: 'Predict —', text: 'New points classified by which side of boundary they fall on.' },
        ],
        whenToUse: 'Excellent for medium-sized datasets with clear margins. The C parameter controls the bias-variance tradeoff directly.',
        prosAndCons: {
            pros: ['Effective in high-dimensional spaces', 'Memory-efficient (uses only support vectors)', 'Robust against overfitting with proper C', 'Kernel trick enables non-linear boundaries'],
            cons: ['Slow on large datasets (O(n²) to O(n³))', 'No native probability output', 'Sensitive to feature scaling', 'Hard to interpret in high dimensions'],
        },
    },
    {
        id: 'naiveBayes', label: 'Naive Bayes', color: '#F97316', icon: '📊',
        summary: 'Applies Bayes\' theorem with a strong (naive) assumption that all features are independent.',
        intuition: 'Naive Bayes flips the problem: instead of learning a boundary, it models how likely each feature value is given each class, then uses Bayes\' theorem to compute class probability. The "naive" part is assuming features are independent — which is rarely true but works surprisingly well in practice, especially for text classification.',
        mathContent: (
            <>
                <MathBlock label="Bayes' Theorem">{'P(y|x) = \\frac{P(x|y) \\cdot P(y)}{P(x)}'}</MathBlock>
                <MathBlock label="Naive Independence Assumption">{'P(x|y) = \\prod_{j=1}^{n} P(x_j|y)'}</MathBlock>
                <MathBlock label="Decision Rule">{'\\hat{y} = \\arg\\max_{y} P(y) \\prod_{j=1}^{n} P(x_j | y)'}</MathBlock>
            </>
        ),
        steps: [
            { title: 'Estimate priors —', text: 'P(y) from class frequencies in training data.' },
            { title: 'Estimate likelihoods —', text: 'P(xⱼ|y) for each feature per class.' },
            { title: 'Apply Bayes\' rule —', text: 'Multiply prior × all likelihoods.' },
            { title: 'Predict —', text: 'Choose class with highest posterior probability.' },
        ],
        whenToUse: 'Excellent for text classification, spam filtering, and when you have limited data. Works best when features are actually somewhat independent.',
        prosAndCons: {
            pros: ['Extremely fast training and prediction', 'Works well with small training sets', 'Handles many features naturally', 'Easy to interpret and update incrementally'],
            cons: ['Independence assumption rarely holds', 'Cannot learn feature interactions', 'Probability estimates are often poorly calibrated', 'Zero-frequency problem needs smoothing'],
        },
    },
    {
        id: 'decisionTree', label: 'Decision Tree', color: '#EC4899', icon: '🌳',
        summary: 'Recursively splits data using yes/no questions on features until reaching pure groups.',
        intuition: 'A decision tree asks a series of yes/no questions about your features, like a flowchart. At each step, it picks the question that best separates the classes (measured by Gini impurity or information gain). It keeps splitting until groups are pure or a depth limit is reached. The result is a tree you can literally read and explain.',
        mathContent: (
            <>
                <MathBlock label="Gini Impurity">{'G = 1 - \\sum_{k=1}^{K} p_k^2'}</MathBlock>
                <MathBlock label="Information Gain (Entropy)">{'H = -\\sum_{k=1}^{K} p_k \\log_2(p_k)'}</MathBlock>
                <MathBlock label="Split Criterion">{'\\text{Gain} = H(\\text{parent}) - \\sum_{j} \\frac{|D_j|}{|D|} H(D_j)'}</MathBlock>
            </>
        ),
        steps: [
            { title: 'Choose best split —', text: 'Test each feature threshold, pick the one maximizing information gain.' },
            { title: 'Split data —', text: 'Partition samples into left/right branches.' },
            { title: 'Recurse —', text: 'Repeat splitting on each branch until stopping criteria.' },
            { title: 'Predict —', text: 'Follow branch path for new point, return leaf class.' },
        ],
        whenToUse: 'Use when interpretability is critical. Great for understanding feature importance. Often used as building blocks for ensemble methods (Random Forest, XGBoost).',
        prosAndCons: {
            pros: ['Fully interpretable — can visualize the tree', 'Handles non-linear relationships', 'No feature scaling required', 'Captures feature interactions naturally'],
            cons: ['Prone to overfitting (deep trees memorize noise)', 'Unstable — small data changes can change entire tree', 'Biased toward features with many levels', 'Greedy splitting may miss globally optimal structure'],
        },
    },
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
                    </div>
                    <div
                        className={`explain-badge ${explainMode ? 'on' : 'off'}`}
                        onClick={() => setExplainMode(!explainMode)}
                    >
                        {explainMode ? '💡 Explain ON' : '💡 Explain OFF'}
                    </div>
                </div>
            </div>

            {/* ═══════ INTRODUCTION (GFG-style) ═══════ */}
            <IntroSection
                title="What is Classification?"
                subtitle="Teaching machines to assign labels — the gateway to intelligent decision-making."
                goalText="Understand how classifiers learn decision boundaries, why different algorithms suit different data geometries, and how to evaluate beyond raw accuracy."
                paragraphs={[
                    'Classification is a supervised learning task where the goal is to predict a discrete class label for new observations based on patterns learned from labeled training data. Unlike regression (which predicts continuous values), classification outputs categories — spam vs. not-spam, disease vs. healthy, cat vs. dog.',
                    'The fundamental challenge is learning a decision boundary — a surface in feature space that separates different classes. Simple algorithms like Logistic Regression learn linear boundaries, while more complex ones like KNN or Decision Trees can capture non-linear, intricate boundaries.',
                    'Evaluation is nuanced: accuracy alone can be misleading (a spam filter that never flags spam is 95% "accurate" if only 5% of email is spam). Precision, Recall, F1, ROC curves, and confusion matrices give a complete picture of classifier performance.',
                ]}
                realWorld={{
                    title: 'Where is Classification Used?',
                    items: [
                        { icon: '📧', text: 'Email spam detection — filtering unwanted messages automatically' },
                        { icon: '🏥', text: 'Medical diagnosis — detecting disease from symptoms and lab results' },
                        { icon: '💳', text: 'Fraud detection — flagging suspicious transactions in real-time' },
                        { icon: '🔤', text: 'Handwriting/OCR recognition — converting images to text characters' },
                        { icon: '🎭', text: 'Sentiment analysis — classifying reviews as positive, negative, or neutral' },
                        { icon: '🚗', text: 'Autonomous driving — identifying objects (pedestrian, car, sign) from camera feeds' },
                    ],
                }}
                prerequisites={[
                    'Understanding of labeled data (each example has an X and a known category Y)',
                    'Basic concept of distance between data points',
                    'Intuition about probability (likelihood of an event)',
                ]}
            />

            {/* ═══════ MATHEMATICAL FOUNDATION ═══════ */}
            <div className="section-divider-labeled"><span>Mathematical Foundation</span></div>

            <motion.section className="math-foundation" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.45 }}>
                <h2>Core Concepts in Classification</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 20, maxWidth: '70ch' }}>
                    Classification models learn to draw boundaries in feature space. The math varies by algorithm, but evaluation metrics are shared across all.
                </p>
                <div className="grid-2" style={{ gap: 24, alignItems: 'start' }}>
                    <div>
                        <h3 style={{ marginBottom: 12 }}>The Sigmoid Function</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
                            The sigmoid squashes any real number into [0, 1], making it perfect for probability estimation.
                        </p>
                        <MathBlock label="Sigmoid">{'\\sigma(z) = \\frac{1}{1 + e^{-z}}'}</MathBlock>
                        <MathBlock label="Log-Odds (Logit)">{'\\log \\frac{p}{1-p} = \\theta^T x'}</MathBlock>
                    </div>
                    <div>
                        <h3 style={{ marginBottom: 12 }}>Evaluation Metrics</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
                            Beyond accuracy: precision asks "of predicted positives, how many are correct?", recall asks "of actual positives, how many did we find?"
                        </p>
                        <MathBlock label="Precision">{'\\text{Precision} = \\frac{TP}{TP + FP}'}</MathBlock>
                        <MathBlock label="Recall">{'\\text{Recall} = \\frac{TP}{TP + FN}'}</MathBlock>
                        <MathBlock label="F1 Score">{'F_1 = 2 \\cdot \\frac{\\text{Precision} \\cdot \\text{Recall}}{\\text{Precision} + \\text{Recall}}'}</MathBlock>
                    </div>
                </div>
            </motion.section>

            {/* ═══════ ALGORITHM DEEP DIVES ═══════ */}
            <div className="section-divider-labeled"><span>Algorithm Deep Dives</span></div>

            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.45 }}>
                <h2 style={{ marginBottom: 8 }}>Understanding Each Classifier</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
                    Click any algorithm to see its math, intuition, and tradeoffs. The selected one will be used in the Experiment step.
                </p>
                {ALGORITHM_DIVES.map((algo) => (
                    <AlgorithmDeepDive key={algo.id} {...algo} active={algorithm === algo.id} onSelect={setAlgorithm} />
                ))}
            </motion.section>

            {/* ═══════ COMPARISON TABLE ═══════ */}
            <ComparisonTable
                caption="📊 Classifier Comparison"
                headers={['Algorithm', 'Boundary Type', 'Training Speed', 'Interpretability', 'Best For']}
                rows={[
                    ['Logistic Regression', 'Linear', '⚡ Very Fast', '✅ High', 'Probability estimates, linear problems'],
                    ['KNN', 'Non-linear', '⚡ Instant (lazy)', '⚠️ Medium', 'Small data, complex boundaries'],
                    ['SVM', 'Linear/Non-linear', '🐌 Moderate', '⚠️ Medium', 'Clear margin separation'],
                    ['Naive Bayes', 'Linear', '⚡ Very Fast', '✅ High', 'Text classification, small data'],
                    ['Decision Tree', 'Non-linear', '⚡ Fast', '✅ Very High', 'Interpretability, feature importance'],
                ]}
            />

            {/* ═══════ INTERACTIVE LAB ═══════ */}
            <div className="section-divider-labeled"><span>Interactive Lab</span></div>

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
                        <h2>Concept Deep Dives</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                            Follow the narrative below — each classifier introduces a fundamentally different way of thinking about decision boundaries.
                        </p>

                        <div className="narrative-flow">

                            {/* ── 1. Logistic Regression ── */}
                            <div className="narrative-section">
                                <div className="narrative-header">
                                    <span className="narrative-step-badge">1</span>
                                    <h3>Probability-Based Decisions: Logistic Regression</h3>
                                </div>
                                <TeachingFrame
                                    title="Logistic Regression — Beginner Lens"
                                    background={CONCEPT_GUIDES[0].background}
                                    what={CONCEPT_GUIDES[0].what}
                                    why={CONCEPT_GUIDES[0].why}
                                    how={CONCEPT_GUIDES[0].how}
                                    tryThis={CONCEPT_GUIDES[0].tryThis}
                                />
                                <div className="concept-area" style={{ marginTop: 24 }}>
                                    <LogisticRegressionConcept />
                                </div>
                            </div>

                            <div className="narrative-transition">
                                Logistic Regression draws a <strong>linear boundary</strong> using probability. But what if the true decision boundary is curved or irregular? Let's explore a fundamentally different, assumption-free approach…
                            </div>

                            {/* ── 2. k-Nearest Neighbors ── */}
                            <div className="narrative-section">
                                <div className="narrative-header">
                                    <span className="narrative-step-badge">2</span>
                                    <h3>Learning by Example: k-Nearest Neighbors</h3>
                                </div>
                                <TeachingFrame
                                    title="k-Nearest Neighbors — Beginner Lens"
                                    background={CONCEPT_GUIDES[1].background}
                                    what={CONCEPT_GUIDES[1].what}
                                    why={CONCEPT_GUIDES[1].why}
                                    how={CONCEPT_GUIDES[1].how}
                                    tryThis={CONCEPT_GUIDES[1].tryThis}
                                />
                                <div className="concept-area" style={{ marginTop: 24 }}>
                                    <KNNConcept />
                                </div>
                            </div>

                        </div>

                        <KeyTakeaways items={[
                            'The sigmoid function converts linear scores to probabilities for threshold-based classification.',
                            'KNN makes no assumptions — it lets data speak directly through neighbor voting.',
                            'Accuracy is misleading with imbalanced classes. Use Precision, Recall, and F1 instead.',
                            'Decision boundaries can be linear or non-linear — choose the algorithm based on data geometry.',
                        ]} />

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

                        {/* Algorithm Selector in Experiment */}
                        <h3 style={{ marginBottom: 12 }}>Choose Classifier</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 12, fontSize: '0.9rem' }}>
                            Select the classification algorithm to use. Scroll up to the Algorithm Deep Dives to understand each one.
                        </p>
                        <div className="algo-selector" style={{ marginBottom: 20 }}>
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
                                    <ChallengeUnlock awardBadge={awardBadge} awardXP={awardXP} badge="Classification Master" />
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
