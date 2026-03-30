import { z } from 'zod';

const envSchema = z.object({
  // API Keys
  OPENAI_API_KEY: z.string().optional().default(''),
  ANTHROPIC_API_KEY: z.string().optional().default(''),
  STABILITY_API_KEY: z.string().optional().default(''),
  YOUTUBE_API_KEY: z.string().optional().default(''),

  // Image provider
  IMAGE_PROVIDER: z
    .enum(['dalle', 'stability', 'placeholder'])
    .optional()
    .default('placeholder'),

  // Database
  DATABASE_URL: z.string().optional().default('file:./data/projects.db'),

  // Directories
  UPLOAD_DIR: z.string().optional().default('./public/uploads'),
  OUTPUT_DIR: z.string().optional().default('./public/outputs'),

  // App config
  NEXT_PUBLIC_APP_URL: z.string().optional().default('http://localhost:3000'),
  NEXT_PUBLIC_MAX_VIDEO_DURATION: z.coerce.number().optional().default(600),
  NEXT_PUBLIC_MAX_FILE_SIZE: z.coerce.number().optional().default(500_000_000),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional().default('info'),
  NODE_ENV: z.string().optional().default('development'),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    for (const [key, errors] of Object.entries(result.error.flatten().fieldErrors)) {
      console.error(`  ${key}: ${errors?.join(', ')}`);
    }
    // Don't crash — use defaults
    return envSchema.parse({});
  }
  return result.data;
}

export const env = loadEnv();

// Helper checks using validated env
export function hasOpenAIKey(): boolean {
  return env.OPENAI_API_KEY.length > 10 && env.OPENAI_API_KEY !== 'sk-xxx';
}

export function hasAnthropicKey(): boolean {
  return env.ANTHROPIC_API_KEY.length > 10 && env.ANTHROPIC_API_KEY !== 'sk-ant-xxx';
}

export function hasYouTubeKey(): boolean {
  return env.YOUTUBE_API_KEY.length > 5;
}

export function isDemoMode(): boolean {
  return !hasOpenAIKey() || !hasAnthropicKey();
}
