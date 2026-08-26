import { useState } from "react";
import { useAuth } from "@/AuthContext";
import logo from "@/assets/icons/logo.png";
import LogoText from "@utils/icons/LogoText";
import "./Teacher.css";

const TeacherLogin = () => {
    const { teacherLogin } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const onSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);
        try {
            await teacherLogin(username.trim(), password);
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
                    <p className="tl-kicker">Studio</p>
                    <h1>Кабінет викладача</h1>
                    <p className="tl-copy">
                        Студенти, розклад, домашки й оцінки — в одному спокійному просторі.
                    </p>
                </section>

                <div className="tl-card">
                    <h2>Увійти</h2>
                    <p className="tl-card-lead">Лише для викладачів школи.</p>
                    <form className="tl-form" onSubmit={onSubmit} noValidate>
                        <label className="tl-field" htmlFor="teacher-username">
                            Логін
                            <input
                                id="teacher-username"
                                className="tl-input"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete="username"
                                required
                            />
                        </label>
                        <label className="tl-field" htmlFor="teacher-password">
                            Пароль
                            <input
                                id="teacher-password"
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
                            {submitting ? "Входимо..." : "Увійти до студії"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default TeacherLogin;
