import React, {useState} from "react";

import './Progress.css'
import {get} from "idb-keyval";

const Progress = () => {

    const [lastScore, setLastScore] = useState(null);

    const updateLastScore = async () => {
        const history = await get('history');
        if (history.results.length < 2) setLastScore(null);
        else setLastScore(history.results[history.results.length - 2].data);
    }

    updateLastScore();
    return (
        <div className="progress-container">
            <div className="progress-old">
                <h1>Vooruitgang</h1>
                <span>Oud</span>
                <h1>{lastScore == null ? 'Geen geschiedenis' : lastScore + ' cm'}</h1>
            </div>
            <div className="progress-new">
                <span>Nieuw</span>
                <h1>{new URLSearchParams(window.location.search).get('data')} cm</h1>
            </div>
            <div className="progress-improve">
                <span>Verandering</span>
                <h1>{(lastScore == null ? 'Geen geschiedenis' : lastScore - (new URLSearchParams(window.location.search).get('data')) + ' cm')}</h1>
                <button onClick={() => window.location.href = '/'}>Volgende</button>
            </div>
        </div>
    );
}

export default Progress;