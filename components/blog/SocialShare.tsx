'use client';

import React, { useState } from 'react';
import { Share2, Twitter, Linkedin, Facebook, Link2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
  hashtags?: string[];
}

/**
 * SocialShare Component
 * 
 * Provides social sharing buttons for:
 * - Twitter/X
 * - LinkedIn
 * - Facebook
 * - Copy Link
 * 
 * Includes share analytics tracking (optional)
 */
export function SocialShare({ url, title, description, hashtags = [] }: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const fullUrl = url.startsWith('http') ? url : `https://lightpoint.uk${url}`;
  const encodedUrl = encodeURIComponent(fullUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description || title);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}${hashtags.length > 0 ? `&hashtags=${hashtags.join(',')}` : ''}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      
      // Track copy event (optional)
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'share', {
          method: 'copy_link',
          content_type: 'blog_post',
          item_id: url,
        });
      }
      
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleShare = (platform: string) => {
    // Track share event (optional)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'share', {
        method: platform,
        content_type: 'blog_post',
        item_id: url,
      });
    }
    
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      {/* Desktop: Show all buttons */}
      <div className="hidden md:flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700">Share:</span>
        
        <a
          href={shareLinks.twitter}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleShare('twitter')}
          className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 hover:bg-blue-500 hover:text-white transition-colors"
          aria-label="Share on Twitter"
        >
          <Twitter className="h-4 w-4" />
        </a>

        <a
          href={shareLinks.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleShare('linkedin')}
          className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 hover:bg-blue-700 hover:text-white transition-colors"
          aria-label="Share on LinkedIn"
        >
          <Linkedin className="h-4 w-4" />
        </a>

        <a
          href={shareLinks.facebook}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleShare('facebook')}
          className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 hover:bg-blue-600 hover:text-white transition-colors"
          aria-label="Share on Facebook"
        >
          <Facebook className="h-4 w-4" />
        </a>

        <button
          onClick={handleCopyLink}
          className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-700 hover:text-white transition-colors"
          aria-label="Copy link"
        >
          {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
        </button>

        {copied && (
          <span className="text-sm text-green-600 font-medium animate-fade-in">
            Link copied!
          </span>
        )}
      </div>

      {/* Mobile: Dropdown menu */}
      <div className="md:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2"
        >
          <Share2 className="h-4 w-4" />
          Share
        </Button>

        {showDropdown && (
          <div className="absolute top-full right-0 mt-2 w-48 glass rounded-xl shadow-lg py-2 z-50">
            <a
              href={shareLinks.twitter}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleShare('twitter')}
              className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors"
            >
              <Twitter className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Twitter</span>
            </a>

            <a
              href={shareLinks.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleShare('linkedin')}
              className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors"
            >
              <Linkedin className="h-4 w-4 text-blue-700" />
              <span className="text-sm font-medium">LinkedIn</span>
            </a>

            <a
              href={shareLinks.facebook}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleShare('facebook')}
              className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors"
            >
              <Facebook className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Facebook</span>
            </a>

            <button
              onClick={handleCopyLink}
              className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors w-full text-left"
            >
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Link2 className="h-4 w-4 text-gray-600" />}
              <span className="text-sm font-medium">{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Close dropdown when clicking outside */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}

