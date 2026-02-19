import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';

export default function ToastLayer() {
    const { toasts, dispatch } = useGame();

    return (
        <div className="toast-container">
            <AnimatePresence>
                {toasts.map((t) => (
                    <motion.div
                        key={t.id}
                        className={`toast ${t.type}`}
                        initial={{ opacity: 0, x: 60, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 60, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        onClick={() => dispatch({ type: 'DISMISS_TOAST', id: t.id })}
                        style={{ cursor: 'pointer' }}
                    >
                        {t.text}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
