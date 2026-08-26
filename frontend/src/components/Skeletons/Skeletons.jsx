import './Skeletons.css'

export const SkeletonCard = () => {
    return (
        <div className="course-card course-card-container base-card">
            <div className="skeleton-age shimmer"></div>

            <div className="skeleton-image shimmer"></div>

            <div className="course-card-text-content">
                <div className="skeleton-title shimmer"></div>

                <div className="skeleton-description">
                    <div className="skeleton-line shimmer"></div>
                    <div className="skeleton-line shimmer"></div>
                    <div className="skeleton-line shimmer"></div>
                    <div className="skeleton-line short shimmer"></div>
                </div>
            </div>

            <div className="course-card-btns">
                <div className="skeleton-more shimmer"></div>

                <div className="skeleton-btn shimmer"></div>
            </div>
        </div>
    );
};
export const ReviewCardSkeleton = () => {
    return (
        <div className="review-card-container review-card-skeleton">
            <div className="skeleton-course shimmer"></div>

            <div className="review-card-skeleton-content">
                <div className="skeleton-name shimmer"></div>

                <div className="skeleton-review">
                    <div className="skeleton-line shimmer"></div>
                    <div className="skeleton-line shimmer"></div>
                    <div className="skeleton-line shimmer"></div>
                    <div className="skeleton-line shimmer"></div>
                    <div className="skeleton-line short shimmer"></div>
                </div>
            </div>
        </div>
    );
};

export const PricingCardSkeleton = () => {
    return (
        <div className="pricing-card bg-secondary base-card card-padding">
            <div className="skeleton-pricing-tag shimmer"></div>

            <div className="skeleton-pricing-lessons shimmer"></div>

            <div className="skeleton-pricing-price shimmer"></div>

            <div className="skeleton-pricing-per-lesson shimmer"></div>

            <div className="skeleton-pricing-btn shimmer"></div>
        </div>
    );
};

export const CourseHeroSkeleton = () => {
    return (
        <section className="course-hero-skeleton container">
            <div className="hero-skeleton-top">
                <div className="hero-skeleton-logo shimmer"></div>

                <div className="hero-skeleton-header-right">
                    <div className="hero-skeleton-phone shimmer"></div>
                    <div className="hero-skeleton-header-btn shimmer"></div>
                </div>
            </div>

            <div className="hero-skeleton-content">
                <div className="hero-skeleton-left">
                    <div className="hero-skeleton-tags">
                        <div className="hero-skeleton-tag shimmer"></div>
                        <div className="hero-skeleton-tag shimmer"></div>
                        <div className="hero-skeleton-tag shimmer"></div>
                    </div>

                    <div className="hero-skeleton-title">
                        <div className="hero-line shimmer"></div>
                        <div className="hero-line shimmer"></div>
                        <div className="hero-line short shimmer"></div>
                    </div>

                    <div className="hero-skeleton-text">
                        <div className="hero-text-line shimmer"></div>
                        <div className="hero-text-line shimmer"></div>
                        <div className="hero-text-line shimmer"></div>
                        <div className="hero-text-line short shimmer"></div>
                    </div>

                    <div className="hero-skeleton-btn shimmer"></div>
                </div>

                <div className="hero-skeleton-image shimmer"></div>
            </div>
        </section>
    );
};