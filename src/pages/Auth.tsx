import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/integrations/hooks/use-toast';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Chrome,
  MessageSquare,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';

// Schemas de validação
const emailSchema = z.string().email('Email inválido').min(1, 'Email é obrigatório');
const passwordSchema = z.string().min(6, 'Senha deve ter no mínimo 6 caracteres');
const fullNameSchema = z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').trim();
const usernameSchema = z.string().min(3, 'Username deve ter no mínimo 3 caracteres').max(20, 'Username deve ter no máximo 20 caracteres');

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
  
  // Estados de validação
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [fullNameError, setFullNameError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [touched, setTouched] = useState({
    email: false,
    password: false,
    fullName: false,
    username: false,
  });

  console.log('🔐 Auth - user:', user?.email || 'Não autenticado', 'loading:', loading);

  // Validação em tempo real
  useEffect(() => {
    if (touched.email) {
      const result = emailSchema.safeParse(email);
      setEmailError(result.success ? '' : result.error.issues[0].message);
    }
  }, [email, touched.email]);

  useEffect(() => {
    if (touched.password) {
      const result = passwordSchema.safeParse(password);
      setPasswordError(result.success ? '' : result.error.issues[0].message);
    }
  }, [password, touched.password]);

  useEffect(() => {
    if (touched.fullName && isSignUp) {
      const result = fullNameSchema.safeParse(fullName);
      setFullNameError(result.success ? '' : result.error.issues[0].message);
    }
  }, [fullName, touched.fullName, isSignUp]);

  useEffect(() => {
    if (touched.username && isSignUp) {
      const result = usernameSchema.safeParse(username);
      setUsernameError(result.success ? '' : result.error.issues[0].message);
    }
  }, [username, touched.username, isSignUp]);

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
    
    // Marca todos como tocados para exibir erros
    setTouched({
      email: true,
      password: true,
      fullName: true,
      username: true,
    });

    // Valida todos os campos
    const emailValidation = emailSchema.safeParse(email);
    const passwordValidation = passwordSchema.safeParse(password);
    
    if (!emailValidation.success || !passwordValidation.success) {
      toast({
        title: "Campos inválidos",
        description: "Por favor, corrija os erros antes de continuar.",
        variant: "destructive",
      });
      return;
    }

    if (isSignUp) {
      const fullNameValidation = fullNameSchema.safeParse(fullName);
      const usernameValidation = usernameSchema.safeParse(username);
      
      if (!fullNameValidation.success || !usernameValidation.success) {
        toast({
          title: "Campos inválidos",
          description: "Por favor, corrija os erros antes de continuar.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      let result;
      
      if (isSignUp) {
        result = await signUp(email, password, fullName, username);
      } else {
        result = await signIn(email, password);
      }

      if (result.error) {
        let errorMessage = "Ocorreu um erro inesperado";
        let errorTitle = isSignUp ? "Erro ao criar conta" : "Erro ao fazer login";
        
        if (result.error.message.includes("Invalid login credentials")) {
          errorMessage = "Email ou senha incorretos. Verifique suas credenciais e tente novamente.";
          errorTitle = "Credenciais inválidas";
        } else if (result.error.message.includes("User already registered")) {
          errorMessage = "Este email já está cadastrado. Tente fazer login ou use outro email.";
          errorTitle = "Email já cadastrado";
        } else if (result.error.message.includes("Password should be at least")) {
          errorMessage = "A senha deve ter pelo menos 6 caracteres";
          errorTitle = "Senha muito curta";
        } else if (result.error.message.includes("Unable to validate email address")) {
          errorMessage = "Email inválido. Por favor, use um email válido.";
          errorTitle = "Email inválido";
        } else if (result.error.message.includes("Email not confirmed")) {
          errorMessage = "Por favor, confirme seu email antes de fazer login.";
          errorTitle = "Email não confirmado";
        }

        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
        });
      } else if (isSignUp) {
        toast({
          title: "✅ Conta criada com sucesso!",
          description: "Você já pode acessar sua conta. A confirmação de email é opcional.",
        });
        // Limpa os campos após cadastro bem-sucedido
        setEmail('');
        setPassword('');
        setFullName('');
        setUsername('');
        setTouched({
          email: false,
          password: false,
          fullName: false,
          username: false,
        });
      } else {
        toast({
          title: "✅ Login realizado com sucesso!",
          description: "Bem-vindo de volta ao O.R.I.Ö.N",
        });
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    
    try {
      const { error } = await signInWithGoogle();
      
      if (error) {
        toast({
          title: "Erro ao fazer login com Google",
          description: "Não foi possível conectar com o Google. Tente novamente ou use email/senha.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      toast({
        title: "Erro de conexão",
        description: "Falha ao conectar com o Google. Verifique sua internet.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: "Email necessário",
        description: "Por favor, insira seu email primeiro para recuperar a senha.",
        variant: "destructive",
      });
      return;
    }

    const emailValidation = emailSchema.safeParse(email);
    if (!emailValidation.success) {
      toast({
        title: "Email inválido",
        description: "Por favor, insira um email válido para recuperar a senha.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Link de recuperação enviado!",
      description: "Verifique seu email para redefinir sua senha.",
    });
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

            <form onSubmit={handleSubmit} className="space-y-5">
              <AnimatePresence mode="wait">
                {isSignUp && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="relative"
                    >
                      <User className={cn(
                        "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors",
                        fullNameError && touched.fullName ? "text-destructive" : "text-primary/70"
                      )} />
                      <Input
                        type="text"
                        placeholder="Nome completo"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        onBlur={() => setTouched(prev => ({ ...prev, fullName: true }))}
                        className={cn(
                          "pl-11 h-12 sm:h-14 bg-card/60 border-2 text-foreground placeholder:text-muted-foreground rounded-2xl transition-all duration-300",
                          fullNameError && touched.fullName
                            ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                            : "border-primary/30 focus:border-primary focus:ring-primary/20"
                        )}
                        disabled={isLoading}
                        required={isSignUp}
                      />
                      {fullNameError && touched.fullName && (
                        <motion.div 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-1 mt-1 text-xs text-destructive"
                        >
                          <AlertCircle className="w-3 h-3" />
                          {fullNameError}
                        </motion.div>
                      )}
                      {!fullNameError && fullName && touched.fullName && (
                        <motion.div 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-1 mt-1 text-xs text-green-500"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Nome válido
                        </motion.div>
                      )}
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="relative"
                    >
                      <Sparkles className={cn(
                        "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors",
                        usernameError && touched.username ? "text-destructive" : "text-primary/70"
                      )} />
                      <Input
                        type="text"
                        placeholder="Nome de usuário (ex: astronauta123)"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        onBlur={() => setTouched(prev => ({ ...prev, username: true }))}
                        className={cn(
                          "pl-11 h-12 sm:h-14 bg-card/60 border-2 text-foreground placeholder:text-muted-foreground rounded-2xl transition-all duration-300",
                          usernameError && touched.username
                            ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                            : "border-primary/30 focus:border-primary focus:ring-primary/20"
                        )}
                        disabled={isLoading}
                        required={isSignUp}
                        minLength={3}
                        maxLength={20}
                      />
                      {usernameError && touched.username && (
                        <motion.div 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-1 mt-1 text-xs text-destructive"
                        >
                          <AlertCircle className="w-3 h-3" />
                          {usernameError}
                        </motion.div>
                      )}
                      {!usernameError && username && touched.username && (
                        <motion.div 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-1 mt-1 text-xs text-green-500"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Username disponível
                        </motion.div>
                      )}
                      <p className="text-xs text-muted-foreground mt-1 ml-1">
                        Será exibido ao invés do seu email por segurança
                      </p>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              <div className="relative">
                <Mail className={cn(
                  "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors",
                  emailError && touched.email ? "text-destructive" : "text-primary/70"
                )} />
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                  className={cn(
                    "pl-11 h-12 sm:h-14 bg-card/60 border-2 text-foreground placeholder:text-muted-foreground rounded-2xl transition-all duration-300",
                    emailError && touched.email
                      ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                      : "border-primary/30 focus:border-primary focus:ring-primary/20"
                  )}
                  disabled={isLoading}
                  required
                />
                {emailError && touched.email && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-1 mt-1 text-xs text-destructive"
                  >
                    <AlertCircle className="w-3 h-3" />
                    {emailError}
                  </motion.div>
                )}
                {!emailError && email && touched.email && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-1 mt-1 text-xs text-green-500"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    Email válido
                  </motion.div>
                )}
              </div>

              <div className="relative">
                <Lock className={cn(
                  "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors",
                  passwordError && touched.password ? "text-destructive" : "text-primary/70"
                )} />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Senha (mínimo 6 caracteres)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                  className={cn(
                    "pl-11 pr-11 h-12 sm:h-14 bg-card/60 border-2 text-foreground placeholder:text-muted-foreground rounded-2xl transition-all duration-300",
                    passwordError && touched.password
                      ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                      : "border-primary/30 focus:border-primary focus:ring-primary/20"
                  )}
                  disabled={isLoading}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/70 hover:text-primary transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
                {passwordError && touched.password && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-1 mt-1 text-xs text-destructive"
                  >
                    <AlertCircle className="w-3 h-3" />
                    {passwordError}
                  </motion.div>
                )}
                {!passwordError && password && touched.password && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-1 mt-1 text-xs text-green-500"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    Senha forte
                  </motion.div>
                )}
              </div>

              {!isSignUp && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-primary hover:text-accent transition-colors font-medium"
                    disabled={isLoading}
                  >
                    Esqueci minha senha
                  </button>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || (touched.email && !!emailError) || (touched.password && !!passwordError)}
                className={cn(
                  "w-full h-12 sm:h-14 bg-gradient-to-br from-primary via-accent to-primary text-primary-foreground font-bold rounded-2xl transition-all duration-300 shadow-2xl border border-primary/50 text-base sm:text-lg relative overflow-hidden group",
                  isLoading || (touched.email && !!emailError) || (touched.password && !!passwordError)
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:scale-105 hover:shadow-primary/60 active:scale-95"
                )}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : isSignUp ? (
                  "Criar Conta"
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>

            <div className="mt-6 sm:mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-primary/20" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 text-muted-foreground bg-card">ou continue com</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className={cn(
                  "w-full mt-4 h-12 sm:h-14 border-2 border-primary/40 text-foreground rounded-2xl text-base font-semibold relative overflow-hidden group transition-all duration-300",
                  isLoading 
                    ? "opacity-50 cursor-not-allowed" 
                    : "hover:bg-primary/10 hover:border-primary hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-primary/20"
                )}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                <Chrome className="w-5 h-5 mr-3 relative z-10" />
                <span className="relative z-10">
                  {isLoading ? "Conectando..." : "Continuar com Google"}
                </span>
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