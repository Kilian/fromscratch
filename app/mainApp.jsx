import React from 'react';
import ReactDOM from 'react-dom';
import FromScratch from './containers/FromScratch';
import './assets/style/app.scss';

window.location.hash = '/';
ReactDOM.render(<FromScratch />, document.getElementById('react-root'));
