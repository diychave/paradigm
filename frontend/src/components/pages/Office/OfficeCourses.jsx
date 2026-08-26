import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import api from "@services/api";
import { officeCourse } from "@/staffPath";
import { useStudio } from "@components/pages/Teacher/StudioContext";

const CourseForm = ({ onSubmit, submitLabel }) => {
    const [title, setTitle] = useState("");
    const [subtitle, setSubtitle] = useState("");
    const [age, setAge] = useState("");
    const [description, setDescription] = useState("");
    return (
        <form
            className="studio-form"
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit({
                    title,
                    subtitle,
                    age_range: age,
                    description,
                });
            }}
        >
            <label>
                Назва
                <input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </label>
            <label>
                Підзаголовок
                <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
            </label>
            <label>
                Вік
                <input value={age} onChange={(e) => setAge(e.target.value)} placeholder="8–12 років" />
            </label>
            <label>
                Опис
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </label>
            <button type="submit" className="studio-btn">
                {submitLabel}
            </button>
        </form>
    );
};

const OfficeCourses = () => {
    const { toast, openDrawer, closeDrawer } = useStudio();
    const [courses, setCourses] = useState([]);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(true);

    const load = () => api.office.courses().then((list) => setCourses(Array.isArray(list) ? list : []));

    useEffect(() => {
        load()
            .catch((err) => setError(err?.message || "Не вдалося завантажити"))
            .finally(() => setBusy(false));
    }, []);

    const create = async (payload) => {
        try {
            const created = await api.office.createCourse(payload);
            setCourses((prev) => [...prev, created]);
            closeDrawer();
            toast("Курс створено");
        } catch (err) {
            toast(err?.message || "Не вдалося створити", "err");
        }
    };

    return (
        <div className="studio-page">
            <div className="office-toolbar">
                <div>
                    <h1>Курси</h1>
                    <p className="studio-lead">Додавайте програми. Доступ учням і викладачам відкривається окремо на сторінці курсу.</p>
                </div>
                <button
                    type="button"
                    className="studio-btn"
                    onClick={() =>
                        openDrawer({
                            title: "Новий курс",
                            body: <CourseForm onSubmit={create} submitLabel="Створити курс" />,
                        })
                    }
                >
                    <Plus size={16} /> Новий курс
                </button>
            </div>
            {error && <p className="studio-error">{error}</p>}
            {busy ? (
                <div className="studio-skel tall" />
            ) : (
                <div className="studio-lesson-grid">
                    {courses.map((course) => (
                        <article key={course.id} className="studio-lesson-card">
                            <h3>{course.title}</h3>
                            <p>
                                {course.students_count || 0} учнів · {course.teachers_count || 0} викладачів
                            </p>
                            <Link className="studio-btn ghost" to={officeCourse(course.id)}>
                                Доступ і матеріали
                            </Link>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OfficeCourses;
