import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/AuthContext";
import api from "@services/api";
import { officeHome } from "@/staffPath";
import { useStudio } from "@components/pages/Teacher/StudioContext";

const TABS = [
    { id: "site", label: "Головна" },
    { id: "courses", label: "Курси" },
    { id: "pricing", label: "Тарифи" },
    { id: "faq", label: "FAQ" },
    { id: "reviews", label: "Відгуки" },
    { id: "videos", label: "Відео" },
    { id: "socials", label: "Соцмережі" },
];

const SOCIAL_IDS = ["instagram", "facebook", "tiktok", "youtube", "telegram"];

const linesToList = (value) =>
    String(value || "")
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

const money = (value) => Number(value || 0).toLocaleString("uk-UA");

const Field = ({ label, className = "", children }) => (
    <label className={`office-field ${className}`.trim()}>
        {label ? <span>{label}</span> : null}
        {children}
    </label>
);

const Switch = ({ name, defaultChecked, checked, onChange, label }) => (
    <label className="office-switch">
        {onChange ? (
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        ) : (
            <input type="checkbox" name={name} defaultChecked={defaultChecked} />
        )}
        <i />
        {label}
    </label>
);

const CardActions = ({ onDelete, deleteLabel = "Видалити", saveLabel = "Зберегти" }) => (
    <div className="office-listing-actions">
        <button type="submit" className="studio-btn ghost sm">
            {saveLabel}
        </button>
        {onDelete && (
            <button type="button" className="office-icon-del" onClick={onDelete} aria-label={deleteLabel}>
                <Trash2 size={15} />
            </button>
        )}
    </div>
);

const SiteTab = ({ site, onSave }) => {
    const [form, setForm] = useState(site);
    useEffect(() => setForm(site), [site]);
    const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
    return (
        <article className="office-listing-sheet">
            <form
                className="office-listing-form office-listing-sheet-form"
                onSubmit={(e) => {
                    e.preventDefault();
                    onSave({
                        ...form,
                        hero_tags: linesToList(form.hero_tags_text ?? (form.hero_tags || []).join("\n")),
                    });
                }}
            >
                <section className="office-listing-section">
                    <h3>Hero</h3>
                    <div className="office-listing-grid">
                        <Field label="Заголовок" className="span-2">
                            <input value={form.hero_title || ""} onChange={(e) => set("hero_title", e.target.value)} />
                        </Field>
                        <Field label="Опис" className="span-2">
                            <textarea
                                value={form.hero_description || ""}
                                onChange={(e) => set("hero_description", e.target.value)}
                            />
                        </Field>
                        <Field label="Теги — кожен з нового рядка" className="span-2">
                            <textarea
                                value={form.hero_tags_text ?? (form.hero_tags || []).join("\n")}
                                onChange={(e) => set("hero_tags_text", e.target.value)}
                            />
                        </Field>
                    </div>
                </section>
                <section className="office-listing-section">
                    <h3>Переваги</h3>
                    <div className="office-listing-stats">
                        {(form.about_stats || []).map((item, index) => (
                            <div key={index} className="office-listing-mini">
                                <input
                                    value={item.number || ""}
                                    placeholder="Число"
                                    onChange={(e) => {
                                        const next = [...form.about_stats];
                                        next[index] = { ...item, number: e.target.value };
                                        set("about_stats", next);
                                    }}
                                />
                                <input
                                    value={item.title || ""}
                                    placeholder="Назва"
                                    onChange={(e) => {
                                        const next = [...form.about_stats];
                                        next[index] = { ...item, title: e.target.value };
                                        set("about_stats", next);
                                    }}
                                />
                                <textarea
                                    value={item.desc || ""}
                                    placeholder="Опис"
                                    onChange={(e) => {
                                        const next = [...form.about_stats];
                                        next[index] = { ...item, desc: e.target.value };
                                        set("about_stats", next);
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </section>
                <section className="office-listing-section">
                    <h3>Футер</h3>
                    <div className="office-listing-grid">
                        <Field label="Опис школи" className="span-2">
                            <textarea
                                value={form.footer_description || ""}
                                onChange={(e) => set("footer_description", e.target.value)}
                            />
                        </Field>
                        <Field label="Телефон">
                            <input value={form.footer_phone || ""} onChange={(e) => set("footer_phone", e.target.value)} />
                        </Field>
                        <Field label="Копірайт">
                            <input
                                value={form.footer_copyright || ""}
                                onChange={(e) => set("footer_copyright", e.target.value)}
                            />
                        </Field>
                    </div>
                </section>
                <button type="submit" className="studio-btn ghost">
                    Зберегти головну
                </button>
            </form>
        </article>
    );
};

const CourseEditor = ({ course, onSave }) => {
    const [form, setForm] = useState(course);
    useEffect(() => setForm(course), [course]);
    const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
    return (
        <form
            className="office-listing-form office-listing-course-form"
            onSubmit={(e) => {
                e.preventDefault();
                onSave(course.id, {
                    ...form,
                    tags: linesToList(form.tags_text ?? (form.tags || []).join("\n")),
                    plans: {
                        junior: linesToList(form.plan_junior ?? (form.plans?.junior || []).join("\n")),
                        middle: linesToList(form.plan_middle ?? (form.plans?.middle || []).join("\n")),
                        senior: linesToList(form.plan_senior ?? (form.plans?.senior || []).join("\n")),
                    },
                    fits: (form.fits || []).filter((item) => (item.title || "").trim()),
                });
            }}
        >
            <section className="office-listing-section">
                <h3>Картка на сайті</h3>
                <Switch checked={Boolean(form.is_published)} onChange={(value) => set("is_published", value)} label="Показувати на сайті" />
                <div className="office-listing-grid">
                    <Field label="Назва">
                        <input value={form.title || ""} onChange={(e) => set("title", e.target.value)} required />
                    </Field>
                    <Field label="Підзаголовок">
                        <input value={form.subtitle || ""} onChange={(e) => set("subtitle", e.target.value)} />
                    </Field>
                    <Field label="Вік">
                        <input value={form.age_range || ""} onChange={(e) => set("age_range", e.target.value)} />
                    </Field>
                    <Field label="Фото картки (URL)">
                        <input value={form.card_image || ""} onChange={(e) => set("card_image", e.target.value)} />
                    </Field>
                    <Field label="Опис картки" className="span-2">
                        <textarea value={form.card_description || ""} onChange={(e) => set("card_description", e.target.value)} />
                    </Field>
                    <Field label="Теги — кожен з нового рядка" className="span-2">
                        <textarea
                            value={form.tags_text ?? (form.tags || []).join("\n")}
                            onChange={(e) => set("tags_text", e.target.value)}
                        />
                    </Field>
                </div>
            </section>
            <section className="office-listing-section">
                <h3>Сторінка курсу</h3>
                <div className="office-listing-grid">
                    <Field label="Опис сторінки курсу" className="span-2">
                        <textarea value={form.description || ""} onChange={(e) => set("description", e.target.value)} />
                    </Field>
                    <Field label="Головне фото (URL)">
                        <input value={form.image || ""} onChange={(e) => set("image", e.target.value)} />
                    </Field>
                    <Field label="Відео робіт (URL)">
                        <input value={form.video || ""} onChange={(e) => set("video", e.target.value)} />
                    </Field>
                    <Field label="Для кого підходить" className="span-2">
                        <textarea value={form.suitable || ""} onChange={(e) => set("suitable", e.target.value)} />
                    </Field>
                </div>
            </section>
            <section className="office-listing-section">
                <h3>Для кого курс</h3>
                <div className="office-listing-stats">
                    {(form.fits || []).map((item, index) => (
                        <div key={item.id || index} className="office-listing-mini">
                            <input
                                value={item.title || ""}
                                placeholder="Заголовок"
                                onChange={(e) => {
                                    const next = [...form.fits];
                                    next[index] = { ...item, title: e.target.value };
                                    set("fits", next);
                                }}
                            />
                            <textarea
                                value={item.description || ""}
                                placeholder="Опис"
                                onChange={(e) => {
                                    const next = [...form.fits];
                                    next[index] = { ...item, description: e.target.value };
                                    set("fits", next);
                                }}
                            />
                            <button
                                type="button"
                                className="office-icon-del"
                                onClick={() => set("fits", form.fits.filter((_, i) => i !== index))}
                                aria-label="Прибрати"
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>
                    ))}
                </div>
                <button
                    type="button"
                    className="office-listing-add"
                    onClick={() => set("fits", [...(form.fits || []), { title: "", description: "" }])}
                >
                    <Plus size={15} /> Додати блок
                </button>
            </section>
            <section className="office-listing-section">
                <h3>Програма</h3>
                <div className="office-listing-grid cols-3">
                    {["junior", "middle", "senior"].map((level) => (
                        <Field key={level} label={level}>
                            <textarea
                                value={form[`plan_${level}`] ?? (form.plans?.[level] || []).join("\n")}
                                onChange={(e) => set(`plan_${level}`, e.target.value)}
                            />
                        </Field>
                    ))}
                </div>
            </section>
            <button type="submit" className="studio-btn ghost">
                Зберегти курс
            </button>
        </form>
    );
};

const PricingRow = ({ row, onSave, onDelete }) => {
    const [count, setCount] = useState(row.lessons_count);
    const [price, setPrice] = useState(row.price_per_lesson);
    const [visible, setVisible] = useState(!row.hidden);
    useEffect(() => {
        setCount(row.lessons_count);
        setPrice(row.price_per_lesson);
        setVisible(!row.hidden);
    }, [row]);
    const total = Number(count || 0) * Number(price || 0);
    return (
        <form
            className="office-price-row"
            onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                onSave({
                    tag: form.tag.value,
                    lessons_label: form.lessons_label.value,
                    lessons_count: count,
                    price_per_lesson: price,
                    hidden: !visible,
                });
            }}
        >
            <Field label="Назва">
                <input name="tag" defaultValue={row.tag} />
            </Field>
            <Field label="Підпис">
                <input name="lessons_label" defaultValue={row.lessons_label} />
            </Field>
            <Field label="Уроки">
                <input
                    name="lessons_count"
                    type="number"
                    min="1"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                />
            </Field>
            <Field label="₴ / урок">
                <input
                    name="price_per_lesson"
                    type="number"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                />
            </Field>
            <div className="office-listing-card-foot">
                <p className="office-price-sum">
                    <span>Разом</span>
                    <strong>{money(total)} грн</strong>
                </p>
                <div className="office-listing-actions">
                    <Switch checked={visible} onChange={setVisible} label={visible ? "На сайті" : "Прихований"} />
                    <button type="submit" className="studio-btn ghost sm">
                        Зберегти
                    </button>
                    <button type="button" className="office-icon-del" onClick={onDelete} aria-label="Видалити">
                        <Trash2 size={15} />
                    </button>
                </div>
            </div>
        </form>
    );
};

const OfficeListing = () => {
    const { isAdmin } = useAuth();
    const { toast } = useStudio();
    const [tab, setTab] = useState("site");
    const [data, setData] = useState(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(true);
    const [openCourse, setOpenCourse] = useState("");
    const [socialId, setSocialId] = useState("instagram");
    const [socialUrl, setSocialUrl] = useState("");
    const tabsRef = useRef(null);

    const load = () => api.office.listing().then(setData);

    useEffect(() => {
        const active = tabsRef.current?.querySelector(".is-active");
        active?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }, [tab]);

    useEffect(() => {
        if (!isAdmin) return;
        load()
            .catch((err) => setError(err?.message || "Не вдалося завантажити"))
            .finally(() => setBusy(false));
    }, [isAdmin]);

    const addAction = useMemo(() => {
        if (!data) return null;
        const actions = {
            courses: {
                label: "Додати курс",
                run: async () => {
                    const created = await api.office.createCourse({ title: "Новий курс", is_published: false });
                    if (created?.id) setOpenCourse(created.id);
                },
                ok: "Курс створено",
            },
            pricing: {
                label: "Новий тариф",
                run: () =>
                    api.office.createPricing({
                        tag: "Новий тариф",
                        lessons_count: 8,
                        price_per_lesson: 400,
                        lessons_label: "8 занять",
                    }),
                ok: "Тариф створено",
            },
            faq: {
                label: "Нове питання",
                run: () => api.office.createFaq({ title: "Нове питання", description: "Відповідь" }),
                ok: "Питання створено",
            },
            reviews: {
                label: "Новий відгук",
                run: () => {
                    const course = data.courses?.[0]?.id;
                    if (!course) throw new Error("Спочатку створіть курс");
                    return api.office.createReview({ name: "Ім’я", age: "10", course, review: "Текст відгуку" });
                },
                ok: "Відгук створено",
            },
            videos: {
                label: "Нове відео",
                run: () => api.office.createVideo({ video: "https://" }),
                ok: "Відео додано",
            },
        };
        return actions[tab] || null;
    }, [data, tab]);

    if (!isAdmin) return <Navigate to={officeHome()} replace />;

    const run = async (fn, ok) => {
        try {
            await fn();
            await load();
            toast(ok);
            return true;
        } catch (err) {
            toast(err?.message || "Не вдалося зберегти", "err");
            return false;
        }
    };

    return (
        <div className="studio-page office-listing">
            <div className="office-listing-bar">
                <div className="office-listing-bar-top">
                    <div>
                        <h1>Налаштування лістингу</h1>
                        <p className="studio-lead">Контент публічного сайту</p>
                    </div>
                    {addAction && (
                        <button type="button" className="studio-btn sm" onClick={() => run(addAction.run, addAction.ok)}>
                            <Plus size={16} /> {addAction.label}
                        </button>
                    )}
                </div>
                <div className="studio-tabs office-listing-tabs" ref={tabsRef}>
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
            </div>
            {error && <p className="studio-error">{error}</p>}
            {busy || !data ? (
                <div className="studio-skel tall" />
            ) : (
                <>
                    {tab === "site" && (
                        <SiteTab
                            site={data.site}
                            onSave={(payload) => run(() => api.office.updateListingSite(payload), "Головну збережено")}
                        />
                    )}
                    {tab === "courses" && (
                        <div className="office-listing-stack">
                            {(data.courses || []).length === 0 ? (
                                <p className="studio-muted">Курсів ще немає</p>
                            ) : (
                                (data.courses || []).map((course) => (
                                    <article
                                        key={course.id}
                                        className={`office-listing-course${openCourse === course.id ? " is-open" : ""}`}
                                    >
                                        <header>
                                            <div>
                                                <h2>{course.title}</h2>
                                                <p>
                                                    <span className={`office-badge${course.is_published ? "" : " is-off"}`}>
                                                        {course.is_published ? "На сайті" : "Прихований"}
                                                    </span>
                                                    {course.age_range ? <span>{course.age_range}</span> : null}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                className="studio-btn ghost sm"
                                                onClick={() => setOpenCourse((id) => (id === course.id ? "" : course.id))}
                                            >
                                                {openCourse === course.id ? "Згорнути" : "Редагувати"}
                                            </button>
                                        </header>
                                        {openCourse === course.id && (
                                            <CourseEditor
                                                course={course}
                                                onSave={(id, payload) =>
                                                    run(() => api.office.updateListingCourse(id, payload), "Курс збережено")
                                                }
                                            />
                                        )}
                                    </article>
                                ))
                            )}
                        </div>
                    )}
                    {tab === "pricing" && (
                        <article className="office-listing-sheet">
                            <div className="office-listing-sheet-form">
                                {(data.pricing || []).map((row) => (
                                    <PricingRow
                                        key={row.id}
                                        row={row}
                                        onSave={(payload) =>
                                            run(() => api.office.updatePricing(row.id, payload), "Тариф збережено")
                                        }
                                        onDelete={() => run(() => api.office.deletePricing(row.id), "Тариф видалено")}
                                    />
                                ))}
                                {(data.pricing || []).length === 0 && <p className="studio-muted">Тарифів ще немає</p>}
                                <button
                                    type="button"
                                    className="office-listing-add"
                                    onClick={() =>
                                        run(
                                            () =>
                                                api.office.createPricing({
                                                    tag: "Новий тариф",
                                                    lessons_count: 8,
                                                    price_per_lesson: 400,
                                                    lessons_label: "8 занять",
                                                }),
                                            "Тариф створено"
                                        )
                                    }
                                >
                                    <Plus size={15} /> Новий тариф
                                </button>
                            </div>
                        </article>
                    )}
                    {tab === "faq" && (
                        <article className="office-listing-sheet office-listing-entries">
                            <div className="office-listing-sheet-form">
                                {(data.faq || []).map((row) => (
                                    <form
                                        key={row.id}
                                        className="office-listing-section"
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            const form = e.currentTarget;
                                            run(
                                                () =>
                                                    api.office.updateFaq(row.id, {
                                                        title: form.title.value,
                                                        description: form.description.value,
                                                        is_published: form.is_published.checked,
                                                    }),
                                                "FAQ збережено"
                                            );
                                        }}
                                    >
                                        <Field label="Питання">
                                            <input name="title" defaultValue={row.title} />
                                        </Field>
                                        <Field label="Відповідь">
                                            <textarea name="description" defaultValue={row.description} />
                                        </Field>
                                        <div className="office-listing-card-foot">
                                            <Switch
                                                name="is_published"
                                                defaultChecked={row.is_published}
                                                label="На сайті"
                                            />
                                            <CardActions
                                                onDelete={() => run(() => api.office.deleteFaq(row.id), "Видалено")}
                                            />
                                        </div>
                                    </form>
                                ))}
                                <button
                                    type="button"
                                    className="office-listing-add"
                                    onClick={() =>
                                        run(
                                            () =>
                                                api.office.createFaq({
                                                    title: "Нове питання",
                                                    description: "Відповідь",
                                                }),
                                            "Питання створено"
                                        )
                                    }
                                >
                                    <Plus size={15} /> Нове питання
                                </button>
                            </div>
                        </article>
                    )}
                    {tab === "reviews" && (
                        <article className="office-listing-sheet office-listing-entries">
                            <div className="office-listing-sheet-form">
                                {(data.reviews || []).map((row) => (
                                    <form
                                        key={row.id}
                                        className="office-listing-section"
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            const form = e.currentTarget;
                                            run(
                                                () =>
                                                    api.office.updateReview(row.id, {
                                                        name: form.name.value,
                                                        age: form.age.value,
                                                        course: form.course.value,
                                                        review: form.review.value,
                                                        is_published: form.is_published.checked,
                                                    }),
                                                "Відгук збережено"
                                            );
                                        }}
                                    >
                                        <div className="office-listing-grid cols-3">
                                            <Field label="Ім’я">
                                                <input name="name" defaultValue={row.name} />
                                            </Field>
                                            <Field label="Вік">
                                                <input name="age" defaultValue={row.age} />
                                            </Field>
                                            <Field label="Курс">
                                                <select name="course" defaultValue={row.course}>
                                                    {(data.courses || []).map((course) => (
                                                        <option key={course.id} value={course.id}>
                                                            {course.title}
                                                        </option>
                                                    ))}
                                                </select>
                                            </Field>
                                            <Field label="Відгук" className="span-all">
                                                <textarea name="review" defaultValue={row.review} />
                                            </Field>
                                        </div>
                                        <div className="office-listing-card-foot">
                                            <Switch
                                                name="is_published"
                                                defaultChecked={row.is_published}
                                                label="На сайті"
                                            />
                                            <CardActions
                                                onDelete={() =>
                                                    run(() => api.office.deleteReview(row.id), "Видалено")
                                                }
                                            />
                                        </div>
                                    </form>
                                ))}
                                <button
                                    type="button"
                                    className="office-listing-add"
                                    onClick={() => {
                                        const course = data.courses?.[0]?.id;
                                        if (!course) return toast("Спочатку створіть курс", "err");
                                        return run(
                                            () =>
                                                api.office.createReview({
                                                    name: "Ім’я",
                                                    age: "10",
                                                    course,
                                                    review: "Текст відгуку",
                                                }),
                                            "Відгук створено"
                                        );
                                    }}
                                >
                                    <Plus size={15} /> Новий відгук
                                </button>
                            </div>
                        </article>
                    )}
                    {tab === "videos" && (
                        <article className="office-listing-sheet">
                            <div className="office-listing-sheet-form">
                                {(data.videos || []).map((row) => (
                                    <form
                                        key={row.id}
                                        className="office-listing-row is-video"
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            const form = e.currentTarget;
                                            run(
                                                () =>
                                                    api.office.updateVideo(row.id, {
                                                        video: form.video.value,
                                                        is_published: form.is_published.checked,
                                                    }),
                                                "Відео збережено"
                                            );
                                        }}
                                    >
                                        <Field label="Посилання">
                                            <input name="video" defaultValue={row.video} />
                                        </Field>
                                        <Switch
                                            name="is_published"
                                            defaultChecked={row.is_published}
                                            label="На сайті"
                                        />
                                        <CardActions
                                            onDelete={() => run(() => api.office.deleteVideo(row.id), "Видалено")}
                                        />
                                    </form>
                                ))}
                                {(data.videos || []).length === 0 && <p className="studio-muted">Відео ще немає</p>}
                            </div>
                        </article>
                    )}
                    {tab === "socials" && (
                        <article className="office-listing-sheet">
                            <div className="office-listing-sheet-form">
                                <form
                                    className="office-listing-row is-add"
                                    onSubmit={async (e) => {
                                        e.preventDefault();
                                        if (!socialId || !socialUrl) return;
                                        const saved = await run(
                                            () => api.office.createSocial({ id: socialId, url: socialUrl }),
                                            "Додано"
                                        );
                                        if (saved) setSocialUrl("");
                                    }}
                                >
                                    <Field label="Мережа">
                                        <select value={socialId} onChange={(e) => setSocialId(e.target.value)}>
                                            {SOCIAL_IDS.map((id) => (
                                                <option key={id} value={id}>
                                                    {id}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                    <Field label="Посилання">
                                        <input
                                            value={socialUrl}
                                            onChange={(e) => setSocialUrl(e.target.value)}
                                            placeholder="https://"
                                        />
                                    </Field>
                                    <button type="submit" className="studio-btn ghost sm">
                                        <Plus size={15} /> Додати
                                    </button>
                                </form>
                                {(data.socials || []).map((row) => (
                                    <form
                                        key={row.id}
                                        className="office-listing-row is-social"
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            run(
                                                () =>
                                                    api.office.updateSocial(row.id, {
                                                        url: e.currentTarget.url.value,
                                                    }),
                                                "Збережено"
                                            );
                                        }}
                                    >
                                        <span className="office-badge">{row.id}</span>
                                        <Field>
                                            <input name="url" defaultValue={row.url} />
                                        </Field>
                                        <CardActions
                                            onDelete={() => run(() => api.office.deleteSocial(row.id), "Видалено")}
                                        />
                                    </form>
                                ))}
                            </div>
                        </article>
                    )}
                </>
            )}
        </div>
    );
};

export default OfficeListing;
