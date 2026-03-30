import { create } from 'zustand';
import type { PipelineState, PipelineStep } from '@/types';

const defaultPipeline: PipelineState = {
  currentStep: 'upload',
  progress: 0,
  message: '',
  isComplete: false,
};

interface PipelineStore {
  pipeline: PipelineState;
  setPipelineStep: (step: PipelineStep, progress: number, message: string) => void;
  setPipelineComplete: () => void;
  setPipelineError: (error: string) => void;
  resetPipeline: () => void;
}

export const usePipelineStore = create<PipelineStore>()((set) => ({
  pipeline: defaultPipeline,
  setPipelineStep: (currentStep, progress, message) =>
    set({ pipeline: { currentStep, progress, message, isComplete: false } }),
  setPipelineComplete: () =>
    set({ pipeline: { ...defaultPipeline, isComplete: true, progress: 100, message: 'Concluído!' } }),
  setPipelineError: (error) =>
    set((state) => ({ pipeline: { ...state.pipeline, error } })),
  resetPipeline: () => set({ pipeline: defaultPipeline }),
}));
