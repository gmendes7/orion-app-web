import z from "zod";

const envSchema = z.object({
  CHATGPT_API_KEY: z.string(),
  OPENAI_API_KEY: z.string(),
});

export const env = envSchema.parse(process.env);
