import { useState } from "react";
import Elipse from "@components/Elipse/Elipse";
import Reveal from "@components/Reveal/Reveal";
import { capitalize } from "@utils/string";
import { formatIndex } from "@utils/format";
import "./Tabs.css";

function Tabs({ content, course }) {
    const plans = Object.assign({}, ...content);

    const tabs = Object.keys(plans).map((key) => ({
        id: key,
        label: capitalize(key),
    }));

    const [activeTab, setActiveTab] = useState(tabs[0]?.id || "");

    return (
        <section className="roadmap container">
            <Elipse parametr="glow-green tabs-1" />
            <Elipse parametr="glow-blue tabs-2" />

            <div>
                <div className="roadmap-top">
                    <h2 className="h2">План навчання</h2>
                    <p className="p-small-secondary">
                        Після проходження кожного етапу наші учні отримують сертифікат
                    </p>
                </div>

                <div className="roadmap-main">
                    <div className="roadmap-tabs">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                className={`roadmap-tab ${activeTab === tab.id ? "active" : ""
                                    }`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <span className="roadmap-tab-label">{course} </span>
                                <span >
                                    {tab.label}
                                </span>

                            </button>
                        ))}
                    </div>

                    <div className="roadmap-list" key={activeTab}>
                        {plans[activeTab]?.map((item, index) => (
                            <Reveal key={index}>
                                <div className="roadmap-card">
                                    <span className="p-small-secondary">
                                        {formatIndex(index)}
                                    </span>

                                    <p className="p-small-secondary">
                                        {item}
                                    </p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Tabs;