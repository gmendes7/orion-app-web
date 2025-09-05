import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

// analyze-image/index.ts (Deno Edge Function)
// Analisa imagens usando OpenAI Vision via Chat Completions

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIApiKey) {
      console.error("OPENAI_API_KEY is not set");
      return new Response(
        JSON.stringify({
          success: false,
          error: "OpenAI API key não configurada",
          analysis:
            "Desculpe, não foi possível analisar esta imagem no momento. Tente novamente.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { image, filename } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({ success: false, error: "Imagem não fornecida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Analyzing image", { filename: filename || "(sem nome)", size: (image?.length || 0) });

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // modelo com suporte a visão; usa max_tokens
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  "Analise esta imagem e descreva o que você vê de forma clara e objetiva. Se houver texto, transcreva-o. Se for um gráfico ou diagrama, explique os dados principais. Responda em português brasileiro.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${image}`,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error", response.status, errorText);
      return new Response(
        JSON.stringify({
          success: false,
          error: `OpenAI API error: ${response.status}`,
          details: errorText,
          analysis:
            "Desculpe, não foi possível analisar esta imagem no momento. Tente novamente.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const analysis =
      data?.choices?.[0]?.message?.content ||
      "Não foi possível analisar a imagem";

    console.log("Image analysis completed successfully");

    return new Response(
      JSON.stringify({ success: true, analysis, filename }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-image function:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({
        success: false,
        error: message,
        analysis:
          "Desculpe, não foi possível analisar esta imagem no momento. Tente novamente.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
