import Button from "@components/Button/Button"
import Elipse from "@components/Elipse/Elipse"
import Header from "@components/Header/Header"
import image1 from "@/assets/images/image1.png"
import image2 from "@/assets/images/image2.png"
import useSiteContent from "@hooks/useSiteContent"
import "./Hero.css"



const Hero = () => {
    const site = useSiteContent();
    const tags = site.hero_tags?.length ? site.hero_tags : ["Сертифікат про навчання", "IT-професія", "Портфоліо проектів"];

    return (
        <section id="hero" className="hero container  ">
            <Header></Header>

            <div className="hero-wrapper">
                <div className="hero-content">
                    <div className="hero-tags">
                        {tags.map((tag) => (
                            <div key={tag} className="tag" style={{ borderRadius: "1.6rem" }}>
                                <p>{tag}</p>
                            </div>
                        ))}
                    </div>

                    <div>
                        <div className="hero-text">
                            <h2 className="hero-content-title">{site.hero_title}</h2>
                            <p className="hero-content-desc">{site.hero_description}</p>
                        </div>
                        <div className="btns hero-btns">
                            <Button text={'Записатися'} classes={'btn-course step-1 hero-mobile-shadow-btn'} action='modal' />
                            <Button text={'Обрати курс'} classes={'btn-course step-2 hero-desctop-btn'} action='scroll-to' />
                        </div>
                    </div>
                </div>

                <div className="hero-wrapper-imgs">
                    <img src={image1} alt="" />
                    <img src={image2} alt="" />
                </div>
            </div>

            <Elipse parametr='glow-blue hero-1'></Elipse>
            <Elipse parametr='glow-green hero-2'></Elipse>
            <Elipse parametr='glow-blue hero-3'></Elipse>

        </section>
    )
}

export default Hero;