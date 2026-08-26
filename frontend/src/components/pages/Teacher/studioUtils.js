export const WEEKDAYS = [
    "Понеділок",
    "Вівторок",
    "Середа",
    "Четвер",
    "П’ятниця",
    "Субота",
    "Неділя",
];

export const MONTHS = [
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

export const toISODate = (date) => {
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const parseISODate = (value) => {
    const [year, month, day] = String(value).split("-").map(Number);
    return new Date(year, month - 1, day);
};

export const formatTime = (value) => String(value || "").slice(0, 5);

export const initialsOf = (name) =>
    (name || "?")
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

export const greetingFor = (name) => {
    const hour = new Date().getHours();
    const hello = hour < 12 ? "Доброго ранку" : hour < 18 ? "Доброго дня" : "Доброго вечора";
    return name ? `${hello}, ${name}` : hello;
};

export const formatHumanDate = (value) => {
    if (!value) return "—";
    if (value === "Сьогодні" || value === "Вчора") return value;
    const date = parseISODate(value);
    if (Number.isNaN(date.getTime())) return value;
    return `${date.getDate()} ${MONTHS[date.getMonth()].toLowerCase()}`;
};

export const mondayOf = (date) => {
    const copy = new Date(date);
    const weekday = (copy.getDay() + 6) % 7;
    copy.setDate(copy.getDate() - weekday);
    copy.setHours(0, 0, 0, 0);
    return copy;
};

export const addDays = (date, days) => {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
};

export const CANCEL_STATUSES = ["cancelled", "compensated", "teacher_fault"];

export const exceptionFor = (exceptions, slotId, dateKey) =>
    (exceptions || []).find((item) => item.slot_id === slotId && item.date === dateKey) || null;

export const isCancelledStatus = (status) => CANCEL_STATUSES.includes(status);

export const occurrenceStatus = (exceptions, slotId, dateKey) =>
    exceptionFor(exceptions, slotId, dateKey)?.status || "planned";

export const occurrencesOn = (slots, exceptions, day, { skipCancelled = false } = {}) => {
    const key = toISODate(day);
    const weekday = (day.getDay() + 6) % 7;
    return (slots || [])
        .filter((slot) => slot.weekday === weekday)
        .map((slot) => {
            const exception = exceptionFor(exceptions, slot.id, key);
            return {
                ...slot,
                occurrenceStatus: exception?.status || "planned",
                exception,
            };
        })
        .filter((slot) => !skipCancelled || !isCancelledStatus(slot.occurrenceStatus))
        .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));
};

export const upcomingLessons = (slots, exceptions, fromDate, limit = 6) => {
    const items = [];
    for (let i = 1; i <= 28 && items.length < limit; i += 1) {
        const day = addDays(fromDate, i);
        occurrencesOn(slots, exceptions, day, { skipCancelled: true }).forEach((slot) => {
            if (items.length < limit) {
                items.push({ slot, date: toISODate(day), day });
            }
        });
    }
    return items;
};

export const ATTENDANCE_CYCLE = ["present", "late", "absent"];
export const HW_CYCLE = ["done", "partial", "not_done"];

export const nextCycle = (list, current) => {
    const idx = list.indexOf(current);
    return list[(idx + 1) % list.length];
};

export const attendanceLabel = (value) =>
    ({ present: "Присутній", late: "Запізнився", absent: "Відсутній" }[value] || "Не відмічено");

export const homeworkLabel = (value) =>
    ({
        done: "Виконано",
        partial: "Частково",
        not_done: "Не виконано",
    }[value] || "Не перевірено");
