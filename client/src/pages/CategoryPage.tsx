import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpDown, Filter } from 'lucide-react';
import { getNews } from '../services/api';
import { useRegion } from '../context/RegionContext';
import { NewsCard } from '../components/news/NewsCard';
import { HorizontalNewsCard } from '../components/news/HorizontalNewsCard';
import { GridSkeleton } from '../components/common/SkeletonCard';
import { EmptyState } from '../components/common/EmptyState';

const CATEGORY_META: Record<string, { title: string; desc: string }> = {
  world: { title: 'World News', desc: 'Global geopolitical shifts, international diplomacy, and cross-border developments.' },
  india: { title: 'India News', desc: 'National affairs, economic transformations, governance, and societal updates across India.' },
  politics: { title: 'Politics', desc: 'Policy initiatives, legislative proceedings, electoral dynamics, and governance debates.' },
  business: { title: 'Business & Markets', desc: 'Corporate strategies, trade, industrial developments, and global macroeconomic trends.' },
  technology: { title: 'Technology', desc: 'Software, hardware innovations, digital policy, and cyber infrastructure.' },
  ai: { title: 'Artificial Intelligence', desc: 'Neural architectures, autonomous reasoning, frontier AI research, and ethics.' },
  science: { title: 'Science & Discovery', desc: 'Peer-reviewed research breakthroughs, biology, astrophysics, and applied chemistry.' },
  startups: { title: 'Startups & Venture', desc: 'Founder journeys, early-stage capital, disruptive models, and ecosystem news.' },
  health: { title: 'Health & Medicine', desc: 'Biomedical developments, public health policy, wellness research, and clinical advances.' },
  sports: { title: 'Sports', desc: 'Championship coverage, competitive athletics, fixture analysis, and international leagues.' },
  entertainment: { title: 'Entertainment & Arts', desc: 'Cinema, music, digital media, cultural commentary, and industry reviews.' },
  gaming: { title: 'Gaming & Esports', desc: 'Interactive entertainment, studio releases, industry hardware, and tournament reports.' },
  lifestyle: { title: 'Lifestyle & Culture', desc: 'Modern living, design, culinary culture, fashion, and contemporary trends.' },
  education: { title: 'Education', desc: 'Higher learning, academic initiatives, pedagogy, and student research.' },
  environment: { title: 'Environment & Climate', desc: 'Conservation, climate science, renewable transitions, and biodiversity.' },
  space: { title: 'Space Exploration', desc: 'Orbital missions, planetary astronomy, aerospace engineering, and deep space probes.' },
  finance: { title: 'Finance & Banking', desc: 'Central bank policies, sovereign debt, currency dynamics, and asset markets.' },
  travel: { title: 'Travel & Exploration', desc: 'Destinations, expedition itineraries, cultural geography, and sustainable tourism.' },
  trending: { title: 'Trending Global News', desc: 'The most syndicated and highly covered events across international wires.' },
};

export function CategoryPage() {
  const { category: paramCategory } = useParams<{ category: string }>();
  const location = useLocation();
  const { region } = useRegion();
  const [sortBy, setSortBy] = useState<'latest' | 'trending'>('latest');

  // Derive active category from param or pathname
  const pathSegment = location.pathname.replace(/^\//, '').split('/')[0].toLowerCase();
  const normalizedCategory = (paramCategory || (pathSegment && pathSegment !== 'category' ? pathSegment : 'world')).toLowerCase();

  const meta = CATEGORY_META[normalizedCategory] || {
    title: `${normalizedCategory.charAt(0).toUpperCase() + normalizedCategory.slice(1)} News`,
    desc: `Comprehensive reporting and verified feeds covering ${normalizedCategory}.`,
  };

  useEffect(() => {
    document.title = `${meta.title} | Chronicle Global`;
  }, [meta.title]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['news', 'category', normalizedCategory, region, sortBy],
    queryFn: () =>
      getNews({
        category: normalizedCategory,
        country: region,
        sortBy,
        limit: 30,
      }),
  });

  const articles = data?.data || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Category Header Masthead */}
      <div className="border-b border-gray-200 dark:border-gray-800 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
            Chronicle Section
          </span>
          <h1 className="text-3xl md:text-4xl font-editorial font-bold text-gray-950 dark:text-gray-50 mt-1">
            {meta.title}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 max-w-2xl leading-relaxed">
            {meta.desc}
          </p>
        </div>

        {/* Sort & Filter Controls */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 p-1 bg-white dark:bg-gray-800 text-xs font-medium">
            <button
              onClick={() => setSortBy('latest')}
              className={`px-3 py-1 rounded transition-colors ${
                sortBy === 'latest'
                  ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
              }`}
            >
              Latest
            </button>
            <button
              onClick={() => setSortBy('trending')}
              className={`px-3 py-1 rounded transition-colors ${
                sortBy === 'trending'
                  ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
              }`}
            >
              Most Covered
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <GridSkeleton count={9} />
      ) : isError || articles.length === 0 ? (
        <EmptyState
          type="category"
          title={`No articles found in ${meta.title}`}
          description="Our feeds are actively polling for new dispatches in this category. You may also switch regions to find international stories."
          onAction={() => refetch()}
        />
      ) : (
        <div className="space-y-8">
          {/* Top Featured story if available */}
          {articles.length > 0 && (
            <div className="mb-6">
              <HorizontalNewsCard article={articles[0]} />
            </div>
          )}

          {/* Grid of remaining stories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.slice(1).map(article => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
