import type { NextConfig } from "next";

const ROUNDCUBE_URL = process.env.NEXT_PUBLIC_ROUNDCUBE_URL ?? '';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: 'https://o4wb-xcdb-nu1f.gw-1a.dockhost.net/:path*',
      },
    ];
  },
  async headers() {
    if (!ROUNDCUBE_URL) return [];
    return [
      {
        // Разрешаем загрузку Roundcube в iframe с нашего сайта
        source: '/mail',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `frame-src 'self' ${ROUNDCUBE_URL}`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
