import type { TrendVideo } from '@/types';

// Dados mock de tendências — em produção, integrar com APIs reais
const mockTrends: TrendVideo[] = [
  {
    id: '1',
    title: 'Como fazer edições virais em 2024',
    thumbnail: '/api/placeholder/320/180',
    views: '2.5M',
    platform: 'tiktok',
    editingStyle: 'Cortes rápidos, zoom dinâmico, legendas Hormozi style',
    url: '#',
  },
  {
    id: '2',
    title: 'Storytelling visual para Reels',
    thumbnail: '/api/placeholder/320/180',
    views: '890K',
    platform: 'instagram',
    editingStyle: 'Transições suaves, overlay de texto clean, filtro cinematográfico',
    url: '#',
  },
  {
    id: '3',
    title: 'Tutorial: Edição profissional no celular',
    thumbnail: '/api/placeholder/320/180',
    views: '1.2M',
    platform: 'youtube',
    editingStyle: 'Picture-in-picture, ilustrações vetoriais, legendas animadas',
    url: '#',
  },
  {
    id: '4',
    title: 'Tendência: Narração com IA + imagens geradas',
    thumbnail: '/api/placeholder/320/180',
    views: '3.1M',
    platform: 'tiktok',
    editingStyle: 'Voz IA, imagens full-screen geradas por IA, texto grande',
    url: '#',
  },
  {
    id: '5',
    title: 'Vlog editing masterclass',
    thumbnail: '/api/placeholder/320/180',
    views: '560K',
    platform: 'youtube',
    editingStyle: 'Multicâmera, B-roll, color grading, motion graphics',
    url: '#',
  },
  {
    id: '6',
    title: 'O segredo dos Reels que viralizam',
    thumbnail: '/api/placeholder/320/180',
    views: '4.7M',
    platform: 'instagram',
    editingStyle: 'Hook visual nos primeiros 3s, texto grande, emojis animados',
    url: '#',
  },
];

export async function searchTrends(
  query: string,
  platform?: 'tiktok' | 'instagram' | 'youtube'
): Promise<TrendVideo[]> {
  // Simular delay de rede
  await new Promise((resolve) => setTimeout(resolve, 800));

  let results = mockTrends;

  if (platform) {
    results = results.filter((t) => t.platform === platform);
  }

  if (query) {
    const q = query.toLowerCase();
    results = results.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.editingStyle.toLowerCase().includes(q)
    );
  }

  return results;
}

export async function getTrendingNow(): Promise<TrendVideo[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return mockTrends.slice(0, 4);
}
