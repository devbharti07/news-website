import React from 'react';

export function HeroSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-10 border-b border-gray-200 dark:border-gray-800">
      <div className="lg:col-span-8 flex flex-col gap-4">
        <div className="aspect-[16/9] w-full rounded animate-shimmer" />
        <div className="h-4 w-28 rounded animate-shimmer" />
        <div className="h-8 w-3/4 rounded animate-shimmer" />
        <div className="h-4 w-full rounded animate-shimmer" />
        <div className="h-4 w-2/3 rounded animate-shimmer" />
      </div>
      <div className="lg:col-span-4 flex flex-col gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex-1 space-y-2">
              <div className="h-3 w-20 rounded animate-shimmer" />
              <div className="h-5 w-full rounded animate-shimmer" />
              <div className="h-3 w-24 rounded animate-shimmer" />
            </div>
            <div className="w-24 h-20 rounded animate-shimmer flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function NewsCardSkeleton() {
  return (
    <div className="flex flex-col rounded bg-white dark:bg-[#111625] border border-gray-200 dark:border-gray-800/80 p-4 space-y-3">
      <div className="aspect-[16/9] w-full rounded animate-shimmer" />
      <div className="h-3 w-24 rounded animate-shimmer" />
      <div className="h-6 w-full rounded animate-shimmer" />
      <div className="h-4 w-4/5 rounded animate-shimmer" />
      <div className="flex justify-between items-center pt-2">
        <div className="h-3 w-32 rounded animate-shimmer" />
        <div className="h-6 w-6 rounded-full animate-shimmer" />
      </div>
    </div>
  );
}

export function HorizontalCardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-4 rounded bg-white dark:bg-[#111625] border border-gray-200 dark:border-gray-800">
      <div className="md:col-span-5 aspect-[16/10] rounded animate-shimmer" />
      <div className="md:col-span-7 flex flex-col justify-between py-1 space-y-3">
        <div className="space-y-2">
          <div className="h-3 w-24 rounded animate-shimmer" />
          <div className="h-7 w-full rounded animate-shimmer" />
          <div className="h-4 w-full rounded animate-shimmer" />
          <div className="h-4 w-3/4 rounded animate-shimmer" />
        </div>
        <div className="h-4 w-40 rounded animate-shimmer" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <NewsCardSkeleton key={idx} />
      ))}
    </div>
  );
}
