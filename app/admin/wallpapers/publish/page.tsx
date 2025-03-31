"use client";

import { useState, useEffect } from 'react';
import { db, storage } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, limit, doc, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { ref, getDownloadURL, listAll } from 'firebase/storage';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Loader2, AlertCircle, Upload, RefreshCw, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface WallpaperWithFile {
  id: string;
  path: string;
  downloadURL: string;
  isPublished: boolean;
  isSelected: boolean;
}

export default function PublishWallpapersPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishProgress, setPublishProgress] = useState(0);
  const [wallpapers, setWallpapers] = useState<WallpaperWithFile[]>([]);
  const [selectedCount, setSelectedCount] = useState(0);
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();
  
  // Fetch storage files and check which ones are already published
  useEffect(() => {
    const fetchWallpapers = async () => {
      setIsLoading(true);
      try {
        // Get all storage files in wallpapers folder
        const storageRef = ref(storage, 'wallpapers');
        const result = await listAll(storageRef);
        
        // Get all published wallpapers from Firestore
        const publishedWallpapersSnapshot = await getDocs(collection(db, 'wallpapers'));
        const publishedURLs = new Set(publishedWallpapersSnapshot.docs.map(doc => doc.data().imageUrl));
        
        // Process each storage file
        const wallpaperPromises = result.items.map(async (item) => {
          try {
            const downloadURL = await getDownloadURL(item);
            return {
              id: item.name,
              path: item.fullPath,
              downloadURL,
              isPublished: publishedURLs.has(downloadURL),
              isSelected: false
            };
          } catch (error) {
            console.error(`Error getting download URL for ${item.name}:`, error);
            return null;
          }
        });
        
        const wallpaperResults = await Promise.all(wallpaperPromises);
        const validWallpapers = wallpaperResults.filter(Boolean) as WallpaperWithFile[];
        
        setWallpapers(validWallpapers);
      } catch (error) {
        console.error('Error fetching wallpapers:', error);
        toast({
          variant: "destructive",
          title: "Error fetching wallpapers",
          description: "Failed to load unpublished wallpapers. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWallpapers();
  }, [toast]);
  
  // Handle selection and counting
  const toggleSelection = (id: string) => {
    setWallpapers(prevWallpapers => 
      prevWallpapers.map(wallpaper => {
        if (wallpaper.id === id) {
          const newIsSelected = !wallpaper.isSelected;
          return { ...wallpaper, isSelected: newIsSelected };
        }
        return wallpaper;
      })
    );
    
    // Update selected count
    const updatedWallpapers = wallpapers.map(w => 
      w.id === id ? { ...w, isSelected: !w.isSelected } : w
    );
    setSelectedCount(updatedWallpapers.filter(w => w.isSelected).length);
  };
  
  // Select/deselect all unpublished wallpapers
  const toggleSelectAll = (select: boolean) => {
    setWallpapers(prevWallpapers => 
      prevWallpapers.map(wallpaper => {
        // Only modify unpublished wallpapers
        if (!wallpaper.isPublished) {
          return { ...wallpaper, isSelected: select };
        }
        return wallpaper;
      })
    );
    
    if (select) {
      setSelectedCount(wallpapers.filter(w => !w.isPublished).length);
    } else {
      setSelectedCount(0);
    }
  };
  
  // Publish selected wallpapers
  const publishSelected = async () => {
    const selectedWallpapers = wallpapers.filter(w => w.isSelected && !w.isPublished);
    
    if (selectedWallpapers.length === 0) {
      toast({
        title: "No wallpapers selected",
        description: "Please select at least one unpublished wallpaper to publish.",
      });
      return;
    }
    
    setIsPublishing(true);
    setPublishProgress(0);
    
    try {
      const totalToPublish = selectedWallpapers.length;
      let publishedCount = 0;
      
      // Firestore has a limit of 500 operations per batch
      const BATCH_SIZE = 100; // Using a smaller batch size for stability
      
      // Process in chunks
      for (let i = 0; i < totalToPublish; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const chunk = selectedWallpapers.slice(i, i + BATCH_SIZE);
        
        // Add each document to the batch
        for (const wallpaper of chunk) {
          // Extract file name for title
          const fileName = wallpaper.id.split('-').pop()?.split('.')[0] || wallpaper.id;
          const title = `Wallpaper ${fileName}`;
          
          // Create a document reference with a new ID
          const docRef = doc(collection(db, 'wallpapers'));
          
          // Create wallpaper metadata
          const wallpaperData = {
            id: docRef.id,
            title,
            description: `Beautiful wallpaper ${fileName}`,
            category: 'other',
            tags: ['wallpaper', 'download'],
            price: 0,
            imageUrl: wallpaper.downloadURL,
            dimensions: '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          
          // Add to batch
          batch.set(docRef, wallpaperData);
        }
        
        // Commit the batch
        await batch.commit();
        
        // Mark as published in state
        const publishedIds = chunk.map(w => w.id);
        setWallpapers(prev => prev.map(w => 
          publishedIds.includes(w.id) ? { ...w, isPublished: true, isSelected: false } : w
        ));
        
        // Update progress
        publishedCount += chunk.length;
        setPublishProgress(Math.round((publishedCount / totalToPublish) * 100));
        
        // Small delay to avoid UI freezing
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // Update selected count
      setSelectedCount(0);
      
      // Show success message
      toast({
        title: "Success",
        description: `Published ${publishedCount} wallpapers to the database.`,
      });
    } catch (error) {
      console.error('Error publishing wallpapers:', error);
      toast({
        variant: "destructive",
        title: "Publication failed",
        description: "An error occurred while publishing wallpapers. Some may not have been published.",
      });
    } finally {
      setIsPublishing(false);
    }
  };
  
  // Refresh wallpaper list
  const refreshWallpapers = () => {
    setSelectedCount(0);
    setWallpapers([]);
    setIsLoading(true);
    
    // Add a small delay before starting the refresh to ensure loading state is visible
    setTimeout(() => {
      const fetchWallpapers = async () => {
        try {
          // Get all storage files in wallpapers folder
          const storageRef = ref(storage, 'wallpapers');
          const result = await listAll(storageRef);
          
          // Get all published wallpapers from Firestore
          const publishedWallpapersSnapshot = await getDocs(collection(db, 'wallpapers'));
          const publishedURLs = new Set(publishedWallpapersSnapshot.docs.map(doc => doc.data().imageUrl));
          
          // Process each storage file
          const wallpaperPromises = result.items.map(async (item) => {
            try {
              const downloadURL = await getDownloadURL(item);
              return {
                id: item.name,
                path: item.fullPath,
                downloadURL,
                isPublished: publishedURLs.has(downloadURL),
                isSelected: false
              };
            } catch (error) {
              console.error(`Error getting download URL for ${item.name}:`, error);
              return null;
            }
          });
          
          const wallpaperResults = await Promise.all(wallpaperPromises);
          const validWallpapers = wallpaperResults.filter(Boolean) as WallpaperWithFile[];
          
          setWallpapers(validWallpapers);
          
          toast({
            title: "Refresh complete",
            description: `Found ${validWallpapers.length} wallpapers (${validWallpapers.filter(w => !w.isPublished).length} unpublished).`,
          });
        } catch (error) {
          console.error('Error refreshing wallpapers:', error);
          toast({
            variant: "destructive",
            title: "Refresh failed",
            description: "Failed to refresh wallpaper list. Please try again.",
          });
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchWallpapers();
    }, 500);
  };
  
  // Filter wallpapers based on active tab
  const filteredWallpapers = wallpapers.filter(wallpaper => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unpublished') return !wallpaper.isPublished;
    if (activeTab === 'published') return wallpaper.isPublished;
    return true;
  });
  
  // Calculate counts
  const unpublishedCount = wallpapers.filter(w => !w.isPublished).length;
  const publishedCount = wallpapers.filter(w => w.isPublished).length;
  
  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Publish Wallpapers</h1>
          <p className="text-muted-foreground mt-2">Manage and publish wallpapers to the database</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={refreshWallpapers}
            disabled={isLoading || isPublishing}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
          
          <Button 
            onClick={publishSelected}
            disabled={isPublishing || selectedCount === 0 || isLoading}
            className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
          >
            {isPublishing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Publish Selected ({selectedCount})
          </Button>
        </div>
      </div>
      
      {isPublishing && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Publishing wallpapers to database...
              </span>
              <span className="font-medium">{publishProgress}%</span>
            </div>
            <Progress value={publishProgress} className="h-2" />
          </CardContent>
        </Card>
      )}
      
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={`${unpublishedCount > 0 ? 'border-yellow-200 bg-yellow-50' : ''}`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              {unpublishedCount > 0 ? (
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              ) : (
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              )}
              <div>
                <h3 className="text-2xl font-bold">{unpublishedCount}</h3>
                <p className="text-muted-foreground text-sm">Unpublished Wallpapers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="text-2xl font-bold">{publishedCount}</h3>
                <p className="text-muted-foreground text-sm">Published Wallpapers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                {wallpapers.length}
              </div>
              <div>
                <h3 className="text-2xl font-bold">{wallpapers.length}</h3>
                <p className="text-muted-foreground text-sm">Total Wallpapers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Wallpapers</CardTitle>
            {unpublishedCount > 0 && (
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => toggleSelectAll(true)}
                  disabled={isLoading || isPublishing}
                >
                  Select All Unpublished
                </Button>
                
                {selectedCount > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => toggleSelectAll(false)}
                    disabled={isLoading || isPublishing}
                  >
                    Clear Selection
                  </Button>
                )}
              </div>
            )}
          </div>
          <CardDescription>
            Manage and publish wallpapers to make them visible on the site
          </CardDescription>
        </CardHeader>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <div className="px-6">
            <TabsList className="mb-6 grid w-full grid-cols-3">
              <TabsTrigger value="all">All ({wallpapers.length})</TabsTrigger>
              <TabsTrigger value="unpublished" className={unpublishedCount > 0 ? "text-yellow-800" : ""}>
                Unpublished ({unpublishedCount})
              </TabsTrigger>
              <TabsTrigger value="published">Published ({publishedCount})</TabsTrigger>
            </TabsList>
          </div>
          
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p className="text-muted-foreground">Loading wallpapers...</p>
              </div>
            ) : filteredWallpapers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="bg-muted h-12 w-12 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium mb-1">No wallpapers found</h3>
                <p className="text-muted-foreground max-w-md mb-4">
                  {activeTab === 'unpublished' 
                    ? "All wallpapers have been published to the database." 
                    : activeTab === 'published'
                    ? "No published wallpapers found. Publish some wallpapers to see them here."
                    : "No wallpapers found in storage. Upload some wallpapers first."}
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/admin/wallpapers/bulk-upload'}
                >
                  Go to Bulk Upload
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredWallpapers.map((wallpaper) => (
                  <div 
                    key={wallpaper.id}
                    className={`border rounded-lg overflow-hidden ${
                      wallpaper.isSelected ? 'ring-2 ring-primary border-primary' : 
                      wallpaper.isPublished ? 'border-green-200' : 'border-yellow-200'
                    }`}
                    onClick={() => !isPublishing && !isLoading && !wallpaper.isPublished && toggleSelection(wallpaper.id)}
                  >
                    <div className="aspect-video relative bg-muted">
                      <img 
                        src={wallpaper.downloadURL} 
                        alt="Wallpaper"
                        className="h-full w-full object-cover"
                      />
                      {(wallpaper.isPublished || wallpaper.isSelected) && (
                        <div className={`absolute top-2 right-2 h-6 w-6 rounded-full flex items-center justify-center ${
                          wallpaper.isPublished ? 'bg-green-500' : 'bg-primary'
                        }`}>
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs truncate text-muted-foreground">
                        {wallpaper.id.split('-').pop() || wallpaper.id}
                      </p>
                      <div className="flex items-center mt-1">
                        {wallpaper.isPublished ? (
                          <span className="text-xs bg-green-100 text-green-800 rounded-full px-2 py-0.5 flex items-center">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Published
                          </span>
                        ) : wallpaper.isSelected ? (
                          <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5 flex items-center">
                            Selected
                          </span>
                        ) : (
                          <span className="text-xs bg-yellow-100 text-yellow-800 rounded-full px-2 py-0.5 flex items-center">
                            Unpublished
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Tabs>
        
        {selectedCount > 0 && !isLoading && (
          <CardFooter className="flex justify-between border-t pt-6">
            <p className="text-sm text-muted-foreground">
              {selectedCount} wallpaper{selectedCount !== 1 ? 's' : ''} selected
            </p>
            <Button 
              onClick={publishSelected}
              disabled={isPublishing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Publishing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Publish Selected
                </>
              )}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
} 