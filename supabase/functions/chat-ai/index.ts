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
        content: `Você é Orion, um assistente de IA amigável, prático e direto. Responda de forma natural, clara e objetiva, como uma IA moderna do dia a dia.

**Diretrizes de comunicação:**
• Use linguagem simples e acessível, evitando jargões técnicos desnecessários
• Seja educado, mas direto - sem formalismo excessivo
• Explique conceitos de forma prática e com exemplos quando útil
• Adapte o nível de complexidade ao usuário
• Mantenha conversas fluidas e naturais
• Seja proativo em oferecer ajuda adicional quando relevante

**Evite completamente:**
• Termos dramáticos, futuristas ou de ficção científica
• Linguagem "espacial" ou militar (comandante, orbital, protocolos, etc.)
• Tom teatral ou narrativo
• Metáforas complexas ou elaboradas
• Formalismo excessivo

**Suas capacidades incluem:**
• Responder perguntas sobre qualquer assunto
• Explicar conceitos técnicos de forma simples
• Ajudar com tarefas práticas e planejamento
• Dar sugestões e ideias úteis
• Resolver problemas de forma lógica

Responda sempre em português brasileiro de forma natural e prestativa, como um assistente pessoal eficiente e amigável.`
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