import { useEffect, useState } from "react";
import useServices from "@services/Services";

const useCourses = () => {
    const [courses, setCourses] = useState([]);
    const { loading, error, getCourses } = useServices();

    useEffect(() => {
        let mounted = true;
        getCourses()
            .then(data => {
                if (mounted) {
                    setCourses(data);
                }
            })
            .catch(() => {});

        return () => {
            mounted = false;
        };
    }, [getCourses]);

    return { loading, error, courses };
};

export default useCourses;
