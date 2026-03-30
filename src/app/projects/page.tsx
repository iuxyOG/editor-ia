'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus, Clock, Trash2, Play, Film, Loader2, AlertCircle,
  Check, FolderOpen, ArrowUpDown,
} from 'lucide-react';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import * as apiClient from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { formatDuration } from '@/utils/format';
import { cn } from '@/utils/cn';

interface ProjectListItem {
  id: string;
  name: string;
  videoUrl: string;
  videoName: string;
  videoDuration: number;
  thumbnailUrl: string | null;
  status: string;
  outputUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'blue' | 'success' | 'error' | 'warning' | 'default'; icon: React.ReactNode }> = {
  uploading: { label: 'Enviando', variant: 'blue', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  processing: { label: 'Processando', variant: 'blue', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  ready: { label: 'Pronto', variant: 'success', icon: <Check className="w-3 h-3" /> },
  failed: { label: 'Falhou', variant: 'error', icon: <AlertCircle className="w-3 h-3" /> },
};

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'agora mesmo';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `há ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `há ${days}d`;
  return new Date(date).toLocaleDateString('pt-BR');
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [deleteTarget, setDeleteTarget] = useState<ProjectListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const data = await apiClient.listProjects({
        status: filter !== 'all' ? filter : undefined,
        sort: sortOrder,
      });
      setProjects(Array.isArray(data) ? data : []);
    } catch {
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, [filter, sortOrder]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiClient.deleteProject(deleteTarget.id);
      setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    } catch {
      // silently fail
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const filters = [
    { id: 'all', label: 'Todos' },
    { id: 'processing', label: 'Processando' },
    { id: 'ready', label: 'Prontos' },
    { id: 'failed', label: 'Falhou' },
  ];

  return (
    <div className="min-h-screen">
      <Header />

      <main className="pt-24 pb-12 px-6 max-w-6xl mx-auto">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="font-heading text-3xl font-bold text-text-primary">
              Meus Projetos
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              {projects.length} projeto{projects.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Link href="/">
            <Button glow>
              <Plus className="w-4 h-4" /> Novo Projeto
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between mb-6 animate-slide-up">
          <div className="flex gap-1 p-1 bg-bg-secondary rounded-card border border-border">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  'px-4 py-2 rounded-btn text-sm font-medium transition-all',
                  filter === f.id
                    ? 'bg-brand-blue text-white'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setSortOrder((s) => s === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowUpDown className="w-4 h-4" />
            {sortOrder === 'desc' ? 'Mais recente' : 'Mais antigo'}
          </button>
        </div>

        {/* Projects grid */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="glass-card p-4">
                <Skeleton className="w-full h-36 mb-3" />
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && projects.length === 0 && (
          <div className="text-center py-24 animate-fade-in">
            <FolderOpen className="w-16 h-16 text-text-secondary/30 mx-auto mb-4" />
            <h2 className="font-heading text-xl font-bold text-text-primary mb-2">
              Nenhum projeto ainda
            </h2>
            <p className="text-text-secondary mb-6">
              Suba seu primeiro vídeo e deixe a IA fazer a mágica
            </p>
            <Link href="/">
              <Button glow size="lg">
                <Plus className="w-5 h-5" /> Criar primeiro projeto
              </Button>
            </Link>
          </div>
        )}

        {!isLoading && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project, i) => {
              const statusCfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.processing;

              return (
                <Link
                  key={project.id}
                  href={`/editor/${project.id}`}
                  className="glass-card overflow-hidden group hover:border-brand-blue/30 hover:scale-[1.02] transition-all duration-300 animate-slide-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {/* Thumbnail */}
                  <div className="relative w-full h-36 bg-bg-tertiary flex items-center justify-center overflow-hidden">
                    {project.thumbnailUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={project.thumbnailUrl}
                        alt={project.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <Film className="w-10 h-10 text-text-secondary/30" />
                    )}

                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                      <Play className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    {/* Status badge */}
                    <div className="absolute top-2 left-2">
                      <Badge variant={statusCfg.variant} className="flex items-center gap-1">
                        {statusCfg.icon} {statusCfg.label}
                      </Badge>
                    </div>

                    {/* Duration */}
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/70 text-white/90">
                      {formatDuration(project.videoDuration)}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-heading font-semibold text-text-primary text-sm truncate mb-1">
                      {project.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-secondary flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeAgo(project.createdAt)}
                      </span>

                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDeleteTarget(project);
                        }}
                        className="p-1.5 text-text-secondary hover:text-error rounded-btn hover:bg-error/10 transition-colors opacity-0 group-hover:opacity-100"
                        title="Deletar projeto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Deletar Projeto"
      >
        <div className="space-y-4">
          <p className="text-text-secondary text-sm">
            Tem certeza que deseja deletar <strong className="text-text-primary">&quot;{deleteTarget?.name}&quot;</strong>?
            Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-3">
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleDelete}
              loading={isDeleting}
            >
              <Trash2 className="w-4 h-4" /> Deletar
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setDeleteTarget(null)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
