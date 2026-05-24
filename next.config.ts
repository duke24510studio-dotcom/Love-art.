import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Serve generated poster images from /outputs/images via Next.js rewrites
  async rewrites() {
    return [
      {
        source: "/outputs/images/:file*",
        destination: "/api/static/:file*",
      },
    ];
  },
};

export default nextConfig;
