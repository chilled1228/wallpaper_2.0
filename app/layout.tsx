import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { PrivacyConsent } from '@/components/privacy-consent'
import { SchemaMarkup, generateOrganizationSchema, generateWebsiteSchema } from '@/components/schema-markup'
import Script from 'next/script'

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  display: 'swap',
})

const outfit = Outfit({ 
  subsets: ['latin'], 
  variable: '--font-outfit',
  display: 'swap',
})

const websiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://getwallpapersfree.com'

export const defaultMetadata = {
  title: 'GetWallpapersFree | High-Quality Wallpapers for Personal Use Only',
  description: 'Discover and download high-quality AI-generated wallpapers for your desktop, laptop, tablet, or mobile device. For personal use only.',
  creator: 'GetWallpapersFree',
};

export const metadata: Metadata = {
  ...defaultMetadata,
  metadataBase: new URL(websiteUrl),
  openGraph: {
    title: defaultMetadata.title,
    description: defaultMetadata.description,
    type: 'website',
    url: websiteUrl,
    siteName: 'GetWallpapersFree',
    images: [
      {
        url: `${websiteUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Personal AI Wallpapers',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: defaultMetadata.title,
    description: defaultMetadata.description,
    creator: '@getwallpapersfree',
    images: [`${websiteUrl}/twitter-image.jpg`],
  },
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=5',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <head>
        {/* Google AdSense code will go here after approval */}
        {process.env.NEXT_PUBLIC_ADSENSE_ID && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_ID}`}
            strategy="afterInteractive"
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body suppressHydrationWarning className={`${inter.variable} ${outfit.variable} font-sans antialiased min-h-screen bg-background text-foreground`}>
        <Providers>
          {/* Schema.org markup for better SEO */}
          <SchemaMarkup
            type="Organization"
            data={generateOrganizationSchema({
              name: 'GetWallpapersFree',
              url: websiteUrl,
              logo: `${websiteUrl}/logo.png`,
              description: 'Discover and use high-quality AI-generated wallpapers for your devices. Free collection of wallpapers for personal use only.',
              sameAs: [
                'https://twitter.com/getwallpapersfree',
                'https://instagram.com/getwallpapersfree'
              ]
            })}
          />
          <SchemaMarkup
            type="WebSite"
            data={generateWebsiteSchema({
              name: 'GetWallpapersFree',
              url: websiteUrl,
              description: defaultMetadata.description as string,
              potentialAction: [{
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: `${websiteUrl}/search?q={search_term_string}`
                },
                'query-input': 'required name=search_term_string'
              }]
            })}
          />
          <div className="relative flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1 px-4 sm:px-6 lg:px-8 py-2 sm:py-4 md:py-6 safe-padding-bottom">
              {children}
            </main>
            <Footer />
            <PrivacyConsent />
          </div>
        </Providers>
      </body>
    </html>
  )
}

