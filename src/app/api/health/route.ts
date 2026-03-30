import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { env, hasOpenAIKey, hasAnthropicKey, hasYouTubeKey, isDemoMode } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET() {
  let ffmpegAvailable = false;
  try {
    execSync('which ffmpeg', { stdio: 'ignore' });
    ffmpegAvailable = true;
  } catch {
    // ffmpeg not found, will use @ffmpeg-installer
    try {
      const installer = require(/* webpackIgnore: true */ '@ffmpeg-installer/ffmpeg');
      ffmpegAvailable = !!installer.path;
    } catch { /* noop */ }
  }

  return NextResponse.json({
    status: 'ok',
    version: '1.0.0',
    uptime: Math.round(process.uptime()),
    demoMode: isDemoMode(),
    services: {
      ffmpeg: ffmpegAvailable,
      openai: hasOpenAIKey(),
      anthropic: hasAnthropicKey(),
      imageGen: env.IMAGE_PROVIDER !== 'placeholder',
      youtube: hasYouTubeKey(),
    },
    node: process.version,
    platform: process.platform,
  });
}
