import { supabase } from "@/integrations/supabase/client";
import { getSiteURL } from "@/lib/helpers";
import { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    fullName?: string,
    username?: string
  ) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  console.log("🔐 AuthProvider inicializado, loading:", loading);

  useEffect(() => {
    console.log("🔐 Configurando listener de autenticação...");

    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("🔐 Auth state changed:", event, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log(
        "🔐 Sessão existente verificada:",
        session?.user?.email || "Nenhuma sessão"
      );
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string, username?: string) => {
    try {
      console.log("🔐 Iniciando cadastro...");
      const redirectUrl = getSiteURL();

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName || '',
            username: username || '',
          },
        },
      });

      if (error) {
        console.error("❌ Erro no cadastro:", error);
        return { error };
      }

      console.log("✅ Cadastro realizado com sucesso:", data.user?.email);
      
      // Aguardar um momento para o trigger criar o profile
      if (data.user) {
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
              setSession(session);
              setUser(session.user);
            }
          });
        }, 500);
      }

      return { error: null };
    } catch (error) {
      console.error("❌ Erro no cadastro:", error);
      return {
        error:
          error instanceof Error ? error : new Error("Erro ao criar conta"),
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log("🔐 Tentando fazer login...");
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("❌ Erro no login:", error);
        return { error };
      }

      console.log("✅ Login realizado com sucesso:", data.user?.email);
      return { error: null };
    } catch (error) {
      console.error("❌ Erro no login:", error);
      return {
        error:
          error instanceof Error ? error : new Error("Erro ao fazer login"),
      };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: getSiteURL(),
        },
      });

      return { error };
    } catch (error) {
      console.error("Google sign in error:", error);
      return {
        error:
          error instanceof Error
            ? error
            : new Error("Erro ao fazer login com Google"),
      };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign out error:", error);
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
