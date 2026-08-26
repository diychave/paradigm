import { createContext, useCallback, useContext, useMemo, useState } from "react";

const StudioContext = createContext(null);

export const useStudio = () => {
    const value = useContext(StudioContext);
    if (!value) {
        return {
            toast: () => {},
            openDrawer: () => {},
            closeDrawer: () => {},
        };
    }
    return value;
};

export const StudioProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const [drawer, setDrawer] = useState(null);

    const toast = useCallback((message, tone = "ok") => {
        const id = `${Date.now()}-${Math.random()}`;
        setToasts((prev) => [...prev, { id, message, tone }]);
        window.setTimeout(() => {
            setToasts((prev) => prev.filter((item) => item.id !== id));
        }, 2800);
    }, []);

    const openDrawer = useCallback((next) => setDrawer(next), []);
    const closeDrawer = useCallback(() => setDrawer(null), []);

    const value = useMemo(
        () => ({ toast, openDrawer, closeDrawer, toasts, drawer }),
        [toast, openDrawer, closeDrawer, toasts, drawer]
    );

    return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
};
