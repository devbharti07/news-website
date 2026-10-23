import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Sparkles, Filter } from 'lucide-react';
import { searchNews } from '../services/api';
import { NewsCard } from '../components/news/NewsCard';
import { GridSkeleton } from '../components/common/SkeletonCard';
import { EmptyState } from '../components/common/EmptyState';

const POPULAR_TOPICS = [
  'Artificial Intelligence',
  'Semiconductors',
  'Renewable Energy',
  'Space Exploration',
  'Interest Rates',
  'Electric Vehicles',
  'Champions League',
  'Quantum Computing',
];

const SEARCH_CATEGORIES = [
  { label: 'All', value: '' },
  { label: 'Technology', value: 'technology' },
  { label: 'AI', value: 'ai' },
  { label: 'World', value: 'world' },
  { label: 'Business', value: 'business' },
  { label: 'Politics', value: 'politics' },
  { label: 'Science', value: 'science' },
];

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialCat = searchParams.get('category') || '';

  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState(initialCat);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  // Debounce search query changes by 350ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchTerm);
      if (searchTerm.trim()) {
        setSearchParams({ q: searchTerm.trim(), ...(activeCategory ? { category: activeCategory } : {}) });
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [searchTerm, activeCategory, setSearchParams]);

  // Keep query param in sync
  useEffect(() => {
    const q = searchParams.get('q') || '';
    if (q !== searchTerm) {
      setSearchTerm(q);
      setDebouncedQuery(q);
    }
  }, [searchParams]);

  useEffect(() => {
    if (debouncedQuery.trim()) {
      document.title = `Search: "${debouncedQuery}" | Chronicle Global`;
    } else {
      document.title = 'Global Intelligence Search | Chronicle Global';
    }
  }, [debouncedQuery]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['search', debouncedQuery, activeCategory],
    queryFn: () =>
      searchNews(debouncedQuery, {
        category: activeCategory || undefined,
        limit: 30,
      }),
    enabled: Boolean(debouncedQuery.trim()),
  });

  const articles = data?.data || [];

  const handleSelectTopic = (topic: string) => {
    setSearchTerm(topic);
    setDebouncedQuery(topic);
    setSearchParams({ q: topic, ...(activeCategory ? { category: activeCategory } : {}) });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Search Masthead Input */}
      <div className="max-w-3xl mx-auto space-y-4 text-center">
        <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
          Global Intelligence Archive
        </span>
        <h1 className="text-3xl sm:text-4xl font-editorial font-bold text-gray-950 dark:text-gray-50">
          Search Aggregated News
        </h1>

        <div className="relative mt-4">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search breaking headlines, topics, geopolitical events..."
            autoFocus
            className="w-full pl-12 pr-10 py-3.5 rounded-xl text-base bg-white dark:bg-[#111625] border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 shadow-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
          />
          <Search className="w-5 h-5 absolute left-4 top-4 text-gray-400" />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setDebouncedQuery('');
                setSearchParams({});
              }}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center justify-center flex-wrap gap-2 pt-2">
          {SEARCH_CATEGORIES.map(cat => (
            <button
              key={cat.label}
              onClick={() => setActiveCategory(cat.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeCategory === cat.value
                  ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Popular Topic Suggestions */}
        {!debouncedQuery && (
          <div className="pt-6 space-y-3">
            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Suggested Topics</span>
            </div>
            <div className="flex items-center justify-center flex-wrap gap-2">
              {POPULAR_TOPICS.map(topic => (
                <button
                  key={topic}
                  onClick={() => handleSelectTopic(topic)}
                  className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/60 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700/80 text-gray-700 dark:text-gray-300 transition-colors"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results Section */}
      {debouncedQuery && (
        <div className="space-y-6 pt-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              {isLoading
                ? 'Searching syndicated feeds...'
                : `Showing ${articles.length} results for "${debouncedQuery}"`}
            </span>
            {articles.length > 0 && <span>Sorted by relevance & date</span>}
          </div>

          {isLoading ? (
            <GridSkeleton count={6} />
          ) : isError || articles.length === 0 ? (
            <EmptyState
              type="search"
              title={`No stories found for "${debouncedQuery}"`}
              description="No incoming wire reports matched your keyword. Try a broader search term or explore suggested topics above."
              onAction={() => refetch()}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map(article => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
