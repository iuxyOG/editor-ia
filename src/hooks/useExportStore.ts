import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ExportSettings } from '@/types';

const defaultExportSettings: ExportSettings = {
  resolution: '1080p',
  format: 'mp4',
  aspectRatio: '16:9',
  quality: 'balanced',
};

interface ExportStore {
  exportSettings: ExportSettings;
  setExportSettings: (s: Partial<ExportSettings>) => void;
  showExportModal: boolean;
  setShowExportModal: (show: boolean) => void;
}

export const useExportStore = create<ExportStore>()(
  persist(
    (set) => ({
      exportSettings: defaultExportSettings,
      setExportSettings: (settings) =>
        set((state) => ({
          exportSettings: { ...state.exportSettings, ...settings },
        })),
      showExportModal: false,
      setShowExportModal: (showExportModal) => set({ showExportModal }),
    }),
    {
      name: 'video-editor-export',
      partialize: (state) => ({
        exportSettings: state.exportSettings,
      }),
    }
  )
);
