import React from 'react';
import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';
import {configureStore, routes, handleRoute}  from './app';
import {setCurrentUser, setUsers, setMessage, openSnackbar} from './actions';
import { RouterContext, match } from 'react-router';
import config from './config';
import models from '../lib/models';

const Users = models.sequelize.models.users;

export default function handleSSR(req, res) {
    global.navigator = {
        userAgent: req.headers['user-agent']
    };
    const prefix = `http://localhost:${req.app.get('port')}/`;
    match({ routes, location: req.url }, (err, redirect, renderProps) => {
        if (err) {
            res.status(500).send(err.message);
        } else if (redirect) {
            res.redirect(302, redirect.pathname + redirect.search);
        } else if (!renderProps) {
            res.status(404).send('Not found');
        } else if (renderProps.params.id && !renderProps.params.id.match(/^\d+$/)) {
            res.status(404).send('Not found');
        } else {
            const store = configureStore();
            handleRoute(renderProps, false, prefix, [], store.dispatch)
            .then(() =>{
                if (req.session.messages && req.session.messages.length > 0) {
                    const msg = req.session.messages.pop() || '';
                    store.dispatch(setMessage(msg));
                    store.dispatch(openSnackbar(true));
                }
            }).then(() => store.dispatch(setCurrentUser(req.user)))
            .then(() => Users.findAll().then(users => store.dispatch(setUsers(users))))
            .then(() => {
                const html = renderToString(
                    <Provider store={store}>
                        <RouterContext {...renderProps}></RouterContext>
                    </Provider>
                );
                const state = store.getState();
                state.main.external_links = config.external_links;
                let title = config.site_name;
                let description = '';
                const google_api_key = config.google_api_key;
                let canonical = '/';
                if (state.main.selected_item) {
                    let data = state.main.selected_item;
                    title = `${data.date} : ${data.title} (${data.length.toFixed(1)} km) - ` + title;
                    description = data.comment.replace(/[\n\r]/g, '').substring(0, 140) + '...';
                    canonical = '/' + data.id;
                }
                const bind = Object.assign({
                    html,
                    title,
                    description,
                    google_api_key,
                    canonical,
                    preloadedState: state
                }, config);

                res.render('index', bind);
            }).catch(ex => console.log(ex));
        }
    });
}
