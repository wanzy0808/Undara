import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/invitations/qr": [
      "./assets/brand/fonts/*",
      "./public/assets/brand/undara/logo.webp",
      "./public/assets/landing/ornaments/botanical/branch-01.webp",
      "./public/assets/landing/ornaments/botanical/branch-04.webp",
      "./public/assets/landing/ornaments/botanical/branch-05.webp",
    ],
  },
  images: {
    qualities: [75, 80, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/photo-*",
      },
    ],
  },
};

export default nextConfig;
