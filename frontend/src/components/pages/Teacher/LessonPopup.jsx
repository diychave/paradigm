import { Ban, CheckCircle2, HandCoins, Undo2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { teacherStudent } from "@/teacherPath";
import { formatHumanDate, formatTime } from "./studioUtils";

const STATUS_COPY = {
    planned: "У плані",
    held: "Відмічено як проведене",
    cancelled: "Скасовано",
    compensated: "Скасовано з компенсацією",
    teacher_fault: "Скасовано з компенсацією",
};

const LessonPopup = ({ slot, date, onClose, onSetStatus, onRestore, busy }) => {
    if (!slot || !date) return null;
    const status = slot.occurrenceStatus || "planned";
    const isCompensated = status === "compensated" || status === "teacher_fault";

    return (
        <div className="studio-modal-root">
            <button type="button" className="studio-backdrop" onClick={onClose} aria-label="Закрити" />
            <div className="studio-modal" role="dialog" aria-labelledby="lesson-popup-title">
                <header>
                    <div>
                        <p className="studio-kicker">{formatHumanDate(date)}</p>
                        <h3 id="lesson-popup-title">
                            {formatTime(slot.start_time)} · {slot.short_title}
                        </h3>
                        <p className="studio-muted">{slot.student_name}</p>
                    </div>
                    <button type="button" className="studio-icon-btn" onClick={onClose} aria-label="Закрити">
                        <X size={18} />
                    </button>
                </header>
                <p className={`studio-pill is-${isCompensated ? "compensated" : status === "planned" ? "none" : status}`}>
                    {STATUS_COPY[status] || STATUS_COPY.planned}
                </p>
                <div className="studio-modal-actions">
                    {slot.student_id ? (
                        <Link to={teacherStudent(slot.student_id)} className="studio-btn ghost" onClick={onClose}>
                            Картка студента
                        </Link>
                    ) : null}
                    <button
                        type="button"
                        className="studio-btn ok"
                        disabled={busy || status === "held"}
                        onClick={() => onSetStatus("held")}
                    >
                        <CheckCircle2 size={16} /> Відмітити заняття
                    </button>
                    <button
                        type="button"
                        className="studio-btn ghost warn"
                        disabled={busy || status === "cancelled"}
                        onClick={() => onSetStatus("cancelled")}
                    >
                        <Ban size={16} /> Скасувати
                    </button>
                    <button
                        type="button"
                        className="studio-btn ghost warn"
                        disabled={busy || isCompensated}
                        onClick={() => onSetStatus("compensated")}
                    >
                        <HandCoins size={16} /> Скасувати з компенсацією
                    </button>
                    {status !== "planned" && (
                        <button
                            type="button"
                            className="studio-btn ghost"
                            disabled={busy}
                            onClick={onRestore}
                        >
                            <Undo2 size={16} /> Повернути в план
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LessonPopup;
