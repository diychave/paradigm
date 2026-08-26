import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
    Calendar,
    Home,
    LogOut,
    Menu,
    Users,
    X,
} from "lucide-react";
import { useAuth } from "@/AuthContext";
import {
    teacherHome,
    teacherSchedule,
    teacherStudents,
} from "@/teacherPath";
import TeacherLogin from "./TeacherLogin";
import { StudioProvider, useStudio } from "./StudioContext";
import { initialsOf } from "./studioUtils";
import "./Teacher.css";
import "./studio.css";

const NAV = [
    { to: teacherHome(), label: "Головна", icon: Home, end: true },
    { to: teacherStudents(), label: "Студенти", icon: Users },
    { to: teacherSchedule(), label: "Розклад", icon: Calendar },
];

const StudioChrome = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { toasts, drawer, closeDrawer } = useStudio();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="studio">
            {menuOpen && (
                <button
                    type="button"
                    className="studio-backdrop"
                    aria-label="Закрити меню"
                    onClick={() => setMenuOpen(false)}
                />
            )}
            <aside className={`studio-side${menuOpen ? " is-open" : ""}`}>
                <div className="studio-brand">
                    <span>IT Paradigma</span>
                    <em>Studio</em>
                </div>
                <nav>
                    {NAV.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            onClick={() => setMenuOpen(false)}
                        >
                            <item.icon size={18} strokeWidth={1.8} />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
                <div className="studio-side-user">
                    <span className="studio-avatar">{initialsOf(user.display_name || user.username)}</span>
                    <div>
                        <strong>{user.display_name || user.username}</strong>
                        <button
                            type="button"
                            onClick={async () => {
                                await logout();
                                navigate(teacherHome());
                            }}
                        >
                            <LogOut size={14} /> Вийти
                        </button>
                    </div>
                </div>
            </aside>
            <div className="studio-body">
                <header className="studio-mobile">
                    <button type="button" onClick={() => setMenuOpen(true)} aria-label="Меню">
                        <Menu size={20} />
                    </button>
                    <span>Studio</span>
                    <button type="button" onClick={() => setMenuOpen(false)} hidden={!menuOpen}>
                        <X size={20} />
                    </button>
                </header>
                <main className="studio-main">
                    <Outlet />
                </main>
            </div>
            <div className="studio-toasts" aria-live="polite">
                {toasts.map((item) => (
                    <p key={item.id} className={`studio-toast is-${item.tone}`}>
                        {item.message}
                    </p>
                ))}
            </div>
            {drawer && (
                <div className="studio-drawer-root">
                    <button type="button" className="studio-backdrop" onClick={closeDrawer} />
                    <aside className="studio-drawer">
                        <header>
                            <h3>{drawer.title}</h3>
                            <button type="button" onClick={closeDrawer} aria-label="Закрити">
                                <X size={18} />
                            </button>
                        </header>
                        <div className="studio-drawer-body">{drawer.body}</div>
                    </aside>
                </div>
            )}
        </div>
    );
};

const TeacherApp = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="studio studio-loading">
                <div className="studio-skel" />
            </div>
        );
    }

    if (user?.role !== "teacher") return <TeacherLogin />;

    return (
        <StudioProvider>
            <StudioChrome />
        </StudioProvider>
    );
};

export default TeacherApp;
