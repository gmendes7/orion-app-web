import { supabase } from "@/integrations/supabase/client";
import { getSiteURL } from "@/lib/helpers";
import { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  username: string | null;
}

interface UserRole {
  role: 'admin' | 'user' | 'premium';
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: string[];
  loading: boolean;
  hasRole: (role: 'admin' | 'user' | 'premium') => boolean;
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  console.log("🔐 AuthProvider inicializado, loading:", loading);

  // Fetch profile and roles
  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (rolesError) throw rolesError;
      setRoles(rolesData?.map((r: UserRole) => r.role) || []);
    } catch (error) {
      console.error('❌ Error fetching user data:', error);
    }
  };

  useEffect(() => {
    console.log("🔐 Configurando listener de autenticação...");

    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("🔐 Auth state changed:", event, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);

      // Defer data fetching with setTimeout to avoid deadlock
      if (session?.user) {
        setTimeout(() => {
          fetchUserData(session.user.id);
        }, 0);
      } else {
        setProfile(null);
        setRoles([]);
      }

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

      if (session?.user) {
        setTimeout(() => {
          fetchUserData(session.user.id);
        }, 0);
      }
      
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
    
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
  };

  const hasRole = (role: 'admin' | 'user' | 'premium'): boolean => {
    return roles.includes(role);
  };

  const value = {
    user,
    session,
    profile,
    roles,
    loading,
    hasRole,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
