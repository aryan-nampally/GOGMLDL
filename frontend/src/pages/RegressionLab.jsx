import { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { useFocus } from '../context/FocusContext';
import regressionEngine from '../engines/regressionEngine';
import { runPipeline } from '../engines/baseEngine';
import { PAGE_TRANSITION, STEP_SWITCH, REVEAL, POP } from '../utils/motion';

import IntroSection from '../components/IntroSection';
import AlgorithmDeepDive from '../components/AlgorithmDeepDive';
import MathBlock, { M } from '../components/MathBlock';
import ComparisonTable from '../components/ComparisonTable';
import KeyTakeaways from '../components/KeyTakeaways';

import RopeAnalogy from '../components/concepts/RopeAnalogy';
import GradientDescent from '../components/concepts/GradientDescent';
import RSquaredViz from '../components/concepts/RSquared';
import Assumptions from '../components/concepts/Assumptions';
import ExperimentLab from '../components/ExperimentLab';
import Quiz from '../components/Quiz';
import TeachingFrame from '../components/TeachingFrame';
import LearningJourney from '../components/LearningJourney';
import './RegressionLab.css';

const RegressionChart = lazy(() => import('../components/RegressionChart'));
const ResidualChart = lazy(() => import('../components/ResidualChart'));
const CodeSnippet = lazy(() => import('../components/CodeSnippet'));
const SnapshotCompare = lazy(() => import('../components/SnapshotCompare'));

const ChartLoader = () => (
    <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Loading chart…
    </div>
);

/* ═══════════════════════════════════════════════════
   CONTENT DATA
   ═══════════════════════════════════════════════════ */

const STEPS = [
    { label: 'Understand', icon: '💡' },
    { label: 'Experiment', icon: '🧪' },
    { label: 'Results', icon: '📊' },
    { label: 'Challenge', icon: '🏆' },
];

const STORY_BEATS = [
    { title: 'Build your mental model first', text: 'Start with intuition: what a best-fit line means, what error means, and why optimization is needed.' },
    { title: 'Take control of the model', text: 'Change data noise and regularization to feel how each knob changes fit quality and generalization.' },
    { title: 'Read the model like an engineer', text: 'Interpret metrics and residuals to decide whether the model is reliable or just looks good.' },
    { title: 'Prove mastery under constraints', text: 'Use what you learned to hit the challenge target with fewer guesses and clearer reasoning.' },
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

const ALGORITHM_DIVES = [
    {
        id: 'linear', label: 'Linear Regression (OLS)', color: '#4F8BF9', icon: '📏',
        summary: 'Ordinary Least Squares — finds the line that minimizes total squared error with no penalty.',
        intuition: 'Imagine stretching a rubber band between your data points and a straight line. OLS finds the position where the total stretch (squared distances) is smallest. It\'s the simplest, most interpretable form of regression — a direct closed-form solution exists, so no iterative training is needed.',
        mathContent: (
            <>
                <MathBlock label="Hypothesis (Model)">{'h_\\theta(x) = \\theta_0 + \\theta_1 x_1 + \\theta_2 x_2 + \\cdots + \\theta_n x_n = \\mathbf{\\theta}^T \\mathbf{x}'}</MathBlock>
                <MathBlock label="Cost Function (MSE)">{'J(\\theta) = \\frac{1}{2m} \\sum_{i=1}^{m} \\left( h_\\theta(x^{(i)}) - y^{(i)} \\right)^2'}</MathBlock>
                <MathBlock label="Normal Equation (Closed-Form)">{'\\theta = (X^T X)^{-1} X^T y'}</MathBlock>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 8 }}>
                    Where <M>{'m'}</M> = number of training examples, <M>{'X'}</M> = feature matrix, <M>{'y'}</M> = target vector.
                </p>
            </>
        ),
        steps: [
            { title: 'Collect data —', text: 'Gather paired observations (features X, target y).' },
            { title: 'Compute means —', text: 'Find the mean of X and y for centering.' },
            { title: 'Calculate slope —', text: 'Use the covariance of X and y divided by variance of X.' },
            { title: 'Calculate intercept —', text: 'Solve θ₀ = ȳ − θ₁x̄.' },
            { title: 'Predict —', text: 'For any new x, compute ŷ = θ₀ + θ₁x.' },
        ],
        whenToUse: 'Best for problems where you expect a roughly linear relationship, have few features relative to samples, and need full interpretability. Not suitable when features are highly correlated (multicollinearity) or when you have more features than samples.',
        prosAndCons: {
            pros: ['Simple, fast, and fully interpretable', 'Closed-form solution — no hyperparameters', 'Statistical inference available (confidence intervals, p-values)', 'Works well when assumptions are satisfied'],
            cons: ['Sensitive to outliers (squared error amplifies large deviations)', 'Cannot handle non-linear relationships without feature engineering', 'Fails when features outnumber samples', 'Assumes homoscedasticity and normal residuals'],
        },
    },
    {
        id: 'ridge', label: 'Ridge Regression (L2)', color: '#9B5DE5', icon: '🛡️',
        summary: 'Adds an L2 penalty to shrink coefficients — prevents overfitting without eliminating features.',
        intuition: 'Ridge adds a "tax" on large coefficients. The model must balance fitting the data well against keeping weights small. This prevents any single feature from dominating the prediction, which is especially helpful when features are correlated. Coefficients shrink but never reach exactly zero.',
        mathContent: (
            <>
                <MathBlock label="Ridge Cost Function">{'J(\\theta) = \\frac{1}{2m} \\sum_{i=1}^{m} \\left( h_\\theta(x^{(i)}) - y^{(i)} \\right)^2 + \\lambda \\sum_{j=1}^{n} \\theta_j^2'}</MathBlock>
                <MathBlock label="Ridge Solution">{'\\theta = (X^T X + \\lambda I)^{-1} X^T y'}</MathBlock>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 8 }}>
                    <M>{'\\lambda'}</M> controls regularization strength. The identity matrix <M>{'I'}</M> makes the system always invertible.
                </p>
            </>
        ),
        steps: [
            { title: 'Choose λ —', text: 'Select regularization strength (often via cross-validation).' },
            { title: 'Augment cost —', text: 'Add λΣθ² penalty to the standard MSE loss.' },
            { title: 'Solve —', text: 'Use the Ridge closed-form or gradient descent with the regularized gradient.' },
            { title: 'Evaluate —', text: 'Check if coefficients are more stable and test error is lower vs OLS.' },
        ],
        whenToUse: 'Use when you have many correlated features and want to keep all of them while reducing overfitting. Especially useful in high-dimensional settings where OLS becomes unstable.',
        prosAndCons: {
            pros: ['Handles multicollinearity gracefully', 'Always has a unique solution', 'Reduces overfitting while keeping all features', 'Works well with many features'],
            cons: ['Does not perform feature selection (all coefficients stay non-zero)', 'Less interpretable when many features contribute small amounts', 'Requires tuning the λ hyperparameter', 'Still assumes linearity'],
        },
    },
    {
        id: 'lasso', label: 'Lasso Regression (L1)', color: '#06D6A0', icon: '✂️',
        summary: 'L1 penalty that can push coefficients to exactly zero — automatic feature selection.',
        intuition: 'Unlike Ridge which shrinks coefficients smoothly, Lasso uses an absolute-value penalty that creates "corners" in the optimization landscape. At these corners, coefficients can become exactly zero — irrelevant features get eliminated automatically.',
        mathContent: (
            <>
                <MathBlock label="Lasso Cost Function">{'J(\\theta) = \\frac{1}{2m} \\sum_{i=1}^{m} \\left( h_\\theta(x^{(i)}) - y^{(i)} \\right)^2 + \\lambda \\sum_{j=1}^{n} |\\theta_j|'}</MathBlock>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 8 }}>
                    The L1 penalty <M>{'\\lambda \\sum |\\theta_j|'}</M> creates sparsity. No closed-form solution — solved via coordinate descent.
                </p>
            </>
        ),
        steps: [
            { title: 'Choose λ —', text: 'Higher λ pushes more features to zero.' },
            { title: 'Apply L1 penalty —', text: 'Add λΣ|θ| to the cost function.' },
            { title: 'Optimize —', text: 'Use coordinate descent (non-differentiable at zero).' },
            { title: 'Inspect sparsity —', text: 'Check which coefficients became zero — those features are irrelevant.' },
        ],
        whenToUse: 'Best when you suspect many features are irrelevant and want automatic selection. Ideal for high-dimensional data where interpretability through sparsity matters.',
        prosAndCons: {
            pros: ['Automatic feature selection', 'Produces sparse, interpretable models', 'Excellent for high-dimensional data', 'Prevents overfitting'],
            cons: ['Arbitrarily selects one among correlated features', 'No closed-form solution', 'May underfit if too aggressive', 'Less stable than Ridge with correlation'],
        },
    },
    {
        id: 'elasticnet', label: 'Elastic Net (L1 + L2)', color: '#F97316', icon: '🔗',
        summary: 'Combines L1 and L2 penalties — gets sparsity from Lasso and stability from Ridge.',
        intuition: 'Elastic Net is the best of both worlds. It uses a mixing parameter (l1_ratio) to balance between Ridge\'s grouping effect and Lasso\'s sparsity. When features come in correlated groups, Elastic Net tends to select the whole group rather than picking one arbitrarily.',
        mathContent: (
            <>
                <MathBlock label="Elastic Net Cost Function">{'J(\\theta) = \\frac{1}{2m} \\sum_{i=1}^{m} \\left( h_\\theta(x^{(i)}) - y^{(i)} \\right)^2 + \\lambda \\left[ \\alpha \\sum_{j=1}^{n} |\\theta_j| + \\frac{(1-\\alpha)}{2} \\sum_{j=1}^{n} \\theta_j^2 \\right]'}</MathBlock>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 8 }}>
                    <M>{'\\alpha = 1'}</M> → pure Lasso. <M>{'\\alpha = 0'}</M> → pure Ridge. Values in between get both benefits.
                </p>
            </>
        ),
        steps: [
            { title: 'Choose λ and α —', text: 'λ = overall strength, α = L1/L2 balance.' },
            { title: 'Combine penalties —', text: 'Apply weighted sum of L1 and L2.' },
            { title: 'Optimize —', text: 'Coordinate descent with the combined gradient.' },
            { title: 'Evaluate —', text: 'Check sparsity with more stable selection than pure Lasso.' },
        ],
        whenToUse: 'Use when features are correlated in groups, you want some feature selection, but also want Ridge\'s stability. Safest default when unsure between Ridge and Lasso.',
        prosAndCons: {
            pros: ['Combines sparsity (Lasso) with stability (Ridge)', 'Handles correlated feature groups', 'More robust selection than pure L1', 'Best default regularized regression'],
            cons: ['Two hyperparameters to tune (λ and α)', 'Slightly more expensive computation', 'Still assumes linear relationships', 'Interpretation requires understanding both penalties'],
        },
    },
];

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */

export default function RegressionLab() {
    const [step, setStep] = useState(0);
    const [concept, setConcept] = useState(0);
    const { awardXP, awardBadge } = useGame();
    const { enterFocus, exitFocus } = useFocus();

    const [explainMode, setExplainMode] = useState(true);
    const [algorithm, setAlgorithm] = useState('linear');
    const [lambda, setLambda] = useState(1.0);
    const [l1Ratio, setL1Ratio] = useState(0.5);

    const [labConfig, setLabConfig] = useState({
        nSamples: 50, noise: 15, slope: 2.5, intercept: 0,
    });

    const fullConfig = useMemo(() => ({
        ...labConfig, algorithm, lambda, l1Ratio,
    }), [labConfig, algorithm, lambda, l1Ratio]);

    const results = useMemo(() => {
        const { data, model, predictions, metrics, summary } = runPipeline(regressionEngine, fullConfig);
        return { X: data.X, y: data.y, model, yPred: predictions, metrics, summary };
    }, [fullConfig]);

    const [showResiduals, setShowResiduals] = useState(false);
    const [showCode, setShowCode] = useState(false);

    const canAdvance = (s) => s <= step;

    const handleStepChange = (newStep) => {
        if (canAdvance(newStep)) {
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
        <motion.div className="regression-page" variants={PAGE_TRANSITION} initial="initial" animate="animate" exit="exit">
            {/* ═══════ HEADER ═══════ */}
            <div className="lab-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <h1 className="gradient-text">Regression Lab</h1>
                    <div className={`explain-badge ${explainMode ? 'on' : 'off'}`} onClick={() => setExplainMode(!explainMode)}>
                        {explainMode ? '💡 Explain ON' : '💡 Explain OFF'}
                    </div>
                </div>
            </div>

            {/* ═══════ INTRODUCTION (GFG-style) ═══════ */}
            <IntroSection
                title="What is Linear Regression?"
                subtitle="The foundation of predictive modeling — fitting a straight line to data."
                goalText="Understand how regression models learn from data, why regularization matters, and how to evaluate model quality using metrics like R² and MSE."
                paragraphs={[
                    'Linear Regression is a supervised machine learning algorithm that models the relationship between a dependent variable (target) and one or more independent variables (features) by fitting a linear equation to the observed data. It is one of the oldest and most widely used statistical methods, dating back to the early 19th century.',
                    'The core idea is simple: given a set of data points, find the straight line (or hyperplane in higher dimensions) that best describes the trend. "Best" is typically defined as minimizing the sum of squared differences between predicted and actual values — this is called the Ordinary Least Squares (OLS) method.',
                    'Despite its simplicity, linear regression is foundational to understanding more complex ML models. Concepts like cost functions, gradient descent, regularization, and model evaluation all originate from or are best understood through the lens of linear regression.',
                ]}
                realWorld={{
                    title: 'Where is Linear Regression Used?',
                    items: [
                        { icon: '🏠', text: 'Predicting house prices based on square footage, location, number of rooms' },
                        { icon: '📈', text: 'Stock price forecasting from historical trends and financial indicators' },
                        { icon: '🏥', text: 'Medical dosage prediction based on patient weight, age, and condition severity' },
                        { icon: '🌡️', text: 'Weather forecasting — predicting temperature from atmospheric variables' },
                        { icon: '💰', text: 'Salary estimation based on years of experience, education level, and role' },
                        { icon: '🏭', text: 'Manufacturing yield prediction from process parameters and raw material quality' },
                    ],
                }}
                prerequisites={[
                    'Basic understanding of variables (X = input, Y = output)',
                    'Concept of a straight line equation: y = mx + b',
                    'Intuition about what "error" or "distance" means',
                ]}
            />

            {/* ═══════ MATHEMATICAL FOUNDATION ═══════ */}
            <div className="section-divider-labeled"><span>Mathematical Foundation</span></div>

            <motion.section className="math-foundation" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.45 }}>
                <h2>The Mathematics Behind Regression</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 20, maxWidth: '70ch' }}>
                    Understanding the math isn't required to use regression, but it gives you the power to debug problems and choose the right algorithm.
                </p>

                <div className="grid-2" style={{ gap: 24, alignItems: 'start' }}>
                    <div>
                        <h3 style={{ marginBottom: 12 }}>Simple Linear Regression</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
                            For one feature, the model is a straight line. We find the slope (<M>{'\\theta_1'}</M>) and intercept (<M>{'\\theta_0'}</M>) that minimize prediction error.
                        </p>
                        <MathBlock label="Model Equation">{'\\hat{y} = \\theta_0 + \\theta_1 x'}</MathBlock>
                        <MathBlock label="Cost Function (MSE)">{'J(\\theta_0, \\theta_1) = \\frac{1}{2m} \\sum_{i=1}^{m} (\\hat{y}^{(i)} - y^{(i)})^2'}</MathBlock>
                    </div>
                    <div>
                        <h3 style={{ marginBottom: 12 }}>Gradient Descent Update Rules</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
                            To minimize cost, we iteratively update parameters in the direction that reduces error. Learning rate (<M>{'\\alpha'}</M>) controls step size.
                        </p>
                        <MathBlock label="Parameter Update">{'\\theta_j := \\theta_j - \\alpha \\frac{\\partial}{\\partial \\theta_j} J(\\theta)'}</MathBlock>
                        <MathBlock label="Gradient">{'\\frac{\\partial J}{\\partial \\theta_j} = \\frac{1}{m} \\sum_{i=1}^{m} (h_\\theta(x^{(i)}) - y^{(i)}) \\cdot x_j^{(i)}'}</MathBlock>
                    </div>
                </div>

                <div style={{ marginTop: 24 }}>
                    <h3 style={{ marginBottom: 12 }}>Evaluation Metrics</h3>
                    <div className="grid-2" style={{ gap: 16 }}>
                        <MathBlock label="R² (Coefficient of Determination)">{'R^2 = 1 - \\frac{\\sum(y^{(i)} - \\hat{y}^{(i)})^2}{\\sum(y^{(i)} - \\bar{y})^2} = 1 - \\frac{SS_{res}}{SS_{tot}}'}</MathBlock>
                        <MathBlock label="Mean Squared Error">{'MSE = \\frac{1}{m} \\sum_{i=1}^{m} (y^{(i)} - \\hat{y}^{(i)})^2'}</MathBlock>
                    </div>
                    <div className="info-card" style={{ marginTop: 12 }}>
                        <strong>Interpretation:</strong> <M>{'R^2 = 1'}</M> = perfect fit. <M>{'R^2 = 0'}</M> = no better than predicting the mean. Negative <M>{'R^2'}</M> = worse than the mean baseline.
                    </div>
                </div>
            </motion.section>

            {/* ═══════ ALGORITHM DEEP DIVES ═══════ */}
            <div className="section-divider-labeled"><span>Algorithm Deep Dives</span></div>

            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.45 }}>
                <h2 style={{ marginBottom: 8 }}>Understanding Each Algorithm</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
                    Click each algorithm to learn how it works, see the math, and understand when to choose it. The selected algorithm will be used in the Experiment step below.
                </p>

                {ALGORITHM_DIVES.map((algo) => (
                    <AlgorithmDeepDive
                        key={algo.id}
                        {...algo}
                        active={algorithm === algo.id}
                        onSelect={setAlgorithm}
                    />
                ))}
            </motion.section>

            {/* ═══════ COMPARISON TABLE ═══════ */}
            <ComparisonTable
                caption="📊 When To Use Which Algorithm?"
                headers={['Algorithm', 'Regularization', 'Feature Selection', 'Best For', 'Hyperparameters']}
                rows={[
                    ['OLS (Linear)', 'None', '❌ No', 'Simple, interpretable models', 'None'],
                    ['Ridge (L2)', 'L2 (squared)', '❌ No (shrinks only)', 'Correlated features, multicollinearity', 'λ'],
                    ['Lasso (L1)', 'L1 (absolute)', '✅ Yes (zeros out weak)', 'High-dimensional, sparse solutions', 'λ'],
                    ['Elastic Net', 'L1 + L2', '✅ Yes (grouped)', 'Correlated groups, uncertain sparsity', 'λ, α'],
                ]}
            />

            {/* ═══════ INTERACTIVE LAB ═══════ */}
            <div className="section-divider-labeled"><span>Interactive Lab</span></div>

            <div className="step-indicator">
                {STEPS.map((s, i) => (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'center' }}>
                        <div
                            className={`step-dot ${i === step ? 'active' : ''} ${i < step ? 'completed' : ''}`}
                            onClick={() => handleStepChange(i)}
                            style={{ cursor: canAdvance(i) ? 'pointer' : 'default' }}
                        >
                            <span>{s.icon}</span><span>{s.label}</span>
                        </div>
                        {i < STEPS.length - 1 && <div className={`step-connector ${i < step ? 'completed' : ''}`} />}
                    </div>
                ))}
            </div>

            <LearningJourney step={step} steps={STEPS} beats={STORY_BEATS} />

            <motion.div key={step} {...STEP_SWITCH}>

                {/* ──── STEP 0: UNDERSTAND ──── */}
                {step === 0 && (
                    <div className="step-content">
                        <h2>Concept Deep Dives</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                            Follow the story below — each concept builds on the previous one to give you a complete understanding of linear regression.
                        </p>

                        <div className="narrative-flow">

                            {/* ── 1. Rope Analogy ── */}
                            <div className="narrative-section">
                                <div className="narrative-header">
                                    <span className="narrative-step-badge">1</span>
                                    <h3>Building Intuition: The Rope Analogy</h3>
                                </div>
                                <TeachingFrame
                                    title="Rope Analogy — Beginner Lens"
                                    background={CONCEPT_GUIDES[0].background}
                                    what={CONCEPT_GUIDES[0].what}
                                    why={CONCEPT_GUIDES[0].why}
                                    how={CONCEPT_GUIDES[0].how}
                                    tryThis={CONCEPT_GUIDES[0].tryThis}
                                />
                                <div className="concept-area">
                                    <RopeAnalogy />
                                </div>
                            </div>

                            <div className="narrative-transition">
                                Now that you see what a best-fit line looks like and how "spring tension" represents error, let's discover how the model actually <strong>learns</strong> that optimal line step by step…
                            </div>

                            {/* ── 2. Gradient Descent ── */}
                            <div className="narrative-section">
                                <div className="narrative-header">
                                    <span className="narrative-step-badge">2</span>
                                    <h3>The Learning Process: Gradient Descent</h3>
                                </div>
                                <TeachingFrame
                                    title="Gradient Descent — Beginner Lens"
                                    background={CONCEPT_GUIDES[1].background}
                                    what={CONCEPT_GUIDES[1].what}
                                    why={CONCEPT_GUIDES[1].why}
                                    how={CONCEPT_GUIDES[1].how}
                                    tryThis={CONCEPT_GUIDES[1].tryThis}
                                />
                                <div className="concept-area">
                                    <GradientDescent />
                                </div>
                            </div>

                            <div className="narrative-transition">
                                The model can now learn parameters through gradient descent — but how do we <strong>quantify</strong> how good the resulting fit really is? We need a single score that captures fit quality…
                            </div>

                            {/* ── 3. R² Score ── */}
                            <div className="narrative-section">
                                <div className="narrative-header">
                                    <span className="narrative-step-badge">3</span>
                                    <h3>Measuring Quality: R² Score</h3>
                                </div>
                                <TeachingFrame
                                    title="R-Squared — Beginner Lens"
                                    background={CONCEPT_GUIDES[2].background}
                                    what={CONCEPT_GUIDES[2].what}
                                    why={CONCEPT_GUIDES[2].why}
                                    how={CONCEPT_GUIDES[2].how}
                                    tryThis={CONCEPT_GUIDES[2].tryThis}
                                />
                                <div className="concept-area">
                                    <RSquaredViz />
                                </div>
                            </div>

                            <div className="narrative-transition">
                                R² tells us fit quality, but blindly trusting it can be dangerous. The model's statistics are only reliable when certain <strong>assumptions</strong> about the data hold true…
                            </div>

                            {/* ── 4. Assumptions ── */}
                            <div className="narrative-section">
                                <div className="narrative-header">
                                    <span className="narrative-step-badge">4</span>
                                    <h3>The Fine Print: Regression Assumptions</h3>
                                </div>
                                <TeachingFrame
                                    title="Assumptions — Beginner Lens"
                                    background={CONCEPT_GUIDES[3].background}
                                    what={CONCEPT_GUIDES[3].what}
                                    why={CONCEPT_GUIDES[3].why}
                                    how={CONCEPT_GUIDES[3].how}
                                    tryThis={CONCEPT_GUIDES[3].tryThis}
                                />
                                <div className="concept-area">
                                    <Assumptions />
                                </div>
                            </div>

                        </div>

                        <KeyTakeaways items={[
                            'The "best" line minimizes total squared distance from data points (least squares).',
                            'Gradient descent iteratively adjusts parameters by moving opposite the error gradient.',
                            'R² tells you how much variance your model explains vs. a naive mean-only baseline.',
                            'Violations of regression assumptions (non-linearity, heteroscedasticity) make results unreliable.',
                        ]} />

                        <div className="step-actions">
                            <button className="btn btn-primary" onClick={handleGoNext}>Next → Try It Yourself 🧪</button>
                        </div>
                    </div>
                )}

                {/* ──── STEP 1: EXPERIMENT ──── */}
                {step === 1 && (
                    <div className="step-content">
                        <Quiz
                            id="q1"
                            question="In the rope analogy, what represents the 'Error'?"
                            options={['The length of the rope', 'The tension in the springs', 'The number of magnets', 'The color of the rod']}
                            correctIdx={1}
                            explanation="The springs stretch to connect the points to the line. The more stretched they are (tension), the higher the error!"
                            xpReward={50}
                        />

                        <div style={{ height: 24 }} />

                        <h3 style={{ marginBottom: 12 }}>Choose Algorithm</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 12, fontSize: '0.9rem' }}>
                            Select the regression method to use. Scroll up to the Algorithm Deep Dives section to learn about each one.
                        </p>
                        <div className="algo-selector" style={{ marginBottom: 16 }}>
                            {ALGORITHM_DIVES.map((a) => (
                                <button
                                    key={a.id}
                                    className={`algo-pill ${algorithm === a.id ? 'active' : ''}`}
                                    style={{ '--pill-color': a.color }}
                                    onClick={() => setAlgorithm(a.id)}
                                >
                                    {a.icon} {a.label}
                                </button>
                            ))}
                        </div>

                        {algorithm !== 'linear' && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="reg-controls" style={{ marginBottom: 16 }}>
                                <div className="reg-slider">
                                    <label>λ (Regularization): <strong>{lambda.toFixed(2)}</strong></label>
                                    <input type="range" min="0.01" max="10" step="0.01" value={lambda} onChange={(e) => setLambda(+e.target.value)} />
                                    {explainMode && <span className="reg-hint">Higher λ = stronger penalty on coefficients. At λ≈0 this becomes OLS.</span>}
                                </div>
                                {algorithm === 'elasticnet' && (
                                    <div className="reg-slider">
                                        <label>L1 Ratio (α): <strong>{l1Ratio.toFixed(2)}</strong></label>
                                        <input type="range" min="0" max="1" step="0.05" value={l1Ratio} onChange={(e) => setL1Ratio(+e.target.value)} />
                                        {explainMode && <span className="reg-hint">α=0 → pure Ridge · α=1 → pure Lasso · Between = Elastic Net</span>}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        <ExperimentLab config={labConfig} onChange={setLabConfig} />

                        <AnimatePresence>
                            {explainMode && (
                                <motion.div {...REVEAL} className="info-card" style={{ marginTop: 16 }}>
                                    <strong>Data Generation Formula:</strong>{' '}
                                    <M>{`y = ${labConfig.slope.toFixed(1)}x + ${labConfig.intercept.toFixed(1)} + \\varepsilon`}</M>{' '}
                                    <span style={{ color: 'var(--text-muted)' }}>where <M>{`\\varepsilon \\sim \\mathcal{N}(0, ${labConfig.noise})`}</M></span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="step-actions">
                            <button className="btn btn-primary" onClick={handleGoNext}>Next → See Results 📊</button>
                        </div>
                    </div>
                )}

                {/* ──── STEP 2: RESULTS ──── */}
                {step === 2 && (
                    <div className="step-content">
                        <h2 style={{ marginBottom: 20 }}>Model Results</h2>

                        <motion.div {...REVEAL} className="insight-card" style={{ marginBottom: 24 }}>
                            <div className="insight-label">What Just Happened?</div>
                            {results.summary}
                        </motion.div>

                        <div className="grid-4" style={{ marginBottom: 24 }}>
                            <MetricCard value={results.model.slope.toFixed(2)} label="Learned Slope" gradient
                                tooltip={explainMode ? "Compare with true slope you set. Closer = better recovery from noise." : null} />
                            <MetricCard value={results.model.intercept.toFixed(2)} label="Learned Intercept" gradient
                                tooltip={explainMode ? "Where the line crosses the Y-axis (when X=0)." : null} />
                            <MetricCard value={results.metrics.r2.toFixed(4)} label="R² Score"
                                color={results.metrics.r2 > 0.85 ? 'var(--emerald)' : 'var(--orange)'}
                                tooltip={explainMode ? "Fraction of variance explained. 1.0 = perfect. R² = 1 − (SSres/SStot)." : null} />
                            <MetricCard value={results.metrics.mse.toFixed(2)} label="MSE"
                                color="var(--pink)"
                                tooltip={explainMode ? "Average squared error. Lower = better. MSE = (1/m)Σ(ŷ−y)²." : null} />
                        </div>

                        <div className="glass-card" style={{ padding: 16 }}>
                            <Suspense fallback={<ChartLoader />}>
                                <RegressionChart X={results.X} y={results.y} slope={results.model.slope} intercept={results.model.intercept}
                                    title={`Best Fit: ŷ = ${results.model.slope.toFixed(2)}x + ${results.model.intercept.toFixed(2)}`} />
                            </Suspense>
                        </div>

                        <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <button className="btn btn-ghost" onClick={() => setShowResiduals(!showResiduals)}>
                                {showResiduals ? 'Hide' : 'Show'} Residual Plot
                            </button>
                            <button className="btn btn-ghost" onClick={() => setShowCode(!showCode)}>
                                {showCode ? 'Hide' : 'Python Implementation'} 💻
                            </button>
                        </div>

                        <AnimatePresence>
                            {showResiduals && (
                                <motion.div {...REVEAL} className="glass-card" style={{ marginTop: 16, padding: 16 }}>
                                    <Suspense fallback={<ChartLoader />}><ResidualChart yTrue={results.y} yPred={results.yPred} /></Suspense>
                                    {explainMode && (
                                        <div className="info-card" style={{ marginTop: 12 }}>
                                            <strong>Reading Residuals:</strong> Random scatter = good. Funnel shape = heteroscedasticity. Curve = missing non-linearity.
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {showCode && (
                                <motion.div {...REVEAL} style={{ marginTop: 16 }}>
                                    <Suspense fallback={<ChartLoader />}>
                                        <CodeSnippet slope={results.model.slope} intercept={results.model.intercept} nSamples={labConfig.nSamples} />
                                    </Suspense>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div style={{ marginTop: 24 }}>
                            <Suspense fallback={null}>
                                <SnapshotCompare labId="regression" currentConfig={labConfig} currentMetrics={results.metrics} />
                            </Suspense>
                        </div>

                        <KeyTakeaways title="Results Interpretation Guide" items={[
                            `Model learned slope=${results.model.slope.toFixed(2)} vs true=${labConfig.slope.toFixed(1)}. ${Math.abs(results.model.slope - labConfig.slope) < 0.5 ? 'Excellent recovery!' : 'Noise or regularization is pulling the estimate away.'}`,
                            `R²=${results.metrics.r2.toFixed(3)} → model explains ${(results.metrics.r2 * 100).toFixed(1)}% of variance.`,
                            'Check residuals for patterns — random scatter means the linear assumption holds.',
                            'Try changing noise, algorithm, and λ to see how each affects these metrics.',
                        ]} />

                        <div className="step-actions">
                            <button className="btn btn-primary" onClick={handleGoNext}>Next → Master Challenge 🏆</button>
                        </div>
                    </div>
                )}

                {/* ──── STEP 3: CHALLENGE ──── */}
                {step === 3 && (
                    <div className="step-content">
                        <div className="challenge-card glass-card">
                            <h2>🏆 Master Challenge</h2>
                            <p style={{ color: 'var(--text-secondary)', marginTop: 8, marginBottom: 20 }}>
                                Achieve R² above <strong style={{ color: 'var(--emerald)' }}>0.85</strong> to earn <strong>Regression Master</strong>.
                            </p>

                            <AnimatePresence>
                                {explainMode && (
                                    <motion.div {...REVEAL} className="info-card" style={{ marginBottom: 16 }}>
                                        💡 <strong>Strategy:</strong> Reduce noise for cleaner signal. Ensure enough data points. If using regularization, don't over-penalize (high λ pulls slope from truth).
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="challenge-r2">
                                <div className="challenge-r2-bar">
                                    <div className="challenge-r2-fill" style={{
                                        width: `${Math.min(results.metrics.r2 * 100, 100)}%`,
                                        background: results.metrics.r2 > 0.85 ? 'linear-gradient(90deg, var(--emerald), #04b88a)' : 'linear-gradient(90deg, var(--orange), var(--pink))',
                                    }} />
                                    <div className="challenge-r2-target" style={{ left: '85%' }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: 6 }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Current: {results.metrics.r2.toFixed(4)}</span>
                                    <span style={{ color: 'var(--text-muted)' }}>Target: 0.85</span>
                                </div>
                            </div>

                            {results.metrics.r2 > 0.85 ? (
                                <motion.div {...POP} className="success-card" style={{ marginTop: 20 }}>
                                    <p><strong>🎉 Achievement Unlocked!</strong><br />You've mastered Linear Regression.</p>
                                    <ChallengeUnlock awardBadge={awardBadge} awardXP={awardXP} badge="Regression Master" />
                                </motion.div>
                            ) : (
                                <div className="info-card" style={{ marginTop: 20 }}>
                                    <p>💡 Go back to <strong>Experiment</strong> and adjust parameters. Focus on reducing noise first.</p>
                                </div>
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
