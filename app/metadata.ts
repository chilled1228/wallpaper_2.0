import { Metadata } from 'next'

export const defaultMetadata: Metadata = {
  title: 'Free Wallpapers - High Quality Wallpapers for Your Devices',
  description: 'Discover and use high-quality wallpapers for your devices. Free collection of wallpapers for various screen sizes and use cases.',
  keywords: ['wallpapers', 'free wallpapers', 'HD wallpapers', 'device wallpapers', 'wallpaper collection'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://freewallpapers.com',
    siteName: 'Free Wallpapers',
    title: 'Free Wallpapers - High Quality Wallpapers for Your Devices',
    description: 'Discover and use high-quality wallpapers for your devices. Free collection of wallpapers for various screen sizes and use cases.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Free Wallpapers',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Wallpapers - High Quality Wallpapers for Your Devices',
    description: 'Discover and use high-quality wallpapers for your devices. Free collection of wallpapers for various screen sizes and use cases.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
} 