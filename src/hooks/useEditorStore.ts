import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { temporal } from 'zundo';
import type {
  Transcription,
  ContentAnalysis,
  VideoSegment,
  Illustration,
  SubtitleStyle,
  IllustrationStyle,
  PromptHistoryItem,
} from '@/types';

interface EditorStore {
  transcription: Transcription | null;
  setTranscription: (t: Transcription) => void;

  analysis: ContentAnalysis | null;
  setAnalysis: (a: ContentAnalysis) => void;

  segments: VideoSegment[];
  setSegments: (s: VideoSegment[]) => void;
  updateSegment: (id: string, data: Partial<VideoSegment>) => void;

  illustrations: Illustration[];
  setIllustrations: (i: Illustration[]) => void;
  addIllustration: (i: Illustration) => void;
  updateIllustration: (id: string, data: Partial<Illustration>) => void;
  removeIllustration: (id: string) => void;

  illustrationStyle: IllustrationStyle;
  setIllustrationStyle: (s: IllustrationStyle) => void;

  subtitlesEnabled: boolean;
  toggleSubtitles: () => void;
  subtitleStyle: SubtitleStyle;
  setSubtitleStyle: (s: Partial<SubtitleStyle>) => void;

  customPrompt: string;
  setCustomPrompt: (p: string) => void;
  promptHistory: PromptHistoryItem[];
  addPromptHistory: (prompt: string) => void;

  resetEditor: () => void;
}

const defaultSubtitleStyle: SubtitleStyle = {
  preset: 'hormozi',
  fontFamily: 'Outfit',
  fontSize: 48,
  textColor: '#FFFFFF',
  highlightColor: '#2563EB',
  position: 'bottom',
  background: 'none',
};

export const useEditorStore = create<EditorStore>()(
  persist(
    temporal(
      (set) => ({
        transcription: null,
        setTranscription: (transcription) => set({ transcription }),

        analysis: null,
        setAnalysis: (analysis) => set({ analysis }),

        segments: [],
        setSegments: (segments) => set({ segments }),
        updateSegment: (id, data) =>
          set((state) => ({
            segments: state.segments.map((s) =>
              s.id === id ? { ...s, ...data } : s
            ),
          })),

        illustrations: [],
        setIllustrations: (illustrations) => set({ illustrations }),
        addIllustration: (illustration) =>
          set((state) => ({
            illustrations: [...state.illustrations, illustration],
          })),
        updateIllustration: (id, data) =>
          set((state) => ({
            illustrations: state.illustrations.map((i) =>
              i.id === id ? { ...i, ...data } : i
            ),
          })),
        removeIllustration: (id) =>
          set((state) => ({
            illustrations: state.illustrations.filter((i) => i.id !== id),
          })),

        illustrationStyle: 'flat',
        setIllustrationStyle: (illustrationStyle) => set({ illustrationStyle }),

        subtitlesEnabled: true,
        toggleSubtitles: () =>
          set((state) => ({ subtitlesEnabled: !state.subtitlesEnabled })),
        subtitleStyle: defaultSubtitleStyle,
        setSubtitleStyle: (style) =>
          set((state) => ({
            subtitleStyle: { ...state.subtitleStyle, ...style },
          })),

        customPrompt: '',
        setCustomPrompt: (customPrompt) => set({ customPrompt }),
        promptHistory: [],
        addPromptHistory: (prompt) =>
          set((state) => ({
            promptHistory: [
              { id: Date.now().toString(), prompt, timestamp: new Date() },
              ...state.promptHistory,
            ],
          })),

        resetEditor: () =>
          set({
            transcription: null,
            analysis: null,
            segments: [],
            illustrations: [],
            customPrompt: '',
          }),
      }),
      {
        partialize: (state) => ({
          illustrations: state.illustrations,
          segments: state.segments,
          subtitleStyle: state.subtitleStyle,
          subtitlesEnabled: state.subtitlesEnabled,
          customPrompt: state.customPrompt,
          illustrationStyle: state.illustrationStyle,
        }),
        limit: 50,
      }
    ),
    {
      name: 'video-editor-editor',
      partialize: (state) => ({
        transcription: state.transcription,
        segments: state.segments,
        illustrations: state.illustrations,
        subtitleStyle: state.subtitleStyle,
        subtitlesEnabled: state.subtitlesEnabled,
        illustrationStyle: state.illustrationStyle,
        customPrompt: state.customPrompt,
        promptHistory: state.promptHistory,
      }),
    }
  )
);

export const useTemporalStore = () => useEditorStore.temporal;
