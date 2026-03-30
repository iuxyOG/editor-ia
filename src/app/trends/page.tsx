'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, TrendingUp, Play, ExternalLink, Flame, Filter } from 'lucide-react';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/utils/cn';
import type { TrendVideo } from '@/types';

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  instagram: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  youtube: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function TrendsPage() {
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState<string | null>(null);
  const [results, setResults] = useState<TrendVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchResults = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (platform) params.set('platform', platform);
      const res = await fetch(`/api/trends?${params}`);
      const data = await res.json();
      setResults(data.results);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, [query, platform]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  return (
    <div className="min-h-screen">
      <Header />

      <main className="pt-24 pb-12 px-6 max-w-5xl mx-auto">
        <div className="mb-8 animate-fade-in">
          <h1 className="font-heading text-3xl font-bold text-text-primary mb-2">
            <TrendingUp className="inline w-8 h-8 text-brand-blue mr-2" />
            Tendências de Vídeo
          </h1>
          <p className="text-text-secondary">
            Descubra os estilos de edição mais populares nas plataformas
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8 animate-slide-up">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Pesquisar tendências..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-3 bg-bg-secondary border border-border rounded-card text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand-blue/50"
            />
          </div>
          <div className="flex gap-2">
            {['Todos', 'TikTok', 'Instagram', 'YouTube'].map((p) => {
              const val = p === 'Todos' ? null : p.toLowerCase();
              return (
                <button
                  key={p}
                  onClick={() => setPlatform(val)}
                  className={cn(
                    'px-4 py-3 rounded-card text-sm font-medium transition-all',
                    platform === val
                      ? 'bg-brand-blue text-white'
                      : 'bg-bg-secondary text-text-secondary hover:text-text-primary border border-border'
                  )}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading &&
            [1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <Skeleton className="w-full h-40 mb-3" />
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </Card>
            ))}

          {!isLoading &&
            results.map((video) => (
              <Card key={video.id} hover className="animate-slide-up">
                <div className="relative w-full h-40 rounded-btn bg-bg-tertiary mb-3 flex items-center justify-center overflow-hidden group">
                  <Play className="w-10 h-10 text-text-secondary group-hover:text-brand-blue transition-colors" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <Badge
                    className={cn(
                      'absolute top-2 left-2',
                      PLATFORM_COLORS[video.platform]
                    )}
                  >
                    {video.platform}
                  </Badge>
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 text-xs text-white/80">
                    <TrendingUp className="w-3 h-3" /> {video.views}
                  </div>
                </div>

                <h3 className="font-heading font-semibold text-text-primary text-sm mb-1 line-clamp-2">
                  {video.title}
                </h3>

                <p className="text-xs text-text-secondary mb-3 line-clamp-2">
                  {video.editingStyle}
                </p>

                <button className="flex items-center gap-1 text-xs text-brand-light hover:text-brand-glow transition-colors">
                  <ExternalLink className="w-3 h-3" />
                  Usar este estilo
                </button>
              </Card>
            ))}
        </div>

        {!isLoading && results.length === 0 && (
          <div className="text-center py-16">
            <Filter className="w-12 h-12 text-text-secondary mx-auto mb-4" />
            <p className="text-text-secondary">Nenhum resultado encontrado</p>
          </div>
        )}
      </main>
    </div>
  );
}
