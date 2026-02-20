/**
 * ReductionLab — PCA & t-SNE interactive lab.
 */
import { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocus } from '../context/FocusContext';
import { useGame } from '../context/GameContext';
import { PAGE_TRANSITION, STEP_SWITCH, REVEAL, POP } from '../utils/motion';
import TeachingFrame from '../components/TeachingFrame';
import LearningJourney from '../components/LearningJourney';
import IntroSection from '../components/IntroSection';
import AlgorithmDeepDive from '../components/AlgorithmDeepDive';
import MathBlock, { M } from '../components/MathBlock';
import ComparisonTable from '../components/ComparisonTable';
import KeyTakeaways from '../components/KeyTakeaways';
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

const ALGORITHM_DIVES = [
    {
        id: 'pca', label: 'Principal Component Analysis (PCA)', color: '#4F8BF9', icon: '📐',
        summary: 'Finds orthogonal axes (principal components) that capture maximum variance in the data.',
        intuition: 'Imagine a 3D cloud of points. PCA rotates your viewpoint to find the angle where the cloud looks most spread out. The first principal component is the direction of maximum spread, the second is perpendicular to it with the next most spread, and so on. By keeping only the top components, you compress data while retaining the most information.',
        mathContent: (
            <>
                <MathBlock label="Covariance Matrix">{'\\Sigma = \\frac{1}{m} X^T X'}</MathBlock>
                <MathBlock label="Eigendecomposition">{'\\Sigma v_i = \\lambda_i v_i'}</MathBlock>
                <MathBlock label="Projection">{'Z = X W_k \\quad \\text{where } W_k = [v_1, v_2, \\ldots, v_k]'}</MathBlock>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 8 }}>
                    <M>{'\\lambda_i'}</M> = variance explained by component i. <M>{'v_i'}</M> = eigenvector (principal component direction).
                </p>
            </>
        ),
        steps: [
            { title: 'Center data —', text: 'Subtract mean from each feature (zero-center).' },
            { title: 'Compute covariance —', text: 'Calculate feature-feature covariance matrix.' },
            { title: 'Find eigenvectors —', text: 'Eigendecomposition gives principal directions.' },
            { title: 'Project —', text: 'Multiply data by top-k eigenvectors to reduce dimensions.' },
        ],
        whenToUse: 'Use when you want a linear, deterministic compression that preserves global variance. Ideal for visualization, noise reduction, and preprocessing before other ML algorithms.',
        prosAndCons: {
            pros: ['Deterministic and fast', 'Preserves global variance structure', 'Explained variance ratio tells how much info is retained', 'Great for denoising and preprocessing'],
            cons: ['Only captures linear relationships', 'Components may not be interpretable', 'Sensitive to feature scaling', 'Cannot preserve non-linear manifold structure'],
        },
    },
    {
        id: 'tsne', label: 't-SNE', color: '#EC4899', icon: '🗺️',
        summary: 'Non-linear embedding that preserves local neighborhood structure for visualization.',
        intuition: 't-SNE thinks about similarity: in high-D, each point has a probability distribution over its neighbors (nearby points have high probability). It then tries to recreate this neighborhood structure in 2D. Points that were close in high-D should be close in the 2D map. The perplexity parameter controls how many neighbors each point "pays attention to".',
        mathContent: (
            <>
                <MathBlock label="High-D Similarity">{'p_{j|i} = \\frac{\\exp(-\\|x_i - x_j\\|^2 / 2\\sigma_i^2)}{\\sum_{k \\neq i} \\exp(-\\|x_i - x_k\\|^2 / 2\\sigma_i^2)}'}</MathBlock>
                <MathBlock label="Low-D Similarity (Student-t)">{'q_{ij} = \\frac{(1 + \\|y_i - y_j\\|^2)^{-1}}{\\sum_{k \\neq l}(1 + \\|y_k - y_l\\|^2)^{-1}}'}</MathBlock>
                <MathBlock label="KL Divergence">{'C = \\sum_i \\sum_j p_{ij} \\log \\frac{p_{ij}}{q_{ij}}'}</MathBlock>
            </>
        ),
        steps: [
            { title: 'Compute pairwise similarities —', text: 'Gaussian kernel in high-D space.' },
            { title: 'Initialize low-D coordinates —', text: 'Usually random or from PCA.' },
            { title: 'Optimize positions —', text: 'Gradient descent on KL divergence.' },
            { title: 'Interpret map —', text: 'Distances within clusters are meaningful, between clusters less so.' },
        ],
        whenToUse: 'Best for visualization of high-dimensional data to reveal clusters and local structure. Not suitable for preprocessing or feature extraction (non-deterministic, slow).',
        prosAndCons: {
            pros: ['Reveals local cluster structure beautifully', 'Handles non-linear manifolds', 'Produces intuitive visualizations', 'Student-t distribution prevents crowding'],
            cons: ['Non-deterministic (different runs give different results)', 'Slow — O(n²) or O(n log n) with approximation', 'Global distances are not meaningful', 'Perplexity sensitive — must experiment'],
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
    {
        title: 'Prove your reduction intuition',
        text: 'Achieve 90%+ explained variance with PCA to earn the Dimension Reducer badge.',
    },
];

export default function ReductionLab() {
    const [step, setStep] = useState(0);
    const { enterFocus, exitFocus } = useFocus();
    const { awardBadge, awardXP } = useGame();
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
    const handleGoNext = () => { if (step < 3) { const n = step + 1; setStep(n); n === 1 ? enterFocus() : exitFocus(); } };

    return (
        <motion.div className="reduction-page" variants={PAGE_TRANSITION} initial="initial" animate="animate" exit="exit">
            <div className="lab-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div><h1 className="gradient-text">Dimensionality Reduction Lab</h1></div>
                    <div className={`explain-badge ${explainMode ? 'on' : 'off'}`} onClick={() => setExplainMode(!explainMode)}>{explainMode ? '💡 Explain ON' : '💡 Explain OFF'}</div>
                </div>
            </div>

            {/* ═══════ INTRODUCTION ═══════ */}
            <IntroSection
                title="What is Dimensionality Reduction?"
                subtitle="Compressing high-dimensional data while preserving essential structure."
                goalText="Understand why high dimensions are problematic, how PCA captures variance, how t-SNE preserves neighborhoods, and how to interpret reduced representations."
                paragraphs={[
                    'Real-world datasets often have dozens or hundreds of features. Dimensionality reduction compresses this down to 2-3 dimensions for visualization, or to a smaller set for more efficient and accurate ML. The challenge is choosing what information to keep and what to discard.',
                    'PCA (Principal Component Analysis) is the workhorse: it finds the directions of maximum variance and projects data onto them. It\'s fast, deterministic, and tells you exactly how much information each component retains. But it only captures linear relationships.',
                    't-SNE is the visualization champion: it preserves local neighborhoods, making clusters in high-D visible in 2D. But it\'s non-deterministic, slow, and distances between clusters in the embedding can be misleading. Use PCA for preprocessing, t-SNE for exploring.',
                ]}
                realWorld={{
                    title: 'Where is Dimensionality Reduction Used?',
                    items: [
                        { icon: '🖼️', text: 'Image compression — PCA reduces pixel dimensions while preserving visual quality' },
                        { icon: '🧬', text: 'Genomics — visualizing gene expression data (10,000+ genes) in 2D clusters' },
                        { icon: '📝', text: 'NLP — reducing word embedding dimensions for faster text models' },
                        { icon: '🔊', text: 'Signal processing — denoising by removing low-variance components' },
                        { icon: '🎨', text: 'Data visualization — making high-D data explorable by humans' },
                        { icon: '⚡', text: 'Preprocessing — reducing features before training other ML models' },
                    ],
                }}
                prerequisites={[
                    'Understanding that each feature adds a dimension to data space',
                    'Concept of variance (spread of data along a direction)',
                    'Intuition about "distance" and "neighbors" in data space',
                ]}
            />

            {/* ═══════ MATHEMATICAL FOUNDATION ═══════ */}
            <div className="section-divider-labeled"><span>Mathematical Foundation</span></div>

            <motion.section className="math-foundation" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.45 }}>
                <h2>Core Concepts</h2>
                <div className="grid-2" style={{ gap: 24, alignItems: 'start' }}>
                    <div>
                        <h3 style={{ marginBottom: 12 }}>Curse of Dimensionality</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
                            As dimensions grow, data becomes exponentially sparse. Distance-based algorithms struggle because all points become roughly equidistant.
                        </p>
                        <div className="info-card">
                            A unit hypercube in <M>{'d'}</M> dimensions has <M>{'2^d'}</M> corners. In 100D, you need astronomically more data to fill the space.
                        </div>
                    </div>
                    <div>
                        <h3 style={{ marginBottom: 12 }}>Explained Variance</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
                            PCA's key metric: what fraction of total variance does each component capture?
                        </p>
                        <MathBlock label="Explained Variance Ratio">{'\\text{EVR}_i = \\frac{\\lambda_i}{\\sum_{j=1}^{d} \\lambda_j}'}</MathBlock>
                        <div className="info-card" style={{ marginTop: 12 }}>
                            Keep components until cumulative EVR ≥ 80-95%.
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* ═══════ ALGORITHM DEEP DIVES ═══════ */}
            <div className="section-divider-labeled"><span>Algorithm Deep Dives</span></div>

            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.45 }}>
                <h2 style={{ marginBottom: 8 }}>Understanding Each Method</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>Click to explore. Selected method will be used in the Experiment step.</p>
                {ALGORITHM_DIVES.map((algo) => (
                    <AlgorithmDeepDive key={algo.id} {...algo} active={algorithm === algo.id} onSelect={setAlgorithm} />
                ))}
            </motion.section>

            {/* ═══════ COMPARISON TABLE ═══════ */}
            <ComparisonTable
                caption="📊 PCA vs t-SNE"
                headers={['Method', 'Type', 'Speed', 'Deterministic', 'Preserves', 'Best For']}
                rows={[
                    ['PCA', 'Linear', '⚡ Very Fast', '✅ Yes', 'Global variance', 'Preprocessing, denoising'],
                    ['t-SNE', 'Non-linear', '🐌 Slow', '❌ No', 'Local neighborhoods', 'Visualization, exploration'],
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
                            Follow the story below — from linear projections to non-linear maps, and the theory that explains why reduction matters.
                        </p>

                        <div className="narrative-flow">

                            {/* ── 1. PCA ── */}
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
                                PCA finds the best <strong>linear</strong> projection. But what if the data lives on a curved surface? Clusters that are clear in high-D might collapse in PCA's straight-line view…
                            </div>

                            {/* ── 2. t-SNE ── */}
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
                                We have methods, but how do we <strong>measure</strong> whether the projection kept enough information? We need a quantitative yardstick…
                            </div>

                            {/* ── 3. Variance Explained ── */}
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
                                Variance explained answers "did I keep enough?" But <strong>why</strong> does high dimensionality cause problems in the first place? The answer is both surprising and fundamental…
                            </div>

                            {/* ── 4. Curse of Dimensionality ── */}
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

                        <h3 style={{ marginBottom: 12 }}>Choose Method</h3>
                        <div className="algo-selector" style={{ marginBottom: 20 }}>
                            {ALGORITHMS.map(a => (
                                <button key={a.id} className={`algo-pill ${algorithm === a.id ? 'active' : ''}`} style={{ '--pill-color': a.color }} onClick={() => setAlgorithm(a.id)}>{a.label}</button>
                            ))}
                        </div>

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
                                    <VarianceChart varianceRatio={results.model.explainedRatio} />
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

                        <div className="step-actions"><button className="btn btn-primary" onClick={handleGoNext}>Next → Challenge 🏆</button></div>
                    </div>
                )}

                {step === 3 && results && (
                    <div className="step-content">
                        <div className="challenge-card glass-card">
                            <h2>🏆 Dimensionality Reduction Challenge</h2>
                            <p style={{ color: 'var(--text-secondary)', marginTop: 8, marginBottom: 20 }}>
                                Use <strong style={{ color: '#4F8BF9' }}>PCA</strong> and achieve <strong style={{ color: 'var(--emerald)' }}>90%+</strong> cumulative explained variance with just 2 components.
                                <br />
                                <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                                    Hint: Try different data shapes and feature counts — some datasets compress better than others.
                                </span>
                            </p>

                            <div className="grid-3" style={{ marginBottom: 24 }}>
                                <MetricCard
                                    value={algorithm === 'pca' && results.model?.explainedRatio
                                        ? (results.model.explainedRatio.reduce((s, v) => s + v, 0) * 100).toFixed(1) + '%'
                                        : 'N/A'}
                                    label="Cumulative Variance"
                                    gradient
                                />
                                <MetricCard value={nFeatures + 'D → 2D'} label="Compression" color="var(--purple)" />
                                <MetricCard value={algorithm.toUpperCase()} label="Method" color={algorithm === 'pca' ? '#4F8BF9' : '#EC4899'} />
                            </div>

                            <div className="challenge-r2">
                                <div className="challenge-label-row">
                                    <span>Explained Variance</span>
                                    <span style={{ color: algorithm === 'pca' && results.model?.explainedRatio && results.model.explainedRatio.reduce((s, v) => s + v, 0) > 0.9 ? 'var(--emerald)' : 'var(--text-secondary)' }}>
                                        {algorithm === 'pca' && results.model?.explainedRatio
                                            ? (results.model.explainedRatio.reduce((s, v) => s + v, 0) * 100).toFixed(1) + '%'
                                            : 'Switch to PCA'}
                                    </span>
                                </div>
                                <div className="challenge-r2-bar">
                                    <div className="challenge-r2-fill" style={{
                                        width: `${algorithm === 'pca' && results.model?.explainedRatio
                                            ? Math.min(results.model.explainedRatio.reduce((s, v) => s + v, 0) * 100, 100)
                                            : 0}%`,
                                        background: algorithm === 'pca' && results.model?.explainedRatio && results.model.explainedRatio.reduce((s, v) => s + v, 0) > 0.9
                                            ? 'linear-gradient(90deg, var(--emerald), #04b88a)'
                                            : 'linear-gradient(90deg, var(--orange), var(--pink))',
                                    }} />
                                    <div className="challenge-r2-target" style={{ left: '90%' }} />
                                </div>
                            </div>

                            {algorithm !== 'pca' && (
                                <div className="challenge-hint glass-card" style={{ marginTop: 16, padding: '12px 16px' }}>
                                    <p style={{ color: 'var(--text-secondary)' }}>
                                        ⚠️ Switch to <strong>PCA</strong> first (go back to Experiment), then try to hit 90% variance.
                                    </p>
                                </div>
                            )}

                            {algorithm === 'pca' && results.model?.explainedRatio && results.model.explainedRatio.reduce((s, v) => s + v, 0) > 0.9 && (
                                <motion.div {...POP} className="success-card" style={{ marginTop: 20 }}>
                                    <p><strong>🎉 Dimension Reducer!</strong></p>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        You proved that most information can survive aggressive compression.
                                    </p>
                                    <ChallengeUnlock awardBadge={awardBadge} awardXP={awardXP} badge="Dimension Reducer" />
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
