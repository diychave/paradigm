import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, CalendarClock, CreditCard, Inbox, Users } from "lucide-react";
import { useAuth } from "@/AuthContext";
import api from "@services/api";
import { officeLeads, officeListing, officePeople, officeSchedule, officeTransactions } from "@/staffPath";
import { formatTime, greetingFor, WEEKDAYS } from "@components/pages/Teacher/studioUtils";

const OfficeHome = () => {
    const { user, isAdmin } = useAuth();
    const firstName = (user?.display_name || user?.username || "").split(/\s+/)[0];
    const [data, setData] = useState(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(true);
    const weekday = (new Date().getDay() + 6) % 7;

    useEffect(() => {
        api.office
            .home()
            .then(setData)
            .catch((err) => setError(err?.message || "Не вдалося завантажити"))
            .finally(() => setBusy(false));
    }, []);

    if (busy) {
        return (
            <div className="studio-page">
                <div className="studio-skel wide" />
                <div className="studio-stats office-home-stats">
                    <div className="studio-skel" />
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
            <p className="studio-lead">
                {isAdmin
                    ? "Повний доступ: заявки, курси, люди, розклад і керування платежами."
                    : "Заявки з сайту, курси, акаунти, розклад і перегляд транзакцій."}
            </p>
            {error && <p className="studio-error">{error}</p>}

            <div className="studio-stats office-home-stats">
                <article>
                    <Inbox size={18} />
                    <strong>{data?.new_leads || 0}</strong>
                    <span>Нових заявок</span>
                </article>
                <article>
                    <Users size={18} />
                    <strong>{data?.students || 0}</strong>
                    <span>Студентів</span>
                </article>
                <article>
                    <BookOpen size={18} />
                    <strong>
                        {data?.published_courses || 0}/{data?.courses || 0}
                    </strong>
                    <span>Відкритих курсів</span>
                </article>
                <article>
                    <CalendarClock size={18} />
                    <strong>{data?.today_lessons_count || 0}</strong>
                    <span>Занять сьогодні</span>
                </article>
                <article>
                    <CreditCard size={18} />
                    <strong>{data?.pending_payments || 0}</strong>
                    <span>Очікують оплату</span>
                </article>
            </div>

            <section className="studio-panel">
                <header className="studio-panel-head">
                    <h2>Сьогоднішній розклад школи</h2>
                    <Link to={officeSchedule()}>Календар</Link>
                </header>
                {(data?.today_lessons || []).length === 0 ? (
                    <div className="studio-empty">
                        <CalendarClock size={28} />
                        <p>Сьогодні занять немає</p>
                    </div>
                ) : (
                    <div className="studio-lesson-grid">
                        {data.today_lessons.map((slot) => (
                            <article key={slot.id} className="studio-lesson-card">
                                <time>{formatTime(slot.start_time)}</time>
                                <h3>{slot.short_title}</h3>
                                <p>
                                    {slot.student_name}
                                    {slot.teacher_name ? ` · ${slot.teacher_name}` : ""}
                                </p>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            <section className="studio-panel office-actions">
                <h2>Швидкі дії</h2>
                <ul>
                    <li>
                        <Link to={officeLeads()}>
                            <div>
                                <span>Заявки</span>
                                <strong>
                                    {(data?.new_leads || 0) > 0
                                        ? `${data.new_leads} нових з форми на сайті`
                                        : "Дошка заявок з лістингу"}
                                </strong>
                            </div>
                            <em>Відкрити</em>
                        </Link>
                    </li>
                    <li>
                        <Link to={officePeople()}>
                            <div>
                                <span>Люди</span>
                                <strong>Створити акаунт дитини або викладача</strong>
                            </div>
                            <em>Відкрити</em>
                        </Link>
                    </li>
                    <li>
                        <Link to={officeTransactions()}>
                            <div>
                                <span>Транзакції</span>
                                <strong>
                                    {isAdmin ? "Перегляд і керування платежами" : "Лише перегляд платежів"}
                                </strong>
                            </div>
                            <em>Відкрити</em>
                        </Link>
                    </li>
                    {isAdmin && (
                        <li>
                            <Link to={officeListing()}>
                                <div>
                                    <span>Налаштування лістингу</span>
                                    <strong>Контент публічного сайту</strong>
                                </div>
                                <em>Відкрити</em>
                            </Link>
                        </li>
                    )}
                </ul>
            </section>
        </div>
    );
};

export default OfficeHome;
