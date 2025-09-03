/**
 * Retorna a URL base do site no cliente (browser) de forma segura
 * Ex.: "http://localhost:3000/" ou "https://seu-dominio.com/"
 */
export const getSiteURL = () => {
  try {
    if (typeof window !== 'undefined' && window.location?.origin) {
      const origin = window.location.origin;
      return origin.endsWith('/') ? origin : `${origin}/`;
    }
  } catch (_) {}
  // Fallback para dev
  return 'http://localhost:3000/';
};