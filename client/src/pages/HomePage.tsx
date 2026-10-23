import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  TrendingUp,
  Cpu,
  Globe2,
  Briefcase,
  Trophy,
  Film,
  HeartPulse,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Clock,
  Layers,
} from 'lucide-react';
import { getNews } from '../services/api';
import { useRegion } from '../context/RegionContext';
import { FeaturedHeroCard } from '../components/news/FeaturedHeroCard';
import { HorizontalNewsCard } from '../components/news/HorizontalNewsCard';
import { NewsCard } from '../components/news/NewsCard';
import { CompactNewsCard } from '../components/news/CompactNewsCard';
import { HeroSkeleton, GridSkeleton } from '../components/common/SkeletonCard';
import { NewStoriesNotification } from '../components/common/NewStoriesNotification';
import { EmptyState } from '../components/common/EmptyState';
import { NewsArticle } from '../types/news';

export function HomePage() {
  const { region } = useRegion();
  const [newArticlesCount, setNewArticlesCount] = useState(0);
  const [previousLeadId, setPreviousLeadId] = useState<string | null>(null);
  const [visibleDispatchesCount, setVisibleDispatchesCount] = useState(9);

  // TanStack Query with automatic 5-minute background polling
  const {
    data: newsData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['news', 'all', region],
    queryFn: () => getNews({ category: 'all', country: region, limit: 70 }),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 4 * 60 * 1000,
  });

  const articles = newsData?.data || [];

  useEffect(() => {
    document.title = 'Chronicle Global | Real-Time News Aggregator';
  }, []);

  // Check for new stories on background refetch
  useEffect(() => {
    if (articles.length > 0) {
      const currentLeadId = articles[0].id;
      if (previousLeadId && currentLeadId !== previousLeadId) {
        setNewArticlesCount(prev => prev + 1);
      }
      setPreviousLeadId(currentLeadId);
    }
  }, [articles, previousLeadId]);

  const handleShowNewStories = () => {
    setNewArticlesCount(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    refetch();
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        <HeroSkeleton />
        <GridSkeleton count={6} />
      </div>
    );
  }

  if (isError || articles.length === 0) {
    const errorMsg = error instanceof Error ? error.message : undefined;
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <EmptyState
          title={errorMsg?.includes('VITE_API_BASE_URL') ? 'Configuration Required' : 'Could not load latest stories'}
          description={
            errorMsg ||
            'We encountered an issue fetching reports from our external news network. Please click below to retry.'
          }
          actionText={isFetching ? 'Connecting...' : 'Retry Connection'}
          onAction={() => refetch()}
        />
      </div>
    );
  }

  // 1. Lead Featured Hero Story
  const leadArticle = articles[0];

  // 2. Secondary Top Stories (next 3)
  const secondaryStories = articles.slice(1, 4);

  // 3. Key Developments / Trending Column (next 4)
  const trendingColumn = articles.slice(4, 8);

  // 4. Category-Specific Stories filtered from genuine aggregated feed
  const worldStories = articles.filter(a => a.category === 'world' || a.category === 'politics').slice(0, 4);
  const indiaStories = articles.filter(a => a.category === 'india').slice(0, 4);
  const businessStories = articles.filter(a => a.category === 'business' || a.category === 'finance').slice(0, 3);
  const techStories = articles.filter(a => a.category === 'technology' || a.category === 'ai' || a.category === 'startups').slice(0, 3);
  const scienceStories = articles.filter(a => a.category === 'science' || a.category === 'space').slice(0, 3);
  const sportsStories = articles.filter(a => a.category === 'sports').slice(0, 3);
  const entertainmentStories = articles.filter(a => a.category === 'entertainment' || a.category === 'gaming').slice(0, 3);
  const healthEnvStories = articles.filter(a => a.category === 'health' || a.category === 'environment').slice(0, 3);

  // 5. Latest News Dispatches (Pagination / Load More)
  const allDispatches = articles.slice(8);
  const currentDispatches = allDispatches.slice(0, visibleDispatchesCount);
  const hasMoreDispatches = visibleDispatchesCount < allDispatches.length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-14">
      {/* Floating notification for incoming fresh stories */}
      <NewStoriesNotification
        count={newArticlesCount}
        onShow={handleShowNewStories}
      />

      {/* Outage / Stale Cache Notice Banner */}
      {(newsData?.isStale || newsData?.isFallback) && (
        <div className="flex items-center justify-between p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <span>
              <strong>Archival Dispatch:</strong> Displaying previously cached verified coverage due to upstream network latency. Automatic synchronization is active.
            </span>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-300 hover:underline flex-shrink-0 ml-4"
          >
            <RefreshCw className={`w-3 h-3 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Retry Sync</span>
          </button>
        </div>
      )}

      {/* 1. Main Editorial Hero & Top Stories Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-10 border-b border-gray-200 dark:border-gray-800">
        {/* Large Left Lead Story */}
        <div className="lg:col-span-8">
          {leadArticle && <FeaturedHeroCard article={leadArticle} />}
        </div>

        {/* Stacked Key Developments on Right */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-5 bg-[#faf8f5] dark:bg-[#111625] p-5 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-gray-200 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-red-600" />
              Key Developments
            </h2>
            <span className="text-[10px] text-gray-400 font-mono">Live Dispatch</span>
          </div>

          <div className="space-y-4">
            {secondaryStories.map((story, idx) => (
              <CompactNewsCard key={story.id} article={story} index={idx} />
            ))}
          </div>

          <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
            <Link
              to="/trending"
              className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
            >
              <span>Explore all trending stories</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 2. World & Global Affairs */}
      {worldStories.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b-2 border-gray-900 dark:border-gray-100">
            <div className="flex items-center gap-2">
              <Globe2 className="w-5 h-5 text-red-600" />
              <h2 className="text-2xl font-editorial font-bold text-gray-950 dark:text-gray-50">
                World & Global Affairs
              </h2>
            </div>
            <Link
              to="/world"
              className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1"
            >
              <span>More Global News</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {worldStories.map(story => (
              <HorizontalNewsCard key={story.id} article={story} />
            ))}
          </div>
        </section>
      )}

      {/* 3. India News In-Depth */}
      {indiaStories.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b-2 border-gray-900 dark:border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-base">🇮🇳</span>
              <h2 className="text-2xl font-editorial font-bold text-gray-950 dark:text-gray-50">
                India Desk & Regional Reports
              </h2>
            </div>
            <Link
              to="/india"
              className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1"
            >
              <span>View India Section</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {indiaStories.map(story => (
              <NewsCard key={story.id} article={story} />
            ))}
          </div>
        </section>
      )}

      {/* 4. Business, Finance & Markets */}
      {businessStories.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b-2 border-gray-900 dark:border-gray-100">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-red-600" />
              <h2 className="text-2xl font-editorial font-bold text-gray-950 dark:text-gray-50">
                Business, Trade & Capital Markets
              </h2>
            </div>
            <Link
              to="/business"
              className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1"
            >
              <span>Full Market Coverage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {businessStories.map(story => (
              <NewsCard key={story.id} article={story} />
            ))}
          </div>
        </section>
      )}

      {/* 5. Technology, AI & Innovation */}
      {techStories.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b-2 border-gray-900 dark:border-gray-100">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-red-600" />
              <h2 className="text-2xl font-editorial font-bold text-gray-950 dark:text-gray-50">
                Technology & Artificial Intelligence
              </h2>
            </div>
            <Link
              to="/technology"
              className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1"
            >
              <span>View Tech & AI</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {techStories.map(story => (
              <NewsCard key={story.id} article={story} />
            ))}
          </div>
        </section>
      )}

      {/* 6. Science, Discovery & Space Exploration */}
      {scienceStories.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b-2 border-gray-900 dark:border-gray-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-red-600" />
              <h2 className="text-2xl font-editorial font-bold text-gray-950 dark:text-gray-50">
                Science & Space Exploration
              </h2>
            </div>
            <Link
              to="/science"
              className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1"
            >
              <span>Explore Science</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {scienceStories.map(story => (
              <NewsCard key={story.id} article={story} />
            ))}
          </div>
        </section>
      )}

      {/* 7. Sports & Championships */}
      {sportsStories.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b-2 border-gray-900 dark:border-gray-100">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-red-600" />
              <h2 className="text-2xl font-editorial font-bold text-gray-950 dark:text-gray-50">
                Sports & Competitions
              </h2>
            </div>
            <Link
              to="/sports"
              className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1"
            >
              <span>More Sports</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sportsStories.map(story => (
              <NewsCard key={story.id} article={story} />
            ))}
          </div>
        </section>
      )}

      {/* 8. Entertainment, Arts & Culture */}
      {entertainmentStories.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b-2 border-gray-900 dark:border-gray-100">
            <div className="flex items-center gap-2">
              <Film className="w-5 h-5 text-red-600" />
              <h2 className="text-2xl font-editorial font-bold text-gray-950 dark:text-gray-50">
                Entertainment & Digital Arts
              </h2>
            </div>
            <Link
              to="/entertainment"
              className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1"
            >
              <span>More Entertainment</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {entertainmentStories.map(story => (
              <NewsCard key={story.id} article={story} />
            ))}
          </div>
        </section>
      )}

      {/* 9. Health, Environment & Climate */}
      {healthEnvStories.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b-2 border-gray-900 dark:border-gray-100">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-red-600" />
              <h2 className="text-2xl font-editorial font-bold text-gray-950 dark:text-gray-50">
                Health, Climate & Living
              </h2>
            </div>
            <Link
              to="/health"
              className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1"
            >
              <span>View Health Desk</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {healthEnvStories.map(story => (
              <NewsCard key={story.id} article={story} />
            ))}
          </div>
        </section>
      )}

      {/* 10. Latest Global Dispatches with Load More */}
      <section className="space-y-6 pt-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between pb-3 border-b-2 border-gray-900 dark:border-gray-100">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-red-600" />
            <h2 className="text-2xl font-editorial font-bold text-gray-950 dark:text-gray-50">
              Latest Continuous Wire
            </h2>
          </div>
          <span className="text-xs text-gray-500 font-mono">
            Displaying {currentDispatches.length} of {allDispatches.length} indexed reports
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentDispatches.map(story => (
            <NewsCard key={story.id} article={story} />
          ))}
        </div>

        {hasMoreDispatches && (
          <div className="flex justify-center pt-8">
            <button
              onClick={() => setVisibleDispatchesCount(prev => prev + 9)}
              className="px-8 py-3 rounded-lg border border-gray-300 dark:border-gray-700 hover:border-gray-900 dark:hover:border-gray-100 text-sm font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-xs"
            >
              Load More Dispatches ({allDispatches.length - currentDispatches.length} remaining)
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
