import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Share2 } from 'lucide-react';
import { NewsArticle } from '../../types/news';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { SourceAttribution } from '../common/SourceAttribution';
import { ShareModal } from '../common/ShareModal';
import { useBookmarks } from '../../context/BookmarksContext';

interface HorizontalNewsCardProps {
  article: NewsArticle;
}

export function HorizontalNewsCard({ article }: HorizontalNewsCardProps) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [isShareOpen, setIsShareOpen] = useState(false);
  const bookmarked = isBookmarked(article.id);

  return (
    <>
      <article className="group grid grid-cols-1 sm:grid-cols-12 gap-5 p-4 rounded-xl bg-white dark:bg-[#111625] border border-gray-200/80 dark:border-gray-800/80 hover:border-gray-300 dark:hover:border-gray-700 transition-all">
        {/* Left Thumbnail */}
        <Link to={`/article/${article.id}`} className="sm:col-span-4 rounded-lg overflow-hidden block">
          <ImageWithFallback
            src={article.imageUrl}
            alt={article.title}
            aspectRatio="video"
            category={article.category}
            className="group-hover:scale-105 transition-transform duration-300 h-full min-h-[140px]"
          />
        </Link>

        {/* Right Details */}
        <div className="sm:col-span-8 flex flex-col justify-between space-y-2">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                {article.category}
              </span>
              <span className="text-gray-300 dark:text-gray-700">•</span>
              <SourceAttribution
                sourceName={article.sourceName}
                publishedAt={article.publishedAt}
                sourceCoverageCount={article.sourceCoverageCount}
                relatedSources={article.relatedSources}
              />
            </div>

            <Link to={`/article/${article.id}`} className="block group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
              <h3 className="text-lg font-editorial font-bold text-gray-900 dark:text-gray-100 leading-snug line-clamp-2">
                {article.title}
              </h3>
            </Link>

            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
              {article.description}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800/60">
            <Link
              to={`/article/${article.id}`}
              className="text-xs font-semibold text-gray-700 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400 transition-colors"
            >
              Full coverage →
            </Link>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsShareOpen(true)}
                title="Share"
                className="p-1.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => toggleBookmark(article)}
                title={bookmarked ? 'Remove bookmark' : 'Bookmark story'}
                className={`p-1.5 rounded transition-colors ${
                  bookmarked
                    ? 'text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </article>

      <ShareModal
        article={article}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />
    </>
  );
}
