
import { html } from 'htm/preact';
import { createContext } from 'preact';
import { useState, useContext, useEffect, useRef, useCallback } from 'preact/hooks';
import { icons } from '../constants/icons';
import * as api from '../utils/api';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

interface ToastMessage {
    id: string;
    message: string;
    type: ToastType;
}

interface UIContextType {
    addToast: (message: string, type: ToastType) => void;
    
    toastOpacity: number;
    setToastOpacity: (value: number) => void;
    toastPosition: ToastPosition;
    setToastPosition: (position: ToastPosition) => void;
    toastTextColor: string;
    setToastTextColor: (color: string) => void;
    
    theme: 'light' | 'dark' | 'system';
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    
    isSidebarAutohide: boolean;
    setSidebarAutohide: (autohide: boolean) => void;

    isGlossy: boolean;
    setGlossy: (glossy: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

const Toast = ({ toast, onRemove, textColor }) => {
    const [isExiting, setIsExiting] = useState(false);
    const removeRef = useRef(onRemove);
    removeRef.current = onRemove;

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true);
            const removalTimer = setTimeout(() => removeRef.current(toast.id), 300);
            return () => clearTimeout(removalTimer);
        }, 5000);

        return () => clearTimeout(timer);
    }, [toast.id]);
    
    const handleRemove = () => {
        setIsExiting(true);
        setTimeout(() => onRemove(toast.id), 300);
    };

    const toastIcons = {
        success: icons.toastSuccess,
        error: icons.toastError,
        warning: icons.toastWarning,
        info: icons.toastInfo,
    };

    return html`
        <div class="toast toast-${toast.type} ${isExiting ? 'exiting' : ''}" style=${{ color: textColor }}>
            <div class="toast-icon">${toastIcons[toast.type]}</div>
            <div class="toast-message">${toast.message}</div>
            <button class="toast-close-btn" onClick=${handleRemove} title="Close">
                ${icons.close}
            </button>
        </div>
    `;
};


const ToastContainer = ({ toasts, onRemove, opacity, position, textColor }) => {
    return html`
        <div class="toast-container toast-container--${position}" style=${{ opacity }}>
            ${toasts.map(toast => html`
                <${Toast} key=${toast.id} toast=${toast} onRemove=${onRemove} textColor=${textColor} />
            `)}
        </div>
    `;
};


export const UIProvider = ({ children }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    
    // UI Settings State (loaded from DB)
    const [theme, setThemeLocal] = useState<'light' | 'dark' | 'system'>('system');
    const [isSidebarAutohide, setSidebarAutohideLocal] = useState<boolean>(false);
    const [toastOpacity, setToastOpacityLocal] = useState<number>(1);
    const [toastPosition, setToastPositionLocal] = useState<ToastPosition>('top-right');
    const [toastTextColor, setToastTextColorLocal] = useState<string>('#ffffff');
    const [isGlossy, setGlossyLocal] = useState<boolean>(false);

    // Load settings from DB on mount
    useEffect(() => {
        api.fetchSettings().then(s => {
            if (s.theme) setThemeLocal(s.theme);
            if (s.sidebarAutohide !== undefined) setSidebarAutohideLocal(s.sidebarAutohide);
            if (s.toastOpacity !== undefined) setToastOpacityLocal(s.toastOpacity);
            if (s.toastPosition) setToastPositionLocal(s.toastPosition);
            if (s.toastTextColor) setToastTextColorLocal(s.toastTextColor);
            if (s.glossyMode !== undefined) setGlossyLocal(s.glossyMode);
        }).catch(err => console.error('Failed to load UI settings:', err));
    }, []);

    // Wrapper setters that save to DB
    const setTheme = useCallback((v: 'light' | 'dark' | 'system') => { setThemeLocal(v); api.saveSetting('theme', v); }, []);
    const setSidebarAutohide = useCallback((v: boolean) => { setSidebarAutohideLocal(v); api.saveSetting('sidebarAutohide', v); }, []);
    const setToastOpacity = useCallback((v: number) => { setToastOpacityLocal(v); api.saveSetting('toastOpacity', v); }, []);
    const setToastPosition = useCallback((v: ToastPosition) => { setToastPositionLocal(v); api.saveSetting('toastPosition', v); }, []);
    const setToastTextColor = useCallback((v: string) => { setToastTextColorLocal(v); api.saveSetting('toastTextColor', v); }, []);
    const setGlossy = useCallback((v: boolean) => { setGlossyLocal(v); api.saveSetting('glossyMode', v); }, []);

    const addToast = (message: string, type: ToastType = 'info') => {
        const id = self.crypto.randomUUID();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    // Apply theme changes globally
    useEffect(() => {
        const applyTheme = () => {
            const root = document.documentElement;
            const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
            
            root.classList.toggle('dark-theme', isDark);
            root.classList.toggle('glossy-theme', isGlossy);

            setTimeout(() => {
                if ((window as any).Chart) {
                    const style = getComputedStyle(document.documentElement);
                    (window as any).Chart.defaults.color = style.getPropertyValue('--font-color').trim();
                    (window as any).Chart.defaults.borderColor = style.getPropertyValue('--border-color').trim();
                }
            }, 0);
        };

        applyTheme();
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const mediaQueryListener = () => theme === 'system' && applyTheme();
        mediaQuery.addEventListener('change', mediaQueryListener);

        return () => mediaQuery.removeEventListener('change', mediaQueryListener);
    }, [theme, isGlossy]);

    const value = {
        addToast,
        toastOpacity, setToastOpacity,
        toastPosition, setToastPosition,
        toastTextColor, setToastTextColor,
        theme, setTheme,
        isSidebarAutohide, setSidebarAutohide,
        isGlossy, setGlossy,
    };

    return html`
        <${UIContext.Provider} value=${value}>
            ${children}
            <${ToastContainer} toasts=${toasts} onRemove=${removeToast} opacity=${toastOpacity} position=${toastPosition} textColor=${toastTextColor} />
        </${UIContext.Provider}>
    `;
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};
