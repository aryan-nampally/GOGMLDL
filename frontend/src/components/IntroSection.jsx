import { motion } from 'framer-motion';

/**
 * IntroSection — GFG-style introduction with goal, real-world motivation, and key terms.
 *
 * Props:
 *   title       – h2 title (e.g. "What is Linear Regression?")
 *   subtitle    – one-line summary
 *   goalText    – learning goal for this page
 *   paragraphs  – array of paragraph strings (2-4 recommended)
 *   realWorld   – { title, items: [{ icon, text }] }
 *   prerequisites – array of strings (optional)
 */
export default function IntroSection({ title, subtitle, goalText, paragraphs = [], realWorld, prerequisites }) {
    return (
        <motion.section
            className="intro-section"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
            {/* Goal Banner */}
            {goalText && (
                <div className="intro-goal">
                    <span className="intro-goal-icon">🎯</span>
                    <div>
                        <span className="intro-goal-label">Learning Goal</span>
                        <p>{goalText}</p>
                    </div>
                </div>
            )}

            <h2 className="intro-title">{title}</h2>
            {subtitle && <p className="intro-subtitle">{subtitle}</p>}

            <div className="intro-body">
                {paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                ))}
            </div>

            {/* Real-world applications */}
            {realWorld && (
                <div className="intro-realworld">
                    <h3>{realWorld.title || 'Real-World Applications'}</h3>
                    <div className="intro-realworld-grid">
                        {realWorld.items.map((item, i) => (
                            <div key={i} className="intro-realworld-item glass-card">
                                <span className="intro-rw-icon">{item.icon}</span>
                                <p>{item.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Prerequisites */}
            {prerequisites && prerequisites.length > 0 && (
                <div className="intro-prereqs">
                    <span className="intro-prereqs-label">📋 Prerequisites</span>
                    <ul>
                        {prerequisites.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                </div>
            )}
        </motion.section>
    );
}
