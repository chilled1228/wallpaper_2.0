'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { db, auth } from '@/lib/firebase'
import { doc, getDoc, updateDoc, collection, getDocs, where, query, limit, increment } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { Loader2, Heart, Download, ChevronLeft, ChevronRight, Share2, Bookmark, Sun, Moon, ExternalLink, Info } from 'lucide-react'
import NextImage from 'next/image'
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
  const [userResolution, setUserResolution] = useState<string | null>(null)

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

  // Get user's screen resolution
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const width = window.screen.width
      const height = window.screen.height
      if (width >= 3840) {
        setUserResolution('4K')
      } else if (width >= 2560 && width/height > 1.7) {
        setUserResolution('UltraWide')
      } else if (width >= 1920) {
        setUserResolution('HD')
      } else if (width <= 1080) {
        setUserResolution('Mobile')
      } else {
        setUserResolution('HD')
      }
    }
  }, [])

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
        // First try to find by slug
        const slugQuery = query(
          collection(db, 'wallpapers'),
          where('slug', '==', params.id),
          where('isPublic', '==', true)
        )
        const slugSnapshot = await getDocs(slugQuery)
        
        if (!slugSnapshot.empty) {
          const doc = slugSnapshot.docs[0]
          setWallpaper({ id: doc.id, ...doc.data() } as Wallpaper)
          return
        }

        // If not found by slug, try to find by ID (for backward compatibility)
        const docRef = doc(db, 'wallpapers', params.id as string)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          setWallpaper({ id: docSnap.id, ...docSnap.data() } as Wallpaper)
        } else {
          setError('Wallpaper not found')
        }
      } catch (error) {
        console.error('Error fetching wallpaper:', error)
        setError('Failed to load wallpaper')
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
          .filter(suggestedWallpaper => suggestedWallpaper.slug !== wallpaper.slug)
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

  const handleDownloadWallpaper = () => {
    if (!wallpaper?.imageUrl) return
    
    // Create an anchor element and set download attribute
    const a = document.createElement('a')
    a.href = wallpaper.imageUrl
    a.download = `${wallpaper.title.replace(/\s+/g, '-')}.jpg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    
    toast({
      title: "Downloaded!",
      description: "Wallpaper downloaded successfully",
    })
  }

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

  const handleDownload = (resolution?: string) => {
    if (!wallpaper?.imageUrl) return;
    
    // In a real app, you might have different resolution URLs
    // For this example, we'll just use the original URL
    const imageUrl = wallpaper.imageUrl;
    
    // Create an anchor element and set download attribute
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `${wallpaper.title.replace(/\s+/g, '-')}_${resolution || 'original'}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast({
      title: "Download Started",
      description: `${resolution || 'Original'} resolution downloaded`,
    });
  };

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
          <p className="text-muted-foreground mb-6">The wallpaper you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link href="/">Go Back Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
      {/* Wallpaper Title - Desktop */}
      <div className="hidden md:block mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{wallpaper.title}</h1>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground">
            {wallpaper.category}
          </Badge>
          {wallpaper.author && (
            <span className="text-sm text-muted-foreground">by <span className="text-foreground/90 font-medium">{wallpaper.author.name}</span></span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Left: Wallpaper Image (Larger) */}
        <div className="lg:col-span-8 space-y-4 sm:space-y-6">
          <div className={cn(
            "relative rounded-xl overflow-hidden border shadow-lg",
            previewMode === 'light' ? "bg-white border-primary/10" : "bg-black border-primary/20",
            isAdmin && isEditing ? "aspect-auto min-h-[300px]" : "aspect-[16/9] sm:aspect-[4/3] md:aspect-[16/9]"
          )}>
            {isAdmin && isEditing ? (
              <div className="p-4">
                <Textarea 
                  value={editedDescription} 
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className="min-h-[200px] bg-background/50"
                  placeholder="Enter a detailed description of the wallpaper..."
                />

                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Additional Images</h3>
                  <MultiImageUpload 
                    onImagesSelected={handleAddImages}
                    disabled={isUploadingImages}
                  />
                  
                  {additionalImages.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {additionalImages.map((url, idx) => (
                        <div key={idx} className="relative group">
                          <div className="relative aspect-square rounded overflow-hidden">
                            <NextImage
                              src={url}
                              alt={`Additional image ${idx + 1}`}
                              fill={true}
                              className="object-cover"
                              sizes="100px"
                            />
                          </div>
                          <Button
                            size="icon"
                            variant="destructive"
                            className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveImage(idx)}
                          >
                            ✕
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="mt-4 flex gap-2">
                  <Button onClick={handleSaveWallpaper} disabled={isUploadingImages}>
                    {isUploadingImages ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <NextImage
                  src={getCurrentImage()}
                  alt={wallpaper.title}
                  className="object-contain w-full h-full"
                  fill={true}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 60vw"
                  priority
                  onClick={() => setShowImageModal(true)}
                />
                
                {/* Image Navigation Controls - Only shown when there are additional images */}
                {wallpaper.additionalImages && wallpaper.additionalImages.length > 0 && (
                  <>
                    <button 
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/70 backdrop-blur-sm p-1 sm:p-2 text-foreground hover:bg-background/90 transition-colors"
                      onClick={previousImage}
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                    <button 
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/70 backdrop-blur-sm p-1 sm:p-2 text-foreground hover:bg-background/90 transition-colors"
                      onClick={nextImage}
                      aria-label="Next image"
                    >
                      <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </>
                )}
                
                {/* Toggle Preview Mode */}
                <div className="absolute top-3 right-3 z-10">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full bg-background/50 backdrop-blur-sm h-8 w-8 sm:h-9 sm:w-9"
                    onClick={() => setPreviewMode(previewMode === 'light' ? 'dark' : 'light')}
                  >
                    {previewMode === 'light' ? (
                      <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
          
          {/* Image Thumbnails */}
          {wallpaper.additionalImages && wallpaper.additionalImages.length > 0 && (
            <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 pt-1 px-1 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent snap-x">
              <div
                className={cn(
                  "relative h-16 w-24 sm:h-20 sm:w-32 flex-shrink-0 rounded-lg cursor-pointer border-2 hover:shadow-lg transition-all duration-300 snap-start",
                  currentImageIndex === 0 ? "border-primary shadow-primary/20" : "border-transparent hover:border-primary/50"
                )}
                onClick={() => setCurrentImageIndex(0)}
              >
                <NextImage
                  src={wallpaper.imageUrl}
                  alt="Thumbnail"
                  fill={true}
                  className="object-cover rounded-lg"
                  sizes="100px"
                />
              </div>
              {wallpaper.additionalImages.map((img, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "relative h-16 w-24 sm:h-20 sm:w-32 flex-shrink-0 rounded-lg cursor-pointer border-2 hover:shadow-lg transition-all duration-300 snap-start",
                    currentImageIndex === idx + 1 ? "border-primary shadow-primary/20" : "border-transparent hover:border-primary/50"
                  )}
                  onClick={() => setCurrentImageIndex(idx + 1)}
                >
                  <NextImage
                    src={img.url}
                    alt="Thumbnail"
                    fill={true}
                    className="object-cover rounded-lg"
                    sizes="100px"
                  />
                </div>
              ))}
            </div>
          )}
         
          {/* Mobile Title - Only shown on mobile */}
          <div className="block md:hidden">
            <h1 className="text-xl sm:text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{wallpaper.title}</h1>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground">
                {wallpaper.category}
              </Badge>
              {wallpaper.author && (
                <span className="text-xs sm:text-sm text-muted-foreground">by <span className="text-foreground/90 font-medium">{wallpaper.author.name}</span></span>
              )}
            </div>
          </div>
          
          {/* Wallpaper Description */}
          <div className="bg-background/40 backdrop-blur-xl rounded-xl border border-primary/10 p-4 sm:p-6 shadow-sm">
            <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">About this Wallpaper</h3>
            <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-line">{wallpaper.description}</p>
            
            {wallpaper.promptText && (
              <div className="mt-4 pt-4 border-t border-primary/5">
                <details className="text-sm text-muted-foreground">
                  <summary className="cursor-pointer hover:text-foreground transition-colors">
                    <span className="font-medium">Prompt Used</span>
                  </summary>
                  <p className="mt-2 p-3 bg-muted/30 rounded-lg text-xs sm:text-sm font-mono">{wallpaper.promptText}</p>
                </details>
              </div>
            )}
            
            {/* Stats and Interaction Row */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-primary/5">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Heart className={cn(
                    "h-4 w-4 sm:h-5 sm:w-5 cursor-pointer transition-colors",
                    isLiked ? "fill-primary text-primary" : "text-muted-foreground hover:text-primary"
                  )} 
                  onClick={() => setIsLiked(!isLiked)}
                  />
                  <span className="text-xs sm:text-sm">{wallpaper.favorites || 0}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-full"
                >
                  <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="sr-only">Share</span>
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn(
                    "h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-full",
                    isSaved && "text-primary"
                  )}
                  onClick={() => setIsSaved(!isSaved)}
                >
                  <Bookmark className={cn(
                    "h-4 w-4 sm:h-5 sm:w-5",
                    isSaved && "fill-primary"
                  )} />
                  <span className="sr-only">Save</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Information & Download Options */}
        <div className="lg:col-span-4 space-y-4 sm:space-y-6">
          {/* Admin Controls */}
          {isAdmin && (
            <div className="bg-background/40 backdrop-blur-xl rounded-xl border border-primary/10 p-4 sm:p-6 shadow-sm">
              <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4 flex items-center">
                <span className="mr-2">Admin Controls</span>
              </h3>
              
              <div className="space-y-3">
                <Button 
                  className="w-full" 
                  variant={isEditing ? "default" : "outline"}
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? "Cancel Editing" : "Edit Wallpaper"}
                </Button>
                
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => {
                    // Implement delete functionality
                    if (confirm("Are you sure you want to delete this wallpaper?")) {
                      // Delete logic here
                    }
                  }}
                >
                  Delete Wallpaper
                </Button>
              </div>
            </div>
          )}
          
          {/* Download Options Card */}
          <div className="bg-background/40 backdrop-blur-xl rounded-xl border border-primary/10 p-4 sm:p-6 shadow-sm">
            <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4 flex items-center">
              <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary" />
              Download Options
            </h3>
            
            <div className="space-y-3">
              {/* Quick Download - Default resolution */}
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => handleDownload(userResolution || undefined)}
              >
                <Download className="mr-2 h-4 w-4" />
                Download for {userResolution || 'Your Device'}
              </Button>
              
              {/* Other Resolutions */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="w-full text-xs sm:text-sm"
                  onClick={() => handleDownload('HD')}
                >
                  HD (1080p)
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-xs sm:text-sm"
                  onClick={() => handleDownload('4K')}
                >
                  4K UHD
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-xs sm:text-sm"
                  onClick={() => handleDownload('UltraWide')}
                >
                  UltraWide
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-xs sm:text-sm"
                  onClick={() => handleDownload('Mobile')}
                >
                  Mobile
                </Button>
              </div>
            </div>
          </div>
          
          {/* Engagement Options */}
          <div className="bg-background/40 backdrop-blur-xl rounded-xl border border-primary/10 p-4 sm:p-6 shadow-sm">
            <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Wallpaper Details</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Views</span>
                <span>{wallpaper.views || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Favorites</span>
                <span>{wallpaper.favorites || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Category</span>
                <span>{wallpaper.category}</span>
              </div>
              {wallpaper.author && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Author</span>
                  <span>{wallpaper.author.name}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date Added</span>
                <span>{new Date(wallpaper.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Similar Wallpapers */}
      {suggestedWallpapers.length > 0 && (
        <div className="mt-8 sm:mt-12">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">You May Also Like</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {suggestedWallpapers.map(suggested => (
              <Link
                key={suggested.id}
                href={`/wallpapers/${suggested.slug}`}
                className="group"
              >
                <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-background/70 border-primary/10 rounded-xl">
                  <div className="relative aspect-[4/3]">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30 z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <NextImage
                      src={suggested.imageUrl}
                      alt={suggested.title}
                      fill={true}
                      className="object-cover transition-all duration-500 group-hover:scale-110"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  </div>
                  <div className="p-3 sm:p-4">
                    <h4 className="text-sm sm:text-base font-medium line-clamp-1 group-hover:text-primary transition-colors">
                      {suggested.title}
                    </h4>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
      
      {/* Full-screen Image Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-full sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-[80vw] p-0 bg-transparent border-none shadow-none">
          <div className="relative w-full aspect-auto max-h-[90vh] flex items-center justify-center">
            <NextImage
              src={getCurrentImage()}
              alt={wallpaper.title}
              className="object-contain rounded-lg max-h-[90vh] w-auto"
              width={1920}
              height={1080}
              priority
            />
            
            <button
              className="absolute top-2 right-2 rounded-full bg-background/70 backdrop-blur-sm p-2 text-foreground hover:bg-background/90 transition-colors"
              onClick={() => setShowImageModal(false)}
            >
              ✕
            </button>
            
            {wallpaper.additionalImages && wallpaper.additionalImages.length > 0 && (
              <>
                <button 
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/70 backdrop-blur-sm p-2 text-foreground hover:bg-background/90 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    previousImage();
                  }}
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button 
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/70 backdrop-blur-sm p-2 text-foreground hover:bg-background/90 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
} 