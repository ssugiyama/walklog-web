require('./twitter.js');

import { Provider } from 'react-redux'
import React  from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, IndexRoute, browserHistory } from 'react-router'
import { syncHistoryWithStore } from 'react-router-redux'
import { configureStore, routes } from './app';

const store = configureStore( window.__PRELOADED_STATE__);
const history = syncHistoryWithStore(browserHistory, store)

ReactDOM.render(
    <Provider store={store}>
        <Router history={history}>
            { routes }     
        </Router>
    </Provider>,
    document.querySelector('#body')
);
