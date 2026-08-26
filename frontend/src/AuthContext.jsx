import { createContext, useCallback, useContext, useEffect, useState } from "react";
import api from "@services/api";
import { isStaffAppPath } from "@/staffPath";
import { isTeacherAppPath } from "@/teacherPath";

const AuthContext = createContext(null);

const isOfficeRole = (role) => role === "manager" || role === "admin";

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const applyUser = useCallback((data) => {
        if (data?.token) {
            api.client.setToken(data.token);
        }
        setUser(data);
        return data;
    }, []);

    const clearUser = useCallback(() => {
        api.client.setToken(null);
        setUser(null);
    }, []);

    useEffect(() => {
        let cancelled = false;
        const boot = async () => {
            if (!api.client.getToken()) {
                if (!cancelled) setLoading(false);
                return;
            }
            try {
                const me = await api.auth.me();
                if (cancelled) return;
                const teacherApp = isTeacherAppPath();
                const staffApp = isStaffAppPath();
                if (staffApp) {
                    if (isOfficeRole(me?.role)) applyUser(me);
                    else clearUser();
                } else if (teacherApp) {
                    if (me?.role === "teacher") applyUser(me);
                    else clearUser();
                } else if (me?.role === "student") {
                    applyUser(me);
                } else {
                    if (me?.role === "teacher" && me.token) {
                        api.client.parkTeacherToken(me.token);
                    }
                    if (isOfficeRole(me?.role) && me.token) {
                        api.client.parkStaffToken(me.token);
                    }
                    clearUser();
                }
            } catch {
                if (!cancelled) clearUser();
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        boot();
        return () => {
            cancelled = true;
        };
    }, [applyUser, clearUser]);

    const login = async (username, password) => {
        const data = await api.auth.login(username, password);
        if (data?.role !== "student") {
            clearUser();
            throw new Error("Невірний логін або пароль");
        }
        applyUser(data);
        return data;
    };

    const teacherLogin = async (username, password) => {
        const data = await api.auth.teacherLogin(username, password);
        if (data?.role !== "teacher") {
            clearUser();
            throw new Error("Невірний логін або пароль");
        }
        applyUser(data);
        return data;
    };

    const staffLogin = async (username, password) => {
        const data = await api.auth.staffLogin(username, password);
        if (!isOfficeRole(data?.role)) {
            clearUser();
            throw new Error("Невірний логін або пароль");
        }
        applyUser(data);
        return data;
    };

    const logout = async () => {
        try {
            if (api.client.getToken()) {
                await api.auth.logout();
            }
        } catch {
            // ignore network errors on logout
        } finally {
            clearUser();
        }
    };

    const updateProfile = async (payload) => {
        const data = await api.auth.updateProfile(payload);
        applyUser(data);
        return data;
    };

    const uploadAvatar = async (file) => {
        const data = await api.auth.uploadAvatar(file);
        applyUser(data);
        return data;
    };

    const isStudent = Boolean(user && user.role === "student");
    const isTeacher = Boolean(user && user.role === "teacher");
    const isManager = Boolean(user && user.role === "manager");
    const isAdmin = Boolean(user && user.role === "admin");
    const isOffice = isManager || isAdmin;

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                teacherLogin,
                staffLogin,
                logout,
                updateProfile,
                uploadAvatar,
                isAuthenticated: Boolean(user),
                isStudent,
                isTeacher,
                isManager,
                isAdmin,
                isOffice,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
};
