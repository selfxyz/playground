import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  },
  webpack: (config, { isServer }) => {
    // Fix for packages that use 'document' in server context
    if (isServer) {
      config.externals = [...(config.externals || []), '@selfxyz/qrcode'];
    }
    
    return config;
  }
};

export default nextConfig;
