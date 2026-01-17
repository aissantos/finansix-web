import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import { initSentry } from './lib/sentry';

// Initialize Sentry before rendering
// Initialize Sentry before rendering
initSentry();

import { reportWebVitals, sendToAnalytics } from './lib/vitals';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals(sendToAnalytics);
