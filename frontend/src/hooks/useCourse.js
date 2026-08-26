import { useEffect, useState } from "react";
import useServices from "@services/Services";

const useCourse = (id) => {
    const [content, setContent] = useState(null);
    const { loading, error, getCourse } = useServices();

    useEffect(() => {
        let mounted = true;
        getCourse(id)
            .then(course => {
                if (mounted) {
                    setContent(course);
                }
            })
            .catch(() => {});

        return () => {
            mounted = false;
        };
    }, [id, getCourse]);

    return { content, loading, error };
};

export default useCourse;
