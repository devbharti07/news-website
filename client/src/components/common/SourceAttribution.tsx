import React from 'react';
import { Layers } from 'lucide-react';

interface SourceAttributionProps {
  sourceName: string;
  publishedAt: string;
  sourceCoverageCount?: number;
  relatedSources?: string[];
  className?: string;
}

/**
 * Converts ISO date to friendly relative time string
 */
export function formatRelativeTime(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (isNaN(diffSec) || diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 172800) return 'Yesterday';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

export function SourceAttribution({
  sourceName,
  publishedAt,
  sourceCoverageCount,
  relatedSources,
  className = '',
}: SourceAttributionProps) {
  const relativeTime = formatRelativeTime(publishedAt);
  const fullDate = new Date(publishedAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className={`flex items-center flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400 ${className}`}>
      {/* Source Name */}
      <span className="font-semibold text-gray-900 dark:text-gray-200 uppercase tracking-wider">
        {sourceName}
      </span>

      <span className="text-gray-300 dark:text-gray-600">•</span>

      {/* Relative Time with Full Date Tooltip */}
      <time dateTime={publishedAt} title={fullDate} className="cursor-help hover:text-gray-700 dark:hover:text-gray-300">
        {relativeTime}
      </time>

      {/* Multi-source coverage badge */}
      {sourceCoverageCount && sourceCoverageCount > 1 && (
        <>
          <span className="text-gray-300 dark:text-gray-600">•</span>
          <span
            title={`Also reported by: ${relatedSources?.join(', ') || 'multiple outlets'}`}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50"
          >
            <Layers className="w-3 h-3" />
            Covered by {sourceCoverageCount} sources
          </span>
        </>
      )}
    </div>
  );
}
