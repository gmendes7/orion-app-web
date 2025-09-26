import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIApiKey) {
      throw new Error("OPENAI_API_KEY não configurada");
    }

    // Pedimos para o modelo retornar um JSON estrito com reply_text e actions[]
    const systemPrompt = `Você é um analisador de intenções. Receberá uma lista de mensagens (formato ChatML). Retorne estritamente um JSON com os campos:\n- reply_text: string (uma resposta curta ao usuário)\n- actions: array de objetos com { id, type, target, command, params, requires_confirmation }\nNão imprima nada além do JSON. Exemplo de saída esperada:\n{ "reply_text": "...", "actions": [{"id":"act-1","type":"device_control","target":"lights/livingroom","command":"power_on","params":{"intensity":80},"requires_confirmation":false}] }`;

    const payload = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...(messages || []),
      ],
      temperature: 0.0,
      max_tokens: 800,
    };

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const text = await r.text();
      console.error("OpenAI error:", text);
      throw new Error(`OpenAI returned ${r.status}`);
    }

    const json = await r.json();
    const content = json.choices?.[0]?.message?.content || "";

    // Tenta parsear o JSON retornado pelo modelo
    let parsed = { reply_text: content, actions: [] } as any;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      // Se não for JSON válido, mantemos o texto como reply_text
      parsed = { reply_text: content, actions: [] };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("chat-intent error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
