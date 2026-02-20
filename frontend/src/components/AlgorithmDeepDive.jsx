import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * AlgorithmDeepDive — Expandable algorithm theory card.
 *
 * Props:
 *   id, label, color, icon
 *   summary        – 1-2 sentence overview
 *   intuition      – plain-language explanation
 *   mathContent    – React node (MathBlock, etc.)
 *   steps          – array of { title, text } for step-by-step
 *   prosAndCons    – { pros: [...], cons: [...] }
 *   whenToUse      – string
 *   active         – is this the currently selected algorithm?
 *   onSelect       – callback
 */
export default function AlgorithmDeepDive({
    id, label, color, icon, summary,
    intuition, mathContent, steps, prosAndCons, whenToUse,
    active, onSelect,
}) {
    const [expanded, setExpanded] = useState(false);

    return (
        <motion.div
            className={`algo-deep-dive ${active ? 'active' : ''}`}
            style={{ '--algo-color': color }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
        >
            {/* Header — always visible */}
            <div className="algo-dd-header" onClick={() => { onSelect?.(id); setExpanded(!expanded); }}>
                <div className="algo-dd-left">
                    {icon && <span className="algo-dd-icon">{icon}</span>}
                    <div>
                        <h3 className="algo-dd-title">{label}</h3>
                        <p className="algo-dd-summary">{summary}</p>
                    </div>
                </div>
                <div className="algo-dd-right">
                    {active && <span className="algo-dd-active-badge">Selected</span>}
                    <span className="algo-dd-chevron">{expanded ? '▾' : '▸'}</span>
                </div>
            </div>

            {/* Expandable body */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        className="algo-dd-body"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    >
                        {/* Intuition */}
                        {intuition && (
                            <div className="algo-dd-section">
                                <h4><span className="algo-dd-tag">💡 Intuition</span></h4>
                                <p>{intuition}</p>
                            </div>
                        )}

                        {/* Math */}
                        {mathContent && (
                            <div className="algo-dd-section algo-dd-math">
                                <h4><span className="algo-dd-tag">📐 Mathematics</span></h4>
                                {mathContent}
                            </div>
                        )}

                        {/* Step by step */}
                        {steps && steps.length > 0 && (
                            <div className="algo-dd-section">
                                <h4><span className="algo-dd-tag">🔢 Step-by-Step</span></h4>
                                <ol className="algo-dd-steps">
                                    {steps.map((s, i) => (
                                        <li key={i}>
                                            <strong>{s.title}</strong>
                                            <span>{s.text}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        )}

                        {/* When to Use */}
                        {whenToUse && (
                            <div className="algo-dd-section">
                                <h4><span className="algo-dd-tag">🎯 When To Use</span></h4>
                                <p>{whenToUse}</p>
                            </div>
                        )}

                        {/* Pros & Cons */}
                        {prosAndCons && (
                            <div className="algo-dd-section algo-dd-proscons">
                                <div className="algo-dd-pros">
                                    <h4>✅ Advantages</h4>
                                    <ul>{prosAndCons.pros.map((p, i) => <li key={i}>{p}</li>)}</ul>
                                </div>
                                <div className="algo-dd-cons">
                                    <h4>⚠️ Limitations</h4>
                                    <ul>{prosAndCons.cons.map((c, i) => <li key={i}>{c}</li>)}</ul>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
