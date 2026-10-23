import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { BookmarksProvider } from './context/BookmarksContext';
import { RegionProvider } from './context/RegionContext';
import { Header } from './components/layout/Header';
import { BreakingTicker } from './components/layout/BreakingTicker';
import { Footer } from './components/layout/Footer';
import { OfflineBanner } from './components/common/OfflineBanner';
import { EmptyState } from './components/common/EmptyState';
import { HomePage } from './pages/HomePage';
import { CategoryPage } from './pages/CategoryPage';
import { ArticlePage } from './pages/ArticlePage';
import { BookmarksPage } from './pages/BookmarksPage';
import { SearchPage } from './pages/SearchPage';
import { getTrendingNews, getHealthStatus } from './services/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
      staleTime: 4 * 60 * 1000,
    },
  },
});

function AppContent() {
  const qc = useQueryClient();
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  // Trending stories for breaking ticker
  const { data: trendingArticles = [] } = useQuery({
    queryKey: ['trending'],
    queryFn: getTrendingNews,
    refetchInterval: 5 * 60 * 1000,
  });

  // Health and network status for masthead
  const { data: healthData } = useQuery({
    queryKey: ['health'],
    queryFn: getHealthStatus,
    refetchInterval: 2 * 60 * 1000,
  });

  const handleManualRefresh = async () => {
    setIsManualRefreshing(true);
    await qc.invalidateQueries();
    setTimeout(() => {
      setIsManualRefreshing(false);
    }, 700);
  };

  const feedStatus = {
    isCached: false,
    isStale: false,
    healthyCount: healthData?.providerHealth?.healthySources || 45,
    totalCount: healthData?.providerHealth?.totalSources || 45,
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfcf9] dark:bg-[#0c0f17] text-gray-900 dark:text-gray-100 transition-colors">
      {/* Offline banner notification */}
      <OfflineBanner onReconnect={() => qc.invalidateQueries()} />

      {/* Main Header */}
      <Header
        lastUpdated={healthData?.timestamp}
        isRefreshing={isManualRefreshing}
        onRefresh={handleManualRefresh}
        feedStatus={feedStatus}
      />

      {/* Breaking / Trending Ticker */}
      <BreakingTicker articles={trendingArticles} />

      {/* Main Routed Content */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/article/:id" element={<ArticlePage />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />
          <Route path="/search" element={<SearchPage />} />

          {/* Specific Top Category Routes */}
          <Route path="/world" element={<CategoryPage />} />
          <Route path="/india" element={<CategoryPage />} />
          <Route path="/politics" element={<CategoryPage />} />
          <Route path="/business" element={<CategoryPage />} />
          <Route path="/technology" element={<CategoryPage />} />
          <Route path="/ai" element={<CategoryPage />} />
          <Route path="/science" element={<CategoryPage />} />
          <Route path="/startups" element={<CategoryPage />} />
          <Route path="/health" element={<CategoryPage />} />
          <Route path="/sports" element={<CategoryPage />} />
          <Route path="/entertainment" element={<CategoryPage />} />
          <Route path="/gaming" element={<CategoryPage />} />
          <Route path="/lifestyle" element={<CategoryPage />} />
          <Route path="/education" element={<CategoryPage />} />
          <Route path="/environment" element={<CategoryPage />} />
          <Route path="/space" element={<CategoryPage />} />
          <Route path="/finance" element={<CategoryPage />} />
          <Route path="/travel" element={<CategoryPage />} />
          <Route path="/trending" element={<CategoryPage />} />

          {/* Generic category route parameter */}
          <Route path="/category/:category" element={<CategoryPage />} />

          {/* 404 Fallback */}
          <Route
            path="*"
            element={
              <div className="max-w-4xl mx-auto px-4 py-16">
                <EmptyState
                  title="Page Not Found (404)"
                  description="The news section or article you requested does not exist or has been relocated."
                  actionText="Return to Front Page"
                  actionHref="/"
                />
              </div>
            }
          />
        </Routes>
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BookmarksProvider>
          <RegionProvider>
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </RegionProvider>
        </BookmarksProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
