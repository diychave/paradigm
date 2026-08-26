import VideoCard from "@components/VideoCard/VideoCard"
import Elipse from "@components/Elipse/Elipse"
import './ChildWork.css'

const ChildWork = ({ video, isActive }) => {


    return (
        <>
            <section className=" childwork-section section container">
            <Elipse parametr="glow-blue child-1" />

                <div className="childwork-top">
                    <h2 className="h2">Що створить дитина</h2>
                    <div className="childwork-top-left-content">
                        <p className="p-small-secondary">
                            Під час курсу учень не просто вивчає теорію, а створює власні програми та міні-проєкти. Кожне заняття — це практика, результат якої можна побачити вже з перших уроків.
                        </p>
                    </div>
                </div>

                <div className="childwork-main">
                    <div className="video-wrapper">
                        <VideoCard src={video} isActive={isActive} />
                    </div>
                    <div className="childwork-main-descriptions">
                        <div className="desc-top">
                            <p className="p-small-secondary">У процесі навчання дитина проходить шлях від простих задач до створення повноцінних програм, які можна запускати, змінювати та показувати іншим.</p>
                        </div>
                        <div className="desc-bottom">
                            <p className="p-small-secondary">Серед проєктів: ігри, калькулятори, програми з інтерфейсом, робота з файлами та власні ідеї учнів.</p>
                        </div>
                    </div>

                </div>

            </section>
        </>
    )
}


export default ChildWork