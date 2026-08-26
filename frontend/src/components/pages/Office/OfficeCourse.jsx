import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    ArrowLeft,
    ChevronRight,
    Copy,
    Ellipsis,
    FileText,
    Folder,
    GripVertical,
    Link2,
    MoreHorizontal,
    Pencil,
    Plus,
    Search,
    Trash2,
    Video,
    X,
} from "lucide-react";
import api from "@services/api";
import { officeCourses } from "@/staffPath";
import { initialsOf } from "@components/pages/Teacher/studioUtils";
import "./officeCourse.css";

const TYPES = [
    { id: "pdf", label: "PDF", Icon: FileText },
    { id: "doc", label: "Документ", Icon: FileText },
    { id: "ppt", label: "Презентація", Icon: FileText },
    { id: "zip", label: "ZIP", Icon: FileText },
    { id: "link", label: "Посилання", Icon: Link2 },
    { id: "video", label: "Відео", Icon: Video },
];

const typeMeta = (id) => TYPES.find((item) => item.id === id) || TYPES[0];

const storageKey = (id) => `paradigm-ced-${id}`;

const loadUi = (id) => {
    try {
        return JSON.parse(localStorage.getItem(storageKey(id)) || "{}");
    } catch {
        return {};
    }
};

const formatUpdated = (value) => {
    if (!value) return "щойно";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "щойно";
    const diff = Date.now() - date.getTime();
    if (diff < 60_000) return "щойно";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} хв тому`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} год тому`;
    if (diff < 172_800_000) return "вчора";
    return date.toLocaleDateString("uk-UA", { day: "numeric", month: "short" });
};

const AccessPicker = ({ people, available, onAdd, onRemove }) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const box = useRef(null);
    const filtered = available.filter((person) =>
        `${person.display_name} ${person.username}`.toLowerCase().includes(query.trim().toLowerCase())
    );

    useEffect(() => {
        const close = (event) => {
            if (box.current && !box.current.contains(event.target)) setOpen(false);
        };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);

    return (
        <div className="ced-access-body" ref={box}>
            <div className="ced-people">
                {people.length === 0 ? (
                    <p className="ced-muted">Поки нікого не додано</p>
                ) : (
                    people.map((person) => (
                        <span key={person.id} className="ced-tag">
                            <span className="ced-ava">
                                {person.avatar ? (
                                    <img src={person.avatar} alt="" />
                                ) : (
                                    initialsOf(person.display_name)
                                )}
                            </span>
                            {person.display_name}
                            <button type="button" onClick={() => onRemove(person.id)} aria-label="Прибрати">
                                <X size={14} />
                            </button>
                        </span>
                    ))
                )}
            </div>
            <div className="ced-picker">
                <Search size={16} />
                <input
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    placeholder="Пошук і додавання"
                />
                <button
                    type="button"
                    className="ced-btn"
                    onClick={() => setOpen((value) => !value)}
                >
                    <Plus size={16} /> Додати
                </button>
                {open && (
                    <div className="ced-menu ced-picker-menu">
                        {filtered.length === 0 ? (
                            <p>Нікого не знайдено</p>
                        ) : (
                            filtered.map((person) => (
                                <button
                                    key={person.id}
                                    type="button"
                                    onClick={() => {
                                        onAdd(person.id);
                                        setQuery("");
                                        setOpen(false);
                                    }}
                                >
                                    <span className="ced-ava sm">
                                        {person.avatar ? (
                                            <img src={person.avatar} alt="" />
                                        ) : (
                                            initialsOf(person.display_name)
                                        )}
                                    </span>
                                    {person.display_name}
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const MaterialModal = ({ initial, onClose, onSave }) => {
    const [title, setTitle] = useState(initial.title || "");
    const [type, setType] = useState(initial.type || "pdf");
    const [url, setUrl] = useState(initial.url === "#" ? "" : initial.url || "");
    return (
        <div className="ced-modal-root">
            <button type="button" className="ced-backdrop" onClick={onClose} />
            <form
                className="ced-modal"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (!title.trim()) return;
                    onSave({ title: title.trim(), type, url: url.trim() || "#" });
                }}
            >
                <h3>{initial.id ? "Редагувати матеріал" : "Новий матеріал"}</h3>
                <label>
                    Назва
                    <input value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
                </label>
                <label>
                    Тип
                    <select value={type} onChange={(e) => setType(e.target.value)}>
                        {TYPES.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.label}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    Посилання
                    <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
                </label>
                <div className="ced-modal-actions">
                    <button type="button" className="ced-btn ghost" onClick={onClose}>
                        Скасувати
                    </button>
                    <button type="submit" className="ced-btn">
                        Зберегти
                    </button>
                </div>
            </form>
        </div>
    );
};

const OfficeCourse = () => {
    const { courseId } = useParams();
    const [course, setCourse] = useState(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(true);
    const [saveState, setSaveState] = useState("saved");
    const [accessTab, setAccessTab] = useState("student");
    const [selectedId, setSelectedId] = useState(null);
    const [openTopics, setOpenTopics] = useState([]);
    const [editingTitle, setEditingTitle] = useState(false);
    const [editingSection, setEditingSection] = useState(false);
    const [addingTopic, setAddingTopic] = useState(false);
    const [topicDraft, setTopicDraft] = useState("");
    const [moreOpen, setMoreOpen] = useState(false);
    const [menu, setMenu] = useState(null);
    const [modal, setModal] = useState(null);
    const [selected, setSelected] = useState([]);
    const [drag, setDrag] = useState(null);
    const selectedRef = useRef(null);
    const addingLock = useRef(false);
    selectedRef.current = selectedId;

    const persistUi = (nextSelected, nextOpen) => {
        localStorage.setItem(
            storageKey(courseId),
            JSON.stringify({ selectedId: nextSelected, openTopics: nextOpen })
        );
    };

    const load = async () => {
        const data = await api.office.course(courseId);
        setCourse(data);
        const ui = loadUi(courseId);
        const firstId = data.sections?.[0]?.id || null;
        const preferred = selectedRef.current || ui.selectedId;
        const nextSelected = data.sections?.some((item) => item.id === preferred) ? preferred : firstId;
        setSelectedId(nextSelected);
        const topicIds = new Set(
            (data.sections || []).flatMap((section) => (section.topics || []).map((topic) => topic.id))
        );
        setOpenTopics((prev) => {
            const next = [...new Set([...(ui.openTopics || []), ...prev])].filter((id) => topicIds.has(id));
            return next;
        });
        return data;
    };

    useEffect(() => {
        load()
            .catch((err) => setError(err?.message || "Не вдалося завантажити"))
            .finally(() => setBusy(false));
    }, [courseId]);

    useEffect(() => {
        const close = (event) => {
            if (event.target.closest(".ced-more, .ced-file")) return;
            setMoreOpen(false);
            setMenu(null);
        };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);

    const markDirty = () => {
        setSaveState((prev) => (prev === "saving" ? prev : "dirty"));
    };

    const run = async (fn, nextCourse) => {
        setSaveState("saving");
        try {
            const result = await fn();
            if (nextCourse) setCourse(nextCourse);
            else await load();
            setSaveState("saved");
            return result;
        } catch (err) {
            setSaveState("error");
            setError(err?.message || "Не вдалося зберегти");
            throw err;
        }
    };

    const selectedSection = (course?.sections || []).find((item) => item.id === selectedId) || null;
    const visibleTopics = selectedSection?.topics || [];

    const selectSection = (id) => {
        setSelectedId(id);
        persistUi(id, openTopics);
        setEditingSection(false);
        setAddingTopic(false);
    };

    const toggleTopic = (id) => {
        const next = openTopics.includes(id)
            ? openTopics.filter((item) => item !== id)
            : [...openTopics, id];
        setOpenTopics(next);
        persistUi(selectedId, next);
    };

    const addSection = async () => {
        const created = await run(() => api.office.addSection(courseId, "Новий розділ"));
        if (created?.id) {
            selectSection(created.id);
            setEditingSection(true);
        }
    };

    const addTopic = async () => {
        if (!selectedSection || addingLock.current) return;
        addingLock.current = true;
        const title = topicDraft.trim() || "Нова тема";
        try {
            const created = await run(() => api.office.addTopic(selectedSection.id, { title }));
            setTopicDraft("");
            setAddingTopic(false);
            if (created?.id) {
                const next = [...openTopics, created.id];
                setOpenTopics(next);
                persistUi(selectedId, next);
            }
        } finally {
            addingLock.current = false;
        }
    };

    const reorderSections = async (fromId, toId) => {
        const list = [...(course.sections || [])];
        const from = list.findIndex((item) => item.id === fromId);
        const to = list.findIndex((item) => item.id === toId);
        if (from < 0 || to < 0 || from === to) return;
        const [item] = list.splice(from, 1);
        list.splice(to, 0, item);
        setCourse({ ...course, sections: list });
        await run(() => api.office.reorder(courseId, { sections: list.map((row) => row.id) }), {
            ...course,
            sections: list,
        });
    };

    const reorderTopics = async (fromId, toId) => {
        if (!selectedSection) return;
        const list = [...(selectedSection.topics || [])];
        const from = list.findIndex((item) => item.id === fromId);
        const to = list.findIndex((item) => item.id === toId);
        if (from < 0 || to < 0 || from === to) return;
        const [item] = list.splice(from, 1);
        list.splice(to, 0, item);
        const sections = course.sections.map((section) =>
            section.id === selectedSection.id ? { ...section, topics: list } : section
        );
        setCourse({ ...course, sections });
        await run(
            () => api.office.reorder(courseId, { topics: { [selectedSection.id]: list.map((row) => row.id) } }),
            { ...course, sections }
        );
    };

    const reorderMaterials = async (topic, fromId, toId) => {
        const list = [...(topic.materials || [])];
        const from = list.findIndex((item) => item.id === fromId);
        const to = list.findIndex((item) => item.id === toId);
        if (from < 0 || to < 0 || from === to) return;
        const [item] = list.splice(from, 1);
        list.splice(to, 0, item);
        const sections = course.sections.map((section) => ({
            ...section,
            topics: section.topics.map((row) => (row.id === topic.id ? { ...row, materials: list } : row)),
        }));
        setCourse({ ...course, sections });
        await run(
            () => api.office.reorder(courseId, { materials: { [topic.id]: list.map((row) => row.id) } }),
            { ...course, sections }
        );
    };

    const toggleSelect = (id) => {
        setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
    };

    if (busy) return <div className="ced ced-loading" />;
    if (!course) {
        return (
            <div className="ced">
                <p className="ced-error">{error || "Курс не знайдено"}</p>
                <Link to={officeCourses()}>← До курсів</Link>
            </div>
        );
    }

    const counts = {
        sections: course.sections_count ?? course.sections.length,
        topics:
            course.topics_count ??
            course.sections.reduce((sum, section) => sum + (section.topics?.length || 0), 0),
        materials:
            course.materials_count ??
            course.sections.reduce(
                (sum, section) =>
                    sum +
                    (section.topics || []).reduce((acc, topic) => acc + (topic.materials?.length || 0), 0),
                0
            ),
    };
    const allTopics = (course.sections || []).flatMap((section) =>
        (section.topics || []).map((topic) => ({ ...topic, sectionTitle: section.title }))
    );

    return (
        <div className="ced">
            <header className="ced-top">
                <div>
                    <Link className="ced-back" to={officeCourses()}>
                        <ArrowLeft size={16} /> Назад до курсів
                    </Link>
                    {editingTitle ? (
                        <input
                            className="ced-title-input"
                            defaultValue={course.title}
                            autoFocus
                            onChange={markDirty}
                            onBlur={async (e) => {
                                const title = e.target.value.trim();
                                setEditingTitle(false);
                                if (title && title !== course.title) {
                                    await run(() => api.office.updateCourse(courseId, { title }));
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") e.currentTarget.blur();
                            }}
                        />
                    ) : (
                        <h1 onDoubleClick={() => setEditingTitle(true)}>{course.title}</h1>
                    )}
                    <p className="ced-meta">
                        {counts.sections} розділів · {counts.topics} тем · {counts.materials} матеріалів ·{" "}
                        змінено {formatUpdated(course.updated_at)}
                    </p>
                </div>
                <div className="ced-top-actions">
                    <button
                        type="button"
                        className={`ced-btn save is-${saveState}`}
                        disabled={saveState === "saved"}
                        onClick={() => {
                            if (document.activeElement instanceof HTMLElement) {
                                document.activeElement.blur();
                            }
                            run(() => load());
                        }}
                    >
                        Зберегти
                    </button>
                    <div className="ced-more" onMouseDown={(e) => e.stopPropagation()}>
                        <button type="button" className="ced-icon" onClick={() => setMoreOpen((v) => !v)}>
                            <Ellipsis size={18} />
                        </button>
                        {moreOpen && (
                            <div className="ced-menu">
                                <button type="button" onClick={() => { setEditingTitle(true); setMoreOpen(false); }}>
                                    Перейменувати курс
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {error && <p className="ced-error">{error}</p>}

            <section className="ced-card ced-access">
                <div className="ced-tabs">
                    <button
                        type="button"
                        className={accessTab === "student" ? "is-on" : ""}
                        onClick={() => setAccessTab("student")}
                    >
                        Учні
                    </button>
                    <button
                        type="button"
                        className={accessTab === "teacher" ? "is-on" : ""}
                        onClick={() => setAccessTab("teacher")}
                    >
                        Викладачі
                    </button>
                </div>
                {accessTab === "student" ? (
                    <AccessPicker
                        people={course.student_access || []}
                        available={course.available_students || []}
                        onAdd={(id) => run(() => api.office.grantStudent(courseId, id))}
                        onRemove={(id) => run(() => api.office.revokeAccess(courseId, id, "student"))}
                    />
                ) : (
                    <AccessPicker
                        people={course.teacher_access || []}
                        available={course.available_teachers || []}
                        onAdd={(id) => run(() => api.office.grantTeacher(courseId, id))}
                        onRemove={(id) => run(() => api.office.revokeAccess(courseId, id, "teacher"))}
                    />
                )}
            </section>

            <div className="ced-split">
                <aside className="ced-card ced-nav">
                    <p>Розділи</p>
                    {(course.sections || []).map((section) => (
                        <button
                            key={section.id}
                            type="button"
                            className={`ced-nav-item${section.id === selectedId ? " is-on" : ""}${
                                drag?.id === section.id ? " is-drag" : ""
                            }${drag?.over === section.id && drag?.kind === "section" ? " is-drop" : ""}`}
                            draggable
                            onDragStart={() => setDrag({ kind: "section", id: section.id })}
                            onDragOver={(e) => {
                                e.preventDefault();
                                setDrag((prev) => (prev ? { ...prev, over: section.id } : prev));
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                if (drag?.kind === "section") reorderSections(drag.id, section.id);
                                setDrag(null);
                            }}
                            onDragEnd={() => setDrag(null)}
                            onClick={() => selectSection(section.id)}
                        >
                            <GripVertical size={14} />
                            <Folder size={16} />
                            <span>{section.title}</span>
                        </button>
                    ))}
                    <button type="button" className="ced-nav-add" onClick={addSection}>
                        <Plus size={16} /> Новий розділ
                    </button>
                </aside>

                <section className="ced-main">
                    {!selectedSection ? (
                        <div className="ced-empty">Оберіть розділ зліва або створіть новий.</div>
                    ) : (
                        <>
                            <header className="ced-section-head">
                                <span className="ced-grip" aria-hidden>
                                    <GripVertical size={16} />
                                </span>
                                {editingSection ? (
                                    <input
                                        className="ced-title-input sm"
                                        defaultValue={selectedSection.title}
                                        autoFocus
                                        onChange={markDirty}
                                        onBlur={async (e) => {
                                            const title = e.target.value.trim();
                                            setEditingSection(false);
                                            if (title && title !== selectedSection.title) {
                                                await run(() => api.office.updateSection(selectedSection.id, { title }));
                                            }
                                        }}
                                        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                                    />
                                ) : (
                                    <h2>{selectedSection.title}</h2>
                                )}
                                <div className="ced-hover-actions">
                                    <button type="button" onClick={() => setEditingSection(true)} aria-label="Редагувати">
                                        <Pencil size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (!window.confirm("Видалити розділ?")) return;
                                            await run(() => api.office.deleteSection(selectedSection.id));
                                        }}
                                        aria-label="Видалити"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </header>

                            {visibleTopics.map((topic) => {
                                const open = openTopics.includes(topic.id);
                                const materials = topic.materials || [];
                                return (
                                    <article
                                        key={topic.id}
                                        className={`ced-topic${open ? " is-open" : ""}${
                                            drag?.over === topic.id && (drag?.kind === "topic" || drag?.kind === "material")
                                                ? " is-drop"
                                                : ""
                                        }`}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            setDrag((prev) => (prev ? { ...prev, over: topic.id } : prev));
                                        }}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            if (drag?.kind === "topic") reorderTopics(drag.id, topic.id);
                                            if (drag?.kind === "material" && drag.topicId !== topic.id) {
                                                run(() => api.office.updateMaterial(drag.id, { topic_id: topic.id }));
                                            }
                                            setDrag(null);
                                        }}
                                    >
                                        {drag?.over === topic.id && drag?.kind === "topic" && drag.id !== topic.id && (
                                            <div className="ced-drop-line" />
                                        )}
                                        <button
                                            type="button"
                                            className="ced-topic-head"
                                            draggable
                                            onDragStart={() => setDrag({ kind: "topic", id: topic.id })}
                                            onDragEnd={() => setDrag(null)}
                                            onClick={() => toggleTopic(topic.id)}
                                        >
                                            <ChevronRight size={16} />
                                            <div>
                                                <strong>{topic.title}</strong>
                                                <span>
                                                    {topic.materials?.length || 0} матеріалів · змінено{" "}
                                                    {formatUpdated(topic.updated_at || course.updated_at)}
                                                </span>
                                            </div>
                                        </button>
                                        <div className="ced-hover-actions">
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    if (!window.confirm("Видалити тему?")) return;
                                                    await run(() => api.office.deleteTopic(topic.id));
                                                }}
                                                aria-label="Видалити"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                        {open && (
                                            <div className="ced-topic-body">
                                                <input
                                                    className="ced-inline"
                                                    defaultValue={topic.title}
                                                    onChange={markDirty}
                                                    onBlur={(e) => {
                                                        const title = e.target.value.trim();
                                                        if (title && title !== topic.title) {
                                                            run(() => api.office.updateTopic(topic.id, { title }));
                                                        }
                                                    }}
                                                />
                                                <textarea
                                                    className="ced-inline area"
                                                    defaultValue={topic.description}
                                                    placeholder="Опис (необов’язково)"
                                                    onChange={markDirty}
                                                    onBlur={(e) => {
                                                        const description = e.target.value.trim();
                                                        if (description !== (topic.description || "")) {
                                                            run(() => api.office.updateTopic(topic.id, { description }));
                                                        }
                                                    }}
                                                />
                                                {materials.map((item) => {
                                                    const meta = typeMeta(item.type);
                                                    return (
                                                        <div
                                                            key={item.id}
                                                            className={`ced-file${selected.includes(item.id) ? " is-on" : ""}${
                                                                drag?.over === item.id && drag?.kind === "material"
                                                                    ? " is-drop"
                                                                    : ""
                                                            }`}
                                                            draggable
                                                            onDragStart={(e) => {
                                                                e.stopPropagation();
                                                                setDrag({ kind: "material", id: item.id, topicId: topic.id });
                                                            }}
                                                            onDragOver={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                setDrag((prev) => (prev ? { ...prev, over: item.id } : prev));
                                                            }}
                                                            onDrop={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                if (drag?.kind === "material" && drag.topicId === topic.id) {
                                                                    reorderMaterials(topic, drag.id, item.id);
                                                                } else if (drag?.kind === "material") {
                                                                    run(() => api.office.updateMaterial(drag.id, { topic_id: topic.id }));
                                                                }
                                                                setDrag(null);
                                                            }}
                                                            onDragEnd={() => setDrag(null)}
                                                        >
                                                            <label className="ced-check" onMouseDown={(e) => e.stopPropagation()}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selected.includes(item.id)}
                                                                    onChange={() => toggleSelect(item.id)}
                                                                />
                                                            </label>
                                                            <span className="ced-file-icon">
                                                                <meta.Icon size={18} />
                                                            </span>
                                                            <div>
                                                                <strong>{item.title}</strong>
                                                                <span>
                                                                    {meta.label}
                                                                    {item.url && item.url !== "#" ? ` · ${item.url}` : ""}
                                                                </span>
                                                            </div>
                                                            <div className="ced-hover-actions">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setModal({ ...item, topicId: topic.id })}
                                                                    aria-label="Редагувати"
                                                                >
                                                                    <Pencil size={15} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => run(() => api.office.duplicateMaterial(item.id))}
                                                                    aria-label="Дублікат"
                                                                >
                                                                    <Copy size={15} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => run(() => api.office.deleteMaterial(item.id))}
                                                                    aria-label="Видалити"
                                                                >
                                                                    <Trash2 size={15} />
                                                                </button>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                className="ced-icon"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setMenu(menu === item.id ? null : item.id);
                                                                }}
                                                            >
                                                                <MoreHorizontal size={16} />
                                                            </button>
                                                            {menu === item.id && (
                                                                <div className="ced-menu ced-file-menu">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setModal({ ...item, topicId: topic.id });
                                                                            setMenu(null);
                                                                        }}
                                                                    >
                                                                        Редагувати
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            run(() => api.office.duplicateMaterial(item.id));
                                                                            setMenu(null);
                                                                        }}
                                                                    >
                                                                        Дублювати
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            run(() => api.office.deleteMaterial(item.id));
                                                                            setMenu(null);
                                                                        }}
                                                                    >
                                                                        Видалити
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                                <button
                                                    type="button"
                                                    className="ced-add-file"
                                                    onClick={() => setModal({ topicId: topic.id, title: "", type: "pdf", url: "" })}
                                                >
                                                    <Plus size={16} /> Додати матеріал
                                                </button>
                                            </div>
                                        )}
                                    </article>
                                );
                            })}

                            {addingTopic ? (
                                <form
                                    className="ced-new-topic is-edit"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        addTopic();
                                    }}
                                >
                                    <Plus size={18} />
                                    <input
                                        value={topicDraft}
                                        onChange={(e) => setTopicDraft(e.target.value)}
                                        placeholder="Назва теми"
                                        autoFocus
                                        onBlur={() => {
                                            if (topicDraft.trim()) addTopic();
                                            else setAddingTopic(false);
                                        }}
                                    />
                                </form>
                            ) : (
                                <button type="button" className="ced-new-topic" onClick={() => setAddingTopic(true)}>
                                    <Plus size={18} /> Нова тема
                                </button>
                            )}
                        </>
                    )}
                </section>
            </div>

            {selected.length > 0 && (
                <div className="ced-bulk">
                    <span>Обрано {selected.length}</span>
                    <select
                        onChange={async (e) => {
                            const topicId = e.target.value;
                            if (!topicId) return;
                            await run(() =>
                                api.office.bulkMaterials({
                                    ids: selected,
                                    action: "move",
                                    topic_id: Number(topicId),
                                })
                            );
                            setSelected([]);
                        }}
                        defaultValue=""
                    >
                        <option value="">Перемістити</option>
                        {allTopics.map((topic) => (
                            <option key={topic.id} value={topic.id}>
                                {topic.sectionTitle} / {topic.title}
                            </option>
                        ))}
                    </select>
                    <select
                        onChange={async (e) => {
                            const type = e.target.value;
                            if (!type) return;
                            await run(() => api.office.bulkMaterials({ ids: selected, action: "type", type }));
                            setSelected([]);
                        }}
                        defaultValue=""
                    >
                        <option value="">Змінити тип</option>
                        {TYPES.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.label}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        className="ced-btn ghost"
                        onClick={async () => {
                            await run(() => api.office.bulkMaterials({ ids: selected, action: "delete" }));
                            setSelected([]);
                        }}
                    >
                        Видалити
                    </button>
                    <button type="button" className="ced-btn ghost" onClick={() => setSelected([])}>
                        Скасувати
                    </button>
                </div>
            )}

            {modal && (
                <MaterialModal
                    initial={modal}
                    onClose={() => setModal(null)}
                    onSave={async (payload) => {
                        if (modal.id) await run(() => api.office.updateMaterial(modal.id, payload));
                        else await run(() => api.office.addMaterial(modal.topicId, payload));
                        setModal(null);
                    }}
                />
            )}
        </div>
    );
};

export default OfficeCourse;
