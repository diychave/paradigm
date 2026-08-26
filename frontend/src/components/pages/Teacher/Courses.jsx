import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import api from "@services/api";
import { teacherCourse } from "@/teacherPath";

const Courses = () => {
    const [courses, setCourses] = useState([]);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(true);

    useEffect(() => {
        api.learning
            .teacherCourses()
            .then((list) => setCourses(Array.isArray(list) ? list : []))
            .catch((err) => setError(err?.message || "Не вдалося завантажити"))
            .finally(() => setBusy(false));
    }, []);

    return (
        <div className="studio-page">
            <h1>Курси</h1>
            <p className="studio-lead">
                Програма курсу спільна. Домашку задавайте кожній дитині окремо в її картці.
            </p>
            {error && <p className="studio-error">{error}</p>}
            {busy ? (
                <div className="studio-lesson-grid">
                    <div className="studio-skel" />
                    <div className="studio-skel" />
                    <div className="studio-skel" />
                </div>
            ) : courses.length === 0 ? (
                <div className="studio-empty">
                    <BookOpen size={28} />
                    <p>Курсів поки немає</p>
                </div>
            ) : (
                <div className="studio-lesson-grid">
                    {courses.map((course) => (
                        <Link
                            key={course.id}
                            to={teacherCourse(course.id)}
                            className="studio-lesson-card"
                        >
                            <h3>{course.short_title || course.title}</h3>
                            <p>
                                {course.students_count} студентів · {course.topics_count} тем ·{" "}
                                {course.lessons_count} занять
                            </p>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Courses;
