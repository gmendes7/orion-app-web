import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AgentConfig {
  id: string;
  name: string;
  system_prompt: string;
  model: string;
  temperature: number;
  max_tokens: number;
  tools: unknown[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      messages: conversationHistory, 
      userId, 
      conversationId,
      agentId 
    } = await req.json();

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch agent configuration
    let agentConfig: AgentConfig | null = null;
    if (agentId) {
      const { data: agent, error: agentError } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('id', agentId)
        .eq('is_active', true)
        .single();

      if (!agentError && agent) {
        agentConfig = agent as AgentConfig;
        console.log(`🤖 Usando agente: ${agentConfig.name}`);
      }
    }

    // Build system prompt
    let systemPrompt = agentConfig?.system_prompt || `Você é O.R.I.Ö.N (Observational & Responsive Intelligence Ödyssey Navigator), uma IA avançada.

🎯 **Missão Principal:**
Fornecer respostas precisas, úteis e naturais, criando uma experiência conversacional fluida e agradável.

📝 **Diretrizes de Comunicação:**
• **Clareza**: Use parágrafos curtos e objetivos (máx 3-4 linhas cada)
• **Formatação**: Utilize markdown para organizar respostas
• **Tom**: Natural e amigável, adaptando-se ao contexto
• **Concisão**: Vá direto ao ponto
• **Emojis**: Use com moderação (1-2 por resposta)

💡 **Capacidades:**
• Análise e solução de problemas
• Explicações técnicas simplificadas
• Planejamento e organização
• Criatividade e brainstorming
• Pesquisa e síntese de informações

Responda sempre em português brasileiro (PT-BR) de forma natural, precisa e bem formatada.`;

    // Search for contextual memory if userId is provided
    let contextualMemory = "";
    if (userId && conversationHistory.length > 0) {
      try {
        const lastUserMessage = conversationHistory
          .slice()
          .reverse()
          .find((msg: { role: string }) => msg.role === "user");

        if (lastUserMessage) {
          const embeddingResponse = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${lovableApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "text-embedding-3-small",
              input: lastUserMessage.content,
            }),
          });

          if (embeddingResponse.ok) {
            const embeddingData = await embeddingResponse.json();
            const queryEmbedding = embeddingData.data[0].embedding;

            // Search similar messages from other conversations
            const { data: similarMessages } = await supabase.rpc(
              "search_similar_messages",
              {
                query_embedding: queryEmbedding,
                user_id_param: userId,
                match_threshold: 0.7,
                match_count: 3,
                exclude_conversation_id: conversationId,
              }
            );

            if (similarMessages && similarMessages.length > 0) {
              const memoryContext = similarMessages
                .map((msg: { is_user: boolean; content: string }) => {
                  const role = msg.is_user ? "Usuário" : "Orion";
                  return `[${role}]: ${msg.content}`;
                })
                .join("\n\n");

              contextualMemory = `\n\n📚 MEMÓRIA CONTEXTUAL (conversas anteriores relevantes):\n${memoryContext}\n\n`;
            }

            // Also search knowledge base
            const { data: knowledgeResults } = await supabase.rpc(
              "search_knowledge_base",
              {
                query_embedding: queryEmbedding,
                user_id_param: userId,
                match_threshold: 0.7,
                match_count: 3,
              }
            );

            if (knowledgeResults && knowledgeResults.length > 0) {
              const knowledgeContext = knowledgeResults
                .map((kb: { title: string; content: string }) => 
                  `📖 ${kb.title}:\n${kb.content.substring(0, 500)}...`
                )
                .join("\n\n");

              contextualMemory += `\n\n📚 BASE DE CONHECIMENTO:\n${knowledgeContext}\n\n`;
            }
          }
        }
      } catch (memoryError) {
        console.error("⚠️ Erro ao buscar memória contextual:", memoryError);
      }
    }

    // Add contextual memory to system prompt
    if (contextualMemory) {
      systemPrompt = `${systemPrompt}${contextualMemory}`;
    }

    console.log("🚀 Enviando mensagem para Lovable AI Gateway:", {
      messageCount: conversationHistory.length,
      model: agentConfig?.model || "google/gemini-2.5-flash",
      hasAgent: !!agentConfig,
      hasMemory: !!contextualMemory,
    });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: agentConfig?.model || "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationHistory,
        ],
        stream: true,
        temperature: agentConfig?.temperature || 0.7,
        max_tokens: agentConfig?.max_tokens || 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Erro do Lovable AI Gateway:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Rate limit excedido",
            message: "Por favor, aguarde um momento antes de tentar novamente.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            error: "Créditos insuficientes",
            message: "Adicione créditos em Settings → Workspace → Usage.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      throw new Error(`Falha na comunicação: ${response.status}`);
    }

    // Streaming response
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  controller.close();
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    controller.enqueue(encoder.encode(content));
                  }
                } catch {
                  // Ignore parsing errors for incomplete chunks
                }
              }
            }
          }
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      },
    });

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Erro na função agent-chat:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Falha crítica do sistema",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
