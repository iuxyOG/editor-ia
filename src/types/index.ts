export interface VideoFile {
  id: string;
  name: string;
  size: number;
  duration: number;
  width: number;
  height: number;
  url: string;
  thumbnailUrl?: string;
}

export interface TranscriptionWord {
  text: string;
  start: number;
  end: number;
}

export interface TranscriptionSegment {
  id: number;
  text: string;
  start: number;
  end: number;
  words: TranscriptionWord[];
}

export interface Transcription {
  text: string;
  segments: TranscriptionSegment[];
  words: TranscriptionWord[];
  language: string;
  duration: number;
}

export interface VideoSegment {
  id: string;
  title: string;
  description: string;
  start: number;
  end: number;
  status: 'pending' | 'processing' | 'completed';
}

export interface Illustration {
  id: string;
  segmentId: string;
  prompt: string;
  imageUrl: string;
  style: IllustrationStyle;
  start: number;
  end: number;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'full';
}

export type IllustrationStyle =
  | 'flat'
  | 'realistic'
  | 'cartoon'
  | 'minimalist'
  | 'watercolor'
  | '3d-render'
  | 'custom';

export interface SubtitleStyle {
  preset: SubtitlePreset;
  fontFamily: string;
  fontSize: number;
  textColor: string;
  highlightColor: string;
  position: 'top' | 'center' | 'bottom';
  background: 'blur' | 'solid' | 'none';
}

export type SubtitlePreset =
  | 'hormozi'
  | 'clean'
  | 'karaoke'
  | 'typewriter'
  | 'pop';

export interface ContentAnalysis {
  segments: VideoSegment[];
  illustrations: Illustration[];
  highlights: { start: number; end: number; reason: string }[];
  subtitleSuggestions: { segmentId: string; style: SubtitlePreset; reason: string }[];
}

export interface ExportSettings {
  resolution: '720p' | '1080p' | '4k';
  format: 'mp4' | 'mov' | 'webm';
  aspectRatio: '9:16' | '16:9' | '1:1';
  quality: 'fast' | 'balanced' | 'max';
}

export type PipelineStep = 'upload' | 'transcription' | 'analysis' | 'illustrations' | 'rendering';

export interface PipelineState {
  currentStep: PipelineStep;
  progress: number;
  message: string;
  isComplete: boolean;
  error?: string;
}

export interface TrendVideo {
  id: string;
  title: string;
  thumbnail: string;
  views: string;
  platform: 'tiktok' | 'instagram' | 'youtube';
  editingStyle: string;
  url: string;
}

export interface PromptHistoryItem {
  id: string;
  prompt: string;
  timestamp: Date;
}
