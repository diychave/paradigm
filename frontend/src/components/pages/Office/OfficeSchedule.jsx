import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import api from "@services/api";
import { useStudio } from "@components/pages/Teacher/StudioContext";
import {
    MONTHS,
    WEEKDAYS,
    addDays,
    formatTime,
    mondayOf,
    occurrencesOn,
    toISODate,
} from "@components/pages/Teacher/studioUtils";

const SlotForm = ({ lookups, onSubmit }) => {
    const [studentId, setStudentId] = useState(lookups.students[0]?.id || "");
    const [courseId, setCourseId] = useState(lookups.courses[0]?.id || "");
    const [teacherId, setTeacherId] = useState(lookups.teachers[0]?.id || "");
    const [weekday, setWeekday] = useState("0");
    const [start, setStart] = useState("16:00");
    const [end, setEnd] = useState("17:30");
    const [mode, setMode] = useState("online");
    const [place, setPlace] = useState("Zoom");
    return (
        <form
            className="studio-form"
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit({
                    student_id: Number(studentId),
                    course_id: courseId,
                    teacher_id: teacherId ? Number(teacherId) : null,
                    weekday: Number(weekday),
                    start_time: start,
                    end_time: end,
                    mode,
                    place,
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
                <select value={courseId} onChange={(e) => setCourseId(e.target.value)} required>
                    {lookups.courses.map((item) => (
                        <option key={item.id} value={item.id}>
                            {item.title}
                        </option>
                    ))}
                </select>
            </label>
            <label>
                Викладач
                <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
                    <option value="">Без викладача</option>
                    {lookups.teachers.map((item) => (
                        <option key={item.id} value={item.id}>
                            {item.display_name}
                        </option>
                    ))}
                </select>
            </label>
            <label>
                День
                <select value={weekday} onChange={(e) => setWeekday(e.target.value)}>
                    {WEEKDAYS.map((name, index) => (
                        <option key={name} value={index}>
                            {name}
                        </option>
                    ))}
                </select>
            </label>
            <label>
                Початок
                <input type="time" value={start} onChange={(e) => setStart(e.target.value)} required />
            </label>
            <label>
                Кінець
                <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} required />
            </label>
            <label>
                Формат
                <select value={mode} onChange={(e) => setMode(e.target.value)}>
                    <option value="online">Онлайн</option>
                    <option value="offline">У школі</option>
                </select>
            </label>
            <label>
                Місце / посилання
                <input value={place} onChange={(e) => setPlace(e.target.value)} />
            </label>
            <button type="submit" className="studio-btn">
                Додати в розклад
            </button>
        </form>
    );
};

const OfficeSchedule = () => {
    const { toast, openDrawer, closeDrawer } = useStudio();
    const [mode, setMode] = useState("week");
    const [anchor, setAnchor] = useState(() => new Date());
    const [schedule, setSchedule] = useState({ slots: [], exceptions: [] });
    const [lookups, setLookups] = useState({ students: [], teachers: [], courses: [] });
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(true);

    const load = () =>
        Promise.all([api.office.schedule(), api.office.lookups()]).then(([sched, nextLookups]) => {
            setSchedule(sched || { slots: [], exceptions: [] });
            setLookups(nextLookups || { students: [], teachers: [], courses: [] });
        });

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

    const create = async (payload) => {
        try {
            await api.office.createSlot(payload);
            closeDrawer();
            toast("Слот додано");
            await load();
        } catch (err) {
            toast(err?.message || "Не вдалося додати", "err");
        }
    };

    const remove = async (slot) => {
        if (!window.confirm(`Прибрати ${slot.short_title} · ${slot.student_name}?`)) return;
        try {
            await api.office.deleteSlot(slot.id);
            toast("Слот видалено");
            await load();
        } catch (err) {
            toast(err?.message || "Не вдалося видалити", "err");
        }
    };

    const eventButton = (slot, compact = false) => (
        <button
            key={slot.id}
            type="button"
            className={`studio-cal-event office-slot-card${compact ? " sm" : ""}`}
            onClick={() => remove(slot)}
            title="Натисніть, щоб видалити слот"
        >
            {compact ? (
                <>
                    {formatTime(slot.start_time)} {slot.short_title}
                </>
            ) : (
                <>
                    <strong>{formatTime(slot.start_time)}</strong>
                    <span>{slot.short_title}</span>
                    <em>
                        {slot.student_name}
                        {slot.teacher_name ? ` · ${slot.teacher_name}` : ""}
                    </em>
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
                    <button
                        type="button"
                        className="studio-btn"
                        onClick={() =>
                            openDrawer({
                                title: "Нове заняття",
                                body: <SlotForm lookups={lookups} onSubmit={create} />,
                            })
                        }
                    >
                        <Plus size={16} /> Додати слот
                    </button>
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
                                    lessons.map((slot) => eventButton(slot))
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
                                {lessons.map((slot) => eventButton(slot, true))}
                            </div>
                        );
                    })}
                </div>
            )}
            <p className="studio-muted" style={{ marginTop: "1.6rem" }}>
                <Trash2 size={14} style={{ verticalAlign: "middle" }} /> Натисніть на заняття, щоб прибрати слот з розкладу.
            </p>
        </div>
    );
};

export default OfficeSchedule;
