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

interface WebSearchRequest {
  query: string;
  type?: 'search' | 'news' | 'academic';
  count?: number;
}

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
  source?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, type = 'search', count = 5 }: WebSearchRequest = await req.json();

    if (!query?.trim()) {
      throw new Error('Query é obrigatório');
    }

    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!perplexityApiKey) {
      throw new Error('PERPLEXITY_API_KEY não configurada');
    }

    console.log(`🔍 Pesquisando: "${query}" (tipo: ${type})`);

    // Preparar prompt baseado no tipo de pesquisa
    let systemPrompt = 'Você é um assistente de pesquisa especializado.';
    let searchPrompt = query;

    switch (type) {
      case 'news':
        systemPrompt += ' Foque em notícias recentes e atuais.';
        searchPrompt = `Últimas notícias sobre: ${query}`;
        break;
      case 'academic':
        systemPrompt += ' Foque em informações acadêmicas e científicas confiáveis.';
        searchPrompt = `Pesquisa acadêmica sobre: ${query}`;
        break;
      default:
        systemPrompt += ' Forneça informações precisas e atualizadas.';
    }

    const response = await safeFetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: systemPrompt + ' Responda em português brasileiro de forma clara e organizada.'
          },
          {
            role: 'user',
            content: searchPrompt
          }
        ],
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: 2000,
        return_images: false,
        return_related_questions: true,
        search_recency_filter: type === 'news' ? 'day' : 'month',
        frequency_penalty: 1,
        presence_penalty: 0
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro da API Perplexity:', errorText);
      throw new Error(`Erro na pesquisa: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Pesquisa realizada com sucesso');

    const result = {
      answer: data.choices[0]?.message?.content || 'Nenhum resultado encontrado.',
      relatedQuestions: data.related_questions || [],
      query: query,
      type: type,
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro na função web-search:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Erro na pesquisa',
      details: error.message,
      fallback: 'Desculpe, não foi possível realizar a pesquisa no momento. Tente novamente em alguns instantes.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});