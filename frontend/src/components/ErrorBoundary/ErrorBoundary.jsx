import { Component } from "react";
import "./ErrorBoundary.css";

export const ErrorState = ({ message, onRetry }) => (
    <div className="error-boundary">
        <h2 className="h2">Щось пішло не так</h2>
        <p className="p-small-secondary">
            {message || "Сталася непередбачена помилка. Спробуйте оновити сторінку."}
        </p>
        <button className="error-boundary-btn" onClick={onRetry || (() => window.location.reload())}>
            Оновити сторінку
        </button>
    </div>
);

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error(error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return <ErrorState onRetry={this.handleReload} />;
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
