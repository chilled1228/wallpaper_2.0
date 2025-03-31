'use client';

import { useState, useEffect } from 'react';
import { R2UploadDemo } from '@/components/admin/r2-upload-demo';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { R2Image } from '@/components/ui/r2-image';
import { Loader2, RefreshCcw, Search, Trash2, AlertCircle, ExternalLink } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { isR2Url } from '@/lib/r2-client-utils';
import Link from 'next/link';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface R2Object {
  key: string;
  url: string | null;
  size: number;
  lastModified: string;
}

interface R2ListResponse {
  items: R2Object[];
  nextContinuationToken?: string;
  isTruncated: boolean;
}

export default function R2AdminPage() {
  const [activeTab, setActiveTab] = useState('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [objects, setObjects] = useState<R2Object[]>([]);
  const [continuationToken, setContinationToken] = useState<string | undefined>();
  const [prefix, setPrefix] = useState('wallpaper-images/');
  const [selectedImage, setSelectedImage] = useState<R2Object | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  const fetchObjects = async (token?: string, newPrefix?: string) => {
    try {
      setIsLoading(true);
      setConfigError(null);
      
      const searchPrefix = newPrefix !== undefined ? newPrefix : prefix;
      const apiUrl = `/api/storage/r2?action=listObjects&prefix=${encodeURIComponent(searchPrefix)}${token ? `&continuationToken=${token}` : ''}`;
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 500 && errorData.error?.includes('not properly configured')) {
          setConfigError('R2 storage is not properly configured');
        } else {
          throw new Error(`Failed to fetch objects: ${errorData.error || response.statusText}`);
        }
        return;
      }
      
      const data: R2ListResponse = await response.json();
      
      if (token) {
        // Append to existing list
        setObjects(prev => [...prev, ...data.items]);
      } else {
        // New search
        setObjects(data.items);
      }
      
      setContinationToken(data.nextContinuationToken);
    } catch (error) {
      console.error('Error fetching R2 objects:', error);
      
      if (error instanceof Error && error.message.includes('Load failed')) {
        setConfigError('R2 connection failed. Please check your configuration.');
      } else {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to fetch files',
          variant: 'destructive'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'browser') {
      fetchObjects();
    }
  }, [activeTab]);

  const handlePrefixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrefix(e.target.value);
  };

  const handlePrefixSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchObjects(undefined, prefix);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleSelectImage = (obj: R2Object) => {
    setSelectedImage(obj);
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Cloudflare R2 Storage</h1>
        <p className="text-muted-foreground mt-1">
          Manage and view your Cloudflare R2 storage for wallpapers and prompts
        </p>
      </div>

      {configError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuration Error</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>{configError}</p>
            <Link
              href="/admin/storage/r2/setup"
              className="flex items-center text-sm font-medium underline"
            >
              Go to R2 setup page <ExternalLink className="ml-1 h-3 w-3" />
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="browser">Browser</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-4">
          <R2UploadDemo />
          
          <Card>
            <CardHeader>
              <CardTitle>Troubleshooting</CardTitle>
              <CardDescription>
                Having issues with R2 uploads? Check the setup or run diagnostic tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" asChild>
                  <Link href="/admin/storage/r2/setup">
                    R2 Configuration Setup
                  </Link>
                </Button>
                <Button variant="outline" onClick={() => {
                  toast({
                    title: "R2 Environment Check",
                    description: "Please check server logs for R2 environment variables status.",
                  });
                  console.log('R2 Environment Variables:');
                  console.log('ENDPOINT:', process.env.CLOUDFLARE_R2_ENDPOINT ? '✓ Set' : '✗ Not set');
                  console.log('ACCESS_KEY_ID:', process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ? '✓ Set' : '✗ Not set');
                  console.log('SECRET_ACCESS_KEY:', process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ? '✓ Set' : '✗ Not set');
                  console.log('BUCKET_NAME:', process.env.CLOUDFLARE_R2_BUCKET_NAME || 'wallpaper-images');
                }}>
                  Check Environment Variables
                </Button>
              </div>
              <div className="bg-muted p-3 rounded-md text-sm">
                <p>If you're experiencing upload issues:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Make sure all required R2 environment variables are set in <code>.env.local</code></li>
                  <li>Check browser console for detailed error messages</li>
                  <li>Verify that your R2 bucket exists and permissions are correct</li>
                  <li>Run the <code>node scripts/check-r2-config.js</code> script to validate your config</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="browser" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Browse Files</CardTitle>
                  <CardDescription>Browse files in your R2 bucket</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handlePrefixSearch} className="flex items-center space-x-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Folder prefix"
                        value={prefix}
                        onChange={handlePrefixChange}
                      />
                    </div>
                    <Button type="submit" size="icon" variant="ghost">
                      <Search className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => fetchObjects()}
                      disabled={isLoading}
                    >
                      <RefreshCcw className="h-4 w-4" />
                    </Button>
                  </form>
                  
                  <div className="overflow-y-auto max-h-[500px] border rounded-md">
                    {isLoading && objects.length === 0 ? (
                      <div className="flex justify-center items-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : objects.length > 0 ? (
                      <div className="divide-y">
                        {objects.map((obj) => (
                          <div
                            key={obj.key}
                            className={`p-2.5 text-xs hover:bg-muted/50 cursor-pointer ${selectedImage?.key === obj.key ? 'bg-muted' : ''}`}
                            onClick={() => handleSelectImage(obj)}
                          >
                            <div className="font-medium truncate">{obj.key.split('/').pop()}</div>
                            <div className="text-muted-foreground mt-1 flex justify-between">
                              <span>{formatBytes(obj.size)}</span>
                              <span>{formatDate(obj.lastModified)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-muted-foreground">
                        No files found in this location
                      </div>
                    )}
                  </div>
                  
                  {continuationToken && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => fetchObjects(continuationToken)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        'Load More'
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-2">
              {selectedImage ? (
                <Card className="h-full">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle className="text-base">{selectedImage.key.split('/').pop()}</CardTitle>
                      <CardDescription className="mt-1">
                        {formatBytes(selectedImage.size)} • {formatDate(selectedImage.lastModified)}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {selectedImage.url && isR2Url(selectedImage.url) ? (
                      <div className="aspect-video relative rounded-md overflow-hidden border">
                        <R2Image
                          src={selectedImage.url}
                          alt={selectedImage.key}
                          fill
                          showDownload
                          downloadFileName={selectedImage.key.split('/').pop()}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
                        />
                      </div>
                    ) : (
                      <div className="flex justify-center items-center h-40 bg-muted/50 rounded-md">
                        <p className="text-muted-foreground">Preview not available</p>
                      </div>
                    )}
                    
                    <div className="mt-4 text-xs font-mono break-all bg-muted p-2 rounded">
                      <p className="font-semibold mb-1">Object Key:</p>
                      {selectedImage.key}
                      
                      {selectedImage.url && (
                        <>
                          <p className="font-semibold mt-3 mb-1">URL:</p>
                          {selectedImage.url}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex items-center justify-center h-full bg-muted/20 rounded-lg border border-dashed p-12">
                  <div className="text-center">
                    <p className="text-muted-foreground">Select a file to preview</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 