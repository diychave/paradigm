class AuthService {
    constructor(apiClient) {
        this.apiClient = apiClient;
    }

    login(username, password) {
        return this.apiClient.post("/auth/login", { username, password });
    }

    teacherLogin(username, password) {
        return this.apiClient.post("/auth/teacher-login", { username, password });
    }

    staffLogin(username, password) {
        return this.apiClient.post("/auth/staff-login", { username, password });
    }

    logout() {
        return this.apiClient.post("/auth/logout", {}, { auth: true });
    }

    me() {
        return this.apiClient.get("/auth/me", { auth: true });
    }

    updateProfile(payload) {
        return this.apiClient.patch("/auth/me", payload, { auth: true });
    }

    uploadAvatar(file) {
        const form = new FormData();
        form.append("avatar", file);
        return this.apiClient.postForm("/auth/me/avatar", form, { auth: true });
    }
}

export default AuthService;
