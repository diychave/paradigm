import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Inbox, Phone, UserPlus } from "lucide-react";
import api from "@services/api";
import { officePeople } from "@/staffPath";
import { useStudio } from "@components/pages/Teacher/StudioContext";

const COLUMNS = [
    { id: "new", label: "Нові", hint: "Щойно з форми на сайті" },
    { id: "in_progress", label: "В процесі", hint: "Менеджер уже на звʼязку" },
    { id: "closed", label: "Закриті", hint: "Опрацьовані або відхилені" },
];

const EMPTY = { new: [], in_progress: [], closed: [] };

const formatWhen = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("uk-UA", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const phoneHref = (phone) => `tel:${String(phone || "").replace(/[^\d+]/g, "")}`;

const LeadCard = ({ lead, onOpen, onMove, onAddStudent }) => (
    <article
        className="office-lead-card"
        draggable
        onDragStart={(e) => {
            e.dataTransfer.setData("text/plain", String(lead.id));
            e.dataTransfer.effectAllowed = "move";
        }}
    >
        <button type="button" className="office-lead-main" onClick={() => onOpen(lead)}>
            <strong>{lead.name}</strong>
            <span>{formatWhen(lead.created_at)}</span>
            {lead.message ? <p>{lead.message}</p> : null}
        </button>
        <div className="office-lead-meta">
            <a href={phoneHref(lead.phone)} onClick={(e) => e.stopPropagation()}>
                <Phone size={14} /> {lead.phone}
            </a>
            {lead.status === "rejected" ? <span className="office-badge is-failed">Відхилена</span> : null}
            {lead.status === "converted" ? <span className="office-badge is-paid">Закрита</span> : null}
        </div>
        <div className="office-lead-actions">
            {lead.column === "new" && (
                <button type="button" className="studio-btn sm" onClick={() => onMove(lead, "in_progress")}>
                    В роботу
                </button>
            )}
            {lead.column === "in_progress" && (
                <>
                    <button type="button" className="studio-btn sm ghost" onClick={() => onMove(lead, "new")}>
                        Назад
                    </button>
                    <button type="button" className="studio-btn sm" onClick={() => onMove(lead, "closed")}>
                        Закрити
                    </button>
                    <button type="button" className="studio-btn sm" onClick={() => onAddStudent(lead)}>
                        <UserPlus size={14} /> Додати учня
                    </button>
                </>
            )}
            {lead.column === "closed" && (
                <button type="button" className="studio-btn sm ghost" onClick={() => onMove(lead, "in_progress")}>
                    Повернути
                </button>
            )}
        </div>
    </article>
);

const LeadDetails = ({ lead, onMove, onReject, onAddStudent }) => (
    <div className="office-lead-details">
        <p>
            <span>Телефон</span>
            <a href={phoneHref(lead.phone)}>{lead.phone}</a>
        </p>
        <p>
            <span>Надійшла</span>
            <strong>{formatWhen(lead.created_at)}</strong>
        </p>
        {lead.assigned_name ? (
            <p>
                <span>В роботі у</span>
                <strong>{lead.assigned_name}</strong>
            </p>
        ) : null}
        <p>
            <span>Повідомлення</span>
            <strong>{lead.message?.trim() || "Без коментаря"}</strong>
        </p>
        <div className="office-lead-actions">
            {lead.column !== "new" && (
                <button type="button" className="studio-btn ghost" onClick={() => onMove(lead, "new")}>
                    У нові
                </button>
            )}
            {lead.column !== "in_progress" && (
                <button type="button" className="studio-btn" onClick={() => onMove(lead, "in_progress")}>
                    В процес
                </button>
            )}
            {lead.column !== "closed" && (
                <button type="button" className="studio-btn ok" onClick={() => onMove(lead, "closed")}>
                    Закрити
                </button>
            )}
            {lead.column === "in_progress" && (
                <button type="button" className="studio-btn" onClick={() => onAddStudent(lead)}>
                    <UserPlus size={16} /> Додати учня
                </button>
            )}
            {lead.status !== "rejected" && (
                <button type="button" className="studio-btn ghost warn" onClick={() => onReject(lead)}>
                    Відхилити
                </button>
            )}
        </div>
    </div>
);

const OfficeLeads = () => {
    const navigate = useNavigate();
    const { toast, openDrawer, closeDrawer } = useStudio();
    const [board, setBoard] = useState(EMPTY);
    const [counts, setCounts] = useState({ new: 0, in_progress: 0, closed: 0 });
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(true);
    const [overColumn, setOverColumn] = useState("");

    const load = () =>
        api.office.leads().then((data) => {
            setBoard(data?.columns || EMPTY);
            setCounts(data?.counts || { new: 0, in_progress: 0, closed: 0 });
        });

    useEffect(() => {
        load()
            .catch((err) => setError(err?.message || "Не вдалося завантажити заявки"))
            .finally(() => setBusy(false));
    }, []);

    const move = async (lead, column, extra = {}) => {
        try {
            await api.office.updateLead(lead.id, { column, ...extra });
            closeDrawer();
            toast("Заявку оновлено");
            await load();
        } catch (err) {
            toast(err?.message || "Не вдалося оновити заявку", "err");
        }
    };

    const addStudent = (lead) => {
        closeDrawer();
        navigate(
            officePeople({
                add: "student",
                name: lead.name,
                phone: lead.phone,
                lead: lead.id,
            })
        );
    };

    const reject = (lead) => move(lead, "closed", { status: "rejected" });

    const openLead = (lead) =>
        openDrawer({
            title: lead.name,
            body: (
                <LeadDetails
                    lead={lead}
                    onMove={move}
                    onReject={reject}
                    onAddStudent={addStudent}
                />
            ),
        });

    const onDrop = (column, event) => {
        event.preventDefault();
        setOverColumn("");
        const id = Number(event.dataTransfer.getData("text/plain"));
        const lead = COLUMNS.flatMap((item) => board[item.id] || []).find((row) => row.id === id);
        if (!lead || lead.column === column) return;
        move(lead, column);
    };

    return (
        <div className="studio-page">
            <div className="office-toolbar">
                <div>
                    <h1>Заявки</h1>
                    <p className="studio-lead">
                        Заявки з форми на сайті. Перетягуйте картки між колонками або змінюйте статус кнопками.
                    </p>
                </div>
            </div>
            {error && <p className="studio-error">{error}</p>}
            {busy ? (
                <div className="office-leads-board">
                    <div className="studio-skel tall" />
                    <div className="studio-skel tall" />
                    <div className="studio-skel tall" />
                </div>
            ) : (
                <div className="office-leads-board">
                    {COLUMNS.map((column) => (
                        <section
                            key={column.id}
                            className={`office-leads-column${overColumn === column.id ? " is-over" : ""}`}
                            onDragOver={(e) => {
                                e.preventDefault();
                                setOverColumn(column.id);
                            }}
                            onDragLeave={() => setOverColumn("")}
                            onDrop={(e) => onDrop(column.id, e)}
                        >
                            <header>
                                <div>
                                    <h2>{column.label}</h2>
                                    <p>{column.hint}</p>
                                </div>
                                <span>{counts[column.id] || 0}</span>
                            </header>
                            {(board[column.id] || []).length === 0 ? (
                                <div className="studio-empty office-leads-empty">
                                    <Inbox size={22} />
                                    <p>Поки порожньо</p>
                                </div>
                            ) : (
                                (board[column.id] || []).map((lead) => (
                                    <LeadCard
                                        key={lead.id}
                                        lead={lead}
                                        onOpen={openLead}
                                        onMove={move}
                                        onAddStudent={addStudent}
                                    />
                                ))
                            )}
                        </section>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OfficeLeads;
