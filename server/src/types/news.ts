export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content?: string;
  imageUrl?: string;
  articleUrl: string;
  sourceName: string;
  sourceUrl?: string;
  author?: string;
  publishedAt: string; // ISO 8601 string
  category: string;
  country?: string;
  language?: string;
  tags?: string[];
  sourceCoverageCount?: number;
  relatedSources?: string[];
}

export type NewsCategory =
  | 'all'
  | 'world'
  | 'india'
  | 'politics'
  | 'business'
  | 'technology'
  | 'science'
  | 'ai'
  | 'startups'
  | 'health'
  | 'sports'
  | 'entertainment'
  | 'gaming'
  | 'lifestyle'
  | 'education'
  | 'environment'
  | 'space'
  | 'finance'
  | 'travel'
  | 'trending';

export type NewsRegion =
  | 'global'
  | 'in'
  | 'us'
  | 'gb'
  | 'eu'
  | 'me'
  | 'asia'
  | 'africa'
  | 'au';

export interface NewsSourceConfig {
  id: string;
  name: string;
  url: string;
  type: 'rss' | 'api';
  category: NewsCategory;
  country?: NewsRegion;
  language: string;
  enabled: boolean;
  logoUrl?: string;
}

export interface ProviderHealth {
  id: string;
  name: string;
  url: string;
  category: string;
  status: 'healthy' | 'degraded' | 'failing';
  lastSuccess?: string;
  lastFailure?: string;
  consecutiveFailures: number;
  lastArticleCount: number;
  lastError?: string;
  latencyMs?: number;
}

export interface NewsQueryOptions {
  category?: string;
  country?: string;
  query?: string;
  source?: string;
  page?: number;
  limit?: number;
  sortBy?: 'latest' | 'relevant' | 'trending';
  forceRefresh?: boolean;
}

export interface NewsResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  lastUpdated: string;
  data: NewsArticle[];
  isCached?: boolean;
  isStale?: boolean;
  isFallback?: boolean;
  message?: string;
  healthSummary?: {
    totalSources: number;
    healthySources: number;
    degradedSources: number;
    failingSources: number;
  };
}
