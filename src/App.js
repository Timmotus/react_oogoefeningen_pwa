import React from 'react';
import {
    BrowserRouter as Router,
    Switch,
    Route
} from "react-router-dom";

import './App.css';
import Camera from './components/Camera';
import NavBar from './components/NavBar';
import Weather from './components/Weather';

export default class App extends React.Component {
    render() {
        return (
            <div>
                <Router>
                    <NavBar />
                    <Switch>
                        <Route exact path="/" render={() => <h1>Welcome!</h1>} />
                        <Route exact path="/page1" component={Weather} />
                        <Route exact path="/page2" component={Camera} />
                    </Switch>
                </Router>
            </div>
        );
    }
}