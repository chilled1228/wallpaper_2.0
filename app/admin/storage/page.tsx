'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CloudCog, CloudOff, CloudUpload, Database, FileText, HardDrive, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function StorageManagementPage() {
  const [activeTab, setActiveTab] = useState('overview');
  
  const r2Configured = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_DOMAIN !== undefined;
  
  return (
    <div className="container py-6 max-w-6xl">
      <div className="flex flex-col space-y-2 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Storage Management</h1>
        <p className="text-muted-foreground">Manage your app's storage providers and configurations</p>
      </div>
      
      <Tabs
        defaultValue={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="firebase">Firebase Storage</TabsTrigger>
          <TabsTrigger value="r2">Cloudflare R2</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    <HardDrive className="h-5 w-5 mr-2" />
                    Firebase Storage
                  </CardTitle>
                  <span className="text-xs bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full">Active</span>
                </div>
                <CardDescription>Used for all general storage needs</CardDescription>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div>
                  <span className="font-medium">Status:</span> Active
                </div>
                <div>
                  <span className="font-medium">Usage:</span> Blog images, User content
                </div>
              </CardContent>
              <CardFooter>
                <Link href="/admin/storage/firebase" passHref>
                  <Button size="sm" variant="outline">Manage</Button>
                </Link>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    <CloudCog className="h-5 w-5 mr-2" />
                    Cloudflare R2
                  </CardTitle>
                  <span className={`text-xs ${r2Configured ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'} px-2.5 py-0.5 rounded-full`}>
                    {r2Configured ? 'Active' : 'Setup Needed'}
                  </span>
                </div>
                <CardDescription>Optimized for wallpaper and prompt images</CardDescription>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div>
                  <span className="font-medium">Status:</span> {r2Configured ? 'Configured' : 'Not Configured'}
                </div>
                <div>
                  <span className="font-medium">Usage:</span> Wallpapers, Prompts
                </div>
                {!r2Configured && (
                  <Alert variant="warning" className="mt-3">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Setup Required</AlertTitle>
                    <AlertDescription>
                      R2 configuration is missing. Complete the setup to enable this feature.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter>
                <Link href="/admin/storage/r2" passHref>
                  <Button size="sm" variant="outline">{r2Configured ? 'Manage' : 'Setup'}</Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Storage Allocation</CardTitle>
              <CardDescription>How storage is allocated between providers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-md p-4">
                    <div className="flex items-center mb-2">
                      <CloudUpload className="h-5 w-5 text-primary mr-2" />
                      <h3 className="font-medium">Wallpaper Images</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Storage: {r2Configured ? 'Cloudflare R2' : 'Firebase Storage (R2 pending)'}
                    </p>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <div className="flex items-center mb-2">
                      <Database className="h-5 w-5 text-primary mr-2" />
                      <h3 className="font-medium">Blog Images</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Storage: Firebase Storage
                    </p>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground mt-4">
                  <div className="flex items-start">
                    <Info className="h-4 w-4 mt-0.5 mr-2" />
                    <p>
                      Cloudflare R2 is used for wallpaper and prompt images to optimize delivery performance and reduce costs.
                      Firebase Storage continues to be used for all other storage needs.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="text-xs text-muted-foreground">
                Configure storage allocation in <code className="bg-muted px-1 py-0.5 rounded">storage-utils.ts</code>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="firebase">
          <Card>
            <CardHeader>
              <CardTitle>Firebase Storage</CardTitle>
              <CardDescription>Manage your Firebase Storage configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Configuration</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-muted/50 p-3 rounded-md">
                    <span className="font-medium block mb-1">Storage Bucket</span>
                    <code className="text-xs break-all">{process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'Not configured'}</code>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-md">
                    <span className="font-medium block mb-1">Project ID</span>
                    <code className="text-xs break-all">{process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Not configured'}</code>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Tools</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button variant="outline" className="justify-start" asChild>
                    <Link href="https://console.firebase.google.com/project/_/storage" target="_blank">
                      Open Firebase Console
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start" asChild>
                    <Link href="/admin/storage/r2">
                      Migrate to R2
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="r2">
          <Card>
            <CardHeader>
              <CardTitle>Cloudflare R2 Storage</CardTitle>
              <CardDescription>Manage your Cloudflare R2 configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Configuration Status</h3>
                {r2Configured ? (
                  <Alert variant="success" className="bg-green-50 border-green-200">
                    <div className="flex items-center">
                      <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                      <p className="font-medium text-green-900">R2 is properly configured and active</p>
                    </div>
                    <p className="text-sm text-green-800 mt-1">
                      Wallpaper and prompt images are being stored in Cloudflare R2
                    </p>
                  </Alert>
                ) : (
                  <Alert variant="destructive" className="bg-red-50 border-red-200">
                    <CloudOff className="h-4 w-4 text-red-600" />
                    <AlertTitle className="text-red-900">R2 is not configured</AlertTitle>
                    <AlertDescription className="text-red-800">
                      Your application is missing the required environment variables for Cloudflare R2 integration.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Environment Variables</h3>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="bg-muted/50 p-3 rounded-md">
                    <span className="font-medium block mb-1">R2 Access</span>
                    <p className="text-xs">
                      <span className="inline-block w-64">CLOUDFLARE_R2_ACCESS_KEY_ID:</span>
                      <span className={r2Configured ? 'text-green-600' : 'text-red-600'}>
                        {process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ? 'Set ✓' : 'Not Set ✗'}
                      </span>
                    </p>
                    <p className="text-xs">
                      <span className="inline-block w-64">CLOUDFLARE_R2_SECRET_ACCESS_KEY:</span>
                      <span className={r2Configured ? 'text-green-600' : 'text-red-600'}>
                        {process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ? 'Set ✓' : 'Not Set ✗'}
                      </span>
                    </p>
                    <p className="text-xs">
                      <span className="inline-block w-64">CLOUDFLARE_R2_ENDPOINT:</span>
                      <span className={r2Configured ? 'text-green-600' : 'text-red-600'}>
                        {process.env.CLOUDFLARE_R2_ENDPOINT ? 'Set ✓' : 'Not Set ✗'}
                      </span>
                    </p>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-md">
                    <span className="font-medium block mb-1">Public Access</span>
                    <p className="text-xs">
                      <span className="inline-block w-64">CLOUDFLARE_R2_PUBLIC_DOMAIN:</span>
                      <span className={process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN ? 'text-green-600' : 'text-amber-600'}>
                        {process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN ? 'Set ✓' : 'Not Set (optional) ⚠️'}
                      </span>
                    </p>
                    <p className="text-xs">
                      <span className="inline-block w-64">NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_DOMAIN:</span>
                      <span className={process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_DOMAIN ? 'text-green-600' : 'text-amber-600'}>
                        {process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_DOMAIN ? 'Set ✓' : 'Not Set (optional) ⚠️'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Tools & Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button variant="outline" className="justify-start" asChild>
                    <Link href="/admin/storage/r2">
                      Manage R2 Storage
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start" asChild>
                    <Link href="https://dash.cloudflare.com/?to=/:account/r2" target="_blank">
                      Open Cloudflare Dashboard
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start" asChild>
                    <Link href="/docs/cloudflare-r2-setup.md" target="_blank">
                      Setup Instructions
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start" disabled={!r2Configured}>
                    Test R2 Connection
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-xs text-muted-foreground">
                Using Cloudflare R2 for optimized image delivery.
              </div>
              <Button size="sm" asChild>
                <Link href="/admin/storage/r2">
                  Go to R2 Admin
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 