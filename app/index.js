import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import FromScratch from './containers/FromScratch';
import './assets/style/app.scss';

render(
  <AppContainer>
    <FromScratch />
  </AppContainer>,
  document.getElementById('root')
);

if (module.hot) {
  module.hot.accept('./containers/FromScratch', () => {
    const NextRoot = require('./containers/FromScratch'); // eslint-disable-line global-require
    render(
      <AppContainer>
        <NextRoot />
      </AppContainer>,
      document.getElementById('root')
    );
  });
}
