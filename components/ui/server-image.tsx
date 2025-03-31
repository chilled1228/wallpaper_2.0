import Image from 'next/image';
import { forwardRef } from 'react';

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
    placeholder,
    blurDataURL,
    style: { color: 'transparent' } // Prevent alt text flash during loading
  };
  
  // Optimized rendering path
  if (fill) {
    return (
      <div className="w-full h-full relative bg-muted/20">
        <Image
          {...imageProps}
          src={finalSrc}
          fill
        />
      </div>
    );
  }
  
  return (
    <div className="relative bg-muted/20">
      <Image
        {...imageProps}
        src={finalSrc}
        width={width || 1200}
        height={height || 800}
      />
    </div>
  );
} 