import type { TrendVideo } from '@/types';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// YouTube API response types (partial — only fields we use)
interface YTItem {
  id: string | { videoId?: string };
  snippet: {
    title: string;
    description: string;
    thumbnails?: {
      default?: { url: string };
      medium?: { url: string };
    };
  };
  statistics?: { viewCount?: string };
}

interface YTResponse {
  items?: YTItem[];
}

/**
 * Busca vídeos trending do YouTube
 */
export async function fetchYouTubeTrending(
  query?: string,
  maxResults: number = 6
): Promise<TrendVideo[]> {
  const apiKey = env.YOUTUBE_API_KEY;
  if (!apiKey) return [];

  try {
    let url: string;

    if (query) {
      // Busca por query
      url = `${YOUTUBE_API_BASE}/search?part=snippet&type=video&order=viewCount&q=${encodeURIComponent(query)}&maxResults=${maxResults}&key=${apiKey}`;
    } else {
      // Trending no Brasil
      url = `${YOUTUBE_API_BASE}/videos?part=snippet,statistics&chart=mostPopular&regionCode=BR&videoCategoryId=22&maxResults=${maxResults}&key=${apiKey}`;
    }

    const res = await fetch(url, { next: { revalidate: 300 } }); // Cache 5min
    if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);

    const data = await res.json();
    const items = data.items || [];

    // Se foi search, precisamos buscar statistics separadamente
    if (query && items.length > 0) {
      const ids = items.map((item: YTItem) => typeof item.id === 'string' ? item.id : item.id.videoId || '').join(',');
      const statsRes = await fetch(
        `${YOUTUBE_API_BASE}/videos?part=statistics&id=${ids}&key=${apiKey}`
      );
      const statsData = await statsRes.json();
      const statsMap = new Map(
        ((statsData as YTResponse).items || []).map((item: YTItem) => [typeof item.id === 'string' ? item.id : '', item.statistics])
      );

      return items.map((item: YTItem) => {
        const videoId = typeof item.id === 'string' ? item.id : item.id.videoId || '';
        const stats = statsMap.get(videoId) as YTItem['statistics'] | undefined;
        return {
          id: videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
          views: formatViews(Number(stats?.viewCount || 0)),
          platform: 'youtube' as const,
          editingStyle: inferEditingStyle(item.snippet.title, item.snippet.description),
          url: `https://youtube.com/watch?v=${videoId}`,
        };
      });
    }

    return items.map((item: YTItem) => ({
      id: typeof item.id === 'string' ? item.id : item.id.videoId || '',
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
      views: formatViews(Number(item.statistics?.viewCount || 0)),
      platform: 'youtube' as const,
      editingStyle: inferEditingStyle(item.snippet.title, item.snippet.description),
      url: `https://youtube.com/watch?v=${typeof item.id === 'string' ? item.id : item.id.videoId || ''}`,
    }));
  } catch (error) {
    logger.error('YouTube API error', { error: error instanceof Error ? error.message : String(error) });
    return [];
  }
}

function formatViews(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(0)}K`;
  return count.toString();
}

function inferEditingStyle(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();

  if (text.includes('shorts') || text.includes('reels') || text.includes('tiktok')) {
    return 'Formato vertical, cortes rápidos, legendas grandes, música trending';
  }
  if (text.includes('tutorial') || text.includes('como fazer') || text.includes('passo a passo')) {
    return 'Screencast, zoom em detalhes, legendas didáticas, transições suaves';
  }
  if (text.includes('vlog') || text.includes('rotina') || text.includes('dia a dia')) {
    return 'B-roll, color grading cinematográfico, música lo-fi, multicâmera';
  }
  if (text.includes('review') || text.includes('análise') || text.includes('opinião')) {
    return 'A-roll com inserts, gráficos, comparações side-by-side, thumbnail expressiva';
  }
  if (text.includes('podcast') || text.includes('entrevista') || text.includes('conversa')) {
    return 'Multicâmera, legendas animadas, cortes de reação, clipes curtos';
  }

  return 'Edição dinâmica, legendas estilizadas, transições modernas';
}
