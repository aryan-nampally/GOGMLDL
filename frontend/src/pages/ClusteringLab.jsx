import { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { useFocus } from '../context/FocusContext';
import clusteringEngine from '../engines/clusteringEngine';
import { runPipeline } from '../engines/baseEngine';
import { PAGE_TRANSITION, STEP_SWITCH, REVEAL, POP } from '../utils/motion';
import TeachingFrame from '../components/TeachingFrame';
import LearningJourney from '../components/LearningJourney';
import IntroSection from '../components/IntroSection';
import AlgorithmDeepDive from '../components/AlgorithmDeepDive';
import MathBlock, { M } from '../components/MathBlock';
import ComparisonTable from '../components/ComparisonTable';
import KeyTakeaways from '../components/KeyTakeaways';
import './ClusteringLab.css';

const ClusterChart = lazy(() => import('../components/MLCharts').then(m => ({ default: m.ClusterChart })));
const ElbowChart = lazy(() => import('../components/MLCharts').then(m => ({ default: m.ElbowChart })));
const SilhouetteChart = lazy(() => import('../components/MLCharts').then(m => ({ default: m.SilhouetteChart })));
const SnapshotCompare = lazy(() => import('../components/SnapshotCompare'));
const KMeansConcept = lazy(() => import('../components/concepts/KMeansConcept'));

const ChartLoader = () => (
    <div style={{ height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading chart…</div>
);

const ALGORITHMS = [
    { id: 'kmeans', label: 'K-Means', color: '#06D6A0' },
    { id: 'dbscan', label: 'DBSCAN', color: '#F97316' },
    { id: 'hierarchical', label: 'Hierarchical', color: '#9B5DE5' },
];

const ALGORITHM_DIVES = [
    {
        id: 'kmeans', label: 'K-Means Clustering', color: '#06D6A0', icon: '🎯',
        summary: 'Partitions data into k groups by iteratively assigning points to nearest centroid and updating centroids.',
        intuition: 'Imagine dropping k pins randomly onto a scatter plot, then repeatedly: (1) each data point joins the nearest pin\'s group, (2) each pin moves to the center of its group. After enough rounds, the pins stabilize and you have k clusters. Simple, fast, and surprisingly effective for blob-shaped groups.',
        mathContent: (
            <>
                <MathBlock label="Objective (Inertia / WCSS)">{'J = \\sum_{i=1}^{k} \\sum_{x \\in C_i} \\|x - \\mu_i\\|^2'}</MathBlock>
                <MathBlock label="Centroid Update">{'\\mu_i = \\frac{1}{|C_i|} \\sum_{x \\in C_i} x'}</MathBlock>
            </>
        ),
        steps: [
            { title: 'Initialize k centroids —', text: 'Place k centers randomly (or via K-Means++).' },
            { title: 'Assign points —', text: 'Each point joins the cluster of its nearest centroid.' },
            { title: 'Update centroids —', text: 'Recompute each centroid as the mean of its assigned points.' },
            { title: 'Repeat —', text: 'Iterate until assignments stop changing or max iterations reached.' },
        ],
        whenToUse: 'Best for roughly spherical, evenly-sized clusters. Use the Elbow Method to find optimal k. Fast and scalable.',
        prosAndCons: {
            pros: ['Very fast — O(nkt) per iteration', 'Simple to understand and implement', 'Scales to large datasets', 'Works well for convex clusters'],
            cons: ['Must specify k in advance', 'Sensitive to initialization', 'Assumes spherical clusters of similar size', 'Cannot detect non-convex shapes or noise'],
        },
    },
    {
        id: 'dbscan', label: 'DBSCAN', color: '#F97316', icon: '🔍',
        summary: 'Density-based clustering that finds arbitrarily-shaped clusters and identifies noise points.',
        intuition: 'DBSCAN thinks about clustering in terms of neighborhoods. A "core point" has at least minPts neighbors within radius ε. Clusters are formed by linking core points whose neighborhoods overlap. Sparse points that don\'t belong to any cluster are labeled as noise. This means DBSCAN can find crescents, rings, and other non-convex shapes that K-Means cannot.',
        mathContent: (
            <>
                <MathBlock label="Core Point Condition">{'|N_\\varepsilon(p)| \\geq \\text{minPts} \\quad \\text{where } N_\\varepsilon(p) = \\{q : d(p,q) \\leq \\varepsilon\\}'}</MathBlock>
                <MathBlock label="Density Reachability">{'p \\text{ is density-reachable from } q \\text{ if } \\exists p_1,...,p_n \\text{ s.t. } p_1 = q, p_n = p'}</MathBlock>
            </>
        ),
        steps: [
            { title: 'Pick a point —', text: 'Select any unvisited point p from the dataset.' },
            { title: 'Check density —', text: 'Count neighbors within ε radius. If ≥ minPts → core point.' },
            { title: 'Expand cluster —', text: 'Recursively add density-reachable core points and their neighborhoods.' },
            { title: 'Label noise —', text: 'Points not reachable from any core point are noise (-1).' },
        ],
        whenToUse: 'Use when clusters have irregular shapes, varying sizes, or when you expect noise/outliers. No need to specify k upfront.',
        prosAndCons: {
            pros: ['No need to specify number of clusters', 'Finds arbitrarily-shaped clusters', 'Robust to outliers (labels them as noise)', 'Works well with spatial data'],
            cons: ['Sensitive to ε and minPts parameters', 'Struggles with varying-density clusters', 'Not deterministic for border points', 'Poor in very high dimensions'],
        },
    },
    {
        id: 'hierarchical', label: 'Hierarchical Clustering', color: '#9B5DE5', icon: '🌲',
        summary: 'Builds a tree (dendrogram) of nested clusters by repeatedly merging the closest groups.',
        intuition: 'Start with every point as its own cluster. Then repeatedly merge the two closest clusters until everything is one big cluster. The result is a tree structure (dendrogram) that shows all possible clusterings at different granularities. You "cut" the tree at a desired level to get your final clusters. The linkage method determines how "distance between clusters" is defined.',
        mathContent: (
            <>
                <MathBlock label="Single Linkage">{'d(A,B) = \\min_{a \\in A, b \\in B} d(a,b)'}</MathBlock>
                <MathBlock label="Complete Linkage">{'d(A,B) = \\max_{a \\in A, b \\in B} d(a,b)'}</MathBlock>
                <MathBlock label="Average Linkage">{'d(A,B) = \\frac{1}{|A||B|} \\sum_{a \\in A} \\sum_{b \\in B} d(a,b)'}</MathBlock>
            </>
        ),
        steps: [
            { title: 'Start —', text: 'Each point is its own cluster (n clusters).' },
            { title: 'Find closest pair —', text: 'Compute inter-cluster distance using chosen linkage.' },
            { title: 'Merge —', text: 'Combine the two closest clusters into one.' },
            { title: 'Repeat —', text: 'Continue until k clusters remain or until one cluster.' },
        ],
        whenToUse: 'Use when you want to explore cluster structure at multiple levels. Dendrogram visualization helps decide the right number of clusters. Best for smaller datasets.',
        prosAndCons: {
            pros: ['No need to specify k upfront', 'Produces an interpretable dendrogram', 'Flexible through linkage choice', 'Deterministic results'],
            cons: ['O(n³) time complexity', 'Not scalable to large datasets', 'Merges are irreversible', 'Sensitive to noise and outliers'],
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
        title: 'See hidden groups conceptually',
        text: 'Understand what makes points belong together when no labels are available.',
    },
    {
        title: 'Control cluster behavior',
        text: 'Tune k, density, and linkage settings to feel when clusters split, merge, or reject noise.',
    },
    {
        title: 'Validate structure quality',
        text: 'Read silhouette and inertia trends to avoid trusting visually pleasing but weak clusterings.',
    },
    {
        title: 'Choose the right strategy',
        text: 'Use your observations to pick the most suitable clustering family for the given data shape.',
    },
];

const CONCEPTS = ['K-Means', 'DBSCAN', 'Hierarchical'];

const CONCEPT_GUIDES = [
    {
        background: 'You suspect data contains groups, but labels are unavailable.',
        what: 'K-Means assigns each point to nearest centroid and updates centroids iteratively.',
        why: 'It gives a fast first view of cluster structure and separation quality.',
        how: 'Initialize k centers → assign nearest center → recompute centers → repeat.',
        tryThis: 'Run elbow analysis and inspect where inertia improvement starts flattening.',
    },
    {
        background: 'Some datasets include irregular cluster shapes and noisy outliers.',
        what: 'DBSCAN forms clusters by local density and marks sparse points as noise.',
        why: 'It can find non-spherical clusters where centroid methods struggle.',
        how: 'Core points expand clusters if enough neighbors exist within ε radius.',
        tryThis: 'Increase ε gradually to see separate groups merge into larger clusters.',
    },
    {
        background: 'You want cluster structure at multiple granularity levels.',
        what: 'Hierarchical clustering repeatedly merges closest clusters into a tree structure.',
        why: 'It reveals nested patterns and allows flexible final cluster cuts.',
        how: 'Choose linkage rule, compute inter-cluster distance, merge recursively.',
        tryThis: 'Switch linkage mode and observe how cluster boundaries shift.',
    },
];

export default function ClusteringLab() {
    const [step, setStep] = useState(0);
    const [concept, setConcept] = useState(0);
    const { awardXP, awardBadge } = useGame();
    const { enterFocus, exitFocus } = useFocus();

    const [explainMode, setExplainMode] = useState(true);
    const [algorithm, setAlgorithm] = useState('kmeans');
    const [nSamples, setNSamples] = useState(150);
    const [dataShape, setDataShape] = useState('blobs');
    const [k, setK] = useState(3);
    const [eps, setEps] = useState(1.5);
    const [minPts, setMinPts] = useState(5);
    const [linkage, setLinkage] = useState('average');

    const [elbowData, setElbowData] = useState(null);
    const [computingElbow, setComputingElbow] = useState(false);

    const config = useMemo(() => ({
        nSamples,
        nClusters: k,
        spread: 1.2,
        dataShape,
        algorithm,
        k,
        maxIter: 50,
        eps,
        minPts,
        linkage,
        seed: 42,
    }), [nSamples, k, dataShape, algorithm, eps, minPts, linkage]);

    const results = useMemo(() => {
        const { data, model, predictions, metrics, summary } = runPipeline(clusteringEngine, config);
        return { X: data.X, y: data.y, model, yPred: predictions, metrics, summary };
    }, [config]);

    const handleElbowAnalysis = () => {
        setComputingElbow(true);
        setTimeout(() => {
            const inertias = [];
            const ks = [];
            for (let i = 2; i <= 9; i++) {
                const model = clusteringEngine.trainModel(results.X, results.y, { ...config, k: i, algorithm: 'kmeans' });
                inertias.push(model.inertia || 0);
                ks.push(i);
            }
            setElbowData({ ks, inertias });
            setComputingElbow(false);
        }, 50);
    };

    const handleStepChange = (n) => {
        if (n <= step) {
            setStep(n);
            if (n === 1) enterFocus();
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
        <motion.div className="clustering-page" variants={PAGE_TRANSITION} initial="initial" animate="animate" exit="exit">
            <div className="lab-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <h1 className="gradient-text">Clustering Lab</h1>
                    </div>
                    <div className={`explain-badge ${explainMode ? 'on' : 'off'}`} onClick={() => setExplainMode(!explainMode)}>
                        {explainMode ? '💡 Explain ON' : '💡 Explain OFF'}
                    </div>
                </div>
            </div>

            {/* ═══════ INTRODUCTION ═══════ */}
            <IntroSection
                title="What is Clustering?"
                subtitle="Unsupervised learning — finding hidden structure when labels don't exist."
                goalText="Understand how clustering algorithms discover groups in unlabeled data, when to use centroid-based vs density-based approaches, and how to validate cluster quality."
                paragraphs={[
                    'Clustering is an unsupervised learning task where the goal is to group similar data points together without any predefined labels. Unlike classification, there is no "right answer" to learn from — the algorithm must discover structure on its own based on similarity patterns in the data.',
                    'The key challenge is defining what "similar" means. Different clustering algorithms use different similarity measures and assumptions about cluster shape. K-Means assumes spherical clusters, DBSCAN looks for density-connected regions, and Hierarchical clustering builds a nested tree of relationships.',
                    'Validation is tricky because there are no ground-truth labels. Metrics like Silhouette Score measure how well-separated clusters are, while visual inspection and domain knowledge remain essential for judging cluster quality.',
                ]}
                realWorld={{
                    title: 'Where is Clustering Used?',
                    items: [
                        { icon: '🛒', text: 'Customer segmentation — grouping shoppers by behavior for targeted marketing' },
                        { icon: '🧬', text: 'Gene expression analysis — finding groups of co-regulated genes' },
                        { icon: '📰', text: 'Document/topic grouping — organizing news articles by theme' },
                        { icon: '🗺️', text: 'Geographic analysis — identifying hotspots for crime, disease, or service demand' },
                        { icon: '🎨', text: 'Image compression — reducing color palette by clustering similar pixels' },
                        { icon: '🔧', text: 'Anomaly detection — points far from all clusters are potential outliers' },
                    ],
                }}
                prerequisites={[
                    'Concept of distance/similarity between data points',
                    'Understanding that data can have natural groupings',
                    'No prior labeling required (unsupervised)',
                ]}
            />

            {/* ═══════ MATHEMATICAL FOUNDATION ═══════ */}
            <div className="section-divider-labeled"><span>Mathematical Foundation</span></div>

            <motion.section className="math-foundation" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.45 }}>
                <h2>Core Concepts in Clustering</h2>
                <div className="grid-2" style={{ gap: 24, alignItems: 'start' }}>
                    <div>
                        <h3 style={{ marginBottom: 12 }}>Distance Measures</h3>
                        <MathBlock label="Euclidean Distance">{'d(x, x\') = \\sqrt{\\sum_{j=1}^{n} (x_j - x\'_j)^2}'}</MathBlock>
                        <MathBlock label="Manhattan Distance">{'d(x, x\') = \\sum_{j=1}^{n} |x_j - x\'_j|'}</MathBlock>
                    </div>
                    <div>
                        <h3 style={{ marginBottom: 12 }}>Evaluation Metrics</h3>
                        <MathBlock label="Silhouette Score">{'s(i) = \\frac{b(i) - a(i)}{\\max(a(i), b(i))}'}</MathBlock>
                        <div className="info-card" style={{ marginTop: 12 }}>
                            <M>{'a(i)'}</M> = average distance to points in same cluster. <M>{'b(i)'}</M> = average distance to nearest other cluster. Score ranges from -1 (bad) to +1 (perfect).
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* ═══════ ALGORITHM DEEP DIVES ═══════ */}
            <div className="section-divider-labeled"><span>Algorithm Deep Dives</span></div>

            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.45 }}>
                <h2 style={{ marginBottom: 8 }}>Understanding Each Algorithm</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
                    Click to see the math, intuition, and tradeoffs. The selected algorithm will be used in the Experiment step.
                </p>
                {ALGORITHM_DIVES.map((algo) => (
                    <AlgorithmDeepDive key={algo.id} {...algo} active={algorithm === algo.id} onSelect={setAlgorithm} />
                ))}
            </motion.section>

            {/* ═══════ COMPARISON TABLE ═══════ */}
            <ComparisonTable
                caption="📊 Clustering Algorithm Comparison"
                headers={['Algorithm', 'Specify k?', 'Cluster Shape', 'Noise Handling', 'Complexity', 'Best For']}
                rows={[
                    ['K-Means', '✅ Yes', 'Spherical', '❌ No', 'O(nkt)', 'Large data, convex clusters'],
                    ['DBSCAN', '❌ No', 'Arbitrary', '✅ Yes', 'O(n log n)', 'Irregular shapes, outlier detection'],
                    ['Hierarchical', '❌ No (cut tree)', 'Flexible', '❌ Partial', 'O(n³)', 'Small data, multi-level analysis'],
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
                        <h2>Understand Clustering</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                            Follow the story below — each algorithm tackles a different weakness of the previous one, building your understanding progressively.
                        </p>

                        <div className="narrative-flow">

                            {/* ── 1. K-Means ── */}
                            <div className="narrative-section">
                                <div className="narrative-header">
                                    <span className="narrative-step-badge">1</span>
                                    <h3>The Classic Approach: K-Means</h3>
                                </div>
                                <TeachingFrame
                                    title="K-Means — Beginner Lens"
                                    background={CONCEPT_GUIDES[0].background}
                                    what={CONCEPT_GUIDES[0].what}
                                    why={CONCEPT_GUIDES[0].why}
                                    how={CONCEPT_GUIDES[0].how}
                                    tryThis={CONCEPT_GUIDES[0].tryThis}
                                />
                                <div className="concept-display">
                                    <Suspense fallback={<div className="loading-spinner">Loading concept...</div>}>
                                        <KMeansConcept />
                                    </Suspense>
                                </div>
                            </div>

                            <div className="narrative-transition">
                                K-Means assumes spherical, evenly-sized clusters with no noise. Real data is messier — clusters can be <strong>crescent-shaped</strong>, ring-shaped, and some points are just noise. We need an algorithm that discovers shape from density…
                            </div>

                            {/* ── 2. DBSCAN ── */}
                            <div className="narrative-section">
                                <div className="narrative-header">
                                    <span className="narrative-step-badge">2</span>
                                    <h3>Density-Based Discovery: DBSCAN</h3>
                                </div>
                                <TeachingFrame
                                    title="DBSCAN — Beginner Lens"
                                    background={CONCEPT_GUIDES[1].background}
                                    what={CONCEPT_GUIDES[1].what}
                                    why={CONCEPT_GUIDES[1].why}
                                    how={CONCEPT_GUIDES[1].how}
                                    tryThis={CONCEPT_GUIDES[1].tryThis}
                                />
                                <div className="glass-card" style={{ padding: 32 }}>
                                    <h3 style={{ marginBottom: 16 }}>🔍 DBSCAN — Density-Based Spatial Clustering</h3>
                                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
                                        DBSCAN discovers clusters by exploring local density. It starts from any unvisited point, checks if enough neighbors exist within radius ε, and if so, expands the cluster by recursively including reachable core points and their neighborhoods.
                                    </p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <div className="info-card">
                                            <strong>Core Point:</strong> Has ≥ minPts neighbors within ε radius. These form the backbone of clusters.
                                        </div>
                                        <div className="info-card">
                                            <strong>Border Point:</strong> Within ε of a core point but doesn't have enough neighbors itself.
                                        </div>
                                        <div className="info-card">
                                            <strong>Noise Point:</strong> Not within ε of any core point. Labeled as outlier (-1).
                                        </div>
                                        <div className="info-card">
                                            <strong>Key Advantage:</strong> No need to specify k. Automatically finds number of clusters and handles noise.
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="narrative-transition">
                                DBSCAN groups by density and doesn't need k. But sometimes you want to see how clusters relate to each other at <strong>multiple levels of detail</strong> — like zooming in and out of a map…
                            </div>

                            {/* ── 3. Hierarchical ── */}
                            <div className="narrative-section">
                                <div className="narrative-header">
                                    <span className="narrative-step-badge">3</span>
                                    <h3>Multi-Level Structure: Hierarchical Clustering</h3>
                                </div>
                                <TeachingFrame
                                    title="Hierarchical — Beginner Lens"
                                    background={CONCEPT_GUIDES[2].background}
                                    what={CONCEPT_GUIDES[2].what}
                                    why={CONCEPT_GUIDES[2].why}
                                    how={CONCEPT_GUIDES[2].how}
                                    tryThis={CONCEPT_GUIDES[2].tryThis}
                                />
                                <div className="glass-card" style={{ padding: 32 }}>
                                    <h3 style={{ marginBottom: 16 }}>🌲 Hierarchical Clustering — Agglomerative Approach</h3>
                                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
                                        Hierarchical clustering builds a tree (dendrogram) showing nested cluster relationships. Starting with each point as its own cluster, it repeatedly merges the two most similar clusters until one remains. The linkage method determines how inter-cluster similarity is measured.
                                    </p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                                        <div className="info-card">
                                            <strong>Single Linkage:</strong> Minimum distance between any pair of points across clusters. Can create chain-like clusters.
                                        </div>
                                        <div className="info-card">
                                            <strong>Complete Linkage:</strong> Maximum distance between any pair. Produces compact, spherical clusters.
                                        </div>
                                        <div className="info-card">
                                            <strong>Average Linkage:</strong> Average of all pairwise distances. Balanced compromise between single and complete.
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        <KeyTakeaways items={[
                            'K-Means needs you to choose k upfront and assumes spherical clusters.',
                            'DBSCAN discovers cluster count automatically and handles noise, but needs ε and minPts tuning.',
                            'Hierarchical clustering reveals multi-level structure but scales poorly to large datasets.',
                            'Silhouette Score measures cluster quality: higher (closer to 1) = well-separated clusters.',
                        ]} />

                        <div className="step-actions"><button className="btn btn-primary" onClick={handleGoNext}>Next → Configure ⚙️</button></div>
                    </div>
                )}

                {step === 1 && (
                    <div className="step-content">
                        <h2>Configure</h2>

                        <h3 style={{ marginBottom: 12 }}>Choose Algorithm</h3>
                        <div className="algo-selector" style={{ marginBottom: 20 }}>
                            {ALGORITHMS.map((a) => (
                                <button key={a.id} className={`algo-pill ${algorithm === a.id ? 'active' : ''}`} style={{ '--pill-color': a.color }} onClick={() => setAlgorithm(a.id)}>{a.label}</button>
                            ))}
                        </div>

                        <div className="config-grid">
                            <div className="config-section">
                                <label className="config-label">Samples: <strong>{nSamples}</strong></label>
                                <input type="range" min="50" max="300" step="10" value={nSamples} onChange={(e) => setNSamples(+e.target.value)} />
                            </div>
                            <div className="config-section">
                                <label className="config-label">Data Shape</label>
                                <div className="shape-selector">
                                    {['blobs', 'moons', 'circles', 'spirals'].map(s => (
                                        <button key={s} className={`shape-pill ${dataShape === s ? 'active' : ''}`} onClick={() => setDataShape(s)}>{s}</button>
                                    ))}
                                </div>
                            </div>
                            {algorithm !== 'dbscan' && (
                                <div className="config-section">
                                    <label className="config-label">K (clusters): <strong>{k}</strong></label>
                                    <input type="range" min="2" max="8" step="1" value={k} onChange={(e) => setK(+e.target.value)} />
                                </div>
                            )}
                            {algorithm === 'dbscan' && (
                                <>
                                    <div className="config-section">
                                        <label className="config-label">ε (radius): <strong>{eps.toFixed(1)}</strong></label>
                                        <input type="range" min="0.3" max="5" step="0.1" value={eps} onChange={(e) => setEps(+e.target.value)} />
                                        {explainMode && <span className="reg-hint">Smaller ε creates tighter local neighborhoods.</span>}
                                    </div>
                                    <div className="config-section">
                                        <label className="config-label">MinPts: <strong>{minPts}</strong></label>
                                        <input type="range" min="2" max="15" step="1" value={minPts} onChange={(e) => setMinPts(+e.target.value)} />
                                        {explainMode && <span className="reg-hint">Core point threshold for density expansion.</span>}
                                    </div>
                                </>
                            )}
                            {algorithm === 'hierarchical' && (
                                <div className="config-section">
                                    <label className="config-label">Linkage</label>
                                    <div className="shape-selector">
                                        {['single', 'average', 'complete'].map(l => (
                                            <button key={l} className={`shape-pill ${linkage === l ? 'active' : ''}`} onClick={() => setLinkage(l)}>{l}</button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="glass-card" style={{ marginTop: 24, padding: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <h3>📉 Optimal K Analysis</h3>
                                <button className="btn btn-secondary btn-sm" onClick={handleElbowAnalysis} disabled={computingElbow || algorithm !== 'kmeans'}>
                                    {computingElbow ? 'Running...' : 'Run Elbow Method'}
                                </button>
                            </div>
                            {algorithm !== 'kmeans' && <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Elbow method is specific to K-Means.</p>}
                            {elbowData && algorithm === 'kmeans' && (
                                <motion.div {...REVEAL} style={{ height: 320 }}>
                                    <Suspense fallback={<ChartLoader />}>
                                        <ElbowChart ks={elbowData.ks} inertias={elbowData.inertias} />
                                    </Suspense>
                                </motion.div>
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
                            <MetricCard value={results.metrics.silhouette?.toFixed(3) || 'N/A'} label="Silhouette" gradient />
                            <MetricCard value={results.metrics.nClusters} label="Clusters Found" color="var(--purple)" />
                        </div>
                        <div className="charts-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                            <div className="glass-card" style={{ padding: 16 }}>
                                <Suspense fallback={<ChartLoader />}>
                                    <ClusterChart X={results.X} labels={results.yPred} />
                                </Suspense>
                            </div>
                            {results.metrics.silhouetteSamples && (
                                <div className="glass-card" style={{ padding: 16 }}>
                                    <Suspense fallback={<ChartLoader />}>
                                        <SilhouetteChart silhouetteSamples={results.metrics.silhouetteSamples} labels={results.yPred} avgScore={results.metrics.silhouette} />
                                    </Suspense>
                                </div>
                            )}
                        </div>
                        <div style={{ marginTop: 24 }}>
                            <Suspense fallback={null}>
                                <SnapshotCompare labId="clustering" currentConfig={config} currentMetrics={results.metrics} />
                            </Suspense>
                        </div>
                        <div className="step-actions"><button className="btn btn-primary" onClick={handleGoNext}>Next → Challenge 🏆</button></div>
                    </div>
                )}

                {step === 3 && (
                    <div className="step-content">
                        <div className="challenge-card glass-card">
                            <h2>🏆 Clustering Challenge</h2>
                            <p style={{ color: 'var(--text-secondary)', marginTop: 8, marginBottom: 20 }}>Achieve silhouette score above <strong style={{ color: 'var(--emerald)' }}>0.5</strong>.</p>
                            <div className="challenge-r2">
                                <div className="challenge-r2-bar">
                                    <div className="challenge-r2-fill" style={{
                                        width: `${Math.min(Math.max(results.metrics.silhouette || 0, 0) * 100, 100)}%`,
                                        background: (results.metrics.silhouette || 0) > 0.5 ? 'linear-gradient(90deg, var(--emerald), #04b88a)' : 'linear-gradient(90deg, var(--orange), var(--pink))',
                                    }} />
                                    <div className="challenge-r2-target" style={{ left: '50%' }} />
                                </div>
                            </div>
                            {(results.metrics.silhouette || 0) > 0.5 && (
                                <motion.div {...POP} className="success-card" style={{ marginTop: 20 }}>
                                    <p><strong>🎉 Clustering Master!</strong></p>
                                    <ChallengeUnlock awardBadge={awardBadge} awardXP={awardXP} badge="Clustering Master" />
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
