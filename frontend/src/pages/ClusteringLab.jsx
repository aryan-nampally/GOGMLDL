import { useState, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { useFocus } from '../context/FocusContext';
import clusteringEngine from '../engines/clusteringEngine';
import { runPipeline } from '../engines/baseEngine';
import { PAGE_TRANSITION, STEP_SWITCH, REVEAL, POP } from '../utils/motion';
import TeachingFrame from '../components/TeachingFrame';
import LearningJourney from '../components/LearningJourney';
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
                        <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0' }}>Find hidden structure without labels</p>
                    </div>
                    <div className={`explain-badge ${explainMode ? 'on' : 'off'}`} onClick={() => setExplainMode(!explainMode)}>
                        {explainMode ? '💡 Explain ON' : '💡 Explain OFF'}
                    </div>
                </div>

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
                        <div className="concept-tabs">
                            {CONCEPTS.map((c, i) => (
                                <button key={c} className={`concept-tab ${concept === i ? 'active' : ''}`} onClick={() => setConcept(i)}>{c}</button>
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
                        <div className="concept-display">
                            <Suspense fallback={<div className="loading-spinner">Loading concept...</div>}>
                                <AnimatePresence mode="wait">
                                    <motion.div key={concept} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                                        {concept === 0 && <KMeansConcept />}
                                        {concept === 1 && (
                                            <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
                                                <h3>DBSCAN</h3>
                                                <p className="text-muted">Density-based clustering with noise detection.</p>
                                                <p>Finds clusters by neighborhood density and labels sparse points as outliers.</p>
                                            </div>
                                        )}
                                        {concept === 2 && (
                                            <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
                                                <h3>Hierarchical Clustering</h3>
                                                <p className="text-muted">Builds clusters bottom-up by merging nearest groups.</p>
                                                <p>Great for seeing multi-level structure and cut-points.</p>
                                            </div>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </Suspense>
                        </div>
                        <div className="step-actions"><button className="btn btn-primary" onClick={handleGoNext}>Next → Configure ⚙️</button></div>
                    </div>
                )}

                {step === 1 && (
                    <div className="step-content">
                        <h2>Configure</h2>
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
    if (!awarded) {
        setTimeout(() => {
            awardBadge(badge);
            awardXP(100, `${badge} Complete`);
            setAwarded(true);
        }, 500);
    }
    return null;
}
