import { Metadata } from 'next'
import { WallpaperGrid } from '@/components/wallpaper-grid'
import { db } from '@/lib/firebase'
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Latest Wallpapers | Wallpaper 2.0',
  description: 'Discover and download the newest and freshest wallpapers added to our collection.',
  openGraph: {
    title: 'Latest Wallpapers | Wallpaper 2.0',
    description: 'Discover and download the newest and freshest wallpapers added to our collection.',
    images: ['/og-latest.jpg'],
  },
}

export default function LatestPage() {
  return (
    <main className="container px-4 py-6 md:py-10 mx-auto max-w-7xl">
      <section className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Latest Wallpapers</h1>
        <p className="text-muted-foreground text-lg max-w-3xl">
          Browse our newest additions to find fresh and trending wallpapers for your devices.
        </p>
      </section>

      <section>
        <Suspense fallback={
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        }>
          <WallpaperGrid />
        </Suspense>
      </section>
    </main>
  )
} 