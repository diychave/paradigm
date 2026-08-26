import { useEffect, useState } from "react";
import Elipse from "@components/Elipse/Elipse";
import Button from "@components/Button/Button";
import Reveal from "@components/Reveal/Reveal";
import useServices from "@services/Services";
import ChevronIcon from "@utils/icons/ChevronIcon";
import { formatIndex } from "@utils/format";
import "./FaqAccordion.css";

const FaqAccordion = () => {
    const [activeId, setActiveId] = useState(null);
    const [faqData, setFaqData] = useState([]);
    const { loading, error, getFaq } = useServices();

    useEffect(() => {
        let mounted = true;
        getFaq()
            .then(data => {
                if (mounted) setFaqData(data || []);
            })
            .catch(() => {});

        return () => {
            mounted = false;
        };
    }, [getFaq]);

    const toggleItem = (id) => {
        setActiveId(activeId === id ? null : id);
    };

    return (
        <div className=" faq-section container section">
            <div className="accordion-text-content">
                <h2 className="h2">Відповіді на <br /> найпоширеніші питання</h2>
                <p className="p-small-secondary">Не знайшли потрібне? Напишіть нам.</p>
                <Button text='Поставити питання' classes={'btn-course step-2 accordion-quest-btn'} action='modal'></Button>
            </div>
            <Elipse parametr='glow-green accordion-2'></Elipse>
            <div className="accordion ">
                {loading && (
                    <p className="p-small-secondary accordion-status">Завантаження питань...</p>
                )}
                {error && (
                    <p className="p-small-secondary accordion-status">Не вдалося завантажити питання.</p>
                )}
                {!loading && !error && faqData.map((item, index) => (
                    <div key={item.id} className="accordion-item">

                        <Reveal>
                            <div
                                className="accordion-header"
                                onClick={() => toggleItem(item.id)}
                            >
                                <div className="accordion-left">
                                    <span className="accordion-index">
                                        {formatIndex(index)}
                                    </span>
                                    <span className="accordion-title">{item.title}</span>
                                </div>

                                <div tabIndex={0} className={`accordion-icon ${activeId === item.id ? "open" : ""}`}>
                                    <ChevronIcon />
                                </div>
                            </div>
                        </Reveal>
                        <div
                            className={`accordion-content ${activeId === item.id ? "show" : ""
                                }`}
                        >
                            <p className="accordion-faq-desc">{item.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FaqAccordion