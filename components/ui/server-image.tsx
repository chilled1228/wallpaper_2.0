import Image from 'next/image';
import { forwardRef } from 'react';

// Function to sanitize URLs with minimal operations
function sanitizeR2Url(url: string): string {
  if (!url || typeof url !== 'string') return '';
  
  // Handle local paths directly
  if (url.startsWith('/')) return url;
  
  // Quick check for properly formed URLs
  if (url.startsWith('https://')) return url;
  
  // Fix common R2 URL issues
  if ((url.includes('.r2.dev') || url.includes('cloudflarestorage')) && !url.startsWith('http')) {
    return `https://${url}`;
  }
  
  return url;
}

interface ServerImageProps {
  src: string;
  alt: string;
  fallbackSrc?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  loading?: 'eager' | 'lazy';
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

export function ServerImage({
  src,
  alt,
  fallbackSrc = '/default-wallpaper.jpg',
  fill = false,
  width,
  height,
  className = '',
  sizes,
  priority = false,
  quality = 75,
  loading,
  placeholder,
  blurDataURL,
}: ServerImageProps) {
  // Minimal processing - just enough to fix common issues
  const sanitizedSrc = sanitizeR2Url(src);
  
  // Only require basic validation
  const hasValidSrc = sanitizedSrc && (
    sanitizedSrc.startsWith('/') || sanitizedSrc.startsWith('http')
  );
  
  // Use the fallback if no valid source
  const finalSrc = hasValidSrc ? sanitizedSrc : fallbackSrc;
  
  // Common image properties - optimized for performance
  const imageProps = {
    alt,
    className,
    priority,
    quality,
    loading: loading || (priority ? 'eager' : 'lazy'),
    sizes: sizes || '(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw',
    decoding: 'async' as const,
  };
  
  // Only include placeholder properties if provided
  if (placeholder) {
    // @ts-ignore - We're adding these conditionally
    imageProps.placeholder = placeholder;
    if (blurDataURL && placeholder === 'blur') {
      // @ts-ignore
      imageProps.blurDataURL = blurDataURL;
    }
  }
  
  // Optimized rendering path
  if (fill) {
    return (
      <Image
        {...imageProps}
        src={finalSrc}
        fill
      />
    );
  }
  
  return (
    <Image
      {...imageProps}
      src={finalSrc}
      width={width || 1200}
      height={height || 800}
    />
  );
} 