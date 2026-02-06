import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DocumentChunk {
  chunk_index: number;
  content: string;
}

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

    const { title, content, source_url } = await req.json();
    
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

    console.log('Processing document for user:', user.id);

    // Create document record
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        title,
        source_url
      })
      .select()
      .single();

    if (docError) {
      console.error('Document creation error:', docError);
      return new Response(
        JSON.stringify({ error: 'Failed to create document' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Split content into chunks (approximately 1000 characters each)
    const chunks = splitIntoChunks(content, 1000);
    console.log(`Split document into ${chunks.length} chunks`);

    // Generate embeddings for each chunk
    const chunkPromises = chunks.map(async (chunk, index) => {
      try {
        // Generate embedding using OpenAI
        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: chunk.content,
          }),
        });

        if (!embeddingResponse.ok) {
          const errorText = await embeddingResponse.text();
          console.error(`Embedding API error for chunk ${index}:`, errorText);
          throw new Error(`Embedding API failed: ${embeddingResponse.status}`);
        }

        const embeddingData = await embeddingResponse.json();
        const embedding = embeddingData.data[0].embedding;

        // Insert chunk with embedding
        const { error: chunkError } = await supabase
          .from('document_chunks')
          .insert({
            document_id: document.id,
            chunk_index: index,
            content: chunk.content,
            embedding: embedding
          });

        if (chunkError) {
          console.error(`Chunk insertion error for chunk ${index}:`, chunkError);
          throw chunkError;
        }

        console.log(`Successfully processed chunk ${index + 1}/${chunks.length}`);
        return { success: true, index };
      } catch (error) {
        console.error(`Error processing chunk ${index}:`, error);
        return { success: false, index, error: (error as Error).message };
      }
    });

    const results = await Promise.all(chunkPromises);
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.length - successCount;

    console.log(`Document processing complete. Success: ${successCount}, Failed: ${failedCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        document_id: document.id,
        chunks_processed: successCount,
        chunks_failed: failedCount,
        total_chunks: chunks.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Process document error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function splitIntoChunks(text: string, maxChunkSize: number): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  const paragraphs = text.split(/\n\s*\n/);
  
  let currentChunk = '';
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length <= maxChunkSize) {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    } else {
      if (currentChunk) {
        chunks.push({
          chunk_index: chunkIndex,
          content: currentChunk.trim()
        });
        chunkIndex++;
      }
      
      // If paragraph is too long, split it further
      if (paragraph.length > maxChunkSize) {
        const sentences = paragraph.split(/[.!?]+/);
        let sentenceChunk = '';
        
        for (const sentence of sentences) {
          if (sentenceChunk.length + sentence.length <= maxChunkSize) {
            sentenceChunk += sentence + '.';
          } else {
            if (sentenceChunk) {
              chunks.push({
                chunk_index: chunkIndex,
                content: sentenceChunk.trim()
              });
              chunkIndex++;
            }
            sentenceChunk = sentence + '.';
          }
        }
        
        if (sentenceChunk) {
          currentChunk = sentenceChunk;
        } else {
          currentChunk = '';
        }
      } else {
        currentChunk = paragraph;
      }
    }
  }

  if (currentChunk) {
    chunks.push({
      chunk_index: chunkIndex,
      content: currentChunk.trim()
    });
  }

  return chunks;
}