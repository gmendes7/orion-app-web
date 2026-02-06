import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Obter usuário autenticado
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { name } = await req.json();

    // Gerar API key única (formato: orion_...)
    const apiKey = `orion_${crypto.randomUUID().replace(/-/g, "")}`;
    
    // Hash da key para armazenar no banco
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const keyHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    // Prefixo para mostrar ao usuário (primeiros 12 caracteres)
    const keyPrefix = apiKey.substring(0, 12);

    // Inserir no banco
    const { error: insertError } = await supabaseClient
      .from("api_keys")
      .insert({
        user_id: user.id,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        name: name || "Default Key",
        status: "active",
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      throw insertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        api_key: apiKey,
        key_prefix: keyPrefix,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: (error as Error).message || "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
