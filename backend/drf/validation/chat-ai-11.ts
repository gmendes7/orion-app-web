import type { NextApiRequest, NextApiResponse } from "next";

// Define um tipo para a resposta de erro esperada
type ErrorResponse = {
  error: {
    message: string;
    type?: string;
    code?: string | number;
  };
};

// Define um tipo para a resposta de sucesso
type SuccessResponse = {
  reply: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  // 1. Verificar o método HTTP correto
  if (req.method !== "POST") {
    console.warn(`[API CHAT] Método não permitido: ${req.method}`);
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      error: {
        message: `Método ${req.method} não permitido`,
        type: "method_not_allowed",
      },
    });
  }

  // 2. Verificar a Chave de API no servidor
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error(
      "[API CHAT] CRÍTICO: A variável de ambiente OPENAI_API_KEY não está configurada no servidor."
    );
    // Envia um erro genérico para o cliente, mas registra o problema específico no servidor.
    return res.status(500).json({
      error: {
        message:
          "Erro Interno do Servidor: O serviço de IA não está configurado.",
        type: "server_configuration_error",
      },
    });
  }

  // 3. Fazer o parse e validar o corpo da requisição
  const { message } = req.body;

  if (!message || typeof message !== "string") {
    console.log(
      '[API CHAT] Requisição Inválida: O campo "message" está ausente ou não é uma string.'
    );
    return res.status(400).json({
      error: {
        message:
          'Requisição Inválida: O campo "message" é obrigatório e deve ser uma string.',
        type: "invalid_request_body",
      },
    });
  }

  // 4. Chamar a API externa (OpenAI) dentro de um bloco try...catch
  try {
    console.log(
      `[API CHAT] Chamando a OpenAI com a mensagem: "${message.substring(
        0,
        50
      )}..."`
    );

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", // Ou o modelo que você estiver usando
        messages: [{ role: "user", content: message }],
        stream: false, // Para este exemplo, aguardaremos a resposta completa
      }),
    });

    // 5. Lidar com respostas não bem-sucedidas da API externa
    if (!response.ok) {
      const errorData = await response.json();
      console.error("[API CHAT] Erro da API da OpenAI:", {
        status: response.status,
        data: errorData,
      });

      const statusCode = response.status === 401 ? 401 : 500;
      const errorMessage =
        response.status === 401
          ? "Não autorizado: Chave de API inválida."
          : "Falha ao obter uma resposta do serviço de IA.";

      return res.status(statusCode).json({
        error: {
          message: errorMessage,
          type: "openai_api_error",
          code: errorData.error?.code || response.status,
        },
      });
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content?.trim();

    if (!reply) {
      console.error(
        "[API CHAT] Formato de resposta da OpenAI inesperado:",
        data
      );
      throw new Error(
        "A resposta da IA estava vazia ou em um formato inesperado."
      );
    }

    console.log(`[API CHAT] Resposta da OpenAI recebida com sucesso.`);
    // 6. Enviar a resposta de sucesso de volta para o frontend
    return res.status(200).json({ reply });
  } catch (error: any) {
    // 7. Lidar com erros de rede ou qualquer outra exceção inesperada
    console.error("[API CHAT] Exceção não tratada:", error);

    return res.status(500).json({
      error: {
        message: "Ocorreu um erro inesperado no servidor.",
        type: "unhandled_exception",
      },
    });
  }
}
