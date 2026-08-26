import { useEffect, useRef, useState } from "react";
import useServices from "@services/Services";
import useIsCoursePage from "./useIsCoursePage";

const useHeader = () => {
    const [active, setActive] = useState(false);
    const [coursesOpen, setCoursesOpen] = useState(false);
    const [courses, setCourses] = useState([]);
    const [scrolled, setScrolled] = useState(false);
    const [headerHeight, setHeaderHeight] = useState(0);

    const dropdownRef = useRef(null);
    const headerRef = useRef(null);

    const { getCourses } = useServices();
    const isCoursePage = useIsCoursePage();

    useEffect(() => {
        getCourses().then(data => setCourses(data || []));
    }, []);

    useEffect(() => {
        if (!headerRef.current) return;
        const observer = new ResizeObserver(([entry]) => {
            setHeaderHeight(entry.target.offsetHeight);
        });
        observer.observe(headerRef.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setCoursesOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleMobileNav = () => setActive(prev => !prev);
    const toggleCoursesDropdown = () => setCoursesOpen(prev => !prev);
    const closeCoursesDropdown = () => setCoursesOpen(false);

    return {
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
    };
};

export default useHeader;
