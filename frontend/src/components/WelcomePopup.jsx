import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import './WelcomePopup.css';

const STORAGE_KEY = 'mlgrphy_username';

export default function WelcomePopup() {
    const [visible, setVisible] = useState(false);
    const [name, setName] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Never show on admin page
    const isAdmin = location.pathname === '/admin';

    useEffect(() => {
        if (isAdmin) return;
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) {
            const timer = setTimeout(() => setVisible(true), 1200);
            return () => clearTimeout(timer);
        }
    }, [isAdmin]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        localStorage.setItem(STORAGE_KEY, name.trim());
        setSubmitted(true);
    };

    const handleClose = () => {
        setVisible(false);
    };

    const handleFeedback = () => {
        setVisible(false);
        navigate('/feedback');
    };

    if (!visible || isAdmin) return null;

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    className="welcome-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <motion.div
                        className="welcome-card glass-card"
                        initial={{ opacity: 0, scale: 0.85, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -20 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 260 }}
                    >
                        {!submitted ? (
                            <>
                                <div className="welcome-badge">🧪 BETA</div>
                                <h2 className="welcome-title">
                                    Welcome to <span className="gradient-text">ML ATLAS</span>
                                </h2>
                                <p className="welcome-msg">
                                    Hey there! I'm <strong>Aryan</strong> — this is the <strong>beta version</strong> of ML ATLAS, 
                                    an interactive machine learning playground I've been building. Everything you see is a work
                                    in progress, so I'd <em>really</em> love your feedback to make it better. 🚀
                                </p>
                                <form onSubmit={handleSubmit} className="welcome-form">
                                    <label className="welcome-label">What's your name?</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Enter your name…"
                                        className="welcome-input"
                                        autoFocus
                                        maxLength={60}
                                    />
                                    <button type="submit" className="btn btn-primary welcome-btn" disabled={!name.trim()}>
                                        Let's Go! 🎉
                                    </button>
                                </form>
                            </>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="welcome-confirmed"
                            >
                                <div className="welcome-wave">👋</div>
                                <h2 className="welcome-title">
                                    Hey, <span className="gradient-text">{name.trim()}</span>!
                                </h2>
                                <p className="welcome-msg">
                                    Great to have you here. Explore the labs, break things, and when you're ready —
                                    drop me some feedback so I can improve this for everyone.
                                </p>
                                <div className="welcome-actions">
                                    <button className="btn btn-primary" onClick={handleClose}>
                                        Start Exploring 🚀
                                    </button>
                                    <button className="btn btn-ghost" onClick={handleFeedback}>
                                        Give Feedback 💬
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
