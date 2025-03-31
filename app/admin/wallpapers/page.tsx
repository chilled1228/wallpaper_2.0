'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ImageUpload } from '@/components/blog/image-upload'
import { toast } from '@/components/ui/use-toast'
import { db, auth } from '@/lib/firebase'
import { doc, getDoc, collection, getDocs, orderBy, query } from 'firebase/firestore'
import { Loader2, Trash2, Edit, Plus, Image as ImageIcon, Tag, Clock, FileText, Upload } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MultiImageUpload } from '@/components/blog/multi-image-upload'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"

interface ImageMetadata {
  url: string
  alt: string
  title: string
  caption: string
  description: string
}

interface Wallpaper {
  id: string
  title: string
  description: string
  promptText: string
  category: string
  imageUrl: string
  imageMetadata?: ImageMetadata
  additionalImages?: ImageMetadata[]
  isPublic?: boolean
  price: number
  createdAt: string
  status?: 'active' | 'draft' | 'archived'
  featured?: boolean
}

const categories = [
  'Nature',
  'Abstract',
  'Space',
  'Urban',
  'Minimal',
  'Animals',
  'Fantasy',
  'Technology',
  'Architecture',
  'Other'
]

const initialFormData = {
  title: '',
  description: '',
  promptText: '',
  category: '',
  imageUrl: '',
  price: '',
  imageMetadata: {
    url: '',
    alt: '',
    title: '',
    caption: '',
    description: ''
  },
  additionalImages: [],
  isPublic: false,
  status: 'draft' as const,
  featured: false
}

export default function AdminWallpapersPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    promptText: '',
    price: '0',
    category: '',
    imageUrl: '',
    imageMetadata: {
      url: '',
      alt: '',
      title: '',
      caption: '',
      description: ''
    },
    additionalImages: [] as ImageMetadata[],
    isPublic: false,
    status: 'active' as 'active' | 'draft' | 'archived',
    featured: false
  })
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [selectedWallpaper, setSelectedWallpaper] = useState<Wallpaper | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [wallpaperToDelete, setWallpaperToDelete] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("list")

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const user = auth.currentUser
        console.log('Checking auth state:', { userExists: !!user })
        
        if (!user) {
          console.log('No user found, redirecting to auth...')
          router.push('/auth?redirect=/admin/wallpapers')
          return
        }

        // Force token refresh to ensure we have the latest claims
        console.log('Refreshing user token...')
        await user.getIdToken(true)
        
        console.log('Fetching user document...')
        const userDocRef = doc(db, 'users', user.uid)
        const userDocSnap = await getDoc(userDocRef)
        
        console.log('User document exists:', userDocSnap.exists(), 'Is admin:', userDocSnap.data()?.isAdmin)
        
        if (!userDocSnap.exists() || !userDocSnap.data()?.isAdmin) {
          console.log('User is not admin, redirecting to home...')
          router.push('/')
          return
        }

        setIsAdmin(true)
        setIsLoading(false)
      } catch (error: any) {
        console.error('Detailed error in checkAdminStatus:', {
          errorMessage: error.message,
          errorCode: error.code,
          errorStack: error.stack
        })
        router.push('/')
      }
    }

    checkAdminStatus()
  }, [router])

  const fetchWallpapers = async () => {
    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error('No authentication token')

      const wallpapersRef = collection(db, 'wallpapers')
      const q = query(wallpapersRef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      
      const fetchedWallpapers = querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          title: data.title || '',
          description: data.description || '',
          promptText: data.promptText || '',
          category: data.category || '',
          imageUrl: data.imageUrl || '',
          imageMetadata: data.imageMetadata || {
            url: data.imageUrl || '',
            alt: '',
            title: '',
            caption: '',
            description: ''
          },
          additionalImages: data.additionalImages || [],
          isPublic: data.isPublic ?? true,
          price: data.price ?? 0,
          createdAt: data.createdAt || new Date().toISOString(),
          status: data.status || 'active',
          featured: data.featured ?? false
        } as Wallpaper
      })

      console.log(`Fetched ${fetchedWallpapers.length} wallpapers`)
      setWallpapers(fetchedWallpapers)
    } catch (error) {
      console.error('Error fetching wallpapers:', error)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchWallpapers()
    }
  }, [isAdmin])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Enhanced validation
    const validationErrors = [];
    
    if (!formData.title.trim()) validationErrors.push('Title is required');
    else if (formData.title.length < 3) validationErrors.push('Title must be at least 3 characters');
    
    if (!formData.description.trim()) validationErrors.push('Description is required');
    else if (formData.description.length < 10) validationErrors.push('Description must be at least 10 characters');
    
    if (!formData.category) validationErrors.push('Category is required');
    
    if (!formData.imageUrl) validationErrors.push('Main image is required');
    
    if (validationErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: validationErrors.join('. '),
        variant: "destructive"
      })
      return
    }

    try {
      setIsCreating(true)
      
      // Ensure we have a current user before proceeding
      if (!auth.currentUser) {
        throw new Error('You must be logged in to perform this action')
      }
      
      console.log('Getting ID token for current user')
      const tokenResult = await auth.currentUser.getIdTokenResult(true) // Force token refresh
      if (!tokenResult) throw new Error('No authentication token')
      
      // Validate image URL
      if (!formData.imageUrl.startsWith('https://')) {
        throw new Error('Invalid image URL. Make sure the image was uploaded properly.')
      }
      
      // Generate a slug from the title
      const slug = formData.title
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-')
        .substring(0, 60)
      
      console.log('Preparing wallpaper data with slug:', slug)

      // Ensure all required fields and proper data types
      const wallpaperData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        promptText: formData.promptText.trim(),
        category: formData.category,
        imageUrl: formData.imageUrl,
        imageMetadata: {
          ...formData.imageMetadata,
          url: formData.imageUrl,
          alt: formData.title.trim(),
          title: formData.title.trim(),
          description: formData.description.trim()
        },
        additionalImages: formData.additionalImages.map(img => ({
          ...img,
          alt: img.alt || formData.title.trim()
        })),
        isPublic: Boolean(formData.isPublic),
        price: Number(formData.price) || 0,
        status: formData.status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        slug,
        featured: Boolean(formData.featured)
      }

      console.log('Submitting wallpaper data:', JSON.stringify(wallpaperData, null, 2));

      const endpoint = selectedWallpaper 
        ? `/api/admin/wallpapers/${selectedWallpaper.id}` 
        : '/api/admin/wallpapers'
      
      const method = selectedWallpaper ? 'PUT' : 'POST'
      
      console.log(`Making ${method} request to ${endpoint}`)
      
      try {
        const response = await fetch(endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokenResult.token}`
          },
          body: JSON.stringify(wallpaperData)
        })

        const responseData = await response.json();
        console.log(`API ${method} response status:`, response.status, response.statusText)
        console.log('API response data:', responseData);
        
        if (!response.ok) {
          console.error('API error response:', responseData);
          const errorMessage = responseData.error || 
            responseData.message || 
            responseData.details || 
            (typeof responseData === 'string' ? responseData : 'Failed to save wallpaper');
            
          // Handle validation errors from server
          if (response.status === 400 && responseData.details) {
            throw new Error(`Validation error: ${responseData.details}`);
          }
          
          throw new Error(errorMessage)
        }

        console.log('API success response:', responseData);
        
        setFormData(initialFormData)
        setSelectedWallpaper(null)
        await fetchWallpapers()
        setActiveTab("list")
        
        toast({
          title: "Success",
          description: selectedWallpaper ? "Wallpaper updated successfully" : "Wallpaper created successfully",
        })
      } catch (fetchError: any) {
        console.error('Fetch error:', fetchError)
        throw new Error(`API request failed: ${fetchError.message || 'Unknown error'}`)
      }
    } catch (error: any) {
      console.error('Error saving wallpaper:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to save wallpaper",
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (wallpaperId: string) => {
    try {
      setIsDeleting(true)
      const tokenResult = await auth.currentUser?.getIdTokenResult()
      if (!tokenResult) throw new Error('No authentication token')

      const response = await fetch(`/api/admin/wallpapers/${wallpaperId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokenResult.token}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete wallpaper')
      }

      await fetchWallpapers()
      setDialogOpen(false)
      setWallpaperToDelete(null)
      
      toast({
        title: "Success",
        description: "Wallpaper deleted successfully",
      })
    } catch (error: any) {
      console.error('Error deleting wallpaper:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete wallpaper",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEdit = (wallpaper: Wallpaper) => {
    setSelectedWallpaper(wallpaper)
    setFormData({
      title: wallpaper.title,
      description: wallpaper.description,
      promptText: wallpaper.promptText || '',
      category: wallpaper.category,
      price: wallpaper.price.toString(),
      imageUrl: wallpaper.imageUrl,
      imageMetadata: wallpaper.imageMetadata || {
        url: wallpaper.imageUrl,
        alt: '',
        title: '',
        caption: '',
        description: ''
      },
      additionalImages: wallpaper.additionalImages || [],
      isPublic: wallpaper.isPublic ?? true,
      status: wallpaper.status || 'active',
      featured: wallpaper.featured ?? false
    })
    setActiveTab("create")
  }

  const handleCancel = () => {
    setSelectedWallpaper(null)
    setFormData(initialFormData)
  }

  const handleImageUpload = (url: string) => {
    setFormData(prev => ({
      ...prev,
      imageUrl: url,
      imageMetadata: {
        ...prev.imageMetadata,
        url
      }
    }))
  }

  const handleMultiImageUpload = (urls: string[]) => {
    const newImages = urls.map(url => ({
      url,
      alt: '',
      title: '',
      caption: '',
      description: ''
    }))

    setFormData(prev => ({
      ...prev,
      additionalImages: [...prev.additionalImages, ...newImages]
    }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wallpapers</h1>
          <p className="text-muted-foreground">
            Manage your wallpaper collection
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/wallpapers/bulk-upload')}
          >
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload
          </Button>
          
          <Button
            onClick={() => {
              setFormData(initialFormData)
              setActiveTab("create")
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Wallpaper
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">Wallpapers List</TabsTrigger>
          <TabsTrigger value="create">
            {selectedWallpaper ? 'Edit Wallpaper' : 'Add Wallpaper'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardContent className="pt-6">
              {wallpapers.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No wallpapers found</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Image</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Featured</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {wallpapers.map(wallpaper => (
                        <TableRow key={wallpaper.id}>
                          <TableCell>
                            <div className="relative h-10 w-10 rounded overflow-hidden bg-muted">
                              {wallpaper.imageUrl && (
                                <img 
                                  src={wallpaper.imageUrl} 
                                  alt={wallpaper.title}
                                  className="h-full w-full object-cover"
                                />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{wallpaper.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{wallpaper.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                wallpaper.status === 'active' 
                                  ? 'default' 
                                  : wallpaper.status === 'draft' 
                                    ? 'secondary' 
                                    : 'outline'
                              }
                            >
                              {wallpaper.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {wallpaper.featured ? 
                              <Badge variant="default">Featured</Badge> : 
                              <span className="text-muted-foreground">—</span>
                            }
                          </TableCell>
                          <TableCell>
                            {new Date(wallpaper.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleEdit(wallpaper)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                onClick={() => {
                                  setWallpaperToDelete(wallpaper.id);
                                  setDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        placeholder="Enter wallpaper title"
                        value={formData.title}
                        onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={value => setFormData(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Enter wallpaper description"
                        value={formData.description}
                        onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="min-h-[120px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="promptText">Generation Details (Optional)</Label>
                      <Textarea
                        id="promptText"
                        placeholder="Enter prompt text or AI generation details used to create this wallpaper"
                        value={formData.promptText}
                        onChange={e => setFormData(prev => ({ ...prev, promptText: e.target.value }))}
                        className="min-h-[120px]"
                      />
                    </div>

                    <div className="flex flex-col space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="isPublic">Public</Label>
                            <Switch
                              id="isPublic"
                              checked={formData.isPublic}
                              onCheckedChange={(checked) => setFormData({...formData, isPublic: checked})}
                            />
                          </div>
                          <p className="text-sm text-muted-foreground">Make this wallpaper visible to all users</p>
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="featured">Featured</Label>
                            <Switch
                              id="featured"
                              checked={formData.featured}
                              onCheckedChange={(checked) => setFormData({...formData, featured: checked})}
                            />
                          </div>
                          <p className="text-sm text-muted-foreground">Display this wallpaper in the featured section on the homepage</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={value => setFormData(prev => ({ ...prev, status: value as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Main Image</Label>
                      <div className="border rounded-lg overflow-hidden">
                        <ImageUpload
                          onChange={handleImageUpload}
                          value={formData.imageUrl}
                          onRemove={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                        />
                      </div>
                      {formData.imageUrl && (
                        <p className="text-xs text-muted-foreground break-all">
                          {formData.imageUrl}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Additional Images (Optional)</Label>
                      <div className="border rounded-lg p-4">
                        <MultiImageUpload onImagesSelected={handleMultiImageUpload} />
                      </div>

                      {formData.additionalImages.length > 0 && (
                        <div className="mt-2">
                          <h4 className="text-sm font-medium mb-2">Additional Images ({formData.additionalImages.length})</h4>
                          <div className="grid grid-cols-3 gap-2">
                            {formData.additionalImages.map((img, idx) => (
                              <div key={idx} className="relative group">
                                <div className="bg-muted aspect-square rounded-md overflow-hidden">
                                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                                </div>
                                <Button
                                  size="icon"
                                  variant="destructive"
                                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => {
                                    setFormData(prev => ({
                                      ...prev,
                                      additionalImages: prev.additionalImages.filter((_, i) => i !== idx)
                                    }))
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  {selectedWallpaper && (
                    <Button type="button" variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                  )}
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {selectedWallpaper ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      selectedWallpaper ? 'Update Wallpaper' : 'Create Wallpaper'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Wallpaper</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this wallpaper? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => wallpaperToDelete && handleDelete(wallpaperToDelete)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 