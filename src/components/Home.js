import React, {useState} from "react";
import { get, set } from 'idb-keyval';

import './Home.css'

const Home = () => {

    const [time, setTime] = useState(0);

    const home = () => {
        return (
            <div className="home-container">
                <i className="material-icons icon" onClick={() => window.location.href = '/info'}>help</i>
                <i className="material-icons icon icon-2" onClick={() => window.location.href = '/info'}>account_circle</i>
                <img src={'./assets/face_phone.png'} alt=""/>
                <h1>Welkom!</h1>
                <span>Er staan oefeningen voor je klaar!</span>
                <button onClick={async () => { await set('time', 10); window.location.href = '/exercise'}}><i className="material-icons">play_arrow</i>Start<i/></button>
            </div>
        );
    }

    const wait = () => {
        return (
            <div className="home-container wait">
                <img src={'./assets/face_phone.png'} alt="" className="smaller"/>
                <span>Nog {time}s Wachten</span>
                <h1>Lekker bezig!</h1>
                <span>Als de timer klaar is kan je weer oefenen!</span>
                <button onClick={() => window.location.href = '/info'}><i className="material-icons">person</i>Profiel<i/></button>
            </div>
        );
    }

    const updateTime = async () => {
        const value = await get('time');
        setTime(value);
    };

    const timer = setInterval(updateTime, 1000);

    updateTime();
    if (time > 0) return wait();
    else return home();

}

export default Home;