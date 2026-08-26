import { Swiper } from "swiper/react";
import { Navigation, FreeMode, Mousewheel } from "swiper/modules";
import { memo } from "react";
import "swiper/css";
import "swiper/css/navigation";

import useCustomSlider from "@hooks/useCustomSlider";
import "./CustomSlider.css";

const ArrowIcon = ({ className }) => (
    <svg
        className={className}
        width="8"
        height="16"
        viewBox="0 0 8 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
    >
        <path
            d="M0.75 0.75L6.75 7.75L0.75 14.75"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const CustomSlider = ({
    children,
    slidesCount,
    spaceBetween = 16,
    slidesPerView = 1,
    breakpoints,
    onSlideChange,
    onReachEnd,
    arrowHideClass,
    freeScroll = false,
    loop = false,
    useCarousell
}) => {
    const {
        prevRef,
        nextRef,
        activeIndex,
        isBeginning,
        isEnd,
        visibleDots,
        goToSlide,
        handleSwiperInit,
        handleSlideChange,
        handleProgress,
    } = useCustomSlider({ slidesCount, onSlideChange, onReachEnd });

    return (
        <div className="custom-slider">
            <div className="swiper-clip">
                <Swiper
                    loop={loop}
                    loopAdditionalSlides={slidesCount}
                    spaceBetween={spaceBetween}
                    slidesPerView={slidesPerView}
                    navigation={{ prevEl: null, nextEl: null }}
                    modules={[Navigation, FreeMode, Mousewheel]}
                    mousewheel={{
                        forceToAxis: true,
                        releaseOnEdges: true,
                    }}
                    freeMode={freeScroll}
                    grabCursor={true}
                    speed={300}
                    breakpoints={breakpoints || undefined}
                    onSwiper={handleSwiperInit}
                    onSlideChange={handleSlideChange}
                    onProgress={handleProgress}
                >
                    {children}
                </Swiper>
            </div>

            <div className="course-dots">
                {visibleDots.map((index) => (
                    <div
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`dot ${activeIndex === index ? "active" : ""}`}
                    />
                ))}
            </div>

            <div className={`arrows ${arrowHideClass || ""}`}>
                <div
                    tabIndex={0}
                    className={isBeginning && !useCarousell ? "arrow-btn-dis" : "arrow-btn"}
                    ref={prevRef}
                    aria-label="previous"
                >
                    <ArrowIcon className="left-arrow" />
                </div>
                <div
                    tabIndex={0}
                    className={isEnd && !useCarousell ? "arrow-btn-dis" : "arrow-btn"}
                    ref={nextRef}
                    aria-label="next"
                >
                    <ArrowIcon className="right-arrow" />
                </div>
            </div>
        </div>
    );
};

export default memo(CustomSlider);
