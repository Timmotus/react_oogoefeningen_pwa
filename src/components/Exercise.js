import React from "react";

import './Exercise.css'

const Excercise = () => {
    return (
        <div className="exercise-container">
            <h1>Klaar!</h1>
            <span>Voortgang zien?</span>
            <div className="exercise-buttons">
                <button>Ja</button>
                <button>Nee</button>
            </div>
        </div>
    );
}

export default Excercise;