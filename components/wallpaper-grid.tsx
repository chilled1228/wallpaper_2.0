'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, getDocs, orderBy, limit, where } from 'firebase/firestore'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Download, Heart, Filter } from 'lucide-react'
import NextImage from 'next/image'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Wallpaper {
  id: string
  title: string
  description: string
  category: string
  imageUrl: string
  createdAt: string
  slug: string
  favorites?: number
  views?: number
}

function WallpaperCardSkeleton() {
  return (
    <Card className="overflow-hidden transition-all duration-300 bg-background/60 backdrop-blur-xl border-primary/10 shadow-sm rounded-xl h-full">
      <div className="aspect-[3/4] relative bg-gradient-to-br from-background/80 to-muted/50 overflow-hidden">
        <div className="absolute inset-0 animate-pulse bg-muted/50" />
      </div>
      <div className="p-5 space-y-3">
        <div className="w-20 h-5 rounded-full bg-muted/50 animate-pulse" />
        <div className="space-y-2">
          <div className="h-5 w-3/4 bg-muted/50 rounded animate-pulse" />
          <div className="h-4 w-full bg-muted/50 rounded animate-pulse" />
        </div>
      </div>
    </Card>
  )
}

export function WallpaperGrid() {
  const [searchQuery, setSearchQuery] = useState('')
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    const fetchWallpapers = async () => {
      try {
        // Fetch all wallpapers
        const wallpapersQuery = query(
          collection(db, 'prompts'), // Note: still using 'prompts' collection for backend compatibility
          orderBy('createdAt', 'desc')
        )
        const wallpapersSnapshot = await getDocs(wallpapersQuery)
        const wallpapersData = wallpapersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Wallpaper[]
        setWallpapers(wallpapersData)
        
        // Extract unique categories
        const uniqueCategories = Array.from(new Set(wallpapersData.map(w => w.category)))
        setCategories(uniqueCategories)
      } catch (error) {
        console.error('Error fetching wallpapers:', error)
        setError('Failed to load wallpapers')
      } finally {
        setIsLoading(false)
      }
    }

    fetchWallpapers()
  }, [])

  const filteredWallpapers = wallpapers.filter(wallpaper => {
    const matchesSearch = 
      wallpaper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wallpaper.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wallpaper.category.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = !activeCategory || wallpaper.category === activeCategory
    
    return matchesSearch && matchesCategory
  })

  return (
    <>
      {/* Search and Filter Bar */}
      <div className="max-w-3xl mx-auto mb-12 px-4">
        <div className="bg-background/40 backdrop-blur-xl rounded-xl border border-primary/10 shadow-sm p-4 md:p-6">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 transition-colors" />
            <Input
              type="text"
              placeholder="Search wallpapers by name, description or category..."
              className="pl-12 h-12 bg-background/60 border-primary/10 hover:border-primary/30 focus:border-primary/50 rounded-lg transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {categories.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-medium">Filter by Category</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={activeCategory === null ? "default" : "outline"}
                  size="sm"
                  className="rounded-lg text-sm"
                  onClick={() => setActiveCategory(null)}
                >
                  All
                </Button>
                {categories.map(category => (
                  <Button
                    key={category}
                    variant={activeCategory === category ? "default" : "outline"}
                    size="sm"
                    className="rounded-lg text-sm"
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Wallpapers Grid */}
      <div className="px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {isLoading ? (
            <>
              {Array.from({ length: 8 }).map((_, index) => (
                <WallpaperCardSkeleton key={index} />
              ))}
            </>
          ) : filteredWallpapers.length > 0 ? (
            filteredWallpapers.map((wallpaper) => (
              <Link
                key={wallpaper.slug}
                href={`/wallpapers/${wallpaper.slug}`}
                className="group h-full"
              >
                <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-background/60 backdrop-blur-xl border-primary/10 rounded-xl h-full flex flex-col">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <NextImage
                      src={wallpaper.imageUrl}
                      alt={wallpaper.title}
                      fill={true}
                      className="object-cover transition-all duration-500 group-hover:scale-110"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    />
                    <div className="absolute top-3 right-3 z-20">
                      <Badge variant="secondary" className="bg-primary/80 text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {wallpaper.category}
                      </Badge>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 z-20 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2 text-white text-sm">
                          <div className="flex items-center">
                            <Heart className="w-3.5 h-3.5 mr-1.5" />
                            <span>{wallpaper.favorites || 0}</span>
                          </div>
                          <div className="h-3 w-px bg-white/30" />
                          <div className="flex items-center">
                            <Download className="w-3.5 h-3.5 mr-1.5" />
                            <span>Download</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-base font-medium mb-2 group-hover:text-primary transition-colors duration-300 line-clamp-1">
                      {wallpaper.title}
                    </h3>
                    <p className="text-sm text-muted-foreground/80 line-clamp-2 flex-1">
                      {wallpaper.description}
                    </p>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-primary/5">
                      <Badge variant="outline" className="text-xs bg-background border-primary/20">
                        {wallpaper.category}
                      </Badge>
                      <div className="text-xs text-muted-foreground flex items-center">
                        <div className="w-3 h-3 mr-1">
                          <NextImage width={12} height={12} src="/icons/eye.svg" alt="Views" />
                        </div>
                        {wallpaper.views || 0}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-16 bg-background/60 backdrop-blur-xl rounded-xl border border-primary/10">
              <p className="text-muted-foreground text-lg">No wallpapers found matching your search.</p>
              {activeCategory && (
                <Button variant="outline" className="mt-4" onClick={() => setActiveCategory(null)}>
                  Clear Category Filter
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
} 