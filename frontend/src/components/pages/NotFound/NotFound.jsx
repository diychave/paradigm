import { Link } from "react-router-dom";
import "./NotFound.css";

export default function NotFound() {
    return (
        <main className="not-found">
            <div className="not-found-glow" />

            <div className="not-found-content">
                <span className="not-found-code">
                    404
                </span>

                <h1 className="not-found-title">
                    Сторінку не знайдено
                </h1>

                <p className="not-found-description">
                    Сторінка могла бути переміщена, видалена або ніколи не існувала.
                </p>

                <div className="not-found-actions">
                    <Link
                        to="/"
                        className="btn-course step-1 not-found-btn"
                    >
                        На головну
                    </Link>

                    <button
                        onClick={() => window.history.back()}
                        className="btn-course step-2 not-found-btn"
                    >
                        Назад
                    </button>
                </div>
            </div>
        </main>
    );
}