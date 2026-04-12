import { z } from "zod";

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  STUDENTREACH_DATABASE_URL: z.string().min(1).optional(),
  STUDENTREACH_OPENALEX_EMAIL: z.string().email().optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().min(1).optional(),
  OPENAI_EMBEDDING_MODEL: z.string().min(1).default("text-embedding-3-small"),
  STUDENTREACH_AI_CACHE_TTL_HOURS: z.coerce.number().int().positive().default(168),
  STUDENTREACH_ENABLE_AI_FALLBACK: z.coerce.boolean().default(true),
  STUDENTREACH_DEMO_MODE: z.coerce.boolean().default(true),
});

let cachedEnv: z.infer<typeof serverEnvSchema> | null = null;

export function getServerEnv() {
  if (!cachedEnv) {
    cachedEnv = serverEnvSchema.parse(process.env);
  }

  return cachedEnv;
}

export function hasSupabaseServerEnv() {
  const env = getServerEnv();
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL &&
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      env.SUPABASE_SERVICE_ROLE_KEY &&
      env.STUDENTREACH_DATABASE_URL,
  );
}

export function hasOpenAIEnv() {
  const env = getServerEnv();
  return Boolean(env.OPENAI_API_KEY && env.OPENAI_MODEL);
}
