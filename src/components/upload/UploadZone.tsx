'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Film, FileVideo, Clock, HardDrive, MonitorPlay, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Card } from '@/components/ui/Card';
import { formatFileSize, formatDuration } from '@/utils/format';
import { useUpload } from '@/hooks/useUpload';

const MAX_FILE_SIZE = Number(process.env.NEXT_PUBLIC_MAX_FILE_SIZE) || 500_000_000;
const MAX_DURATION = Number(process.env.NEXT_PUBLIC_MAX_VIDEO_DURATION) || 600;
const ACCEPTED_FORMATS = { 'video/mp4': ['.mp4'], 'video/quicktime': ['.mov'], 'video/x-msvideo': ['.avi'] };

interface VideoMeta {
  duration: number;
  width: number;
  height: number;
}

export function UploadZone() {
  const { progress, speed, eta, loaded, total, isUploading, error: uploadError, upload, reset } = useUpload();
  const [videoMeta, setVideoMeta] = useState<VideoMeta | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getVideoMetadata = (file: File): Promise<VideoMeta> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
        });
      };
      video.onerror = () => reject(new Error('Não foi possível ler o vídeo'));
      video.src = URL.createObjectURL(file);
    });
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError(`Arquivo muito grande. Máximo: ${formatFileSize(MAX_FILE_SIZE)}`);
      return;
    }

    try {
      const meta = await getVideoMetadata(file);
      if (meta.duration > MAX_DURATION) {
        setError(`Vídeo muito longo. Máximo: ${formatDuration(MAX_DURATION)}`);
        return;
      }

      setVideoMeta(meta);
      setPreviewUrl(URL.createObjectURL(file));
      setSelectedFile(file);
    } catch {
      setError('Formato de vídeo não suportado');
    }
  }, []);

  const handleUpload = async () => {
    if (!selectedFile || !videoMeta) return;

    const projectId = await upload(selectedFile, videoMeta);
    if (projectId) {
      window.location.href = `/editor/${projectId}`;
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FORMATS,
    maxFiles: 1,
    disabled: isUploading,
  });

  const formatSpeed = (bytesPerSec: number): string => {
    if (bytesPerSec > 1024 * 1024) return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
    if (bytesPerSec > 1024) return `${(bytesPerSec / 1024).toFixed(0)} KB/s`;
    return `${bytesPerSec.toFixed(0)} B/s`;
  };

  const formatEta = (seconds: number): string => {
    if (seconds < 60) return `${Math.ceil(seconds)}s restantes`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.ceil(seconds % 60);
    return `${mins}m ${secs}s restantes`;
  };

  const displayError = error || uploadError;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Dropzone */}
      {!selectedFile && (
        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-card p-12 text-center cursor-pointer
            transition-all duration-300 group
            ${isDragActive
              ? 'border-brand-blue bg-brand-blue/5 scale-[1.02]'
              : 'border-border hover:border-brand-blue/50 hover:bg-bg-secondary/50'
            }
          `}
        >
          <input {...getInputProps()} />

          <div className="flex flex-col items-center gap-4">
            <div className={`
              p-5 rounded-full bg-bg-tertiary group-hover:bg-brand-blue/10 transition-all duration-300
              ${isDragActive ? 'bg-brand-blue/10 scale-110' : ''}
            `}>
              <Upload className={`
                w-10 h-10 transition-colors duration-300
                ${isDragActive ? 'text-brand-blue' : 'text-text-secondary group-hover:text-brand-blue'}
              `} />
            </div>

            <div>
              <p className="text-lg font-heading font-semibold text-text-primary mb-1">
                {isDragActive ? 'Solte o vídeo aqui' : 'Arraste seu vídeo ou clique para selecionar'}
              </p>
              <p className="text-sm text-text-secondary">
                Formatos aceitos: MP4, MOV, AVI — Até 10 minutos
              </p>
            </div>

            <div className="flex gap-2 mt-2">
              <Badge variant="blue"><FileVideo className="w-3 h-3 mr-1" /> MP4</Badge>
              <Badge variant="blue"><Film className="w-3 h-3 mr-1" /> MOV</Badge>
              <Badge variant="blue"><Film className="w-3 h-3 mr-1" /> AVI</Badge>
            </div>
          </div>
        </div>
      )}

      {/* Preview do vídeo selecionado */}
      {selectedFile && videoMeta && (
        <Card className="animate-slide-up">
          <div className="space-y-4">
            {previewUrl && (
              <video
                src={previewUrl}
                className="w-full rounded-btn bg-black aspect-video object-contain"
                controls={false}
                muted
                playsInline
                onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                onMouseLeave={(e) => {
                  const v = e.target as HTMLVideoElement;
                  v.pause();
                  v.currentTime = 0;
                }}
              />
            )}

            <div className="flex items-center justify-between">
              <div>
                <p className="font-heading font-semibold text-text-primary truncate max-w-xs">
                  {selectedFile.name}
                </p>
                <div className="flex items-center gap-4 mt-1 text-sm text-text-secondary">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDuration(videoMeta.duration)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MonitorPlay className="w-3.5 h-3.5" />
                    {videoMeta.width}×{videoMeta.height}
                  </span>
                  <span className="flex items-center gap-1">
                    <HardDrive className="w-3.5 h-3.5" />
                    {formatFileSize(selectedFile.size)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedFile(null);
                  setVideoMeta(null);
                  setPreviewUrl(null);
                  setError(null);
                  reset();
                }}
                className="text-sm text-text-secondary hover:text-error transition-colors"
              >
                Remover
              </button>
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">
                    Enviando... {total > 0 && (
                      <span className="text-text-secondary/60">
                        {formatFileSize(loaded)} / {formatFileSize(total)}
                      </span>
                    )}
                  </span>
                  <span className="text-brand-light font-medium">{progress}%</span>
                </div>
                <ProgressBar value={progress} />
                {speed > 0 && (
                  <div className="flex justify-between text-xs text-text-secondary">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-brand-neon" />
                      {formatSpeed(speed)}
                    </span>
                    <span>{formatEta(eta)}</span>
                  </div>
                )}
              </div>
            )}

            {!isUploading && (
              <Button
                glow
                size="lg"
                className="w-full"
                onClick={handleUpload}
              >
                <Sparkles className="w-5 h-5" />
                Processar com IA
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Erro */}
      {displayError && (
        <div className="p-4 rounded-card bg-error/10 border border-error/20 text-error text-sm text-center animate-fade-in">
          {displayError}
        </div>
      )}
    </div>
  );
}
