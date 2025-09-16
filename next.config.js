/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // بهینه‌سازی برای کاهش حجم
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'recharts',
      'date-fns'
    ],
  },
  // SWC minification
  swcMinify: true,
  // حذف source maps در production
  productionBrowserSourceMaps: false,
  // تنظیمات performance
  poweredByHeader: false,
  reactStrictMode: false,
  // کاهش حجم bundle
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Standalone output برای Docker
  output: 'standalone',
  webpack: (config, { isServer, dev }) => {
    // CommonJS support
    config.experiments = { ...config.experiments, topLevelAwait: true };

    // Production optimizations
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
          },
        },
      };
    }
    return config;
  },
  // Production optimizations
  swcMinify: true,
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  output: 'standalone'
};

export default nextConfig;