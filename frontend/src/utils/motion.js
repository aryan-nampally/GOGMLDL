/**
 * Motion Tokens — Strict, consistent animation constants.
 *
 * Rule: Every animation in the app uses one of these presets.
 * Consistency = luxury feel.
 */

// Page-level transitions (route changes)
export const PAGE_TRANSITION = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.25 } },
};

// Card entrance (stagger children)
export const CARD_ENTER = {
    initial: { opacity: 0, y: 24 },
    animate: (i = 0) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.08, duration: 0.4, ease: [0.4, 0, 0.2, 1] },
    }),
};

// Content reveal (progressive disclosure panels)
export const REVEAL = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
    exit: { opacity: 0, y: 8, transition: { duration: 0.2 } },
};

// Toast notifications (slide from right)
export const TOAST = {
    initial: { opacity: 0, x: 60, scale: 0.9 },
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: 60, scale: 0.9 },
    transition: { type: 'spring', stiffness: 400, damping: 30 },
};

// Hover lift (cards, buttons) — CSS transitions, not Framer
export const HOVER_DURATION = '0.2s';
export const HOVER_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

// Step content switch
export const STEP_SWITCH = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
};

// XP / gamification burst
export const XP_BURST = {
    initial: { opacity: 1, y: 0, scale: 1 },
    animate: { opacity: 0, y: -40, scale: 1.3, transition: { duration: 0.6, ease: 'easeOut' } },
};

// Scale pop (badge unlock, success moments)
export const POP = {
    initial: { opacity: 0, scale: 0.85 },
    animate: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 20 } },
};
