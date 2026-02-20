import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import './Home.css';

const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.3 } },
};

const modules = [
    {
        title: 'Regression',
        icon: '📈',
        desc: 'Predict continuous values. Linear, Ridge, Lasso & Elastic Net.',
        path: '/regression',
        available: true,
        color: '#4F8BF9',
        level: 'Beginner',
        duration: '20-30 min',
    },
    {
        title: 'Classification',
        icon: '🎯',
        desc: 'Sort data into categories. Logistic, KNN, SVM, Naive Bayes & Decision Tree.',
        path: '/classification',
        available: true,
        color: '#9B5DE5',
        level: 'Beginner',
        duration: '25-35 min',
    },
    {
        title: 'Ensemble',
        icon: '🌲',
        desc: 'Combine weak learners. Random Forest, XGBoost, AdaBoost & more.',
        path: '/ensemble',
        available: true,
        color: '#F97316',
        level: 'Intermediate',
        duration: '30-40 min',
    },
    {
        title: 'Neural Networks',
        icon: '🧠',
        desc: 'Build networks from scratch. Forward pass, backprop, and decision boundaries.',
        path: '/neural',
        available: true,
        color: '#FF6B6B',
        level: 'Intermediate',
        duration: '35-45 min',
    },
    {
        title: 'Clustering',
        icon: '🔮',
        desc: 'Find hidden groups. K-Means, DBSCAN & Hierarchical.',
        path: '/clustering',
        available: true,
        color: '#06D6A0',
        level: 'Beginner',
        duration: '20-30 min',
    },
    {
        title: 'Dim Reduction',
        icon: '🗺️',
        desc: 'Compress high-D data. PCA & t-SNE projection.',
        path: '/dimensionality',
        available: true,
        color: '#EC4899',
        level: 'Intermediate',
        duration: '20-30 min',
    },
    {
        title: 'Anomaly Detection',
        icon: '🔍',
        desc: 'Find the needle in the haystack. Isolation Forest & LOF.',
        path: '/anomaly',
        available: true,
        color: '#14B8A6',
        level: 'Intermediate',
        duration: '25-35 min',
    },
];

const tracks = [
    {
        title: 'Start Here (Absolute Beginner)',
        items: ['Regression', 'Classification', 'Clustering'],
        goal: 'Build intuition for supervised vs unsupervised learning.',
    },
    {
        title: 'Model Power Track',
        items: ['Ensemble', 'Neural Networks', 'Anomaly Detection'],
        goal: 'Handle messy data, build deep models, and improve prediction robustness.',
    },
    {
        title: 'Deep Learning Track',
        items: ['Neural Networks', 'Dim Reduction'],
        goal: 'Understand how neural networks and representation learning work from scratch.',
    },
];

const outcomes = [
    'Pick the right algorithm family for a problem quickly.',
    'Interpret metrics (R², Accuracy, F1, Silhouette) with confidence.',
    'Debug model behavior using visual diagnostics, not blind trial-and-error.',
    'Explain ML decisions in plain language to non-technical people.',
];

const teachingPrinciples = [
    {
        title: 'What',
        desc: 'Start every concept with plain-language definition and visual context before equations.',
    },
    {
        title: 'Why',
        desc: 'Connect each model to a real problem so learners know when it matters.',
    },
    {
        title: 'How',
        desc: 'Use sliders, plots, and experiments so users learn by doing and reflection.',
    },
];

const pipelineStages = [
    {
        id: 'data',
        title: 'Data',
        subtitle: 'Collect & Clean',
        desc: 'Raw examples go in — features X and targets y become the training set that the model will learn from.',
        color: '#4F8BF9',
    },
    {
        id: 'model',
        title: 'Model',
        subtitle: 'Choose Architecture',
        desc: "Pick a function family — linear, tree, or neural — that can capture the pattern you're looking for.",
        color: '#9B5DE5',
    },
    {
        id: 'loss',
        title: 'Loss',
        subtitle: 'Measure Error',
        desc: 'A loss function scores how wrong the predictions are, giving the model a clear target to minimize.',
        color: '#F97316',
    },
    {
        id: 'optimize',
        title: 'Optimize',
        subtitle: 'Update Weights',
        desc: 'Gradient descent nudges parameters downhill on the loss surface — shrinking error step by step.',
        color: '#06D6A0',
    },
    {
        id: 'evaluate',
        title: 'Evaluate',
        subtitle: 'Test & Deploy',
        desc: 'Validate on unseen data. If it generalizes beyond the training set — ship it.',
        color: '#EC4899',
    },
];

function MLPipeline() {
    const [active, setActive] = useState(0);
    const [paused, setPaused] = useState(false);
    const [canAutoAnimate, setCanAutoAnimate] = useState(true);

    useEffect(() => {
        const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');

        const recompute = () => {
            const reduce = !!media?.matches;
            const visible = !document.hidden;
            setCanAutoAnimate(!reduce && visible);
        };

        recompute();
        document.addEventListener('visibilitychange', recompute);
        if (media?.addEventListener) media.addEventListener('change', recompute);
        else if (media?.addListener) media.addListener(recompute);

        return () => {
            document.removeEventListener('visibilitychange', recompute);
            if (media?.removeEventListener) media.removeEventListener('change', recompute);
            else if (media?.removeListener) media.removeListener(recompute);
        };
    }, []);

    useEffect(() => {
        if (paused || !canAutoAnimate) return;
        const timer = setInterval(() => {
            setActive(prev => (prev + 1) % pipelineStages.length);
        }, 2800);
        return () => clearInterval(timer);
    }, [paused, canAutoAnimate]);

    const handleNodeClick = useCallback((i) => {
        setActive(i);
        setPaused(true);
    }, []);

    const stage = pipelineStages[active];

    return (
        <motion.section
            className="ml-pipeline glass-card"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5 }}
        >
            {/* Ambient floating particles */}
            <div className="pipeline-ambient">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className={`ambient-dot dot-${i}`} />
                ))}
            </div>

            <div className="pipeline-header">
                <h3>How Every Model Learns</h3>
                <p>The same five-stage loop powers every algorithm in this atlas.</p>
            </div>

            {/* Visual pipeline track */}
            <div className="pipeline-track">
                {pipelineStages.map((s, i) => (
                    <div key={s.id} className="pipeline-segment">
                        {/* Connector before node (except first) */}
                        {i > 0 && (
                            <div className={`pipeline-connector ${i <= active ? 'filled' : ''}`}>
                                <div className="connector-particle" />
                                <div className="connector-particle p2" />
                            </div>
                        )}
                        {/* Node */}
                        <button
                            className={`pipeline-node ${i === active ? 'active' : ''} ${i < active ? 'done' : ''}`}
                            style={{ '--node-color': s.color }}
                            onClick={() => handleNodeClick(i)}
                            aria-label={s.title}
                        >
                            <div className="node-ring" />
                            <div className="node-ring ring-2" />
                            <div className="node-core">
                                <span className="node-num">{i + 1}</span>
                            </div>
                            <span className="node-label">{s.title}</span>
                        </button>
                    </div>
                ))}
                {/* Loop-back indicator */}
                <div className={`pipeline-loop ${active === 4 ? 'glow' : ''}`}>
                    <svg viewBox="0 0 28 28" fill="none">
                        <path d="M14 4 A10 10 0 1 1 4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M4 8 L4 14 L10 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            </div>

            {/* Active stage detail */}
            <AnimatePresence mode="sync">
                <motion.div
                    key={active}
                    className="pipeline-detail"
                    initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                    transition={{ duration: 0.35 }}
                >
                    <span className="detail-badge" style={{ background: stage.color }}>
                        {stage.subtitle}
                    </span>
                    <p>{stage.desc}</p>
                </motion.div>
            </AnimatePresence>

            {/* Progress / controls */}
            <div className="pipeline-controls">
                <div className="pipeline-dots">
                    {pipelineStages.map((_, i) => (
                        <button
                            key={i}
                            className={`progress-dot ${i === active ? 'active' : ''}`}
                            onClick={() => handleNodeClick(i)}
                            aria-label={`Stage ${i + 1}`}
                        />
                    ))}
                </div>
                {paused && (
                    <button className="pipeline-play" onClick={() => setPaused(false)}>
                        ▶ Auto-play
                    </button>
                )}
            </div>

            <div className="pipeline-footer">
                <div className="pipeline-note">
                    Every lab follows this loop — Step 0 explains, Step 1 experiments, Step 2 evaluates.
                </div>
                <div className="pipeline-cta">
                    <Link to="/regression">Start with Regression →</Link>
                    <Link to="/clustering">Or try Clustering →</Link>
                </div>
            </div>
        </motion.section>
    );
}

export default function Home() {
    return (
        <motion.div className="home-page" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            {/* Hero */}
            <section className="hero">
                {/* AI Pulse Core — radial glow behind title */}
                <div className="ai-pulse-core">
                    <div className="pulse-ring" />
                    <div className="pulse-ring pulse-ring-2" />
                    <div className="pulse-glow" />
                </div>

                <motion.h1
                    className="hero-title gradient-text-shimmer"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
                >
                    ML ATLAS
                </motion.h1>

                <motion.p
                    className="hero-credit"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.14, duration: 0.45 }}
                >
                    Developed by <strong>Aryan Nampally</strong>
                </motion.p>
                <motion.p
                    className="hero-subtitle"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    Learn Machine Learning by <strong>seeing</strong> it move.
                </motion.p>
                <motion.p
                    className="hero-tagline"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                >
                    No heavy math. Just sliders, real data, and instant feedback.
                </motion.p>
            </section>

            {/* ML Pipeline */}
            <MLPipeline />

            {/* Module Groups */}
            <div className="module-groups">
                <SectionHeader title="Supervised Learning" subtitle="Models that learn from labeled examples." />
                <section className="module-grid">
                    {modules.filter(m => ['Regression', 'Classification', 'Ensemble', 'Neural Networks'].includes(m.title)).map((m, i) => (
                        <ModuleCard key={m.title} m={m} delay={0.3 + i * 0.1} />
                    ))}
                </section>

                <SectionHeader title="Unsupervised Learning" subtitle="Finding hidden patterns in unlabeled data." delay={0.5} />
                <section className="module-grid">
                    {modules.filter(m => !['Regression', 'Classification', 'Ensemble', 'Neural Networks'].includes(m.title)).map((m, i) => (
                        <ModuleCard key={m.title} m={m} delay={0.6 + i * 0.1} />
                    ))}
                </section>
            </div>

            <motion.section
                className="quickstart glass-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65, duration: 0.5 }}
            >
                <h3>🚀 New Here? Start in 15 Minutes</h3>
                <div className="quickstart-steps">
                    <div><span>1</span> Open <strong>Regression Lab</strong> and move the Noise slider.</div>
                    <div><span>2</span> Switch to <strong>Classification</strong> and compare algorithms on Moons data.</div>
                    <div><span>3</span> Save snapshots and compare metrics side by side.</div>
                </div>
                <div className="quickstart-links">
                    <Link to="/regression">Start Regression</Link>
                    <Link to="/classification">Try Classification</Link>
                </div>
            </motion.section>

            <section className="learning-paths">
                <SectionHeader title="Learning Paths" subtitle="Follow a path instead of guessing what to study next." delay={0.68} />
                <div className="path-grid">
                    {tracks.map((track, i) => (
                        <motion.div
                            key={track.title}
                            className="path-card glass-card"
                            initial={{ opacity: 0, y: 22 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 + i * 0.1, duration: 0.45 }}
                        >
                            <h4>{track.title}</h4>
                            <p>{track.goal}</p>
                            <div className="path-tags">
                                {track.items.map((item) => <span key={item}>{item}</span>)}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            <section className="outcomes">
                <SectionHeader title="What You’ll Be Able To Do" subtitle="Outcome-first learning, not just theory." delay={0.75} />
                <div className="outcome-list">
                    {outcomes.map((outcome, i) => (
                        <motion.div
                            key={outcome}
                            className="outcome-item"
                            initial={{ opacity: 0, x: -16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.8 + i * 0.08, duration: 0.4 }}
                        >
                            <span>✓</span>
                            <p>{outcome}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            <section className="teaching-principles">
                <SectionHeader title="Teaching Principles" subtitle="Every lesson follows What → Why → How for first-time learners." delay={0.78} />
                <div className="principle-grid">
                    {teachingPrinciples.map((item, i) => (
                        <motion.div
                            key={item.title}
                            className="principle-card"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.84 + i * 0.08, duration: 0.35 }}
                        >
                            <span>{item.title}</span>
                            <p>{item.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Philosophy */}
            <motion.section
                className="philosophy glass-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
            >
                <div className="philosophy-quote">
                    <span className="quote-mark">"</span>
                    <p>You don't understand it until you can visualize it.</p>
                </div>
                <div className="philosophy-rules">
                    <div className="rule">
                        <span className="rule-num">01</span>
                        <div>
                            <h4>Intuition First</h4>
                            <p>Plain English explanations</p>
                        </div>
                    </div>
                    <div className="rule">
                        <span className="rule-num">02</span>
                        <div>
                            <h4>Visual Proof</h4>
                            <p>See the math happening</p>
                        </div>
                    </div>
                    <div className="rule">
                        <span className="rule-num">03</span>
                        <div>
                            <h4>Interactive</h4>
                            <p>Break things to learn how they work</p>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* Footer / Contact */}
            <motion.footer
                className="home-footer glass-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.5 }}
            >
                <div className="footer-inner">
                    <div className="footer-brand">
                        <span className="gradient-text" style={{ fontSize: '1.1rem', fontWeight: 700 }}>ML ATLAS</span>
                        <span className="footer-beta">BETA</span>
                    </div>
                    <p className="footer-tagline">Built with ❤️ by <strong>Aryan Nampally</strong></p>
                    <div className="footer-links">
                        <a href="mailto:aryannampally@gmail.com" className="footer-link" target="_blank" rel="noopener noreferrer">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                            aryannampally@gmail.com
                        </a>
                        <a href="https://www.linkedin.com/in/aryan-nampally/" className="footer-link" target="_blank" rel="noopener noreferrer">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                            LinkedIn
                        </a>
                        <Link to="/feedback" className="footer-link">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            Send Feedback
                        </Link>
                    </div>
                    <p className="footer-copy">© 2026 ML ATLAS · All rights reserved</p>
                </div>
            </motion.footer>
        </motion.div>
    );
}

function SectionHeader({ title, subtitle, delay = 0 }) {
    return (
        <motion.div
            className="section-header"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay, duration: 0.5 }}
        >
            <h2>{title}</h2>
            <p>{subtitle}</p>
            <div className="section-divider" />
        </motion.div>
    );
}

function ModuleCard({ m, delay }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
            {m.available ? (
                <Link to={m.path} className="module-card glass-card" style={{ '--accent': m.color }}>
                    <div className="card-pulse" />
                    <div className="module-meta-row">
                        <span className="module-meta-pill">{m.level}</span>
                        <span className="module-meta-time">{m.duration}</span>
                    </div>
                    <span className="module-icon">{m.icon}</span>
                    <h3>{m.title}</h3>
                    <p>{m.desc}</p>
                    <span className="module-cta">Start Learning →</span>
                </Link>
            ) : (
                <div className="module-card glass-card disabled" style={{ '--accent': m.color }}>
                    <span className="module-icon">{m.icon}</span>
                    <h3>{m.title}</h3>
                    <p>{m.desc}</p>
                    <span className="module-cta coming-soon">Coming Soon</span>
                </div>
            )}
        </motion.div>
    );
}
