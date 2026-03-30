import { NextRequest, NextResponse } from 'next/server';

// Gera um SVG placeholder para ilustrações
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url);
  const style = searchParams.get('style') || 'flat';
  const prompt = searchParams.get('prompt') || 'Ilustração';

  const colors: Record<string, { bg: string; fg: string; accent: string }> = {
    flat: { bg: '#1A1A2E', fg: '#3B82F6', accent: '#818CF8' },
    realistic: { bg: '#12121A', fg: '#60A5FA', accent: '#2563EB' },
    cartoon: { bg: '#1E1E3A', fg: '#F59E0B', accent: '#EF4444' },
    minimalist: { bg: '#0F0F1A', fg: '#94A3B8', accent: '#F1F5F9' },
    watercolor: { bg: '#1A1A30', fg: '#818CF8', accent: '#60A5FA' },
    '3d-render': { bg: '#0A0A1F', fg: '#10B981', accent: '#3B82F6' },
  };

  const c = colors[style] || colors.flat;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${c.bg}"/>
        <stop offset="100%" style="stop-color:#0A0A0F"/>
      </linearGradient>
    </defs>
    <rect width="400" height="300" fill="url(#bg)" rx="12"/>
    <circle cx="200" cy="120" r="50" fill="${c.fg}" opacity="0.2"/>
    <circle cx="200" cy="120" r="30" fill="${c.fg}" opacity="0.4"/>
    <circle cx="200" cy="120" r="15" fill="${c.accent}" opacity="0.8"/>
    <rect x="80" y="190" width="240" height="4" rx="2" fill="${c.fg}" opacity="0.3"/>
    <rect x="120" y="205" width="160" height="4" rx="2" fill="${c.fg}" opacity="0.2"/>
    <text x="200" y="250" text-anchor="middle" font-family="sans-serif" font-size="12" fill="${c.fg}" opacity="0.6">
      ${decodeURIComponent(prompt).slice(0, 40)}
    </text>
    <text x="200" y="270" text-anchor="middle" font-family="sans-serif" font-size="10" fill="${c.accent}" opacity="0.4">
      Estilo: ${style}
    </text>
  </svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
