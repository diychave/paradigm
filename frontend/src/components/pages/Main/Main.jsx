import Hero from "@components/Hero/Hero";
import About from "@components/About/About";
import Courses from "@components/Courses/Courses";
import FaqAccordion from "@components/FaqAccordion/FaqAccordion";
import Response from "@components/Response/Response";
import Form from "@components/Form/Form";
import Footer from "@components/Footer/Footer";
import { ResponseTextWrapper, ResponseVideoWrapper } from "@components/Response/Response";

import Reveal from "@components/Reveal/Reveal";
import "./Main.css"
const Main = () => {
    return (
        <div className="main ">
            <Hero />
            <About />
            <Reveal>
                <Courses />
            </Reveal>
            <Reveal>
                <FaqAccordion />
            </Reveal>
            <Reveal>
                <Response useElipse>
                    <Reveal>
                        <ResponseVideoWrapper></ResponseVideoWrapper>
                    </Reveal>
                    <Reveal>
                        <ResponseTextWrapper arrowHideClass={"arrows-fullhide"} ></ResponseTextWrapper>
                    </Reveal>
                </Response>
            </Reveal>
            <Reveal>
                <Form />
            </Reveal>
            
            <Footer>
                <ul className="footer-nav">
                    <li><a className="footer-link" href="#hero">Головна</a></li>
                    <li><a className="footer-link" href="#features">Переваги</a></li>
                    <li><a className="footer-link" href="#courses">Курси</a></li>
                    <li><a className="footer-link" href="#responses">Відгуки</a></li>
                </ul>
            </Footer>

        </div>

    )
}

export default Main;