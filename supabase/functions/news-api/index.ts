import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    return new Response(null, { headers: c orsHeaders });
  }

  try {
    const { 
      query, 
      category = 'general', 
      country = 'br', 
      pageSize = 10,
      sortBy = 'publishedAt'
    }: NewsRequest = await req.json();

    const apiKey = Deno.env.get('NEWS_API_KEY');
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
    const articles = data.articles
      .filter((article: any) => 
        article.title && 
        article.description && 
        !article.title.includes('[Removed]') &&
        !article.description.includes('[Removed]')
      )
      .map((article: any) => ({
        title: article.title,
        description: article.description,
        url: article.url,
        urlToImage: article.urlToImage,
        publishedAt: new Date(article.publishedAt).toLocaleString('pt-BR'),
        source: {
          name: article.source.name,
          id: article.source.id
        },
        author: article.author
      }))
      .slice(0, pageSize);

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