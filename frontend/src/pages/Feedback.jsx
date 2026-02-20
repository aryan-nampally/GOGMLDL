import { useState } from 'react';
import { motion } from 'framer-motion';
import './Feedback.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

const AREA_OPTIONS = [
    'UI / Visual Design',
    'Animations / Transitions',
    'Chart Interactivity',
    'Content / Explanations',
    'Code Examples',
    'Performance / Speed',
    'Mobile Responsiveness',
    'Navigation / Layout',
    'Quizzes / Challenges',
    'More Algorithms',
];

const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: -10 },
};

export default function FeedbackPage() {
    const savedName = localStorage.getItem('mlgrphy_username') || '';
    const [name, setName] = useState(savedName);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [areas, setAreas] = useState([]);
    const [comments, setComments] = useState('');
    const [status, setStatus] = useState('idle'); // idle | sending | sent | error

    const toggleArea = (area) => {
        setAreas((prev) =>
            prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        if (rating === 0) return;
        setStatus('sending');

        try {
            const res = await fetch(`${API_BASE}/api/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    rating,
                    areasToImprove: areas,
                    comments: comments.trim(),
                    page: 'feedback-page',
                }),
            });

            if (!res.ok) throw new Error('Request failed');
            localStorage.setItem('mlgrphy_username', name.trim());
            setStatus('sent');
        } catch {
            setStatus('error');
        }
    };

    if (status === 'sent') {
        return (
            <motion.div className="feedback-page" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <div className="feedback-success glass-card">
                    <div className="success-icon">🎉</div>
                    <h2>Thank You, <span className="gradient-text">{name}</span>!</h2>
                    <p>Your feedback has been saved. It means a lot and will directly shape the next version of ML ATLAS.</p>
                    <p className="success-sub">— Aryan</p>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div className="feedback-page" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <div className="feedback-header">
                <span className="beta-pill">🧪 BETA</span>
                <h1>Share Your <span className="gradient-text">Feedback</span></h1>
                <p>
                    ML ATLAS is in active development. Your honest feedback helps me prioritize
                    what to build, fix, and improve next. Every response is stored and read by me personally.
                </p>
            </div>

            <form className="feedback-form glass-card" onSubmit={handleSubmit}>
                {/* Name */}
                <div className="fb-field">
                    <label className="fb-label">Your Name</label>
                    <input
                        type="text"
                        className="fb-input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name…"
                        maxLength={60}
                        required
                    />
                </div>

                {/* Rating */}
                <div className="fb-field">
                    <label className="fb-label">Overall Experience</label>
                    <div className="star-rating">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                className={`star-btn ${star <= (hoverRating || rating) ? 'active' : ''}`}
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                aria-label={`${star} star`}
                            >
                                ★
                            </button>
                        ))}
                        <span className="star-label">
                            {rating === 1 && 'Needs Work'}
                            {rating === 2 && 'Fair'}
                            {rating === 3 && 'Good'}
                            {rating === 4 && 'Great'}
                            {rating === 5 && 'Amazing!'}
                        </span>
                    </div>
                </div>

                {/* Areas */}
                <div className="fb-field">
                    <label className="fb-label">Areas to Improve <span className="fb-hint">(select all that apply)</span></label>
                    <div className="area-grid">
                        {AREA_OPTIONS.map((area) => (
                            <button
                                key={area}
                                type="button"
                                className={`area-chip ${areas.includes(area) ? 'selected' : ''}`}
                                onClick={() => toggleArea(area)}
                            >
                                {areas.includes(area) ? '✓ ' : ''}{area}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Comments */}
                <div className="fb-field">
                    <label className="fb-label">Comments / Suggestions</label>
                    <textarea
                        className="fb-textarea"
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="What did you like? What confused you? What's missing? Any bug you noticed?"
                        rows={5}
                        maxLength={2000}
                    />
                    <span className="fb-counter">{comments.length}/2000</span>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    className="btn btn-primary fb-submit"
                    disabled={!name.trim() || rating === 0 || status === 'sending'}
                >
                    {status === 'sending' ? 'Sending…' : 'Submit Feedback 📩'}
                </button>

                {status === 'error' && (
                    <p className="fb-error">Something went wrong. Please try again.</p>
                )}
            </form>
        </motion.div>
    );
}
