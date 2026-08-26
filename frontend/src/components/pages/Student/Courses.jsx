import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/AuthContext";
import api from "@services/api";
import StudentPage from "./StudentPage";
import useCabinetSync from "@/hooks/useCabinetSync";
import "./StudentPage.css";

const Courses = () => {
    const { user, loading, isAuthenticated } = useAuth();
    const [enrollments, setEnrollments] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!user || user.role !== "student") return;
        let cancelled = false;
        api.learning
            .getMyEnrollments()
            .then((data) => {
                if (!cancelled) setEnrollments(data || []);
            })
            .catch((err) => {
                if (!cancelled) setError(err?.message || "Не вдалося завантажити курси");
            });
        return () => {
            cancelled = true;
        };
    }, [user]);

    useCabinetSync(() => {
        if (!user || user.role !== "student") return;
        api.learning
            .getMyEnrollments()
            .then((data) => setEnrollments(data || []))
            .catch(() => {});
    }, Boolean(user && user.role === "student"));

    if (loading) {
        return (
            <StudentPage title="Мої курси">
                <p className="p-small-secondary">Завантаження...</p>
            </StudentPage>
        );
    }

    if (!isAuthenticated || user.role !== "student") return <Navigate to="/login" replace />;

    return (
        <StudentPage title="Мої курси" description="Оберіть курс, щоб переглянути теми, файли та прогрес.">
            {error && <p className="auth-error">{error}</p>}

            {!enrollments.length ? (
                <div className="student-stub">
                    <p className="p-small-secondary">
                        Поки немає курсів. <Link to="/">Залиште заявку</Link>, і менеджер додасть запис.
                    </p>
                </div>
            ) : (
                <div className="course-tiles">
                    {enrollments.map((course) => (
                        <Link
                            key={course.id}
                            to={`/account/courses/${course.course_id}`}
                            className="course-tile"
                        >
                            <div className="course-tile-media">
                                {course.course_image ? (
                                    <img src={course.course_image} alt="" />
                                ) : (
                                    <span className="course-tile-fallback">
                                        {(course.course_title || "?").slice(0, 1)}
                                    </span>
                                )}
                            </div>
                            <div className="course-tile-body">
                                <h2>{course.course_title}</h2>
                                <p className="p-small-secondary">{course.course_subtitle}</p>
                                <div className="course-tile-progress">
                                    <div className="account-progress">
                                        <i style={{ width: `${course.progress_percent || 0}%` }} />
                                    </div>
                                    <span>
                                        {course.done_count}/{course.total_count} · {course.progress_percent || 0}%
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </StudentPage>
    );
};

export default Courses;
