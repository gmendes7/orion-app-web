import z from "zod";

const envSchema = z.object({
  VITE_NODE_ENV: z
    .enum(["development", "production", "test"])
    .catch("development"),
  VITE_SUPABASE_PROJECT_ID: z.string(),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string(),
  VITE_SUPABASE_URL: z.string(),
});

export const viteEnv = envSchema.parse(import.meta.env);
