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
    <main className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 sm:gap-8">
        {/* Main Content Area - 5/7 columns on large screens */}
        <div className="lg:col-span-5 order-2 lg:order-1">
          {/* Wallpaper Image Container */}
          <div className={cn(
            "relative group mb-4 flex items-center justify-center",
            "bg-transparent",
            isAdmin && isEditing ? "aspect-auto min-h-[300px] border border-primary/10 rounded-xl p-4" : "h-auto"
          )}>
            {isAdmin && isEditing ? (
              <div>
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
                <div className="overflow-hidden rounded-xl w-full flex justify-center">
                  <img
                    src={getCurrentImage()}
                    alt={wallpaper.title}
                    className="max-h-[600px] rounded-xl object-contain hover:scale-105 transition-transform duration-500 cursor-pointer"
                    onClick={() => setShowImageModal(true)}
                  />
                </div>
                
                {/* Image Navigation Controls - Only shown when there are additional images */}
                {wallpaper.additionalImages && wallpaper.additionalImages.length > 0 && (
                  <>
                    <button 
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/70 backdrop-blur-sm p-2 sm:p-3 text-foreground hover:bg-background/90 transition-colors opacity-0 group-hover:opacity-100 shadow-lg"
                      onClick={previousImage}
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                    <button 
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/70 backdrop-blur-sm p-2 sm:p-3 text-foreground hover:bg-background/90 transition-colors opacity-0 group-hover:opacity-100 shadow-lg"
                      onClick={nextImage}
                      aria-label="Next image"
                    >
                      <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </>
                )}
              </>
            )}
          </div>
          
          {/* Image Thumbnails Row - Only if there are additional images */}
          {wallpaper.additionalImages && wallpaper.additionalImages.length > 0 && (
            <div className="flex gap-3 overflow-x-auto py-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent snap-x mb-6">
              <div
                className={cn(
                  "relative h-16 w-24 sm:h-20 sm:w-28 flex-shrink-0 rounded-xl cursor-pointer hover:shadow-xl transition-all duration-300 snap-start overflow-hidden",
                  currentImageIndex === 0 ? "ring-2 ring-primary shadow-lg" : "ring-0 hover:ring-1 hover:ring-primary/50"
                )}
                onClick={() => setCurrentImageIndex(0)}
              >
                <img
                  src={wallpaper.imageUrl}
                  alt="Thumbnail"
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-300 rounded-xl"
                />
              </div>
              {wallpaper.additionalImages.map((img, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "relative h-16 w-24 sm:h-20 sm:w-28 flex-shrink-0 rounded-xl cursor-pointer hover:shadow-xl transition-all duration-300 snap-start overflow-hidden",
                    currentImageIndex === idx + 1 ? "ring-2 ring-primary shadow-lg" : "ring-0 hover:ring-1 hover:ring-primary/50"
                  )}
                  onClick={() => setCurrentImageIndex(idx + 1)}
                >
                  <img
                    src={img.url}
                    alt="Thumbnail"
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300 rounded-xl"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar - 2/7 columns on large screens */}
        <div className="lg:col-span-2 space-y-4 order-1 lg:order-2">
          {/* Admin Controls */}
          {isAdmin && (
            <div className="bg-background/40 backdrop-blur-xl rounded-xl border border-primary/10 p-4 shadow-sm">
              <h3 className="text-base font-medium mb-3">Admin Controls</h3>
              
              <div className="space-y-2">
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
          
          {/* About This Wallpaper */}
          <div className="bg-background/40 backdrop-blur-xl rounded-xl border border-primary/10 p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base sm:text-lg font-medium">About this Wallpaper</h3>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <Heart className={cn(
                    "h-4 w-4 sm:h-5 sm:w-5 cursor-pointer transition-colors",
                    isLiked ? "fill-primary text-primary" : "text-muted-foreground hover:text-primary"
                  )} 
                  onClick={() => setIsLiked(!isLiked)}
                  />
                  <span className="text-xs sm:text-sm">{wallpaper.favorites || 0}</span>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 rounded-full"
                >
                  <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="sr-only">Share</span>
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn(
                    "h-8 w-8 p-0 rounded-full",
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
            
            <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-line mb-4">{wallpaper.description}</p>
            
            {wallpaper.promptText && (
              <details className="text-sm text-muted-foreground mt-4 pt-4 border-t border-primary/5">
                <summary className="cursor-pointer hover:text-foreground transition-colors">
                  <span className="font-medium">Prompt Used</span>
                </summary>
                <p className="mt-2 p-3 bg-muted/30 rounded-lg text-xs sm:text-sm font-mono">{wallpaper.promptText}</p>
              </details>
            )}
          </div>
          
          {/* Wallpaper Details */}
          <div className="bg-background/40 backdrop-blur-xl rounded-xl border border-primary/10 p-4 shadow-sm">
            <h3 className="text-base font-medium mb-3">Wallpaper Details</h3>
            
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Views</dt>
                <dd className="font-medium">{wallpaper.views || 0}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Favorites</dt>
                <dd className="font-medium">{wallpaper.favorites || 0}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Category</dt>
                <dd className="font-medium">{wallpaper.category}</dd>
              </div>
              {wallpaper.author && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Author</dt>
                  <dd className="font-medium">{wallpaper.author.name}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Date Added</dt>
                <dd className="font-medium">{new Date(wallpaper.createdAt).toLocaleDateString()}</dd>
              </div>
            </dl>
          </div>
          
          {/* Download Button */}
          <div className="bg-background/40 backdrop-blur-xl rounded-xl border border-primary/10 p-4 shadow-sm">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg w-full"
              onClick={() => handleDownload()}
            >
              <Download className="mr-2 h-5 w-5" />
              Download Wallpaper
            </Button>
          </div>
        </div>
      </div>
      
      {/* Similar Wallpapers - Full Width */}
      {suggestedWallpapers.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold bg-gradient-to-r from-primary/80 to-secondary/80 bg-clip-text text-transparent">You May Also Like</h2>
            <Button variant="link" asChild>
              <Link href={`/category/${wallpaper.category}`}>View More</Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {suggestedWallpapers.map(suggested => (
              <Link
                key={suggested.id}
                href={`/wallpapers/${suggested.slug || suggested.id}`}
                className="group"
              >
                <div className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 rounded-xl h-full">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <img
                      src={suggested.imageUrl}
                      alt={suggested.title}
                      className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 rounded-xl"
                    />
                    <div className="absolute bottom-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Badge variant="secondary" className="bg-primary/80 text-primary-foreground">
                        View
                      </Badge>
                    </div>
                  </div>
                  <div className="p-2 sm:p-3">
                    <h4 className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
                      {suggested.title}
                    </h4>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      
      {/* Full-screen Image Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-full sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-[80vw] p-0 bg-transparent border-none shadow-none">
          <div className="relative w-full aspect-auto max-h-[90vh] flex items-center justify-center">
            <img
              src={getCurrentImage()}
              alt={wallpaper.title}
              className="object-contain rounded-xl max-h-[90vh] max-w-full shadow-2xl"
            />
            
            <button
              className="absolute top-3 right-3 rounded-full bg-background/70 backdrop-blur-sm p-2 text-foreground hover:bg-background/90 transition-colors shadow-lg"
              onClick={() => setShowImageModal(false)}
            >
              ✕
            </button>
            
            {wallpaper.additionalImages && wallpaper.additionalImages.length > 0 && (
              <>
                <button 
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/70 backdrop-blur-sm p-3 text-foreground hover:bg-background/90 transition-colors shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    previousImage();
                  }}
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button 
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/70 backdrop-blur-sm p-3 text-foreground hover:bg-background/90 transition-colors shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
            
            {/* Quick Download Button in Modal */}
            <div className="absolute bottom-4 right-4">
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                onClick={() => {
                  handleDownload();
                  setShowImageModal(false);
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Wallpaper
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
} 