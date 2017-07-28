import React from 'react';
import ReactDOM from 'react-dom';
import FromScratch from './containers/FromScratch';
import Sidebar from './containers/Sidebar';
import './assets/style/app.scss';

window.location.hash = '/';
ReactDOM.render(<Sidebar />, document.getElementById('react-root-sidebar'));
ReactDOM.render(<FromScratch />, document.getElementById('react-root-workspace'));
