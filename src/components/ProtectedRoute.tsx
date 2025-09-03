import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';


interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center relative overflow-hidden">

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
            />
          </div>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};