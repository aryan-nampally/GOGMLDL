import { useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useGame } from '../context/GameContext';

export default function Quiz({ id, question, options, correctIdx, explanation, xpReward = 50 }) {
    const { awardXP } = useGame();
    const storageKey = `quiz_${id}`;

    const [selected, setSelected] = useState(null);
    const [answered, setAnswered] = useState(() => {
        try { return localStorage.getItem(storageKey) === 'true'; } catch { return false; }
    });
    const [showWrong, setShowWrong] = useState(false);

    const handleSubmit = () => {
        if (selected === null) return;
        if (selected === correctIdx) {
            setAnswered(true);
            localStorage.setItem(storageKey, 'true');
            awardXP(xpReward, 'Quiz Correct!');
            // Subtle confetti — only on quiz correct, not fireworks
            confetti({
                particleCount: 60,
                spread: 55,
                origin: { y: 0.7 },
                colors: ['#4F8BF9', '#9B5DE5', '#06D6A0'],
            });
        } else {
            setShowWrong(true);
            setTimeout(() => setShowWrong(false), 600);
        }
    };

    if (answered) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="success-card"
            >
                <p><strong>✅ Correct!</strong> +{xpReward} XP earned.</p>
                <p style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <strong>Why?</strong> {explanation}
                </p>
            </motion.div>
        );
    }

    return (
        <div className="glass-card">
            <h3 style={{ marginBottom: 16 }}>🧠 Quick Check</h3>
            <p style={{ color: 'var(--text-primary)', marginBottom: 16, fontWeight: 500 }}>{question}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {options.map((opt, i) => (
                    <div
                        key={i}
                        className={`quiz-option ${selected === i ? 'selected' : ''} ${showWrong && selected === i ? 'wrong' : ''}`}
                        onClick={() => !answered && setSelected(i)}
                    >
                        <div className="radio-dot" />
                        <span>{opt}</span>
                    </div>
                ))}
            </div>

            <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={selected === null}
                style={{ opacity: selected === null ? 0.5 : 1 }}
            >
                Submit Answer
            </button>

            {showWrong && (
                <motion.p
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ color: 'var(--pink)', marginTop: 12, fontSize: '0.88rem' }}
                >
                    Not quite. Try again!
                </motion.p>
            )}
        </div>
    );
}
