import React from 'react';
import ReactDOM from 'react-dom';

import App from './App';
import {get, set} from "idb-keyval";

// Setup Timer time storage.
get('time')
    .then((value) => {
        if (value === undefined)
            set('time', 0)
                .then(() => console.log('Successfully set-up timer time storage.'));
        else console.log('Timer time storage was already set-up.');
    })
    .catch(() => console.log('Failed to set-up timer time storage.'));

// Setup Timer
const timer = setInterval(
    async () => {
        const time = await get ('time');
        if (time > 0)
            await set('time', time - 1);
        else clearInterval(timer);
    }, 1000
);

ReactDOM.render(<App />, document.getElementById('root'));