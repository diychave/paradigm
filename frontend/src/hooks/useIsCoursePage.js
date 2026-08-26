import { useLocation } from "react-router-dom";

const useIsCoursePage = () => {
    const location = useLocation();
    return location.pathname.startsWith('/course');
};

export default useIsCoursePage;
