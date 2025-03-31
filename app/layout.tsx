import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { PrivacyConsent } from '@/components/privacy-consent'
import { SchemaMarkup, generateOrganizationSchema, generateWebsiteSchema } from '@/components/schema-markup'

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

const websiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://freewallpapers.io'

export const defaultMetadata = {
  title: 'Free Wallpapers | High-Quality Wallpapers for Desktop, Mobile & Tablets',
  description: 'Discover and download high-quality wallpapers for your desktop, laptop, tablet, or mobile device. Free for personal use.',
  creator: 'FreeWallpapers Team',
};

export const metadata: Metadata = {
  ...defaultMetadata,
  metadataBase: new URL(websiteUrl),
  openGraph: {
    title: defaultMetadata.title,
    description: defaultMetadata.description,
    type: 'website',
    url: websiteUrl,
    siteName: 'Free Wallpapers',
    images: [
      {
        url: `${websiteUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Free Wallpapers',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: defaultMetadata.title,
    description: defaultMetadata.description,
    creator: '@freewallpapers',
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
      <body suppressHydrationWarning className={`${inter.variable} ${outfit.variable} font-sans antialiased min-h-screen bg-background text-foreground`}>
        <Providers>
          {/* Schema.org markup for better SEO */}
          <SchemaMarkup
            type="Organization"
            data={generateOrganizationSchema({
              name: 'Free Wallpapers',
              url: websiteUrl,
              logo: `${websiteUrl}/logo.png`,
              description: 'Discover and use high-quality wallpapers for your devices. Free collection of wallpapers for various screen sizes and use cases.',
              sameAs: [
                'https://twitter.com/freewallpapers',
                'https://instagram.com/freewallpapers'
              ]
            })}
          />
          <SchemaMarkup
            type="WebSite"
            data={generateWebsiteSchema({
              name: 'Free Wallpapers',
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

