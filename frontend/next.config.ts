import type { NextConfig } from "next";

// Proxy semua /api/* ke backend FastAPI (instaloader + yt-dlp).
const BACKEND = process.env.BACKEND_URL || "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND}/api/:path*` }];
  },
  images: { unoptimized: true },
};

export default nextConfig;
