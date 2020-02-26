import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

import 'semantic-ui-css/semantic.min.css'

import Amplify from '@aws-amplify/core';
import Analytics from '@aws-amplify/analytics';
import awsconfig from './aws-exports';

Amplify.configure(awsconfig);

// enable session analytics. we will track page views independently
Analytics.autoTrack("session", {
  enable: true,
  type: "SPA"
});

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
