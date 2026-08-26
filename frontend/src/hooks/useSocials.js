import { useEffect, useState } from "react";
import useServices from "@services/Services";

const useSocials = () => {
    const [socials, setSocials] = useState([]);
    const { loading, error, getSocials } = useServices();

    useEffect(() => {
        let mounted = true;
        getSocials()
            .then(data => {
                if (mounted) {
                    setSocials(data || []);
                }
            })
            .catch(() => {});

        return () => {
            mounted = false;
        };
    }, [getSocials]);

    return { loading, error, socials };
};

export default useSocials;
