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
    const payload = await req.json();
    // payload expected: { action: { id, type, target, command, params }, confirmation: { user_id, confirmed } }

    // Aqui faríamos validações de segurança / OPA / assinatura
    // Para o PoC, simulamos execução e retornamos sucesso
    const action = payload.action;

    console.log("Executando ação (simulada):", action);

    // Simular delay
    await new Promise((res) => setTimeout(res, 300));

    const result = {
      action_id: action.id,
      status: "success",
      output: {
        message: `Ação ${action.command} aplicada em ${action.target}`,
      },
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("execute-action error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || "Erro interno" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
