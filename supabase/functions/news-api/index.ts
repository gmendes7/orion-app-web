// @ts-expect-error: remote Deno std module; ignore editor/module-resolution errors in non-Deno TypeScript tooling
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function for safe fetch with timeout and retries
async function safeFetch(url: string, options: RequestInit = {}, timeoutMs = 8000, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);
      
      if (!response.ok) {
        const body = await response.text();
        throw new Error(`HTTP ${response.status} - ${response.statusText} - ${body.slice(0, 300)}`);
      }
      
      return response;
    } catch (error) {
      clearTimeout(timeout);
      if (attempt === retries) throw error;
      await new Promise(resolve => setTimeout(resolve, 400 * (attempt + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}

interface NewsRequest {
  query?: string;
  category?: 'business' | 'entertainment' | 'general' | 'health' | 'science' | 'sports' | 'technology';
  country?: string;
  pageSize?: number;
  sortBy?: 'relevancy' | 'popularity' | 'publishedAt';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
  const { 
    query, 
    category = 'general', 
    country = 'br', 
    pageSize = 10,
    sortBy = 'publishedAt'
  }: NewsRequest = await req.json();

  // Support both Deno and Node (or other) environments without referencing `Deno` at compile time
  const _global = globalThis as unknown as {
    Deno?: { env?: { get?: (key: string) => string | undefined } };
    process?: { env?: { NEWS_API_KEY?: string } };
    __NEWS_API_KEY?: string;
  };

  const apiKey: string | undefined =
    _global.Deno?.env?.get?.('NEWS_API_KEY')
    ?? _global.process?.env?.NEWS_API_KEY
    ?? _global.__NEWS_API_KEY;

  if (!apiKey) {
    throw new Error('NEWS_API_KEY não configurada');
  }

    let url = 'https://newsapi.org/v2/';
    
    if (query) {
      // Busca por termo específico
      url += `everything?q=${encodeURIComponent(query)}&language=pt&sortBy=${sortBy}&pageSize=${pageSize}&apiKey=${apiKey}`;
    } else {
      // Top headlines por categoria/país
      url += `top-headlines?country=${country}&category=${category}&pageSize=${pageSize}&apiKey=${apiKey}`;
    }

    console.log(`📰 Buscando notícias: ${query || `${category} (${country})`}`);

    const response = await safeFetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro da API: ${errorData.message || response.status}`);
    }

    const data = await response.json();
    
    // Filtrar e formatar notícias
    const articles = (Array.isArray(data.articles) ? data.articles : [])
      .filter((article: unknown) => {
        const a = article as Record<string, unknown>;
        return (
          typeof a.title === 'string' &&
          typeof a.description === 'string' &&
          !a.title.includes('[Removed]') &&
          !a.description.includes('[Removed]')
        );
      })
      .map((article: unknown) => {
        const a = article as Record<string, unknown>;
        return {
          title: String(a.title ?? ''),
          description: String(a.description ?? ''),
          url: String(a.url ?? ''),
          urlToImage: String(a.urlToImage ?? ''),
          publishedAt: new Date(String(a.publishedAt ?? '')).toLocaleString('pt-BR'),
          source: {
            name: String((a.source as Record<string, unknown>)?.name ?? ''),
            id: (a.source as Record<string, unknown>)?.id ?? null,
          },
          author: String(a.author ?? ''),
        };
      })
      .slice(0, pageSize as number);

    const result = {
      articles,
      totalResults: data.totalResults,
      query: query || `Top headlines - ${category}`,
      country,
      category,
      timestamp: new Date().toISOString()
    };

    console.log(`✅ ${articles.length} notícias encontradas`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro na função news-api:', error);
    
    return new Response(JSON.stringify({
      error: 'Erro ao buscar notícias',
      details: error.message,
      fallback: 'Não foi possível obter as notícias no momento. Tente novamente em alguns instantes.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});