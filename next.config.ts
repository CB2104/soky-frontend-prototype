import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.SOKY_NEXT_DIST_DIR ?? ".next",
  allowedDevOrigins: ["192.168.0.2"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
