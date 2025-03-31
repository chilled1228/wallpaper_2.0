import Image from 'next/image';
import { forwardRef } from 'react';

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

// Helper function to sanitize R2 URLs
function sanitizeR2Url(url: string): string {
  if (!url) return url;
  
  // Handle the case where URL might be missing protocol for R2
  if (url.startsWith('pub-') && url.includes('.r2.dev')) {
    return `https://${url}`;
  }
  
  // Ensure R2 URLs use HTTPS
  if (url.includes('.r2.dev') && url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  
  return url;
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
  // Process the URL (safely server-side)
  const sanitizedSrc = sanitizeR2Url(src);
  
  // Determine if we should use the fallback
  const hasValidSrc = Boolean(sanitizedSrc) && (
    sanitizedSrc.startsWith('/') || sanitizedSrc.startsWith('http')
  );
  
  // Use either the sanitized source or fallback
  const finalSrc = hasValidSrc ? sanitizedSrc : fallbackSrc;
  
  // Common image properties
  const imageProps = {
    alt,
    className,
    priority,
    quality,
    loading: loading || (priority ? 'eager' : 'lazy'),
    placeholder,
    blurDataURL,
    sizes,
  };
  
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