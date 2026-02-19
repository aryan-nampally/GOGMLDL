import { useState } from 'react';

export default function KMeansConcept() {
    return (
        <div className="concept-container">
            {/* Video Section */}
            <VideoEmbed
                src="/videos/KMeansAnim.mp4"
                label="🎬 Visualizing K-Means Clustering"
            />

            <div className="concept-content" style={{ marginTop: 24 }}>
                <h2>K-Means Clustering</h2>

                <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
                    <p style={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
                        <strong>K-Means</strong> is an iterative algorithm that partitions data into <strong>k</strong> distinct clusters.
                        It aims to make points in the same cluster as similar as possible.
                    </p>
                </div>

                <div className="grid-2-mobile" style={{ gap: 20 }}>
                    <div className="glass-card" style={{ padding: 16 }}>
                        <h3>📍 Centroids</h3>
                        <p className="text-muted">
                            The algorithm starts by randomly placing <strong>k</strong> points called "centroids". These act as the center of each cluster.
                        </p>
                    </div>

                    <div className="glass-card" style={{ padding: 16 }}>
                        <h3>1️⃣ Assignment</h3>
                        <p className="text-muted">
                            Each data point looks at allcentroids and joins the one that is closest (using Euclidean distance).
                        </p>
                    </div>

                    <div className="glass-card" style={{ padding: 16 }}>
                        <h3>2️⃣ Update</h3>
                        <p className="text-muted">
                            Once all points are assigned, the centroids move to the <strong>center (mean)</strong> of their new members.
                        </p>
                    </div>

                    <div className="glass-card" style={{ padding: 16 }}>
                        <h3>🔄 Repeat</h3>
                        <p className="text-muted">
                            Steps 1 and 2 repeat until the centroids stop moving (convergence).
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
