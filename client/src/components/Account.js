import React from "react";

import "./Account.css";

const Account = () => {
    return (
        <div className="home-container">
            <img src={'./assets/face_phone.png'} alt=""/>
            <h1>Welkom!</h1>
            <span>Er staan oefeningen voor je klaar!</span>
            <button onClick={() => window.location.href = '/exercise'}><i className="material-icons">play_arrow</i>Start<i/></button>
        </div>
    );
}

export default Account;