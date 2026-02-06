import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Obter API key do header
    const apiKey = req.headers.get("x-api-key");

    if (!apiKey || !apiKey.startsWith("orion_")) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: "Invalid API key format",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Hash da key para buscar no banco
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const keyHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Buscar API key no banco
    const { data: apiKeyData, error: keyError } = await supabaseAdmin
      .from("api_keys")
      .select(`
        id,
        user_id,
        status,
        expires_at,
        user_subscriptions!inner(
          tier,
          status,
          subscription_plans!inner(
            max_requests_per_minute,
            max_requests_per_month
          )
        )
      `)
      .eq("key_hash", keyHash)
      .eq("status", "active")
      .single();

    if (keyError || !apiKeyData) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: "Invalid or revoked API key",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verificar se a key expirou
    if (apiKeyData.expires_at && new Date(apiKeyData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: "API key expired",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verificar rate limit (requisições por minuto)
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const { data: recentRequests } = await supabaseAdmin
      .from("api_usage")
      .select("id")
      .eq("api_key_id", apiKeyData.id)
      .gte("request_time", oneMinuteAgo);

    const sub = (apiKeyData as any).user_subscriptions?.[0];
    const plan = sub?.subscription_plans?.[0];
    const maxPerMinute = plan?.max_requests_per_minute ?? 60;
    
    if (recentRequests && recentRequests.length >= maxPerMinute) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: "Rate limit exceeded",
          limit: maxPerMinute,
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verificar limite mensal
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthlyRequests } = await supabaseAdmin
      .from("api_usage")
      .select("id")
      .eq("user_id", apiKeyData.user_id)
      .gte("request_time", startOfMonth.toISOString());

    const maxPerMonth = plan?.max_requests_per_month ?? 10000;

    if (monthlyRequests && monthlyRequests.length >= maxPerMonth) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: "Monthly limit exceeded",
          limit: maxPerMonth,
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Atualizar last_used_at
    await supabaseAdmin
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", apiKeyData.id);

    return new Response(
      JSON.stringify({
        valid: true,
        user_id: apiKeyData.user_id,
        api_key_id: apiKeyData.id,
        tier: sub?.tier ?? 'free',
        requests_remaining: {
          per_minute: maxPerMinute - (recentRequests?.length || 0),
          per_month: maxPerMonth - (monthlyRequests?.length || 0),
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        valid: false,
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
