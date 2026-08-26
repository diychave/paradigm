import { useState, useCallback } from "react";


const useHttp = () => {

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);


    const req = useCallback(async (request) => {
        setLoading(true);

        try {
            const data = await request();
            setLoading(false);
            return data;
        } catch (e) {
            setLoading(false);
            setError(e.message)
            throw e
        }
    }, [])
    const clearError = useCallback(() => {setError(null)}, [])
    return { loading, req, error, clearError }
}

export default useHttp;
