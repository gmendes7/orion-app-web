import { http } from '@/lib/http';
import { supabase } from '@/integrations/supabase/client';

// Types for API responses
export type WeatherData = {
  city: string;
  country?: string;
  temperature: number;
  description: string;
  humidity: number;
  windSpeed?: number;
  pressure?: number;
  visibility?: number;
};

export type NewsData = {
  totalResults: number;
  articles: Array<{
    title: string;
    description?: string;
    url: string;
    urlToImage?: string;
    publishedAt: string;
    source: string;
    author?: string;
  }>;
};

export type SearchData = {
  query: string;
  answer: string;
  timestamp: string;
};

// Supabase Edge Function clients with improved error handling
export const WeatherAPI = {
  async get(city: string, type: 'current' | 'forecast' = 'current'): Promise<WeatherData> {
    try {
      const { data, error } = await supabase.functions.invoke('weather-api', {
        body: { city, type }
      });

      if (error) {
        throw new Error(`Weather API Error: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Weather API call failed:', error);
      throw error;
    }
  },

  async getByCoords(lat: number, lon: number, type: 'current' | 'forecast' = 'current'): Promise<WeatherData> {
    try {
      const { data, error } = await supabase.functions.invoke('weather-api', {
        body: { lat, lon, type }
      });

      if (error) {
        throw new Error(`Weather API Error: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Weather API call failed:', error);
      throw error;
    }
  }
};

export const NewsAPI = {
  async search(query: string, language = 'pt', pageSize = 10): Promise<NewsData> {
    try {
      const { data, error } = await supabase.functions.invoke('news-api', {
        body: { query, language, pageSize }
      });

      if (error) {
        throw new Error(`News API Error: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('News API call failed:', error);
      throw error;
    }
  },

  async getTopHeadlines(country = 'br', pageSize = 10): Promise<NewsData> {
    try {
      const { data, error } = await supabase.functions.invoke('news-api', {
        body: { query: 'general', country, pageSize }
      });

      if (error) {
        throw new Error(`News API Error: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('News API call failed:', error);
      throw error;
    }
  }
};

export const SearchAPI = {
  async search(query: string): Promise<SearchData> {
    try {
      const { data, error } = await supabase.functions.invoke('web-search', {
        body: { query }
      });

      if (error) {
        throw new Error(`Search API Error: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Search API call failed:', error);
      throw error;
    }
  }
};

export const ImageAPI = {
  async analyze(base64Image: string, filename: string): Promise<{ analysis: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('analyze-image', {
        body: { image: base64Image, filename }
      });

      if (error) {
        throw new Error(`Image Analysis Error: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Image analysis failed:', error);
      throw error;
    }
  }
};