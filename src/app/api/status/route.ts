import { NextResponse } from 'next/server';
import { env, isDemoMode, hasOpenAIKey, hasAnthropicKey, hasYouTubeKey } from '@/lib/env';

export async function GET() {
  return NextResponse.json({
    demoMode: isDemoMode(),
    services: {
      whisper: hasOpenAIKey(),
      claude: hasAnthropicKey(),
      imageGen: env.IMAGE_PROVIDER !== 'placeholder' && hasOpenAIKey(),
      youtube: hasYouTubeKey(),
    },
  });
}
