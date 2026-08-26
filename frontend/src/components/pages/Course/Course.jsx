import Response from "@components/Response/Response";
import CourseHero from "@components/CourseHero/CourseHero";
import AboutCourse from "@components/AboutCourse/AboutCourse";
import Form from "@components/Form/Form";
import Footer from "@components/Footer/Footer";
import Tabs from "@components/Tabs/Tabs";
import ChildWork from "@components/ChildWork/ChildWork";
import { CourseHeroSkeleton } from "@components/Skeletons/Skeletons";
import { ErrorState } from "@components/ErrorBoundary/ErrorBoundary";
import { ResponseTextWrapper } from "@components/Response/Response";
import { Link, useParams } from "react-router-dom";
import { HashLink } from "react-router-hash-link";
import useCourse from "@hooks/useCourse";
import "./Course.css"
import Reveal from "@components/Reveal/Reveal";

const Course = () => {
    const { id } = useParams();
    const { content, loading, error } = useCourse(id);

    if (error) {
        return <ErrorState message="Не вдалося завантажити курс. Спробуйте оновити сторінку." />;
    }
    if (loading || !content) {
        return (
            <>
                <CourseHeroSkeleton />
            </>
        )
    }
    return (
        <div className="main" >
            <CourseHero content={content} />
            <Reveal>
                <AboutCourse content={content.fit} suitable={content.suitable} />
            </Reveal>
            <Reveal>
                <ChildWork video={content.video} isActive={true} />
            </Reveal>
            <Reveal>
                <Tabs content={content.plans} course={id} />
            </Reveal>
            <Reveal>
                <Response>
                    <Reveal>
                        <ResponseTextWrapper filter={id} arrowHideClass={"arrows-mobile-hide"} useCarousell={true} />
                    </Reveal>
                </Response>
            </Reveal>
            <Reveal>
                <Form />
            </Reveal>


            <Footer >
                <ul className="footer-nav">
                    <li><Link to="/">Головна</Link></li>
                    <li><a href="#about">Переваги</a></li>
                    <li><HashLink to="/#courses">Курси</HashLink></li>
                    <li><a href="#responses">Відгуки</a></li>
                </ul>
            </Footer>
        </div>

    )
}

export default Course;
