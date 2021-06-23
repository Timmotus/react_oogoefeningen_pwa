import React from 'react';
import {
    BrowserRouter as Router,
    Switch,
    Route
} from "react-router-dom";

import './App.css';
import Camera from './components/Camera';
import Home from './components/Home';
import InfoPage from "./components/InfoPage";
import Exercise from "./components/Exercise";
import Progress from "./components/Progress";
import Profile from "./components/Profile";
import Account from "./components/Account";

export default class App extends React.Component {
    render() {
        return (
            <div className="app">
                <Router>
                    <Switch>
                        <Route exact path="/" component={Home} />
                        <Route exact path="/info" component={InfoPage} />
                        <Route exact path="/exercise" component={Exercise} />
                        <Route exact path="/progress" component={Progress} />
                        <Route exact path="/profile" component={Profile} />
                        <Route exact path="/page2" component={Camera} />
                        <Route exact path="/register" component={Account} />
                        <Route exact path="/login" component={Account} />
                    </Switch>
                </Router>
            </div>
        );
    }
}