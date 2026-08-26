import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/AuthContext";
import CloseIcon from "@utils/icons/CloseIcon";
import api from "@services/api";
import StudentPage from "./StudentPage";
import useCabinetSync from "@/hooks/useCabinetSync";
import "../Login/AuthPages.css";
import "./StudentPage.css";
import "./Dashboard.css";

const initialsOf = (user) =>
    (user?.display_name || user?.username || "?")
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

const Dashboard = () => {
    const { user, loading, isAuthenticated, updateProfile, uploadAvatar } = useAuth();
    const avatarInputRef = useRef(null);
    const modalTitleId = useId();
    const [avatarBusy, setAvatarBusy] = useState(false);
    const [enrollments, setEnrollments] = useState([]);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");
    const [formSuccess, setFormSuccess] = useState("");
    const [form, setForm] = useState({
        username: "",
        email: "",
        phone: "",
    });

    useEffect(() => {
        if (!user || user.role !== "student") return;
        let cancelled = false;
        const load = () => {
            api.learning
                .getMyEnrollments()
                .then((data) => {
                    if (!cancelled) setEnrollments(Array.isArray(data) ? data : []);
                })
                .catch(() => {
                    if (!cancelled) setEnrollments([]);
                });
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [user]);

    useCabinetSync(() => {
        if (!user || user.role !== "student") return;
        api.learning
            .getMyEnrollments()
            .then((data) => setEnrollments(Array.isArray(data) ? data : []))
            .catch(() => {});
    }, Boolean(user && user.role === "student"));

    useEffect(() => {
        if (!user) return;
        setForm({
            username: user.username || "",
            email: user.email || "",
            phone: user.phone || "",
        });
    }, [user]);

    useEffect(() => {
        if (!editing) return undefined;
        const onKey = (e) => {
            if (e.key === "Escape" && !saving && !avatarBusy) setEditing(false);
        };
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", onKey);
        };
    }, [editing, saving, avatarBusy]);

    const stats = useMemo(() => {
        const courses = enrollments.length;
        const avg =
            courses > 0
                ? Math.round(
                      enrollments.reduce((sum, e) => sum + (e.progress_percent || 0), 0) /
                          courses
                  )
                : 0;
        const done = enrollments.reduce((sum, e) => sum + (e.done_count || 0), 0);
        return { courses, avg, done };
    }, [enrollments]);

    if (loading) {
        return (
            <StudentPage title="Головна">
                <p className="p-small-secondary">Завантаження...</p>
            </StudentPage>
        );
    }

    if (!isAuthenticated || user?.role !== "student") return <Navigate to="/login" replace />;

    const startEdit = () => {
        setFormError("");
        setFormSuccess("");
        setEditing(true);
    };

    const cancelEdit = () => {
        if (saving || avatarBusy) return;
        setEditing(false);
        setFormError("");
        setForm({
            username: user.username || "",
            email: user.email || "",
            phone: user.phone || "",
        });
    };

    const onSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setFormError("");
        setFormSuccess("");
        try {
            await updateProfile({
                username: form.username.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
            });
            setEditing(false);
            setFormSuccess("Дані збережено");
        } catch (err) {
            setFormError(err?.message || "Не вдалося зберегти");
        } finally {
            setSaving(false);
        }
    };

    const onAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        setAvatarBusy(true);
        setFormError("");
        try {
            await uploadAvatar(file);
        } catch (err) {
            setFormError(err?.message || "Не вдалося оновити фото");
        } finally {
            setAvatarBusy(false);
        }
    };

    const fullName =
        [user.first_name, user.last_name].filter(Boolean).join(" ") ||
        user.display_name ||
        user.username;

    return (
        <StudentPage
            title="Головна"
            description="Ваш кабінет: профіль і курси."
        >
            <div className="dash">
                <section className="dash-profile">
                    <div className="dash-profile-main">
                        <div className={`dash-avatar${user.avatar ? " has-photo" : ""}`}>
                            {user.avatar ? (
                                <img src={user.avatar} alt="" />
                            ) : (
                                <span>{initialsOf(user)}</span>
                            )}
                        </div>
                        <div className="dash-profile-copy">
                            <h2 className="dash-name">{fullName}</h2>
                            <p className="dash-login">@{user.username}</p>
                        </div>
                    </div>

                    <div className="dash-stats">
                        <div className="dash-stat">
                            <strong>{stats.courses}</strong>
                            <span>курсів</span>
                        </div>
                        <div className="dash-stat">
                            <strong>{stats.avg}%</strong>
                            <span>середній прогрес</span>
                        </div>
                        <div className="dash-stat">
                            <strong>{stats.done}</strong>
                            <span>тем пройдено</span>
                        </div>
                    </div>
                </section>

                <section className="dash-info">
                    <div className="dash-info-head">
                        <h3>Особисті дані</h3>
                        {!editing && (
                            <button type="button" className="dash-edit-btn" onClick={startEdit}>
                                Редагувати
                            </button>
                        )}
                    </div>

                    {formSuccess && !editing && (
                        <p className="dash-success">{formSuccess}</p>
                    )}
                    {formError && !editing && (
                        <p className="auth-error">{formError}</p>
                    )}

                    {!editing && (
                        <dl className="dash-fields">
                            <div>
                                <dt>Імʼя</dt>
                                <dd>{user.first_name || "—"}</dd>
                            </div>
                            <div>
                                <dt>Прізвище</dt>
                                <dd>{user.last_name || "—"}</dd>
                            </div>
                            <div>
                                <dt>Логін</dt>
                                <dd>{user.username || "—"}</dd>
                            </div>
                            <div>
                                <dt>Email</dt>
                                <dd>{user.email || "—"}</dd>
                            </div>
                            <div>
                                <dt>Телефон</dt>
                                <dd>{user.phone || "—"}</dd>
                            </div>
                        </dl>
                    )}
                </section>

                {editing &&
                    createPortal(
                        <div
                            className="dash-modal-root"
                            onClick={(e) => {
                                if (e.target === e.currentTarget && !saving && !avatarBusy) {
                                    cancelEdit();
                                }
                            }}
                        >
                            <div
                                className="dash-modal"
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby={modalTitleId}
                            >
                                <div className="dash-modal-top">
                                    <h2 id={modalTitleId}>Редагування профілю</h2>
                                    <button
                                        type="button"
                                        className="dash-modal-close"
                                        onClick={cancelEdit}
                                        disabled={saving || avatarBusy}
                                        aria-label="Закрити"
                                    >
                                        <CloseIcon />
                                    </button>
                                </div>

                                <div className="dash-modal-avatar-block">
                                    <div className="dash-modal-avatar-wrap">
                                        <button
                                            type="button"
                                            className={`dash-modal-avatar${user.avatar ? " has-photo" : ""}`}
                                            onClick={() => avatarInputRef.current?.click()}
                                            disabled={avatarBusy}
                                            aria-label="Завантажити фото профілю"
                                        >
                                            {user.avatar ? (
                                                <img src={user.avatar} alt="" />
                                            ) : (
                                                <span>{initialsOf(user)}</span>
                                            )}
                                        </button>
                                    </div>
                                    <input
                                        ref={avatarInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/gif"
                                        className="dash-avatar-file-input"
                                        tabIndex={-1}
                                        aria-hidden="true"
                                        onChange={onAvatarChange}
                                    />
                                    <div className="dash-modal-avatar-copy">
                                        <p>Фото профілю</p>
                                        <span className="dash-modal-upload-hint">JPG, PNG, WEBP, GIF · до 5 МБ</span>
                                        <button
                                            type="button"
                                            className="dash-modal-upload-btn"
                                            onClick={() => avatarInputRef.current?.click()}
                                            disabled={avatarBusy}
                                        >
                                            {avatarBusy ? "Завантаження..." : "Завантажити фото"}
                                        </button>
                                    </div>
                                </div>

                                <form className="dash-form dash-modal-form" onSubmit={onSave}>
                                    <p className="dash-form-note">
                                        Імʼя та прізвище змінити не можна — зверніться до менеджера.
                                    </p>

                                    <div className="dash-form-row">
                                        <label>
                                            Імʼя
                                            <input value={user.first_name || ""} disabled readOnly />
                                        </label>
                                        <label>
                                            Прізвище
                                            <input value={user.last_name || ""} disabled readOnly />
                                        </label>
                                    </div>

                                    <label>
                                        Логін
                                        <input
                                            value={form.username}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    username: e.target.value,
                                                }))
                                            }
                                            required
                                            autoComplete="username"
                                        />
                                    </label>

                                    <label>
                                        Email
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    email: e.target.value,
                                                }))
                                            }
                                            autoComplete="email"
                                        />
                                    </label>

                                    <label>
                                        Телефон
                                        <input
                                            type="tel"
                                            value={form.phone}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    phone: e.target.value,
                                                }))
                                            }
                                            autoComplete="tel"
                                            placeholder="+380..."
                                        />
                                    </label>

                                    {formError && <p className="auth-error">{formError}</p>}

                                    <div className="dash-form-actions">
                                        <button
                                            type="button"
                                            className="dash-btn-secondary"
                                            onClick={cancelEdit}
                                            disabled={saving || avatarBusy}
                                        >
                                            Скасувати
                                        </button>
                                        <button
                                            type="submit"
                                            className="dash-btn-primary"
                                            disabled={saving || avatarBusy}
                                        >
                                            {saving ? "Збереження..." : "Зберегти"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>,
                        document.body
                    )}

                {enrollments.length > 0 && (
                    <section className="dash-courses">
                        <div className="dash-info-head">
                            <h3>Активні курси</h3>
                            <Link to="/account/courses" className="dash-edit-btn">
                                Усі курси
                            </Link>
                        </div>
                        <ul className="dash-course-list">
                            {enrollments.slice(0, 3).map((course) => (
                                <li key={course.id}>
                                    <Link to={`/account/courses/${course.course_id}`}>
                                        <span>
                                            <strong>{course.course_title}</strong>
                                            <em>
                                                {course.done_count}/{course.total_count} ·{" "}
                                                {course.progress_percent}%
                                            </em>
                                        </span>
                                        <span className="dash-course-bar" aria-hidden="true">
                                            <i style={{ width: `${course.progress_percent || 0}%` }} />
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </div>
        </StudentPage>
    );
};

export default Dashboard;
