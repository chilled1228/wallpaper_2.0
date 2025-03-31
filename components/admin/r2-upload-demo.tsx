'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useR2Upload } from '@/hooks/useR2Upload';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { R2Image } from '@/components/ui/r2-image';

export function R2UploadDemo() {
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const { upload, isUploading, error, progress } = useR2Upload({
    folder: 'wallpaper-images',
    onSuccess: (url) => {
      console.log('Upload success:', url);
      setUploadedUrl(url);
    },
    onError: (err) => {
      console.error('Upload failed:', err);
    }
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await upload(file);
      
      // Reset the input field to allow re-uploading the same file
      if (e.target) {
        e.target.value = '';
      }
    } catch (err) {
      console.error('Error in handleFileChange:', err);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Cloudflare R2 Upload Demo</CardTitle>
        <CardDescription>Test uploading images to R2 storage</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => document.getElementById('r2-demo-upload')?.click()}
            disabled={isUploading}
            className="relative w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Select Image to Upload
              </>
            )}
          </Button>
          <Input
            id="r2-demo-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {isUploading && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-center text-muted-foreground">
              Uploading... {Math.round(progress)}%
            </p>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 p-3 rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error.message}</p>
          </div>
        )}

        {uploadedUrl && !isUploading && (
          <div className="space-y-3">
            <div className="bg-primary/10 p-3 rounded-md flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm">Image uploaded successfully!</p>
            </div>
            
            <div className="aspect-video relative rounded-md overflow-hidden border">
              <R2Image 
                src={uploadedUrl} 
                alt="Uploaded image" 
                fill 
                sizes="(max-width: 768px) 100vw, 500px" 
                showDownload
              />
            </div>
            
            <div className="text-xs font-mono break-all bg-muted p-2 rounded">
              <p className="font-semibold mb-1">Image URL:</p>
              {uploadedUrl}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Images are optimized and cached by Cloudflare for fast delivery
      </CardFooter>
    </Card>
  );
} 