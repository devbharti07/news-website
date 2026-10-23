import React, { useState } from 'react';
import {
  Newspaper,
  Cpu,
  TrendingUp,
  Trophy,
  Gamepad2,
  Leaf,
  Activity,
  Globe2,
  Film,
  Sparkles,
} from 'lucide-react';

interface ImageWithFallbackProps {
  src?: string;
  alt: string;
  className?: string;
  aspectRatio?: 'video' | 'square' | 'wide' | 'auto';
  category?: string;
}

function getCategoryIcon(cat: string = '') {
  const c = cat.toLowerCase();
  if (c === 'ai' || c === 'technology' || c === 'startups') return Cpu;
  if (c === 'business' || c === 'finance') return TrendingUp;
  if (c === 'sports') return Trophy;
  if (c === 'gaming') return Gamepad2;
  if (c === 'environment') return Leaf;
  if (c === 'health') return Activity;
  if (c === 'entertainment') return Film;
  if (c === 'space' || c === 'science') return Sparkles;
  if (c === 'world' || c === 'india' || c === 'politics') return Globe2;
  return Newspaper;
}

export function ImageWithFallback({
  src,
  alt,
  className = '',
  aspectRatio = 'video',
  category = 'news',
}: ImageWithFallbackProps) {
  const [isLoading, setIsLoading] = useState(Boolean(src));
  const [hasError, setHasError] = useState(!src);
  const CategoryIcon = getCategoryIcon(category);

  const aspectClass =
    aspectRatio === 'video'
      ? 'aspect-[16/9]'
      : aspectRatio === 'wide'
      ? 'aspect-[21/9]'
      : aspectRatio === 'square'
      ? 'aspect-square'
      : '';

  return (
    <div className={`relative overflow-hidden bg-gray-100 dark:bg-gray-800 ${aspectClass} ${className}`}>
      {/* Loading Skeleton */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 animate-shimmer" />
      )}

      {/* Fallback Display if Error or No Source */}
      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-100 via-gray-100 to-gray-200 dark:from-[#111726] dark:via-[#131929] dark:to-[#0f1422] text-gray-400 dark:text-gray-500 border border-black/5 dark:border-white/5">
          <div className="p-3 rounded-full bg-white/70 dark:bg-white/5 shadow-xs mb-2">
            <CategoryIcon className="w-6 h-6 opacity-70 text-red-600/80 dark:text-red-400/80" />
          </div>
          <span className="text-[11px] uppercase tracking-widest font-bold text-gray-500 dark:text-gray-400">
            {category} Dispatch
          </span>
          <span className="text-[10px] text-gray-400 dark:text-gray-600 mt-0.5">Chronicle Wire</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
        />
      )}
    </div>
  );
}
