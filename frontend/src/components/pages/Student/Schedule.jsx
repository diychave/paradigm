import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/AuthContext";
import api from "@services/api";
import StudentPage from "./StudentPage";
import useCabinetSync from "@/hooks/useCabinetSync";
import "../Login/AuthPages.css";
import "./StudentPage.css";
import "./Schedule.css";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];
const MONTHS = [
    "Січень",
    "Лютий",
    "Березень",
    "Квітень",
    "Травень",
    "Червень",
    "Липень",
    "Серпень",
    "Вересень",
    "Жовтень",
    "Листопад",
    "Грудень",
];

const mondayIndex = (date) => (date.getDay() + 6) % 7;

const pad = (n) => String(n).padStart(2, "0");

const toISODate = (date) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parseMinutes = (hhmm) => {
    const [h, m] = String(hhmm || "0:0").split(":").map(Number);
    return h * 60 + m;
};

const atDateTime = (date, hhmm) => {
    const copy = new Date(date);
    const [h, m] = String(hhmm || "0:0").split(":").map(Number);
    copy.setHours(h, m, 0, 0);
    return copy;
};

const startOfWeek = (date) => {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    copy.setDate(copy.getDate() - mondayIndex(copy));
    return copy;
};

const buildMonthGrid = (year, month) => {
    const first = new Date(year, month, 1);
    const day = startOfWeek(first);
    const cells = [];
    while (cells.length < 42) {
        cells.push(new Date(day));
        day.setDate(day.getDate() + 1);
        if (day.getMonth() !== month && mondayIndex(day) === 0 && cells.length >= 7) break;
    }
    return cells;
};

const lessonsOnDate = (date, slots, exceptions, now) => {
    const weekday = mondayIndex(date);
    const key = toISODate(date);
    return slots
        .filter((slot) => slot.weekday === weekday)
        .map((slot) => {
            const cancelled = exceptions.some(
                (item) =>
                    item.slot_id === slot.id &&
                    item.date === key &&
                    item.status !== "held"
            );
            const held = exceptions.some(
                (item) => item.slot_id === slot.id && item.date === key && item.status === "held"
            );
            const ended = atDateTime(date, slot.end_time) <= now;
            let status = "planned";
            if (cancelled) status = "cancelled";
            else if (held || ended) status = "done";
            return { ...slot, status, date: key };
        })
        .sort((a, b) => parseMinutes(a.start_time) - parseMinutes(b.start_time));
};

const dayTone = (lessons) => {
    if (!lessons.length) return "";
    const statuses = new Set(lessons.map((item) => item.status));
    if (statuses.size === 1) return [...statuses][0];
    return "mixed";
};

const nextLessonMeta = (slots, exceptions, now) => {
    const ranked = [];
    for (let offset = 0; offset < 28; offset += 1) {
        const date = new Date(now);
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() + offset);
        lessonsOnDate(date, slots, exceptions, now).forEach((lesson) => {
            if (lesson.status === "cancelled") return;
            const start = atDateTime(date, lesson.start_time);
            const end = atDateTime(date, lesson.end_time);
            if (end <= now) return;
            ranked.push({ ...lesson, start, live: start <= now && end > now });
        });
        if (ranked.length) break;
    }
    ranked.sort((a, b) => a.start - b.start);
    const best = ranked[0];
    if (!best) return null;
    const startDay = new Date(best.start);
    const today = new Date(now);
    startDay.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const dayDiff = Math.round((startDay - today) / 86400000);
    let when = best.weekday_label;
    if (best.live) when = "Зараз";
    else if (dayDiff === 0) when = "Сьогодні";
    else if (dayDiff === 1) when = "Завтра";
    return { ...best, when };
};

const Schedule = () => {
    const { user, loading, isAuthenticated } = useAuth();
    const [slots, setSlots] = useState([]);
    const [exceptions, setExceptions] = useState([]);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(true);
    const now = useMemo(() => new Date(), [busy]);
    const [cursor, setCursor] = useState(() => {
        const d = new Date();
        return { year: d.getFullYear(), month: d.getMonth() };
    });

    useEffect(() => {
        if (!user || user.role !== "student") return undefined;
        let cancelled = false;
        api.learning
            .getMySchedule()
            .then((data) => {
                if (cancelled) return;
                if (Array.isArray(data)) {
                    setSlots(data);
                    setExceptions([]);
                    return;
                }
                setSlots(Array.isArray(data?.slots) ? data.slots : []);
                setExceptions(Array.isArray(data?.exceptions) ? data.exceptions : []);
            })
            .catch((err) => {
                if (!cancelled) setError(err?.message || "Не вдалося завантажити розклад");
            })
            .finally(() => {
                if (!cancelled) setBusy(false);
            });
        return () => {
            cancelled = true;
        };
    }, [user]);

    const applySchedule = (data) => {
        if (Array.isArray(data)) {
            setSlots(data);
            setExceptions([]);
            return;
        }
        setSlots(Array.isArray(data?.slots) ? data.slots : []);
        setExceptions(Array.isArray(data?.exceptions) ? data.exceptions : []);
    };

    useCabinetSync(() => {
        if (!user || user.role !== "student") return;
        api.learning.getMySchedule().then(applySchedule).catch(() => {});
    }, Boolean(user && user.role === "student"));

    const upcoming = useMemo(
        () => nextLessonMeta(slots, exceptions, now),
        [slots, exceptions, now]
    );
    const grid = useMemo(
        () => buildMonthGrid(cursor.year, cursor.month),
        [cursor]
    );
    const todayKey = toISODate(now);
    const minMonth = useMemo(() => {
        const d = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        return { year: d.getFullYear(), month: d.getMonth() };
    }, [now]);
    const maxMonth = useMemo(() => {
        const d = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        return { year: d.getFullYear(), month: d.getMonth() };
    }, [now]);
    const monthValue = cursor.year * 12 + cursor.month;
    const canGoPrev = monthValue > minMonth.year * 12 + minMonth.month;
    const canGoNext = monthValue < maxMonth.year * 12 + maxMonth.month;

    const shiftMonth = (delta) => {
        if (delta < 0 && !canGoPrev) return;
        if (delta > 0 && !canGoNext) return;
        setCursor((prev) => {
            const next = new Date(prev.year, prev.month + delta, 1);
            return { year: next.getFullYear(), month: next.getMonth() };
        });
    };

    if (loading || (busy && isAuthenticated && user?.role === "student")) {
        return (
            <StudentPage title="Розклад">
                <p className="p-small-secondary">Завантаження...</p>
            </StudentPage>
        );
    }

    if (!isAuthenticated || user?.role !== "student") return <Navigate to="/login" replace />;

    return (
        <StudentPage title="Розклад" description="Заняття на місяць: було, в плані або скасовано.">
            {error && <p className="auth-error">{error}</p>}

            <div className="sched">
                {upcoming && (
                    <Link
                        to={`/account/courses/${upcoming.course_id}`}
                        className={`sched-next${upcoming.live ? " is-live" : ""}`}
                    >
                        <div className="sched-next-copy">
                            <p className="sched-kicker">
                                {upcoming.live ? "Йде зараз" : "Наступне заняття"}
                            </p>
                            <h2>{upcoming.short_title || upcoming.course_title}</h2>
                            <p className="sched-next-meta">
                                {upcoming.when} · {upcoming.start_time}–{upcoming.end_time}
                                {upcoming.place ? ` · ${upcoming.place}` : ""}
                            </p>
                        </div>
                        <span className="sched-next-go">До курсу →</span>
                    </Link>
                )}

                <section className="cal">
                    <div className="cal-nav">
                        <button
                            type="button"
                            className="cal-arrow"
                            onClick={() => shiftMonth(-1)}
                            disabled={!canGoPrev}
                            aria-label="Попередній місяць"
                        >
                            ←
                        </button>
                        <h2>
                            {MONTHS[cursor.month]} {cursor.year}
                        </h2>
                        <button
                            type="button"
                            className="cal-arrow"
                            onClick={() => shiftMonth(1)}
                            disabled={!canGoNext}
                            aria-label="Наступний місяць"
                        >
                            →
                        </button>
                    </div>

                    <div className="cal-weekdays">
                        {WEEKDAYS.map((day) => (
                            <span key={day}>{day}</span>
                        ))}
                    </div>

                    <div className="cal-grid">
                        {grid.map((date) => {
                            const key = toISODate(date);
                            const inMonth = date.getMonth() === cursor.month;
                            const lessons = lessonsOnDate(date, slots, exceptions, now);
                            const tone = dayTone(lessons);
                            return (
                                <div
                                    key={key}
                                    className={`cal-cell${inMonth ? "" : " is-out"}${
                                        key === todayKey ? " is-today" : ""
                                    }${tone ? ` is-${tone}` : ""}`}
                                >
                                    <span className="cal-num">{date.getDate()}</span>
                                    {lessons.length > 0 && (
                                        <ul className="cal-lessons">
                                            {lessons.map((lesson) => (
                                                <li key={`${lesson.id}-${key}`}>
                                                    {lesson.status === "cancelled" ? (
                                                        <span className={`cal-time is-${lesson.status}`}>
                                                            {lesson.start_time}
                                                            <em>{lesson.short_title}</em>
                                                        </span>
                                                    ) : (
                                                        <Link
                                                            to={`/account/courses/${lesson.course_id}`}
                                                            className={`cal-time is-${lesson.status}`}
                                                        >
                                                            {lesson.start_time}
                                                            <em>{lesson.short_title}</em>
                                                        </Link>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <ul className="cal-legend">
                        <li>
                            <i className="is-done" /> Було
                        </li>
                        <li>
                            <i className="is-planned" /> В плані
                        </li>
                        <li>
                            <i className="is-cancelled" /> Скасовано
                        </li>
                    </ul>
                </section>
            </div>
        </StudentPage>
    );
};

export default Schedule;
