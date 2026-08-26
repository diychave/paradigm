import { useState } from "react";

export const MaterialForm = ({ initial, onSubmit, submitLabel = "Зберегти" }) => {
    const [title, setTitle] = useState(initial.title);
    const [url, setUrl] = useState(initial.url);
    const [type, setType] = useState(initial.type);
    return (
        <form
            className="studio-form"
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit({ title, url, type });
            }}
        >
            <label>
                Назва
                <input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </label>
            <label>
                Тип
                <select value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="pdf">PDF</option>
                    <option value="doc">DOCX</option>
                    <option value="zip">ZIP</option>
                    <option value="link">Посилання</option>
                    <option value="video">Відео</option>
                    <option value="ppt">Презентація</option>
                </select>
            </label>
            <label>
                Посилання
                <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
            </label>
            <button type="submit" className="studio-btn">
                {submitLabel}
            </button>
        </form>
    );
};

export const HomeworkForm = ({ initial, onSubmit, submitLabel = "Зберегти" }) => {
    const [title, setTitle] = useState(initial.title);
    const [description, setDescription] = useState(initial.description);
    const [due, setDue] = useState(initial.due_label);
    return (
        <form
            className="studio-form"
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit({ title, description, due_label: due });
            }}
        >
            <label>
                Назва
                <input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </label>
            <label>
                Опис
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </label>
            <label>
                Термін
                <input value={due} onChange={(e) => setDue(e.target.value)} />
            </label>
            <button type="submit" className="studio-btn">
                {submitLabel}
            </button>
        </form>
    );
};
