import React from "react";

import './Progress.css'

const Progress = () => {
    return (
        <div className="progress-container">
            <div className="progress-old">
                <h1>Vooruitgang</h1>
                <span>Oud</span>
                <h1>14 cm</h1>
            </div>
            <div className="progress-new">
                <span>Oud</span>
                <h1>12,9 cm</h1>
            </div>
            <div className="progress-improve">
                <span>Verbetering</span>
                <h1>-1,1 cm</h1>
                <button>Volgende</button>
            </div>
        </div>
    );
}

export default Progress;