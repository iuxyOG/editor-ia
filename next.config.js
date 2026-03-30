/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: [
      '@remotion/renderer',
      '@remotion/bundler',
      '@remotion/cli',
      'fluent-ffmpeg',
      '@ffmpeg-installer/ffmpeg',
      '@prisma/client',
    ],
    serverActions: {
      bodySizeLimit: '500mb',
    },
  },
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    },
  ],
  webpack: (config, { isServer }) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    });

    // Externalizar módulos Remotion e ffmpeg do webpack no servidor
    if (isServer) {
      config.externals.push(
        '@remotion/bundler',
        '@remotion/renderer',
        '@remotion/cli',
        'esbuild',
        'fluent-ffmpeg',
        '@ffmpeg-installer/ffmpeg',
        'better-sqlite3',
        '@libsql/client',
        '@prisma/adapter-libsql',
      );
    }

    return config;
  },
};

module.exports = nextConfig;
