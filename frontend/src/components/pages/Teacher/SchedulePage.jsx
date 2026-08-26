import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import api from "@services/api";
import { useStudio } from "./StudioContext";
import LessonPopup from "./LessonPopup";
import {
    MONTHS,
    WEEKDAYS,
    addDays,
    formatTime,
    mondayOf,
    occurrencesOn,
    toISODate,
} from "./studioUtils";

const SchedulePage = () => {
    const { toast } = useStudio();
    const [mode, setMode] = useState("week");
    const [anchor, setAnchor] = useState(() => new Date());
    const [schedule, setSchedule] = useState({ slots: [], exceptions: [] });
    const [selected, setSelected] = useState(null);
    const [acting, setActing] = useState(false);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(true);

    const load = () =>
        api.learning
            .teacherSchedule()
            .then((data) => setSchedule(data || { slots: [], exceptions: [] }));

    useEffect(() => {
        load()
            .catch((err) => setError(err?.message || "Не вдалося завантажити"))
            .finally(() => setBusy(false));
    }, []);

    const weekStart = mondayOf(anchor);
    const weekDays = useMemo(
        () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
        [weekStart]
    );
    const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const gridStart = mondayOf(monthStart);
    const monthDays = useMemo(
        () => Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)),
        [gridStart]
    );

    const shift = (dir) => {
        const next = new Date(anchor);
        if (mode === "week") next.setDate(next.getDate() + dir * 7);
        else next.setMonth(next.getMonth() + dir);
        setAnchor(next);
    };

    const openLesson = (slot, date) => setSelected({ slot, date });

    const applyStatus = async (status) => {
        if (!selected) return;
        setActing(true);
        try {
            await api.learning.teacherSetLessonStatus(selected.slot.id, selected.date, status);
            toast(
                status === "held"
                    ? "Заняття відмічено"
                    : status === "compensated" || status === "teacher_fault"
                      ? "Скасовано з компенсацією"
                      : "Заняття скасовано"
            );
            await load();
            setSelected(null);
        } catch (err) {
            toast(err?.message || "Не вдалося оновити", "err");
        } finally {
            setActing(false);
        }
    };

    const restore = async () => {
        if (!selected?.slot.exception?.id) return;
        setActing(true);
        try {
            await api.learning.teacherRestoreLesson(selected.slot.exception.id);
            toast("Заняття повернуто в план");
            await load();
            setSelected(null);
        } catch (err) {
            toast(err?.message || "Не вдалося повернути", "err");
        } finally {
            setActing(false);
        }
    };

    const eventButton = (slot, day, compact = false) => (
        <button
            key={slot.id}
            type="button"
            className={`studio-cal-event${compact ? " sm" : ""} is-${slot.occurrenceStatus}`}
            onClick={() => openLesson(slot, toISODate(day))}
        >
            {compact ? (
                <>
                    {formatTime(slot.start_time)} {slot.short_title}
                </>
            ) : (
                <>
                    <strong>{formatTime(slot.start_time)}</strong>
                    <span>{slot.short_title}</span>
                    <em>{slot.student_name}</em>
                </>
            )}
        </button>
    );

    return (
        <div className="studio-page">
            <header className="studio-cal-head">
                <div>
                    <h1>Розклад</h1>
                    <p className="studio-lead">
                        {mode === "week"
                            ? `${weekDays[0].getDate()} – ${weekDays[6].getDate()} ${MONTHS[weekDays[6].getMonth()]}`
                            : `${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`}
                    </p>
                </div>
                <div className="studio-cal-tools">
                    <div className="studio-seg">
                        <button type="button" className={mode === "week" ? "is-done" : ""} onClick={() => setMode("week")}>
                            Тиждень
                        </button>
                        <button type="button" className={mode === "month" ? "is-done" : ""} onClick={() => setMode("month")}>
                            Місяць
                        </button>
                    </div>
                    <button type="button" className="studio-icon-btn" onClick={() => shift(-1)} aria-label="Назад">
                        <ChevronLeft size={18} />
                    </button>
                    <button type="button" className="studio-icon-btn" onClick={() => setAnchor(new Date())}>
                        Сьогодні
                    </button>
                    <button type="button" className="studio-icon-btn" onClick={() => shift(1)} aria-label="Далі">
                        <ChevronRight size={18} />
                    </button>
                </div>
            </header>
            {error && <p className="studio-error">{error}</p>}
            {busy ? (
                <div className="studio-skel tall" />
            ) : mode === "week" ? (
                <div className="studio-week">
                    {weekDays.map((day) => {
                        const lessons = occurrencesOn(schedule.slots, schedule.exceptions, day);
                        return (
                            <section key={toISODate(day)}>
                                <h3>
                                    {WEEKDAYS[(day.getDay() + 6) % 7]}
                                    <span>{day.getDate()}</span>
                                </h3>
                                {lessons.length === 0 ? (
                                    <p className="studio-muted">Немає занять</p>
                                ) : (
                                    lessons.map((slot) => eventButton(slot, day))
                                )}
                            </section>
                        );
                    })}
                </div>
            ) : (
                <div className="studio-month">
                    {WEEKDAYS.map((name) => (
                        <b key={name}>{name.slice(0, 2)}</b>
                    ))}
                    {monthDays.map((day) => {
                        const inMonth = day.getMonth() === anchor.getMonth();
                        const lessons = occurrencesOn(schedule.slots, schedule.exceptions, day);
                        return (
                            <div
                                key={toISODate(day)}
                                className={`studio-month-cell${inMonth ? "" : " is-out"}`}
                            >
                                <span>{day.getDate()}</span>
                                {lessons.map((slot) => eventButton(slot, day, true))}
                            </div>
                        );
                    })}
                </div>
            )}
            {selected && (
                <LessonPopup
                    slot={selected.slot}
                    date={selected.date}
                    busy={acting}
                    onClose={() => setSelected(null)}
                    onSetStatus={applyStatus}
                    onRestore={restore}
                />
            )}
        </div>
    );
};

export default SchedulePage;
