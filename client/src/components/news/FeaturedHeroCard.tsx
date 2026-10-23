import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Share2, ArrowRight } from 'lucide-react';
import { NewsArticle } from '../../types/news';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { SourceAttribution } from '../common/SourceAttribution';
import { ShareModal } from '../common/ShareModal';
import { useBookmarks } from '../../context/BookmarksContext';

interface FeaturedHeroCardProps {
  article: NewsArticle;
}

export function FeaturedHeroCard({ article }: FeaturedHeroCardProps) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [isShareOpen, setIsShareOpen] = useState(false);
  const bookmarked = isBookmarked(article.id);

  // Estimate reading time based on description word count
  const words = (article.description || '').split(/\s+/).length;
  const readTime = Math.max(1, Math.ceil(words / 40));

  return (
    <>
      <article className="group flex flex-col justify-between h-full bg-white dark:bg-[#111625] rounded-xl border border-gray-200/90 dark:border-gray-800/90 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        {/* Lead Image */}
        <Link to={`/article/${article.id}`} className="block relative overflow-hidden">
          <ImageWithFallback
            src={article.imageUrl}
            alt={article.title}
            aspectRatio="wide"
            category={article.category}
            className="group-hover:scale-[1.01] transition-transform duration-300"
          />
          <div className="absolute top-4 left-4 z-10">
            <span className="px-3 py-1 rounded text-xs font-bold uppercase tracking-wider bg-red-600 text-white shadow-sm">
              {article.category}
            </span>
          </div>
        </Link>

        {/* Lead Content */}
        <div className="p-6 md:p-8 flex flex-col justify-between flex-1">
          <div className="space-y-4">
            <SourceAttribution
              sourceName={article.sourceName}
              publishedAt={article.publishedAt}
              sourceCoverageCount={article.sourceCoverageCount}
              relatedSources={article.relatedSources}
            />

            <Link to={`/article/${article.id}`} className="block group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-editorial font-bold text-gray-950 dark:text-gray-50 leading-[1.2]">
                {article.title}
              </h2>
            </Link>

            <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
              {article.description}
            </p>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-100 dark:border-gray-800/80">
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span>{readTime} min read</span>
              {article.author && <span>By {article.author}</span>}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsShareOpen(true)}
                title="Share article"
                className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => toggleBookmark(article)}
                title={bookmarked ? 'Remove bookmark' : 'Bookmark story'}
                className={`p-2 rounded-lg transition-colors ${
                  bookmarked
                    ? 'text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
              </button>

              <Link
                to={`/article/${article.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 ml-2 rounded-lg bg-gray-950 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 text-xs font-semibold tracking-wide transition-colors"
              >
                <span>Read Story</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
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
