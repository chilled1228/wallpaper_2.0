'use client'

import { useState, useEffect, useCallback, useRef, TouchEvent } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { db, auth } from '@/lib/firebase'
import { doc, getDoc, updateDoc, collection, getDocs, where, query, limit, increment } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { Loader2, Heart, Download, ChevronLeft, ChevronRight, Share2, Bookmark, Sun, Moon, ExternalLink, Info, Pencil, Trash2, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/use-toast'
import { MultiImageUpload } from '@/components/blog/multi-image-upload'
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { ServerImage } from '@/components/ui/server-image'
import Image from 'next/image'

interface Wallpaper {
  id: string
  title: string
  description: string
  category: string
  imageUrl: string
  additionalImages?: {
    url: string
    alt?: string
    title?: string
    caption?: string
    description?: string
  }[]
  createdAt: string
  favorites?: number
  views?: number
  resolutions?: string[]
  author?: {
    name: string
    avatar?: string
  }
  promptText?: string
  slug: string
}

// Helper function to sanitize R2 URLs if needed
function sanitizeR2Url(url: string): string {
  if (!url) return url;
  
  // Handle the case where URL might be missing protocol for R2
  if (url.startsWith('pub-') && url.includes('.r2.dev')) {
    console.log('Adding protocol to R2 URL:', url);
    return `https://${url}`;
  }
  
  // Ensure R2 URLs use HTTPS
  if (url.includes('.r2.dev') && url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  
  return url;
}

export default function WallpaperPage() {
  const params = useParams()
  const router = useRouter()
  const [wallpaper, setWallpaper] = useState<Wallpaper | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedDescription, setEditedDescription] = useState('')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showImageModal, setShowImageModal] = useState(false)
  const [additionalImages, setAdditionalImages] = useState<string[]>([])
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [suggestedWallpapers, setSuggestedWallpapers] = useState<Wallpaper[]>([])
  const [isLiked, setIsLiked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('dark')
  const [dominantColor, setDominantColor] = useState('rgba(0,0,0,0.9)')
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const mainImageRef = useRef<HTMLDivElement>(null)
  const [modalTouchStart, setModalTouchStart] = useState<number | null>(null)
  const [modalTouchEnd, setModalTouchEnd] = useState<number | null>(null)
  const modalImageRef = useRef<HTMLDivElement>(null)

  // Handle view count
  useEffect(() => {
    const incrementViews = async () => {
      if (wallpaper && wallpaper.id) {
        try {
          const wallpaperRef = doc(db, 'wallpapers', wallpaper.id);
          
          // Update the views in Firestore
          await updateDoc(wallpaperRef, {
            views: increment(1)
          });
          
          // Update local state to reflect the incremented view
          setWallpaper(prev => {
            if (!prev) return null;
            const currentViews = prev.views || 0;
            return {
              ...prev,
              views: currentViews + 1
            };
          });
        } catch (error) {
          console.error('Error incrementing views:', error);
        }
      }
    };
    
    // Only increment views once when the component mounts with a valid wallpaper
    if (wallpaper && wallpaper.id) {
      incrementViews();
    }
  }, []); // Empty dependency array to run only once on mount

  useEffect(() => {
    const checkAdminStatus = async () => {
      const user = auth.currentUser
      if (!user) return

      const userDoc = await getDoc(doc(db, 'users', user.uid))
      setIsAdmin(userDoc.exists() && userDoc.data()?.isAdmin === true)
    }

    checkAdminStatus()
  }, [])

  useEffect(() => {
    const fetchWallpaper = async () => {
      try {
        setLoading(true)
        console.log('[DEBUG] Fetching wallpaper with ID/slug:', params.id);
        
        // Special workaround for bulk-uploaded wallpapers
        if (auth.currentUser) {
          // Authenticated users should be able to fetch directly
          const docRef = doc(db, 'wallpapers', params.id as string)
          const docSnap = await getDoc(docRef)
  
          if (docSnap.exists()) {
            const data = docSnap.data();
            console.log('[DEBUG] Found wallpaper by ID with auth:', { 
              id: docSnap.id, 
              isPublic: data.isPublic, 
              status: data.status 
            });
            setWallpaper({ id: docSnap.id, ...data } as Wallpaper)
            return
          }
        } else {
          // Try using a server endpoint to bypass Firestore rules for non-authenticated users
          try {
            const response = await fetch(`/api/public/wallpapers/${params.id}`)
            
            if (response.ok) {
              const data = await response.json()
              if (data.wallpaper) {
                console.log('[DEBUG] Found wallpaper via API:', data.wallpaper)
                setWallpaper(data.wallpaper as Wallpaper)
                return
              }
            } else {
              console.log('[DEBUG] API fetch failed:', await response.text())
            }
          } catch (apiError) {
            console.error('Error using API fallback:', apiError)
          }
          
          // Fallback to direct Firestore query (may fail due to permissions)
          const docRef = doc(db, 'wallpapers', params.id as string)
          try {
            const docSnap = await getDoc(docRef)
            if (docSnap.exists()) {
              const data = docSnap.data();
              console.log('[DEBUG] Found wallpaper by direct ID without auth:', { 
                id: docSnap.id, 
                isPublic: data.isPublic, 
                status: data.status 
              });
              setWallpaper({ id: docSnap.id, ...data } as Wallpaper)
              return
            }
          } catch (firestoreError) {
            console.error('Firestore direct access error:', firestoreError)
          }
        }
        
        // If not found by ID, try to find by slug
        console.log('[DEBUG] Not found by ID, trying slug lookup');
        try {
          const slugQuery = query(
            collection(db, 'wallpapers'),
            where('slug', '==', params.id)
          )
          const slugSnapshot = await getDocs(slugQuery)
          
          if (!slugSnapshot.empty) {
            const doc = slugSnapshot.docs[0];
            const data = doc.data();
            console.log('[DEBUG] Found wallpaper by slug:', { 
              id: doc.id, 
              isPublic: data.isPublic, 
              status: data.status 
            });
            setWallpaper({ id: doc.id, ...data } as Wallpaper)
            return
          }
        } catch (slugError) {
          console.error('Error in slug query:', slugError)
        }

        // If we get here, the wallpaper wasn't found or couldn't be accessed
        console.log('[DEBUG] Wallpaper not found or permission denied');
        setError('Wallpaper not found or inaccessible')
      } catch (error) {
        console.error('Error fetching wallpaper:', error)
        setError('Failed to load wallpaper: ' + (error instanceof Error ? error.message : String(error)))
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchWallpaper()
    }
  }, [params.id])

  useEffect(() => {
    if (wallpaper?.additionalImages) {
      setAdditionalImages(wallpaper.additionalImages.map(img => img.url))
    }
    if (wallpaper?.description) {
      setEditedDescription(wallpaper.description)
    }
  }, [wallpaper?.additionalImages, wallpaper?.description])

  useEffect(() => {
    const fetchSuggestedWallpapers = async () => {
      if (!wallpaper) return
      try {
        // Simple query that only filters by category and limits results
        const suggestedQuery = query(
          collection(db, 'wallpapers'),
          where('category', '==', wallpaper.category),
          limit(10)
        )
        const suggestedSnapshot = await getDocs(suggestedQuery)
        const allSuggestedWallpapers = suggestedSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Wallpaper))
          .filter(suggestedWallpaper => {
            // Filter out the current wallpaper
            if (wallpaper.slug && suggestedWallpaper.slug) {
              return suggestedWallpaper.slug !== wallpaper.slug;
            }
            return suggestedWallpaper.id !== wallpaper.id;
          })
          .slice(0, 4)
        
        setSuggestedWallpapers(allSuggestedWallpapers)
      } catch (error) {
        console.error('Error fetching suggested wallpapers:', error)
      }
    }

    if (wallpaper) {
      fetchSuggestedWallpapers()
    }
  }, [wallpaper])

  const handleSaveWallpaper = async () => {
    if (!wallpaper) return
    try {
      setIsUploadingImages(true)
      await updateDoc(doc(db, 'wallpapers', wallpaper.id), {
        description: editedDescription,
        additionalImages: additionalImages.map(url => ({ url }))
      })
      setIsEditing(false)
      setWallpaper(prev => prev ? { ...prev, description: editedDescription, additionalImages: additionalImages.map(url => ({ url })) } : null)
      toast({
        title: "Success",
        description: "Wallpaper updated successfully",
      })
    } catch (error) {
      console.error('Error updating wallpaper:', error)
      toast({
        title: "Error",
        description: "Failed to update wallpaper",
        variant: "destructive",
      })
    } finally {
      setIsUploadingImages(false)
    }
  }

  const handleDownload = (resolution?: string) => {
    if (!wallpaper?.imageUrl) return;
    
    // Just use the original image URL for all downloads
    const imageUrl = wallpaper.imageUrl;
    
    // Create an anchor element and set download attribute
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `${wallpaper.title.replace(/\s+/g, '-')}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast({
      title: "Download Started",
      description: "Wallpaper downloaded successfully",
    });
  };

  const handleAddImages = (urls: string[]) => {
    if (!urls.length) return
    setAdditionalImages(prev => [...prev, ...urls])
    toast({
      title: "Success",
      description: `${urls.length} image${urls.length === 1 ? '' : 's'} added successfully`,
    })
  }

  const handleRemoveImage = (index: number) => {
    setAdditionalImages(prev => prev.filter((_, i) => i !== index))
    toast({
      title: "Success",
      description: "Image removed successfully",
    })
  }

  const nextImage = () => {
    if (!wallpaper?.additionalImages) return
    setCurrentImageIndex((currentImageIndex + 1) % (wallpaper.additionalImages.length + 1))
  }

  const previousImage = () => {
    if (!wallpaper?.additionalImages) return
    setCurrentImageIndex((currentImageIndex - 1 + (wallpaper.additionalImages.length + 1)) % (wallpaper.additionalImages.length + 1))
  }

  const handleLike = useCallback(() => {
    // TODO: Implement like functionality with Firebase
    setIsLiked(!isLiked)
    toast({
      title: isLiked ? "Removed from favorites" : "Added to favorites",
    })
  }, [isLiked])

  const handleSave = useCallback(() => {
    // TODO: Implement collection save functionality
    setIsSaved(!isSaved)
    toast({
      title: isSaved ? "Removed from collection" : "Saved to collection",
    })
  }, [isSaved])

  const handleShare = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: wallpaper?.title || 'Amazing Wallpaper',
        text: 'Check out this amazing wallpaper!',
        url: window.location.href,
      }).catch(console.error)
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link copied to clipboard",
      })
    }
  }, [wallpaper])

  // Handling the rendering section of the component
  const getCurrentImage = () => {
    if (!wallpaper) return '';
    
    if (currentImageIndex === 0) {
      return wallpaper.imageUrl;
    } else if (wallpaper.additionalImages && wallpaper.additionalImages.length >= currentImageIndex) {
      return wallpaper.additionalImages[currentImageIndex - 1].url;
    }
    
    return wallpaper.imageUrl;
  };

  const handleDownloadButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    handleDownload();
  };

  // Handle touch events for swiping between images
  useEffect(() => {
    const handleTouchStart = (e: globalThis.TouchEvent) => {
      setTouchEnd(null)
      setTouchStart(e.targetTouches[0].clientX)
    }
    
    const handleTouchMove = (e: globalThis.TouchEvent) => {
      setTouchEnd(e.targetTouches[0].clientX)
    }
    
    const handleTouchEnd = () => {
      if (!touchStart || !touchEnd) return
      
      const distance = touchStart - touchEnd
      const isLeftSwipe = distance > 50
      const isRightSwipe = distance < -50
      
      if (isLeftSwipe && wallpaper?.additionalImages?.length) {
        nextImage()
      }
      
      if (isRightSwipe && wallpaper?.additionalImages?.length) {
        previousImage()
      }
      
      // Reset values
      setTouchStart(null)
      setTouchEnd(null)
    }
    
    const imageContainer = mainImageRef.current
    if (imageContainer) {
      imageContainer.addEventListener('touchstart', handleTouchStart)
      imageContainer.addEventListener('touchmove', handleTouchMove)
      imageContainer.addEventListener('touchend', handleTouchEnd)
      
      return () => {
        imageContainer.removeEventListener('touchstart', handleTouchStart)
        imageContainer.removeEventListener('touchmove', handleTouchMove)
        imageContainer.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [mainImageRef, touchStart, touchEnd, wallpaper, nextImage, previousImage])

  // Handle touch events for modal
  useEffect(() => {
    const handleTouchStart = (e: globalThis.TouchEvent) => {
      setModalTouchEnd(null)
      setModalTouchStart(e.targetTouches[0].clientX)
    }
    
    const handleTouchMove = (e: globalThis.TouchEvent) => {
      setModalTouchEnd(e.targetTouches[0].clientX)
    }
    
    const handleTouchEnd = () => {
      if (!modalTouchStart || !modalTouchEnd) return
      
      const distance = modalTouchStart - modalTouchEnd
      const isLeftSwipe = distance > 50
      const isRightSwipe = distance < -50
      
      if (isLeftSwipe && wallpaper?.additionalImages?.length) {
        nextImage()
      }
      
      if (isRightSwipe && wallpaper?.additionalImages?.length) {
        previousImage()
      }
      
      // Reset values
      setModalTouchStart(null)
      setModalTouchEnd(null)
    }
    
    const modalContainer = modalImageRef.current
    if (modalContainer && showImageModal) {
      modalContainer.addEventListener('touchstart', handleTouchStart)
      modalContainer.addEventListener('touchmove', handleTouchMove)
      modalContainer.addEventListener('touchend', handleTouchEnd)
      
      return () => {
        modalContainer.removeEventListener('touchstart', handleTouchStart)
        modalContainer.removeEventListener('touchmove', handleTouchMove)
        modalContainer.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [modalImageRef, modalTouchStart, modalTouchEnd, wallpaper, nextImage, previousImage, showImageModal])

  if (loading) {
    return (
      <div className="container mx-auto px-4 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading wallpaper...</p>
        </div>
      </div>
    );
  }

  if (error || !wallpaper) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="max-w-md mx-auto p-6 bg-background/40 backdrop-blur-sm border border-primary/10 rounded-xl">
          <Info className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-xl font-semibold mb-2">Wallpaper Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The wallpaper you're looking for doesn't exist or has been removed.
            {error && error !== 'Wallpaper not found' && (
              <span className="block mt-2 text-sm">Error: {error}</span>
            )}
          </p>
          <div className="flex flex-col gap-4">
            <Button asChild>
              <Link href="/">Go Back Home</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/wallpapers">Browse All Wallpapers</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl" style={{ "--header-offset": "2rem" } as React.CSSProperties}>
      <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 sm:mb-6">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{wallpaper.title}</h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Badge variant="secondary" className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground">
              {wallpaper.category}
            </Badge>
            {wallpaper.author && (
              <span className="text-sm text-muted-foreground">by <span className="text-foreground/90 font-medium">{wallpaper.author.name}</span></span>
            )}
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={handleShare}
          >
            <Share2 className="h-5 w-5" />
            <span className="sr-only">Share</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn("rounded-full", isLiked && "text-primary")}
            onClick={handleLike}
          >
            <Heart className={cn("h-5 w-5", isLiked && "fill-primary")} />
            <span className="sr-only">Like</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn("rounded-full", isSaved && "text-primary")}
            onClick={handleSave}
          >
            <Bookmark className={cn("h-5 w-5", isSaved && "fill-primary")} />
            <span className="sr-only">Save</span>
          </Button>
        </div>
      </header>

      <div className="relative">
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 sm:gap-6 lg:gap-8 lg:items-start">
          {/* Main Content Area - 5/7 columns on large screens */}
          <section className="lg:col-span-5 order-1 lg:order-1 space-y-3 sm:space-y-4 lg:sticky" style={{ top: 'var(--header-offset, 2rem)' }}>
            {/* Wallpaper Image Container */}
            <section 
              ref={mainImageRef}
              className={cn(
                "w-full h-full relative rounded-2xl overflow-hidden",
                "border border-border/30 shadow-xl"
              )}
              onClick={() => setShowImageModal(true)}
            >
              <ServerImage
                src={sanitizeR2Url(wallpaper.imageUrl)}
                alt={wallpaper.title}
                fallbackSrc="/default-wallpaper.jpg"
                fill={true}
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 75vw, 50vw"
                priority={true}
                quality={90}
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzIwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmNWY5Ii8+PC9zdmc+"
              />
            </section>
            
            {/* Image Navigation Controls - Only shown when there are additional images */}
            {wallpaper.additionalImages && wallpaper.additionalImages.length > 0 && (
              <>
                <button 
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/70 backdrop-blur-sm p-2 sm:p-3 text-foreground hover:bg-background/90 transition-colors md:opacity-0 md:group-hover:opacity-100 opacity-80 shadow-lg"
                  onClick={previousImage}
                  aria-label="View previous image"
                >
                  <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
                <button 
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/70 backdrop-blur-sm p-2 sm:p-3 text-foreground hover:bg-background/90 transition-colors md:opacity-0 md:group-hover:opacity-100 opacity-80 shadow-lg"
                  onClick={nextImage}
                  aria-label="View next image"
                >
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </>
            )}
          </section>

          {/* Sidebar - 2/7 columns on large screens */}
          <aside className="lg:col-span-2 space-y-3 sm:space-y-4 order-2 lg:order-2">
            <div className="lg:sticky space-y-3 sm:space-y-4" style={{ top: 'var(--header-offset, 2rem)' }}>
              {/* Download Section - Most Important Action */}
              <section className="bg-background/40 backdrop-blur-xl rounded-xl border border-primary/10 p-3 sm:p-4 shadow-sm">
                <div className="space-y-3">
                  <Button
                    size="lg"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                    onClick={() => handleDownload()}
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Download Wallpaper
                  </Button>
                  
                  {wallpaper.resolutions && wallpaper.resolutions.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {wallpaper.resolutions.map((resolution, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="w-full text-xs sm:text-sm"
                          onClick={() => handleDownload(resolution)}
                        >
                          {resolution}
                        </Button>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs text-center text-muted-foreground">
                    Free for personal and commercial use
                  </p>
                </div>
              </section>

              {/* About This Wallpaper */}
              <section className="bg-background/40 backdrop-blur-xl rounded-xl border border-primary/10 p-4 shadow-sm">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-medium">About</h3>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <Heart className={cn(
                          "h-4 w-4",
                          isLiked ? "fill-primary text-primary" : "text-muted-foreground"
                        )} />
                        <span className="text-sm">{wallpaper.favorites || 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Download className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{wallpaper.views || 0}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {wallpaper.description}
                    </p>
                    
                    {wallpaper.promptText && (
                      <details className="text-sm text-muted-foreground pt-2 border-t border-primary/5">
                        <summary className="cursor-pointer hover:text-foreground transition-colors">
                          <span className="font-medium">View Prompt</span>
                        </summary>
                        <p className="mt-2 p-3 bg-muted/30 rounded-lg text-xs font-mono">
                          {wallpaper.promptText}
                        </p>
                      </details>
                    )}
                  </div>
                </div>
              </section>

              {/* Wallpaper Details */}
              <section className="bg-background/40 backdrop-blur-xl rounded-xl border border-primary/10 p-4 shadow-sm">
                <h3 className="text-base font-medium mb-3">Details</h3>
                <dl className="space-y-2 text-sm divide-y divide-primary/5">
                  <div className="flex justify-between py-1.5">
                    <dt className="text-muted-foreground">Category</dt>
                    <dd className="font-medium">{wallpaper.category}</dd>
                  </div>
                  {wallpaper.author && (
                    <div className="flex justify-between py-1.5">
                      <dt className="text-muted-foreground">Author</dt>
                      <dd className="font-medium">{wallpaper.author.name}</dd>
                    </div>
                  )}
                  <div className="flex justify-between py-1.5">
                    <dt className="text-muted-foreground">Added</dt>
                    <dd className="font-medium">
                      {new Date(wallpaper.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </dd>
                  </div>
                </dl>
              </section>

              {/* Admin Controls - Only visible to admins */}
              {isAdmin && (
                <section className="bg-background/40 backdrop-blur-xl rounded-xl border border-primary/10 p-4 shadow-sm">
                  <h3 className="text-base font-medium mb-3">Admin Controls</h3>
                  <div className="space-y-2">
                    <Button 
                      className="w-full justify-start" 
                      variant={isEditing ? "default" : "outline"}
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? (
                        <>
                          <ChevronLeft className="mr-2 h-4 w-4" />
                          Exit Edit Mode
                        </>
                      ) : (
                        <>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit Wallpaper
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      className="w-full justify-start text-destructive hover:text-destructive-foreground" 
                      variant="outline"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this wallpaper?")) {
                          // Delete logic here
                        }
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Wallpaper
                    </Button>
                  </div>
                </section>
              )}
            </div>
          </aside>
        </div>
        
        {/* Similar Wallpapers - Full Width */}
        {suggestedWallpapers.length > 0 && (
          <section className="mt-8 sm:mt-12">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl font-bold bg-gradient-to-r from-primary/80 to-secondary/80 bg-clip-text text-transparent">
                You May Also Like
              </h2>
              <Button variant="link" asChild className="text-primary hover:text-primary/80">
                <Link href={`/category/${wallpaper.category}`}>
                  View More
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestedWallpapers.map((item) => (
                <Link 
                  href={`/wallpapers/${item.slug || item.id}`}
                  key={item.id}
                  className="group"
                >
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden">
                    <ServerImage
                      src={sanitizeR2Url(item.imageUrl)}
                      alt={item.title}
                      fallbackSrc="/default-wallpaper.jpg"
                      fill={true}
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                      quality={75}
                    />
                  </div>
                  <h3 className="mt-2 text-sm font-medium line-clamp-1">{item.title}</h3>
                </Link>
              ))}
            </div>
          </section>
        )}
        
        {/* Full-screen Image Modal */}
        <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
          <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 bg-transparent border-0">
            <div 
              ref={modalImageRef}
              className="w-full h-full relative"
            >
              <button 
                className="absolute top-4 right-4 z-50 bg-black/50 p-2 rounded-full text-white hover:bg-black/70"
                onClick={() => setShowImageModal(false)}
              >
                <X className="h-6 w-6" />
              </button>
              
              <ServerImage
                src={sanitizeR2Url(getCurrentImage())}
                alt={wallpaper.title}
                fallbackSrc="/default-wallpaper.jpg"
                fill={true}
                className="object-contain"
                sizes="100vw"
                quality={100}
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzIwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmNWY5Ii8+PC9zdmc+"
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
} 