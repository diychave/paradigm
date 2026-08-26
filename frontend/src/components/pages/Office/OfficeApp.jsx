import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
    BookOpen,
    Calendar,
    CreditCard,
    Home,
    Inbox,
    LayoutList,
    LogOut,
    Menu,
    Users,
    X,
} from "lucide-react";
import { useAuth } from "@/AuthContext";
import {
    officeCourses,
    officeHome,
    officeLeads,
    officeListing,
    officePeople,
    officeSchedule,
    officeTransactions,
} from "@/staffPath";
import { StudioProvider, useStudio } from "@components/pages/Teacher/StudioContext";
import { initialsOf } from "@components/pages/Teacher/studioUtils";
import OfficeLogin from "./OfficeLogin";
import "@components/pages/Teacher/studio.css";
import "./office.css";

const NAV = [
    { to: officeHome(), label: "Головна", icon: Home, end: true },
    { to: officeLeads(), label: "Заявки", icon: Inbox },
    { to: officeCourses(), label: "Курси", icon: BookOpen },
    { to: officePeople(), label: "Люди", icon: Users },
    { to: officeSchedule(), label: "Розклад", icon: Calendar },
    { to: officeTransactions(), label: "Транзакції", icon: CreditCard },
    { to: officeListing(), label: "Налаштування лістингу", icon: LayoutList, admin: true },
];

const OfficeChrome = () => {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    const { toasts, drawer, closeDrawer } = useStudio();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="studio is-office">
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
                    <em>Office</em>
                </div>
                <nav>
                    {NAV.filter((item) => !item.admin || isAdmin).map((item) => (
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
                        <span className="office-role">{isAdmin ? "Супер-адмін" : "Менеджер"}</span>
                        <button
                            type="button"
                            onClick={async () => {
                                await logout();
                                navigate(officeHome());
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
                    <span>Office</span>
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

const OfficeApp = () => {
    const { user, loading, isOffice } = useAuth();

    if (loading) {
        return (
            <div className="studio is-office studio-loading">
                <div className="studio-skel" />
            </div>
        );
    }

    if (!isOffice || (user?.role !== "manager" && user?.role !== "admin")) {
        return <OfficeLogin />;
    }

    return (
        <StudioProvider>
            <OfficeChrome />
        </StudioProvider>
    );
};

export default OfficeApp;
