import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Share2 } from 'lucide-react';
import { NewsArticle } from '../../types/news';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { SourceAttribution } from '../common/SourceAttribution';
import { ShareModal } from '../common/ShareModal';
import { useBookmarks } from '../../context/BookmarksContext';

interface NewsCardProps {
  article: NewsArticle;
}

export function NewsCard({ article }: NewsCardProps) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [isShareOpen, setIsShareOpen] = useState(false);
  const bookmarked = isBookmarked(article.id);

  return (
    <>
      <article className="group flex flex-col justify-between h-full rounded-xl bg-white dark:bg-[#111625] border border-gray-200/80 dark:border-gray-800/80 hover:border-gray-300 dark:hover:border-gray-700 transition-all overflow-hidden shadow-sm hover:shadow">
        <div>
          {/* Card Image */}
          <Link to={`/article/${article.id}`} className="block relative overflow-hidden">
            <ImageWithFallback
              src={article.imageUrl}
              alt={article.title}
              aspectRatio="video"
              category={article.category}
              className="group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-3 left-3 z-10">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-950/80 text-white backdrop-blur-sm">
                {article.category}
              </span>
            </div>
          </Link>

          {/* Card Body */}
          <div className="p-5 space-y-3">
            <SourceAttribution
              sourceName={article.sourceName}
              publishedAt={article.publishedAt}
              sourceCoverageCount={article.sourceCoverageCount}
              relatedSources={article.relatedSources}
            />

            <Link to={`/article/${article.id}`} className="block group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
              <h3 className="text-xl font-editorial font-bold text-gray-950 dark:text-gray-100 leading-snug line-clamp-2">
                {article.title}
              </h3>
            </Link>

            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed">
              {article.description}
            </p>
          </div>
        </div>

        {/* Card Footer */}
        <div className="px-5 pb-5 pt-3 border-t border-gray-100 dark:border-gray-800/60 flex items-center justify-between text-xs">
          <Link
            to={`/article/${article.id}`}
            className="font-semibold text-gray-700 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400 transition-colors"
          >
            Read Story →
          </Link>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsShareOpen(true)}
              title="Share story"
              className="p-1.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
      </article>

      <ShareModal
        article={article}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />
    </>
  );
}
