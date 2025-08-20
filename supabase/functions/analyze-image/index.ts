// If running in Deno, ensure your editor supports Deno types (e.g., enable Deno extension in VSCode).
// If running in Node.js, use a compatible HTTP server like Express:
import bodyParser from "body-parser";
import express from "express";

// analyze-image/index.ts
// Função para analisar imagens usando OpenAI GPT-4 Vision

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

// Express version of the handler
const app = express();
app.use(bodyParser.json());

app.options("*", (req, res) => {
  res.set(corsHeaders).sendStatus(204);
});

app.post("/", async (req, res) => {
  try {
    const { image, filename } = req.body;

    if (!image) {
      throw new Error("Imagem não fornecida");
    }

    const openAIApiKey = process.env.OPENAI_API_KEY;
    if (!openAIApiKey) {
      throw new Error("OpenAI API key não configurada");
    }

    console.log("Analyzing image:", filename);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analise esta imagem e descreva o que você vê de forma clara e objetiva. Se houver texto, transcreva-o. Se for um gráfico ou diagrama, explique os dados principais. Responda em português brasileiro.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${image}`,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `OpenAI API error: ${error.error?.message || "Erro desconhecido"}`
      );
    }

    const data = await response.json();
    const analysis =
      data.choices[0]?.message?.content || "Não foi possível analisar a imagem";

    console.log("Image analysis completed successfully");

    res.set(corsHeaders).json({
      analysis,
      filename,
      success: true,
    });
  } catch (error: unknown) {
    console.error("Error in analyze-image function:", error);

    const message = error instanceof Error ? error.message : String(error);

    res.status(500).set(corsHeaders).json({
      error: message,
      analysis:
        "Desculpe, não foi possível analisar esta imagem no momento. Tente novamente.",
      success: false,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
