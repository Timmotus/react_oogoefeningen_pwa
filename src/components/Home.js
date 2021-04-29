import React from "react";

import './Home.css'

const Home = () => {
    return (
        <div className="home-container">
            <img src={'./assets/face_phone.png'} alt=""/>
            <h1>Welkom!</h1>
            <span>Er staan oefeningen voor je klaar!</span>
            <button><i className="material-icons">play_arrow</i>Start<i/></button>
        </div>
    );
}

export default Home;