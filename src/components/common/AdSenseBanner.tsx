import React from 'react';
import AdSenseSlot from './AdSenseSlot';

interface AdSenseBannerProps {
  slotId?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal';
  className?: string;
}

export default function AdSenseBanner({ 
  slotId = 'mod-station-default', 
  format = 'auto', 
  className = '' 
}: AdSenseBannerProps) {
  return (
    <AdSenseSlot 
      slotId={slotId} 
      format={format as any} 
      className={className} 
    />
  );
}
