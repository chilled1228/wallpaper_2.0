'use client'

import { useState, useEffect, useMemo } from 'react'
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
import { useDebounce } from 'use-debounce'

interface Wallpaper {
  id: string
  title: string
  description: string
  category: string
  imageUrl: string
  createdAt: string
  slug: string
  promptText?: string
  isPublic?: boolean
  status?: 'active' | 'draft' | 'archived'
  price?: number
  favorites?: number
  views?: number
  featured?: boolean
  createdBy?: string
  updatedAt?: string
  version?: number
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
  const [debouncedQuery] = useDebounce(searchQuery, 300)
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [categories, setCategories] = useState<string[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [indexError, setIndexError] = useState<string | null>(null)
  
  // Fetch wallpapers from Firestore
  useEffect(() => {
    async function fetchWallpapers() {
      try {
        console.log('Fetching wallpapers from wallpapers collection')
        const wallpapersRef = collection(db, 'wallpapers')
        
        let querySnapshot;
        
        try {
          // Try query with composite index first
          const indexedQuery = query(
            wallpapersRef,
            where('isPublic', '==', true),
            orderBy('createdAt', 'desc'),
            limit(20)
          )
          
          querySnapshot = await getDocs(indexedQuery)
          console.log('Using indexed query successfully')
        } catch (error: any) {
          // If index error, fall back to simpler query and store the error
          if (error.message && error.message.includes('index')) {
            console.log('Falling back to simpler query due to missing index')
            setIndexError(error.message)
            
            // Simple query without filters
            const simpleQuery = query(
              wallpapersRef,
              orderBy('createdAt', 'desc'),
              limit(20)
            )
            
            querySnapshot = await getDocs(simpleQuery)
          } else {
            // If not an index error, rethrow
            throw error
          }
        }
        
        console.log(`Query returned ${querySnapshot.size} documents`)
        
        const wallpapersList: Wallpaper[] = []
        const categoriesSet = new Set<string>()
        
        querySnapshot.forEach(doc => {
          const data = doc.data() as Omit<Wallpaper, 'id'>
          
          // If using the simpler query, we need to filter on the client
          const shouldInclude = !indexError || data.isPublic !== false
          
          if (shouldInclude) {
            wallpapersList.push({
              id: doc.id,
              ...data
            })
            
            if (data.category) {
              categoriesSet.add(data.category)
            }
          }
        })
        
        console.log(`Processed ${wallpapersList.length} wallpapers`)
        setWallpapers(wallpapersList)
        setCategories(Array.from(categoriesSet))
      } catch (error) {
        console.error('Error fetching wallpapers:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchWallpapers()
  }, [])

  const filteredWallpapers = useMemo(() => {
    console.log('Filtering wallpapers:', wallpapers.length);
    return wallpapers.filter(wallpaper => {
      // Filter by search term
      const matchesSearch = 
        !debouncedQuery ||
        wallpaper.title?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        wallpaper.description?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        wallpaper.category?.toLowerCase().includes(debouncedQuery.toLowerCase());
      
      // Filter by selected category
      const matchesCategory = !activeCategory || wallpaper.category === activeCategory;
      
      // Only show active wallpapers
      const isActive = wallpaper.status === 'active' || wallpaper.status === undefined;
      
      return matchesSearch && matchesCategory && isActive;
    });
  }, [wallpapers, debouncedQuery, activeCategory]);

  return (
    <>
      {/* Search and Filter Bar */}
      <div className="w-full max-w-3xl mx-auto mb-6 sm:mb-8 lg:mb-12">
        <div className="bg-background/40 backdrop-blur-xl rounded-xl border border-primary/10 shadow-sm p-4 md:p-6">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 sm:w-5 sm:h-5 transition-colors" />
            <Input
              type="text"
              placeholder="Search wallpapers..."
              className="pl-10 sm:pl-12 h-10 sm:h-12 bg-background/60 border-primary/10 hover:border-primary/30 focus:border-primary/50 rounded-lg transition-all text-sm sm:text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search wallpapers"
            />
          </div>
          
          {indexError && (
            <div className="mb-4 p-3 text-xs border border-amber-200 bg-amber-50 text-amber-800 rounded-md">
              <p>Using fallback query due to missing Firestore index.</p>
              <p className="mt-1">
                <a 
                  href={indexError.match(/(https:\/\/console\.firebase\.google\.com\S+)/)?.[1] || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline font-medium"
                >
                  Click here to create the index
                </a>
                {' '}for better performance.
              </p>
            </div>
          )}
          
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
                  className="rounded-lg text-xs sm:text-sm h-8 touch-target"
                  onClick={() => setActiveCategory(null)}
                >
                  All
                </Button>
                {categories.map(category => (
                  <Button
                    key={category}
                    variant={activeCategory === category ? "default" : "outline"}
                    size="sm"
                    className="rounded-lg text-xs sm:text-sm h-8 touch-target"
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
      <div className="w-full">
        <div className="responsive-grid">
          {isLoading ? (
            <>
              {Array.from({ length: 8 }).map((_, index) => (
                <WallpaperCardSkeleton key={index} />
              ))}
            </>
          ) : filteredWallpapers.length > 0 ? (
            filteredWallpapers.map((wallpaper) => (
              <Link
                key={wallpaper.slug || wallpaper.id}
                href={`/wallpapers/${wallpaper.slug || wallpaper.id}`}
                className="group h-full"
              >
                <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-background/60 backdrop-blur-xl border-primary/10 rounded-xl h-full flex flex-col">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {wallpaper.imageUrl ? (
                      <NextImage
                        src={wallpaper.imageUrl}
                        alt={wallpaper.title || 'Wallpaper'}
                        fill={true}
                        className="object-cover transition-all duration-500 group-hover:scale-110"
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        priority={false}
                        loading="lazy"
                        blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzIwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmNWY5Ii8+PC9zdmc+"
                        placeholder="blur"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-muted/30" />
                    )}
                    <div className="absolute top-3 right-3 z-20">
                      <Badge variant="secondary" className="bg-primary/80 text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-xs">
                        {wallpaper.category || 'Uncategorized'}
                      </Badge>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 z-20 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2 text-white text-xs sm:text-sm">
                          <div className="flex items-center">
                            <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5" />
                            <span>{wallpaper.favorites || 0}</span>
                          </div>
                          <div className="h-3 w-px bg-white/30" />
                          <div className="flex items-center">
                            <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 md:p-5 flex-1 flex flex-col">
                    <h3 className="text-sm sm:text-base font-medium mb-1 sm:mb-2 group-hover:text-primary transition-colors duration-300 line-clamp-1">
                      {wallpaper.title || 'Untitled Wallpaper'}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground/80 line-clamp-2 flex-1">
                      {wallpaper.description || 'Beautiful high-resolution wallpaper'}
                    </p>
                    <div className="flex justify-between items-center mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-primary/5">
                      <Badge variant="outline" className="text-xs bg-background border-primary/20">
                        {wallpaper.category || 'Misc'}
                      </Badge>
                      <div className="text-[10px] sm:text-xs text-muted-foreground flex items-center">
                        {wallpaper.views || 0} views
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center p-8 text-center">
              <p className="text-lg font-medium mb-2">No wallpapers found</p>
              <p className="text-muted-foreground mb-4 max-w-md">Try adjusting your search or filter criteria.</p>
              <Button variant="outline" onClick={() => {
                setSearchQuery('');
                setActiveCategory(null);
              }}>
                Reset filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  )
} 