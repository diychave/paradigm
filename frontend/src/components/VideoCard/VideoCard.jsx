import "./VideoCard.css";
import play from "@/assets/icons/play-icon.png";
import useVideoCard from "@hooks/useVideoCard";
import { cn } from "@utils/classNames";

const VideoCard = ({ src, isActive }) => {
    const { videoRef, playing, handleToggle } = useVideoCard(isActive);

    return (
        <div className="video-card base-card" onClick={handleToggle} >
            <video controls={playing} ref={videoRef} style={playing ? { objectFit: 'contain' } : undefined}>
                <source src={src} type="video/mp4" />
            </video>

            <div className={cn('video-toggle-btn', playing && 'none')} onClick={handleToggle}>
                <img src={play} alt="" onClick={handleToggle} />
            </div>
        </div>
    );
};

export default VideoCard;
