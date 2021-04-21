import React from "react";
import {
    Link
} from "react-router-dom";

import './NavBar.css'

export default class NavBar extends React.Component {
    render() {
        return (
            <div className="nav-container">
                <nav>
                    <ul className="nav-list">
                        <li className="nav-item">
                            <Link className="nav-link" to="/">Profiel</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/page1">Oefening</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/page2">Vragen</Link>
                        </li>
                    </ul>
                </nav>
            </div>
        )
    }
}