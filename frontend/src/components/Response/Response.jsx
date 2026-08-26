import { useMemo } from "react";
import { SwiperSlide } from "swiper/react";

import Elipse from "@components/Elipse/Elipse";
import VideoCard from "@components/VideoCard/VideoCard";
import CustomSlider from "@components/CustomSlider/CustomSlider";
import ReviewCard from "@components/ReviewCard/ReviewCard";
import Loader from "@components/Loader/Loader";
import { ReviewCardSkeleton } from "@components/Skeletons/Skeletons";
import useVideoReviews from "@hooks/useVideoReviews";
import useTextReviews from "@hooks/useTextReviews";
import "./Response.css";

const Response = ({ useElipse, children }) => {
    return (
        <section
            id="responses"
            className="response-section container rel-section section"
        >
            {useElipse && <Elipse parametr="glow-blue response-1" />}

            <ResponseTitle />

            <div className="response-sliders-wrapper">
                {children}
            </div>
        </section>
    );
};

export const ResponseTitle = () => (
    <div className="response-text-content text-content-wrapper">
        <h2 className="h2">Відгуки</h2>

        <p className="p-small-secondary">
            Відгуки наших учнів і батьків — найкраще підтвердження
            якості навчання. Перегляньте відео та прочитайте реальні історії.
        </p>
    </div>
);

export const ResponseVideoWrapper = () => {
    const { loading, videos, currentSlide, setCurrentSlide } = useVideoReviews();

    const videosData = useMemo(
        () =>
            videos.map(({ video, id }, index) => (
                <SwiperSlide key={id}>
                    <VideoCard
                        src={video}
                        isActive={currentSlide === index}
                    />
                </SwiperSlide>
            )),
        [videos, currentSlide]
    );

    if (loading) return (<Loader />)

    return (
        <div className="response-slider-video-wrapper">
            <CustomSlider
                slidesCount={videos.length}
                spaceBetween={16}
                slidesPerView={1}
                onSlideChange={setCurrentSlide}
            >
                {videosData}
            </CustomSlider>
        </div>
    );
};

export const ResponseTextWrapper = ({
    filter,
    arrowHideClass,
    useCarousell,
}) => {
    const { reviews, hasMore, loading, handleReachEnd } = useTextReviews({ filter });

    const reviewsData = useMemo(
        () =>
            reviews.map(({ id, name, course, review }) => (
                <SwiperSlide key={id}>
                    <ReviewCard
                        id={id}
                        name={name}
                        course={course?.startsWith("w") ? "Web" : course}
                        review={review}
                    />
                </SwiperSlide>
            )),
        [reviews]
    );

    const breakpoints = useMemo(
        () => ({
            950: {
                slidesPerView: 3,
                spaceBetween: 18,
            },
            1440: {
                slidesPerView: 4,
                spaceBetween: 24,
            },
        }),
        []
    );

    const showSkeleton = loading && !reviews.length;

    return (
        <div className="response-slider-text-wrapper">
            {showSkeleton && (
                <CustomSlider
                    slidesCount={3}
                    freeScroll={false}
                    spaceBetween={16}
                    slidesPerView={1}
                    breakpoints={breakpoints}
                    arrowHideClass={arrowHideClass}
                    useCarousell={useCarousell}
                >
                    {[0, 1, 2].map((i) => (
                        <SwiperSlide key={i}>
                            <ReviewCardSkeleton />
                        </SwiperSlide>
                    ))}
                </CustomSlider>
            )}
            {!!reviews.length && (
                <CustomSlider
                    slidesCount={reviews.length}
                    freeScroll={false}
                    loop={!hasMore}
                    spaceBetween={16}
                    slidesPerView={1}
                    breakpoints={breakpoints}
                    arrowHideClass={arrowHideClass}
                    onReachEnd={handleReachEnd}
                    useCarousell={useCarousell}
                >
                    {reviewsData}
                </CustomSlider>
            )}
        </div>
    );
};

export default Response;
