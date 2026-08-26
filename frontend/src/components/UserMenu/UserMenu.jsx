import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/AuthContext";
import "./UserMenu.css";

const UserMenu = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    const initials = (user?.display_name || user?.username || "?")
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    useEffect(() => {
        const onClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, []);

    const onLogout = async () => {
        setOpen(false);
        await logout();
        navigate("/login");
    };

    return (
        <div className={`user-menu${open ? " open" : ""}`} ref={ref}>
            <button
                type="button"
                className="user-menu-trigger"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
            >
                <span className="user-menu-avatar" aria-hidden="true">
                    {user?.avatar ? <img src={user.avatar} alt="" /> : initials}
                </span>
                <span className="user-menu-name">{user?.display_name || user?.username}</span>
            </button>

            {open && (
                <div className="user-menu-dropdown" role="menu">
                    <button type="button" role="menuitem" className="user-menu-item user-menu-logout" onClick={onLogout}>
                        Вийти
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserMenu;
