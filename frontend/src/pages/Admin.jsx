import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import './Admin.css';

const API_BASE = import.meta.env.VITE_API_URL || '';
const ADMIN_KEY = 'aryan_mlgrphy_admin_2026';

const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: -10 },
};

function StarDisplay({ rating }) {
    return (
        <span className="admin-stars">
            {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} className={s <= rating ? 'star-filled' : 'star-empty'}>★</span>
            ))}
        </span>
    );
}

export default function AdminPage() {
    const [authed, setAuthed] = useState(false);
    const [key, setKey] = useState('');
    const [feedbacks, setFeedbacks] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');

    const headers = { 'x-admin-key': ADMIN_KEY, 'Content-Type': 'application/json' };

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [fbRes, stRes] = await Promise.all([
                fetch(`${API_BASE}/api/admin/feedbacks`, { headers }),
                fetch(`${API_BASE}/api/admin/stats`, { headers }),
            ]);
            if (fbRes.status === 403 || stRes.status === 403) {
                setAuthed(false);
                setError('Invalid admin key.');
                return;
            }
            const fbData = await fbRes.json();
            const stData = await stRes.json();
            setFeedbacks(fbData);
            setStats(stData);
        } catch {
            setError('Failed to fetch data. Is the backend running?');
        } finally {
            setLoading(false);
        }
    }, []);

    const handleLogin = (e) => {
        e.preventDefault();
        if (key.trim() === ADMIN_KEY) {
            setAuthed(true);
        } else {
            setError('Wrong admin key.');
        }
    };

    useEffect(() => {
        if (authed) fetchData();
    }, [authed, fetchData]);

    const filtered = filter === 'all'
        ? feedbacks
        : feedbacks.filter((f) => f.rating === parseInt(filter));

    if (!authed) {
        return (
            <motion.div className="admin-page" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <div className="admin-login glass-card">
                    <h2>🔒 Admin Access</h2>
                    <p>Enter the admin key to view feedback data.</p>
                    <form onSubmit={handleLogin} className="admin-login-form">
                        <input
                            type="password"
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            placeholder="Admin key…"
                            className="fb-input"
                            autoFocus
                        />
                        <button type="submit" className="btn btn-primary">Unlock 🔓</button>
                    </form>
                    {error && <p className="fb-error">{error}</p>}
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div className="admin-page" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <div className="admin-header">
                <h1>📊 Admin <span className="gradient-text">Dashboard</span></h1>
                <button className="btn btn-ghost" onClick={fetchData} disabled={loading}>
                    {loading ? 'Refreshing…' : '↻ Refresh'}
                </button>
            </div>

            {error && <p className="fb-error" style={{ textAlign: 'center', marginBottom: 20 }}>{error}</p>}

            {/* Stats Cards */}
            {stats && (
                <div className="admin-stats">
                    <div className="admin-stat-card glass-card">
                        <span className="stat-num">{stats.totalFeedbacks}</span>
                        <span className="stat-label">Total Responses</span>
                    </div>
                    <div className="admin-stat-card glass-card">
                        <span className="stat-num">{stats.averageRating} ★</span>
                        <span className="stat-label">Avg Rating</span>
                    </div>
                    <div className="admin-stat-card glass-card wide">
                        <span className="stat-label" style={{ marginBottom: 8 }}>Top Areas to Improve</span>
                        <div className="area-bars">
                            {(stats.topAreas || []).map((a) => (
                                <div key={a._id} className="area-bar-row">
                                    <span className="area-bar-label">{a._id}</span>
                                    <div className="area-bar-track">
                                        <div
                                            className="area-bar-fill"
                                            style={{ width: `${Math.min((a.count / Math.max(stats.totalFeedbacks, 1)) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <span className="area-bar-count">{a.count}</span>
                                </div>
                            ))}
                            {(!stats.topAreas || stats.topAreas.length === 0) && (
                                <span className="stat-label">No area data yet</span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Filter */}
            <div className="admin-filter">
                <span>Filter by rating:</span>
                {['all', '5', '4', '3', '2', '1'].map((v) => (
                    <button
                        key={v}
                        className={`filter-pill ${filter === v ? 'active' : ''}`}
                        onClick={() => setFilter(v)}
                    >
                        {v === 'all' ? 'All' : `${v}★`}
                    </button>
                ))}
            </div>

            {/* Feedback Table */}
            <div className="admin-table-wrap glass-card">
                {loading && <p style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</p>}
                {!loading && filtered.length === 0 && (
                    <p style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>No feedbacks yet.</p>
                )}
                {!loading && filtered.length > 0 && (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Rating</th>
                                <th>Areas to Improve</th>
                                <th>Comments</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((fb, i) => (
                                <tr key={fb._id}>
                                    <td className="row-num">{i + 1}</td>
                                    <td className="row-name">{fb.name}</td>
                                    <td><StarDisplay rating={fb.rating} /></td>
                                    <td className="row-areas">
                                        {(fb.areasToImprove || []).map((a) => (
                                            <span key={a} className="area-tag">{a}</span>
                                        ))}
                                        {(!fb.areasToImprove || fb.areasToImprove.length === 0) && '—'}
                                    </td>
                                    <td className="row-comment">{fb.comments || '—'}</td>
                                    <td className="row-date">{new Date(fb.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </motion.div>
    );
}
