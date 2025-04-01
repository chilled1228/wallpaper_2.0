'use client';

import { useEffect, useRef } from 'react';

interface AdSenseAdProps {
  adSlot: string;
  adFormat?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  style?: React.CSSProperties;
  className?: string;
}

export default function AdSenseAd({ 
  adSlot, 
  adFormat = 'auto', 
  style = {}, 
  className = '' 
}: AdSenseAdProps) {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    // Only run if adsense is loaded
    if (window.adsbygoogle === undefined) {
      console.log('AdSense not loaded');
      return;
    }
    
    try {
      // Try to init the ad
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      console.log('AdSense ad pushed for slot:', adSlot);
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, [adSlot]);

  const formatMap = {
    auto: { width: '100%', height: 'auto' },
    rectangle: { width: '300px', height: '250px' },
    horizontal: { width: '728px', height: '90px' },
    vertical: { width: '160px', height: '600px' }
  };

  // Only render if we have an adSlot and we're in browser
  if (!adSlot || typeof window === 'undefined') {
    return null;
  }

  return (
    <div 
      ref={adRef}
      className={`adsbygoogle ${className}`}
      style={{
        display: 'block',
        overflow: 'hidden',
        ...formatMap[adFormat],
        ...style
      }}
      data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_ID}
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      data-full-width-responsive="true"
    />
  );
}

// Add type definitions for adsbygoogle
declare global {
  interface Window {
    adsbygoogle: any[];
  }
} 