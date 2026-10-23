import React, { useEffect } from 'react';
import { Bookmark, Trash2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBookmarks } from '../context/BookmarksContext';
import { NewsCard } from '../components/news/NewsCard';
import { EmptyState } from '../components/common/EmptyState';

export function BookmarksPage() {
  const { bookmarks, clearAllBookmarks } = useBookmarks();

  useEffect(() => {
    document.title = 'Reading Vault & Saved Stories | Chronicle Global';
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
            Reading Vault
          </span>
          <h1 className="text-3xl md:text-4xl font-editorial font-bold text-gray-950 dark:text-gray-50 mt-1">
            Saved Stories
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {bookmarks.length === 1
              ? '1 article saved for offline reading and research'
              : `${bookmarks.length} articles saved for offline reading and research`}
          </p>
        </div>

        {bookmarks.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all saved bookmarks?')) {
                clearAllBookmarks();
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/40 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Reading List</span>
          </button>
        )}
      </div>

      {/* Bookmarks Grid or Empty State */}
      {bookmarks.length === 0 ? (
        <EmptyState
          type="bookmarks"
          title="Your reading list is currently empty"
          description="Bookmark articles while browsing the homepage or category feeds to build your personal reading digest."
          actionText="Browse Top Stories"
          actionHref="/"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarks.map(article => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
