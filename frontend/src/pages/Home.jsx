import { motion } from 'framer-motion';
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
        items: ['Ensemble', 'Anomaly Detection'],
        goal: 'Handle messy data and improve prediction robustness.',
    },
    {
        title: 'Representation Track',
        items: ['Dim Reduction'],
        goal: 'Understand how high-dimensional patterns become visible.',
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

            {/* Module Groups */}
            <div className="module-groups">
                <SectionHeader title="Supervised Learning" subtitle="Models that learn from labeled examples." />
                <section className="module-grid">
                    {modules.filter(m => ['Regression', 'Classification', 'Ensemble'].includes(m.title)).map((m, i) => (
                        <ModuleCard key={m.title} m={m} delay={0.3 + i * 0.1} />
                    ))}
                </section>

                <SectionHeader title="Unsupervised Learning" subtitle="Finding hidden patterns in unlabeled data." delay={0.5} />
                <section className="module-grid">
                    {modules.filter(m => !['Regression', 'Classification', 'Ensemble'].includes(m.title)).map((m, i) => (
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
