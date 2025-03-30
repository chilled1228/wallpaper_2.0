import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Loader2, ImagePlus, AlertCircle } from 'lucide-react';
import { uploadImage, generateStoragePath } from '@/lib/storage-utils';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';

export interface MultiImageUploadProps {
  onImagesSelected: (urls: string[]) => void;
  disabled?: boolean;
}

export function MultiImageUpload({ onImagesSelected, disabled }: MultiImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled || !acceptedFiles.length) return;
    
    // Validate file sizes
    const oversizedFiles = acceptedFiles.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      const fileNames = oversizedFiles.map(f => f.name).join(', ');
      setError(`Files exceeding 10MB limit: ${fileNames}`);
      toast({
        title: "File Size Error",
        description: "Some files exceed the 10MB size limit and will be skipped",
        variant: "destructive"
      });
      
      // Filter out oversized files
      acceptedFiles = acceptedFiles.filter(file => file.size <= 10 * 1024 * 1024);
      if (acceptedFiles.length === 0) return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setTotalFiles(acceptedFiles.length);
      setUploadedFiles(0);
      setUploadProgress(0);
      
      console.log(`Starting upload of ${acceptedFiles.length} files`);
      
      const uploadedUrls: string[] = [];
      const failedFiles: string[] = [];
      
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        try {
          console.log(`Uploading file ${i+1}/${acceptedFiles.length}: ${file.name}`);
          
          // Create a unique filename to avoid collisions
          const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9-.]/g, '_')}`;
          const path = generateStoragePath('wallpaper-images', fileName);
          
          const imageUrl = await uploadImage(file, path);
          uploadedUrls.push(imageUrl);
          setUploadedFiles(prev => prev + 1);
          setUploadProgress(Math.round(((i + 1) / acceptedFiles.length) * 100));
        } catch (error) {
          console.error(`Error uploading file ${file.name}:`, error);
          failedFiles.push(file.name);
        }
      }

      if (uploadedUrls.length > 0) {
        onImagesSelected(uploadedUrls);
        toast({
          title: "Images Uploaded",
          description: `Successfully uploaded ${uploadedUrls.length} of ${acceptedFiles.length} images`,
        });
      }
      
      if (failedFiles.length > 0) {
        const failedFilesList = failedFiles.length > 3 
          ? `${failedFiles.slice(0, 3).join(', ')}... and ${failedFiles.length - 3} more` 
          : failedFiles.join(', ');
        
        setError(`Failed to upload: ${failedFilesList}`);
        
        toast({
          title: "Some uploads failed",
          description: `${failedFiles.length} images failed to upload`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload images');
      toast({
        title: "Upload Error",
        description: "Failed to upload images. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => {
        setUploadProgress(0);
        setTotalFiles(0);
        setUploadedFiles(0);
      }, 3000);
    }
  }, [disabled, onImagesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    disabled: isUploading || disabled,
    multiple: true,
    maxSize: 10 * 1024 * 1024, // 10MB size limit enforced by dropzone
  });

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-2 border rounded-md bg-red-50 text-red-700 text-sm">
          <AlertCircle className="h-4 w-4" />
          <p>{error}</p>
        </div>
      )}
    
      <div
        {...getRootProps()}
        className={cn(
          'h-32 w-full flex flex-col items-center justify-center p-4 cursor-pointer border-2 border-dashed rounded-md',
          'transition-colors duration-200',
          isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:bg-muted/50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-xs text-center text-muted-foreground">
              Uploading {uploadedFiles} of {totalFiles} images...
            </p>
          </div>
        ) : (
          <>
            <ImagePlus className="h-6 w-6 text-muted-foreground mb-2" />
            <p className="text-sm text-center text-muted-foreground">
              Drop images here or click to upload
            </p>
            <p className="text-xs text-center text-muted-foreground mt-1">
              Supports JPG, PNG and WebP (max 10MB per file)
            </p>
          </>
        )}
      </div>
      
      {isUploading && (
        <div className="space-y-1">
          <Progress value={uploadProgress} className="h-2 w-full" />
          <p className="text-xs text-right text-muted-foreground">{uploadProgress}%</p>
        </div>
      )}
    </div>
  );
} 