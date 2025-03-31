/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      'firebasestorage.googleapis.com',
      'lh3.googleusercontent.com',
      'images.unsplash.com', // For placeholder images
      process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN?.replace(/^https?:\/\//, ''), // Cloudflare R2 domain without protocol
    ].filter(Boolean), // Filter out undefined values
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1440, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
  },
  experimental: {
    optimizeCss: true,
    serverActions: true,
  },
  // Improve Core Web Vitals
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  async rewrites() {
    return [
      {
        source: '/ui-test',
        destination: '/ui-test',
      },
    ]
  },
}

export default nextConfig;
