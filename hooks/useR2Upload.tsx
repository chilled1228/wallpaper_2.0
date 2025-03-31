import { useState, useCallback } from 'react';
import { uploadToR2, generateR2Path } from '@/lib/cloudflare-r2';

interface UseR2UploadOptions {
  folder?: string;
  maxSize?: number; // in MB
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
}

interface UseR2UploadReturn {
  upload: (file: File) => Promise<string>;
  isUploading: boolean;
  error: Error | null;
  progress: number;
}

/**
 * Hook for handling Cloudflare R2 image uploads with progress tracking and optimization
 */
export function useR2Upload({
  folder = 'wallpaper-images',
  maxSize = 10, // 10MB default
  onSuccess,
  onError
}: UseR2UploadOptions = {}): UseR2UploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);

  const upload = useCallback(async (file: File): Promise<string> => {
    try {
      setIsUploading(true);
      setError(null);
      setProgress(0);
      
      // Validate file size
      const maxSizeBytes = maxSize * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        throw new Error(`File size exceeds ${maxSize}MB limit`);
      }
      
      // Validate file type
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!validImageTypes.includes(file.type)) {
        throw new Error(`Unsupported file type: ${file.type}. Supported types: JPG, PNG, GIF, WebP, SVG`);
      }
      
      // Create a unique file name to avoid collisions
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9-.]/g, '_')}`;
      const path = generateR2Path(folder, fileName);
      
      console.log('R2 Upload Hook: Preparing to upload file', {
        fileName,
        fileType: file.type,
        fileSize: `${(file.size / 1024).toFixed(2)}KB`,
        path
      });
      
      // Simulate progress until we get a better way to track it
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + (5 * Math.random());
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 300);
      
      // Upload the file to R2
      try {
        console.log('R2 Upload Hook: Starting upload to path:', path);
        const imageUrl = await uploadToR2(file, path, file.type);
        console.log('R2 Upload Hook: Upload successful, got URL:', imageUrl);
        
        // Upload complete
        clearInterval(progressInterval);
        setProgress(100);
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess(imageUrl);
        }
        
        return imageUrl;
      } catch (uploadError) {
        clearInterval(progressInterval);
        console.error('R2 Upload Hook: Direct upload failed:', uploadError);
        throw uploadError;
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown upload error');
      console.error('R2 Upload Hook: Error in upload process:', error.message);
      setError(error);
      
      // Call error callback if provided
      if (onError) {
        onError(error);
      }
      
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [folder, maxSize, onSuccess, onError]);

  return { upload, isUploading, error, progress };
} 