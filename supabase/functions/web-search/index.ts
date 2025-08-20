// web-search/index.ts
// Função para realizar pesquisas na web usando Perplexity AI
import "https://deno.land/x/xhr@0.1.0/mod.ts";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Helper function for safe fetch with timeout and retries
async function safeFetch(
  url: string,
  options: RequestInit = {},
  timeoutMs = 8000,
  retries = 2
) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          `HTTP ${response.status} - ${response.statusText} - ${body.slice(
            0,
            300
          )}`
        );
      }

      return response;
    } catch (error) {
      clearTimeout(timeout);
      if (attempt === retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    }
  }
  throw new Error("Max retries exceeded");
}

interface WebSearchRequest {
  query: string;
  type?: "search" | "news" | "academic";
  count?: number;
}

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
  source?: string;
}

// Exported handler (Edge Function style)
export default async function handler(req: Request): Promise<Response> {
  // Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      query,
      type = "search",
      count = 5,
    }: WebSearchRequest = await req.json();

    if (!query?.trim() || query.length < 3) {
      throw new Error("A consulta deve ter pelo menos 3 caracteres");
    }

    if (count < 1 || count > 20) {
      throw new Error("O número de resultados deve ser entre 1 e 20");
    }

    if (!["search", "news", "academic"].includes(type)) {
      throw new Error(
        "Tipo de pesquisa inválido. Use 'search', 'news' ou 'academic'."
      );
    }

    let perplexityApiKey: string | undefined;
    // Try Deno first (access via globalThis to avoid ReferenceError in non-Deno runtimes)
    try {
      perplexityApiKey = (globalThis as ).Deno?.env?.get?.(
        "PERPLEXITY_API_KEY"
      );
    } catch {
      // ignore if Deno not available or access denied
    }
    // Fallback to Node's process.env if not found
    if (!perplexityApiKey) {
      perplexityApiKey = (globalThis as any).process?.env?.PERPLEXITY_API_KEY;
    }
    if (!perplexityApiKey) {
      throw new Error("PERPLEXITY_API_KEY não configurada");
    }

    let systemPrompt = "Você é um assistente de pesquisa especializado.";
    let searchPrompt = query;

    switch (type) {
      case "news":
        systemPrompt += " Foque em notícias recentes e atuais.";
        searchPrompt = `Últimas notícias sobre: ${query}`;
        break;
      case "academic":
        systemPrompt +=
          " Foque em informações acadêmicas e científicas confiáveis.";
        searchPrompt = `Pesquisa acadêmica sobre: ${query}`;
        break;
      default:
        systemPrompt += " Forneça informações precisas e atualizadas.";
    }

    const response = await safeFetch(
      "https://api.perplexity.ai/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${perplexityApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-sonar-large-128k-online",
          messages: [
            {
              role: "system",
              content:
                systemPrompt +
                " Responda em português brasileiro de forma clara e organizada.",
            },
            {
              role: "user",
              content: searchPrompt,
            },
          ],
          temperature: 0.2,
          top_p: 0.9,
          max_tokens: 2000,
          return_images: false,
          return_related_questions: true,
          search_recency_filter: type === "news" ? "day" : "month",
          frequency_penalty: 1,
          presence_penalty: 0,
        }),
      }
    );

    // Safely parse response JSON, falling back to raw text when JSON parsing fails
    let data;
    try {
      data = await response.clone().json();
    } catch (jsonErr) {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw_text: text };
      }
    }

    const result = {
      answer:
        data.choices?.[0]?.message?.content || "Nenhum resultado encontrado.",
      relatedQuestions: data.related_questions || [],
      query,
      type,
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("❌ Erro na função web-search:", err);
    return new Response(
      JSON.stringify({
        error: "Erro na pesquisa",
        details: err.message || String(err),
        fallback:
          "Desculpe, não foi possível realizar a pesquisa no momento. Tente novamente em alguns instantes.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}
