import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';


interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'user' | 'premium';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, loading, hasRole } = useAuth();

  console.log('🛡️ ProtectedRoute - user:', user?.email || 'Não autenticado', 'loading:', loading);

  if (loading) {
    console.log('🛡️ ProtectedRoute - Mostrando tela de loading...');
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center relative overflow-hidden orion-bg-fallback">

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10"
        >
          <div className="w-16 h-16 rounded-2xl shadow-2xl shadow-orion-stellar-gold/20 overflow-hidden">
            <img 
              src="/lovable-uploads/e49c5576-c167-4e3a-bf0c-a88738d86507.png" 
              alt="O.R.I.Ö.N Logo"
              className="w-full h-full object-cover animate-pulse"
              onError={(e) => {
                console.log('❌ Erro ao carregar logo:', e);
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    console.log('🛡️ ProtectedRoute - Usuário não autenticado, redirecionando para /auth');
    return <Navigate to="/auth" replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    console.log('🚫 User does not have required role:', requiredRole);
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4 max-w-md p-8 chat-message-orion rounded-3xl"
        >
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold stellar-text">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página.
            {requiredRole && ` Requer role: ${requiredRole}`}
          </p>
        </motion.div>
      </div>
    );
  }

  console.log('🛡️ ProtectedRoute - Usuário autenticado, renderizando conteúdo protegido');
  return <>{children}</>;
};