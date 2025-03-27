import { Metadata } from 'next'
import { defaultMetadata } from './metadata'
import { Suspense } from "react"
import { Loader2, ChevronRight, Download, ArrowRight } from 'lucide-react'
import { WallpaperGrid } from '@/components/wallpaper-grid'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import NextImage from 'next/image'

// Generate metadata for SEO
export const metadata: Metadata = defaultMetadata

export default async function HomePage() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative w-full overflow-hidden bg-gradient-to-b from-background to-background/80 mb-16">
        <div className="absolute inset-0 opacity-10 blur-3xl pointer-events-none bg-gradient-to-r from-primary to-secondary"></div>
        
        <div className="container mx-auto px-4 py-12 md:py-20 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Stunning Wallpapers<br />for Every Device
                </h1>
                <p className="text-lg text-muted-foreground max-w-md">
                  Discover and download beautiful high-quality wallpapers for your desktop, laptop, tablet or mobile device.
                </p>
              </div>
              
              <div className="flex flex-wrap gap-4 pt-2">
                <Button asChild size="lg" className="rounded-xl">
                  <Link href="#explore">
                    Explore Collection <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-xl">
                  <Link href="/categories">
                    Browse Categories <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              
              <div className="flex items-center gap-2 pt-4 text-sm text-muted-foreground">
                <Download className="h-4 w-4 text-primary" />
                <span>Free downloads for personal use</span>
              </div>
            </div>
            
            <div className="lg:col-span-6 hidden md:block">
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden shadow-2xl shadow-primary/10 border border-primary/10 transform rotate-1 hover:rotate-0 transition-all duration-700">
                <NextImage
                  src="/featured-wallpaper.jpg"
                  alt="Featured Wallpaper"
                  fill={true}
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-70"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="px-3 py-1 bg-primary/90 text-primary-foreground text-xs font-medium rounded-full">Featured</span>
                  <h3 className="text-white font-medium mt-2 line-clamp-1">Featured Wallpaper of the Week</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Categories Section */}
      <section className="container mx-auto px-4 py-8 mb-16 max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Browse by Category</h2>
          <Button variant="ghost" asChild className="group">
            <Link href="/categories">
              View All <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </Button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {['Nature', 'Abstract', 'Minimal', 'Space', 'City', 'Technology'].map((category) => (
            <Link href={`/category/${category.toLowerCase()}`} key={category} className="group">
              <div className="relative bg-background/40 backdrop-blur-xl rounded-xl border border-primary/10 shadow-sm overflow-hidden aspect-square hover:shadow-md hover:border-primary/30 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-medium group-hover:text-white transition-colors duration-300">{category}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
      
      {/* Featured Wallpapers */}
      <section className="container mx-auto px-4 mb-16 max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Featured Wallpapers</h2>
          <Button variant="ghost" asChild className="group">
            <Link href="/featured">
              View All <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="group relative aspect-[4/3] rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="absolute top-3 right-3 px-2 py-1 bg-primary/90 text-primary-foreground text-xs font-medium rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">Featured</span>
              <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <h3 className="text-white font-medium line-clamp-1">Featured Wallpaper {i}</h3>
                <p className="text-white/80 text-sm mt-1 line-clamp-1">Beautiful high-resolution wallpaper</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* Recent Wallpapers - Full Width */}
      <section id="explore" className="container mx-auto px-4 py-8 mb-12 max-w-7xl">
        <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Latest Wallpapers</h2>
        
        <Suspense fallback={
          <div className="flex items-center justify-center h-[300px]">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        }>
          <WallpaperGrid />
        </Suspense>
      </section>
      
      {/* Newsletter/Download App CTA */}
      <section className="container mx-auto px-4 py-8 mb-12 max-w-7xl">
        <div className="bg-background/40 backdrop-blur-xl rounded-xl border border-primary/10 p-8 md:p-12 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Get Access to Premium Wallpapers</h2>
              <p className="text-muted-foreground">Subscribe to our newsletter and get access to exclusive wallpapers and early access to new collections.</p>
              <div className="flex gap-2 mt-4">
                <Button className="rounded-xl">Subscribe</Button>
                <Button variant="outline" className="rounded-xl">Learn More</Button>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="aspect-[16/9] rounded-lg overflow-hidden shadow-lg border border-primary/10">
                {/* Placeholder for app screenshot or newsletter image */}
                <div className="h-full w-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <span className="text-xl font-medium text-muted-foreground">Premium Wallpapers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

