import React from 'react';
import AdSenseAd from './adsense-ad';

interface AdContainerProps {
  adSlot: string;
  adFormat?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  className?: string;
  label?: boolean;
}

export default function AdContainer({ 
  adSlot, 
  adFormat = 'auto', 
  className = '',
  label = true
}: AdContainerProps) {
  return (
    <div className={`my-6 mx-auto p-2 bg-background/50 border border-border/30 rounded-lg ${className}`}>
      {label && <div className="text-xs text-muted-foreground mb-2 text-center">Advertisement</div>}
      <AdSenseAd adSlot={adSlot} adFormat={adFormat} />
    </div>
  );
} 