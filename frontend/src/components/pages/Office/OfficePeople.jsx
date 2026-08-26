import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Copy, KeyRound, Mail, Phone, Plus, UserRound, X } from "lucide-react";
import { useAuth } from "@/AuthContext";
import api from "@services/api";
import { useStudio } from "@components/pages/Teacher/StudioContext";
import { initialsOf } from "@components/pages/Teacher/studioUtils";

const ROLE_TABS = [
    { id: "student", label: "Студенти" },
    { id: "teacher", label: "Викладачі" },
    { id: "manager", label: "Менеджери" },
    { id: "archived", label: "Архів" },
];

const ROLE_LABEL = {
    student: "Студент",
    teacher: "Викладач",
    manager: "Менеджер",
};

const formatJoined = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" });
};

const CopyRow = ({ label, Icon, value }) => {
    const [copied, setCopied] = useState(false);
    const text = value || "";
    return (
        <div className="office-cred-row">
            <dt>
                <Icon size={14} /> {label}
            </dt>
            <dd>
                <span>{text || "—"}</span>
                {text ? (
                    <button
                        type="button"
                        onClick={async () => {
                            try {
                                await navigator.clipboard.writeText(text);
                                setCopied(true);
                                window.setTimeout(() => setCopied(false), 1200);
                            } catch {
                                setCopied(false);
                            }
                        }}
                    >
                        {copied ? "Скопійовано" : <Copy size={14} />}
                    </button>
                ) : null}
            </dd>
        </div>
    );
};

const PersonPopup = ({ person, onClose, onToggleArchive }) => {
    useEffect(() => {
        const onKey = (event) => {
            if (event.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    if (!person) return null;
    const courses = person.courses || [];

    return (
        <div className="studio-modal-root">
            <button type="button" className="studio-backdrop" onClick={onClose} aria-label="Закрити" />
            <div className="studio-modal office-person-modal" role="dialog" aria-labelledby="person-popup-title">
                <header>
                    <div className="office-person-head">
                        <span className="studio-avatar lg">
                            {person.avatar ? <img src={person.avatar} alt="" /> : initialsOf(person.display_name)}
                        </span>
                        <div>
                            <h3 id="person-popup-title">{person.display_name || person.username}</h3>
                            <p className="studio-muted">@{person.username}</p>
                            <span className="office-badge">{ROLE_LABEL[person.role] || person.role}</span>
                            {person.is_archived ? (
                                <span className="office-badge is-off">В архіві</span>
                            ) : (
                                <span className={`office-badge${person.is_active === false ? " is-off" : " is-paid"}`}>
                                    {person.is_active === false ? "Неактивний" : "Активний"}
                                </span>
                            )}
                        </div>
                    </div>
                    <button type="button" className="studio-icon-btn" onClick={onClose} aria-label="Закрити">
                        <X size={18} />
                    </button>
                </header>
                <div className="office-person-creds">
                    <p>Дані для входу</p>
                    <dl>
                        <CopyRow label="Логін" Icon={UserRound} value={person.username} />
                        <CopyRow label="Пароль" Icon={KeyRound} value={person.password} />
                    </dl>
                </div>
                <dl className="office-person-facts">
                    <div>
                        <dt>
                            <Mail size={14} /> Email
                        </dt>
                        <dd>{person.email || "—"}</dd>
                    </div>
                    <div>
                        <dt>
                            <Phone size={14} /> Телефон
                        </dt>
                        <dd>{person.phone || "—"}</dd>
                    </div>
                    <div>
                        <dt>У системі з</dt>
                        <dd>{formatJoined(person.date_joined)}</dd>
                    </div>
                </dl>
                <div className="office-person-courses">
                    <p>Курси</p>
                    {courses.length === 0 ? (
                        <span className="studio-muted">Поки немає доступів</span>
                    ) : (
                        <ul>
                            {courses.map((course) => (
                                <li key={course.id}>
                                    <strong>{course.title}</strong>
                                    {course.teacher_name ? <span>{course.teacher_name}</span> : null}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="studio-modal-actions">
                    {person.role === "student" || person.role === "teacher" ? (
                        <button
                            type="button"
                            className={person.is_archived ? "studio-btn" : "studio-btn ghost warn"}
                            onClick={onToggleArchive}
                        >
                            {person.is_archived ? "Повернути з архіву" : "Перемістити в архів"}
                        </button>
                    ) : null}
                    <button type="button" className="studio-btn ghost" onClick={onClose}>
                        Закрити
                    </button>
                </div>
            </div>
        </div>
    );
};

const splitName = (value) => {
    const parts = String(value || "").trim().split(/\s+/).filter(Boolean);
    return {
        firstName: parts[0] || "",
        lastName: parts.slice(1).join(" "),
    };
};

const PersonForm = ({ role, canManagers, onSubmit, initial = {}, lockRole = false }) => {
    const [firstName, setFirstName] = useState(initial.firstName || "");
    const [lastName, setLastName] = useState(initial.lastName || "");
    const [username, setUsername] = useState(initial.username || "");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState(initial.email || "");
    const [phone, setPhone] = useState(initial.phone || "");
    const [nextRole, setNextRole] = useState(initial.role || role);
    return (
        <form
            className="studio-form"
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit({
                    first_name: firstName,
                    last_name: lastName,
                    username,
                    password,
                    email,
                    phone,
                    role: nextRole,
                });
            }}
        >
            <label>
                Роль
                <select
                    value={nextRole}
                    onChange={(e) => setNextRole(e.target.value)}
                    disabled={lockRole}
                >
                    <option value="student">Студент</option>
                    <option value="teacher">Викладач</option>
                    {canManagers && <option value="manager">Менеджер</option>}
                </select>
            </label>
            <label>
                Ім’я
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </label>
            <label>
                Прізвище
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </label>
            <label>
                Логін
                <input value={username} onChange={(e) => setUsername(e.target.value)} required />
            </label>
            <label>
                Пароль
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </label>
            <label>
                Email
                <input value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label>
                Телефон
                <input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
            <button type="submit" className="studio-btn">
                Створити акаунт
            </button>
        </form>
    );
};

const OfficePeople = () => {
    const { isAdmin } = useAuth();
    const { toast, openDrawer, closeDrawer } = useStudio();
    const [searchParams, setSearchParams] = useSearchParams();
    const [tab, setTab] = useState("student");
    const [people, setPeople] = useState([]);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(true);
    const [selected, setSelected] = useState(null);
    const leadIdRef = useRef("");

    const tabs = useMemo(
        () => ROLE_TABS.filter((item) => item.id !== "manager" || isAdmin),
        [isAdmin]
    );

    const load = (role = tab) =>
        api.office.people(role).then((list) => setPeople(Array.isArray(list) ? list : []));

    const openCreateDrawer = (options = {}) => {
        const role = options.role || "student";
        openDrawer({
            title: role === "student" ? "Новий учень" : "Новий акаунт",
            body: (
                <PersonForm
                    role={role}
                    canManagers={isAdmin}
                    lockRole={Boolean(options.lockRole)}
                    initial={options.initial || {}}
                    onSubmit={create}
                />
            ),
        });
    };

    useEffect(() => {
        setBusy(true);
        load(tab)
            .catch((err) => setError(err?.message || "Не вдалося завантажити"))
            .finally(() => setBusy(false));
    }, [tab]);

    useEffect(() => {
        if (searchParams.get("add") !== "student") return;
        const name = searchParams.get("name") || "";
        const parsed = splitName(name);
        leadIdRef.current = searchParams.get("lead") || "";
        setTab("student");
        openCreateDrawer({
            role: "student",
            lockRole: true,
            initial: {
                firstName: parsed.firstName,
                lastName: parsed.lastName,
                phone: searchParams.get("phone") || "",
            },
        });
        setSearchParams({}, { replace: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps -- open once from query
    }, []);

    const create = async (payload) => {
        try {
            await api.office.createPerson(payload);
            const leadId = leadIdRef.current;
            if (leadId) {
                try {
                    await api.office.updateLead(leadId, { column: "closed" });
                } catch {
                    // account is created even if the lead cannot be closed
                }
                leadIdRef.current = "";
            }
            closeDrawer();
            toast("Акаунт створено");
            if (payload.role === tab) await load(tab);
            else setTab(payload.role);
        } catch (err) {
            toast(err?.message || "Не вдалося створити", "err");
        }
    };

    const openPerson = async (person) => {
        setSelected(person);
        try {
            const detail = await api.office.person(person.id);
            setSelected(detail);
        } catch (err) {
            toast(err?.message || "Не вдалося відкрити картку", "err");
        }
    };

    const toggleArchive = async () => {
        if (!selected) return;
        const next = !selected.is_archived;
        const ok = window.confirm(
            next
                ? "Перемістити в архів? Акаунт не зможе увійти, поки його не повернуть."
                : "Повернути з архіву? Акаунт знову зможе увійти."
        );
        if (!ok) return;
        try {
            await api.office.updatePerson(selected.id, { is_archived: next });
            setSelected(null);
            toast(next ? "Переміщено в архів" : "Повернуто з архіву");
            await load(tab);
        } catch (err) {
            toast(err?.message || "Не вдалося змінити архів", "err");
        }
    };

    return (
        <div className="studio-page">
            <div className="office-toolbar">
                <div>
                    <h1>Люди</h1>
                    <p className="studio-lead">
                        {isAdmin
                            ? "Створюйте студентів, викладачів і менеджерів."
                            : "Створюйте акаунти дітей і викладачів."}
                    </p>
                </div>
                <button
                    type="button"
                    className="studio-btn"
                    onClick={() =>
                        openCreateDrawer({
                            role:
                                tab === "archived" || (tab === "manager" && !isAdmin)
                                    ? "student"
                                    : tab,
                        })
                    }
                >
                    <Plus size={16} /> Новий акаунт
                </button>
            </div>
            <div className="studio-tabs">
                {tabs.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        className={tab === item.id ? "is-active" : ""}
                        onClick={() => setTab(item.id)}
                    >
                        {item.label}
                    </button>
                ))}
            </div>
            {error && <p className="studio-error">{error}</p>}
            {busy ? (
                <div className="studio-skel tall" />
            ) : people.length === 0 ? (
                <div className="studio-empty">
                    <p>{tab === "archived" ? "Архів порожній" : "Поки що немає акаунтів у цій ролі"}</p>
                </div>
            ) : (
                <div className="studio-table-wrap">
                    <table className="studio-table">
                        <thead>
                            <tr>
                                <th>Ім’я</th>
                                <th>Логін</th>
                                <th>Контакт</th>
                                <th>Роль</th>
                            </tr>
                        </thead>
                        <tbody>
                            {people.map((person) => (
                                <tr key={person.id} onClick={() => openPerson(person)}>
                                    <td>{person.display_name}</td>
                                    <td>{person.username}</td>
                                    <td>{person.email || person.phone || "—"}</td>
                                    <td>
                                        <span className="office-badge">{ROLE_LABEL[person.role]}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {selected && (
                <PersonPopup
                    person={selected}
                    onClose={() => setSelected(null)}
                    onToggleArchive={toggleArchive}
                />
            )}
        </div>
    );
};

export default OfficePeople;
