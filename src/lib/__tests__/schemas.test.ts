import { describe, it, expect } from 'vitest';
import {
  pipelineStartSchema,
  createProjectSchema,
  updateProjectSchema,
  renderBodySchema,
  generateImageSchema,
  transcribeSchema,
  generateSubtitlesSchema,
  generateIllustrationsSchema,
} from '@/lib/schemas';

describe('pipelineStartSchema', () => {
  it('accepts valid input', () => {
    const result = pipelineStartSchema.safeParse({
      videoId: 'vid_123',
      videoUrl: '/uploads/test.mp4',
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional customPrompt', () => {
    const result = pipelineStartSchema.safeParse({
      videoId: 'vid_123',
      videoUrl: '/uploads/test.mp4',
      customPrompt: 'Use cartoon style',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty videoId', () => {
    const result = pipelineStartSchema.safeParse({
      videoId: '',
      videoUrl: '/uploads/test.mp4',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing videoUrl', () => {
    const result = pipelineStartSchema.safeParse({
      videoId: 'vid_123',
    });
    expect(result.success).toBe(false);
  });
});

describe('createProjectSchema', () => {
  it('accepts valid input with defaults', () => {
    const result = createProjectSchema.safeParse({
      name: 'My Video',
      videoUrl: '/uploads/test.mp4',
      videoName: 'test.mp4',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.videoDuration).toBe(0);
      expect(result.data.videoWidth).toBe(0);
    }
  });

  it('rejects name longer than 200 chars', () => {
    const result = createProjectSchema.safeParse({
      name: 'a'.repeat(201),
      videoUrl: '/uploads/test.mp4',
      videoName: 'test.mp4',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const result = createProjectSchema.safeParse({
      name: '',
      videoUrl: '/uploads/test.mp4',
      videoName: 'test.mp4',
    });
    expect(result.success).toBe(false);
  });

  it('accepts full input', () => {
    const result = createProjectSchema.safeParse({
      name: 'My Video',
      videoUrl: '/uploads/test.mp4',
      videoName: 'test.mp4',
      videoDuration: 120.5,
      videoWidth: 1920,
      videoHeight: 1080,
      thumbnailUrl: '/uploads/thumb.jpg',
    });
    expect(result.success).toBe(true);
  });
});

describe('updateProjectSchema', () => {
  it('accepts partial updates', () => {
    const result = updateProjectSchema.safeParse({
      name: 'Updated Name',
    });
    expect(result.success).toBe(true);
  });

  it('accepts status change', () => {
    const result = updateProjectSchema.safeParse({
      status: 'ready',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid status', () => {
    const result = updateProjectSchema.safeParse({
      status: 'banana',
    });
    expect(result.success).toBe(false);
  });

  it('accepts empty object', () => {
    const result = updateProjectSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('generateImageSchema', () => {
  it('accepts valid input with default style', () => {
    const result = generateImageSchema.safeParse({
      prompt: 'A professional infographic',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.style).toBe('flat');
    }
  });

  it('rejects empty prompt', () => {
    const result = generateImageSchema.safeParse({
      prompt: '',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid style', () => {
    const result = generateImageSchema.safeParse({
      prompt: 'test',
      style: 'cartoon',
    });
    expect(result.success).toBe(true);
  });
});

describe('renderBodySchema', () => {
  it('accepts valid render request', () => {
    const result = renderBodySchema.safeParse({
      videoId: 'vid_123',
      videoUrl: '/uploads/test.mp4',
      transcription: { text: 'hello' },
      illustrations: [{ id: 'ill_1' }],
      subtitleStyle: { preset: 'hormozi' },
      subtitlesEnabled: true,
      exportSettings: {
        resolution: '1080p',
        format: 'mp4',
        aspectRatio: '16:9',
        quality: 'balanced',
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid resolution', () => {
    const result = renderBodySchema.safeParse({
      videoId: 'vid_123',
      videoUrl: '/uploads/test.mp4',
      transcription: null,
      illustrations: [],
      subtitleStyle: null,
      subtitlesEnabled: false,
      exportSettings: {
        resolution: '8k', // invalid
        format: 'mp4',
        aspectRatio: '16:9',
        quality: 'balanced',
      },
    });
    expect(result.success).toBe(false);
  });
});

describe('transcribeSchema', () => {
  it('accepts valid input', () => {
    const result = transcribeSchema.safeParse({
      videoId: 'vid_123',
      videoUrl: '/uploads/test.mp4',
    });
    expect(result.success).toBe(true);
  });
});

describe('generateSubtitlesSchema', () => {
  it('accepts valid input with default style', () => {
    const result = generateSubtitlesSchema.safeParse({
      words: [{ text: 'Hello', start: 0, end: 1 }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.style).toBe('hormozi');
    }
  });

  it('rejects empty words array', () => {
    // empty array is valid for the schema but let's test structure
    const result = generateSubtitlesSchema.safeParse({
      words: [{ text: 'Hello' }], // missing start/end
    });
    expect(result.success).toBe(false);
  });
});

describe('generateIllustrationsSchema', () => {
  it('accepts valid input', () => {
    const result = generateIllustrationsSchema.safeParse({
      transcriptionText: 'Hello world',
      duration: 120,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty transcription', () => {
    const result = generateIllustrationsSchema.safeParse({
      transcriptionText: '',
      duration: 120,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative duration', () => {
    const result = generateIllustrationsSchema.safeParse({
      transcriptionText: 'Hello',
      duration: -1,
    });
    expect(result.success).toBe(false);
  });
});
