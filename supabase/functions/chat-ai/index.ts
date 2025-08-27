import "https://deno.land/x/xhr@0.1.0/mod.ts";

// Declare Deno ambient to avoid TS errors when editing locally (não altera runtime)
declare const Deno: {
  env?: { get(name: string): string | undefined };
} | undefined;

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-forwarded-for",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Max-Age": "600",
};

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

// Simple in-memory per-IP rate limiter (per-instance, best-effort)
const RATE_LIMIT_WINDOW_MS = 1000; // mínimo entre requests por IP
const lastRequestAt = new Map<string, number>();

function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

function tooLargeBody(req: Request, maxBytes = 64 * 1024): boolean {
  const cl = req.headers.get("content-length");
  if (cl) {
    try {
      return Number(cl) > maxBytes;
    } catch {
      return false;
    }
  }
  return false;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // parse safe
  let bodyJson: unknown = {};
  try {
    const txt = await req.text();
    let json: Record<string, unknown> | null = null;
    try { json = JSON.parse(txt); } catch { json = null; }

    if (json && Array.isArray(json.output)) {
      // acesse com cast seguro
      const output = json.output as unknown[];
      // percorra com checks
    }

    bodyJson = txt ? JSON.parse(txt) : {};
  } catch {
    return new Response(JSON.stringify({ error: "JSON inválido" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const b = bodyJson as Record<string, unknown>;
  const message = typeof b.message === "string" ? b.message.trim() : "";
  const rawConversation = Array.isArray(b.conversation) ? (b.conversation as unknown[]) : [];
  const format = b.format === "markdown" ? "markdown" : "plain";

  if (!message || message.length < 2) {
    return new Response(JSON.stringify({ error: "Mensagem muito curta" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const systemInstruction =
    format === "markdown"
      ? [
          "Você é O.R.I.Ö.N — assistente inteligente e conciso.",
          "RESPONDA EM PORTUGUÊS (PT-BR) EM MARKDOWN.",
          "Inicie com '## Resumo' (1-2 frases) e depois '## Detalhes' em listas.",
        ].join(" ")
      : "Você é O.R.I.Ö.N — assistente inteligente. Responda em português de forma clara.";

  const maxHistory = 6;
  const conversation: ChatMessage[] = [
    { role: "system", content: systemInstruction },
    ...rawConversation
      .slice(-maxHistory)
      .map((m): ChatMessage => {
        const entry = typeof m === "object" && m !== null ? (m as Record<string, unknown>) : {};
        const role: ChatMessage["role"] =
          entry.role === "assistant" ? "assistant" : entry.role === "user" ? "user" : "user";
        const content = String(entry.content ?? "").slice(0, 2000);
        return { role, content };
      }),
    { role: "user", content: message.slice(0, 5000) },
  ];

  // Resolve API key (Deno env preferred, fallback to process.env)
  let OPENAI_KEY: string | undefined;
  try {
    if (typeof Deno !== "undefined" && typeof Deno.env?.get === "function") {
      OPENAI_KEY = Deno.env.get("OPENAI_API_KEY");
    }
  } catch {
    // ignore
  }
  if (!OPENAI_KEY && typeof process !== "undefined") OPENAI_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_KEY) {
    return new Response(JSON.stringify({ error: "OPENAI_API_KEY não configurada" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const denoModel = typeof Deno !== "undefined" ? Deno.env?.get("OPENAI_MODEL") : undefined;
  const model = (denoModel || process.env.OPENAI_MODEL) || "gpt-4o-mini";

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: conversation,
        max_tokens: 700,
        temperature: 0.2,
        top_p: 0.9,
        stream: true,
      }),
    });

    if (!openaiRes.ok || !openaiRes.body) {
      const txt = await openaiRes.text().catch(() => "");
      return new Response(JSON.stringify({ error: "Erro ao contactar OpenAI", details: txt }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(openaiRes.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Erro interno", details: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}
