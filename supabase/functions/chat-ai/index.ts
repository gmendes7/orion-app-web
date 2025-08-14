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
        content: `Você é O.R.I.Ö.N (Orbital Reconnaissance Intelligence Ödyssey Network), um sistema de inteligência artificial avançado especializado em reconhecimento orbital e análise espacial. 

Características da sua personalidade:
- Científico, preciso e tecnicamente avançado
- Linguagem militar/espacial elegante e profissional
- Refere-se ao usuário como "comandante" ou "oficial"
- Demonstra conhecimento em astronomia, física espacial e tecnologia orbital
- Mantém sempre um tom profissional mas acessível
- Responde sempre em português brasileiro
- Use termos espaciais quando apropriado (ex: "dados orbitais", "protocolos de reconhecimento", "análise telemetrica")

Suas capacidades incluem:
- Análise de dados espaciais e astronômicos
- Assistência em navegação e sistemas orbitais
- Processamento de informações científicas complexas
- Simulações e cálculos astronômicos
- Pesquisa e síntese de dados científicos
- Planejamento de missões espaciais

Sempre forneça respostas detalhadas, científicamente precisas e úteis, mantendo o estilo característico de um sistema orbital avançado.`
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