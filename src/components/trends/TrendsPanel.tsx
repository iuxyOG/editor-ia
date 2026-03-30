'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, TrendingUp, Play, ExternalLink, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useEditorStore } from '@/hooks/useEditorStore';
import * as api from '@/lib/api';
import { cn } from '@/utils/cn';
import type { TrendVideo } from '@/types';

const PLATFORMS = [
  { id: null, label: 'Todos' },
  { id: 'tiktok' as const, label: 'TikTok' },
  { id: 'instagram' as const, label: 'Instagram' },
  { id: 'youtube' as const, label: 'YouTube' },
];

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  instagram: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  youtube: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export function TrendsPanel() {
  const { setCustomPrompt } = useEditorStore();
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState<'tiktok' | 'instagram' | 'youtube' | null>(null);
  const [results, setResults] = useState<TrendVideo[]>([]);
  const [trending, setTrending] = useState<TrendVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTrending = useCallback(async () => {
    try {
      const data = await api.searchTrends();
      setTrending(data.results);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchTrending();
  }, [fetchTrending]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    try {
      const data = await api.searchTrends(query, platform ?? undefined);
      setResults(data.results);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  };

  const useAsReference = (video: TrendVideo) => {
    setCustomPrompt(
      `Use como referência o estilo de edição: ${video.editingStyle}. Título do vídeo referência: "${video.title}".`
    );
  };

  const displayVideos = results.length > 0 ? results : trending;

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      {/* Search */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Pesquisar vídeos em alta sobre..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-9 pr-3 py-2.5 bg-bg-tertiary border border-border rounded-btn text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand-blue/50"
          />
        </div>

        <div className="flex gap-1.5">
          {PLATFORMS.map((p) => (
            <button
              key={p.label}
              onClick={() => setPlatform(p.id)}
              className={cn(
                'px-3 py-1.5 rounded-btn text-xs font-medium transition-all',
                platform === p.id
                  ? 'bg-brand-blue text-white'
                  : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 p-3 space-y-3">
        {results.length === 0 && trending.length > 0 && (
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4 text-warning" />
            <h4 className="text-xs font-heading font-semibold text-text-primary">
              Em Alta Agora
            </h4>
          </div>
        )}

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-24 h-16 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading &&
          displayVideos.map((video) => (
            <div
              key={video.id}
              className="glass-card p-3 hover:border-brand-blue/30 transition-all"
            >
              <div className="flex gap-3">
                <div className="relative w-24 h-16 rounded bg-bg-tertiary shrink-0 flex items-center justify-center">
                  <Play className="w-6 h-6 text-text-secondary" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary line-clamp-1">
                    {video.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      className={cn(
                        'text-[10px]',
                        PLATFORM_COLORS[video.platform]
                      )}
                    >
                      {video.platform}
                    </Badge>
                    <span className="text-[10px] text-text-secondary flex items-center gap-0.5">
                      <TrendingUp className="w-3 h-3" /> {video.views}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-text-secondary mt-2 line-clamp-2">
                {video.editingStyle}
              </p>

              <button
                onClick={() => useAsReference(video)}
                className="flex items-center gap-1 mt-2 text-xs text-brand-light hover:text-brand-glow transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Usar este estilo como referência
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}
