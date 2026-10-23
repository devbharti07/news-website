import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ExternalLink,
  Bookmark,
  Share2,
  ArrowLeft,
  Clock,
  User,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { getArticleById, getNews } from '../services/api';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { SourceAttribution } from '../components/common/SourceAttribution';
import { ShareModal } from '../components/common/ShareModal';
import { NewsCard } from '../components/news/NewsCard';
import { EmptyState } from '../components/common/EmptyState';
import { useBookmarks } from '../context/BookmarksContext';

export function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Scroll to top on article change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  // Fetch target article
  const {
    data: article,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['article', id],
    queryFn: () => getArticleById(id || ''),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (article?.title) {
      document.title = `${article.title} | Chronicle Global`;
    }
  }, [article?.title]);

  // Fetch related stories based on category
  const { data: relatedData } = useQuery({
    queryKey: ['news', 'related', article?.category],
    queryFn: () => getNews({ category: article?.category, limit: 4 }),
    enabled: Boolean(article?.category),
  });

  const relatedArticles = (relatedData?.data || []).filter(a => a.id !== id).slice(0, 3);
  const bookmarked = article ? isBookmarked(article.id) : false;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <div className="h-4 w-28 rounded animate-shimmer" />
        <div className="h-10 w-full rounded animate-shimmer" />
        <div className="h-5 w-2/3 rounded animate-shimmer" />
        <div className="aspect-[16/9] w-full rounded-xl animate-shimmer" />
        <div className="space-y-3 pt-6">
          <div className="h-4 w-full rounded animate-shimmer" />
          <div className="h-4 w-full rounded animate-shimmer" />
          <div className="h-4 w-3/4 rounded animate-shimmer" />
        </div>
      </div>
    );
  }

  if (isError || !article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <EmptyState
          title="Article details unavailable"
          description="The requested story could not be retrieved from the feed cache. It may have expired or been replaced by newer reports."
          actionText="Return to Front Page"
          actionHref="/"
        />
      </div>
    );
  }

  return (
    <>
      <article className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Back Link */}
        <div>
          <Link
            to={article.category ? `/${article.category}` : '/'}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors uppercase tracking-wider"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to {article.category || 'News'}</span>
          </Link>
        </div>

        {/* Article Masthead */}
        <header className="space-y-4 border-b border-gray-200 dark:border-gray-800 pb-6">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider bg-red-600 text-white">
              {article.category}
            </span>
            <SourceAttribution
              sourceName={article.sourceName}
              publishedAt={article.publishedAt}
              sourceCoverageCount={article.sourceCoverageCount}
              relatedSources={article.relatedSources}
            />
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-editorial font-bold text-gray-950 dark:text-gray-50 leading-[1.15]">
            {article.title}
          </h1>

          {/* Author & Timestamp Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-4">
              {article.author && (
                <div className="flex items-center gap-1.5 font-medium text-gray-900 dark:text-gray-200">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  <span>Reported by {article.author}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <time dateTime={article.publishedAt}>
                  {new Date(article.publishedAt).toLocaleString(undefined, {
                    dateStyle: 'full',
                    timeStyle: 'short',
                  })}
                </time>
              </div>
            </div>

            {/* Bookmark & Share Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsShareOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>

              <button
                onClick={() => toggleBookmark(article)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors font-medium ${
                  bookmarked
                    ? 'border-red-600 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-current' : ''}`} />
                <span>{bookmarked ? 'Saved' : 'Save'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        {article.imageUrl && (
          <figure className="space-y-2">
            <div className="rounded-xl overflow-hidden border border-gray-200/80 dark:border-gray-800/80 shadow-sm">
              <ImageWithFallback
                src={article.imageUrl}
                alt={article.title}
                aspectRatio="wide"
                category={article.category}
              />
            </div>
            <figcaption className="text-right text-[11px] text-gray-400 dark:text-gray-500">
              Media asset courtesy of {article.sourceName}
            </figcaption>
          </figure>
        )}

        {/* Article Summary / Excerpt */}
        <section className="prose dark:prose-invert max-w-none text-base sm:text-lg leading-relaxed text-gray-800 dark:text-gray-200 space-y-4">
          <p className="font-editorial text-xl sm:text-2xl font-normal leading-relaxed text-gray-900 dark:text-gray-100 border-l-4 border-red-600 pl-4 py-1">
            {article.description}
          </p>

          {article.content && (
            <p className="text-gray-700 dark:text-gray-300">
              {article.content}
            </p>
          )}
        </section>

        {/* Mandatory Legal Summary Disclaimer & Direct Link Action */}
        <div className="p-6 rounded-xl bg-amber-50/70 dark:bg-[#151923] border border-amber-200/80 dark:border-amber-900/40 space-y-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                Official Publisher Notice & Fair Use
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                This report is an editorial summary and metadata index compiled by Chronicle Global. Full reporting, analysis, and multimedia remain the intellectual property of{' '}
                <strong className="text-gray-900 dark:text-gray-100">{article.sourceName}</strong>.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <a
              href={article.articleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold tracking-wide shadow-sm hover:shadow transition-all"
            >
              <span>Read Complete Story at {article.sourceName}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <Tag className="w-3.5 h-3.5 text-gray-400" />
              <span className="font-semibold text-gray-700 dark:text-gray-300">Topics:</span>
              {article.tags.map(tag => (
                <Link
                  key={tag}
                  to={`/search?q=${encodeURIComponent(tag)}`}
                  className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Related Stories */}
        {relatedArticles.length > 0 && (
          <section className="pt-10 border-t border-gray-200 dark:border-gray-800 space-y-6">
            <h3 className="text-2xl font-editorial font-bold text-gray-950 dark:text-gray-50">
              Related Coverage in {article.category}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map(story => (
                <NewsCard key={story.id} article={story} />
              ))}
            </div>
          </section>
        )}
      </article>

      <ShareModal
        article={article}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />
    </>
  );
}
