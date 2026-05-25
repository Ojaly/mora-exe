import type { NextConfig } from "next";

// Static export only for Tauri production builds (npm run build:tauri).
// Regular `npm run build` keeps the full Next.js server so API routes work.
const isTauriBuild = process.env.NEXT_OUTPUT === "export";

const nextConfig: NextConfig = {
  ...(isTauriBuild
    ? { output: "export", distDir: "out", images: { unoptimized: true } }
    : {}),
};

export default nextConfig;
