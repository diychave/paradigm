import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "@/AuthContext";
import api from "@services/api";
import { useStudio } from "@components/pages/Teacher/StudioContext";

const STATUS_OPTIONS = [
    { id: "pending", label: "Очікує" },
    { id: "paid", label: "Оплачено" },
    { id: "failed", label: "Помилка" },
    { id: "refunded", label: "Повернено" },
];

const money = (value) => `${Number(value || 0).toLocaleString("uk-UA")} ₴`;

const formatWhen = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("uk-UA", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};

const TransactionForm = ({ lookups, initial, onSubmit, submitLabel }) => {
    const [studentId, setStudentId] = useState(initial.student_id || lookups.students[0]?.id || "");
    const [courseId, setCourseId] = useState(initial.course_id || "");
    const [amount, setAmount] = useState(initial.amount || "");
    const [status, setStatus] = useState(initial.status || "paid");
    const [note, setNote] = useState(initial.note || "");
    return (
        <form
            className="studio-form"
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit({
                    student_id: Number(studentId),
                    course_id: courseId || null,
                    amount: Number(amount),
                    status,
                    note,
                });
            }}
        >
            <label>
                Студент
                <select value={studentId} onChange={(e) => setStudentId(e.target.value)} required>
                    {lookups.students.map((item) => (
                        <option key={item.id} value={item.id}>
                            {item.display_name}
                        </option>
                    ))}
                </select>
            </label>
            <label>
                Курс
                <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                    <option value="">Без курсу</option>
                    {lookups.courses.map((item) => (
                        <option key={item.id} value={item.id}>
                            {item.title}
                        </option>
                    ))}
                </select>
            </label>
            <label>
                Сума, ₴
                <input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                />
            </label>
            <label>
                Статус
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    {STATUS_OPTIONS.map((item) => (
                        <option key={item.id} value={item.id}>
                            {item.label}
                        </option>
                    ))}
                </select>
            </label>
            <label>
                Коментар
                <input value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
            <button type="submit" className="studio-btn">
                {submitLabel}
            </button>
        </form>
    );
};

const OfficeTransactions = () => {
    const { isAdmin } = useAuth();
    const { toast, openDrawer, closeDrawer } = useStudio();
    const [rows, setRows] = useState([]);
    const [lookups, setLookups] = useState({ students: [], courses: [] });
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(true);

    const load = () =>
        Promise.all([api.office.transactions(), api.office.lookups()]).then(([list, nextLookups]) => {
            setRows(Array.isArray(list) ? list : []);
            setLookups(nextLookups || { students: [], courses: [] });
        });

    useEffect(() => {
        load()
            .catch((err) => setError(err?.message || "Не вдалося завантажити"))
            .finally(() => setBusy(false));
    }, []);

    const create = async (payload) => {
        try {
            await api.office.createTransaction(payload);
            closeDrawer();
            toast("Транзакцію додано");
            await load();
        } catch (err) {
            toast(err?.message || "Не вдалося зберегти", "err");
        }
    };

    const update = async (id, payload) => {
        try {
            await api.office.updateTransaction(id, payload);
            closeDrawer();
            toast("Транзакцію оновлено");
            await load();
        } catch (err) {
            toast(err?.message || "Не вдалося оновити", "err");
        }
    };

    const remove = async (row) => {
        if (!window.confirm("Видалити транзакцію?")) return;
        try {
            await api.office.deleteTransaction(row.id);
            toast("Транзакцію видалено");
            await load();
        } catch (err) {
            toast(err?.message || "Не вдалося видалити", "err");
        }
    };

    return (
        <div className="studio-page">
            <div className="office-toolbar">
                <div>
                    <h1>Транзакції</h1>
                    <p className="studio-lead">
                        {isAdmin
                            ? "Супер-адмін може додавати, змінювати й видаляти платежі."
                            : "Менеджер бачить платежі, але не змінює їх."}
                    </p>
                </div>
                {isAdmin && (
                    <button
                        type="button"
                        className="studio-btn"
                        onClick={() =>
                            openDrawer({
                                title: "Нова транзакція",
                                body: (
                                    <TransactionForm
                                        lookups={lookups}
                                        initial={{}}
                                        onSubmit={create}
                                        submitLabel="Зберегти"
                                    />
                                ),
                            })
                        }
                    >
                        <Plus size={16} /> Нова транзакція
                    </button>
                )}
            </div>
            {error && <p className="studio-error">{error}</p>}
            {busy ? (
                <div className="studio-skel tall" />
            ) : rows.length === 0 ? (
                <div className="studio-empty">
                    <p>Транзакцій поки немає</p>
                </div>
            ) : (
                <div className="studio-table-wrap">
                    <table className="studio-table">
                        <thead>
                            <tr>
                                <th>Дата</th>
                                <th>Студент</th>
                                <th>Курс</th>
                                <th>Сума</th>
                                <th>Статус</th>
                                {isAdmin && <th />}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.id}>
                                    <td>{formatWhen(row.created_at)}</td>
                                    <td>{row.student_name}</td>
                                    <td>{row.course_title || "—"}</td>
                                    <td>{money(row.amount)}</td>
                                    <td>
                                        <span className={`office-badge is-${row.status}`}>{row.status_label}</span>
                                    </td>
                                    {isAdmin && (
                                        <td>
                                            <button
                                                type="button"
                                                className="studio-link"
                                                onClick={() =>
                                                    openDrawer({
                                                        title: "Редагувати транзакцію",
                                                        body: (
                                                            <TransactionForm
                                                                lookups={lookups}
                                                                initial={row}
                                                                onSubmit={(payload) => update(row.id, payload)}
                                                                submitLabel="Оновити"
                                                            />
                                                        ),
                                                    })
                                                }
                                            >
                                                Змінити
                                            </button>
                                            {" · "}
                                            <button type="button" className="studio-link" onClick={() => remove(row)}>
                                                Видалити
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default OfficeTransactions;
