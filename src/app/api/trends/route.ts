import { NextRequest, NextResponse } from 'next/server';
import { searchTrends, getTrendingNow } from '@/lib/trends';
import { fetchYouTubeTrending } from '@/lib/youtube';
import { hasYouTubeKey } from '@/lib/env';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const platform = searchParams.get('platform') as 'tiktok' | 'instagram' | 'youtube' | null;

    // Tentar YouTube API real primeiro
    if (hasYouTubeKey() && (!platform || platform === 'youtube')) {
      const ytResults = await fetchYouTubeTrending(query || undefined);
      if (ytResults.length > 0) {
        // Se tem outras plataformas selecionadas, mesclar com mock
        if (!platform) {
          const mockResults = await searchTrends(query, undefined);
          const combined = [
            ...ytResults,
            ...mockResults.filter((m) => m.platform !== 'youtube'),
          ];
          return NextResponse.json({ results: combined, type: query ? 'search' : 'trending' });
        }
        return NextResponse.json({ results: ytResults, type: query ? 'search' : 'trending' });
      }
    }

    // Fallback para dados mock
    if (!query && !platform) {
      const trending = await getTrendingNow();
      return NextResponse.json({ results: trending, type: 'trending' });
    }

    const results = await searchTrends(query, platform || undefined);
    return NextResponse.json({ results, type: 'search' });
  } catch (error) {
    logger.error('Trends error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Falha ao buscar tendências' }, { status: 500 });
  }
}
