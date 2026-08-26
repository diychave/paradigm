import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import api from "@services/api";
import { teacherStudent } from "@/teacherPath";
import { initialsOf } from "./studioUtils";

const Students = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [query, setQuery] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(true);

    useEffect(() => {
        api.learning
            .teacherStudents()
            .then((list) => setStudents(Array.isArray(list) ? list : []))
            .catch((err) => setError(err?.message || "Не вдалося завантажити"))
            .finally(() => setBusy(false));
    }, []);

    const filtered = useMemo(() => {
        const needle = query.trim().toLowerCase();
        if (!needle) return students;
        return students.filter((student) =>
            [student.display_name, student.course_title, student.email, student.username]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(needle))
        );
    }, [students, query]);

    return (
        <div className="studio-page">
            <h1>Студенти</h1>
            <p className="studio-lead">Пошук, прогрес і домашки — в одній таблиці.</p>
            <div className="studio-search">
                <Search size={16} />
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Пошук за ім’ям або курсом"
                />
            </div>
            {error && <p className="studio-error">{error}</p>}
            {busy ? (
                <div className="studio-skel tall" />
            ) : filtered.length === 0 ? (
                <div className="studio-empty">
                    <p>Нікого не знайдено</p>
                    <span>Спробуйте інший запит.</span>
                </div>
            ) : (
                <div className="studio-table-wrap">
                    <table className="studio-table">
                        <thead>
                            <tr>
                                <th>Фото</th>
                                <th>Ім’я</th>
                                <th>Курс</th>
                                <th>Прогрес</th>
                                <th>Домашні</th>
                                <th>Останнє заняття</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((student) => (
                                <tr
                                    key={student.id}
                                    onClick={() => navigate(teacherStudent(student.id))}
                                >
                                    <td>
                                        {student.avatar ? (
                                            <img
                                                className="studio-avatar"
                                                src={student.avatar}
                                                alt=""
                                            />
                                        ) : (
                                            <span className="studio-avatar">
                                                {initialsOf(student.display_name)}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <strong>{student.display_name}</strong>
                                    </td>
                                    <td>{student.course_title || "—"}</td>
                                    <td>
                                        <span className="studio-progress">
                                            <i style={{ width: `${student.progress_percent || 0}%` }} />
                                        </span>
                                        {student.progress_percent || 0}%
                                    </td>
                                    <td>
                                        {student.homework_done || 0} з {student.homework_total || 0} домашніх
                                    </td>
                                    <td>{student.last_lesson || "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Students;
