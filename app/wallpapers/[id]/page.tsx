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
          await updateDoc(doc(db, 'prompts', wallpaper.id), {
            views: increment(1)
          })
        } catch (error) {
          console.error('Error incrementing views:', error)
        }
      }
    }
    
    if (wallpaper) {
      incrementViews()
    }
  }, [wallpaper])

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
          collection(db, 'prompts'), // Still using 'prompts' collection for backend compatibility
          where('slug', '==', params.id)
        )
        const slugSnapshot = await getDocs(slugQuery)
        
        if (!slugSnapshot.empty) {
          const doc = slugSnapshot.docs[0]
          setWallpaper({ id: doc.id, ...doc.data() } as Wallpaper)
          return
        }

        // If not found by slug, try to find by ID (for backward compatibility)
        const docRef = doc(db, 'prompts', params.id as string)
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
          collection(db, 'prompts'), // Still using 'prompts' collection
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
      await updateDoc(doc(db, 'prompts', wallpaper.id), {
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

  const handleDownload = useCallback((resolution?: string) => {
    if (!wallpaper?.imageUrl) return
    
    const a = document.createElement('a')
    a.href = wallpaper.imageUrl
    a.download = `${wallpaper.title.replace(/\s+/g, '-')}_${resolution || 'HD'}.jpg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    
    toast({
      title: "Downloading wallpaper",
      description: resolution ? `Resolution: ${resolution}` : "",
    })
  }, [wallpaper])

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading stunning wallpaper...</p>
        </div>
      </div>
    )
  }

  if (error || !wallpaper) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background">
        <h1 className="text-2xl font-bold mb-4">Wallpaper Not Found</h1>
        <p className="text-muted-foreground mb-6">{error || 'The requested wallpaper could not be found'}</p>
        <Button onClick={() => router.push('/wallpapers')}>Browse Wallpapers</Button>
      </div>
    )
  }

  // Current image source (main image or additional image)
  const currentImageSrc = currentImageIndex === 0
    ? wallpaper.imageUrl
    : wallpaper.additionalImages && wallpaper.additionalImages[currentImageIndex - 1].url

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      {/* Blurred background effect - subtle version to match site aesthetic */}
      <div 
        className="fixed inset-0 opacity-10 blur-3xl pointer-events-none"
        style={{
          backgroundImage: `url(${currentImageSrc})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-primary/10 h-16">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => router.back()} 
            className="group flex items-center gap-2 hover:text-primary transition-colors"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Gallery</span>
          </Button>
          
          <div className="flex items-center gap-3">
            <Tabs defaultValue={previewMode} className="w-[180px]">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="light" onClick={() => setPreviewMode('light')}>
                  <Sun className="h-4 w-4 mr-1" /> Light
                </TabsTrigger>
                <TabsTrigger value="dark" onClick={() => setPreviewMode('dark')}>
                  <Moon className="h-4 w-4 mr-1" /> Dark
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Wallpaper Title - Desktop */}
        <div className="hidden md:block mb-6">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{wallpaper.title}</h1>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground">
              {wallpaper.category}
            </Badge>
            {wallpaper.author && (
              <span className="text-sm text-muted-foreground">by <span className="text-foreground/90 font-medium">{wallpaper.author.name}</span></span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Wallpaper Image (Larger) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Main Wallpaper Display */}
            <div className="relative overflow-hidden rounded-xl bg-background/50 border border-primary/10 shadow-sm">
              <div className="relative aspect-auto flex items-center justify-center p-6">
                <img
                  src={currentImageSrc}
                  alt={wallpaper.title}
                  className="max-h-[65vh] max-w-full object-contain transition-all duration-300"
                />
                
                {/* Gallery Navigation */}
                {wallpaper.additionalImages && wallpaper.additionalImages.length > 0 && (
                  <>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/30 text-white rounded-full backdrop-blur-sm transition-all"
                      onClick={previousImage}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/30 text-white rounded-full backdrop-blur-sm transition-all"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </>
                )}
                
                {/* Fullscreen Button */}
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-4 right-4 bg-black/20 hover:bg-black/30 text-white rounded-full p-2 backdrop-blur-sm transition-all"
                  onClick={() => setShowImageModal(true)}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>

              {/* Image Info */}
              <div className="px-6 py-4 flex justify-between items-center border-t border-primary/5 bg-muted/20">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div>
                  <p className="text-sm text-muted-foreground font-medium">
                    {currentImageIndex === 0 ? 'Main image' : `Image ${currentImageIndex} of ${(wallpaper.additionalImages?.length || 0) + 1}`}
                  </p>
                </div>
                
                {/* Stats Information */}
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4">
                      <NextImage width={16} height={16} src="/icons/eye.svg" alt="Views" />
                    </div>
                    <span>{wallpaper.views || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-primary/70" />
                    <span>{wallpaper.favorites || 0}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Image Gallery */}
            {wallpaper.additionalImages && wallpaper.additionalImages.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-2 pt-1 px-1 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent snap-x">
                <div
                  className={cn(
                    "relative h-20 w-32 flex-shrink-0 rounded-lg cursor-pointer border-2 hover:shadow-lg transition-all duration-300 snap-start",
                    currentImageIndex === 0 ? "border-primary shadow-primary/20" : "border-transparent hover:border-primary/50"
                  )}
                  onClick={() => setCurrentImageIndex(0)}
                >
                  <NextImage
                    src={wallpaper.imageUrl}
                    alt="Thumbnail"
                    fill={true}
                    className="object-cover rounded-lg"
                  />
                </div>
                {wallpaper.additionalImages.map((img, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "relative h-20 w-32 flex-shrink-0 rounded-lg cursor-pointer border-2 hover:shadow-lg transition-all duration-300 snap-start",
                      currentImageIndex === idx + 1 ? "border-primary shadow-primary/20" : "border-transparent hover:border-primary/50"
                    )}
                    onClick={() => setCurrentImageIndex(idx + 1)}
                  >
                    <NextImage
                      src={img.url}
                      alt="Thumbnail"
                      fill={true}
                      className="object-cover rounded-lg"
                    />
                  </div>
                ))}
              </div>
            )}
           
            {/* Mobile Title - Only shown on mobile */}
            <div className="block md:hidden">
              <div className="bg-background/40 backdrop-blur-xl rounded-xl border border-primary/10 p-5 space-y-3">
                <div>
                  <Badge variant="secondary" className="mb-2 bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground">
                    {wallpaper.category}
                  </Badge>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{wallpaper.title}</h1>
                </div>
                <p className="text-muted-foreground text-sm">{wallpaper.description}</p>
              </div>
            </div>
            
            {/* Similar Wallpapers Section */}
            {suggestedWallpapers.length > 0 && (
              <div className="mt-6">
                <h2 className="text-xl font-bold mb-4">Similar Wallpapers</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
                            sizes="(max-width: 768px) 50vw, 33vw"
                          />
                        </div>
                        <div className="p-3">
                          <h4 className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
                            {suggested.title}
                          </h4>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            
            {/* Admin image controls */}
            {isAdmin && isEditing && (
              <div className="space-y-4 mt-4 border border-primary/10 rounded-xl p-4 bg-background/60 backdrop-blur-xl">
                <h3 className="font-medium">Manage Images</h3>
                <div className="space-y-1">
                  <MultiImageUpload
                    onImagesSelected={handleAddImages}
                    disabled={isUploadingImages}
                  />
                </div>
                
                {additionalImages.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Additional Images</h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {additionalImages.map((url, idx) => (
                        <div key={idx} className="relative group">
                          <div className="relative aspect-square rounded overflow-hidden">
                            <NextImage
                              src={url}
                              alt={`Additional image ${idx + 1}`}
                              fill={true}
                              className="object-cover"
                            />
                          </div>
                          <Button
                            size="icon"
                            variant="destructive"
                            className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveImage(idx)}
                          >
                            <ChevronLeft className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Right: Info Panel & Download Options */}
          <div className="lg:col-span-4 space-y-6">
            {/* Description - Desktop Only */}
            <div className="hidden md:block bg-background/40 backdrop-blur-xl rounded-xl border border-primary/10 p-6 shadow-sm">
              {!isEditing ? (
                <div className="prose max-w-none dark:prose-invert prose-p:my-3">
                  <h3 className="text-lg font-medium mb-3 text-foreground">Description</h3>
                  <p className="whitespace-pre-wrap text-foreground/80 leading-relaxed">
                    {wallpaper.description}
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-medium mb-3 text-foreground">Description</h3>
                  <Textarea
                    className="min-h-[120px] border-primary/20 bg-background/50"
                    placeholder="Enter wallpaper description..."
                    value={editedDescription}
                    onChange={e => setEditedDescription(e.target.value)}
                  />
                </div>
              )}
              
              {/* Admin Controls */}
              {isAdmin && (
                <div className="mt-4 pt-4 border-t border-primary/10">
                  {!isEditing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1.5"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleSaveWallpaper}
                        disabled={isUploadingImages}
                        className="flex items-center gap-1.5"
                      >
                        {isUploadingImages ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ChevronLeft className="w-4 h-4" />
                        )}
                        Save
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Download Options */}
            <div className="bg-background/40 backdrop-blur-xl rounded-xl border border-primary/10 p-6 shadow-sm">
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <Download className="w-4 h-4 mr-2 text-primary" />
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
                    className="w-full"
                    onClick={() => handleDownload('HD')}
                  >
                    HD (1080p)
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleDownload('4K')}
                  >
                    4K UHD
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleDownload('UltraWide')}
                  >
                    UltraWide
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleDownload('Mobile')}
                  >
                    Mobile
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Engagement Options */}
            <div className="bg-background/40 backdrop-blur-xl rounded-xl border border-primary/10 p-6 shadow-sm">
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  className={cn(
                    "w-full flex flex-col gap-1 h-auto py-4",
                    isLiked && "text-primary border-primary/50 bg-primary/5" 
                  )}
                  onClick={handleLike}
                >
                  <Heart className={cn("h-5 w-5", isLiked ? "fill-primary text-primary" : "")} />
                  <span className="text-xs">Like</span>
                </Button>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full flex flex-col gap-1 h-auto py-4",
                    isSaved && "text-primary border-primary/50 bg-primary/5"
                  )}
                  onClick={handleSave}
                >
                  <Bookmark className={cn("h-5 w-5", isSaved ? "fill-primary text-primary" : "")} />
                  <span className="text-xs">Save</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full flex flex-col gap-1 h-auto py-4"
                  onClick={handleShare}
                >
                  <Share2 className="h-5 w-5" />
                  <span className="text-xs">Share</span>
                </Button>
              </div>
            </div>
            
            {/* Technical Details */}
            {(wallpaper.resolutions?.length || wallpaper.promptText) && (
              <div className="bg-background/40 backdrop-blur-xl rounded-xl border border-primary/10 p-6 shadow-sm">
                <h3 className="text-lg font-medium mb-4">Technical Details</h3>
                
                {/* Resolutions */}
                {wallpaper.resolutions && wallpaper.resolutions.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2 text-muted-foreground">Available Resolutions</h4>
                    <div className="flex flex-wrap gap-2">
                      {wallpaper.resolutions.map((resolution, idx) => (
                        <Badge key={idx} variant="outline" className="px-3 py-1 bg-background/50 border-primary/20 hover:border-primary/50 transition-all">
                          {resolution}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Prompt Text */}
                {wallpaper.promptText && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-muted-foreground flex items-center gap-2">
                      <span>AI Generation Prompt</span>
                      <Badge variant="outline" className="text-xs bg-secondary/10 text-secondary">AI</Badge>
                    </h4>
                    <div className="bg-muted/30 p-3 rounded-lg border border-primary/5">
                      <pre className="whitespace-pre-wrap text-xs overflow-auto text-foreground/80 max-h-[120px] scrollbar-thin scrollbar-thumb-primary/20">
                        {wallpaper.promptText}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Fullscreen Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-[95vw] w-auto h-auto p-0 border-none bg-black">
          <div className="flex items-center justify-center h-screen">
            <img
              src={currentImageSrc || ''}
              alt={wallpaper.title}
              className="max-h-screen max-w-full object-contain"
            />
          </div>
          
          {/* Navigation for fullscreen */}
          {wallpaper.additionalImages && wallpaper.additionalImages.length > 0 && (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 rounded-full transition-all"
                onClick={previousImage}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 rounded-full transition-all"
                onClick={nextImage}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}
          
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowImageModal(false)}
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full transition-all"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
} 