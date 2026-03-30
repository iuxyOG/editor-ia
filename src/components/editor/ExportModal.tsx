'use client';

import { Download, Monitor, Smartphone, Square, Zap, Scale, Crown, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useExportStore } from '@/hooks/useExportStore';
import { useVideoStore } from '@/hooks/useVideoStore';
import { useEditorStore } from '@/hooks/useEditorStore';
import { useExportHook } from '@/hooks/useExportHook';
import { cn } from '@/utils/cn';
import type { ExportSettings } from '@/types';

const RESOLUTIONS: { id: ExportSettings['resolution']; label: string; desc: string }[] = [
  { id: '720p', label: '720p', desc: 'HD' },
  { id: '1080p', label: '1080p', desc: 'Full HD' },
  { id: '4k', label: '4K', desc: 'Ultra HD' },
];

const FORMATS: { id: ExportSettings['format']; label: string }[] = [
  { id: 'mp4', label: 'MP4' },
  { id: 'mov', label: 'MOV' },
  { id: 'webm', label: 'WebM' },
];

const ASPECT_RATIOS: { id: ExportSettings['aspectRatio']; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: '16:9', label: '16:9', icon: <Monitor className="w-4 h-4" />, desc: 'YouTube' },
  { id: '9:16', label: '9:16', icon: <Smartphone className="w-4 h-4" />, desc: 'Reels / TikTok' },
  { id: '1:1', label: '1:1', icon: <Square className="w-4 h-4" />, desc: 'Feed' },
];

const QUALITIES: { id: ExportSettings['quality']; label: string; icon: React.ReactNode }[] = [
  { id: 'fast', label: 'Rápido', icon: <Zap className="w-4 h-4" /> },
  { id: 'balanced', label: 'Balanceado', icon: <Scale className="w-4 h-4" /> },
  { id: 'max', label: 'Máxima', icon: <Crown className="w-4 h-4" /> },
];

export function ExportModal() {
  const { showExportModal, setShowExportModal, exportSettings, setExportSettings } = useExportStore();
  const { video } = useVideoStore();
  const { transcription, illustrations, subtitleStyle, subtitlesEnabled } = useEditorStore();
  const { isRendering, progress: renderProgress, message: renderMessage, downloadUrl, error, startExport, reset } = useExportHook();

  const handleExport = async () => {
    if (!video) return;
    startExport({
      videoId: video.id,
      videoUrl: video.url,
      transcription,
      illustrations,
      subtitleStyle,
      subtitlesEnabled,
      exportSettings,
    });
  };

  const handleClose = () => {
    reset();
    setShowExportModal(false);
  };

  return (
    <Modal
      isOpen={showExportModal}
      onClose={handleClose}
      title="Exportar Vídeo"
      className="max-w-md"
    >
      {!isRendering && !downloadUrl && !error && (
        <div className="space-y-6">
          {/* Resolution */}
          <div>
            <h4 className="text-xs font-heading font-semibold text-text-secondary mb-2 uppercase tracking-wider">
              Resolução
            </h4>
            <div className="flex gap-2">
              {RESOLUTIONS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setExportSettings({ resolution: r.id })}
                  className={cn(
                    'flex-1 py-2.5 rounded-btn text-center transition-all',
                    exportSettings.resolution === r.id
                      ? 'bg-brand-blue text-white'
                      : 'bg-bg-tertiary text-text-secondary hover:text-text-primary border border-border'
                  )}
                >
                  <p className="text-sm font-bold">{r.label}</p>
                  <p className="text-[10px] opacity-70">{r.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Format */}
          <div>
            <h4 className="text-xs font-heading font-semibold text-text-secondary mb-2 uppercase tracking-wider">
              Formato
            </h4>
            <div className="flex gap-2">
              {FORMATS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setExportSettings({ format: f.id })}
                  className={cn(
                    'flex-1 py-2 rounded-btn text-sm font-medium transition-all',
                    exportSettings.format === f.id
                      ? 'bg-brand-blue text-white'
                      : 'bg-bg-tertiary text-text-secondary hover:text-text-primary border border-border'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio */}
          <div>
            <h4 className="text-xs font-heading font-semibold text-text-secondary mb-2 uppercase tracking-wider">
              Proporção
            </h4>
            <div className="flex gap-2">
              {ASPECT_RATIOS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setExportSettings({ aspectRatio: a.id })}
                  className={cn(
                    'flex-1 py-2.5 rounded-btn text-center transition-all',
                    exportSettings.aspectRatio === a.id
                      ? 'bg-brand-blue text-white'
                      : 'bg-bg-tertiary text-text-secondary hover:text-text-primary border border-border'
                  )}
                >
                  <div className="flex items-center justify-center gap-1.5 mb-0.5">
                    {a.icon}
                    <span className="text-sm font-bold">{a.label}</span>
                  </div>
                  <p className="text-[10px] opacity-70">{a.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Quality */}
          <div>
            <h4 className="text-xs font-heading font-semibold text-text-secondary mb-2 uppercase tracking-wider">
              Qualidade
            </h4>
            <div className="flex gap-2">
              {QUALITIES.map((q) => (
                <button
                  key={q.id}
                  onClick={() => setExportSettings({ quality: q.id })}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-btn text-sm font-medium transition-all',
                    exportSettings.quality === q.id
                      ? 'bg-brand-blue text-white'
                      : 'bg-bg-tertiary text-text-secondary hover:text-text-primary border border-border'
                  )}
                >
                  {q.icon} {q.label}
                </button>
              ))}
            </div>
          </div>

          <Button glow size="lg" className="w-full" onClick={handleExport}>
            <Download className="w-5 h-5" />
            Exportar Vídeo
          </Button>
        </div>
      )}

      {isRendering && (
        <div className="py-8 space-y-4 text-center">
          <div className="animate-glow-pulse inline-flex p-4 rounded-full bg-brand-blue/10">
            <Download className="w-8 h-8 text-brand-blue" />
          </div>
          <div>
            <p className="font-heading font-bold text-text-primary">Renderizando...</p>
            <p className="text-sm text-text-secondary mt-1">{renderMessage}</p>
          </div>
          <ProgressBar value={Math.min(renderProgress, 100)} />
          <p className="text-xs text-text-secondary">{Math.min(Math.round(renderProgress), 100)}%</p>
        </div>
      )}

      {error && (
        <div className="py-8 space-y-4 text-center">
          <div className="inline-flex p-4 rounded-full bg-error/10">
            <AlertCircle className="w-8 h-8 text-error" />
          </div>
          <div>
            <p className="font-heading font-bold text-text-primary">Erro na renderização</p>
            <p className="text-sm text-error mt-1">{error}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" size="lg" className="flex-1" onClick={() => { reset(); }}>
              Tentar novamente
            </Button>
            <Button variant="ghost" size="lg" className="flex-1" onClick={handleClose}>
              Fechar
            </Button>
          </div>
        </div>
      )}

      {downloadUrl && !isRendering && !error && (
        <div className="py-8 space-y-4 text-center">
          <div className="inline-flex p-4 rounded-full bg-success/10">
            <Download className="w-8 h-8 text-success" />
          </div>
          <div>
            <p className="font-heading font-bold text-text-primary">Vídeo pronto!</p>
            <p className="text-sm text-text-secondary mt-1">
              {exportSettings.resolution} &middot; {exportSettings.format.toUpperCase()} &middot; {exportSettings.aspectRatio}
            </p>
          </div>

          {/* Preview */}
          <video
            src={downloadUrl}
            controls
            className="w-full rounded-btn bg-black max-h-48 mx-auto"
            preload="metadata"
          />

          <div className="flex gap-3">
            <a
              href={downloadUrl}
              download
              className="flex-1"
            >
              <Button glow size="lg" className="w-full">
                <Download className="w-5 h-5" /> Baixar
              </Button>
            </a>
            <Button variant="secondary" size="lg" className="flex-1" onClick={handleClose}>
              Fechar
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
