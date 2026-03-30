'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Image, Type, Wand2, TrendingUp, Download, ArrowLeft, Undo2, Redo2,
} from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { Tabs } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { SegmentsPanel } from '@/components/editor/SegmentsPanel';
import { VideoPreview } from '@/components/preview/VideoPreview';
import { Timeline } from '@/components/timeline/Timeline';
import { Waveform } from '@/components/timeline/Waveform';
import { IllustrationsPanel } from '@/components/illustrations/IllustrationsPanel';
import { SubtitlesPanel } from '@/components/subtitles/SubtitlesPanel';
import { PromptPanel } from '@/components/prompt-editor/PromptPanel';
import { TrendsPanel } from '@/components/trends/TrendsPanel';
import { ProcessingPipeline } from '@/components/editor/ProcessingPipeline';
import { ExportModal } from '@/components/editor/ExportModal';
import { useVideoStore } from '@/hooks/useVideoStore';
import { useEditorStore } from '@/hooks/useEditorStore';
import { useTemporalStore } from '@/hooks/useEditorStore';
import { usePipelineStore } from '@/hooks/usePipelineStore';
import { useUIStore } from '@/hooks/useUIStore';
import { useExportStore } from '@/hooks/useExportStore';
import * as api from '@/lib/api';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useAutoSave } from '@/hooks/useAutoSave';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { Check, Loader2 as Spinner, Cloud } from 'lucide-react';

const TABS = [
  { id: 'illustrations', label: 'Ilustrações', icon: <Image className="w-4 h-4" /> },
  { id: 'subtitles', label: 'Legendas', icon: <Type className="w-4 h-4" /> },
  { id: 'prompt', label: 'Prompt', icon: <Wand2 className="w-4 h-4" /> },
  { id: 'trends', label: 'Tendências', icon: <TrendingUp className="w-4 h-4" /> },
];

export default function EditorPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { video, setVideo } = useVideoStore();
  const { setTranscription, setAnalysis, setSegments, setIllustrations, setSubtitleStyle, setCustomPrompt } = useEditorStore();
  const { pipeline, setPipelineStep } = usePipelineStore();
  const { activeTab, setActiveTab } = useUIStore();
  const { setShowExportModal } = useExportStore();
  const [isProcessing, setIsProcessing] = useState(true);
  const [isLoadingProject, setIsLoadingProject] = useState(true);

  // Atalhos de teclado
  useKeyboardShortcuts();

  // Auto-save to Prisma
  const saveStatus = useAutoSave(projectId);

  // Load project from Prisma on mount
  useEffect(() => {
    if (!projectId) return;

    const loadProject = async () => {
      try {
        const project = await api.getProject(projectId);

        setVideo({
          id: project.id,
          name: project.videoName,
          size: 0,
          duration: project.videoDuration,
          width: project.videoWidth,
          height: project.videoHeight,
          url: project.videoUrl,
          thumbnailUrl: project.thumbnailUrl ?? undefined,
        });

        // Restore saved state if exists
        if (project.transcription) setTranscription(project.transcription as import('@/types').Transcription);
        if (project.analysis) setAnalysis(project.analysis as import('@/types').ContentAnalysis);
        if (project.segments?.length) setSegments(project.segments as import('@/types').VideoSegment[]);
        if (project.illustrations?.length) setIllustrations(project.illustrations as import('@/types').Illustration[]);
        if (project.subtitleStyle) setSubtitleStyle(project.subtitleStyle as Partial<import('@/types').SubtitleStyle>);
        if (project.customPrompt) setCustomPrompt(project.customPrompt);

        // If project is already ready, skip processing
        if (project.status === 'ready' && project.segments?.length > 0) {
          setPipelineStep('rendering', 100, 'Concluído!');
          setIsProcessing(false);
        } else {
          setPipelineStep('transcription', 0, 'Iniciando...');
        }
      } catch {
        // Project not found or error — use as video ID fallback
        setVideo({
          id: projectId,
          name: 'video_demo.mp4',
          size: 0,
          duration: 180,
          width: 1920,
          height: 1080,
          url: '',
        });
        setPipelineStep('transcription', 0, 'Iniciando...');
      } finally {
        setIsLoadingProject(false);
      }
    };

    loadProject();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleProcessingComplete = () => {
    setIsProcessing(false);
    // Update project status in DB
    api.updateProject(projectId, { status: 'ready' }).catch(() => {});
  };

  // Check if pipeline already complete (from loaded project)
  useEffect(() => {
    if (pipeline.isComplete) {
      setIsProcessing(false);
    }
  }, [pipeline.isComplete]);

  if (isLoadingProject || !video) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-3">
        <Spinner className="w-5 h-5 text-brand-blue animate-spin" />
        <p className="text-text-secondary">Carregando projeto...</p>
      </div>
    );
  }

  // Tela de processamento
  if (isProcessing) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-24 pb-12 px-6">
          <div className="max-w-2xl mx-auto">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Link>
            <ProcessingPipeline onComplete={handleProcessingComplete} />
          </div>
        </main>
      </div>
    );
  }

  // Editor principal — layout 3 colunas
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <DemoBanner />

      {/* Toolbar */}
      <div className="fixed top-16 left-0 right-0 z-30 border-b border-border bg-bg-primary/90 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 h-12">
          <div className="flex items-center gap-3">
            <Link
              href="/projects"
              className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Projetos
            </Link>
            <span className="text-border">|</span>
            <span className="text-sm text-text-primary truncate max-w-[200px]">{video.name}</span>
            {/* Save status */}
            <span className="flex items-center gap-1 text-xs text-text-secondary">
              {saveStatus === 'saving' && <><Spinner className="w-3 h-3 animate-spin text-brand-light" /> Salvando...</>}
              {saveStatus === 'saved' && <><Check className="w-3 h-3 text-success" /> Salvo</>}
              {saveStatus === 'error' && <><Cloud className="w-3 h-3 text-error" /> Erro ao salvar</>}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <UndoRedoButtons />
            <Button glow size="sm" onClick={() => setShowExportModal(true)}>
              <Download className="w-4 h-4" /> Exportar
            </Button>
          </div>
        </div>
      </div>

      {/* Main editor */}
      <main className="flex-1 pt-28 flex overflow-hidden" style={{ height: 'calc(100vh - 112px)' }}>
        {/* Left: Segments */}
        <div className="w-72 shrink-0 border-r border-border bg-bg-secondary overflow-hidden flex flex-col">
          <ErrorBoundary fallbackMessage="Erro ao carregar segmentos">
            <SegmentsPanel />
          </ErrorBoundary>
        </div>

        {/* Center: Preview + Timeline */}
        <div className="flex-1 flex flex-col min-w-0 bg-bg-primary">
          <ErrorBoundary fallbackMessage="Erro no player de vídeo">
            <div className="flex-1 min-h-0">
              <VideoPreview />
            </div>
            <Timeline />
            <Waveform />
          </ErrorBoundary>
        </div>

        {/* Right: Controls */}
        <div className="w-80 shrink-0 border-l border-border bg-bg-secondary flex flex-col overflow-hidden">
          <div className="p-2 border-b border-border">
            <Tabs
              tabs={TABS}
              activeTab={activeTab}
              onTabChange={(id) => setActiveTab(id as typeof activeTab)}
            />
          </div>

          <div className="flex-1 overflow-hidden">
            <ErrorBoundary fallbackMessage="Erro no painel de controles">
              {activeTab === 'illustrations' && <IllustrationsPanel />}
              {activeTab === 'subtitles' && <SubtitlesPanel />}
              {activeTab === 'prompt' && <PromptPanel />}
              {activeTab === 'trends' && <TrendsPanel />}
            </ErrorBoundary>
          </div>
        </div>
      </main>

      <ExportModal />
    </div>
  );
}

function UndoRedoButtons() {
  const temporal = useTemporalStore();
  const { undo, redo, pastStates, futureStates } = temporal.getState();

  // Subscribe to temporal changes for reactivity
  const [canUndo, setCanUndo] = useState(pastStates.length > 0);
  const [canRedo, setCanRedo] = useState(futureStates.length > 0);

  useEffect(() => {
    const unsub = temporal.subscribe((state) => {
      setCanUndo(state.pastStates.length > 0);
      setCanRedo(state.futureStates.length > 0);
    });
    return unsub;
  }, [temporal]);

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => temporal.getState().undo()}
        disabled={!canUndo}
        className="p-1.5 rounded-btn text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Desfazer (Ctrl+Z)"
      >
        <Undo2 className="w-4 h-4" />
      </button>
      <button
        onClick={() => temporal.getState().redo()}
        disabled={!canRedo}
        className="p-1.5 rounded-btn text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Refazer (Ctrl+Y)"
      >
        <Redo2 className="w-4 h-4" />
      </button>
    </div>
  );
}
