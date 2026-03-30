import { create } from 'zustand';

type ActiveTab = 'illustrations' | 'subtitles' | 'prompt' | 'trends';

interface UIStore {
  currentTime: number;
  setCurrentTime: (t: number) => void;
  isPlaying: boolean;
  setIsPlaying: (p: boolean) => void;
  viewMode: 'original' | 'edited';
  setViewMode: (m: 'original' | 'edited') => void;
  activeTab: ActiveTab;
  setActiveTab: (t: ActiveTab) => void;
}

export const useUIStore = create<UIStore>()((set) => ({
  currentTime: 0,
  setCurrentTime: (currentTime) => set({ currentTime }),
  isPlaying: false,
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  viewMode: 'edited',
  setViewMode: (viewMode) => set({ viewMode }),
  activeTab: 'illustrations',
  setActiveTab: (activeTab) => set({ activeTab }),
}));
