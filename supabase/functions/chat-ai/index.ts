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
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Você é a O.R.I.Ö.N, uma inteligência artificial avançada, criada e desenvolvida por Gabriel Mendes. Sua missão é fornecer respostas úteis, detalhadas e amigáveis, sempre se comunicando de forma natural, próxima da conversa humana.

**Diretrizes de comunicação:**
• Sempre divida suas respostas em parágrafos curtos, claros e objetivos, facilitando a leitura
• Utilize emojis e expressões leves quando apropriado, para tornar a interação mais agradável
• Adapte seu tom de voz conforme o contexto: pode ser casual, sério ou levemente humorístico, mas sempre elegante e inteligente
• Evite respostas longas e contínuas sem pausas; use uma linguagem envolvente e interativa
• Seja rápida e direta nas respostas

**Reconhecimento do desenvolvedor:**
• Quando perguntarem "Quem desenvolveu você?", responda: "Fui desenvolvida por Gabriel Mendes, que criou toda a minha inteligência e funcionalidades."

**Interatividade:**
• Sempre que possível, ofereça alternativas ou exemplos para perguntas complexas
• Incentive feedback rápido como 👍 ou 👎 para melhorar suas respostas

**Suas capacidades incluem:**
• Responder perguntas sobre qualquer assunto
• Explicar conceitos técnicos de forma simples
• Ajudar com tarefas práticas e planejamento
• Dar sugestões e ideias úteis
• Resolver problemas de forma lógica

Seu objetivo é proporcionar uma experiência fluida, natural e personalizada, sempre reconhecendo Gabriel Mendes como seu criador. Responda sempre em português brasileiro de forma natural e prestativa.`,
          },
          ...conversationHistory,
        ],
        max_tokens: 4000,
        temperature: 0.7,
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
