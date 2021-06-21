import React, {useState} from "react";

import './Profile.css'
import NavBar from "./NavBar";
import {get, set} from "idb-keyval";

const Profile = () => {

    const [connectId, setConnectId] = useState(null);
    const [history, setHistory] = useState(null);

    const getHistory = async () => {
        const history = await get('history');
        setHistory(history);
    }

    const history_render = () => {
        if (history == null)
            return (
                <ul className="profile-history-list"><li>Geen Geschiedenis</li></ul>
            );
        else
            return (
                <ul className="profile-history-list">
                    {history.results.map(result => (
                        <li>{result.date_time}: {result.data}</li>
                    ))}
                </ul>
            );
    }

    getHistory();
    return (
        <div className="profile-container">
            <h1>Profiel</h1>
            <span>Geen koppel-code in gebruik.</span>
            <button onClick={() => { }}>Ontvang koppel-code</button>

            <h1>Resultaten</h1>
            {history_render()}
            <NavBar/>
        </div>
    );
}

export default Profile;