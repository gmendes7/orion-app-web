import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Allowed voice IDs whitelist — prevents abuse via arbitrary voice access
const ALLOWED_VOICES = new Set([
  "FGY2WhTYpPnrIDTdsKH5", // Laura (default)
  "EXAVITQu4vr4xnSDxMaL", // Sarah
  "JBFqnCBsd6RMkjVDRZzb", // George
  "CwhRBWXzGAHq8TQ4Fs17", // Roger
  "IKne3meq5aSn9XLyUdCD", // Charlie
  "onwK4e9ZLuTAKqWW03F9", // Daniel
  "pFZP5JQG7iQjIQuC4Bku", // Lily
]);

const MAX_TEXT_LENGTH = 1000;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate content type
    const contentType = req.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return new Response(
        JSON.stringify({ error: "Content-Type deve ser application/json" }),
        { status: 415, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { text, voiceId } = body;
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

    if (!ELEVENLABS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ELEVENLABS_API_KEY não configurada", fallback: true }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Strict Input Validation ──
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Texto não fornecido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (text.length > 5000) {
      return new Response(
        JSON.stringify({ error: "Texto excede limite de 5000 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate voice ID against whitelist
    const selectedVoiceId = voiceId && ALLOWED_VOICES.has(voiceId) ? voiceId : "FGY2WhTYpPnrIDTdsKH5";

    // Sanitize and truncate text
    const sanitizedText = text
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars
      .substring(0, MAX_TEXT_LENGTH)
      .trim();

    if (!sanitizedText) {
      return new Response(
        JSON.stringify({ error: "Texto inválido após sanitização" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`🔊 TTS: ${sanitizedText.length} chars, voice: ${selectedVoiceId.substring(0, 8)}...`);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: sanitizedText,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.4,
            use_speaker_boost: true,
            speed: 1.0,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ ElevenLabs [${response.status}]:`, errorText.substring(0, 200));
      
      return new Response(
        JSON.stringify({ error: `ElevenLabs: ${response.status}`, fallback: true }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    
    // Validate audio response
    if (audioBuffer.byteLength === 0 || audioBuffer.byteLength > 10_000_000) {
      return new Response(
        JSON.stringify({ error: "Resposta de áudio inválida", fallback: true }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const audioBase64 = base64Encode(audioBuffer);

    return new Response(
      JSON.stringify({ audioContent: audioBase64 }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "private, max-age=3600",
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  } catch (error) {
    console.error("❌ elevenlabs-tts:", (error as Error).message);
    return new Response(
      JSON.stringify({ error: "Erro ao gerar áudio", fallback: true }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});