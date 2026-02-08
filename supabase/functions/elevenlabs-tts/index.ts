import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { text, voiceId } = await req.json();
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY não configurada");
    }

    if (!text || text.trim().length === 0) {
      throw new Error("Texto não fornecido");
    }

    // Limitar texto para evitar custos excessivos (max ~500 chars por request)
    const trimmedText = text.substring(0, 1000);

    console.log(`🔊 ElevenLabs TTS - Gerando áudio para: "${trimmedText.substring(0, 50)}..."`);
    console.log(`🎤 Voice ID: ${voiceId || "FGY2WhTYpPnrIDTdsKH5 (Laura)"}`);

    const selectedVoiceId = voiceId || "FGY2WhTYpPnrIDTdsKH5"; // Laura - voz feminina natural

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: trimmedText,
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
      console.error(`❌ ElevenLabs API Error [${response.status}]:`, errorText);
      throw new Error(`ElevenLabs API Error: ${response.status} - ${errorText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const audioBase64 = base64Encode(audioBuffer);

    console.log(`✅ Áudio gerado com sucesso (${audioBuffer.byteLength} bytes)`);

    return new Response(
      JSON.stringify({ audioContent: audioBase64 }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Erro na função elevenlabs-tts:", error);
    return new Response(
      JSON.stringify({
        error: (error as Error).message || "Erro ao gerar áudio",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
