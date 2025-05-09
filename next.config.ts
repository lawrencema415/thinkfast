import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,

  images: {
    // explicitly allow the domain (i.scdn.co)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.scdn.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.example.com',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Important for Socket.IO to work properly
    if (!isServer) {
      config.externals = [...(config.externals || []), 'bufferutil', 'utf-8-validate'];
    }
    return config;
  },
};

export default nextConfig;
