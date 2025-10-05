import { useToast } from "@/integrations/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  formatNeonResponse,
  safeCommandExecution,
} from "@/utils/safeCommandExecution";
import { useCallback } from "react";

export const useChatCommands = () => {
  const { toast } = useToast();

  const handleWebSearch = useCallback(async (query: string) => {
    const result = await safeCommandExecution(
      async () => {
        const { data, error } = await supabase.functions.invoke("web-search", {
          body: { query, type: "search", count: 5 },
        });
        if (error) throw error;
        return `🔍 **Resultados da Pesquisa: "${query}"** ✨\n\n${
          data.answer
        }\n\n${
          data.relatedQuestions?.length > 0
            ? `**Perguntas relacionadas:**\n${data.relatedQuestions
                .map((q: string) => `• ${q}`)
                .join("\n")}`
            : ""
        }`;
      },
      "🔍 Não consegui encontrar resultados agora. Tente reformular sua pergunta ou aguarde um momento. ✨",
      "search"
    );
    return formatNeonResponse(result.message, !result.success);
  }, []);

  const handleWeatherQuery = useCallback(async (city: string) => {
    const result = await safeCommandExecution(
      async () => {
        const { data, error } = await supabase.functions.invoke("weather-api", {
          body: { city, type: "current" },
        });
        if (error) throw error;
        const weather = data.current;
        return (
          `🌤️ **Clima em ${data.location.name}, ${data.location.country}** ✨\n\n` +
          `**Temperatura:** ${weather.temperature}°C (sensação: ${weather.feels_like}°C)\n` +
          `**Condição:** ${weather.description}\n` +
          `**Umidade:** ${weather.humidity}%\n` +
          `**Vento:** ${weather.wind.speed} m/s\n` +
          `**Pressão:** ${weather.pressure} hPa\n\n` +
          `🌅 **Nascer do sol:** ${data.sunrise}\n` +
          `🌇 **Pôr do sol:** ${data.sunset}`
        );
      },
      "🌤️ Desculpe, não consegui acessar a previsão do tempo agora. Mas posso tentar de novo mais tarde! ☀️",
      "weather"
    );
    return formatNeonResponse(result.message, !result.success);
  }, []);

  const handleNewsQuery = useCallback(async (query?: string) => {
    const result = await safeCommandExecution(
      async () => {
        const { data, error } = await supabase.functions.invoke("news-api", {
          body: {
            query,
            category: query ? undefined : "general",
            pageSize: 5,
          },
        });
        if (error) throw error;
        const maybeData: unknown = data;
        let articles: unknown[] = [];
        if (
          maybeData &&
          typeof maybeData === "object" &&
          Object.prototype.hasOwnProperty.call(maybeData, "articles")
        ) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          articles = (maybeData as any).articles?.slice(0, 5) || [];
        }
        interface Article {
          title?: string;
          description?: string;
          source?: { name?: string };
          publishedAt?: string;
        }
        return (
          `📰 **${
            query ? `Notícias sobre "${query}"` : "Principais Notícias"
          }** ✨\n\n` +
          (articles as Article[])
            .map(
              (article, index) =>
                `**${index + 1}. ${article.title || "(sem título)"}**\n` +
                `${article.description || "(sem descrição)"}\n` +
                `*Fonte: ${article.source?.name || "desconhecida"} • ${
                  article.publishedAt || ""
                }*\n` +
                `Ler mais`
            )
            .join("\n\n")
        );
      },
      "📰 No momento não consegui buscar as notícias. Tente novamente em alguns minutos. 📺",
      "news"
    );
    return formatNeonResponse(result.message, !result.success);
  }, []);

  const detectAndExecuteCommands = useCallback(
    async (text: string) => {
      const lowerText = text.toLowerCase();

      if (
        lowerText.includes("pesquisar") ||
        lowerText.includes("buscar na internet") ||
        lowerText.includes("google")
      ) {
        const query = text
          .replace(/(pesquisar|buscar na internet|google)/i, "")
          .trim();
        if (query) return await handleWebSearch(query);
      }

      if (lowerText.includes("clima") || lowerText.includes("tempo")) {
        const city = text.replace(/(clima|tempo)\s*(de|em|da)?\s*/i, "").trim();
        return await handleWeatherQuery(city || "São Paulo");
      }

      if (lowerText.includes("notícias") || lowerText.includes("news")) {
        const query = text
          .replace(/(notícias|news)\s*(sobre|de)?\s*/i, "")
          .trim();
        return await handleNewsQuery(query);
      }

      return null;
    },
    [handleWebSearch, handleWeatherQuery, handleNewsQuery]
  );

  return { detectAndExecuteCommands };
};
