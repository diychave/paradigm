import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Plus } from "lucide-react";
import api from "@services/api";
import { teacherCourse, teacherSchedule, teacherStudent } from "@/teacherPath";
import { useStudio } from "./StudioContext";
import {
    ATTENDANCE_CYCLE,
    HW_CYCLE,
    attendanceLabel,
    formatHumanDate,
    homeworkLabel,
    initialsOf,
    nextCycle,
} from "./studioUtils";

const TABS = [
    { id: "materials", label: "Матеріали" },
    { id: "students", label: "Студенти" },
    { id: "homework", label: "Домашнє" },
];

const Lesson = () => {
    const { slotId, date } = useParams();
    const { toast, openDrawer, closeDrawer } = useStudio();
    const [lesson, setLesson] = useState(null);
    const [tab, setTab] = useState("students");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(true);

    const load = () => {
        api.learning
            .teacherLesson(slotId, date)
            .then(setLesson)
            .catch((err) => setError(err?.message || "Заняття не знайдено"))
            .finally(() => setBusy(false));
    };

    useEffect(() => {
        setBusy(true);
        load();
    }, [slotId, date]);

    const setAttendance = async (status) => {
        try {
            await api.learning.teacherAttendance({
                enrollment_id: lesson.student.enrollment_id,
                slot_id: lesson.slot_id,
                date: lesson.date,
                status,
            });
            toast("Відвідуваність оновлено");
            load();
        } catch (err) {
            toast(err?.message || "Помилка", "err");
        }
    };

    const setHomework = async (assignmentId, hwStatus) => {
        try {
            await api.learning.teacherGrade(lesson.student.enrollment_id, assignmentId, {
                hw_status: hwStatus,
            });
            toast("Домашку відмічено");
            load();
        } catch (err) {
            toast(err?.message || "Помилка", "err");
        }
    };

    const editHomework = (item, createNew = false) => {
        const topicId = lesson.topic?.id;
        openDrawer({
            title: createNew ? "Нове домашнє" : "Редагувати домашнє",
            body: (
                <form
                    className="studio-form"
                    onSubmit={async (e) => {
                        e.preventDefault();
                        const payload = {
                            title: e.target.title.value,
                            description: e.target.description.value,
                            due_label: e.target.due_label.value,
                        };
                        try {
                            if (createNew) {
                                await api.learning.teacherAddAssignment(topicId, {
                                    ...payload,
                                    enrollment_id: lesson.student?.enrollment_id,
                                });
                            } else await api.learning.teacherUpdateAssignment(item.id, payload);
                            toast("Домашку задано цьому студенту");
                            closeDrawer();
                            load();
                        } catch (err) {
                            toast(err?.message || "Помилка", "err");
                        }
                    }}
                >
                    <label>
                        Назва
                        <input name="title" defaultValue={createNew ? "" : item?.title} required />
                    </label>
                    <label>
                        Опис
                        <textarea name="description" defaultValue={createNew ? "" : item?.description} />
                    </label>
                    <label>
                        Термін
                        <input
                            name="due_label"
                            defaultValue={item?.due_label || "До наступного заняття"}
                        />
                    </label>
                    <button type="submit" className="studio-btn">
                        Зберегти
                    </button>
                </form>
            ),
        });
    };

    if (busy) return <div className="studio-page"><div className="studio-skel tall" /></div>;
    if (!lesson) {
        return (
            <div className="studio-page">
                <p className="studio-error">{error}</p>
            </div>
        );
    }

    const student = lesson.student;
    const currentHw = lesson.topic?.assignments?.[0];
    const prevHw = lesson.previous_homework;

    return (
        <div className="studio-page">
            <Link to={teacherSchedule()} className="studio-back">
                <ArrowLeft size={16} /> До розкладу
            </Link>
            <p className="studio-kicker">Заняття</p>
            <h1>{lesson.short_title}</h1>
            <p className="studio-lead">
                {formatHumanDate(lesson.date)} · {lesson.start_time}–{lesson.end_time}
                {lesson.topic ? ` · ${lesson.topic.title}` : ""}
            </p>

            <div className="studio-tabs">
                {TABS.map((item) => (
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

            {tab === "materials" && (
                <section className="studio-panel">
                    {(lesson.topic?.materials || []).length === 0 ? (
                        <div className="studio-empty">
                            <FileText size={28} />
                            <p>Немає матеріалів до цієї теми</p>
                        </div>
                    ) : (
                        <ul className="studio-files">
                            {lesson.topic.materials.map((item) => (
                                <li key={item.id}>
                                    <FileText size={16} />
                                    <a href={item.url} target="_blank" rel="noreferrer">
                                        {item.title}
                                    </a>
                                    <em>{String(item.type || "").toUpperCase()}</em>
                                </li>
                            ))}
                        </ul>
                    )}
                    <Link className="studio-btn ghost" to={teacherCourse(lesson.course_id)}>
                        <Plus size={16} /> Додати матеріал у курсі
                    </Link>
                </section>
            )}

            {tab === "students" && (
                <section className="studio-panel">
                    <div className="studio-person">
                        {student.avatar ? (
                            <img className="studio-avatar" src={student.avatar} alt="" />
                        ) : (
                            <span className="studio-avatar">{initialsOf(student.display_name)}</span>
                        )}
                        <Link to={teacherStudent(student.id)}>
                            <strong>{student.display_name}</strong>
                        </Link>
                        <button
                            type="button"
                            className={`studio-pill is-${student.attendance || "none"}`}
                            onClick={() =>
                                setAttendance(
                                    student.attendance
                                        ? nextCycle(ATTENDANCE_CYCLE, student.attendance)
                                        : "present"
                                )
                            }
                        >
                            {attendanceLabel(student.attendance)}
                        </button>
                        {prevHw && (
                            <button
                                type="button"
                                className={`studio-pill is-${prevHw.hw_status || "none"}`}
                                onClick={() =>
                                    setHomework(prevHw.id, nextCycle(HW_CYCLE, prevHw.hw_status || "not_done"))
                                }
                            >
                                {homeworkLabel(prevHw.hw_status)}
                            </button>
                        )}
                    </div>
                </section>
            )}

            {tab === "homework" && (
                <section className="studio-panel">
                    <h3>Домашнє минулого заняття</h3>
                    {prevHw ? (
                        <article className="studio-hw-card">
                            <h4>{prevHw.title}</h4>
                            <p>{prevHw.description || "Без опису"}</p>
                            <span>Термін: {prevHw.due_label || "До наступного заняття"}</span>
                            <div className="studio-seg">
                                {HW_CYCLE.map((value) => (
                                    <button
                                        key={value}
                                        type="button"
                                        className={prevHw.hw_status === value ? `is-${value}` : ""}
                                        onClick={() => setHomework(prevHw.id, value)}
                                    >
                                        {homeworkLabel(value)}
                                    </button>
                                ))}
                            </div>
                            <button type="button" className="studio-btn ghost" onClick={() => editHomework(prevHw)}>
                                Змінити опис або термін
                            </button>
                        </article>
                    ) : (
                        <p className="studio-muted">Минулої домашки ще немає.</p>
                    )}
                    <h3>Домашнє цієї теми</h3>
                    {currentHw ? (
                        <article className="studio-hw-card">
                            <h4>{currentHw.title}</h4>
                            <p>{currentHw.description || "Без опису"}</p>
                        </article>
                    ) : (
                        <p className="studio-muted">Для цієї теми домашки немає.</p>
                    )}
                    <button type="button" className="studio-btn" onClick={() => editHomework(currentHw, true)}>
                        Створити нове домашнє
                    </button>
                </section>
            )}
        </div>
    );
};

export default Lesson;
