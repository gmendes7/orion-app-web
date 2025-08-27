declare const Deno: {
  env?: { get(name: string): string | undefined };
} | undefined;

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-forwarded-for",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

// safeFetch implementation (complete)...
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
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);
      if (!response.ok) {
        const body = await response.text().catch(() => "<no-body>");
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
          continue;
        }
        throw new Error(`HTTP ${response.status} ${response.statusText} - ${String(body).slice(0, 300)}`);
      }
      return response;
    } catch (e) {
      clearTimeout(timeout);
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
        continue;
      }
      throw e;
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
  relatedQuestions: unknown[];
  query: string;
  type: string;
  timestamp: string;
}

// Resolve env for Deno or Node (local dev)
function getEnvVar(name: string): string | undefined {
  try {
    if (typeof Deno !== "undefined") {
      const deno = Deno as unknown as { env?: { get?: (n: string) => string | undefined } };
      if (deno.env && typeof deno.env.get === "function") {
        return deno.env.get(name);
      }
    }
  } catch {
    // ignore
  }
  if (typeof process !== "undefined") {
    const proc = process as unknown as { env?: Record<string, string | undefined> };
    if (proc.env && Object.prototype.hasOwnProperty.call(proc.env, name)) {
      return proc.env[name];
    }
  }
  return undefined;
}

export default async function (req: Request): Promise<Response> {
  const allowedTypes = ["search", "news", "academic"] as const;
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const query = String(body.query ?? "").trim();
    const type = (typeof body.type === "string" && allowedTypes.includes(body.type as typeof allowedTypes[number])
      ? (body.type as typeof allowedTypes[number])
      : "search");
    const count =
      typeof body.count === "number" && Number.isFinite(body.count) ? Math.floor(body.count as number) : 5;

    if (!query || query.length < 3) {
      return new Response(JSON.stringify({ error: "A consulta deve ter pelo menos 3 caracteres" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!allowedTypes.includes(type)) {
      return new Response(JSON.stringify({ error: "Tipo inválido. Use 'search', 'news' ou 'academic'." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const perplexityApiKey = getEnvVar("PERPLEXITY_API_KEY");
    if (!perplexityApiKey) {
      return new Response(JSON.stringify({ error: "PERPLEXITY_API_KEY não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const key = perplexityApiKey;

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
        systemPrompt += " Forneça uma resposta clara, estruturada e com tópicos.";
        searchPrompt = query;
    }

    const apiUrl = "https://api.perplexity.ai/chat/completions";
    const payload = {
      model: "llama-3.1-sonar-large-128k-online",
      messages: [
        { role: "system", content: systemPrompt + " Responda em português brasileiro de forma clara e organizada." },
        { role: "user", content: searchPrompt },
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
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    let data: unknown = null;
    try {
      data = await resp.json();
    } catch {
      const txt = await resp.text().catch(() => "");
      data = { choices: [{ message: { content: txt } }], related_questions: [] };
    }

    const anyData = (data ?? {}) as Record<string, unknown>;

    // Try to extract answer from choices.message.content or from answer field
    let extractedAnswer: string | undefined;
    const choices = Array.isArray(anyData.choices) ? (anyData.choices as Array<Record<string, unknown>>) : undefined;
    if (choices && choices[0]) {
      const first = choices[0] as Record<string, unknown>;
      const msg = first.message as Record<string, unknown> | undefined;
      if (msg && typeof msg.content === "string") {
        extractedAnswer = msg.content;
      }
    }
    if (extractedAnswer === undefined && typeof anyData.answer === "string") {
      extractedAnswer = anyData.answer;
    }
    const answer = String(extractedAnswer ?? "");

    const relatedQuestions = Array.isArray(anyData.related_questions)
      ? (anyData.related_questions as unknown[])
      : [];

    const result: WebSearchResponse = {
      answer: String(answer || "Nenhum resultado encontrado."),
      relatedQuestions,
      query,
      type: type ?? "search",
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    return new Response(
      JSON.stringify({
        error: "Erro na pesquisa",
        details: err instanceof Error ? err.message : String(err),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
