import React from 'react';
import AdSlot from '../common/AdSlot';

interface BlogAdvertisementProps {
  className?: string;
  slotId?: string;
  placement?: string;
}

/**
 * Reusable AdSense slot for Mod Station Blog
 * Renders only when AdSense is actively configured, otherwise remains invisible
 */
export default function BlogAdvertisement({ 
  className = '', 
  slotId = 'blog-article-inline',
  placement = 'in-content'
}: BlogAdvertisementProps) {
  return (
    <AdSlot 
      page="blog"
      placement={placement}
      slotId={slotId}
      format="horizontal"
      className={className} 
    />
  );
}

