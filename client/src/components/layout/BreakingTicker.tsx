import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Pause, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { NewsArticle } from '../../types/news';

interface BreakingTickerProps {
  articles: NewsArticle[];
}

export function BreakingTicker({ articles }: BreakingTickerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const activeArticles = articles.slice(0, 10);

  useEffect(() => {
    if (activeArticles.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activeArticles.length);
    }, 5500);

    return () => clearInterval(interval);
  }, [activeArticles.length, isPaused]);

  if (activeArticles.length === 0) return null;

  const currentStory = activeArticles[currentIndex] || activeArticles[0];

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + activeArticles.length) % activeArticles.length);
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % activeArticles.length);
  };

  return (
    <div className="bg-red-50/70 dark:bg-[#12101e] border-y border-red-100 dark:border-red-950/60 py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-xs">
        {/* Left Badge */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
          </span>
          <span className="flex items-center gap-1 font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
            <Flame className="w-3.5 h-3.5" />
            Trending
          </span>
          <span className="text-red-200 dark:text-red-900 hidden sm:inline">|</span>
        </div>

        {/* Center Headline */}
        <div className="flex-1 overflow-hidden">
          <Link
            to={`/article/${currentStory.id}`}
            className="block truncate font-medium text-gray-900 dark:text-gray-100 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <span className="font-semibold text-gray-500 dark:text-gray-400 mr-2">
              [{currentStory.sourceName}]
            </span>
            {currentStory.title}
          </Link>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1 flex-shrink-0 text-gray-500 dark:text-gray-400">
          <span className="text-[11px] font-mono mr-1 hidden md:inline">
            {currentIndex + 1}/{activeArticles.length}
          </span>
          <button
            onClick={handlePrev}
            title="Previous story"
            className="p-1 hover:text-gray-900 dark:hover:text-white rounded"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? 'Resume ticker' : 'Pause ticker'}
            className="p-1 hover:text-gray-900 dark:hover:text-white rounded"
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleNext}
            title="Next story"
            className="p-1 hover:text-gray-900 dark:hover:text-white rounded"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
