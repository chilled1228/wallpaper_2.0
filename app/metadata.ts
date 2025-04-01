import { Metadata } from 'next'

export const defaultMetadata: Metadata = {
  title: 'GetWallpapersFree - High Quality Wallpapers for Personal Use',
  description: 'Discover and use high-quality wallpapers for your devices. Free collection of AI-generated wallpapers for personal use only.',
  keywords: ['wallpapers', 'free wallpapers', 'HD wallpapers', 'AI wallpapers', 'device wallpapers', 'wallpaper collection'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://getwallpapersfree.com',
    siteName: 'GetWallpapersFree',
    title: 'GetWallpapersFree - High Quality Wallpapers for Personal Use',
    description: 'Discover and use high-quality wallpapers for your devices. Free collection of AI-generated wallpapers for personal use only.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Personal AI Wallpapers',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GetWallpapersFree - High Quality Wallpapers for Personal Use',
    description: 'Discover and use high-quality wallpapers for your devices. Free collection of AI-generated wallpapers for personal use only.',
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