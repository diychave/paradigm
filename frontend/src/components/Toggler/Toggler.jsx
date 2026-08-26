import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import "./Toggler.css";

const THEME_KEY = "theme";

const getInitialTheme = () => {
    if (typeof window === "undefined") return "dark";
    return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
};

const Toggler = () => {
    const [theme, setTheme] = useState(getInitialTheme);
    const isDark = theme === "dark";

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem(THEME_KEY, theme);
    }, [theme]);

    useEffect(() => {
        const sync = () => setTheme(getInitialTheme());
        window.addEventListener("paradigm-theme", sync);
        window.addEventListener("storage", sync);
        return () => {
            window.removeEventListener("paradigm-theme", sync);
            window.removeEventListener("storage", sync);
        };
    }, []);

    const toggleTheme = () => {
        setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    };

    return (
        <button
            type="button"
            role="switch"
            aria-checked={isDark}
            aria-label={isDark ? "Увімкнути світлу тему" : "Увімкнути темну тему"}
            onClick={toggleTheme}
            className="theme-toggle"
        >
            <span className="theme-toggle-icon theme-toggle-icon-sun">
                <Sun size={16} strokeWidth={2.4} />
            </span>

            <span className="theme-toggle-icon theme-toggle-icon-moon">
                <Moon size={15} strokeWidth={2.4} />
            </span>

            <span className="theme-toggle-knob">
                {isDark ? (
                    <Moon size={14} strokeWidth={2.4} color="#15161a" />
                ) : (
                    <Sun size={15} strokeWidth={2.4} color="#ffffff" />
                )}
            </span>
        </button>
    );
};

export default Toggler;
