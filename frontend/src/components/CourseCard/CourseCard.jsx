import Button from "@components/Button/Button"
import { Link } from "react-router-dom";
import { truncate } from "@utils/string";
import useMediaQuery from "@hooks/useMediaQuery";
import "./CourseCard.css"

const DESCRIPTION_MAX_LENGTH = 110;

const CourseCard = (props) => {
    const { id, title, ageRange, description, cardImage } = props
    const isMobile = useMediaQuery("(max-width: 949px)");
    const displayedDescription = isMobile ? truncate(description, DESCRIPTION_MAX_LENGTH) : description;

    return (
        <>
            <div className="course-card-container bg-secondary base-card course-card card-padding">
                <p className=" absolute-card-span">{ageRange ? ageRange : title}</p>
                <img src={cardImage} alt="" />
                <div className="course-card-text-content">
                    <h3 >{title}</h3>
                    <p className="p-small-secondary">{displayedDescription}</p>
                </div>
                <div className="course-card-btns">
                    <Button text={"Детальніше"} classes={'btn-course more course-card-more'} useRouterLink={`/course/${id}`}></Button>
                    <Button text={'Записатися'} classes={'btn-course course-card-step-1 '} action='modal'></Button>
                </div>
            </div>
        </>
    )
}


export default CourseCard;