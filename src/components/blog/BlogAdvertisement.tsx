import React from 'react';
import AdSenseSlot from '../common/AdSenseSlot';

interface BlogAdvertisementProps {
  className?: string;
  slotId?: string;
}

/**
 * Reusable AdSense slot for Mod Station Blog
 * Renders only when AdSense is actively configured, otherwise remains invisible
 */
export default function BlogAdvertisement({ 
  className = '', 
  slotId = 'blog-article-inline' 
}: BlogAdvertisementProps) {
  return (
    <div className={`w-full max-w-4xl mx-auto my-4 ${className}`}>
      <AdSenseSlot 
        slotId={slotId} 
        format="horizontal" 
      />
    </div>
  );
}
