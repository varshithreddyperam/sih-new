export default {
  reactStrictMode: true,
  experimental: {
    appDir: true
  },
  webpack: (config, { isServer }) => {
    // Fix for ESM package 'supports-color' and 'debug' in dependencies
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "supports-color": false,
        "debug": false
      }
    }
    return config;
  }
};
