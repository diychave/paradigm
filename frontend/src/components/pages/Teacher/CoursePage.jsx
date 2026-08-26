import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Link2, Video } from "lucide-react";
import api from "@services/api";
import { teacherCourses, teacherStudent } from "@/teacherPath";
import { initialsOf } from "./studioUtils";

const MATERIAL_ICONS = {
    pdf: FileText,
    doc: FileText,
    ppt: FileText,
    zip: FileText,
    link: Link2,
    video: Video,
};

const CoursePage = () => {
    const { courseId } = useParams();
    const [course, setCourse] = useState(null);
    const [topicId, setTopicId] = useState(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(true);

    useEffect(() => {
        api.learning
            .teacherCourse(courseId)
            .then((data) => {
                setCourse(data);
                setTopicId((prev) => prev || data.topics?.[0]?.id);
            })
            .catch((err) => setError(err?.message || "Курс не знайдено"))
            .finally(() => setBusy(false));
    }, [courseId]);

    const topic = course?.topics?.find((item) => item.id === topicId);

    if (busy) return <div className="studio-page"><div className="studio-skel tall" /></div>;
    if (!course) {
        return (
            <div className="studio-page">
                <p className="studio-error">{error}</p>
            </div>
        );
    }

    return (
        <div className="studio-page">
            <Link to={teacherCourses()} className="studio-back">
                <ArrowLeft size={16} /> До курсів
            </Link>
            <h1>{course.short_title || course.title}</h1>
            <p className="studio-lead">
                Програма курсу від менеджера. Домашку й додаткові файли задавайте в картці
                студента — кожній дитині окремо.
            </p>
            <div className="studio-split">
                <aside className="studio-panel">
                    <h2>Теми</h2>
                    <ol className="studio-topics">
                        {(course.topics || []).map((item) => (
                            <li key={item.id}>
                                <button
                                    type="button"
                                    className={item.id === topicId ? "is-active" : ""}
                                    onClick={() => setTopicId(item.id)}
                                >
                                    {item.number}. {item.title}
                                </button>
                            </li>
                        ))}
                    </ol>
                </aside>
                <section className="studio-panel">
                    {!topic ? (
                        <div className="studio-empty">
                            <p>Оберіть тему</p>
                        </div>
                    ) : (
                        <>
                            <p className="studio-kicker">Матеріали курсу</p>
                            <h2>{topic.title}</h2>
                            <p className="studio-lead">{topic.description || "Опису поки немає."}</p>
                            {(topic.materials || []).length === 0 ? (
                                <p className="studio-muted">Менеджер ще не додав матеріали до цієї теми.</p>
                            ) : (
                                <ul className="studio-files">
                                    {topic.materials.map((item) => {
                                        const Icon = MATERIAL_ICONS[item.type] || FileText;
                                        return (
                                            <li key={item.id}>
                                                <Icon size={16} />
                                                <a href={item.url} target="_blank" rel="noreferrer">
                                                    {item.title}
                                                </a>
                                                <em>{String(item.type || "").toUpperCase()}</em>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </>
                    )}
                </section>
            </div>

            <section className="studio-panel studio-course-students">
                <h2>Студенти на курсі</h2>
                <p className="studio-muted">
                    Темп різний: комусь тема за одне заняття, комусь за три. Домашку відкривайте
                    в картці конкретної дитини.
                </p>
                {(course.students || []).length === 0 ? (
                    <div className="studio-empty">
                        <p>На курсі ще немає студентів</p>
                    </div>
                ) : (
                    <ul className="studio-people">
                        {(course.students || []).map((item) => (
                            <li key={item.id} className="studio-person">
                                {item.avatar ? (
                                    <img className="studio-avatar" src={item.avatar} alt="" />
                                ) : (
                                    <span className="studio-avatar">{initialsOf(item.display_name)}</span>
                                )}
                                <div>
                                    <strong>{item.display_name}</strong>
                                    <span>
                                        {item.progress_percent || 0}% курсу · {item.homework_done || 0}/
                                        {item.homework_total || 0} домашок
                                    </span>
                                </div>
                                <Link to={teacherStudent(item.id)} className="studio-btn ghost">
                                    Задати домашку
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
};

export default CoursePage;
