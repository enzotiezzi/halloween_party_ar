/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    esmExternals: false, // Required for MindAR
  },
  webpack: (config, { isServer }) => {
    // Handle MindAR dependencies
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      canvas: false,
    };
    
    // External libraries loaded via CDN
    if (!isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'mind-ar': 'MindAR',
        'three': 'THREE'
      });
    }
    
    return config;
  },
  async headers() {
    return [
      {
        // matching all API routes
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ]
      }
    ];
  },
};

module.exports = nextConfig;