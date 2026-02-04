import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/styles/runtimeVars.css';
import '@/styles/global.css';
import { initializeMonitoring, reportWebVital } from '@/services/monitoring';
import { startWebVitals } from '@/utils/webVitals';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

void initializeMonitoring();

if (import.meta.env.PROD) {
  startWebVitals(reportWebVital);
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
