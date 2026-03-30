import OpenAI from 'openai';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import type { IllustrationStyle } from '@/types';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';

type ImageProvider = 'dalle' | 'stability' | 'placeholder';

function getProvider(): ImageProvider {
  const configured = env.IMAGE_PROVIDER;
  if (configured && ['dalle', 'stability', 'placeholder'].includes(configured)) {
    return configured;
  }
  // Auto-detect: usar DALL-E se tiver key OpenAI, senão placeholder
  if (env.OPENAI_API_KEY && env.OPENAI_API_KEY !== 'sk-xxx') {
    return 'dalle';
  }
  return 'placeholder';
}

const STYLE_SUFFIXES: Record<IllustrationStyle, string> = {
  flat: 'flat design, vector illustration, clean shapes, minimal colors, modern, no text',
  realistic: 'photorealistic, high detail, professional photography style, no text',
  cartoon: 'cartoon style, comic book illustration, bold outlines, vibrant colors, no text',
  minimalist: 'minimalist line art, simple shapes, monochrome with one accent color, no text',
  watercolor: 'watercolor painting style, soft edges, artistic, flowing colors, no text',
  '3d-render': '3D render, isometric view, glossy materials, soft lighting, no text',
  custom: 'digital illustration, professional quality, no text',
};

/**
 * Gera uma imagem a partir de um prompt
 * Retorna a URL pública da imagem salva
 */
export async function generateImage(
  prompt: string,
  style: IllustrationStyle,
  index: number
): Promise<string> {
  const provider = getProvider();

  const outputDir = path.join(process.cwd(), 'public', 'uploads', 'illustrations');
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
  }

  const filename = `ill_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 6)}.png`;
  const filepath = path.join(outputDir, filename);
  const publicUrl = `/uploads/illustrations/${filename}`;

  const fullPrompt = `${prompt}. Style: ${STYLE_SUFFIXES[style]}. No text or letters in the image. Transparent or clean background.`;

  switch (provider) {
    case 'dalle':
      return generateWithDalle(fullPrompt, filepath, publicUrl);
    case 'stability':
      return generateWithStability(fullPrompt, filepath, publicUrl);
    case 'placeholder':
    default:
      return generatePlaceholder(prompt, style, index);
  }
}

async function generateWithDalle(prompt: string, filepath: string, publicUrl: string): Promise<string> {
  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt.slice(0, 4000), // DALL-E 3 limit
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      response_format: 'b64_json',
    });

    const imageData = response.data?.[0]?.b64_json;
    if (!imageData) throw new Error('No image data returned');

    const buffer = Buffer.from(imageData, 'base64');
    await writeFile(filepath, buffer);

    return publicUrl;
  } catch (error) {
    logger.error('DALL-E generation failed', { error: error instanceof Error ? error.message : String(error) });
    // Fallback para placeholder
    return generatePlaceholder(prompt, 'flat', 0);
  }
}

async function generateWithStability(prompt: string, filepath: string, publicUrl: string): Promise<string> {
  const apiKey = env.STABILITY_API_KEY;
  if (!apiKey) return generatePlaceholder(prompt, 'flat', 0);

  try {
    const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        text_prompts: [{ text: prompt, weight: 1 }],
        cfg_scale: 7,
        height: 1024,
        width: 1024,
        steps: 30,
        samples: 1,
      }),
    });

    if (!response.ok) throw new Error(`Stability API error: ${response.status}`);

    const data = await response.json();
    const imageData = data.artifacts?.[0]?.base64;
    if (!imageData) throw new Error('No image data returned');

    const buffer = Buffer.from(imageData, 'base64');
    await writeFile(filepath, buffer);

    return publicUrl;
  } catch (error) {
    logger.error('Stability generation failed', { error: error instanceof Error ? error.message : String(error) });
    return generatePlaceholder(prompt, 'flat', 0);
  }
}

function generatePlaceholder(prompt: string, style: IllustrationStyle, index: number): string {
  return `/api/placeholder/illustration/${index}?style=${style}&prompt=${encodeURIComponent(prompt.slice(0, 50))}`;
}

/**
 * Regenera uma ilustração com novo prompt
 */
export async function regenerateImage(
  prompt: string,
  style: IllustrationStyle
): Promise<string> {
  return generateImage(prompt, style, Date.now());
}
