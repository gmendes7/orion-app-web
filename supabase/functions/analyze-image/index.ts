// If running in Deno, ensure your editor supports Deno types (e.g., enable Deno extension in VSCode).
// If running in Node.js, use a compatible HTTP server like Express:

// analyze-image/index.ts
// Função para analisar imagens usando OpenAI GPT-4 Vision

// analyze-image as Supabase Edge Function (Deno / Fetch handler)
declare const Deno: {
  env?: { get(name: string): string | undefined };
} | undefined;

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-forwarded-for",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

function getOpenAiKey(): string | undefined {
  try {
    if (typeof Deno !== "undefined" && Deno?.env && typeof Deno.env.get === "function") {
      return Deno.env.get("OPENAI_API_KEY");
    }
  } catch {
    // ignore
  }
  if (typeof process !== "undefined") return process.env.OPENAI_API_KEY;
  return undefined;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // parse body safely
  let body: Record<string, unknown> = {};
  try {
    const txt = await req.text();
    body = txt ? JSON.parse(txt) : {};
  } catch (err) {
    return new Response(JSON.stringify({ error: "JSON inválido", details: String(err) }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
  if (!imageUrl) {
    return new Response(JSON.stringify({ error: "imageUrl é obrigatório" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const OPENAI_KEY = getOpenAiKey();
  if (!OPENAI_KEY) {
    return new Response(JSON.stringify({ error: "OPENAI_API_KEY não configurada" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // preferência por Responses API (suporta image inputs). Ajuste OPENAI_MODEL nas envs se necessário.
  const envModel = (typeof Deno !== "undefined" && Deno?.env && typeof Deno.env.get === "function")
    ? Deno.env.get("OPENAI_MODEL")
    : (typeof process !== "undefined" && process?.env ? process.env.OPENAI_MODEL : undefined);
  const model = envModel || "gpt-4o-mini";

  // Tenta chamar Responses API com input_image (funciona se sua conta/model suportam visão)
  try {
    const resp = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: "Descreva esta imagem em português. Primeiro um resumo (1-2 frases), depois tópicos com detalhes." },
              { type: "input_image", image_url: imageUrl },
            ],
          },
        ],
        // limites para reduzir custo/latência
        max_output_tokens: 500,
        temperature: 0.2,
      }),
    });

    const txt = await resp.text();
    if (!resp.ok) {
      console.error("OpenAI /responses erro:", resp.status, txt);
      // fallback: retorna o texto de erro para debugging
      return new Response(JSON.stringify({ error: "Erro ao contactar OpenAI", details: txt }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // tenta interpretar resposta do Responses API
    type OpenAIResponse = {
      output?: Array<
        | { content?: Array<{ text?: string; speech?: string }> }
        | string
      >;
      choices?: Array<{ message?: { content?: string } }>;
    };

    let json: OpenAIResponse | null = null;
    try {
      json = JSON.parse(txt) as OpenAIResponse;
    } catch {
      json = null;
    }

    // Extrair texto da estrutura comum do Responses API
    let description = "";
    if (json?.output && Array.isArray(json.output)) {
      for (const out of json.output) {
        if (typeof out === "string") {
          description += out;
        } else if (Array.isArray(out.content)) {
          for (const c of out.content) {
            if (typeof c.text === "string") description += c.text;
            if (typeof c.speech === "string") description += c.speech;
          }
        }
      }
    }

    // fallback simples: tenta extrair choices.message.content (caso seja Chat-like)
    if (!description && json?.choices?.[0]?.message?.content) {
      description = json.choices[0].message.content;
    }

    description = String(description || "Não foi possível obter descrição da imagem.");

    return new Response(JSON.stringify({ description }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("analyze-image erro inesperado:", err);
    return new Response(JSON.stringify({ error: "Erro interno", details: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}
