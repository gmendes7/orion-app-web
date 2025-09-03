import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

export const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Handle OAuth redirects and magic link confirmations
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          navigate('/auth?error=' + encodeURIComponent(error.message));
          return;
        }
        
        if (data.session) {
          console.log('User authenticated successfully');
          navigate('/');
        } else {
          navigate('/auth');
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error);
        navigate('/auth');
      }
    };

    handleAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl shadow-2xl shadow-orion-stellar-gold/20 overflow-hidden">
          <img 
            src="/lovable-uploads/e49c5576-c167-4e3a-bf0c-a88738d86507.png" 
            alt="O.R.I.Ö.N Logo"
            className="w-full h-full object-cover animate-pulse"
          />
        </div>
        <p className="text-muted-foreground">Autenticando...</p>
      </motion.div>
    </div>
  );
};

export default AuthCallback;