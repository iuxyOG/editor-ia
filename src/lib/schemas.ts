import { z } from 'zod';

// === Pipeline ===
export const pipelineStartSchema = z.object({
  videoId: z.string().min(1, 'videoId é obrigatório'),
  videoUrl: z.string().min(1, 'videoUrl é obrigatório'),
  customPrompt: z.string().optional(),
});

export type PipelineStartInput = z.infer<typeof pipelineStartSchema>;

// === Projects ===
export const createProjectSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(200),
  videoUrl: z.string().min(1, 'URL do vídeo é obrigatória'),
  videoName: z.string().min(1, 'Nome do vídeo é obrigatório'),
  videoDuration: z.number().nonnegative().default(0),
  videoWidth: z.number().int().nonnegative().default(0),
  videoHeight: z.number().int().nonnegative().default(0),
  thumbnailUrl: z.string().nullable().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  transcription: z.unknown().optional(),
  analysis: z.unknown().optional(),
  segments: z.array(z.unknown()).optional(),
  illustrations: z.array(z.unknown()).optional(),
  subtitleStyle: z.unknown().optional(),
  subtitlesEnabled: z.boolean().optional(),
  illustrationStyle: z.string().optional(),
  customPrompt: z.string().nullable().optional(),
  promptHistory: z.unknown().optional(),
  status: z.enum(['uploading', 'processing', 'ready', 'failed']).optional(),
  outputUrl: z.string().nullable().optional(),
});

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// === Render ===
export const renderBodySchema = z.object({
  videoId: z.string().min(1),
  videoUrl: z.string().min(1),
  transcription: z.unknown(),
  illustrations: z.array(z.unknown()),
  subtitleStyle: z.unknown(),
  subtitlesEnabled: z.boolean(),
  exportSettings: z.object({
    resolution: z.enum(['720p', '1080p', '4k']),
    format: z.enum(['mp4', 'mov', 'webm']),
    aspectRatio: z.enum(['16:9', '9:16', '1:1']),
    quality: z.enum(['fast', 'balanced', 'max']),
  }),
});

export type RenderInput = z.infer<typeof renderBodySchema>;

// === Image Generation ===
export const generateImageSchema = z.object({
  prompt: z.string().min(1, 'Prompt é obrigatório'),
  style: z
    .enum(['flat', 'realistic', 'cartoon', 'minimalist', 'watercolor', '3d-render', 'custom'])
    .default('flat'),
});

export type GenerateImageInput = z.infer<typeof generateImageSchema>;

// === Transcribe ===
export const transcribeSchema = z.object({
  videoId: z.string().min(1, 'videoId é obrigatório'),
  videoUrl: z.string().min(1, 'videoUrl é obrigatório'),
});

// === Subtitles ===
export const generateSubtitlesSchema = z.object({
  words: z.array(z.object({
    text: z.string(),
    start: z.number(),
    end: z.number(),
  })),
  style: z.enum(['hormozi', 'clean', 'karaoke', 'typewriter', 'pop']).optional().default('hormozi'),
});

// === Illustrations analysis ===
export const generateIllustrationsSchema = z.object({
  transcriptionText: z.string().min(1, 'Transcrição é obrigatória'),
  duration: z.number().positive(),
  customPrompt: z.string().optional(),
});
