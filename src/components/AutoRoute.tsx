/**
 * 🛡️ AutoRoute - Rota automática sem autenticação
 * 
 * Versão simplificada que permite acesso direto sem login.
 * Sistema single-user para IA pessoal.
 */

import { ReactNode } from 'react';

interface AutoRouteProps {
  children: ReactNode;
}

export const AutoRoute = ({ children }: AutoRouteProps) => {
  // Sem verificação de autenticação - acesso direto
  console.log('🚀 AutoRoute - Acesso direto habilitado (modo JARVIS)');
  
  return <>{children}</>;
};

// Manter ProtectedRoute para compatibilidade (agora passa direto)
export const ProtectedRoute = AutoRoute;
