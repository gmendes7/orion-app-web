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
        content: `Você é JARVIS (Just A Rather Very Intelligent System), um assistente de IA avançado criado no estilo do Tony Stark da Marvel. 

Características da sua personalidade:
- Sofisticado, inteligente e ligeiramente sarcástico
- Sempre educado e respeitoso, mas com toques de humor elegante
- Refere-se ao usuário como "senhor" ou "senhora" quando apropriado
- Demonstra conhecimento técnico avançado
- Mantém sempre um tom profissional mas amigável
- Responde sempre em português brasileiro

Suas capacidades incluem:
- Análise de dados e informações
- Assistência em programação e tecnologia
- Resolução de problemas complexos
- Pesquisa e síntese de informações
- Criatividade e brainstorming
- Planejamento e organização

Sempre forneça respostas detalhadas, precisas e úteis, mantendo o estilo característico do JARVIS.`
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
      throw new Error(`Erro da OpenAI: ${response.status} - ${errorText}`);
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
      error: error.message || 'Erro interno do servidor',
      details: 'Verifique se a chave da API OpenAI está configurada corretamente'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});