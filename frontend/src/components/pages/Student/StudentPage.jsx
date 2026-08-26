import { Link } from "react-router-dom";
import Header from "@components/Header/Header";
import "./StudentPage.css";

const StudentPage = ({ title, description, leading, children }) => (
    <div className="auth-shell student-shell">
        <Header />
        <main className="student-page">
            <div className="student-page-inner container">
                {leading}
                <h1 className="h2">{title}</h1>
                {description && <p className="p-small-secondary student-page-desc">{description}</p>}
                <div className="student-page-body">{children}</div>
            </div>
        </main>
    </div>
);

export const StudentStub = ({ title, description }) => (
    <StudentPage title={title} description={description}>
        <div className="student-stub">
            <p className="p-small-secondary">Розділ скоро буде доступний.</p>
            <Link to="/account" className="button-utility btn-course step-1 student-stub-btn">
                До кабінету
            </Link>
        </div>
    </StudentPage>
);

export default StudentPage;
