import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.jsx';
import './styles.css';

const root = document.getElementById('root');

try {
  createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  root.innerHTML = `<pre style="padding:24px;color:#f5efe4;background:#0e1110;white-space:pre-wrap">${error.message}</pre>`;
  throw error;
}
