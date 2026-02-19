import { motion } from 'framer-motion';
import { useState } from 'react';

export default function LogisticRegressionConcept() {
    return (
        <div className="concept-container">
            <h2>Logistic Regression & Classification Basics</h2>

            <div className="grid-2" style={{ gap: 20, marginTop: 20 }}>
                <ConceptCard
                    title="What is Classification?"
                    icon="🎯"
                    content="Classification predicts *categories* — not numbers. Is this email spam? Is this tumor benign? Will the customer churn? The model draws boundaries between classes."
                    delay={0}
                />
                <ConceptCard
                    title="Decision Boundary"
                    icon="✂️"
                    content="Every classifier splits the feature space with a boundary. Linear models draw lines. Trees draw rectangles. KNN creates complex, organic shapes."
                    delay={0.1}
                />
                <ConceptCard
                    title="How We Measure"
                    icon="📏"
                    content="Accuracy alone can mislead (99% accurate on 99% majority class!). We also track Precision (how many positives are real), Recall (how many real positives we caught), and F1 (their balance)."
                    delay={0.2}
                />
                <ConceptCard
                    title="Logistic Regression Specifics"
                    icon="📉"
                    content="Despite the name, it's for classification! It uses the Sigmoid function to squash output between 0 and 1, interpreting it as the probability of the positive class."
                    delay={0.3}
                />
            </div>

            <div className="glass-card" style={{ marginTop: 20, padding: 0, overflow: 'hidden' }}>
                <VideoEmbed
                    src="/videos/LogisticAnim.mp4"
                    label="🎬 Visualizing the Sigmoid S-Curve"
                />
                <div style={{ padding: 20 }}>
                    <h3>The Sigmoid Function</h3>
                    <p className="text-muted">
                        Logistic Regression uses the <strong>sigmoid function</strong> to squash any input number into a probability between 0 and 1.
                        <br />
                        <code>P(y=1) = 1 / (1 + e^-z)</code>
                    </p>
                    <p className="text-muted" style={{ marginTop: 8 }}>
                        If P(y=1) &gt; 0.5, we classify as 1. This naturally creates a decision boundary.
                    </p>
                </div>
            </div>
        </div>
    );
}

function ConceptCard({ title, icon, content, delay }) {
    return (
        <motion.div
            className="glass-card concept-card-item"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            style={{ padding: 20 }}
        >
            <div className="concept-icon" style={{ fontSize: '2rem', marginBottom: 12 }}>{icon}</div>
            <h3 style={{ marginBottom: 8 }}>{title}</h3>
            <p className="text-muted" style={{ lineHeight: 1.5 }}>{content}</p>
        </motion.div>
    );
}


function VideoEmbed({ src, label }) {
    const [open, setOpen] = useState(true);
    return (
        <div className="video-card">
            <button
                onClick={() => setOpen(!open)}
                style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.05)',
                    border: 'none',
                    borderBottom: open ? '1px solid rgba(255,255,255,0.1)' : 'none',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                }}
            >
                <span>{open ? '▾' : '▸'}</span>
                {label}
            </button>
            {open && (
                <div style={{ padding: 0 }}>
                    <video
                        src={src}
                        controls
                        autoPlay
                        muted
                        loop
                        style={{ width: '100%', display: 'block', maxHeight: 400, objectFit: 'contain', background: '#000' }}
                    />
                </div>
            )}
        </div>
    );
}
