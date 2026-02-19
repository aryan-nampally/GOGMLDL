import { useState } from 'react';

export default function KNNConcept() {
    return (
        <div className="concept-container">
            {/* Video Section */}
            <VideoEmbed
                src="/videos/KNNAnim.mp4"
                label="🎬 Visualizing k-Nearest Neighbors"
            />

            <div className="concept-content" style={{ marginTop: 24 }}>
                <h2>k-Nearest Neighbors (KNN)</h2>

                <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
                    <p style={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
                        <strong>k-Nearest Neighbors</strong> is a simple, non-parametric lazy learning algorithm.
                        It classifies a new data point based on the majority class of its <strong>'k'</strong> nearest neighbors in the feature space.
                    </p>
                </div>

                <div className="grid-2-mobile" style={{ gap: 20 }}>
                    <div className="glass-card" style={{ padding: 16 }}>
                        <h3>🚀 Lazy Learner</h3>
                        <p className="text-muted">
                            KNN doesn't "learn" a model during training. Instead, it memorizes the entire dataset and performs the calculation only when making a prediction. this makes training fast but prediction slow for large datasets.
                        </p>
                    </div>

                    <div className="glass-card" style={{ padding: 16 }}>
                        <h3>📏 Distance Metric</h3>
                        <p className="text-muted">
                            It typically uses <strong>Euclidean Distance</strong> to find neighbors.
                            <br />
                            <code>d(p, q) = √[(q₁-p₁)² + (q₂-p₂)² + ...]</code>
                        </p>
                    </div>

                    <div className="glass-card" style={{ padding: 16 }}>
                        <h3>🗳️ Majority Vote</h3>
                        <p className="text-muted">
                            If <strong>k=3</strong>, we look at the 3 closest points. If 2 are Red and 1 is Blue, the new point is classified as <strong>Red</strong>.
                        </p>
                    </div>

                    <div className="glass-card" style={{ padding: 16 }}>
                        <h3>⚖️ Choosing 'k'</h3>
                        <p className="text-muted">
                            <strong>Small 'k'</strong>: Sensitive to noise (overfitting).
                            <br />
                            <strong>Large 'k'</strong>: Smoother boundary, but might miss local patterns (underfitting).
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function VideoEmbed({ src, label }) {
    const [open, setOpen] = useState(true);
    return (
        <div className="video-card glass-card" style={{ overflow: 'hidden' }}>
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
