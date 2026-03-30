import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter (use Redis in production)
const rateLimits = new Map<string, { count: number; resetAt: number }>();

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const ROUTE_LIMITS: Record<string, RateLimitConfig> = {
  '/api/upload': { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3/hour
  '/api/transcribe': { maxRequests: 10, windowMs: 60 * 1000 }, // 10/min
  '/api/generate-illustrations': { maxRequests: 10, windowMs: 60 * 1000 },
  '/api/generate-image': { maxRequests: 10, windowMs: 60 * 1000 },
  '/api/pipeline/start': { maxRequests: 10, windowMs: 60 * 1000 },
  '/api/render': { maxRequests: 5, windowMs: 60 * 60 * 1000 }, // 5/hour
};

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}

function checkRateLimit(key: string, config: RateLimitConfig): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = rateLimits.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count++;
  return { allowed: true, retryAfter: 0 };
}

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimits) {
    if (now > entry.resetAt) rateLimits.delete(key);
  }
}, 5 * 60 * 1000);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only rate-limit API routes
  if (!pathname.startsWith('/api/')) {
    return addSecurityHeaders(NextResponse.next());
  }

  // Skip rate limiting for GET requests and SSE/status endpoints
  if (request.method === 'GET') {
    return addSecurityHeaders(NextResponse.next());
  }

  // Check rate limit for matching routes
  for (const [route, config] of Object.entries(ROUTE_LIMITS)) {
    if (pathname.startsWith(route)) {
      const ip = getClientIp(request);
      const key = `${ip}:${route}`;
      const { allowed, retryAfter } = checkRateLimit(key, config);

      if (!allowed) {
        return NextResponse.json(
          { error: 'Muitas requisições. Tente novamente mais tarde.' },
          {
            status: 429,
            headers: {
              'Retry-After': String(retryAfter),
              'X-RateLimit-Reset': String(retryAfter),
            },
          }
        );
      }
      break;
    }
  }

  return addSecurityHeaders(NextResponse.next());
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|uploads|outputs).*)',
  ],
};
