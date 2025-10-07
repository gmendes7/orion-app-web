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
  const [username, setUsername] = useState('');
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
        if (!username.trim()) {
          toast({
            title: "Campo obrigatório",
            description: "Por favor, escolha um nome de usuário",
            variant: "destructive",
          });
          return;
        }
        result = await signUp(email, password, fullName, username);
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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/5 to-background text-foreground relative overflow-hidden orion-bg-fallback">
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md lg:max-w-lg">
          {/* Logo and Header */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8 sm:mb-10"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-3xl shadow-2xl shadow-primary/40 mb-6 overflow-hidden ring-2 ring-primary/30">
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
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary stellar-text mb-2 orion-text-fallback">
              O.R.I.Ö.N
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Seu Assistente de IA Futurista
            </p>
          </motion.div>

          {/* Auth Form */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="chat-message-orion rounded-3xl p-6 sm:p-8 lg:p-10 backdrop-blur-xl border border-primary/30 shadow-2xl shadow-primary/20 orion-fallback"
          >
            <div className="flex items-center justify-center mb-8">
              <div className="flex rounded-2xl bg-orion-event-horizon p-1.5">
                <button
                  type="button"
                  onClick={() => {
                    console.log('🔐 Auth - Mudando para login');
                    setIsSignUp(false);
                  }}
                  className={cn(
                    "px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold transition-all duration-300",
                    !isSignUp
                      ? "bg-gradient-to-r from-primary via-accent to-primary text-primary-foreground shadow-lg shadow-primary/30"
                      : "text-muted-foreground hover:text-primary"
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
                    "px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold transition-all duration-300",
                    isSignUp
                      ? "bg-gradient-to-r from-primary via-accent to-primary text-primary-foreground shadow-lg shadow-primary/30"
                      : "text-muted-foreground hover:text-primary"
                  )}
                >
                  Criar Conta
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {isSignUp && (
                <>
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
                  
                  <div className="relative">
                    <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-orion-cosmic-blue" />
                    <Input
                      type="text"
                      placeholder="Nome de usuário (ex: astronauta123)"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      className="pl-11 h-12 bg-orion-event-horizon/50 border-orion-cosmic-blue/30 text-foreground placeholder-orion-space-dust focus:border-orion-stellar-gold/60 focus:ring-orion-stellar-gold/20 rounded-xl"
                      disabled={isLoading}
                      required={isSignUp}
                      minLength={3}
                      maxLength={20}
                    />
                    <p className="text-xs text-orion-space-dust mt-1 ml-1">
                      Será exibido ao invés do seu email por segurança
                    </p>
                  </div>
                </>
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
                className="w-full h-12 sm:h-14 bg-gradient-to-br from-primary via-accent to-primary text-primary-foreground font-bold rounded-2xl hover:opacity-90 transition-all duration-300 hover:scale-105 active:scale-95 shadow-2xl shadow-primary/40 border border-primary/50 text-base sm:text-lg"
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
                className="w-full mt-4 h-12 sm:h-14 border-primary/40 text-foreground hover:bg-primary/10 hover:border-primary transition-all duration-300 rounded-2xl text-base font-medium"
              >
                <Chrome className="w-5 h-5 mr-3" />
                Continuar com Google
              </Button>
            </div>

            <p className="text-center text-sm sm:text-base text-muted-foreground mt-6">
              {isSignUp ? (
                <>
                  Já tem uma conta?{" "}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(false)}
                    className="text-primary hover:text-accent transition-colors font-semibold"
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
                    className="text-primary hover:text-accent transition-colors font-semibold"
                  >
                    Criar conta
                  </button>
                </>
              )}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Auth;