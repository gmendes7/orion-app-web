// Use Deno's built-in serve to avoid remote std import resolution issues
// (Deno provides a global Deno.serve in newer runtime versions)
import "https://deno.land/x/xhr@0.1.0/mod.ts";
// Use Deno's built-in serve (no std http/server import required)

// Minimal Deno env type for TypeScript to recognize Deno.env.get in this file
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  // Minimal typing for Deno.serve used in this function
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
      // If this was the last attempt, rethrow the error to be handled by caller
      if (attempt === retries) {
        throw error;
      }
      // Otherwise, wait a bit and retry (simple backoff)
      await new Promise((res) => setTimeout(res, 200 * (attempt + 1)));
    }
  }

  // Should not reach here, but satisfy function return expectations
  throw new Error('Failed to fetch after retries');
}

interface WeatherRequest {
  city?: string;
  lat?: number;
  lon?: number;
  type?: 'current' | 'forecast';
  days?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { city, lat, lon, type = 'current', days = 5 }: WeatherRequest = await req.json();

    const apiKey = Deno.env.get('OPENWEATHER_API_KEY');
    if (!apiKey) {
      throw new Error('OPENWEATHER_API_KEY não configurada');
    }

    let url = '';
    const baseUrl = 'https://api.openweathermap.org/data/2.5';

    // Determinar coordenadas ou cidade
    if (lat && lon) {
      url = `${baseUrl}/${type === 'forecast' ? 'forecast' : 'weather'}?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=pt_br`;
    } else if (city) {
      url = `${baseUrl}/${type === 'forecast' ? 'forecast' : 'weather'}?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=pt_br`;
    } else {
      throw new Error('É necessário fornecer cidade ou coordenadas (lat, lon)');
    }

    console.log(`🌤️ Buscando ${type} para: ${city || `${lat}, ${lon}`}`);

    const response = await safeFetch(url);

    // safeFetch may throw on errors; guard against a possibly undefined response and extract a sensible message
    if (!response || !response.ok) {
      let errorMsg = 'unknown';
      try {
        const errorData: unknown = response ? await response.json() : null;
        if (errorData && typeof errorData === 'object') {
          const obj = errorData as Record<string, unknown>;
          if (typeof obj.message === 'string') {
            errorMsg = obj.message;
          } else if (typeof obj.error === 'string') {
            errorMsg = obj.error;
          } else {
            errorMsg = response ? String(response.status) : 'unknown';
          }
        } else {
          errorMsg = response ? String(response.status) : 'unknown';
        }
      } catch {
        errorMsg = response ? String(response.status) : 'unknown';
      }
      throw new Error(`Erro da API: ${errorMsg}`);
    }

    const data = await response.json();
    
    // Formatar resposta baseada no tipo
    let result;
    
    if (type === 'current') {
      result = {
        location: {
          name: data.name,
          country: data.sys.country,
          coordinates: data.coord
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
            direction: data.wind.deg
          },
          visibility: data.visibility,
          clouds: data.clouds.all
        },
        sunrise: new Date(data.sys.sunrise * 1000).toLocaleTimeString('pt-BR'),
        sunset: new Date(data.sys.sunset * 1000).toLocaleTimeString('pt-BR'),
        timestamp: new Date().toISOString()
      };
    } else {
      // Forecast
      const forecasts = data.list.slice(0, days * 8).map((item: unknown) => {
        const it = item as Record<string, unknown>;
        const dt = typeof it.dt === 'number' ? it.dt : 0;
        const main = (it.main as Record<string, unknown>) || {};
        const weatherArr = Array.isArray(it.weather) ? it.weather : [];
        const wind = (it.wind as Record<string, unknown>) || {};
        const clouds = (it.clouds as Record<string, unknown>) || {};

        return {
          date: new Date(dt * 1000).toLocaleDateString('pt-BR'),
          time: new Date(dt * 1000).toLocaleTimeString('pt-BR'),
          temperature: Math.round(Number(main.temp ?? 0)),
          feels_like: Math.round(Number(main.feels_like ?? 0)),
          description: String((weatherArr[0] && (weatherArr[0] as Record<string, unknown>).description) ?? ''),
          icon: String((weatherArr[0] && (weatherArr[0] as Record<string, unknown>).icon) ?? ''),
          humidity: Number(main.humidity ?? 0),
          wind_speed: Number(wind.speed ?? 0),
          clouds: Number(clouds.all ?? 0),
        };
      });

      result = {
        location: {
          name: data.city.name,
          country: data.city.country,
          coordinates: data.city.coord
        },
        forecast: forecasts,
        timestamp: new Date().toISOString()
      };
    }

    console.log('✅ Dados meteorológicos obtidos com sucesso');

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro na função weather-api:', error);
    
    return new Response(JSON.stringify({
      error: 'Erro ao obter dados meteorológicos',
      details: error.message,
      fallback: 'Não foi possível obter os dados meteorológicos no momento. Verifique se a cidade foi digitada corretamente, e se você possui uma conexão com a internet estável.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})