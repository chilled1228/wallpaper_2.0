'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Download, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface R2ImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  showDownload?: boolean;
  downloadFileName?: string;
  quality?: number;
  fill?: boolean;
  sizes?: string;
  fallbackSrc?: string;
}

// Default blur data URL for all R2 images
const defaultBlurDataURL = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzIwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmNWY5Ii8+PC9zdmc+";

// Default fallback image if src fails to load
const defaultFallbackSrc = "/default-wallpaper.jpg";

// Helper function to sanitize R2 URLs if needed
function sanitizeR2Url(url: string): string {
  if (!url) return url;
  
  try {
    // Log R2 domain config for debugging (first call only)
    if (typeof window !== 'undefined' && !window.hasLoggedR2UrlSanitizer) {
      console.log('R2 public domain for sanitizer:', process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_DOMAIN);
      window.hasLoggedR2UrlSanitizer = true;
    }
    
    // Skip processing for local paths
    if (url.startsWith('/')) {
      return url;
    }
    
    // Handle the case where URL might be missing protocol for R2
    if (url.startsWith('pub-') && url.includes('.r2.dev')) {
      console.log('Adding protocol to R2 URL:', url);
      return `https://${url}`;
    }
    
    // Ensure R2 URLs use HTTPS
    if (url.includes('.r2.dev') && url.startsWith('http://')) {
      return url.replace('http://', 'https://');
    }
    
    return url;
  } catch (e) {
    console.error('Error sanitizing R2 URL:', e);
    return url;
  }
}

// For TypeScript
declare global {
  interface Window {
    hasLoggedR2UrlSanitizer?: boolean;
  }
}

export function R2Image({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  showDownload = false,
  downloadFileName,
  quality = 80,
  fill = false,
  sizes,
  fallbackSrc,
}: R2ImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageSrc, setImageSrc] = useState<string>(sanitizeR2Url(src));

  // Verify and update image source when prop changes
  useEffect(() => {
    // Sanitize the URL first
    const sanitizedSrc = sanitizeR2Url(src);
    setImageSrc(sanitizedSrc);
    
    console.log('R2Image loading:', {
      original: src,
      sanitized: sanitizedSrc,
      isR2: sanitizedSrc.includes('.r2.dev') || sanitizedSrc.includes('cloudflarestorage'),
    });
    
    setError(null);
    setIsLoading(true);
  }, [src]);

  // Handle image loading
  const handleLoad = () => {
    setIsLoading(false);
    console.log('R2Image loaded successfully:', imageSrc);
  };

  // Handle image error
  const handleError = () => {
    setIsLoading(false);
    console.error(`R2Image failed to load: ${imageSrc}`);
    
    // Try to use the provided fallback or default fallback
    if (fallbackSrc) {
      console.log('Using provided fallback:', fallbackSrc);
      setImageSrc(fallbackSrc);
    } else {
      console.log('Using default fallback');
      setImageSrc(defaultFallbackSrc);
    }
    
    setError('Failed to load image');
  };

  // Handle download
  const handleDownload = async () => {
    try {
      // Don't attempt to download if there was an error loading the image
      if (error && imageSrc !== src) {
        console.warn('Cannot download image that failed to load');
        return;
      }
      
      // Create the filename for download
      const filename = downloadFileName || src.split('/').pop() || 'image.jpg';
      
      // Fetch the image
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  return (
    <div className="relative inline-block">
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50 animate-pulse">
          <span className="sr-only">Loading image...</span>
        </div>
      )}
      
      {/* Error state visual indicator */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-20 pointer-events-none">
          <ImageIcon className="h-8 w-8 text-muted-foreground/20" />
        </div>
      )}
      
      {/* Image */}
      <div className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
        {fill ? (
          <Image
            src={imageSrc}
            alt={alt}
            fill
            sizes={sizes || '100vw'}
            priority={priority}
            quality={quality}
            onLoad={handleLoad}
            onError={handleError}
            className="object-cover"
            placeholder="blur"
            blurDataURL={defaultBlurDataURL}
            loading={priority ? 'eager' : 'lazy'}
          />
        ) : (
          <Image
            src={imageSrc}
            alt={alt}
            width={width || 1200}
            height={height || 800}
            priority={priority}
            quality={quality}
            onLoad={handleLoad}
            onError={handleError}
            placeholder="blur"
            blurDataURL={defaultBlurDataURL}
            loading={priority ? 'eager' : 'lazy'}
          />
        )}
      </div>
      
      {/* Download button */}
      {showDownload && !isLoading && (
        <Button
          variant="outline"
          size="sm"
          className="absolute bottom-2 right-2 bg-black/30 hover:bg-black/50 text-white border-none"
          onClick={handleDownload}
          disabled={Boolean(error) && imageSrc !== src}
        >
          <Download className="h-4 w-4 mr-1" />
          Download
        </Button>
      )}
    </div>
  );
} 