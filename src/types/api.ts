import type { PipelineStep } from './index';

// === Common ===
export interface ApiErrorResponse {
  error: string;
  details?: Record<string, string[]>;
}

// === Upload ===
export interface UploadResponse {
  id: string;
  url: string;
  filename: string;
  size: number;
  duration: number;
  width: number;
  height: number;
  fps: number;
  thumbnailUrl: string;
}

// === Pipeline ===
export interface PipelineStartResponse {
  jobId: string;
  demoMode: boolean;
}

export interface SSEEvent {
  step: PipelineStep;
  progress: number;
  message: string;
  error?: string;
  done?: boolean;
  results?: Record<string, unknown>;
}

// === Projects ===
export interface ProjectListItem {
  id: string;
  name: string;
  videoUrl: string;
  videoName: string;
  videoDuration: number;
  videoWidth: number;
  videoHeight: number;
  thumbnailUrl: string | null;
  status: string;
  outputUrl: string | null;
  illustrationStyle: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFull extends ProjectListItem {
  transcription: unknown;
  analysis: unknown;
  segments: unknown[];
  illustrations: unknown[];
  subtitleStyle: unknown;
  subtitlesEnabled: boolean;
  customPrompt: string | null;
  promptHistory: unknown[];
}

// === Render ===
export interface RenderStartResponse {
  jobId: string;
}

// === Image ===
export interface GenerateImageResponse {
  imageUrl: string;
}

// === Trends ===
export interface TrendsResponse {
  results: Array<{
    id: string;
    title: string;
    thumbnail: string;
    views: string;
    platform: 'tiktok' | 'instagram' | 'youtube';
    editingStyle: string;
    url: string;
  }>;
  type: 'trending' | 'search';
}

// === Health ===
export interface HealthResponse {
  status: 'ok';
  version: string;
  uptime: number;
  demoMode: boolean;
  services: {
    ffmpeg: boolean;
    openai: boolean;
    anthropic: boolean;
    imageGen: boolean;
    youtube: boolean;
  };
  node: string;
  platform: string;
}

// === Status ===
export interface StatusResponse {
  demoMode: boolean;
  services: {
    whisper: boolean;
    claude: boolean;
    imageGen: boolean;
    youtube: boolean;
  };
}
