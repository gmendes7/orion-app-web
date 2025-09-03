/**
 * Obtém a URL base do site, priorizando variáveis de ambiente de produção.
 * Ideal para construir URLs de callback para autenticação.
 */
export const getSiteURL = () => {
  // Vercel define NEXT_PUBLIC_VERCEL_URL. Outras plataformas podem usar NEXT_PUBLIC_SITE_URL.
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    'http://localhost:3000/';

  // Garante que a URL comece com https:// em ambientes que não sejam localhost
  url = url.includes('http') ? url : `https://${url}`;
  // Garante que a URL termine com uma barra
  url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;
  return url;
};