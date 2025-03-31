'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, Image } from 'lucide-react';
import { uploadToR2, generateR2Path } from '@/lib/cloudflare-r2';
import { toast } from '@/components/ui/use-toast';

export interface R2ImageUploadProps {
  onChange: (url: string) => void;
  onRemove: () => void;
  value?: string;
  folder?: string;
}

export function R2ImageUpload({ 
  onChange, 
  onRemove, 
  value,
  folder = 'wallpaper-images'
}: R2ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (value !== undefined) {
      setPreview(value);
    }
  }, [value]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setError(null);
      
      // Validate file size
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('File size exceeds 10MB limit');
      }
      
      console.log('Uploading file to R2:', file.name);
      
      // Create a unique file name to avoid collisions
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9-.]/g, '_')}`;
      const path = generateR2Path(folder, fileName);
      console.log('Generated R2 storage path:', path);
      
      try {
        const imageUrl = await uploadToR2(file, path, file.type);
        console.log('Image uploaded successfully to R2:', imageUrl);
        
        onChange(imageUrl);
        setPreview(imageUrl);
        toast({
          title: "Success",
          description: "Image uploaded successfully to Cloudflare R2",
        });
      } catch (uploadError) {
        console.error('Error in R2 direct upload:', uploadError);
        throw new Error(uploadError instanceof Error ? uploadError.message : 'R2 upload failed');
      }
    } catch (error) {
      console.error('Error uploading image to R2:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
      setError(errorMessage);
      toast({
        title: "Upload Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      
      // Reset the input field to allow re-uploading the same file
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => document.getElementById('r2-image-upload')?.click()}
          disabled={isUploading}
          className="relative overflow-hidden"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Image
            </>
          )}
        </Button>
        {preview && (
          <Button 
            type="button"
            variant="destructive" 
            size="sm"
            onClick={() => {
              setPreview(null);
              onRemove();
            }}
          >
            Remove
          </Button>
        )}
      </div>
      
      <Input
        id="r2-image-upload"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      
      {error && (
        <div className="text-red-500 text-sm mt-2">
          Error: {error}
        </div>
      )}
      
      {preview && (
        <div className="mt-4 relative aspect-video rounded-md overflow-hidden border border-border">
          <img
            src={preview}
            alt="Preview"
            className="object-cover w-full h-full"
          />
        </div>
      )}
    </div>
  );
} 