import { OpenAIStream, StreamingTextResponse } from "ai";
import OpenAI from "openai";

// Crie um cliente OpenAI (compatível com Edge)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Defina o runtime para 'edge' para performance máxima
export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Peça à OpenAI por uma resposta em streaming
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo", // Ou o modelo de sua preferência
      stream: true,
      messages,
    });

    const stream = OpenAIStream(response);
    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error("[CHAT_API_ERROR]", error);
    return new Response("Ocorreu um erro ao processar sua solicitação.", {
      status: 500,
    });
  }
}
