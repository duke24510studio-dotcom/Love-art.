import type { NextConfig } from "next";

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
