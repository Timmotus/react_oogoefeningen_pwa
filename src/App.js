import React from 'react';
import {
    BrowserRouter as Router,
    Switch,
    Route
} from "react-router-dom";

import './App.css';
import Camera from './components/Camera';
import Weather from './components/Weather';
import Home from './components/Home';
import InfoPage from "./components/InfoPage";

export default class App extends React.Component {
    render() {
        return (
            <div className="app">
                <Router>
                    <Switch>
                        <Route exact path="/" component={Home} />
                        <Route exact path="/info" component={InfoPage} />
                        <Route exact path="/page1" component={Weather} />
                        <Route exact path="/page2" component={Camera} />
                    </Switch>
                </Router>
            </div>
        );
    }
}