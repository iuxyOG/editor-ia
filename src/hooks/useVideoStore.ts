import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { VideoFile } from '@/types';

export interface VideoWithThumb extends VideoFile {
  thumbnailUrl?: string;
}

interface VideoStore {
  video: VideoWithThumb | null;
  setVideo: (video: VideoWithThumb | null) => void;
  clearVideo: () => void;
}

export const useVideoStore = create<VideoStore>()(
  persist(
    (set) => ({
      video: null,
      setVideo: (video) => set({ video }),
      clearVideo: () => set({ video: null }),
    }),
    { name: 'video-editor-video' }
  )
);
