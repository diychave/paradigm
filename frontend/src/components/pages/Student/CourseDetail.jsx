import { useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, Navigate, useParams } from "react-router-dom";
import { useAuth } from "@/AuthContext";
import api from "@services/api";
import StudentPage from "./StudentPage";
import useCabinetSync from "@/hooks/useCabinetSync";
import "../Login/AuthPages.css";
import "./CourseDetail.css";

const MATERIAL_ICONS = {
    pdf: "📄",
    doc: "📝",
    ppt: "📊",
    link: "🔗",
    video: "🎬",
};

const TOPIC_STATUS_LABEL = {
    not_started: "Не розпочато",
    in_progress: "В роботі",
    done: "Пройдено",
};

const HW_STATUS_LABEL = {
    not_started: "Не розпочато",
    in_progress: "В роботі",
    submitted: "На перевірці",
    reviewed: "Перевірено",
    done: "Виконано",
    partial: "Частково",
    not_done: "Не виконано",
};

const ResourceRow = ({ item, badge }) => (
    <li>
        <div className="topic-resource">
            <span className="topic-resource-icon" aria-hidden="true">
                {MATERIAL_ICONS[item.type] || "📄"}
            </span>
            <div className="topic-resource-body">
                <p className="topic-resource-title">{item.title}</p>
                {(item.meta || badge) && (
                    <p className="topic-resource-meta">
                        {badge ? <span className="topic-from-teacher">{badge}</span> : null}
                        {badge && item.meta ? " · " : ""}
                        {item.meta}
                    </p>
                )}
            </div>
            <a
                className="topic-open"
                href={item.url || "#"}
                onClick={(e) => e.preventDefault()}
            >
                Відкрити →
            </a>
        </div>
    </li>
);

const plural = (n, one, few, many) => {
    const abs = Math.abs(n) % 100;
    const last = abs % 10;
    if (abs > 10 && abs < 20) return many;
    if (last === 1) return one;
    if (last >= 2 && last <= 4) return few;
    return many;
};

const CourseDetail = () => {
    const { courseId } = useParams();
    const { user, loading, isAuthenticated } = useAuth();
    const [enrollment, setEnrollment] = useState(null);
    const [error, setError] = useState("");
    const [activeSectionId, setActiveSectionId] = useState(null);
    const [expandedTopics, setExpandedTopics] = useState(() => new Set());
    const [sectionsMenuOpen, setSectionsMenuOpen] = useState(false);
    const [activeHomework, setActiveHomework] = useState(null);
    const sectionsMenuId = useId();
    const hwTitleId = useId();

    useEffect(() => {
        if (!user || user.role !== "student" || !courseId) return;
        let cancelled = false;
        api.learning
            .getMyEnrollment(courseId)
            .then((data) => {
                if (cancelled) return;
                setEnrollment(data);
                const first = data.sections?.[0];
                setActiveSectionId((prev) => prev ?? first?.id ?? null);
                setExpandedTopics(new Set());
            })
            .catch((err) => {
                if (!cancelled) setError(err?.message || "Курс не знайдено");
            });
        return () => {
            cancelled = true;
        };
    }, [user, courseId]);

    useCabinetSync(() => {
        if (!user || user.role !== "student" || !courseId) return;
        api.learning
            .getMyEnrollment(courseId)
            .then((data) => {
                setEnrollment(data);
                setActiveHomework((prev) => {
                    if (!prev) return prev;
                    const next = data.sections
                        ?.flatMap((section) => section.topics || [])
                        .flatMap((topic) => topic.assignments || [])
                        .find((item) => item.id === prev.id);
                    return next ? { ...prev, ...next } : prev;
                });
            })
            .catch(() => {});
    }, Boolean(user && user.role === "student" && courseId));

    useEffect(() => {
        if (!sectionsMenuOpen && !activeHomework) return undefined;
        const onKey = (e) => {
            if (e.key !== "Escape") return;
            if (activeHomework) setActiveHomework(null);
            else if (sectionsMenuOpen) setSectionsMenuOpen(false);
        };
        const onPointer = (e) => {
            if (!sectionsMenuOpen) return;
            const root = document.getElementById("course-sections-dropdown");
            if (root && !root.contains(e.target)) setSectionsMenuOpen(false);
        };
        if (activeHomework) document.body.style.overflow = "hidden";
        window.addEventListener("keydown", onKey);
        document.addEventListener("pointerdown", onPointer);
        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", onKey);
            document.removeEventListener("pointerdown", onPointer);
        };
    }, [sectionsMenuOpen, activeHomework]);

    const sections = enrollment?.sections || [];
    const activeSection = useMemo(
        () => sections.find((s) => s.id === activeSectionId) || sections[0] || null,
        [sections, activeSectionId]
    );

    const openHomework = (hw, topic) => {
        setActiveHomework({
            ...hw,
            topicTitle: topic.title,
            topicNumber: topic.number,
            sectionTitle: activeSection?.title,
        });
    };

    const closeHomework = () => setActiveHomework(null);

    const selectSection = (id) => {
        setActiveSectionId(id);
        setExpandedTopics(new Set());
        setSectionsMenuOpen(false);
    };

    const toggleTopic = (topicId) => {
        setExpandedTopics((prev) => {
            const next = new Set(prev);
            if (next.has(topicId)) next.delete(topicId);
            else next.add(topicId);
            return next;
        });
    };

    if (loading) {
        return (
            <StudentPage title="Курс">
                <p className="p-small-secondary">Завантаження...</p>
            </StudentPage>
        );
    }

    if (!isAuthenticated || user?.role !== "student") return <Navigate to="/login" replace />;

    const renderSidebar = () => (
        <aside className="course-sidebar">
            <div className="course-sidebar-head">
                <div className="course-sidebar-progress">
                    <div className="course-sidebar-progress-meta">
                        <span>Прогрес курсу</span>
                        <strong>{enrollment?.progress_percent ?? 0}%</strong>
                    </div>
                    <div
                        className="course-sidebar-bar"
                        role="progressbar"
                        aria-valuenow={enrollment?.progress_percent ?? 0}
                        aria-valuemin={0}
                        aria-valuemax={100}
                    >
                        <i style={{ width: `${enrollment?.progress_percent ?? 0}%` }} />
                    </div>
                </div>
            </div>

            <nav className="course-sidebar-nav" aria-label="Розділи курсу">
                {sections.map((section) => {
                    const active = section.id === activeSection?.id;
                    return (
                        <button
                            key={section.id}
                            type="button"
                            className={`course-sidebar-item${active ? " is-active" : ""}`}
                            onClick={() => selectSection(section.id)}
                            aria-current={active ? "true" : undefined}
                        >
                            <span className="course-sidebar-dot" aria-hidden="true" />
                            <span>{section.title}</span>
                        </button>
                    );
                })}
            </nav>
        </aside>
    );

    return (
        <StudentPage
            title={enrollment?.course_title || "Курс"}
            description={enrollment?.course_subtitle || enrollment?.course_description}
            leading={
                <p className="course-workspace-back">
                    <Link to="/account/courses">← До всіх курсів</Link>
                </p>
            }
        >
            {error && <p className="auth-error">{error}</p>}

            {!enrollment && !error && <p className="p-small-secondary">Завантаження...</p>}

            {enrollment && (
                <div className="course-workspace-panel">
                    <div className="course-mobile-bar">
                        <div className="course-mobile-progress">
                            <div className="course-mobile-progress-meta">
                                <span>Прогрес курсу</span>
                                <strong>{enrollment.progress_percent}%</strong>
                            </div>
                            <div
                                className="course-sidebar-bar"
                                role="progressbar"
                                aria-valuenow={enrollment.progress_percent}
                                aria-valuemin={0}
                                aria-valuemax={100}
                            >
                                <i style={{ width: `${enrollment.progress_percent}%` }} />
                            </div>
                        </div>

                        <div
                            className={`course-sections-dropdown${sectionsMenuOpen ? " is-open" : ""}`}
                            id="course-sections-dropdown"
                        >
                            <button
                                type="button"
                                className="course-sections-btn"
                                onClick={() => setSectionsMenuOpen((v) => !v)}
                                aria-expanded={sectionsMenuOpen}
                                aria-controls={sectionsMenuId}
                            >
                                <span className="course-sections-btn-copy">
                                    <span className="course-sections-btn-label">Розділи курсу</span>
                                    <span className="course-sections-btn-value">
                                        {activeSection?.title || "Оберіть розділ"}
                                    </span>
                                </span>
                                <span className="course-sections-btn-chevron" aria-hidden="true">
                                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                                        <path
                                            d="M5 7.5L10 12.5L15 7.5"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </span>
                            </button>

                            <div
                                className="course-sections-menu-wrap"
                                id={sectionsMenuId}
                                aria-hidden={!sectionsMenuOpen}
                            >
                                <div
                                    className="course-sections-menu"
                                    role="listbox"
                                    aria-label="Розділи курсу"
                                >
                                    {sections.map((section) => {
                                        const active = section.id === activeSection?.id;
                                        return (
                                            <button
                                                key={section.id}
                                                type="button"
                                                role="option"
                                                aria-selected={active}
                                                tabIndex={sectionsMenuOpen ? 0 : -1}
                                                className={`course-sections-option${active ? " is-active" : ""}`}
                                                onClick={() => selectSection(section.id)}
                                            >
                                                <span className="course-sidebar-dot" aria-hidden="true" />
                                                <span>{section.title}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="course-layout">
                        <div className="course-sidebar-desktop">{renderSidebar()}</div>

                        <section className="course-main" aria-live="polite">
                            {activeSection ? (
                                <>
                                    <div className="course-main-head">
                                        <h2>{activeSection.title}</h2>
                                        <p>
                                            {activeSection.topics_count}{" "}
                                            {plural(
                                                activeSection.topics_count,
                                                "тема",
                                                "теми",
                                                "тем"
                                            )}
                                        </p>
                                    </div>

                                            <div className="course-topic-stack">
                                                {activeSection.topics.length === 0 ? (
                                                    <p className="p-small-secondary">
                                                        Викладач ще не відкрив теми в цьому розділі.
                                                    </p>
                                                ) : (
                                                activeSection.topics.map((topic) => {
                                                    const open = expandedTopics.has(topic.id);
                                                    const panelId = `topic-panel-${topic.id}`;
                                                    return (
                                                        <article
                                                            key={topic.id}
                                                            className={`topic-card${open ? " is-open" : ""}${
                                                                topic.status === "done" ? " is-done" : ""
                                                            }`}
                                                        >
                                                            <button
                                                                type="button"
                                                                className="topic-card-toggle"
                                                                aria-expanded={open}
                                                                aria-controls={panelId}
                                                                onClick={() => toggleTopic(topic.id)}
                                                            >
                                                                <span className="topic-card-num">
                                                                    {topic.number}
                                                                </span>
                                                                <span className="topic-card-copy">
                                                                    <span className="topic-card-title">
                                                                        {topic.title}
                                                                    </span>
                                                                    {topic.description && (
                                                                        <span className="topic-card-desc">
                                                                            {topic.description}
                                                                        </span>
                                                                    )}
                                                                </span>
                                                                <span className="topic-card-meta">
                                                                    <span className="topic-meta-chip">
                                                                        <span aria-hidden="true">📄</span>
                                                                        {topic.materials_count}{" "}
                                                                        {plural(
                                                                            topic.materials_count,
                                                                            "матеріал",
                                                                            "матеріали",
                                                                            "матеріалів"
                                                                        )}
                                                                    </span>
                                                                    <span className="topic-meta-chip">
                                                                        <span aria-hidden="true">📝</span>
                                                                        {topic.assignments_count}{" "}
                                                                        {plural(
                                                                            topic.assignments_count,
                                                                            "домашка",
                                                                            "домашки",
                                                                            "домашок"
                                                                        )}
                                                                    </span>
                                                                    <span
                                                                        className={`topic-status topic-status--${topic.status}`}
                                                                    >
                                                                        {topic.status === "done" && (
                                                                            <span aria-hidden="true">✓</span>
                                                                        )}
                                                                        {TOPIC_STATUS_LABEL[topic.status] ||
                                                                            topic.status_label}
                                                                    </span>
                                                                </span>
                                                                <span
                                                                    className="topic-card-chevron"
                                                                    aria-hidden="true"
                                                                >
                                                                    <svg
                                                                        width="20"
                                                                        height="20"
                                                                        viewBox="0 0 20 20"
                                                                        fill="none"
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                    >
                                                                        <path
                                                                            d="M5 7.5L10 12.5L15 7.5"
                                                                            stroke="currentColor"
                                                                            strokeWidth="1.8"
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                        />
                                                                    </svg>
                                                                </span>
                                                            </button>

                                                            <div
                                                                id={panelId}
                                                                className="topic-card-panel"
                                                                aria-hidden={!open}
                                                            >
                                                                <div className="topic-card-panel-inner">
                                                                    <div className="topic-block">
                                                                        <h3 className="topic-block-title">
                                                                            Матеріали курсу
                                                                        </h3>
                                                                        {topic.materials.length === 0 &&
                                                                        !(topic.extra_materials || []).length ? (
                                                                            <p className="topic-empty">
                                                                                Матеріалів поки немає
                                                                            </p>
                                                                        ) : (
                                                                            <ul className="topic-resource-list">
                                                                                {topic.materials.map((m) => (
                                                                                    <ResourceRow key={m.id} item={m} />
                                                                                ))}
                                                                                {(topic.extra_materials || []).map((m) => (
                                                                                    <ResourceRow
                                                                                        key={`extra-${m.id}`}
                                                                                        item={m}
                                                                                        badge="Від викладача"
                                                                                    />
                                                                                ))}
                                                                            </ul>
                                                                        )}
                                                                    </div>

                                                                    <div className="topic-divider" />

                                                                    <div className="topic-block">
                                                                        <h3 className="topic-block-title">
                                                                            Домашнє завдання
                                                                        </h3>
                                                                        {topic.assignments.length === 0 ? (
                                                                            <p className="topic-empty">
                                                                                Викладач ще не задав домашнє з цієї теми
                                                                            </p>
                                                                        ) : (
                                                                            <ul className="topic-hw-list">
                                                                                {topic.assignments.map((hw) => (
                                                                                    <li
                                                                                        key={hw.id}
                                                                                        className="topic-hw"
                                                                                    >
                                                                                        <div className="topic-hw-top">
                                                                                            <span
                                                                                                aria-hidden="true"
                                                                                            >
                                                                                                📝
                                                                                            </span>
                                                                                            <div>
                                                                                                <p className="topic-hw-title">
                                                                                                    {hw.title}
                                                                                                </p>
                                                                                                {hw.description && (
                                                                                                    <p className="topic-hw-desc">
                                                                                                        {
                                                                                                            hw.description
                                                                                                        }
                                                                                                    </p>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="topic-hw-foot">
                                                                                            <div
                                                                                                className={`topic-hw-status topic-hw-status--${hw.status}`}
                                                                                            >
                                                                                                {hw.status ===
                                                                                                "reviewed"
                                                                                                    ? "✓ "
                                                                                                    : ""}
                                                                                                {HW_STATUS_LABEL[
                                                                                                    hw.status
                                                                                                ] ||
                                                                                                    hw.status_label}
                                                                                                {hw.status ===
                                                                                                    "reviewed" &&
                                                                                                    hw.grade && (
                                                                                                        <span className="topic-hw-grade">
                                                                                                            Оцінка:{" "}
                                                                                                            {hw.grade}
                                                                                                        </span>
                                                                                                    )}
                                                                                            </div>
                                                                                            <button
                                                                                                type="button"
                                                                                                className="topic-open"
                                                                                                onClick={() =>
                                                                                                    openHomework(hw, topic)
                                                                                                }
                                                                                            >
                                                                                                Відкрити →
                                                                                            </button>
                                                                                        </div>
                                                                                    </li>
                                                                                ))}
                                                                            </ul>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </article>
                                                    );
                                                })
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <p className="p-small-secondary">
                                            Викладач відкриє першу тему після заняття.
                                        </p>
                                    )}
                                </section>
                            </div>
                </div>
            )}

            {activeHomework &&
                createPortal(
                    <div
                        className="hw-modal-root"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) closeHomework();
                        }}
                    >
                        <div
                            className="hw-modal"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby={hwTitleId}
                        >
                            <div className="hw-modal-top">
                                <p className="hw-modal-eyebrow">Домашнє завдання</p>
                                <button
                                    type="button"
                                    className="hw-modal-close"
                                    onClick={closeHomework}
                                    aria-label="Закрити"
                                >
                                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                                        <path
                                            d="M4.5 4.5L13.5 13.5M13.5 4.5L4.5 13.5"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </button>
                            </div>

                            <h2 id={hwTitleId} className="hw-modal-title">
                                {activeHomework.title}
                            </h2>

                            {(activeHomework.sectionTitle || activeHomework.topicTitle) && (
                                <p className="hw-modal-path">
                                    {[activeHomework.sectionTitle, activeHomework.topicNumber && `${activeHomework.topicNumber} ${activeHomework.topicTitle}`]
                                        .filter(Boolean)
                                        .join(" · ")}
                                </p>
                            )}

                            {activeHomework.description && (
                                <p className="hw-modal-desc">{activeHomework.description}</p>
                            )}

                            <div className="hw-modal-meta">
                                <div className={`hw-modal-badge topic-hw-status--${activeHomework.status}`}>
                                    {activeHomework.status === "reviewed" ? "✓ " : ""}
                                    {HW_STATUS_LABEL[activeHomework.status] ||
                                        activeHomework.status_label}
                                </div>
                                {activeHomework.status === "reviewed" && activeHomework.grade && (
                                    <div className="hw-modal-grade">
                                        Оцінка: <strong>{activeHomework.grade}</strong>
                                    </div>
                                )}
                            </div>

                            <div className="hw-modal-body">
                                <h3>Умова завдання</h3>
                                <p>
                                    Виконайте практичні вправи за темою «{activeHomework.topicTitle}».
                                    Завантажте рішення у зручному форматі (скрін, файл коду або посилання)
                                    та надішліть на перевірку.
                                </p>
                                <ul>
                                    <li>Уважно прочитайте опис завдання</li>
                                    <li>Зробіть роботу самостійно</li>
                                    <li>Перевірте результат перед відправкою</li>
                                </ul>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
        </StudentPage>
    );
};

export default CourseDetail;
