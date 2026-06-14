import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.jsx';
import { LanguageProvider } from './i18n/LanguageContext.jsx';
import './styles.css';

const root = document.getElementById('root');

try {
  createRoot(root).render(
    <React.StrictMode>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </React.StrictMode>
  );
} catch (error) {
  root.innerHTML = `<pre style="padding:24px;color:#f5efe4;background:#0e1110;white-space:pre-wrap">${error.message}</pre>`;
  throw error;
}
