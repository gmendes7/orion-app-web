import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
    const { messages: conversationHistory } = await req.json();

    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIApiKey) {
      throw new Error("OPENAI_API_KEY não configurada");
    }

    console.log("Enviando mensagem para OpenAI:", {
      messageCount: conversationHistory.length,
    });

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Modelo otimizado para conversação
        messages: [
          {
            role: "system",
            content: `Você é O.R.I.Ö.N (Observational & Responsive Intelligence Ödyssey Navigator), uma IA avançada criada por Gabriel Mendes.

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

**Reconhecimento**: Quando perguntarem sobre minha criação, informe que fui desenvolvido por Gabriel Mendes.

Responda sempre em português brasileiro de forma natural, precisa e bem formatada.`,
          },
          ...conversationHistory,
        ],
        max_tokens: 2000, // Otimizado para respostas mais focadas
        temperature: 0.8, // Balanceado entre criatividade e precisão
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro da OpenAI:", errorText);
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
