import React from 'react';
import { Link } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import { NewsArticle } from '../../types/news';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { formatRelativeTime } from '../common/SourceAttribution';
import { useBookmarks } from '../../context/BookmarksContext';

interface CompactNewsCardProps {
  article: NewsArticle;
  index?: number;
}

export function CompactNewsCard({ article, index }: CompactNewsCardProps) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const bookmarked = isBookmarked(article.id);

  return (
    <article className="group flex items-start gap-4 pb-4 border-b border-gray-100 dark:border-gray-800/80 last:border-b-0 last:pb-0">
      {index !== undefined && (
        <span className="text-xl font-editorial font-bold text-gray-300 dark:text-gray-700 w-5 flex-shrink-0">
          {index + 1}
        </span>
      )}

      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
          <span className="font-semibold text-gray-900 dark:text-gray-300 uppercase tracking-wide">
            {article.sourceName}
          </span>
          <span>•</span>
          <span>{formatRelativeTime(article.publishedAt)}</span>
        </div>

        <Link
          to={`/article/${article.id}`}
          className="block font-editorial font-bold text-sm text-gray-900 dark:text-gray-100 group-hover:text-red-600 dark:group-hover:text-red-400 leading-snug line-clamp-2 transition-colors"
        >
          {article.title}
        </Link>
      </div>

      {article.imageUrl && (
        <Link to={`/article/${article.id}`} className="w-20 h-16 rounded overflow-hidden flex-shrink-0 block">
          <ImageWithFallback
            src={article.imageUrl}
            alt={article.title}
            aspectRatio="square"
            category={article.category}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        </Link>
      )}

      <button
        onClick={() => toggleBookmark(article)}
        title={bookmarked ? 'Remove' : 'Save'}
        className={`p-1 flex-shrink-0 transition-colors ${
          bookmarked ? 'text-red-600 dark:text-red-400' : 'text-gray-300 hover:text-gray-600 dark:hover:text-gray-200'
        }`}
      >
        <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-current' : ''}`} />
      </button>
    </article>
  );
}
