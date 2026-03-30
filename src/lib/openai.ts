import OpenAI from 'openai';
import type { Transcription } from '@/types';
import { env } from '@/lib/env';

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export async function transcribeAudio(file: File): Promise<Transcription> {
  const transcription = await openai.audio.transcriptions.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    file: file as any,
    model: 'whisper-1',
    response_format: 'verbose_json',
    timestamp_granularities: ['word', 'segment'],
  });

  const response = transcription as unknown as {
    text: string;
    language: string;
    duration: number;
    segments: Array<{
      id: number;
      text: string;
      start: number;
      end: number;
      words?: Array<{ word: string; start: number; end: number }>;
    }>;
    words: Array<{ word: string; start: number; end: number }>;
  };

  return {
    text: response.text,
    language: response.language,
    duration: response.duration,
    segments: (response.segments || []).map((seg) => ({
      id: seg.id,
      text: seg.text.trim(),
      start: seg.start,
      end: seg.end,
      words: (seg.words || []).map((w) => ({
        text: w.word,
        start: w.start,
        end: w.end,
      })),
    })),
    words: (response.words || []).map((w) => ({
      text: w.word,
      start: w.start,
      end: w.end,
    })),
  };
}
