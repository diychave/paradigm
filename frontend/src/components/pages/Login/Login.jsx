import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/AuthContext";
import { useModal } from "@/ModalContext";
import Header from "@components/Header/Header";
import logo from "@/assets/icons/logo.png";
import LogoText from "@utils/icons/LogoText";
import "./AuthPages.css";

const Login = () => {
    const { login, isAuthenticated, loading, user } = useAuth();
    const { modalVissionToggler } = useModal();
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    if (!loading && isAuthenticated && user?.role === "student") {
        return <Navigate to="/account" replace />;
    }

    const onSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);
        try {
            await login(username.trim(), password);
            navigate("/account");
        } catch (err) {
            setError(err?.message || "Невірний логін або пароль");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="login-page">
            <Header />
            <main className="login-main">
                <div className="login-bg" aria-hidden="true" />
                <div className="login-veil" aria-hidden="true" />

                <div className="login-stage">
                    <div className="login-brand">
                        <img src={logo} alt="" className="login-brand-icon" />
                        <LogoText />
                    </div>

                    <p className="login-lead">Увійдіть, щоб бачити курси та прогрес</p>

                    <form className="login-form" onSubmit={onSubmit} noValidate>
                        <div className="login-field">
                            <label htmlFor="username">Логін</label>
                            <input
                                id="username"
                                className="input-utility"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete="username"
                                required
                            />
                        </div>

                        <div className="login-field">
                            <label htmlFor="password">Пароль</label>
                            <input
                                id="password"
                                type="password"
                                className="input-utility"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                required
                            />
                        </div>

                        {error && (
                            <p className="login-error" role="alert">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            className="button-utility btn-course step-1 login-submit"
                            disabled={submitting}
                        >
                            {submitting ? "Входимо..." : "Увійти"}
                        </button>
                    </form>

                    <p className="login-foot">
                        Немає акаунта?{" "}
                        <button type="button" className="login-foot-btn" onClick={modalVissionToggler}>
                            Залиште заявку
                        </button>
                    </p>
                </div>
            </main>
        </div>
    );
};

export default Login;
