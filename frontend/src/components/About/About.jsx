import Card from "@components/Card/Card";
import Button from "@components/Button/Button";
import Reveal from "@components/Reveal/Reveal";
import useSiteContent from "@hooks/useSiteContent";
import "./About.css"

const AcademicIcon = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9.78272 3.49965C11.2037 2.83345 12.7962 2.83345 14.2172 3.49965L20.9084 6.63664C22.3639 7.31899 22.3639 9.68105 20.9084 10.3634L14.2173 13.5004C12.7963 14.1665 11.2038 14.1665 9.78281 13.5004L3.0916 10.3634C1.63613 9.68101 1.63614 7.31895 3.0916 6.63659L9.78272 3.49965Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M2 8.5V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M19 11.5V16.6254C19 17.6334 18.4965 18.5772 17.6147 19.0656C16.1463 19.8787 13.796 21 12 21C10.204 21 7.8537 19.8787 6.38533 19.0656C5.5035 18.5772 5 17.6334 5 16.6254V11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
);

const ClockIcon = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21.25 12C21.25 6.89137 17.1086 2.75 12 2.75C6.89137 2.75 2.75 6.89137 2.75 12C2.75 17.1086 6.89137 21.25 12 21.25C17.1086 21.25 21.25 17.1086 21.25 12Z" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <path d="M12 7.25V11.6895L14.0303 13.7197" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="12" cy="12" r="0.8" fill="currentColor" />
    </svg>
);

const FeedIcon = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 10C3 6.22876 3 4.34315 4.17157 3.17157C5.34315 2 7.22876 2 11 2H13C16.7712 2 18.6569 2 19.8284 3.17157C21 4.34315 21 6.22876 21 10V14C21 17.7712 21 19.6569 19.8284 20.8284C18.6569 22 16.7712 22 13 22H11C7.22876 22 5.34315 22 4.17157 20.8284C3 19.6569 3 17.7712 3 14V10Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M6 12C6 10.5858 6 9.87868 6.43934 9.43934C6.87868 9 7.58579 9 9 9H15C16.4142 9 17.1213 9 17.5607 9.43934C18 9.87868 18 10.5858 18 12V16C18 17.4142 18 18.1213 17.5607 18.5607C17.1213 19 16.4142 19 15 19H9C7.58579 19 6.87868 19 6.43934 18.5607C6 18.1213 6 17.4142 6 16V12Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M7 6H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

const ListIcon = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 6L3 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M10 11L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M10 16H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M14 13.5L16.1 16L20 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const ICONS = [AcademicIcon, ClockIcon, FeedIcon, ListIcon];

const statisticsData = [
    {
        id: 1,
        number: "1000",
        title: "Випускників",
        desc: "Допомогли дітям зробити перші кроки в IT та перетворили захоплення іграми на корисні навички.",
        icon: AcademicIcon
    },
    {
        id: 2,
        number: "5000",
        title: "Годин практики",
        desc: "Жодних нудних лекцій. Навчання побудоване на інтерактиві, щоб дитина не втрачала цікавість.",
        icon: ClockIcon
    },
    {
        id: 3,
        number: "700",
        title: "Готових проєктів",
        desc: "Наші учні вже створили власні ігри, сайти та додатки. Кожен проходить шлях від ідеї до релізу.",
        icon: FeedIcon
    },
    {
        id: 4,
        number: "8000",
        title: "Виконаних завдань",
        desc: "Фокус на реальній роботі з кодом. Ми вчимо логічно мислити та вирішувати складні задачі самостійно.",
        icon: ListIcon
    }
];


const About = () => {
    const site = useSiteContent();
    const stats = (site.about_stats?.length ? site.about_stats : statisticsData).map((item, index) => ({
        ...item,
        id: index + 1,
        icon: ICONS[index] || ICONS[0],
    }));

    return (
        <section id="features" className="about container">
            <Button text={'Обрати курс'} classes={'btn-course step-2 mobile-hero-btn '} action='scroll-to' />

            <ul className="about-cards">
                {stats.map(({ id, number, title, desc, icon }) =>
                (
                    <Reveal key={id}>
                        <Card
                            number={number}
                            title={title}
                            desc={desc}
                            icon={icon}
                        />
                    </Reveal>
                ))}
            </ul>
        </section>
    )
}

export default About