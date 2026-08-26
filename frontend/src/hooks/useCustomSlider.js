import { useCallback, useMemo, useRef, useState } from "react";

const MAX_VISIBLE_DOTS = 10;

const getVisibleDots = (slidesCount, activeIndex) => {
    if (slidesCount <= MAX_VISIBLE_DOTS) {
        return Array.from({ length: slidesCount }, (_, i) => i);
    }

    let start = Math.max(0, activeIndex - Math.floor(MAX_VISIBLE_DOTS / 2));
    let end = start + MAX_VISIBLE_DOTS;

    if (end > slidesCount) {
        end = slidesCount;
        start = end - MAX_VISIBLE_DOTS;
    }

    return Array.from({ length: end - start }, (_, i) => start + i);
};

const useCustomSlider = ({ slidesCount, onSlideChange, onReachEnd }) => {
    const prevRef = useRef(null);
    const nextRef = useRef(null);
    const swiperRef = useRef(null);

    const [activeIndex, setActiveIndex] = useState(0);
    const [isBeginning, setIsBeginning] = useState(true);
    const [isEnd, setIsEnd] = useState(false);

    const visibleDots = useMemo(
        () => getVisibleDots(slidesCount, activeIndex),
        [slidesCount, activeIndex]
    );

    const goToSlide = useCallback((index) => {
        swiperRef.current?.slideTo(index);
    }, []);

    const handleSwiperInit = useCallback((swiper) => {
        swiperRef.current = swiper;
        setTimeout(() => {
            if (!swiper.navigation) return;
            swiper.params.navigation.prevEl = prevRef.current;
            swiper.params.navigation.nextEl = nextRef.current;
            swiper.navigation.init();
            swiper.navigation.update();
        });
    }, []);

    const handleSlideChange = useCallback((swiper) => {
        setActiveIndex(swiper.activeIndex);
        setIsBeginning(swiper.isBeginning);
        setIsEnd(swiper.isEnd);

        const visibleSlides =
            typeof swiper.params.slidesPerView === "number"
                ? swiper.params.slidesPerView
                : 1;
        const remaining = slidesCount - (swiper.activeIndex + visibleSlides);
        if (remaining <= 3) {
            onReachEnd?.();
        }
        onSlideChange?.(swiper.activeIndex);
    }, [slidesCount, onReachEnd, onSlideChange]);

    const handleProgress = useCallback((swiper, progress) => {
        if (progress > 0.8) {
            onReachEnd?.();
        }
    }, [onReachEnd]);

    return {
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
    };
};

export default useCustomSlider;
