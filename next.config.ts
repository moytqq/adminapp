import type { NextConfig } from "next";

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
};

export default nextConfig;
