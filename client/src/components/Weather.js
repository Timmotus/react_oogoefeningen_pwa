import React, { useState } from 'react';

import { fetchWeather } from '../api/fetchWeather';
import './Weather.css';

const Weather = () => {
    const [data, setData] = React.useState(null);

    React.useEffect(() => {
      fetch("/api")
        .then((res) => res.json())
        .then((data) => setData(data.message));
    }, []);

    return (
      <div className="App">
        <header className="App-header">
          <p>{!data ? "Loading..." : data}</p>
        </header>
      </div>
    );
}

export default Weather;