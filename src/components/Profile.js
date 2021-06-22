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
            <span id='koppel-code'>Geen koppel-code in gebruik.</span>
            <button id="koppel-btn" onClick={ () => {
                document.querySelector('#koppel-div').hidden = false;
                document.querySelector('#koppel-btn').hidden = true;
            }}>Ontvang koppel-code</button>
            <div id="koppel-div" hidden>
                <input id="koppel-input" type="text"/>
                <button onClick={ () => {
                    set('exersiceId', document.querySelector('#koppel-input').value).then(r => {
                        document.querySelector('#koppel-div').hidden = true;
                        document.querySelector('#koppel-code').textContent = "Koppelcode: " + document.querySelector('#koppel-input').value;
                        document.querySelector('#koppel-share').hidden = false;
                    });
                }}>Koppel</button>
            </div>
            <button id='koppel-share' hidden onClick={() => {
                get('exersiceId').then(value => {
                    get('history').then(data => {
                        data.results.forEach(result => {
                            fetch('https://oogzorg-backend.herokuapp.com/api/result', {
                                method: 'POST',
                                body: JSON.stringify({ exerciseId: value, date: result.date, cm: result.data })
                            }).then(res => console.log(res));
                        });
                    });
                });
            }}>Deel Resultaten</button>
            <h1>Resultaten</h1>
            {history_render()}
            <NavBar/>
        </div>
    );
}

export default Profile;