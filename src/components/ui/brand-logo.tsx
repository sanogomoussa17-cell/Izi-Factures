'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  variant?: 'full' | 'icon-only';
  className?: string;
  href?: string;
}

export const LOGO_IMAGE_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCnutGX6vR0ugy7nbbNfbLAy-l5Fk_VgRmXVQ0kNinsbtIvjWjgM1YvQOD7-5WSOoyRGr63azA6c7PbmFx0ANuD-bsiVzSeb3UNINbbVLnUcW46MCCgLate2W3ydZf9WC_m_QRqd5mNGDqpN6mSYRAo8RcYS8w7yiAmuRd7kO2UL5TgZjH6GFpcXChafzk49bm7L6AOkQtNqeVpjGDvVtKvGBJQwlzmwUnKnH2D7wNhDvxzSRncKOY';

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showTagline = true,
  variant = 'full',
  className = '',
  href,
}) => {
  const sizeMap = {
    sm: { img: 28, text: 'text-lg', tag: 'text-[9px]' },
    md: { img: 36, text: 'text-xl', tag: 'text-[10px]' },
    lg: { img: 44, text: 'text-2xl', tag: 'text-xs' },
    xl: { img: 56, text: 'text-3xl', tag: 'text-sm' },
  };

  const currentSize = sizeMap[size];

  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Official Image / Icon */}
      <div className="relative shrink-0 flex items-center justify-center rounded-xl overflow-hidden shadow-xs hover:scale-105 transition-transform">
        <img
          src={LOGO_IMAGE_URL}
          alt="Izi Factures Logo"
          width={currentSize.img}
          height={currentSize.img}
          className="object-contain rounded-xl"
          onError={(e) => {
            // Fallback gradient if remote image fails
            const target = e.currentTarget;
            target.style.display = 'none';
            if (target.parentElement) {
              target.parentElement.innerHTML = `
                <div class="w-[${currentSize.img}px] h-[${currentSize.img}px] rounded-xl bg-gradient-to-br from-[#FF6B00] via-[#FF8A00] to-[#0E7A55] flex items-center justify-center text-white font-black text-sm shadow-sm">
                  iZ
                </div>
              `;
            }
          }}
        />
      </div>

      {/* Typography */}
      {variant === 'full' && (
        <div className="flex flex-col leading-tight">
          <span className={`font-black font-display tracking-tight text-foreground ${currentSize.text}`}>
            <span className="text-[#FF6B00]">Izi</span>
            <span className="text-[#0E7A55]">Factures</span>
          </span>
          {showTagline && (
            <span className={`font-bold uppercase tracking-widest text-muted-foreground ${currentSize.tag}`}>
              Facturation UEMOA
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block hover:opacity-95 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
};
