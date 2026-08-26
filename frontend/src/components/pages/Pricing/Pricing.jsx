import Header from "@components/Header/Header";
import Footer from "@components/Footer/Footer";
import Button from "@components/Button/Button";
import { Link } from "react-router-dom";
import usePricing from "@hooks/usePricing";
import { PricingCardSkeleton } from "@components/Skeletons/Skeletons";
import "./Pricing.css";

const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const formatPrice = (value) => value.toLocaleString("uk-UA");

const PricingCard = ({ tier }) => (
    <div className="pricing-card bg-secondary base-card card-padding">
        <div className="pricing-card-tag">{tier.tag}</div>

        {tier.discount && <span className="absolute-card-span pricing-card-discount">-{tier.discount}%</span>}

        <h3 className="pricing-card-lessons">{tier.lessonsLabel}</h3>

        <div className="pricing-card-price-row">
            {tier.oldPrice && <span className="pricing-card-price-old">{formatPrice(tier.oldPrice)} грн</span>}
            <span className="pricing-card-price-new">{formatPrice(tier.price)} грн</span>
        </div>

        <p className="p-small-secondary pricing-card-per-lesson">{formatPrice(tier.pricePerLesson)} грн / урок</p>

        {tier.savings && (
            <p className="pricing-card-savings">
                <CheckIcon />
                Вигода {formatPrice(tier.savings)} грн
            </p>
        )}

        <Button text="Оплатити" classes="btn-course course-card-step-1 pricing-card-btn" useRouterLink="#" />
    </div>
);

const Pricing = () => {
    const { tiers, loading } = usePricing();

    return (
        <div className="main">
            <Header />

            <section className="pricing-page section container">
                <h1 className="h2 pricing-page-title">Платіть менше, отримуйте більше</h1>
                <p className="p-small-secondary pricing-page-subtitle">
                    Обирайте абонемент зі знижкою — чим більше занять у пакеті, тим менша вартість одного уроку.
                </p>

                <div className="pricing-grid">
                    {loading
                        ? [0, 1, 2].map((i) => <PricingCardSkeleton key={i} />)
                        : tiers.map((tier) => (
                            <PricingCard key={tier.id} tier={tier} />
                        ))}
                </div>

                <p className="p-small-secondary pricing-page-footnote">
                    * Йдеться про оплату конкретної кількості занять одним платежем.
                </p>
            </section>

            <Footer>
                <ul className="footer-nav">
                    <li><Link className="footer-link" to="/">Головна</Link></li>
                    <li><Link className="footer-link" to="/#features">Переваги</Link></li>
                    <li><Link className="footer-link" to="/#courses">Курси</Link></li>
                    <li><Link className="footer-link" to="/#responses">Відгуки</Link></li>
                </ul>
            </Footer>
        </div>
    );
};

export default Pricing;
