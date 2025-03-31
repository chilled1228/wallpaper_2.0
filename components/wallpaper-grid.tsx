'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, getDocs, orderBy, limit, where, startAfter, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Download, Heart, Filter, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useDebounce } from 'use-debounce'
import { ServerImage } from '@/components/ui/server-image'

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
  tags?: string[]
  r2ImageUrl?: string
}

function WallpaperCardSkeleton() {
  return (
    <Card className="overflow-hidden bg-background/60 backdrop-blur-xl border-primary/10 shadow-sm rounded-xl h-full">
      <div className="aspect-[3/4] relative bg-gradient-to-br from-background/80 to-muted/50 overflow-hidden">
        <div className="absolute inset-0 bg-muted/50" />
      </div>
      <div className="p-4 space-y-3">
        <div className="w-24 h-5 rounded-full bg-muted/50" />
        <div className="space-y-2">
          <div className="h-4 w-3/4 bg-muted/50 rounded" />
          <div className="h-4 w-full bg-muted/50 rounded" />
        </div>
      </div>
    </Card>
  )
}

// Shared blur data URL for low-quality placeholder
const blurDataURL = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzIwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmNWY5Ii8+PC9zdmc+";

// For TypeScript to recognize custom window properties
declare global {
  interface Window {
    hasLoggedR2Domain?: boolean;
  }
}

// Helper function to sanitize R2 URLs if needed
function sanitizeR2Url(url: string): string {
  if (!url) return url;
  
  try {
    // For local paths or already properly formed URLs, return as is
    if (url.startsWith('/') || (url.startsWith('https://') && !url.includes('.r2.dev'))) {
      return url;
    }
    
    // Check for Cloudflare R2 domain patterns
    const r2PublicDomain = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_DOMAIN;
    
    // Handle the case where URL might be missing protocol for R2
    if ((url.startsWith('pub-') && url.includes('.r2.dev')) || 
        (url.includes('.r2.dev') && !url.startsWith('http'))) {
      console.log('Adding protocol to R2 URL:', url);
      return `https://${url}`;
    }
    
    // Ensure R2 URLs use HTTPS
    if (url.includes('.r2.dev') && url.startsWith('http://')) {
      return url.replace('http://', 'https://');
    }
    
    // If we have a custom Cloudflare R2 domain and the URL doesn't use it,
    // but looks like an R2 path, try to prefix it
    if (r2PublicDomain && 
        !url.includes(r2PublicDomain) && 
        !url.includes('.r2.dev') && 
        !url.startsWith('http')) {
      if (!r2PublicDomain.endsWith('/') && !url.startsWith('/')) {
        return `https://${r2PublicDomain}/${url}`;
      } else if (r2PublicDomain.endsWith('/') && url.startsWith('/')) {
        return `https://${r2PublicDomain}${url.substring(1)}`;
      } else {
        return `https://${r2PublicDomain}${url}`;
      }
    }
    
    // If URL is already a full URL but not from R2, return as is
    if (url.startsWith('http')) {
      return url;
    }
    
    return url;
  } catch (e) {
    console.error('Error sanitizing URL:', e);
    return url;
  }
}

// Enhanced logic for detecting R2 images
function isR2Image(url: string): boolean {
  if (!url) return false;
  
  // Log only once in browser for debugging
  if (typeof window !== 'undefined' && !window.hasLoggedR2Domain) {
    const r2PublicDomain = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_DOMAIN;
    console.log('R2 public domain config:', r2PublicDomain);
    window.hasLoggedR2Domain = true;
  }
  
  // Check various Cloudflare patterns
  return url.includes('.r2.dev') || 
         url.includes('.cloudflarestorage.com') || 
         url.includes('cloudflare') ||
         (url.includes(process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_DOMAIN || '') && 
          process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_DOMAIN !== '');
}

// Helper function to validate URL
function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  
  // Handle local file paths that start with '/'
  if (url.startsWith('/')) {
    return true;
  }
  
  // Handle external URLs
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
}

// Helper function to get fallback image based on category or tags
function getFallbackImage(wallpaper: Wallpaper): string {
  const category = wallpaper.category?.toLowerCase() || '';
  const tags = wallpaper.tags || [];
  const title = wallpaper.title?.toLowerCase() || '';
  const description = wallpaper.description?.toLowerCase() || '';
  
  // Map categories/keywords to image paths
  const imageMap: Record<string, string> = {
    nature: '/category-nature.jpg',
    landscape: '/category-landscape.jpg',
    abstract: '/category-abstract.jpg',
    minimal: '/category-minimal.jpg',
    dark: '/category-dark.jpg',
    city: '/category-city.jpg',
    space: '/category-space.jpg',
    technology: '/category-tech.jpg',
    art: '/category-art.jpg',
    gradient: '/category-gradient.jpg',
  };
  
  // Check category first
  if (category && imageMap[category]) {
    return imageMap[category];
  }
  
  // Check tags next
  if (Array.isArray(tags)) {
    for (const tag of tags) {
      const tagLower = typeof tag === 'string' ? tag.toLowerCase() : '';
      if (tagLower && imageMap[tagLower]) {
        return imageMap[tagLower];
      }
    }
  }
  
  // Check keywords in title and description
  for (const keyword of Object.keys(imageMap)) {
    if (title.includes(keyword) || description.includes(keyword)) {
      return imageMap[keyword];
    }
  }
  
  // Default fallback
  return '/default-wallpaper.jpg';
}

export function WallpaperGrid() {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery] = useDebounce(searchQuery, 300)
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [indexError, setIndexError] = useState<string | null>(null)
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})
  const [hasMore, setHasMore] = useState(true)
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null)
  const [totalCount, setTotalCount] = useState<number>(0)
  
  const observerTarget = useRef<HTMLDivElement>(null)
  const WALLPAPERS_PER_PAGE = 10
  
  // Process wallpaper data to ensure Cloudflare R2 URLs are used when available
  const processWallpaperData = useCallback((doc: QueryDocumentSnapshot<DocumentData>): Wallpaper | null => {
    const data = doc.data() as Omit<Wallpaper, 'id'>
    
    // When we don't have the index for filtering public wallpapers in the query,
    // we need to do client-side filtering
    if (indexError && data.isPublic === false) {
      return null;
    }
    
    // Prioritize Cloudflare R2 URLs if available
    let imageUrl = '';
    
    // Check if we have an R2 URL first
    if (data.r2ImageUrl) {
      imageUrl = sanitizeR2Url(data.r2ImageUrl)
      console.log(`Using R2 URL for ${doc.id}: ${imageUrl}`)
    } else if (data.imageUrl) {
      // If no R2 URL, use the standard imageUrl
      imageUrl = data.imageUrl || ''
      
      // Check if this is actually an R2 URL and sanitize if needed
      if (isR2Image(imageUrl)) {
        imageUrl = sanitizeR2Url(imageUrl)
        console.log(`Detected and sanitized R2 URL: ${imageUrl}`)
      }
    }
    
    // Validate the URL
    try {
      if (imageUrl && !imageUrl.startsWith('/')) {
        new URL(imageUrl) // This will throw for invalid URLs
      }
    } catch (e) {
      // If URL is invalid, use a fallback
      console.warn(`Invalid image URL for wallpaper ${doc.id}: ${imageUrl}`)
      const category = (data.category || '').toLowerCase()
      if (category && ['nature', 'landscape', 'abstract', 'minimal', 'dark', 'city', 'space', 'technology', 'art', 'gradient'].includes(category)) {
        imageUrl = `/category-${category === 'technology' ? 'tech' : category}.jpg`
      } else {
        imageUrl = '/default-wallpaper.jpg'
      }
    }
    
    return {
      id: doc.id,
      ...data,
      imageUrl
    }
  }, [indexError])
  
  // Fetch initial wallpapers from Firestore
  useEffect(() => {
    async function fetchWallpapers() {
      try {
        setIsLoading(true)
        console.log('Fetching initial wallpapers')
        const wallpapersRef = collection(db, 'wallpapers')
        
        // Default to the simpler query first to avoid index errors
        let querySnapshot;
        const simpleQuery = query(
          wallpapersRef,
          orderBy('createdAt', 'desc'),
          limit(WALLPAPERS_PER_PAGE)
        );
        
        querySnapshot = await getDocs(simpleQuery);
        console.log('Using simple query successfully, returned:', querySnapshot.size, 'documents');
        
        // Display the index error message to help the user create the needed index
        setIndexError("Missing required Firestore index");
        
        if (querySnapshot.empty) {
          setHasMore(false)
          setIsLoading(false)
          return
        }
        
        console.log(`Query returned ${querySnapshot.size} documents`)
        
        const wallpapersList: Wallpaper[] = []
        const categoriesSet = new Set<string>()
        
        querySnapshot.forEach(doc => {
          const wallpaper = processWallpaperData(doc)
          if (wallpaper) {
            wallpapersList.push(wallpaper)
            
            if (wallpaper.category) {
              categoriesSet.add(wallpaper.category)
            }
          }
        })
        
        // Try to get total count
        try {
          // For accurate count, we'd need to count all documents
          // This is a simplified approach that will set a minimum count based on what we've loaded
          setTotalCount(Math.max(wallpapersList.length, totalCount))
          
          // In a production app, you might want to use a counter document or Cloud Functions
          // to maintain an accurate count without reading all documents
        } catch (countError) {
          console.error('Error getting count:', countError)
        }
        
        console.log(`Processed ${wallpapersList.length} wallpapers`)
        
        // Get the last document for pagination
        const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1]
        setLastDoc(lastVisible)
        
        setWallpapers(wallpapersList)
        setCategories(Array.from(categoriesSet))
        setHasMore(querySnapshot.size >= WALLPAPERS_PER_PAGE)
      } catch (error) {
        console.error('Error fetching wallpapers:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchWallpapers()
  }, [processWallpaperData, totalCount])
  
  // Update counts when new wallpapers are loaded
  useEffect(() => {
    if (wallpapers.length > 0) {
      setTotalCount(Math.max(wallpapers.length, totalCount))
    }
  }, [wallpapers.length, totalCount])
  
  // Load more wallpapers when user scrolls to the bottom
  const loadMoreWallpapers = useCallback(async () => {
    if (!lastDoc || !hasMore || isLoadingMore) return
    
    try {
      setIsLoadingMore(true)
      
      // Add small delay to prevent UI jank during scroll
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const wallpapersRef = collection(db, 'wallpapers')
      
      // Use the simpler query for pagination since we have the index error
      const nextQuery = query(
        wallpapersRef,
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(WALLPAPERS_PER_PAGE)
      )
      
      const querySnapshot = await getDocs(nextQuery)
      
      if (querySnapshot.empty) {
        setHasMore(false)
        setIsLoadingMore(false)
        return
      }
      
      const newWallpapers: Wallpaper[] = []
      const categoriesSet = new Set<string>(categories)
      
      querySnapshot.forEach(doc => {
        const wallpaper = processWallpaperData(doc)
        if (wallpaper) {
          newWallpapers.push(wallpaper)
          
          if (wallpaper.category) {
            categoriesSet.add(wallpaper.category)
          }
        }
      })
      
      // Get the last document for next pagination
      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1]
      setLastDoc(lastVisible)
      
      // Pre-calculate layout space before updating state to prevent layout shift
      const layoutHeight = document.documentElement.scrollHeight
      
      // Update wallpapers array with the minimum UI disruption
      requestAnimationFrame(() => {
        // Use functional update to prevent stale state
        setWallpapers(prevWallpapers => [...prevWallpapers, ...newWallpapers])
        setCategories(Array.from(categoriesSet))
        setHasMore(querySnapshot.size >= WALLPAPERS_PER_PAGE)
      })
      
      // Update total count based on what we now know
      setTotalCount(prevCount => Math.max(prevCount, wallpapers.length + newWallpapers.length))
    } catch (error) {
      console.error('Error loading more wallpapers:', error)
    } finally {
      // Small delay before removing loading state
      setTimeout(() => {
        setIsLoadingMore(false)
      }, 200)
    }
  }, [lastDoc, hasMore, isLoadingMore, categories, processWallpaperData, wallpapers.length])
  
  // Set up intersection observer for infinite scrolling with debounce
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null
    let isObserving = false
    
    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
        // Prevent duplicate calls with flag
        if (isObserving) return
        isObserving = true
        
        // Clear existing timeout
        if (timeoutId) clearTimeout(timeoutId)
        
        // Set a new timeout
        timeoutId = setTimeout(() => {
          loadMoreWallpapers()
          isObserving = false
        }, 100)
      }
    }
    
    const options = {
      rootMargin: '200px', // Load earlier but not too early
      threshold: 0.1
    }
    
    const observer = new IntersectionObserver(handleIntersection, options)
    
    const currentObserver = observerTarget.current
    if (currentObserver) {
      observer.observe(currentObserver)
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      if (currentObserver) {
        observer.unobserve(currentObserver)
      }
    }
  }, [loadMoreWallpapers, hasMore, isLoading, isLoadingMore])
  
  // Handle image errors
  const handleImageError = (wallpaperId: string) => {
    setImageErrors(prev => ({
      ...prev,
      [wallpaperId]: true
    }));
    console.log(`Image error for wallpaper ${wallpaperId}`);
  };

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
        <div className="bg-background/40 backdrop-blur-xl rounded-xl border border-primary/10 shadow-sm p-4 md:p-6 min-h-[160px] transition-all duration-300 hover:border-primary/20 hover:shadow">
          {/* Search input */}
          <div className="relative mb-5">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 sm:w-5 sm:h-5 transition-colors group-focus-within:text-primary" />
            <div className="group">
              <Input
                type="text"
                placeholder="Search wallpapers..."
                className="pl-10 sm:pl-12 h-10 sm:h-12 bg-background/60 border-primary/10 hover:border-primary/30 focus:border-primary/50 rounded-lg transition-all text-sm sm:text-base focus-visible:ring-primary/20 focus-visible:ring-offset-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search wallpapers"
              />
            </div>
          </div>
          
          {/* Index error message */}
          {indexError && (
            <div className="mb-4 p-3 text-xs border border-amber-200 bg-amber-50 text-amber-800 rounded-md animate-fadeIn">
              <p>For better filtering, you need to create a missing Firestore index.</p>
              <p className="mt-1">
                <a 
                  href="https://console.firebase.google.com/v1/r/project/wallpaper-180d3/firestore/indexes?create_composite=ClJwcm9qZWN0cy93YWxscGFwZXItMTgwZDMvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL3dhbGxwYXBlcnMvaW5kZXhlcy9fEAEaDAoIaXNQdWJsaWMQARoNCgljcmVhdGVkQXQQAhoMCghfX25hbWVfXxAC"
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline font-medium hover:text-amber-900 transition-colors"
                >
                  Click here to create the index
                </a>
                {' '}for better performance.
              </p>
            </div>
          )}
          
          {/* Category filters */}
          <div className="flex justify-between items-center mt-4 mb-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-medium">Filter by Category</h3>
            </div>
            
            {/* Wallpaper count display */}
            <div className="text-xs text-muted-foreground">
              {!isLoading && (
                activeCategory 
                  ? `${filteredWallpapers.length} wallpapers in "${activeCategory}"`
                  : debouncedQuery
                    ? `${filteredWallpapers.length} matching wallpapers` 
                    : `${totalCount}+ wallpapers total`
              )}
            </div>
          </div>
          
          {/* Category buttons */}
          <div className="flex flex-wrap gap-2 mt-3 min-h-[36px]">
            <Button
              variant={activeCategory === null ? "default" : "outline"}
              size="sm"
              className={cn(
                "rounded-lg text-xs sm:text-sm h-8 touch-target transition-all duration-300",
                activeCategory === null ? "shadow-sm" : "hover:bg-primary/5"
              )}
              onClick={() => setActiveCategory(null)}
            >
              All
            </Button>
            {categories.map(category => (
              <Button
                key={category}
                variant={activeCategory === category ? "default" : "outline"}
                size="sm"
                className={cn(
                  "rounded-lg text-xs sm:text-sm h-8 touch-target transition-all duration-300",
                  activeCategory === category ? "shadow-sm" : "hover:bg-primary/5"
                )}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Wallpapers Grid */}
      <div className="w-full min-h-[500px]">
        <div className="responsive-grid">
          {isLoading ? (
            <>
              {Array.from({ length: 12 }).map((_, index) => (
                <WallpaperCardSkeleton key={index} />
              ))}
            </>
          ) : filteredWallpapers.length > 0 ? (
            <>
              {filteredWallpapers.map((wallpaper, index) => {
                // Final sanitized URL check
                const finalImageUrl = sanitizeR2Url(wallpaper.imageUrl);
                
                return (
                  <Link
                    key={wallpaper.slug || wallpaper.id}
                    href={`/wallpapers/${wallpaper.slug || wallpaper.id}`}
                    className="group h-full"
                  >
                    <Card 
                      className="overflow-hidden bg-background/60 backdrop-blur-xl border-primary/10 rounded-xl h-full flex flex-col"
                    >
                      <div className="relative aspect-[3/4] overflow-hidden bg-muted/30">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        <ServerImage
                          src={finalImageUrl}
                          alt={wallpaper.title || 'Wallpaper'}
                          fallbackSrc={getFallbackImage(wallpaper)}
                          fill={true}
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          priority={index < 4}
                          quality={70}
                          placeholder="blur"
                          blurDataURL={blurDataURL}
                          loading={index > 8 ? "lazy" : undefined}
                        />
                        <div className="absolute top-3 right-3 z-20">
                          <Badge variant="secondary" className="bg-primary/80 text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs shadow-sm">
                            View
                          </Badge>
                        </div>
                      </div>
                      <div className="p-3 sm:p-4 flex flex-col flex-grow">
                        <h3 className="font-medium text-sm sm:text-base group-hover:text-primary transition-colors line-clamp-1">
                          {wallpaper.title || 'Untitled Wallpaper'}
                        </h3>
                        <div className="text-muted-foreground text-xs line-clamp-1 mt-1">
                          {wallpaper.category || 'Uncategorized'}
                        </div>
                        {wallpaper.description && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {wallpaper.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-auto pt-3">
                          <div className="flex items-center text-muted-foreground group-hover:text-primary/70 transition-colors">
                            <Heart className="w-3 h-3 mr-1" />
                            <span className="text-xs">
                              {wallpaper.favorites || 0}
                            </span>
                          </div>
                          <div className="flex items-center text-muted-foreground group-hover:text-primary/70 transition-colors">
                            <Download className="w-3 h-3 mr-1" />
                            <span className="text-xs">
                              {wallpaper.views || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
              
              {/* Fixed-height loading container to prevent layout shifts */}
              <div 
                ref={observerTarget} 
                className="col-span-full flex justify-center items-center h-16"
                style={{ minHeight: isLoadingMore ? '80px' : '40px' }}
              >
                {isLoadingMore ? (
                  <div className="flex items-center justify-center h-16 px-4 py-2 bg-background/50 backdrop-blur-sm rounded-lg shadow-sm border border-primary/5">
                    <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
                    <span className="text-sm text-muted-foreground">Loading more...</span>
                  </div>
                ) : !hasMore && wallpapers.length > 0 ? (
                  <div className="text-sm text-muted-foreground bg-background/50 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm border border-primary/5">
                    You've reached the end of the collection
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
              <p className="text-lg font-medium mb-2">No wallpapers found</p>
              <p className="text-muted-foreground mb-4 max-w-md">Try adjusting your search or filter criteria.</p>
              <Button variant="outline" onClick={() => {
                setSearchQuery('');
                setActiveCategory(null);
              }} className="hover:bg-primary/5">
                Reset filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  )
} 