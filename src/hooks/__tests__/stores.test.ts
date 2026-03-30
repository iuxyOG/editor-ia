import { describe, it, expect, beforeEach } from 'vitest';
import { useVideoStore } from '@/hooks/useVideoStore';
import { useEditorStore } from '@/hooks/useEditorStore';
import { usePipelineStore } from '@/hooks/usePipelineStore';
import { useUIStore } from '@/hooks/useUIStore';
import { useExportStore } from '@/hooks/useExportStore';

describe('useVideoStore', () => {
  beforeEach(() => {
    useVideoStore.setState({ video: null });
  });

  it('starts with null video', () => {
    expect(useVideoStore.getState().video).toBeNull();
  });

  it('sets video', () => {
    const video = { id: '1', name: 'test.mp4', size: 1000, duration: 60, width: 1920, height: 1080, url: '/test.mp4' };
    useVideoStore.getState().setVideo(video);
    expect(useVideoStore.getState().video).toEqual(video);
  });

  it('clears video', () => {
    useVideoStore.getState().setVideo({ id: '1', name: 'test', size: 0, duration: 0, width: 0, height: 0, url: '' });
    useVideoStore.getState().clearVideo();
    expect(useVideoStore.getState().video).toBeNull();
  });
});

describe('useEditorStore', () => {
  beforeEach(() => {
    useEditorStore.getState().resetEditor();
    useEditorStore.setState({
      subtitlesEnabled: true,
      illustrationStyle: 'flat',
      subtitleStyle: {
        preset: 'hormozi',
        fontFamily: 'Outfit',
        fontSize: 48,
        textColor: '#FFFFFF',
        highlightColor: '#2563EB',
        position: 'bottom',
        background: 'none',
      },
      promptHistory: [],
    });
  });

  it('starts with empty data', () => {
    const state = useEditorStore.getState();
    expect(state.transcription).toBeNull();
    expect(state.analysis).toBeNull();
    expect(state.segments).toEqual([]);
    expect(state.illustrations).toEqual([]);
  });

  it('adds illustration', () => {
    const ill = { id: 'ill_1', segmentId: 'seg_1', prompt: 'test', imageUrl: '', style: 'flat' as const, start: 0, end: 5, position: 'top-right' as const };
    useEditorStore.getState().addIllustration(ill);
    expect(useEditorStore.getState().illustrations).toHaveLength(1);
    expect(useEditorStore.getState().illustrations[0].id).toBe('ill_1');
  });

  it('updates illustration', () => {
    const ill = { id: 'ill_1', segmentId: 'seg_1', prompt: 'test', imageUrl: '', style: 'flat' as const, start: 0, end: 5, position: 'top-right' as const };
    useEditorStore.getState().addIllustration(ill);
    useEditorStore.getState().updateIllustration('ill_1', { prompt: 'updated' });
    expect(useEditorStore.getState().illustrations[0].prompt).toBe('updated');
  });

  it('removes illustration', () => {
    const ill = { id: 'ill_1', segmentId: 'seg_1', prompt: 'test', imageUrl: '', style: 'flat' as const, start: 0, end: 5, position: 'top-right' as const };
    useEditorStore.getState().addIllustration(ill);
    useEditorStore.getState().removeIllustration('ill_1');
    expect(useEditorStore.getState().illustrations).toHaveLength(0);
  });

  it('toggles subtitles', () => {
    expect(useEditorStore.getState().subtitlesEnabled).toBe(true);
    useEditorStore.getState().toggleSubtitles();
    expect(useEditorStore.getState().subtitlesEnabled).toBe(false);
  });

  it('sets subtitle style partially', () => {
    useEditorStore.getState().setSubtitleStyle({ fontSize: 64 });
    expect(useEditorStore.getState().subtitleStyle.fontSize).toBe(64);
    expect(useEditorStore.getState().subtitleStyle.fontFamily).toBe('Outfit');
  });

  it('adds prompt to history', () => {
    useEditorStore.getState().addPromptHistory('test prompt');
    expect(useEditorStore.getState().promptHistory).toHaveLength(1);
    expect(useEditorStore.getState().promptHistory[0].prompt).toBe('test prompt');
  });

  it('resets editor', () => {
    useEditorStore.getState().setSegments([{ id: 'seg_1', title: 'Test', description: '', start: 0, end: 10, status: 'completed' }]);
    useEditorStore.getState().resetEditor();
    expect(useEditorStore.getState().segments).toEqual([]);
    expect(useEditorStore.getState().transcription).toBeNull();
  });
});

describe('usePipelineStore', () => {
  beforeEach(() => {
    usePipelineStore.getState().resetPipeline();
  });

  it('starts with default pipeline state', () => {
    const { pipeline } = usePipelineStore.getState();
    expect(pipeline.currentStep).toBe('upload');
    expect(pipeline.progress).toBe(0);
    expect(pipeline.isComplete).toBe(false);
  });

  it('sets pipeline step', () => {
    usePipelineStore.getState().setPipelineStep('transcription', 50, 'Transcrevendo...');
    const { pipeline } = usePipelineStore.getState();
    expect(pipeline.currentStep).toBe('transcription');
    expect(pipeline.progress).toBe(50);
    expect(pipeline.message).toBe('Transcrevendo...');
  });

  it('sets pipeline complete', () => {
    usePipelineStore.getState().setPipelineComplete();
    const { pipeline } = usePipelineStore.getState();
    expect(pipeline.isComplete).toBe(true);
    expect(pipeline.progress).toBe(100);
  });

  it('sets pipeline error', () => {
    usePipelineStore.getState().setPipelineError('Something failed');
    const { pipeline } = usePipelineStore.getState();
    expect(pipeline.error).toBe('Something failed');
  });
});

describe('useUIStore', () => {
  it('starts with default UI state', () => {
    const state = useUIStore.getState();
    expect(state.currentTime).toBe(0);
    expect(state.isPlaying).toBe(false);
    expect(state.activeTab).toBe('illustrations');
  });

  it('sets current time', () => {
    useUIStore.getState().setCurrentTime(42.5);
    expect(useUIStore.getState().currentTime).toBe(42.5);
  });

  it('sets playing state', () => {
    useUIStore.getState().setIsPlaying(true);
    expect(useUIStore.getState().isPlaying).toBe(true);
  });

  it('sets active tab', () => {
    useUIStore.getState().setActiveTab('subtitles');
    expect(useUIStore.getState().activeTab).toBe('subtitles');
  });
});

describe('useExportStore', () => {
  it('starts with default export settings', () => {
    const { exportSettings } = useExportStore.getState();
    expect(exportSettings.resolution).toBe('1080p');
    expect(exportSettings.format).toBe('mp4');
    expect(exportSettings.aspectRatio).toBe('16:9');
    expect(exportSettings.quality).toBe('balanced');
  });

  it('updates export settings partially', () => {
    useExportStore.getState().setExportSettings({ resolution: '4k' });
    expect(useExportStore.getState().exportSettings.resolution).toBe('4k');
    expect(useExportStore.getState().exportSettings.format).toBe('mp4'); // unchanged
  });

  it('toggles export modal', () => {
    expect(useExportStore.getState().showExportModal).toBe(false);
    useExportStore.getState().setShowExportModal(true);
    expect(useExportStore.getState().showExportModal).toBe(true);
  });
});
