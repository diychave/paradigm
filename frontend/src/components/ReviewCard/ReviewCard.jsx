import { useLayoutEffect, useRef, useState } from "react";
import ChevronIcon from "@utils/icons/ChevronIcon";
import "./ReviewCard.css"

const MAX_LINES = 6;

const ReviewCard = ({ id, name, course, review }) => {
    const [expanded, setExpanded] = useState(false);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const [collapsedDescHeight, setCollapsedDescHeight] = useState(0);
    const [fullDescHeight, setFullDescHeight] = useState(0);
    const [collapsedContainerHeight, setCollapsedContainerHeight] = useState(0);

    const containerRef = useRef(null);
    const descRef = useRef(null);

    useLayoutEffect(() => {
        const desc = descRef.current;
        const container = containerRef.current;
        if (!desc || !container) return;

        const measure = () => {
            const lineHeight = parseFloat(getComputedStyle(desc).lineHeight) || 0;
            const collapsed = lineHeight * MAX_LINES;

            setCollapsedDescHeight(collapsed);
            setFullDescHeight(desc.scrollHeight);
            setIsOverflowing(desc.scrollHeight > collapsed + 1);
            setCollapsedContainerHeight(container.getBoundingClientRect().height);
        };

        measure();
        window.addEventListener("resize", measure);
        return () => window.removeEventListener("resize", measure);
    }, [review]);

    const expandedContainerHeight = collapsedContainerHeight - collapsedDescHeight + fullDescHeight;

    return (
        <div
            ref={containerRef}
            className={`review-card-container base-card bg-secondary card-padding ${expanded ? "expanded" : ""} ${isOverflowing ? "has-toggle" : ""}`}
            style={isOverflowing ? { maxHeight: `${expanded ? expandedContainerHeight : collapsedContainerHeight}px` } : undefined}
        >
            <span className="absolute-card-span ">{course}</span>
            <h3 className="review-card-name">{name}</h3>
            <p
                className="p-small-secondary review-card-desc"
                ref={descRef}
                style={isOverflowing ? { maxHeight: `${expanded ? fullDescHeight : collapsedDescHeight}px` } : undefined}
            >
                {review}
            </p>
            {isOverflowing && (
                <button
                    type="button"
                    className="review-card-toggle"
                    onClick={() => setExpanded((prev) => !prev)}
                    aria-expanded={expanded}
                    aria-label={expanded ? "Згорнути відгук" : "Розгорнути відгук"}
                >
                    <ChevronIcon />
                </button>
            )}
        </div>
    )
}

export default ReviewCard;