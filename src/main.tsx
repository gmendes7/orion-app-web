import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('🚀 Iniciando aplicação O.R.I.Ö.N...');

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error('Elemento root não encontrado no DOM');
  }

  console.log('✅ Elemento root encontrado, criando React root...');
  const root = createRoot(rootElement);
  
  console.log('✅ React root criado, renderizando App...');
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  console.log('✅ Aplicação renderizada com sucesso!');
} catch (error) {
  console.error('❌ Erro crítico ao inicializar aplicação:', error);
}
