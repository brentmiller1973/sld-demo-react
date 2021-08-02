import React, {useState} from 'react';

const Panel = ({title, children}) => {
    const [opened, setOpened] = useState(false);

    const handleClick = (e) => {
        setOpened(!opened);
    }

    return (
        <div className="sidebar-panel panel-info">
            <div className={`panel-heading ${opened ? "open" : ""}`} onClick={(e) => handleClick(e)}>
                <div>{title}</div>
                <div className="panel-toggle">
                    <svg width="1em" height="1em" viewBox="0 0 16 16" className="bi bi-caret-down-fill"
                         fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
                    </svg>
                </div>
            </div>
            <div className={`panel-body ${!opened ? "hidden" : ""}`}>
                {children}
            </div>
        </div>
    )

}

export default Panel;
