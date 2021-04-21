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
                            <Link className="nav-link" to="/">Home</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/page1">page1</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/page2">page2</Link>
                        </li>
                    </ul>
                </nav>
            </div>
        )
    }
}