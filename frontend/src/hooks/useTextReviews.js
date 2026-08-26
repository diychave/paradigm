import { useEffect, useRef, useState } from "react";
import useServices from "@services/Services";

const useTextReviews = ({ filter }) => {
    const [reviews, setReviews] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const page = useRef(1);
    const mountedRef = useRef(true);

    const { loading, error, getTextResponses } = useServices();

    const loadReviews = async (currentPage) => {
        if (loading || !hasMore) return;

        try {
            const response = await getTextResponses(currentPage, 6, filter);
            if (!mountedRef.current) return;

            const reviewsData = response.data;

            if (!reviewsData.length) {
                setHasMore(false);
                return;
            }

            setReviews((prev) => {
                const newReviews = reviewsData.filter(
                    (review) =>
                        !prev.some(
                            (prevReview) => prevReview.id === review.id
                        )
                );

                return [...prev, ...newReviews];
            });

            if (!response.next) {
                setHasMore(false);
            }
        } catch {
            // error is already captured in `error` state returned below
        }
    };

    useEffect(() => {
        loadReviews(1);

        return () => {
            mountedRef.current = false;
        };
    }, []);

    const handleReachEnd = () => {
        if (loading || !hasMore) return;

        page.current += 1;
        loadReviews(page.current);
    };

    return {
        reviews,
        hasMore,
        loading,
        error,
        handleReachEnd,
    };
};

export default useTextReviews;
