import { useEffect, useState } from "react";
import useServices from "@services/Services";

const useVideoReviews = () => {
    const [videos, setVideos] = useState([]);
    const [currentSlide, setCurrentSlide] = useState(0);

    const { loading, error, getVideoResponses } = useServices();

    useEffect(() => {
        let mounted = true;
        getVideoResponses()
            .then(data => {
                if (mounted) {
                    setVideos(data);
                }
            })
            .catch(() => {});

        return () => {
            mounted = false;
        };
    }, [getVideoResponses]);

    return {
        loading,
        error,
        videos,
        currentSlide,
        setCurrentSlide,
    };
};

export default useVideoReviews;
