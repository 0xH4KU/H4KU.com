import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/styles/global.css';
import { initializeMonitoring } from '@/services/monitoring';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

initializeMonitoring();

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
