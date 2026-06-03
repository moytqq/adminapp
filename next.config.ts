import type { NextConfig } from "next";

// В Docker используется внутренний адрес контейнера (BACKEND_URL),
// в dev/локально — внешний gateway
const BACKEND_URL =
  process.env.BACKEND_URL || 'https://o4wb-xcdb-nu1f.gw-1a.dockhost.net';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: `${BACKEND_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
