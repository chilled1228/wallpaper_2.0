'use client'

import Image from 'next/image';
import { forwardRef, useState, useEffect } from 'react';

// Function to sanitize URLs with minimal operations
function sanitizeR2Url(url: string): string {
  if (!url || typeof url !== 'string') return '';
  
  // Handle local paths directly
  if (url.startsWith('/')) return url;
  
  // Quick check for properly formed URLs
  if (url.startsWith('https://')) return url;
  if (url.startsWith('http://') && !url.includes('.r2.dev') && !url.includes('cloudflarestorage')) return url;
  
  // Convert HTTP to HTTPS for R2 URLs (they require HTTPS)
  if (url.startsWith('http://') && (url.includes('.r2.dev') || url.includes('cloudflarestorage'))) {
    return url.replace('http://', 'https://');
  }
  
  // Fix common R2 URL issues - add https:// to URLs without protocol
  if ((url.includes('.r2.dev') || url.includes('cloudflarestorage')) && !url.startsWith('http')) {
    return `https://${url}`;
  }
  
  // Handle Cloudflare R2 custom domain if configured
  const r2PublicDomain = typeof process !== 'undefined' ? 
    process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_DOMAIN : 
    '';
    
  if (r2PublicDomain && 
      !url.includes(r2PublicDomain) && 
      !url.includes('.r2.dev') && 
      !url.startsWith('http') &&
      !url.startsWith('/')) {
    // Construct URL with the custom domain
    return `https://${r2PublicDomain.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`;
  }
  
  // For URLs that look valid but don't have a protocol, add https:// as a default
  if (!url.startsWith('http') && !url.startsWith('/') && url.includes('.') && !url.startsWith('data:')) {
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
  fetchpriority?: 'high' | 'low' | 'auto';
}

// Default blur data URL for minimal loading flash
const defaultBlurDataURL = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzIwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmNWY5Ii8+PC9zdmc+";

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
  placeholder = 'blur', // Default to blur for smoother loading
  blurDataURL = defaultBlurDataURL,
  fetchpriority,
}: ServerImageProps) {
  // Faster initial URL processing with less operations
  const sanitizedSrc = typeof src === 'string' ? sanitizeR2Url(src) : '';
  
  // Directly sanitize the src to avoid errors during state transitions
  const initialSrc = sanitizedSrc || fallbackSrc;
    
  const [imgSrc, setImgSrc] = useState<string>(initialSrc);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // Safe URL processing in useEffect to avoid render-time errors
  useEffect(() => {
    try {
      // Skip processing if we're already using the fallback
      if (hasError) return;
      
      // Minimal processing - just enough to fix common issues
      const sanitizedSrc = sanitizeR2Url(src);
      
      // Validate the sanitized URL
      const hasValidSrc = sanitizedSrc && 
        (sanitizedSrc.startsWith('/') || sanitizedSrc.startsWith('http'));
      
      // Only update if the URL is valid and different from current
      if (hasValidSrc && sanitizedSrc !== imgSrc) {
        setImgSrc(sanitizedSrc);
        setIsLoading(true);
      } else if (!hasValidSrc && fallbackSrc !== imgSrc) {
        // Use fallback for invalid URLs
        setImgSrc(fallbackSrc);
        setIsLoading(true);
      }
    } catch (err) {
      console.error('Error processing image URL:', err);
      setHasError(true);
      setImgSrc(fallbackSrc);
    }
  }, [src, fallbackSrc, imgSrc, hasError]);
  
  // Handle errors safely
  const handleError = () => {
    console.error(`Image failed to load: ${imgSrc}`);
    setHasError(true);
    setImgSrc(fallbackSrc);
    
    // Attempt to log specific details about the URL that failed
    try {
      const urlObj = new URL(imgSrc);
      console.debug('Failed image details:', {
        protocol: urlObj.protocol,
        hostname: urlObj.hostname,
        pathname: urlObj.pathname,
        containsR2: imgSrc.includes('.r2.dev'),
        containsCloudflare: imgSrc.includes('cloudflarestorage')
      });
    } catch (e) {
      console.debug('Could not parse failed URL:', imgSrc);
    }
  };
  
  // Handle load complete
  const handleLoad = () => {
    setIsLoading(false);
  };
  
  // Optimized image properties
  const imageProps = {
    alt,
    className: `${className} ${isLoading ? 'opacity-80' : 'opacity-100'} transition-opacity duration-300`,
    priority: priority || fill, // Always prioritize fill images that are likely above the fold
    quality,
    // Only set loading if priority is not true
    ...(!(priority || fill) ? { loading: loading || 'lazy' } : {}),
    sizes: sizes || (fill ? '100vw' : '(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw'),
    decoding: 'async' as const,
    placeholder,
    blurDataURL,
    onError: handleError,
    onLoad: handleLoad,
    fetchPriority: fetchpriority || (priority || fill ? 'high' : 'auto'),
    style: { color: 'transparent' }, // Prevent alt text flash during loading
    // Improved caching strategy
    unoptimized: src.includes('.svg') || (!src.includes('.r2.') && !src.startsWith('/')), // Skip optimization for SVGs or external URLs
  };
  
  // Safely rendered image with error boundary pattern
  try {
    // Optimized rendering path
    if (fill) {
      return (
        <div className="w-full h-full relative bg-muted/20">
          <Image
            {...imageProps}
            src={imgSrc}
            fill
          />
        </div>
      );
    }
    
    return (
      <div className="relative bg-muted/20">
        <Image
          {...imageProps}
          src={imgSrc}
          width={width || 1200}
          height={height || 800}
        />
      </div>
    );
  } catch (err) {
    console.error('Error rendering image:', err);
    // Fallback rendering for critical errors
    return (
      <div className={`relative bg-muted/40 ${fill ? 'w-full h-full' : ''}`} style={{ 
        width: fill ? '100%' : (width || 'auto'), 
        height: fill ? '100%' : (height || 'auto'),
        minHeight: '100px'
      }}>
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs">
          Image unavailable
        </div>
      </div>
    );
  }
} 