import Button from "@components/Button/Button"
import MobileNav from "@components/MobileNav/MobileNav"
import UserMenu from "@components/UserMenu/UserMenu"
import "./Header.css"
import { Link, NavLink } from "react-router-dom"
import { HashLink } from "react-router-hash-link"
import logo from "@/assets/icons/logo.png"
import Toggler from "@components/Toggler/Toggler"
import useHeader from "@hooks/useHeader"
import { capitalize } from "@utils/string"
import ChevronIcon from "@utils/icons/ChevronIcon"
import LogoText from "@utils/icons/LogoText"
import { useAuth } from "@/AuthContext"

const BurgerIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 7L4 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M20 12L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M20 17L4 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

const STUDENT_LINKS = [
    { to: "/account", label: "Головна", end: true },
    { to: "/account/courses", label: "Мої курси" },
    { to: "/account/schedule", label: "Розклад" },
];

const Header = () => {
    const {
        active,
        setActive,
        coursesOpen,
        courses,
        scrolled,
        headerHeight,
        dropdownRef,
        headerRef,
        isCoursePage,
        toggleMobileNav,
        toggleCoursesDropdown,
        closeCoursesDropdown,
    } = useHeader()

    const { user, isAuthenticated } = useAuth()
    const isStudent = isAuthenticated && user?.role === "student"

    return (
        <>
        <header ref={headerRef} className={`container${scrolled ? ' header-sticky-scrolled' : ''}${isStudent ? ' header-student' : ''}`}>
            <nav className="header-nav">
                <div className="logo">
                    <Link to="/">
                        <img src={logo} alt="" className="logo-icon" />
                        <LogoText />
                    </Link>
                </div>
                <div className="burger-menu" onClick={toggleMobileNav}>
                    <BurgerIcon />
                </div>

                {isStudent ? (
                    <ul className="desctop-nav desctop-nav-student">
                        {STUDENT_LINKS.map(({ to, label, end }) => (
                            <li key={to}>
                                <NavLink to={to} end={Boolean(end)}>
                                    {label}
                                </NavLink>
                            </li>
                        ))}
                        <li><Toggler /></li>
                    </ul>
                ) : (
                    <ul className="desctop-nav">
                        <li><HashLink to="/#hero">Головна</HashLink></li>
                        <li><HashLink to={isCoursePage ? "#about" : "/#features"}>Переваги</HashLink></li>
                        <li
                            ref={dropdownRef}
                            className={`desctop-nav-dropdown ${coursesOpen ? 'open' : ''}`}
                        >
                            <div
                                className="desctop-nav-dropdown-toggle"
                                onClick={toggleCoursesDropdown}
                            >
                                <span>Курси</span>
                                <ChevronIcon />
                            </div>
                            <ul className="desctop-nav-dropdown-list">
                                {courses.map(({ id }) => (
                                    <li key={id}>
                                        <Link to={`/course/${id}`} onClick={closeCoursesDropdown}>{capitalize(id)}</Link>
                                    </li>
                                ))}
                            </ul>
                        </li>
                        <li><a href="#responses">Відгуки</a></li>
                        <li><Toggler /></li>
                    </ul>
                )}

                <div className={`header-btns${isStudent ? " header-btns-student" : ""}`}>
                    {isStudent ? (
                        <UserMenu />
                    ) : (
                        <>
                            <Button text={'+380 50 600 60 94'} link={'+380 50 600 60 94'} classes={'btn-course step-2 header-btn'} />
                            <Button
                                text={'Увійти'}
                                useRouterLink="/login"
                                classes={'btn-course step-2 header-btn'}
                            />
                            <Button text={'Записатися'} classes={'btn-course step-1 header-btn'} action='modal' />
                        </>
                    )}
                </div>
            </nav>
            <MobileNav active={active} setActive={setActive} />
        </header>
        <div style={{ height: headerHeight }} aria-hidden="true" />
        </>
    )
}

export default Header;
