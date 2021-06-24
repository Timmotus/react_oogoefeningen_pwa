import React from "react";
import {
    Link
} from "react-router-dom";

import './NavBar.css'

export default class NavBar extends React.Component {
    render() {
        return (
            <div className="nav-container">
                <Link className="nav-link" to="/profile">Profiel</Link>
                <Link className="nav-link" to="/">Oefening</Link>
                <Link className="nav-link" to="/info">Vragen</Link>
            </div>
        );
    }
}