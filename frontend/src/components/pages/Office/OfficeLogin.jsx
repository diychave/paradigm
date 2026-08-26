import { useState } from "react";
import { useAuth } from "@/AuthContext";
import logo from "@/assets/icons/logo.png";
import LogoText from "@utils/icons/LogoText";
import "@components/pages/Teacher/Teacher.css";

const OfficeLogin = () => {
    const { staffLogin } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const onSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);
        try {
            await staffLogin(username.trim(), password);
        } catch (err) {
            setError(err?.message || "Невірний логін або пароль");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="tl">
            <div className="tl-bg" aria-hidden="true" />
            <div className="tl-veil" aria-hidden="true" />

            <div className="tl-layout">
                <section className="tl-intro">
                    <div className="tl-brand">
                        <img src={logo} alt="" />
                        <LogoText />
                    </div>
                    <p className="tl-kicker">Office</p>
                    <h1>Кабінет менеджера</h1>
                    <p className="tl-copy">
                        Курси, акаунти, розклад і платежі — права залежать від логіну.
                    </p>
                </section>

                <div className="tl-card">
                    <h2>Увійти</h2>
                    <p className="tl-card-lead">Лише для менеджерів і супер-адміна школи.</p>
                    <form className="tl-form" onSubmit={onSubmit} noValidate>
                        <label className="tl-field" htmlFor="office-username">
                            Логін
                            <input
                                id="office-username"
                                className="tl-input"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete="username"
                                required
                            />
                        </label>
                        <label className="tl-field" htmlFor="office-password">
                            Пароль
                            <input
                                id="office-password"
                                className="tl-input"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                required
                            />
                        </label>
                        {error && (
                            <p className="teacher-error" role="alert">
                                {error}
                            </p>
                        )}
                        <button type="submit" className="tl-submit" disabled={submitting}>
                            {submitting ? "Входимо..." : "Увійти до офісу"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default OfficeLogin;
