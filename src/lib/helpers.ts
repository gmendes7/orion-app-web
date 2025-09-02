/**
 * Obtém a URL base do site, priorizando variáveis de ambiente de produção.
 * Ideal para construir URLs de callback para autenticação.
 */
export const getSiteURL = () => {
import { supabase } from "@/integrations/supabase/client";
import { getSiteURL } from "@/lib/helpers"; // Importe a função que criamos

// ...

const handleSignUp = async (email, password) => {
  // 1. Obtenha a URL base dinâmica (http://localhost:3000/ ou https://seu-site.com/)
  const siteURL = getSiteURL();

  // 2. Chame o signUp com a opção `emailRedirectTo`
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // O usuário será redirecionado para esta URL após clicar no link do e-mail.
      // A rota '/auth/callback' é onde o Next.js/Supabase finalizará a sessão.
      emailRedirectTo: `${siteURL}auth/callback`,
    },
  });

  if (error) {
    console.error("Erro no cadastro:", error);
    // Tratar erro...
  } else {
    // Mostrar mensagem de sucesso (ex: "Verifique seu e-mail para confirmar sua conta.")
  }
};

// A mesma lógica se aplica a `signInWithOtp` ou `resetPasswordForEmail`.
  // Vercel define NEXT_PUBLIC_VERCEL_URL. Outras plataformas podem usar NEXT_PUBLIC_SITE_URL.
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    'http://localhost:3000/';

  // Garante que a URL comece com https:// em ambientes que não sejam localhost
  url = url.includes('http') ? url : `httpshttps://${url}`;
  // Garante que a URL termine com uma barra
  url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;
  return url;
};