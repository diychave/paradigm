import { useCallback } from "react";
import useHttp from "@hooks/useHttp";
import api from "./api";

const useServices = () => {

    const { loading, req, error } = useHttp();

    const getVideoResponses = useCallback(() => {
        return req(() => api.video.getAll());
    }, [req]);

    const getTextResponses = useCallback((page, limit, filter) => {
        return req(() => api.reviews.getText(page, limit, filter));
    }, [req]);

    const getCourses = useCallback(() => {
        return req(() => api.courses.getAll());
    }, [req])
    const getCourse = useCallback((id) => {
        return req(() => api.courses.getById(id));
    }, [req])
    const getFaq = useCallback(() => {
        return req(() => api.faq.getAll());
    }, [req])
    const getSocials = useCallback(() => {
        return req(() => api.socials.getAll());
    }, [req])
    const getPricing = useCallback(() => {
        return req(() => api.pricing.getAll());
    }, [req])

    return {
        loading,
        error,
        getVideoResponses,
        getTextResponses,
        getCourses,
        getCourse,
        getFaq,
        getSocials,
        getPricing
    };

};

export default useServices;
