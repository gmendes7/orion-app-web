import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
  // Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Basic abuse mitigation by Content-Length and per-IP spacing
  if (tooLargeBody(req, 128 * 1024)) {
    return new Response(JSON.stringify({ error: "Payload muito grande" }), {
      status: 413,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const ip = getClientIp(req);
  const now = Date.now();
  const last = lastRequestAt.get(ip) ?? 0;
  if (now - last < RATE_LIMIT_WINDOW_MS) {
    return new Response(
      JSON.stringify({
        error: "Muitas requisições. Tente novamente em breve.",
      }),
      {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
  lastRequestAt.set(ip, now);

  let bodyJson: any = {};
  try {
    const txt = await req.text();
    bodyJson = txt ? JSON.parse(txt) : {};
  } catch (e) {
    return new Response(JSON.stringify({ error: "JSON inválido" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const message =
    typeof bodyJson.message === "string" ? bodyJson.message.trim() : "";
  const rawConversation = Array.isArray(bodyJson.conversation)
    ? bodyJson.conversation
    : [];
  const format = bodyJson.format === "markdown" ? "markdown" : "plain";

  if (!message || message.length < 2) {
    return new Response(JSON.stringify({ error: "Mensagem muito curta" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Build strict system prompt to force Markdown + sections
  const systemInstruction =
    format === "markdown"
      ? [
          "Você é O.R.I.Ö.N — assistente inteligente e conciso.",
          "RESPONDA EM PORTUGUÊS (PT-BR) EM MARKDOWN.",
          "Inicie com uma seção '## Resumo' com 1-2 frases.",
          "Em seguida, adicione '## Detalhes' com tópicos (listas '-').",
          "Se possível, inclua referências ou links curtos em '## Referências'.",
          "Seja direto, evite texto corrido extenso; use exemplos apenas quando necessário.",
        ].join(" ")
      : "Você é O.R.I.Ö.N — assistente inteligente. Responda em português de forma clara e objetiva.";

  // Trunca conversa para últimas mensagens úteis (evita tokens desnecessários)
  const maxHistory = 6;
  const conversation: ChatMessage[] = [
    { role: "system", content: systemInstruction },
    // append last N from user-provided conversation, sanitize shapes
    ...rawConversation.slice(-maxHistory).map((m: any) => ({
      role:
        m?.role === "assistant"
          ? "assistant"
          : m?.role === "user"
          ? "user"
          : "user",
      content: String(m?.content ?? "").slice(0, 2000),
    })),
    { role: "user", content: message.slice(0, 5000) },
  ];

  // Resolve API key (Deno env preferred; fallback to process.env for local dev)
  let OPENAI_KEY: string | undefined;
  try {
    // @ts-expect-error Deno env
    if (
      typeof Deno !== "undefined" &&
      typeof (Deno as any).env?.get === "function"
    ) {
      OPENAI_KEY = (Deno as any).env.get("OPENAI_API_KEY");
    }
  } catch {
    // ignore
  }
  if (!OPENAI_KEY && typeof process !== "undefined") {
    OPENAI_KEY = process.env.OPENAI_API_KEY;
  }
  if (!OPENAI_KEY) {
    return new Response(
      JSON.stringify({ error: "OPENAI_API_KEY não configurada" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Model selection and safe defaults (configure via env OPENAI_MODEL)
  const model =
    (typeof Deno !== "undefined"
      ? (Deno as any).env.get("OPENAI_MODEL")
      : process.env.OPENAI_MODEL) || "gpt-4o-mini";

  // Compose OpenAI request
  const openaiReqBody = {
    model,
    messages: conversation,
    max_tokens: 700,
    temperature: 0.2,
    top_p: 0.9,
    stream: true,
  };

  try {
    const openaiRes = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(openaiReqBody),
      }
    );

    if (!openaiRes.ok || !openaiRes.body) {
      const text = await openaiRes.text().catch(() => "");
      console.error("OpenAI proxy error:", openaiRes.status, text);
      return new Response(
        JSON.stringify({ error: "Erro ao contactar OpenAI", details: text }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Proxy streaming response to client preserving SSE chunks
    const responseHeaders = {
      ...corsHeaders,
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    };

    // Return the raw body so browser/frontend can read stream (SSE-style from OpenAI)
    return new Response(openaiRes.body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error("chat-ai unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno", details: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}
