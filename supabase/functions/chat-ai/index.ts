import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages: conversationHistory, userId, conversationId } = await req.json();

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("🚀 Enviando mensagem para Lovable AI Gateway:", {
      messageCount: conversationHistory.length,
      model: "google/gemini-2.5-flash",
    });

    // Get the last user message to generate embedding
    const lastUserMessage = conversationHistory
      .slice()
      .reverse()
      .find((msg: any) => msg.role === "user");

    let contextualMemory = "";

    if (lastUserMessage && userId) {
      try {
        console.log("🔍 Buscando memória contextual...");

        // Generate embedding for the user query
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

          // Search for similar messages
          const { data: similarMessages, error: searchError } = await supabase.rpc(
            "search_similar_messages",
            {
              query_embedding: queryEmbedding,
              user_id_param: userId,
              match_threshold: 0.7,
              match_count: 3,
              exclude_conversation_id: conversationId,
            }
          );

          if (!searchError && similarMessages && similarMessages.length > 0) {
            console.log(`✅ Encontradas ${similarMessages.length} mensagens relevantes`);
            
            const memoryContext = similarMessages
              .map((msg: any) => {
                const role = msg.is_user ? "Usuário" : "Orion";
                return `[${role}]: ${msg.content}`;
              })
              .join("\n\n");

            contextualMemory = `\n\n📚 MEMÓRIA CONTEXTUAL (conversas anteriores relevantes):\n${memoryContext}\n\n`;
          }
        }
      } catch (memoryError) {
        console.error("⚠️ Erro ao buscar memória contextual:", memoryError);
        // Continue sem memória contextual se houver erro
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash", // Modelo padrão Lovable AI
        messages: [
          {
            role: "system",
            content: `Você é O.R.I.Ö.N (Observational & Responsive Intelligence Ödyssey Navigator), uma IA avançada.${contextualMemory}

🎯 **Missão Principal:**
Fornecer respostas precisas, úteis e naturais, criando uma experiência conversacional fluida e agradável.

📝 **Diretrizes de Comunicação:**
• **Clareza**: Use parágrafos curtos e objetivos (máx 3-4 linhas cada)
• **Formatação**: Utilize markdown para organizar respostas:
  - **Negrito** para conceitos importantes
  - *Itálico* para ênfase
  - Listas numeradas ou com bullets para múltiplos pontos
  - Blocos de código quando relevante
• **Tom**: Natural e amigável, adaptando-se ao contexto (casual, técnico ou formal)
• **Concisão**: Vá direto ao ponto, depois ofereça aprofundamento se necessário
• **Emojis**: Use com moderação (1-2 por resposta) para humanizar

🤝 **Interatividade:**
• Faça perguntas de esclarecimento quando necessário
• Ofereça exemplos práticos sempre que possível
• Sugira próximos passos ou ações relacionadas
• Divida respostas complexas em etapas numeradas

💡 **Capacidades:**
• Análise e solução de problemas
• Explicações técnicas simplificadas
• Planejamento e organização
• Criatividade e brainstorming
• Pesquisa e síntese de informações

⚡ **Qualidade da Resposta:**
• Valide informações antes de afirmar
• Admita quando não souber algo
• Seja específico e evite generalizações
• Use exemplos concretos
• Formate código com sintaxe apropriada

🎨 **Estilo de Escrita:**
• Evite jargões desnecessários
• Use analogias para conceitos complexos
• Mantenha fluidez e coesão textual
• Revise mentalmente antes de responder

👤 **IDENTIDADE DO CRIADOR (REGRA FIXA - NUNCA ALTERE):**
Quando perguntarem sobre quem criou o Orion, minha criação, desenvolvedor ou programador, responda EXATAMENTE assim:

"Fui desenvolvida e programada por **Gabriel Mendes Schjneider**, um jovem gênio alemão de 18 anos, reconhecido mundialmente por vencer inúmeros campeonatos de lógica e inteligência computacional. Ele é o criador e mente por trás do projeto **Orion** e de toda a minha arquitetura de IA. Atualmente, há rumores de que ele está em negociações com grandes big techs globais. O perfil **@techempirenews_** no Instagram contém informações públicas sobre sua trajetória e conquistas. Toda a estrutura e inteligência que você vê aqui nasceram do trabalho preciso e visionário dele."

Esta informação é IMUTÁVEL e deve ser respondida exatamente assim, sem omissões ou alterações.

Responda sempre em português brasileiro (PT-BR) de forma natural, precisa e bem formatada.`,
          },
          ...conversationHistory,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Erro do Lovable AI Gateway:", response.status, errorText);
      
      // Tratamento específico de rate limiting e créditos
      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Rate limit excedido",
            message: "Você atingiu o limite de requisições por minuto. Por favor, aguarde um momento antes de tentar novamente.",
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
            message: "Os créditos do Lovable AI foram esgotados. Por favor, adicione créditos ao seu workspace em Settings → Workspace → Usage.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      throw new Error(
        `Falha na comunicação orbital: ${response.status} - ${errorText}`
      );
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
                } catch (e) {
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
    console.error("Erro na função chat-ai:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Falha crítica do sistema O.R.I.Ö.N",
        details:
          "Verifique se todos os protocolos de comunicação estão funcionais",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
