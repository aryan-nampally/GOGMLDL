import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';

const GameContext = createContext(null);

const STORAGE_KEY = 'ml_atlas_game';

function loadState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const { toasts: TOASTS, ...persisted } = JSON.parse(saved);
            return { xp: 0, level: 1, badges: [], ...persisted, toasts: [] };
        }
    } catch {
        return { xp: 0, level: 1, badges: [], toasts: [] };
    }
    return { xp: 0, level: 1, badges: [], toasts: [] };
}

function gameReducer(state, action) {
    switch (action.type) {
        case 'AWARD_XP': {
            const newXp = state.xp + action.amount;
            const newLevel = 1 + Math.floor(newXp / 100);
            const leveledUp = newLevel > state.level;
            const toast = leveledUp
                ? { id: Date.now(), text: `🔥 LEVEL UP! Level ${newLevel}`, type: 'level' }
                : { id: Date.now(), text: `⭐ +${action.amount} XP: ${action.reason}`, type: 'xp' };
            return { ...state, xp: newXp, level: newLevel, toasts: [...state.toasts, toast] };
        }
        case 'AWARD_BADGE': {
            if (state.badges.includes(action.name)) return state;
            const toast = { id: Date.now(), text: `🏆 Badge: ${action.name}`, type: 'badge' };
            return { ...state, badges: [...state.badges, action.name], toasts: [...state.toasts, toast] };
        }
        case 'DISMISS_TOAST':
            return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };
        default:
            return state;
    }
}

export function GameProvider({ children }) {
    const [state, dispatch] = useReducer(gameReducer, null, loadState);

    useEffect(() => {
        const { toasts: TOASTS, ...persist } = state;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(persist));
    }, [state]);

    // Auto-dismiss toasts
    useEffect(() => {
        if (state.toasts.length === 0) return;
        const timer = setTimeout(() => {
            dispatch({ type: 'DISMISS_TOAST', id: state.toasts[0].id });
        }, 2500);
        return () => clearTimeout(timer);
    }, [state.toasts]);

    const awardXP = useCallback((amount, reason = 'Task Complete') => {
        dispatch({ type: 'AWARD_XP', amount, reason });
    }, []);

    const awardBadge = useCallback((name) => {
        dispatch({ type: 'AWARD_BADGE', name });
    }, []);

    return (
        <GameContext.Provider value={{ ...state, awardXP, awardBadge, dispatch }}>
            {children}
        </GameContext.Provider>
    );
}

export function useGame() {
    const ctx = useContext(GameContext);
    if (!ctx) throw new Error('useGame must be used within GameProvider');
    return ctx;
}
