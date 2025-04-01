'use client'

import { useState, useEffect, useCallback, useRef, TouchEvent, useMemo } from 'react'
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
  downloads?: number
  resolutions?: string[]
  author?: {
    name: string
    avatar?: string
  }
  promptText?: string
  slug: string
}

// Helper function to sanitize R2 URLs if needed - moved outside component for memoization
function sanitizeR2Url(url: string): string {
  if (!url || typeof url !== 'string') return '';
  
  // Handle local paths directly
  if (url.startsWith('/')) return url;
  
  // Quick check for properly formed URLs
  if (url.startsWith('https://')) return url;
  
  // Convert HTTP to HTTPS for R2 URLs (they require HTTPS)
  if (url.startsWith('http://') && (url.includes('.r2.dev') || url.includes('cloudflarestorage'))) {
    return url.replace('http://', 'https://');
  }
  
  // Fix common R2 URL issues - add https:// to URLs without protocol
  if ((url.includes('.r2.dev') || url.includes('cloudflarestorage')) && !url.startsWith('http')) {
    return `https://${url}`;
  }
  
  // For URLs that look valid but don't have a protocol, add https:// as a default
  if (!url.startsWith('http') && !url.startsWith('/') && url.includes('.')) {
    return `https://${url}`;
  }
  
  return url;
}

export default function WallpaperPage() {
  const params = useParams()
  const router = useRouter()
  const [wallpaper, setWallpaper] = useState<Wallpaper | null>(null)
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
  const [isLoading, setIsLoading] = useState(true)
  
  // Touch event handlers for main image swipe
  const handleTouchStart = (e: TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }
  
  const handleTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }
  
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50
    
    if (isLeftSwipe) {
      nextImage()
    }
    
    if (isRightSwipe) {
      previousImage()
    }
    
    setTouchStart(null)
    setTouchEnd(null)
  }
  
  // Touch event handlers for modal image swipe
  const handleModalTouchStart = (e: TouchEvent) => {
    setModalTouchStart(e.targetTouches[0].clientX)
  }
  
  const handleModalTouchMove = (e: TouchEvent) => {
    setModalTouchEnd(e.targetTouches[0].clientX)
  }
  
  const handleModalTouchEnd = () => {
    if (!modalTouchStart || !modalTouchEnd) return
    const distance = modalTouchStart - modalTouchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50
    
    if (isLeftSwipe) {
      nextImage()
    }
    
    if (isRightSwipe) {
      previousImage()
    }
    
    setModalTouchStart(null)
    setModalTouchEnd(null)
  }
  
  // Memoize the main image URL to avoid unnecessary re-calculations
  const mainImageUrl = useMemo(() => {
    return wallpaper ? sanitizeR2Url(wallpaper.imageUrl) : '';
  }, [wallpaper?.imageUrl]);
  
  // Pre-sanitize additional images once when they're loaded
  useEffect(() => {
    if (wallpaper?.additionalImages) {
      try {
        // Process and sanitize additional images just once
        const sanitizedUrls = wallpaper.additionalImages
          .map(img => sanitizeR2Url(img.url))
          .filter(Boolean);
        
        setAdditionalImages(sanitizedUrls);
      } catch (error) {
        console.error('Error processing additional images:', error);
        setAdditionalImages([]);
      }
    }
    
    if (wallpaper?.description) {
      setEditedDescription(wallpaper.description);
    }
  }, [wallpaper?.additionalImages, wallpaper?.description]);

  // Memoize the current image URL to prevent recalculations on every render
  const currentImageUrl = useMemo(() => {
    if (!wallpaper) return '';
    
    if (currentImageIndex === 0) {
      return mainImageUrl;
    }
    
    const additionalIndex = currentImageIndex - 1;
    if (additionalIndex >= 0 && additionalIndex < additionalImages.length) {
      return additionalImages[additionalIndex];
    }
    
    return mainImageUrl;
  }, [mainImageUrl, additionalImages, currentImageIndex, wallpaper]);

  // Memoize the navigation functions to prevent re-creation on every render
  const { nextImage, previousImage } = useMemo(() => ({
    nextImage: () => {
      const maxIndex = additionalImages.length;
      setCurrentImageIndex(prev => 
        prev < maxIndex ? prev + 1 : 0
      );
    },
    previousImage: () => {
      const maxIndex = additionalImages.length;
      setCurrentImageIndex(prev => 
        prev > 0 ? prev - 1 : maxIndex
      );
    }
  }), [additionalImages.length]);

  // Debug log for image URLs when they change
  useEffect(() => {
    if (wallpaper) {
      console.log('Wallpaper image URL:', {
        main: wallpaper.imageUrl,
        sanitized: sanitizeR2Url(wallpaper.imageUrl),
        additionalCount: wallpaper.additionalImages?.length || 0
      });
      
      // Log a sample of additional image URLs if they exist
      if (wallpaper.additionalImages && wallpaper.additionalImages.length > 0) {
        const sampleSize = Math.min(wallpaper.additionalImages.length, 3);
        const sample = wallpaper.additionalImages.slice(0, sampleSize);
        
        console.log('Sample additional images:', sample.map(img => ({
          original: img.url,
          sanitized: sanitizeR2Url(img.url)
        })));
      }
    }
  }, [wallpaper]);

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
      setIsLoading(true)
      try {
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
            setIsLoading(false)
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
                setIsLoading(false)
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
              setIsLoading(false)
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
            setIsLoading(false)
            return
          }
        } catch (slugError) {
          console.error('Error in slug query:', slugError)
        }

        // If we get here, the wallpaper wasn't found or couldn't be accessed
        console.log('[DEBUG] Wallpaper not found or permission denied');
        setError('Wallpaper not found or inaccessible')
        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching wallpaper:', error)
        setError('Failed to load wallpaper: ' + (error instanceof Error ? error.message : String(error)))
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchWallpaper()
    }
  }, [params.id])

  useEffect(() => {
    const fetchSuggestedWallpapers = async () => {
      if (!wallpaper) return;
      
      try {
        // First, try the API route which has server-side permissions
        try {
          const response = await fetch(`/api/public/related-wallpapers?id=${wallpaper.id}&category=${encodeURIComponent(wallpaper.category)}&limit=4`);
          
          if (response.ok) {
            const data = await response.json();
            if (data.wallpapers && Array.isArray(data.wallpapers) && data.wallpapers.length > 0) {
              console.log('Found related wallpapers via API:', data.wallpapers.length);
              setSuggestedWallpapers(data.wallpapers);
              return;
            }
          }
        } catch (apiError) {
          console.error('API route for related wallpapers failed:', apiError);
        }
        
        // If API route fails or returns no results, fall back to direct Firestore
        // Create a reliable query that includes isPublic filter
        const categoryQuery = query(
          collection(db, 'wallpapers'),
          where('category', '==', wallpaper.category),
          where('isPublic', '==', true), // Only get public wallpapers
          limit(10) // Get more to ensure we have enough after filtering
        );
        
        const suggestedSnapshot = await getDocs(categoryQuery);
        
        // Filter out the current wallpaper client-side
        const suggestions = suggestedSnapshot.docs
          .map(doc => ({ 
            id: doc.id, 
            ...doc.data(),
          } as Wallpaper))
          .filter(item => item.id !== wallpaper.id && item.slug !== wallpaper.slug)
          .slice(0, 4); // Only use up to 4
        
        if (suggestions.length === 0) {
          console.log('No related wallpapers found, trying fallback query');
          // Fallback query - just get recent public wallpapers
          const fallbackQuery = query(
            collection(db, 'wallpapers'),
            where('isPublic', '==', true),
            limit(8)
          );
          
          const fallbackSnapshot = await getDocs(fallbackQuery);
          const fallbackSuggestions = fallbackSnapshot.docs
            .map(doc => ({ 
              id: doc.id, 
              ...doc.data(),
            } as Wallpaper))
            .filter(item => item.id !== wallpaper.id && item.slug !== wallpaper.slug)
            .slice(0, 4);
            
          setSuggestedWallpapers(fallbackSuggestions);
        } else {
          setSuggestedWallpapers(suggestions);
        }
      } catch (error) {
        console.error('Error fetching suggested wallpapers:', error);
        // If all else fails, clear suggested wallpapers
        setSuggestedWallpapers([]);
      }
    };

    if (wallpaper) {
      fetchSuggestedWallpapers();
    }
  }, [wallpaper?.id, wallpaper?.category]);

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

  const handleDownload = async (resolution?: string) => {
    if (!wallpaper) return;
    
    try {
      // Use the memoized current image URL
      const downloadUrl = currentImageUrl;
      if (!downloadUrl) return;
      
      // Show loading toast
      toast({
        title: "Download Started",
        description: "Preparing your wallpaper...",
      });

      // Increment download count in Firestore
      if (wallpaper.id) {
        try {
          const wallpaperRef = doc(db, 'wallpapers', wallpaper.id);
          
          // Update the downloads in Firestore
          await updateDoc(wallpaperRef, {
            downloads: increment(1)
          });
          
          // Update local state to reflect the incremented download count
          setWallpaper(prev => {
            if (!prev) return null;
            const currentDownloads = prev.downloads || 0;
            return {
              ...prev,
              downloads: currentDownloads + 1
            };
          });
        } catch (error) {
          console.error('Error incrementing download count:', error);
          // Continue with download even if tracking fails
        }
      }

      // For R2 URLs, we need to use the API route to handle authentication
      if (downloadUrl.includes('.r2.cloudflarestorage.com')) {
        try {
          const response = await fetch(`/api/download?url=${encodeURIComponent(downloadUrl)}&id=${wallpaper.id}`);
          if (!response.ok) throw new Error(`Download failed: ${response.status}`);
          
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = `${wallpaper.title.replace(/[^a-zA-Z0-9-_]/g, '-')}-wallpaper.jpg`;
          document.body.appendChild(a);
          a.click();
          
          // Clean up
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
          }, 100);
          
          toast({
            title: "Download Complete",
            description: "Wallpaper downloaded successfully",
          });
          return;
        } catch (error) {
          console.error('Error downloading from R2:', error);
          throw new Error('Failed to download from R2 storage');
        }
      }
      
      // For non-R2 URLs (local or external)
      try {
        // For local paths, convert to full URL
        let finalUrl = downloadUrl;
        if (finalUrl.startsWith('/')) {
          finalUrl = `${window.location.origin}${finalUrl}`;
        }
        
        const response = await fetch(finalUrl);
        if (!response.ok) throw new Error(`Download failed: ${response.status}`);
        
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `${wallpaper.title.replace(/[^a-zA-Z0-9-_]/g, '-')}-wallpaper.jpg`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
        }, 100);
        
        toast({
          title: "Download Complete",
          description: "Wallpaper downloaded successfully",
        });
      } catch (error) {
        console.error('Error downloading wallpaper:', error);
        throw error; // Re-throw to be caught by the outer catch
      }
    } catch (error) {
      console.error('Error downloading wallpaper:', error);
      toast({
        title: "Download Failed",
        description: "There was a problem downloading your wallpaper. Please try again.",
        variant: "destructive",
      });
    }
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

  const handleDownloadButtonClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    await handleDownload();
  };

  // Add back event listeners for touch events
  useEffect(() => {
    const imageContainer = mainImageRef.current;
    if (imageContainer) {
      imageContainer.addEventListener('touchstart', handleTouchStart as any);
      imageContainer.addEventListener('touchmove', handleTouchMove as any);
      imageContainer.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        imageContainer.removeEventListener('touchstart', handleTouchStart as any);
        imageContainer.removeEventListener('touchmove', handleTouchMove as any);
        imageContainer.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [mainImageRef, touchStart, touchEnd, wallpaper, nextImage, previousImage]);

  // Add back event listeners for modal touch events
  useEffect(() => {
    const modalContainer = modalImageRef.current;
    if (modalContainer && showImageModal) {
      modalContainer.addEventListener('touchstart', handleModalTouchStart as any);
      modalContainer.addEventListener('touchmove', handleModalTouchMove as any);
      modalContainer.addEventListener('touchend', handleModalTouchEnd);
      
      return () => {
        modalContainer.removeEventListener('touchstart', handleModalTouchStart as any);
        modalContainer.removeEventListener('touchmove', handleModalTouchMove as any);
        modalContainer.removeEventListener('touchend', handleModalTouchEnd);
      };
    }
  }, [modalImageRef, modalTouchStart, modalTouchEnd, wallpaper, nextImage, previousImage, showImageModal]);

  // Memoize the suggested wallpapers with sanitized URLs
  const optimizedSuggestedWallpapers = useMemo(() => {
    return suggestedWallpapers
      // Filter out invalid wallpapers
      .filter(item => 
        item && 
        item.id && 
        typeof item.imageUrl === 'string' && 
        item.title
      )
      .map(item => ({
        ...item,
        sanitizedImageUrl: sanitizeR2Url(item.imageUrl || ''),
      }));
  }, [suggestedWallpapers]);

  // Debug log for suggested wallpapers
  useEffect(() => {
    console.log('Suggested wallpapers count:', suggestedWallpapers.length);
    
    // Check if we have any issues with the images or data structure
    if (suggestedWallpapers.length > 0) {
      suggestedWallpapers.forEach((wallpaper, index) => {
        // Check for missing required properties
        const missingProps = [];
        if (!wallpaper.id) missingProps.push('id');
        if (!wallpaper.title) missingProps.push('title');
        if (!wallpaper.imageUrl) missingProps.push('imageUrl');
        
        console.log(`Wallpaper #${index + 1}:`, {
          id: wallpaper.id,
          title: wallpaper.title,
          category: wallpaper.category,
          hasImageUrl: !!wallpaper.imageUrl,
          sanitizedUrl: sanitizeR2Url(wallpaper.imageUrl),
          missingProps: missingProps.length ? missingProps : 'none'
        });
      });
      
      // Log if we have any issues with optimizedSuggestedWallpapers
      console.log('Optimized wallpapers length:', optimizedSuggestedWallpapers.length);
    } else {
      console.log('No suggested wallpapers found. Make sure the API or query is working correctly.');
    }
  }, [suggestedWallpapers, optimizedSuggestedWallpapers.length]);

  // Add skeleton loading UI when wallpaper is not yet loaded
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl animate-fadeIn">
        <div className="mb-8 flex flex-col md:flex-row gap-6">
          {/* Skeleton for main image */}
          <div className="w-full md:w-2/3 lg:w-3/4 animate-pulse">
            <div className="aspect-[3/2] md:aspect-[16/9] lg:aspect-[2/1] rounded-2xl bg-muted/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/5 animate-gradient bg-gradient-size"></div>
              <div className="absolute bottom-4 right-4 flex gap-2">
                <div className="w-10 h-10 rounded-full bg-muted/30"></div>
                <div className="w-10 h-10 rounded-full bg-muted/30"></div>
                <div className="w-10 h-10 rounded-full bg-muted/30"></div>
              </div>
            </div>
          </div>
          
          {/* Skeleton for details side panel */}
          <div className="w-full md:w-1/3 lg:w-1/4 space-y-4">
            <div className="h-8 w-3/4 bg-muted/40 rounded-lg"></div>
            <div className="h-20 w-full bg-muted/30 rounded-lg"></div>
            <div className="space-y-2">
              <div className="h-5 w-1/2 bg-muted/30 rounded"></div>
              <div className="h-5 w-1/3 bg-muted/30 rounded"></div>
            </div>
            <div className="flex gap-2 flex-wrap mt-4">
              <div className="h-8 w-24 rounded-full bg-muted/40"></div>
              <div className="h-8 w-28 rounded-full bg-muted/40"></div>
            </div>
            <div className="space-y-2 pt-4">
              <div className="h-10 w-full bg-primary/20 rounded-lg"></div>
              <div className="h-10 w-full bg-muted/30 rounded-lg"></div>
            </div>
          </div>
        </div>
        
        {/* Skeleton for suggested wallpapers */}
        <div className="mt-12">
          <div className="h-6 w-48 bg-muted/40 rounded mb-6"></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-muted/30 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[60vh] animate-fadeIn">
        <div className="bg-red-50 dark:bg-red-950/30 p-6 rounded-lg mb-4 text-red-600 dark:text-red-400">
          <h2 className="text-xl font-bold mb-2">Error Loading Wallpaper</h2>
          <p>{error}</p>
        </div>
        <Button onClick={() => router.back()} variant="outline">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    )
  }

  // If not loading and no data was found
  if (!wallpaper) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[60vh] animate-fadeIn">
        <div className="bg-amber-50 dark:bg-amber-950/30 p-6 rounded-lg mb-4 text-amber-600 dark:text-amber-400">
          <h2 className="text-xl font-bold mb-2">Wallpaper Not Found</h2>
          <p>The wallpaper you're looking for does not exist or is no longer available.</p>
        </div>
        <Button onClick={() => router.push('/latest')} variant="outline">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Browse Wallpapers
        </Button>
      </div>
    )
  }

  // Render the actual content with transitions and animations when data is loaded
  return (
    <>
      {/* Image modal for fullscreen view */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] p-0 bg-black/95 border-none flex items-center justify-center overflow-hidden"
          onTouchStart={handleModalTouchStart}
          onTouchMove={handleModalTouchMove}
          onTouchEnd={handleModalTouchEnd}>
          <Button 
            variant="ghost" 
            onClick={() => setShowImageModal(false)} 
            className="absolute top-2 right-2 text-white z-50 p-2 h-auto"
          >
            <X className="h-6 w-6" />
          </Button>
          
          <div 
            ref={modalImageRef}
            className="relative w-full h-full flex items-center justify-center transition-transform duration-300 ease-out animate-fadeIn"
          >
            <Image 
              src={currentImageUrl} 
              alt={wallpaper.title}
              className="object-contain"
              fill
              sizes="100vw"
              priority
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="absolute bottom-4 right-4 flex gap-2">
            <Button 
              size="sm" 
              variant="secondary"
              onClick={previousImage}
              className="p-2 bg-black/60 hover:bg-black/80 text-white border-none"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button 
              size="sm" 
              variant="secondary"
              onClick={nextImage}
              className="p-2 bg-black/60 hover:bg-black/80 text-white border-none"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div 
        className="container mx-auto px-4 py-8 max-w-7xl animate-fadeIn"
        style={{ 
          // Use a subtle animation
          animationDuration: '0.5s',
          animationDelay: '0.1s'
        }}
      >
        <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 lg:items-start">
            {/* Main Content Area - Adjusted to 9/12 columns */}
            <section className="lg:col-span-9 order-1 lg:order-1 space-y-3 lg:sticky" style={{ top: 'var(--header-offset, 2rem)' }}>
              {/* Wallpaper Image Container */}
              <section 
                ref={mainImageRef}
                className={cn(
                  "w-full min-h-[400px] h-[calc(100vh-12rem)] relative rounded-2xl overflow-hidden",
                  "border border-border/30 shadow-xl bg-muted/5"
                )}
                onClick={() => setShowImageModal(true)}
              >
                <ServerImage
                  src={mainImageUrl}
                  alt={wallpaper.title}
                  fallbackSrc="/default-wallpaper.jpg"
                  fill={true}
                  className="object-contain"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 75vw, 66vw"
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

            {/* Sidebar - Adjusted to 3/12 columns */}
            <aside className="lg:col-span-3 space-y-3 order-2 lg:order-2">
              <div className="lg:sticky space-y-3" style={{ top: 'var(--header-offset, 2rem)' }}>
                {/* Download Section - Most Important Action */}
                <section className="bg-background/40 backdrop-blur-xl rounded-xl border border-primary/10 p-3 sm:p-4 shadow-sm">
                  <div className="space-y-3">
                    <Button
                      size="lg"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                      onClick={handleDownloadButtonClick}
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
                          <span className="text-sm">{wallpaper.downloads || 0}</span>
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
          
          {/* Similar Wallpapers - Adjusted grid */}
          {suggestedWallpapers.length > 0 ? (
            <section className="mt-6 sm:mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold bg-gradient-to-r from-primary/80 to-secondary/80 bg-clip-text text-transparent">
                  You May Also Like
                </h2>
                <Button variant="link" asChild className="text-primary hover:text-primary/80">
                  <Link href={`/category/${encodeURIComponent(wallpaper.category)}`}>
                    View More
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {optimizedSuggestedWallpapers.map((item) => (
                  <Link 
                    href={`/wallpapers/${item.slug || item.id}`}
                    key={item.id}
                    className="group relative overflow-hidden rounded-xl bg-background/40 backdrop-blur-sm transition-all duration-300 hover:shadow-lg"
                  >
                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-border/10">
                      <ServerImage
                        src={item.sanitizedImageUrl}
                        alt={item.title}
                        fallbackSrc="/default-wallpaper.jpg"
                        fill={true}
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-110 group-hover:brightness-110"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                        quality={75}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <h3 className="mt-2 p-2 text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">{item.title}</h3>
                  </Link>
                ))}
              </div>
            </section>
          ) : (
            <section className="mt-8 bg-muted/10 p-6 rounded-xl border border-border/30 text-center">
              <h2 className="text-xl font-medium mb-2">Explore More Wallpapers</h2>
              <p className="text-muted-foreground mb-4">
                No related wallpapers found. Discover more in our collection.
              </p>
              <Button asChild>
                <Link href="/latest">
                  Browse Latest Wallpapers
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </section>
          )}
        </div>
      </div>
    </>
  )
} 