const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_SELF_ENV: process.env.SELF_ENV ?? '',
    NEXT_PUBLIC_SELF_VERIFY_ENDPOINT_OVERRIDE:
      process.env.SELF_VERIFY_ENDPOINT_OVERRIDE ?? '',
  },
  compiler: {
    styledComponents: true,
  },
  webpack: (config, { isServer }) => {
    // Fix for packages that use 'document' in server context
    if (isServer) {
      config.externals = [...(config.externals || []), '@selfxyz/qrcode'];
    }

    return config;
  },
};

export default nextConfig;
