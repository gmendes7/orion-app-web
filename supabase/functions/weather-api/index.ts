import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function for safe fetch with timeout and retries
async function safeFetch(url: string, options: RequestInit = {}, timeoutMs = 8000, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`HTTP ${response.status} - ${response.statusText} - ${body.slice(0, 300)}`);
      }

      return response;
    } catch (error) {
      clearTimeout(timeout);
      if (attempt === retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    }
  }
  throw new Error("Max retries exceeded");
}

interface WeatherRequest {
  city?: string;
  lat?: number;
  lon?: number;
  type?: "current" | "forecast";
  days?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { city, lat, lon, type = "current", days = 5 }: WeatherRequest = await req.json();

    const apiKey = Deno.env.get("OPENWEATHER_API_KEY");
    if (!apiKey) {
      throw new Error("OPENWEATHER_API_KEY nÃ£o configurada");
    }

    let url = "";
    const baseUrl = "https://api.openweathermap.org/data/2.5";

    // Determinar coordenadas ou cidade
    if (lat && lon) {
      url = `${baseUrl}/${type === "forecast" ? "forecast" : "weather"}?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=pt_br`;
    } else if (city) {
      url = `${baseUrl}/${type === "forecast" ? "forecast" : "weather"}?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=pt_br`;
    } else {
      throw new Error("Ã‰ necessÃ¡rio fornecer cidade ou coordenadas (lat, lon)");
    }

    console.log(`ðŸŒ¤ï¸ Buscando ${type} para: ${type || `${lat}, ${lon}`}`);

    const response = await safeFetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro da API: ${errorData.message || response.status}`);
    }

    const data = await response.json();

    // Formatar resposta baseada no tipo
    let result;

    if (type === "current") {
      result = {
        location: {
          name: data.name,
          country: data.sys.country,
          coordinates: data.coord,
        },
        current: {
          temperature: Math.round(data.main.temp),
          feels_like: Math.round(data.main.feels_like),
          humidity: data.main.humidity,
          pressure: data.main.pressure,
          description: data.weather[0].description,
          icon: data.weather[0].icon,
          wind: {
            speed: data.wind.speed,
            direction: data.wind.deg,
          },
          visibility: data.visibility,
          clouds: data.clouds.all,
        },
        sunrise: new Date(data.sys.sunrise * 1000).toLocaleTimeString("pt-BR"),
        sunset: new Date(data.sys.sunset * 1000).toLocaleTimeString("pt-BR"),
        timestamp: new Date().toISOString(),
      };
    } else {
      // Forecast
      const forecasts = data.list.slice(0, days * 8).map((item: any) => ({
        date: new Date(item.dt * 1000).toLocaleDateString("pt-BR"),
        time: new Date(item.dt * 1000).toLocaleTimeString("pt-BR"),
        temperature: Math.round(item.main.temp),
        feels_like: Math.round(item.main.feels_like),
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        humidity: item.main.humidity,
        wind_speed: item.wind.speed,
        clouds: item.clouds.all,
      }));

      result = {
        location: {
          name: data.city.name,
          country: data.city.country,
          coordinates: data.city.coord,
        },
        forecast: forecasts,
        timestamp: new Date().toISOString(),
      };
    }

    console.log("âœ… Dados meteorolÃ³gicos obtidos com sucesso");

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("âŒ Erro na funÃ§Ã£o weather-api:", error);

    return new Response(
      JSON.stringify({
        error: "Erro ao obter dados meteorolÃ³gicos",
        details: error.message,
        fallback:
          "NÃ£o foi possÃ­vel obter os dados meteorolÃ³gicos no momento. Verifique se a cidade foi digitada corretamente.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
