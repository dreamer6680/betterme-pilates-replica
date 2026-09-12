import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image-service.betterme.world",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
