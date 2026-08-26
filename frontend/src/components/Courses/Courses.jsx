import { SwiperSlide } from 'swiper/react';
import CourseCard from "@components/CourseCard/CourseCard";
import { SkeletonCard } from '@components/Skeletons/Skeletons';
import CustomSlider from "@components/CustomSlider/CustomSlider";
import useCourses from '@hooks/useCourses';
import "./Courses.css"

const Courses = () => {
    const { loading, courses } = useCourses();

    return (
        <section id="courses" className="container courses-container section">

            <div className="courses-top-content">
                <h2 className="h2">Наші курси</h2>

                <p className="p-small-secondary">
                    Ми допомагаємо дітям розвивати логічне мислення, креативність та впевненість у собі через програмування. Кожен курс адаптований під вік дитини та подається у простій і цікавій формі.
                </p>
            </div>

            {loading ? <CustomSlider slidesCount={3}
                breakpoints={{
                    950: { slidesPerView: 2, spaceBetween: 18, },
                    1400: { slidesPerView: 3, spaceBetween: 24, },
                }}
            >
                {[0, 1, 2].map((index) => (
                    <SwiperSlide key={index}>
                        <SkeletonCard />
                    </SwiperSlide>
                ))}
            </CustomSlider> : <CustomSlider slidesCount={courses.length}
                breakpoints={{
                    950: { slidesPerView: 2, spaceBetween: 18, },
                    1400: { slidesPerView: 3, spaceBetween: 24, },
                }}
            >
                {courses.map(({ id, title, ageRange, description, cardImage }) => (
                    <SwiperSlide key={id}>
                        <CourseCard
                            id={id}
                            title={title}
                            ageRange={ageRange}
                            description={description}
                            cardImage={cardImage}
                        />
                    </SwiperSlide>
                ))}
            </CustomSlider>}

        </section>
    );
};

export default Courses;
