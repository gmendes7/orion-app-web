import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { HexagonBackground } from './HexagonBackground';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
        <HexagonBackground />

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orion-stellar-gold to-orion-accretion-disk flex items-center justify-center shadow-2xl shadow-orion-stellar-gold/20">
            <MessageSquare className="w-8 h-8 text-orion-void animate-pulse" />
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