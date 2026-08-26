import "./Card.css"

const Card = ({ number, title, desc, icon, useCoursePageCard }) => {
    const Icon = icon;

    return (
        <li className={"about-card-container bg-def " + (useCoursePageCard ? '' : 'about-card')}>
            {Icon ? (
                <div className="card-icon">
                    {typeof Icon === 'string' ? (
                        <img src={Icon} alt="card icon" />
                    ) : (
                        <Icon />
                    )}
                </div>
            ) : null}
            <h3 className="card-num">{useCoursePageCard ? null : number + '+'}</h3>
            <p className="card-title">{title}</p>
            <p className="card-desc p-small-secondary" >{desc}</p>
        </li>
    )
}

export default Card