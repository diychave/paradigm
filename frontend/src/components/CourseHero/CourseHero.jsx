import Header from "@components/Header/Header";
import Button from "@components/Button/Button";


import './CourseHero.css'

const StarSparkleIcon = () => (
    <svg width="24" height="19" viewBox="0 0 24 19" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6.4077 8.147L6.75918 9.12156L3.125 12.4563L8.05111 12.7037L8.40259 13.6783L2.30352 13.2735L1.97104 12.3516L6.4077 8.147ZM11.5118 16.1287L10.8533 16.3662L11.8464 2.61364L12.5049 2.37615L11.5118 16.1287ZM14.9654 5.0606L21.0645 5.46539L21.397 6.38727L16.9603 10.5919L16.6088 9.6173L20.243 6.28256L15.3169 6.03515L14.9654 5.0606Z" fill="currentColor" />
    </svg>
);

const CodeSparkleIcon = () => (
    <svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3.86954 13.5513C3.06589 13.4133 2.50172 13.1027 2.17704 12.6195C1.85896 12.1478 1.80742 11.5108 2.02241 10.7084L2.62753 8.45007C2.77247 7.90915 2.7597 7.52406 2.58923 7.29479C2.41876 7.06552 2.0811 6.88325 1.57624 6.74798L1.80815 5.88251C2.313 6.01778 2.69656 6.02876 2.95883 5.91545C3.22109 5.80213 3.42469 5.47501 3.56963 4.9341L4.17475 2.67576C4.38974 1.8734 4.75291 1.34747 5.26424 1.09798C5.787 0.841887 6.43088 0.854983 7.19589 1.13727L6.96398 2.00274C6.43756 1.80371 6.02728 1.76624 5.73313 1.89034C5.43899 2.01444 5.21704 2.35596 5.06727 2.91491L4.46215 5.17325C4.20367 6.13788 3.69506 6.62967 2.93631 6.6486C3.58394 7.04437 3.77852 7.72458 3.52005 8.68922L2.91493 10.9476C2.76516 11.5065 2.78662 11.9132 2.9793 12.1678C3.17199 12.4223 3.54603 12.595 4.10145 12.6859L3.86954 13.5513ZM7.78465 14.6004L8.01655 13.7349C8.54298 13.934 8.95326 13.9714 9.2474 13.8473C9.54155 13.7232 9.7635 13.3817 9.91327 12.8228L10.5184 10.5644C10.7769 9.59978 11.2855 9.10799 12.0442 9.08906C11.3966 8.69329 11.202 8.01308 11.4605 7.04845L12.0656 4.79011C12.2154 4.23116 12.1939 3.82442 12.0012 3.56987C11.8086 3.31533 11.4345 3.14263 10.8791 3.05179L11.111 2.18632C11.9147 2.32435 12.4743 2.63375 12.79 3.1145C13.1171 3.58864 13.1731 4.2269 12.9581 5.02926L12.353 7.28759C12.2081 7.82851 12.2208 8.21361 12.3913 8.44287C12.5618 8.67214 12.8994 8.85441 13.4043 8.98969L13.1724 9.85516C12.6675 9.71988 12.284 9.7089 12.0217 9.82221C11.7594 9.93553 11.5558 10.2626 11.4109 10.8036L10.8058 13.0619C10.5908 13.8643 10.2231 14.389 9.70278 14.6361C9.18904 14.8946 8.54966 14.8827 7.78465 14.6004Z" fill="currentColor" />
    </svg>
);

const HashSparkleIcon = () => (
    <svg width="9" height="10" viewBox="0 0 9 10" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7.82671 3.34292L6.17962 3.5932L6.15518 5.2962L7.81611 5.04382L7.80389 5.89532L6.14296 6.1477L6.1063 8.7022L5.22047 8.8368L5.25713 6.28231L3.4301 6.55993L3.39344 9.11443L2.50761 9.24903L2.54427 6.69454L0.883334 6.94692L0.895553 6.09542L2.55649 5.84304L2.58093 4.14004L0.90615 4.39453L0.918369 3.54303L2.59314 3.28854L2.6298 0.734041L3.51563 0.599436L3.47898 3.15393L5.306 2.87631L5.34266 0.321813L6.22849 0.187208L6.19183 2.74171L7.83893 2.49142L7.82671 3.34292ZM5.26935 5.43081L5.29378 3.72781L3.46676 4.00543L3.44232 5.70843L5.26935 5.43081Z" fill="currentColor" />
    </svg>
);

const CourseHero = (props) => {

    const { id, title, subtitle, description, ageRange, tags, image } = props.content
    const isPython = id === 'python'
    return (
        <>

            <section className="container">
                <Header />
                <div className="hero-course-wrapper" >
                    <div className="hero-course-content">
                        <div className="hero-course-tags">
                            <div className="course-tag" style={{ borderRadius: '1.6rem' }}>
                                <p>Для дітей {ageRange}</p></div>
                            <div className="course-tag" style={{ borderRadius: '1.6rem' }}>
                                <p>{tags[0]}</p></div>
                            <div className="course-tag" style={{ borderRadius: '1.6rem' }}>
                                <p>{tags[1]}</p></div>
                        </div>

                        <div>
                            <div className="hero-course-text">
                                <h2 className="hero-course-content-title">{title} - <br /> {subtitle.toLowerCase()}</h2>
                                <p className="hero-content-desc">{description}</p>
                            </div>
                            <Button text={'Записатися'} classes={'btn-course step-1 course-page-button'} action='modal' />
                        </div>
                    </div>
                    <div className="hero-course-logo">
                        <img src={image} alt="" />
                        {isPython && (
                            <div className="course-logo-sparkles" aria-hidden="true">
                                <div className="course-logo-sparkle course-logo-sparkle-top-left">
                                    <StarSparkleIcon />
                                </div>
                                <div className="course-logo-sparkle course-logo-sparkle-top-right">
                                    <CodeSparkleIcon />
                                </div>
                                <div className="course-logo-sparkle course-logo-sparkle-bottom">
                                    <HashSparkleIcon />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </>
    )
}


export default CourseHero;