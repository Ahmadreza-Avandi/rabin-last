/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  output: 'standalone',
  basePath: '/rabin-voice',
  assetPrefix: '/rabin-voice',
};

module.exports = nextConfig;
