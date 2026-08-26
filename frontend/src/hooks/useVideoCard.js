import { useEffect, useRef, useState } from "react";

const isMobileOrTablet = () => window.matchMedia("(max-width: 1024px)").matches;

const useVideoCard = (isActive) => {
    const videoRef = useRef(null);
    const [playing, setPlaying] = useState(false);

    const handleToggle = async () => {
        const video = videoRef.current;

        if (video.paused) {
            video.play();
            setPlaying(true);

            if (isMobileOrTablet()) {
                try {
                    if (video.requestFullscreen) {
                        await video.requestFullscreen();
                    } else if (video.webkitRequestFullscreen) {
                        await video.webkitRequestFullscreen();
                    }
                } catch (e) {
                    console.log(e);
                }
            }
        } else {
            video.pause();
            setPlaying(false);

            if (document.fullscreenElement) {
                document.exitFullscreen();
            }
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                setPlaying(false);
                videoRef.current?.pause();
            }
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);

        return () => {
            document.removeEventListener(
                "fullscreenchange",
                handleFullscreenChange
            );
        };
    }, []);

    useEffect(() => {
        const video = videoRef.current;

        if (!isActive && video) {
            video.pause();
            setPlaying(false);
        }
    }, [isActive]);

    return {
        videoRef,
        playing,
        handleToggle,
    };
};

export default useVideoCard;
