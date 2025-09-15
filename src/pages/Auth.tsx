import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/integrations/hooks/use-toast';

import { cn } from '@/lib/utils';
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Chrome,
  MessageSquare,
  Sparkles
} from 'lucide-react';

const Auth = () => {
  console.log('🔐 Auth component renderizando...');
  
  const { user, loading, signIn, signUp, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  console.log('🔐 Auth - user:', user?.email || 'Não autenticado', 'loading:', loading);

  // Redirect if already authenticated
  if (user && !loading) {
    console.log('🔐 Auth - Usuário autenticado, redirecionando...');
    return <Navigate to="/" replace />;
  }

  if (loading) {
    console.log('🔐 Auth - Mostrando tela de loading...');
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center relative overflow-hidden orion-bg-fallback">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orion-stellar-gold to-orion-accretion-disk flex items-center justify-center shadow-2xl shadow-orion-stellar-gold/20 mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-orion-void animate-pulse" />
          </div>
          <p className="text-orion-stellar-gold orion-text-fallback">Carregando...</p>
        </div>
      </div>
    );
  }

  console.log('🔐 Auth - Renderizando formulário de autenticação...');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let result;
      
      if (isSignUp) {
        if (!fullName.trim()) {
          toast({
            title: "Campo obrigatório",
            description: "Por favor, informe seu nome completo",
            variant: "destructive",
          });
          return;
        }
        result = await signUp(email, password, fullName);
      } else {
        result = await signIn(email, password);
      }

      if (result.error) {
        let errorMessage = "Ocorreu um erro inesperado";
        
        if (result.error.message.includes("Invalid login credentials")) {
          errorMessage = "Email ou senha incorretos";
        } else if (result.error.message.includes("User already registered")) {
          errorMessage = "Este email já está cadastrado. Tente fazer login.";
        } else if (result.error.message.includes("Password should be at least")) {
          errorMessage = "A senha deve ter pelo menos 6 caracteres";
        } else if (result.error.message.includes("Unable to validate email address")) {
          errorMessage = "Email inválido";
        }

        toast({
          title: isSignUp ? "Erro ao criar conta" : "Erro ao fazer login",
          description: errorMessage,
          variant: "destructive",
        });
      } else if (isSignUp) {
        toast({
          title: "Conta criada com sucesso!",
          description: "Verifique seu email para confirmar a conta (opcional para teste).",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const { error } = await signInWithGoogle();
    
    if (error) {
      toast({
        title: "Erro ao fazer login com Google",
        description: error.message,
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 text-foreground relative overflow-hidden orion-bg-fallback">
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl shadow-2xl shadow-orion-stellar-gold/30 mb-6 overflow-hidden">
              <img 
                src="/lovable-uploads/e49c5576-c167-4e3a-bf0c-a88738d86507.png" 
                alt="O.R.I.Ö.N Logo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.log('❌ Erro ao carregar logo na Auth:', e);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            
            <h1 className="text-3xl font-bold text-orion-stellar-gold stellar-text mb-2 orion-text-fallback">
              O.R.I.Ö.N
            </h1>
            <p className="text-orion-space-dust">
              Seu Assistente de IA Futurista
            </p>
          </div>

          {/* Auth Form */}
          <div className="chat-message-orion rounded-3xl p-8 backdrop-blur-sm border border-orion-cosmic-blue/30 shadow-2xl orion-fallback">
            <div className="flex items-center justify-center mb-6">
              <div className="flex rounded-xl bg-orion-event-horizon p-1">
                <button
                  type="button"
                  onClick={() => {
                    console.log('🔐 Auth - Mudando para login');
                    setIsSignUp(false);
                  }}
                  className={cn(
                    "px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                    !isSignUp
                      ? "bg-gradient-to-r from-orion-cosmic-blue to-orion-stellar-gold text-orion-void shadow-lg"
                      : "text-orion-space-dust hover:text-orion-stellar-gold"
                  )}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    console.log('🔐 Auth - Mudando para cadastro');
                    setIsSignUp(true);
                  }}
                  className={cn(
                    "px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                    isSignUp
                      ? "bg-gradient-to-r from-orion-cosmic-blue to-orion-stellar-gold text-orion-void shadow-lg"
                      : "text-orion-space-dust hover:text-orion-stellar-gold"
                  )}
                >
                  Criar Conta
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {isSignUp && (
                <div className="relative">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-orion-cosmic-blue" />
                    <Input
                      type="text"
                      placeholder="Nome completo"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-11 h-12 bg-orion-event-horizon/50 border-orion-cosmic-blue/30 text-foreground placeholder-orion-space-dust focus:border-orion-stellar-gold/60 focus:ring-orion-stellar-gold/20 rounded-xl"
                      disabled={isLoading}
                      required={isSignUp}
                    />
                  </div>
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-orion-cosmic-blue" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 h-12 bg-orion-event-horizon/50 border-orion-cosmic-blue/30 text-foreground placeholder-orion-space-dust focus:border-orion-stellar-gold/60 focus:ring-orion-stellar-gold/20 rounded-xl"
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-orion-cosmic-blue" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 pr-11 h-12 bg-orion-event-horizon/50 border-orion-cosmic-blue/30 text-foreground placeholder-orion-space-dust focus:border-orion-stellar-gold/60 focus:ring-orion-stellar-gold/20 rounded-xl"
                  disabled={isLoading}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-orion-cosmic-blue hover:text-orion-stellar-gold transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-orion-cosmic-blue to-orion-stellar-gold text-orion-void font-semibold rounded-xl hover:opacity-90 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg border border-white/20"
                onClick={() => console.log('🔐 Auth - Botão de submit clicado')}
              >
                {isLoading ? "Processando..." : isSignUp ? "Criar Conta" : "Entrar"}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-orion-cosmic-blue/20" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 text-orion-space-dust bg-card">ou</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full mt-4 h-12 border-orion-cosmic-blue/30 text-foreground hover:bg-orion-cosmic-blue/10 hover:border-orion-stellar-gold/50 transition-all duration-300 rounded-xl"
              >
                <Chrome className="w-5 h-5 mr-3" />
                Continuar com Google
              </Button>
            </div>

            <p className="text-center text-sm text-orion-space-dust mt-6">
              {isSignUp ? (
                <>
                  Já tem uma conta?{" "}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(false)}
                    className="text-orion-stellar-gold hover:text-orion-accretion-disk transition-colors font-medium"
                  >
                    Faça login
                  </button>
                </>
              ) : (
                <>
                  Não tem uma conta?{" "}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(true)}
                    className="text-orion-stellar-gold hover:text-orion-accretion-disk transition-colors font-medium"
                  >
                    Criar conta
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;