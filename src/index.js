import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));

// ✅ SOLUSI: Remove StrictMode untuk prevent double rendering
root.render(<App />);

/* 
  ⚠️ CATATAN:
  - StrictMode bikin component render 2x di development
  - Ini INTENTIONAL untuk detect side effects
  - Di production, StrictMode otomatis disabled
  
  Kalau mau keep StrictMode (recommended untuk development):
  - Accept double rendering sebagai normal behavior
  - Atau pastikan code sudah idempotent (aman di-run multiple times)
*/