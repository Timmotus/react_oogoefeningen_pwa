import React from "react";

import './Exercise.css'
import {get, set} from "idb-keyval";

const Excercise = () => {

    const score = Math.floor(Math.random() * 100);

    const addHistory = async () => {
        const history = await get('history');
        history.results.push(
            {
                date_time: new Date().toLocaleString(),
                data: score
            }
        );
        await set("history", history);
    }

    return (
        <div className="exercise-container">
            <h1>Klaar!</h1>
            <span>Voortgang zien?</span>
            <div className="exercise-buttons">
                <button onClick={() => {
                    addHistory();
                    window.location.href = '/progress?data=' + score;
                }}>Ja</button>
                <button onClick={() => {
                    addHistory();
                    window.location.href = '/';
                }}>Nee</button>
            </div>
        </div>
    );
}

export default Excercise;