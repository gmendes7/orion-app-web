import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { text, message_id, conversation_id, user_id } = await req.json();

    console.log("🔮 Gerando embedding para mensagem:", message_id);

    // Generate embedding using Lovable AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Erro ao gerar embedding:", response.status, errorText);
      throw new Error(`Falha ao gerar embedding: ${response.status}`);
    }

    const embeddingData = await response.json();
    const embedding = embeddingData.data[0].embedding;

    console.log("✅ Embedding gerado com sucesso");

    // Store embedding in database
    const { error: insertError } = await supabase
      .from("message_embeddings")
      .insert({
        message_id,
        conversation_id,
        user_id,
        embedding,
      });

    if (insertError) {
      console.error("❌ Erro ao salvar embedding:", insertError);
      throw insertError;
    }

    console.log("✅ Embedding salvo no banco de dados");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Embedding gerado e armazenado com sucesso",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Erro na função generate-embedding:", error);
    return new Response(
      JSON.stringify({
        error: (error as Error).message || "Erro ao gerar embedding",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
