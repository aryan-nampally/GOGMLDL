import { createContext, useContext, useState, useCallback } from 'react';

const FocusContext = createContext(null);

/**
 * Focus Mode Provider.
 * When active, the ambient background dims and animations pause —
 * subtly guiding the user's attention to the interactive content.
 */
export function FocusProvider({ children }) {
    const [focused, setFocused] = useState(false);

    const enterFocus = useCallback(() => setFocused(true), []);
    const exitFocus = useCallback(() => setFocused(false), []);

    return (
        <FocusContext.Provider value={{ focused, enterFocus, exitFocus }}>
            {children}
        </FocusContext.Provider>
    );
}

export function useFocus() {
    const ctx = useContext(FocusContext);
    if (!ctx) throw new Error('useFocus must be used within FocusProvider');
    return ctx;
}
