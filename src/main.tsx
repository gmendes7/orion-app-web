import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import './index.css'

// ── Global Error Handlers ──
window.addEventListener('unhandledrejection', (event) => {
  console.error('🛡️ Unhandled Promise Rejection:', event.reason);
  event.preventDefault(); // Prevent default browser error logging
});

window.addEventListener('error', (event) => {
  console.error('🛡️ Unhandled Error:', event.error?.message || event.message);
});

// ── Security: Block devtools in production ──
if (import.meta.env.PROD) {
  // Disable right-click context menu
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  
  // Disable common devtools shortcuts
  document.addEventListener('keydown', (e) => {
    if (
      (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
      (e.ctrlKey && e.key === 'U') ||
      e.key === 'F12'
    ) {
      e.preventDefault();
    }
  });
}

// ── App Bootstrap ──
try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error('Root element not found');
  }

  createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
} catch (error) {
  console.error('❌ Critical initialization error:', error);
  // Show minimal fallback UI
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0a0a0a;color:#fff;font-family:system-ui;"><p>Erro crítico. Recarregue a página.</p></div>';
  }
}