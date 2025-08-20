// web-search/index.ts
// Função para realizar pesquisas na web usando Perplexity AI
import "https://deno.land/x/xhr@0.1.0/mod.ts";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

// Helper function for safe fetch with timeout and retries
async function safeFetch(
  url: string,
  options: RequestInit = {},
  timeoutMs = 8000,
  retries = 2
): Promise<Response> {
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
        const body = await response.text().catch(() => "<binary/body>");
        const err = new Error(
          `HTTP ${response.status} ${response.statusText} - ${body.slice(
            0,
            300
          )}`
        );
        // se não for última tentativa, aguarda e tenta novamente
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
          continue;
        }
        throw err;
      }

      return response;
    } catch (error) {
      clearTimeout(timeout);
      // Retry em caso de timeout/erro de rede até exceder tentativas
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}

interface WebSearchRequest {
  query: string;
  type?: "search" | "news" | "academic";
  count?: number;
}

interface WebSearchResponse {
  answer: string;
  relatedQuestions: any[];
  query: string;
  type: string;
  timestamp: string;
}

// Exported handler (Edge Function style)
export default async function handler(req: Request): Promise<Response> {
  // Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req
      .json()
      .catch(() => ({}))) as Partial<WebSearchRequest>;

    const query = (body.query ?? "").toString();
    const type = (body.type ?? "search") as WebSearchRequest["type"];
    const count = Number.isFinite(Number(body.count)) ? Number(body.count) : 5;

    if (!query?.trim() || query.trim().length < 3) {
      return new Response(
        JSON.stringify({
          error: "A consulta deve ter pelo menos 3 caracteres",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (isNaN(count) || count < 1 || count > 20) {
      return new Response(
        JSON.stringify({
          error: "O parâmetro 'count' deve estar entre 1 e 20",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!["search", "news", "academic"].includes(type)) {
      return new Response(
        JSON.stringify({
          error: "Tipo inválido. Use 'search', 'news' ou 'academic'.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Resolve API key (Deno env preferred, fallback to process.env for local Node)
    let perplexityApiKey: string | undefined;
    try {
      // @ts-expect-error Deno specific
      if (
        typeof Deno !== "undefined" &&
        typeof (Deno as any).env?.get === "function"
      ) {
        // Deno runtime (Supabase Edge Functions)
        perplexityApiKey = (Deno as any).env.get("PERPLEXITY_API_KEY");
      }
    } catch {
      // ignore
    }
    if (!perplexityApiKey && typeof process !== "undefined") {
      // Node fallback for local dev
      perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    }

    if (!perplexityApiKey) {
      return new Response(
        JSON.stringify({ error: "PERPLEXITY_API_KEY não configurada" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Build prompts
    let systemPrompt = "Você é um assistente de pesquisa especializado.";
    let searchPrompt = query;

    switch (type) {
      case "news":
        systemPrompt += " Foque em notícias recentes e confiáveis.";
        searchPrompt = `Últimas notícias sobre: ${query}`;
        break;
      case "academic":
        systemPrompt += " Foque em fontes acadêmicas e científicas confiáveis.";
        searchPrompt = `Pesquisa acadêmica sobre: ${query}`;
        break;
      default:
        systemPrompt +=
          " Forneça uma resposta clara, estruturada e com tópicos.";
        searchPrompt = query;
    }

    // Call Perplexity (chat completions)
    const apiUrl = "https://api.perplexity.ai/chat/completions";
    const payload = {
      model: "llama-3.1-sonar-large-128k-online",
      messages: [
        {
          role: "system",
          content:
            systemPrompt +
            " Responda em português brasileiro de forma clara e organizada. Estruture em Tópicos/Seções quando aplicável.",
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
      limit: count,
    };

    const resp = await safeFetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${perplexityApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // Try parse JSON, fallback to text
    let data: any = null;
    try {
      data = await resp.json();
    } catch {
      const txt = await resp.text().catch(() => "");
      data = {
        choices: [{ message: { content: txt } }],
        related_questions: [],
      };
    }

    const answer = data?.choices?.[0]?.message?.content ?? data?.answer ?? "";
    const relatedQuestions = data?.related_questions ?? [];

    const result: WebSearchResponse = {
      answer: answer || "Nenhum resultado encontrado.",
      relatedQuestions,
      query,
      type: type ?? "search",
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
