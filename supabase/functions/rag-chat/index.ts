import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { query, conversation_context = [] } = await req.json();
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader || '');
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('RAG chat request for user:', user.id, 'Query:', query);

    // Generate embedding for the search query
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: query,
      }),
    });

    if (!embeddingResponse.ok) {
      throw new Error(`Embedding API failed: ${embeddingResponse.status}`);
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    // Perform similarity search to get relevant context
    const { data: searchResults, error: searchError } = await supabase.rpc('search_documents', {
      query_embedding: queryEmbedding,
      user_id_param: user.id,
      similarity_threshold: 0.6,
      match_count: 5
    });

    if (searchError) {
      console.error('Search error:', searchError);
      throw new Error('Context search failed');
    }

    const relevantContext = searchResults?.map(result => result.chunk_content).join('\n\n') || '';
    
    console.log(`Found ${searchResults?.length || 0} relevant chunks for context`);

    // Prepare messages for OpenAI chat
    const systemMessage = {
      role: 'system',
      content: `Você é o O.R.I.Ö.N, um assistente de IA futurista e inteligente. Responda de forma útil e precisa com base no contexto fornecido dos documentos do usuário.

CONTEXTO RELEVANTE DOS DOCUMENTOS:
${relevantContext}

Se a pergunta não puder ser respondida com o contexto fornecido, informe isso claramente e ofereça ajuda geral. Sempre mantenha um tom profissional mas amigável.`
    };

    const messages = [
      systemMessage,
      ...conversation_context,
      { role: 'user', content: query }
    ];

    // Generate response using OpenAI
    const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
        stream: false,
      }),
    });

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API failed: ${chatResponse.status}`);
    }

    const chatData = await chatResponse.json();
    const assistantResponse = chatData.choices[0].message.content;

    console.log('Generated RAG response');

    return new Response(
      JSON.stringify({
        success: true,
        response: assistantResponse,
        context_chunks_used: searchResults?.length || 0,
        sources: searchResults?.map(result => ({
          document_id: result.document_id,
          document_title: result.document_title,
          similarity_score: result.similarity_score
        })) || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('RAG chat error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});