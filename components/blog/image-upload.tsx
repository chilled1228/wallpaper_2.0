import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, Image } from 'lucide-react';
import { uploadImage, generateStoragePath } from '@/lib/storage-utils';
import { toast } from '@/components/ui/use-toast';

export interface ImageUploadProps {
  onChange: (url: string) => void;
  onRemove: () => void;
  value?: string;
}

export function ImageUpload({ onChange, onRemove, value }: ImageUploadProps) {
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
      
      console.log('Uploading file:', file.name);
      
      // Create a unique file name to avoid collisions
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9-.]/g, '_')}`;
      const path = generateStoragePath('wallpaper-images', fileName);
      console.log('Generated storage path:', path);
      
      const imageUrl = await uploadImage(file, path);
      console.log('Image uploaded successfully:', imageUrl);
      
      onChange(imageUrl);
      setPreview(imageUrl);
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
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
      <div className="flex items-center gap-2">
        <Input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading}
          className="max-w-[300px]"
        />
        {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>
      
      {error && (
        <div className="text-sm text-red-500">
          {error}
        </div>
      )}
      
      {preview && (
        <div className="relative mt-2 border rounded-md overflow-hidden">
          <img 
            src={preview} 
            alt="Preview" 
            className="max-h-[200px] object-contain mx-auto" 
          />
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={onRemove}
            className="absolute top-2 right-2"
          >
            Remove
          </Button>
        </div>
      )}
    </div>
  );
} 