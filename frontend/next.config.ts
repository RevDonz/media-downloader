import type { NextConfig } from "next";

// /api/* diproksi ke backend FastAPI oleh Route Handler:
//   src/app/api/[...path]/route.ts
// (lebih andal untuk streaming & request lama daripada rewrites — tanpa timeout ~30s).
const nextConfig: NextConfig = {
  images: { unoptimized: true },
};

export default nextConfig;
