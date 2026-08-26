import { isStaffAppPath } from "@/staffPath";
import { isTeacherAppPath } from "@/teacherPath";

const STUDENT_TOKEN_KEY = "paradigm_student_token";
const TEACHER_TOKEN_KEY = "paradigm_teacher_token";
const STAFF_TOKEN_KEY = "paradigm_staff_token";
const LEGACY_TOKEN_KEY = "paradigm_auth_token";

const scopeKey = () => {
    if (isStaffAppPath()) return STAFF_TOKEN_KEY;
    if (isTeacherAppPath()) return TEACHER_TOKEN_KEY;
    return STUDENT_TOKEN_KEY;
};

class ApiClient {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }

    getToken() {
        return localStorage.getItem(scopeKey()) || localStorage.getItem(LEGACY_TOKEN_KEY);
    }

    setToken(token) {
        const key = scopeKey();
        if (token) {
            localStorage.setItem(key, token);
            localStorage.removeItem(LEGACY_TOKEN_KEY);
            return;
        }
        localStorage.removeItem(key);
        localStorage.removeItem(LEGACY_TOKEN_KEY);
    }

    parkTeacherToken(token) {
        if (token) localStorage.setItem(TEACHER_TOKEN_KEY, token);
    }

    parkStaffToken(token) {
        if (token) localStorage.setItem(STAFF_TOKEN_KEY, token);
    }

    async request(path, { method = "GET", body, auth = false, json = true, extraHeaders } = {}) {
        const headers = { ...(extraHeaders || {}) };
        if (json) headers["Content-Type"] = "application/json";
        if (auth) {
            const token = this.getToken();
            if (token) headers.Authorization = `Token ${token}`;
        }

        const res = await fetch(`${this.baseURL}${path}`, {
            method,
            headers,
            body:
                body === undefined
                    ? undefined
                    : json
                      ? JSON.stringify(body)
                      : body,
            credentials: "include",
        });

        if (!res.ok) {
            let detail = `could not ${method} ${path}, status: ${res.status}`;
            try {
                const data = await res.json();
                if (typeof data.detail === "string") {
                    detail = data.detail;
                } else if (data.detail) {
                    detail = JSON.stringify(data.detail);
                } else if (data && typeof data === "object") {
                    const parts = Object.entries(data).flatMap(([key, val]) => {
                        const messages = Array.isArray(val) ? val : [val];
                        return messages.map((msg) => `${key}: ${msg}`);
                    });
                    if (parts.length) detail = parts.join(" ");
                    else detail = JSON.stringify(data);
                }
            } catch {
                // ignore
            }
            const err = new Error(detail);
            err.status = res.status;
            throw err;
        }

        if (res.status === 204) return null;
        return res.json();
    }

    get(path, { auth = false } = {}) {
        return this.request(path, { method: "GET", auth });
    }

    post(path, body, { auth = false, extraHeaders } = {}) {
        return this.request(path, { method: "POST", body, auth, extraHeaders });
    }

    patch(path, body, { auth = false } = {}) {
        return this.request(path, { method: "PATCH", body, auth });
    }

    delete(path, { auth = false } = {}) {
        return this.request(path, { method: "DELETE", auth });
    }

    postForm(path, formData, { auth = false } = {}) {
        return this.request(path, { method: "POST", body: formData, auth, json: false });
    }
}

export default ApiClient;
export { STUDENT_TOKEN_KEY, TEACHER_TOKEN_KEY, STAFF_TOKEN_KEY };
