import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const homeApiUrl = process.env.API_URL?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  async rewrites() {
    if (!homeApiUrl) return [];
    return [
      { source: "/api/health", destination: `${homeApiUrl}/api/health` },
      { source: "/api/me", destination: `${homeApiUrl}/api/me` },
      { source: "/api/export", destination: `${homeApiUrl}/api/export` },
      { source: "/api/import", destination: `${homeApiUrl}/api/import` },
      {
        source: "/api/auth/:path*",
        destination: `${homeApiUrl}/api/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
