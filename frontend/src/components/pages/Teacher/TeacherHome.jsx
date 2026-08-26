import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, CalendarClock, CheckCircle2, Users } from "lucide-react";
import { useAuth } from "@/AuthContext";
import api from "@services/api";
import { teacherSchedule } from "@/teacherPath";
import { useStudio } from "./StudioContext";
import LessonPopup from "./LessonPopup";
import {
    WEEKDAYS,
    formatTime,
    greetingFor,
    isCancelledStatus,
    occurrencesOn,
    toISODate,
    upcomingLessons,
} from "./studioUtils";

const TeacherHome = () => {
    const { user } = useAuth();
    const { toast } = useStudio();
    const firstName = (user?.display_name || user?.username || "").split(/\s+/)[0];
    const [students, setStudents] = useState([]);
    const [schedule, setSchedule] = useState({ slots: [], exceptions: [] });
    const [selected, setSelected] = useState(null);
    const [acting, setActing] = useState(false);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(true);
    const today = useMemo(() => new Date(), []);
    const weekday = (today.getDay() + 6) % 7;

    const load = () =>
        Promise.all([api.learning.teacherStudents(), api.learning.teacherSchedule()]).then(
            ([list, sched]) => {
                setStudents(Array.isArray(list) ? list : []);
                setSchedule(sched || { slots: [], exceptions: [] });
            }
        );

    useEffect(() => {
        load()
            .catch((err) => setError(err?.message || "Не вдалося завантажити"))
            .finally(() => setBusy(false));
    }, []);

    const todayLessons = occurrencesOn(schedule.slots, schedule.exceptions, today);
    const todayActive = todayLessons.filter((slot) => !isCancelledStatus(slot.occurrenceStatus));
    const upcoming = upcomingLessons(schedule.slots, schedule.exceptions, today, 5);
    const pendingHw = students.reduce(
        (sum, student) => sum + Math.max((student.homework_total || 0) - (student.homework_done || 0), 0),
        0
    );
    const next = todayActive[0] || upcoming[0]?.slot;

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

    if (busy) {
        return (
            <div className="studio-page">
                <div className="studio-skel wide" />
                <div className="studio-stats">
                    <div className="studio-skel" />
                    <div className="studio-skel" />
                    <div className="studio-skel" />
                    <div className="studio-skel" />
                </div>
            </div>
        );
    }

    return (
        <div className="studio-page">
            <p className="studio-kicker">Сьогодні · {WEEKDAYS[weekday]}</p>
            <h1>{greetingFor(firstName)} 👋</h1>
            <p className="studio-lead">Все, що потрібно для занять сьогодні.</p>
            {error && <p className="studio-error">{error}</p>}

            <div className="studio-stats">
                <article>
                    <Users size={18} />
                    <strong>{students.length}</strong>
                    <span>Студентів</span>
                </article>
                <article>
                    <CalendarClock size={18} />
                    <strong>{todayActive.length}</strong>
                    <span>Занять сьогодні</span>
                </article>
                <article>
                    <CheckCircle2 size={18} />
                    <strong>{pendingHw}</strong>
                    <span>Домашніх на перевірку</span>
                </article>
                <article>
                    <BookOpen size={18} />
                    <strong>{next ? formatTime(next.start_time) : "—"}</strong>
                    <span>Найближче заняття</span>
                </article>
            </div>

            <section className="studio-panel">
                <header className="studio-panel-head">
                    <h2>Сьогоднішній розклад</h2>
                    <Link to={teacherSchedule()}>Календар</Link>
                </header>
                {todayLessons.length === 0 ? (
                    <div className="studio-empty">
                        <CalendarClock size={28} />
                        <p>Сьогодні занять немає</p>
                        <span>Наступні уроки з’являться в блоці нижче.</span>
                    </div>
                ) : (
                    <div className="studio-lesson-grid">
                        {todayLessons.map((slot) => (
                            <article
                                key={slot.id}
                                className={`studio-lesson-card is-${slot.occurrenceStatus}`}
                            >
                                <time>{formatTime(slot.start_time)}</time>
                                <h3>{slot.short_title}</h3>
                                <p>{slot.student_name}</p>
                                <button
                                    type="button"
                                    className="studio-btn"
                                    onClick={() => setSelected({ slot, date: toISODate(today) })}
                                >
                                    Відкрити заняття
                                </button>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            <section className="studio-panel">
                <header className="studio-panel-head">
                    <h2>Найближчі заняття</h2>
                </header>
                {upcoming.length === 0 ? (
                    <p className="studio-muted">Немає запланованих занять.</p>
                ) : (
                    <ul className="studio-list">
                        {upcoming.map((item) => (
                            <li key={`${item.slot.id}-${item.date}`}>
                                <div>
                                    <strong>{item.slot.short_title}</strong>
                                    <span>
                                        {WEEKDAYS[(item.day.getDay() + 6) % 7]} · {formatTime(item.slot.start_time)} ·{" "}
                                        {item.slot.student_name}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    className="studio-link"
                                    onClick={() => setSelected({ slot: item.slot, date: item.date })}
                                >
                                    Відкрити
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
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

export default TeacherHome;
