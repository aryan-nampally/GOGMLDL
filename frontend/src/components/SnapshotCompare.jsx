import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { REVEAL } from '../utils/motion';
import { snapshotManager } from '../utils/snapshotManager';

/**
 * Snapshot Compare — Save experiment configs, compare them side-by-side.
 * Lab-agnostic: uses `labId` to isolate storage and renders dynamic metrics.
 */
export default function SnapshotCompare({ labId, currentConfig, currentMetrics }) {
    const [snapshots, setSnapshots] = useState([]);
    const [comparing, setComparing] = useState(null); // index of snapshot to compare
    const [showPanel, setShowPanel] = useState(false);

    // Load initial snapshots
    useEffect(() => {
        setSnapshots(snapshotManager.getSnapshots(labId));
    }, [labId]);

    const save = () => {
        const updated = snapshotManager.saveSnapshot(labId, currentConfig, currentMetrics);
        setSnapshots(updated);
    };

    const remove = (id) => {
        const updated = snapshotManager.deleteSnapshot(labId, id);
        setSnapshots(updated);
        if (comparing !== null && snapshots[comparing]?.id === id) setComparing(null);
    };

    const clearAll = () => {
        snapshotManager.clearSnapshots(labId);
        setSnapshots([]);
        setComparing(null);
    };

    return (
        <div>
            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                <button className="btn btn-ghost" onClick={save} style={{ padding: '8px 16px', fontSize: '0.82rem' }}>
                    📸 Save Snapshot
                </button>
                {snapshots.length > 0 && (
                    <button
                        className="btn btn-ghost"
                        onClick={() => setShowPanel(!showPanel)}
                        style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                    >
                        {showPanel ? 'Hide' : '📊 Compare'} ({snapshots.length})
                    </button>
                )}
            </div>

            {/* Compare panel */}
            <AnimatePresence>
                {showPanel && snapshots.length > 0 && (
                    <motion.div {...REVEAL} className="glass-card" style={{ padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h4 style={{ fontSize: '0.9rem' }}>Saved Snapshots</h4>
                            <button
                                onClick={clearAll}
                                style={{
                                    background: 'none', border: 'none', color: 'var(--text-muted)',
                                    fontSize: '0.75rem', cursor: 'pointer',
                                }}
                            >
                                Clear All
                            </button>
                        </div>

                        <div className="snapshot-list">
                            {snapshots.map((snap, i) => (
                                <div
                                    key={snap.id}
                                    className={`snapshot-item ${comparing === i ? 'selected' : ''}`}
                                    onClick={() => setComparing(comparing === i ? null : i)}
                                >
                                    <div>
                                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>#{i + 1}</span>
                                        <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>{snap.timestamp}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        {/* Show first metric as preview if available */}
                                        {Object.keys(snap.metrics)[0] && (
                                            <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                                                {Object.keys(snap.metrics)[0]}: {Number(snap.metrics[Object.keys(snap.metrics)[0]]).toFixed(3)}
                                            </span>
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); remove(snap.id); }}
                                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Side-by-side comparison */}
                        {comparing !== null && snapshots[comparing] && (
                            <motion.div {...REVEAL} style={{ marginTop: 16 }}>
                                <div className="compare-grid">
                                    <CompareCol label="Current" config={currentConfig} metrics={currentMetrics} />
                                    <CompareCol label={`Snapshot #${comparing + 1}`} config={snapshots[comparing].config} metrics={snapshots[comparing].metrics} />
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function CompareCol({ label, config, metrics }) {
    return (
        <div className="compare-col">
            <h4>{label}</h4>
            {/* Generically render config keys (filtering out large objects/arrays if present) */}
            {Object.entries(config)
                .filter(([, v]) => typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean')
                .map(([k, v]) => (
                    <MetricRow key={k} name={k} value={typeof v === 'number' && !Number.isInteger(v) ? v.toFixed(2) : v.toString()} />
                ))}

            <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '8px 0', paddingTop: 8 }}>
                {/* Generically render all metrics */}
                {Object.entries(metrics).map(([k, v]) => (
                    <MetricRow
                        key={k}
                        name={k}
                        value={typeof v === 'number' ? v.toFixed(4) : v}
                        color={['r2', 'accuracy', 'precision', 'recall', 'f1', 'silhouette'].includes(k) && v > 0.8 ? 'var(--emerald)' : undefined}
                    />
                ))}
            </div>
        </div>
    );
}

function MetricRow({ name, value, color }) {
    // Format camelCase to Title Case (e.g. nSamples -> N Samples)
    const formattedName = name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>{formattedName}</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: color || 'var(--text-primary)' }}>{value}</span>
        </div>
    );
}
