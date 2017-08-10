import React from 'react';
import ReactDOM from 'react-dom';
import FromScratch from './containers/FromScratch';
import Sidebar from './containers/Sidebar/Sidebar';
import './assets/style/app.scss';

const electron = require('electron');
const remote = electron.remote;
const signals = remote.getGlobal('signalEmitter');

function refreshScratch(){
    ReactDOM.unmountComponentAtNode(document.getElementById('react-root-workspace'));
    ReactDOM.render(<FromScratch />, document.getElementById('react-root-workspace'));
}

window.location.hash = '/';
ReactDOM.render(<Sidebar refreshScratch={refreshScratch}/>, document.getElementById('react-root-sidebar'));
ReactDOM.render(<FromScratch />, document.getElementById('react-root-workspace'));
