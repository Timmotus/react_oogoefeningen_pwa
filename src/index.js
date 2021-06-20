import React from 'react';
import ReactDOM from 'react-dom';

import App from './App';
import {get, set} from "idb-keyval";

// Setup Timer time storage.
get('timer')
    .then((value) => {
        if (value === undefined)
            set('timer', {
                time: 0,
                last_update: Date.now()
            })
                .then(() => console.log('Successfully set-up timer storage.'));
        else console.log('Timer storage was already set-up.');
    })
    .catch(() => console.log('Failed to set-up timer storage.'));

// Setup History storage.
get('history')
    .then((value) => {
        if (value === undefined)
            set('history', {
                connect_id: null,
                results: []
            })
                .then(() => console.log('Successfully set-up history storage.'));
        else console.log('History storage was already set-up.');
    })
    .catch(() => console.log('Failed to set-up history storage.'));

// Setup Timer
const timer = setInterval(
    async () => {
        const timer = await get ('timer');
        if (timer.time > 0)
            await set('timer', {
                time: Math.round(timer.time - (Date.now() - new Date(timer.last_update)) / 1000),
                last_update: Date.now()
            });
        else clearInterval(timer);
    }, 1000
);

ReactDOM.render(<App />, document.getElementById('root'));