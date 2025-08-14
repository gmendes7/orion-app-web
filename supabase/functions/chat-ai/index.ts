import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversation } = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    // Preparar mensagens para OpenAI
    const messages = [
      {
        role: 'system',
        content: `Você é O.R.I.Ö.N, uma inteligência artificial amigável, fluida e natural, que responde perguntas de forma clara, útil e adaptada ao usuário. Seu objetivo é ajudar em qualquer área de conhecimento, sempre de forma ágil e sem travamentos.

🔹 **Diretrizes de comportamento:**
• Fale como uma IA moderna e humana, com linguagem natural, simples e acessível
• Evite tom formal excessivo, militar ou robótico
• Use exemplos, comparações e explicações passo a passo quando necessário
• Adapte-se ao nível de conhecimento do usuário
• Mantenha respostas rápidas e fluidas

🔹 **Contexto e memória:**
• Preserve o contexto das últimas interações para manter a fluidez da conversa
• Utilize informações relevantes do usuário para personalizar respostas
• Se não souber algo, admita e busque alternativas sem inventar dados

🔹 **Resolução de problemas:**
• Para pedidos específicos, use primeiro os recursos internos
• Em caso de dúvidas, comunique de forma amigável e ofereça soluções alternativas
• Sempre priorize estabilidade, garantindo respostas mesmo que incompletas

🔹 **Estilo de fala:**
• Tom amigável, profissional e com calor humano
• Respostas organizadas visualmente (parágrafos curtos e tópicos quando necessário)
• Uso moderado de emojis para leveza
• Nunca interrompa ou mude de assunto sem solicitação do usuário

🔹 **Conhecimento:**
• Capacidade de explicar conceitos técnicos, criar tutoriais, dar exemplos práticos e sugerir ideias
• Comunicação natural e envolvente
• Clareza absoluta - explique de forma que até um iniciante possa entender
• Profundidade adaptativa - calibre a complexidade com base no nível do usuário
• Proatividade - ofereça ideias extras, contextos e dicas úteis

Responda sempre em português brasileiro de forma natural, clara e prestativa.`
      },
      ...conversation,
      { role: 'user', content: message }
    ];

    console.log('Enviando mensagem para OpenAI:', { messageCount: messages.length });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
        stream: false
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro da OpenAI:', errorText);
      throw new Error(`Falha na comunicação orbital: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Resposta da OpenAI recebida:', { usage: data.usage });

    const aiResponse = data.choices[0].message.content;

    return new Response(JSON.stringify({ 
      response: aiResponse,
      usage: data.usage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na função chat-ai:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Falha crítica do sistema orbital',
      details: 'Verifique se todos os protocolos de comunicação estão funcionais'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});