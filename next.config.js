/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'firebasestorage.googleapis.com',
      'lh3.googleusercontent.com', // For Google user profile images
      'pub-ab54ca2d01df4886aa0c3f240ace806d.r2.dev', // R2 public domain
      'ab54ca2d01df4886aa0c3f240ace806d.r2.cloudflarestorage.com', // R2 private domain
      'r2.cloudflarestorage.com',
      'r2.dev',
    ],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      // Tool pages
      {
        source: '/text-humanizer',
        destination: '/',
        permanent: false,
      },
      {
        source: '/image-to-prompt',
        destination: '/',
        permanent: false,
      },
      {
        source: '/backstory',
        destination: '/',
        permanent: false,
      },
      {
        source: '/tools',
        destination: '/',
        permanent: false,
      },
      // API endpoints
      {
        source: '/api/humanizer-route/:path*',
        destination: '/api/404',
        permanent: false,
      },
      {
        source: '/api/upload/:path*',
        destination: '/api/404',
        permanent: false,
      },
      {
        source: '/api/backstory-route/:path*',
        destination: '/api/404',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig 