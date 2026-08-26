import { useEffect, useState } from "react";
import api from "@services/api";

const FALLBACK = {
    hero_title: "Школа програмування для дітей від 5 років",
    hero_description:
        "З IT Paradigma ваша дитина вже на перших заняттях створить власну гру, програму або сайт.",
    hero_tags: ["Сертифікат про навчання", "IT-професія", "Портфоліо проектів"],
    about_stats: [
        {
            number: "1000",
            title: "Випускників",
            desc: "Допомогли дітям зробити перші кроки в IT та перетворили захоплення іграми на корисні навички.",
        },
        {
            number: "5000",
            title: "Годин практики",
            desc: "Жодних нудних лекцій. Навчання побудоване на інтерактиві, щоб дитина не втрачала цікавість.",
        },
        {
            number: "700",
            title: "Готових проєктів",
            desc: "Наші учні вже створили власні ігри, сайти та додатки. Кожен проходить шлях від ідеї до релізу.",
        },
        {
            number: "8000",
            title: "Виконаних завдань",
            desc: "Фокус на реальній роботі з кодом. Ми вчимо логічно мислити та вирішувати складні задачі самостійно.",
        },
    ],
    footer_description:
        "Онлайн-школа програмування для дітей від 5 до 17 років. Ми навчаємо створювати ігри, сайти та додатки через практику та роботу над реальними проєктами. Ми допомагаємо зробити перші кроки в IT та поступово доводимо учнів до створення власних повноцінних проєктів.",
    footer_phone: "+380 50 600 60 94",
    footer_copyright: "© 2026 IT Paradigma. Всі права захищені",
};

const useSiteContent = () => {
    const [site, setSite] = useState(FALLBACK);

    useEffect(() => {
        let mounted = true;
        api.site
            .get()
            .then((data) => {
                if (mounted && data) setSite({ ...FALLBACK, ...data });
            })
            .catch(() => {});
        return () => {
            mounted = false;
        };
    }, []);

    return site;
};

export default useSiteContent;
