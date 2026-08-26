import { useEffect, useState } from "react";
import useServices from "@services/Services";

const withComputedPrice = (tiers) => {
    const basePerLesson = tiers.find((tier) => tier.lessonsCount === 1)?.pricePerLesson;

    return tiers.map((tier) => {
        const price = tier.pricePerLesson * tier.lessonsCount;
        const oldPrice = basePerLesson ? basePerLesson * tier.lessonsCount : null;
        const hasDiscount = Boolean(oldPrice) && oldPrice > price;

        return {
            ...tier,
            price,
            oldPrice: hasDiscount ? oldPrice : null,
            discount: hasDiscount ? Math.round((1 - price / oldPrice) * 100) : null,
            savings: hasDiscount ? oldPrice - price : null,
        };
    });
};

const usePricing = () => {
    const [tiers, setTiers] = useState([]);
    const { loading, error, getPricing } = useServices();

    useEffect(() => {
        let mounted = true;
        getPricing()
            .then((data) => {
                if (mounted) {
                    setTiers(withComputedPrice(data || []));
                }
            })
            .catch(() => {});

        return () => {
            mounted = false;
        };
    }, [getPricing]);

    return {
        loading,
        error,
        tiers: tiers.filter((tier) => !tier.hidden),
    };
};

export default usePricing;
