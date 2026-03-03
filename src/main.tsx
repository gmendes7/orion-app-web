import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import './index.css'

// Global unhandled error handlers — prevent silent crashes
window.addEventListener('unhandledrejection', (event) => {
  console.error('🛡️ Unhandled Promise Rejection:', event.reason);
});

window.addEventListener('error', (event) => {
  console.error('🛡️ Unhandled Error:', event.error?.message || event.message);
});

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error('Elemento root não encontrado no DOM');
  }

  createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
} catch (error) {
  console.error('❌ Erro crítico ao inicializar aplicação:', error);
}
