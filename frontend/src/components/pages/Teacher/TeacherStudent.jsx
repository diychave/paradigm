import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ChevronDown, Plus, Trash2 } from "lucide-react";
import api from "@services/api";
import { teacherStudents } from "@/teacherPath";
import { useStudio } from "./StudioContext";
import { HomeworkForm, MaterialForm } from "./studioForms";
import { homeworkLabel, initialsOf } from "./studioUtils";

const TABS = [
    { id: "learn", label: "Навчання" },
    { id: "notes", label: "Замітки викладача" },
];

const isOpenTopic = (topic) => topic.status === "in_progress" || topic.status === "done";

const CourseTabs = ({ enrollments, activeId, onSelect }) => (
    <div className="studio-course-nav" role="tablist" aria-label="Курси студента">
        {enrollments.map((row) => {
            const topics = (row.sections || []).flatMap((section) => section.topics || []);
            const opened = topics.filter(isOpenTopic).length;
            const active = activeId === row.id;
            return (
                <button
                    key={row.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    className={active ? "is-active" : ""}
                    onClick={() => onSelect(row.id)}
                >
                    <strong>{row.short_title || row.course_title}</strong>
                    <em>
                        {opened}/{topics.length} тем
                    </em>
                </button>
            );
        })}
    </div>
);

const TopicCard = ({
    topic,
    enrollment,
    expanded,
    assignOpen,
    busy,
    onToggle,
    onVisible,
    onHw,
    onRemoveHw,
    onRemoveMaterial,
    onToggleAssign,
    onAddHw,
    onAddFile,
    onMark,
}) => {
    const visible = isOpenTopic(topic);
    const extras = topic.extra_materials || [];
    const homework = topic.assignments || [];
    const materials = topic.materials || [];

    return (
        <article className={`studio-topic-card${expanded ? " is-open" : ""}${visible ? " is-on" : ""}`}>
            <div className="studio-topic-row">
                <button type="button" className="studio-topic-name" aria-expanded={expanded} onClick={onToggle}>
                    <span className="studio-topic-num">{topic.number}</span>
                    <span>
                        <strong>{topic.title}</strong>
                        <span>{topic.sectionTitle}</span>
                    </span>
                    <ChevronDown size={18} className="studio-acc-chevron" />
                </button>
                <div className="studio-switch-wrap">
                    <span>{visible ? "Відкрито" : "Приховано"}</span>
                    <button
                        type="button"
                        className={`studio-switch${visible ? " is-on" : ""}`}
                        role="switch"
                        aria-checked={visible}
                        aria-label={visible ? `Приховати тему ${topic.title}` : `Відкрити тему ${topic.title}`}
                        disabled={busy}
                        onClick={onVisible}
                    >
                        <i />
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="studio-topic-panel">
                    {materials.length > 0 && (
                        <div className="studio-topic-block">
                            <h3>Матеріали курсу</h3>
                            <ul className="studio-files">
                                {materials.map((item) => (
                                    <li key={item.id}>
                                        <a href={item.url} target="_blank" rel="noreferrer">
                                            {item.title}
                                        </a>
                                        <em>{String(item.type || "").toUpperCase()}</em>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {homework.length > 0 && (
                        <div className="studio-topic-block">
                            <h3>Домашнє</h3>
                            <ul className="studio-hw">
                                {homework.map((item) => (
                                    <li key={item.id}>
                                        <div>
                                            <strong>{item.title}</strong>
                                            <span>{item.description || item.due_label}</span>
                                        </div>
                                        <div className="studio-seg">
                                            {["done", "partial", "not_done"].map((value) => (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    className={item.hw_status === value ? `is-${value}` : ""}
                                                    onClick={() => onHw(enrollment, item.id, value)}
                                                >
                                                    {homeworkLabel(value)}
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            type="button"
                                            className="studio-icon-btn"
                                            onClick={() => onRemoveHw(item.id)}
                                            aria-label="Зняти домашку"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {extras.length > 0 && (
                        <div className="studio-topic-block">
                            <h3>Файли від вас</h3>
                            <ul className="studio-files">
                                {extras.map((item) => (
                                    <li key={item.id}>
                                        <a href={item.url} target="_blank" rel="noreferrer">
                                            {item.title}
                                        </a>
                                        <button
                                            type="button"
                                            className="studio-icon-btn"
                                            onClick={() => onRemoveMaterial(item.id)}
                                            aria-label="Прибрати файл"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className={`studio-acc-nested${assignOpen ? " is-open" : ""}`}>
                        <button
                            type="button"
                            className="studio-acc-nested-btn"
                            aria-expanded={assignOpen}
                            onClick={onToggleAssign}
                        >
                            <span>
                                {homework.length || extras.length
                                    ? "Додати ще домашку або файл"
                                    : "Додати домашку або файл"}
                            </span>
                            <ChevronDown size={16} />
                        </button>
                        {assignOpen && (
                            <div className="studio-acc-nested-body">
                                <button type="button" className="studio-btn" onClick={() => onAddHw(enrollment, topic)}>
                                    <Plus size={16} /> Задати домашку
                                </button>
                                <button
                                    type="button"
                                    className="studio-btn ghost"
                                    onClick={() => onAddFile(enrollment, topic)}
                                >
                                    <Plus size={16} /> Файл цьому студенту
                                </button>
                            </div>
                        )}
                    </div>

                    {visible && (
                        <div className="studio-acc-foot">
                            {topic.status !== "done" ? (
                                <button
                                    type="button"
                                    className="studio-btn ghost"
                                    onClick={() => onMark(enrollment, topic, "done")}
                                >
                                    Позначити пройденим
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="studio-btn ghost"
                                    onClick={() => onMark(enrollment, topic, "in_progress")}
                                >
                                    Повернути в роботу
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </article>
    );
};

const TeacherStudent = () => {
    const { id } = useParams();
    const { toast, openDrawer, closeDrawer } = useStudio();
    const [student, setStudent] = useState(null);
    const [tab, setTab] = useState("learn");
    const [enrollmentId, setEnrollmentId] = useState(null);
    const [openTopicId, setOpenTopicId] = useState(null);
    const [assignOpen, setAssignOpen] = useState({});
    const [notes, setNotes] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(true);
    const [topicBusy, setTopicBusy] = useState("");

    const load = () => {
        api.learning
            .teacherStudent(id)
            .then((data) => {
                setStudent(data);
                const rows = data.enrollments || [];
                setEnrollmentId((prev) => {
                    if (prev && rows.some((row) => row.id === prev)) return prev;
                    return rows[0]?.id || null;
                });
            })
            .catch((err) => setError(err?.message || "Студента не знайдено"))
            .finally(() => setBusy(false));
    };

    useEffect(() => {
        setBusy(true);
        load();
    }, [id]);

    const enrollments = student?.enrollments || [];
    const course = enrollments.find((row) => row.id === enrollmentId) || enrollments[0];

    useEffect(() => {
        setNotes(course?.notes || "");
        setAssignOpen({});
        setOpenTopicId(null);
    }, [course?.id]);

    const sections = useMemo(
        () =>
            (course?.sections || []).map((section) => ({
                ...section,
                topics: (section.topics || []).map((topic) => ({ ...topic, sectionTitle: section.title })),
            })),
        [course]
    );

    const topicStats = useMemo(() => {
        const topics = sections.flatMap((section) => section.topics);
        return {
            total: topics.length,
            opened: topics.filter(isOpenTopic).length,
        };
    }, [sections]);

    const selectCourse = (nextId) => {
        setEnrollmentId(nextId);
        setOpenTopicId(null);
        setAssignOpen({});
    };

    const setHw = async (enrollment, assignmentId, hwStatus) => {
        if (!enrollment) return;
        try {
            await api.learning.teacherGrade(enrollment.id, assignmentId, { hw_status: hwStatus });
            toast("Статус домашки оновлено");
            load();
        } catch (err) {
            toast(err?.message || "Не вдалося оновити", "err");
        }
    };

    const setTopicStatus = async (enrollment, topic, status) => {
        if (!enrollment) return;
        const key = `${enrollment.id}-${topic.id}`;
        setTopicBusy(key);
        try {
            await api.learning.teacherSetTopicStatus(enrollment.id, topic.id, status);
            if (status === "not_started") toast("Тему приховано від студента");
            else if (status === "in_progress" && !isOpenTopic(topic)) toast("Тему відкрито для студента");
            else toast("Статус теми оновлено");
            load();
        } catch (err) {
            toast(err?.message || "Не вдалося оновити", "err");
        } finally {
            setTopicBusy("");
        }
    };

    const setTopicVisible = (enrollment, topic, visible) => {
        if (visible) {
            setTopicStatus(enrollment, topic, topic.status === "done" ? "done" : "in_progress");
            setOpenTopicId(topic.id);
            return;
        }
        setTopicStatus(enrollment, topic, "not_started");
    };

    const addHomework = (enrollment, topic) => {
        openDrawer({
            title: `Домашка · ${topic.title}`,
            body: (
                <HomeworkForm
                    initial={{ title: "", description: "", due_label: "До наступного заняття" }}
                    submitLabel="Задати цьому студенту"
                    onSubmit={async (payload) => {
                        try {
                            await api.learning.teacherAddAssignment(topic.id, {
                                ...payload,
                                enrollment_id: enrollment.id,
                            });
                            toast("Домашку задано лише цьому студенту");
                            closeDrawer();
                            load();
                        } catch (err) {
                            toast(err?.message || "Помилка", "err");
                        }
                    }}
                />
            ),
        });
    };

    const addExtraMaterial = (enrollment, topic) => {
        openDrawer({
            title: `Файл для ${student.display_name}`,
            body: (
                <MaterialForm
                    initial={{ title: "", url: "", type: "link" }}
                    submitLabel="Додати цьому студенту"
                    onSubmit={async (payload) => {
                        try {
                            await api.learning.teacherAddStudentMaterial(enrollment.id, topic.id, payload);
                            toast("Файл додано лише цьому студенту");
                            closeDrawer();
                            load();
                        } catch (err) {
                            toast(err?.message || "Помилка", "err");
                        }
                    }}
                />
            ),
        });
    };

    const removeHomework = async (assignmentId) => {
        try {
            await api.learning.teacherDeleteAssignment(assignmentId);
            toast("Домашку знято");
            load();
        } catch (err) {
            toast(err?.message || "Не вдалося видалити", "err");
        }
    };

    const removeMaterial = async (materialId) => {
        try {
            await api.learning.teacherDeleteStudentMaterial(materialId);
            toast("Файл прибрано");
            load();
        } catch (err) {
            toast(err?.message || "Не вдалося видалити", "err");
        }
    };

    const saveNotes = async () => {
        if (!course) return;
        try {
            await api.learning.teacherSaveNotes(course.id, notes);
            toast("Замітки збережено");
        } catch (err) {
            toast(err?.message || "Не вдалося зберегти", "err");
        }
    };

    if (busy) {
        return (
            <div className="studio-page">
                <div className="studio-skel wide" />
                <div className="studio-skel tall" />
            </div>
        );
    }

    if (!student) {
        return (
            <div className="studio-page">
                <p className="studio-error">{error || "Не знайдено"}</p>
                <Link to={teacherStudents()}>До списку</Link>
            </div>
        );
    }

    return (
        <div className="studio-page">
            <Link to={teacherStudents()} className="studio-back">
                <ArrowLeft size={16} /> До студентів
            </Link>
            <section className="studio-profile">
                {student.avatar ? (
                    <img className="studio-avatar lg" src={student.avatar} alt="" />
                ) : (
                    <span className="studio-avatar lg">{initialsOf(student.display_name)}</span>
                )}
                <div>
                    <h1>{student.display_name}</h1>
                </div>
            </section>

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

            {tab === "learn" && (
                <div className="studio-learn">
                    {enrollments.length === 0 ? (
                        <section className="studio-panel">
                            <div className="studio-empty">
                                <p>Курсів поки немає</p>
                            </div>
                        </section>
                    ) : (
                        <>
                            <CourseTabs
                                enrollments={enrollments}
                                activeId={course?.id}
                                onSelect={selectCourse}
                            />
                            <section className="studio-course-board">
                                <header className="studio-course-summary">
                                    <div>
                                        <p className="studio-kicker">Програма</p>
                                        <h2>{course?.short_title || course?.course_title}</h2>
                                        <p className="studio-muted">
                                            Повзунок відкриває тему студенту. Натисніть тему, щоб задати домашку.
                                        </p>
                                    </div>
                                    <div className="studio-course-progress">
                                        <strong>
                                            {topicStats.opened}/{topicStats.total}
                                        </strong>
                                        <span>тем відкрито</span>
                                        <b>
                                            <i style={{ width: `${course?.progress_percent || 0}%` }} />
                                        </b>
                                        <em>{course?.progress_percent || 0}%</em>
                                    </div>
                                </header>

                                {sections.length === 0 ? (
                                    <p className="studio-muted studio-course-empty">У курсі ще немає тем.</p>
                                ) : (
                                    sections.map((section) => (
                                        <div key={section.id} className="studio-topic-group">
                                            <h3>{section.title}</h3>
                                            {section.topics.map((topic) => (
                                                <TopicCard
                                                    key={topic.id}
                                                    topic={topic}
                                                    enrollment={course}
                                                    expanded={openTopicId === topic.id}
                                                    assignOpen={Boolean(assignOpen[topic.id])}
                                                    busy={topicBusy === `${course.id}-${topic.id}`}
                                                    onToggle={() =>
                                                        setOpenTopicId((prev) => (prev === topic.id ? null : topic.id))
                                                    }
                                                    onVisible={() => setTopicVisible(course, topic, !isOpenTopic(topic))}
                                                    onHw={setHw}
                                                    onRemoveHw={removeHomework}
                                                    onRemoveMaterial={removeMaterial}
                                                    onToggleAssign={() =>
                                                        setAssignOpen((prev) => ({
                                                            ...prev,
                                                            [topic.id]: !prev[topic.id],
                                                        }))
                                                    }
                                                    onAddHw={addHomework}
                                                    onAddFile={addExtraMaterial}
                                                    onMark={setTopicStatus}
                                                />
                                            ))}
                                        </div>
                                    ))
                                )}
                            </section>
                        </>
                    )}
                </div>
            )}

            {tab === "notes" && (
                <section className="studio-panel">
                    <textarea
                        className="studio-notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Добре розуміє функції. Є складнощі з Git."
                    />
                    <button type="button" className="studio-btn" onClick={saveNotes}>
                        Зберегти замітки
                    </button>
                </section>
            )}
        </div>
    );
};

export default TeacherStudent;
