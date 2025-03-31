'use client';

import { useState } from 'react';
import Image, { ImageProps } from 'next/image';

interface ImageWithFallbackProps extends Omit<ImageProps, 'src' | 'alt'> {
  src: string;
  alt: string;
  fallbackSrc: string;
}

export function ImageWithFallback({
  src,
  alt,
  fallbackSrc,
  ...props
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src);
  
  const handleError = () => {
    console.log('Image failed to load, using fallback:', src);
    setImgSrc(fallbackSrc);
  };
  
  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      onError={handleError}
    />
  );
} 