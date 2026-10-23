import React from 'react';
import { Newspaper, Search, Bookmark, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  type?: 'search' | 'bookmarks' | 'category' | 'offline' | 'general';
  title?: string;
  description?: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  type = 'general',
  title,
  description,
  actionText,
  actionHref,
  onAction,
}: EmptyStateProps) {
  let defaultIcon = <Newspaper className="w-12 h-12 text-gray-400 dark:text-gray-500" />;
  let defaultTitle = 'No stories available';
  let defaultDesc = 'Check back shortly as our automated feeds continuously aggregate incoming reports.';

  if (type === 'search') {
    defaultIcon = <Search className="w-12 h-12 text-gray-400 dark:text-gray-500" />;
    defaultTitle = title || 'No matching news stories found';
    defaultDesc = description || 'Try adjusting your search terms, removing filters, or searching for broader topics like "AI", "Economy", or "Climate".';
  } else if (type === 'bookmarks') {
    defaultIcon = <Bookmark className="w-12 h-12 text-gray-400 dark:text-gray-500" />;
    defaultTitle = title || 'Your reading list is empty';
    defaultDesc = description || 'Click the bookmark icon on any news card to save stories for focused reading later.';
    actionText = actionText || 'Explore Latest Headlines';
    actionHref = actionHref || '/';
  } else if (type === 'offline') {
    defaultIcon = <WifiOff className="w-12 h-12 text-amber-500 dark:text-amber-400" />;
    defaultTitle = title || "You're currently offline";
    defaultDesc = description || 'Showing cached stories. We will automatically reconnect and refresh once your internet connection is restored.';
  } else if (type === 'category') {
    defaultIcon = <Newspaper className="w-12 h-12 text-gray-400 dark:text-gray-500" />;
    defaultTitle = title || 'No articles in this section right now';
    defaultDesc = description || 'Our feed aggregation engine is monitoring sources for fresh coverage in this sector.';
  }

  return (
    <div className="flex flex-col items-center justify-center text-center p-12 my-8 rounded-lg border border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 max-w-lg mx-auto">
      <div className="p-3 mb-4 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
        {defaultIcon}
      </div>
      <h3 className="text-xl font-bold font-editorial text-gray-900 dark:text-gray-100 mb-2">
        {title || defaultTitle}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
        {description || defaultDesc}
      </p>

      {actionHref && (
        <Link
          to={actionHref}
          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 transition-colors shadow-sm"
        >
          {actionText || 'Browse Stories'}
        </Link>
      )}

      {onAction && !actionHref && (
        <button
          onClick={onAction}
          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 transition-colors shadow-sm"
        >
          {actionText || 'Retry'}
        </button>
      )}
    </div>
  );
}
