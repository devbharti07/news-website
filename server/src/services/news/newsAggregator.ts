import { NewsArticle, NewsQueryOptions, NewsResponse } from '../../types/news.js';
import { NEWS_SOURCES } from '../../config/sources.js';
import { globalNewsCache } from '../../cache/newsCache.js';
import { deduplicateArticles } from './deduplicator.js';
import { fetchRssFeed } from './providers/rssProvider.js';
import { fetchGuardianNews } from './providers/guardianProvider.js';
import { fetchNewsApi } from './providers/newsApiProvider.js';
import { fetchGNews } from './providers/gnewsProvider.js';
import { fetchMediaStack } from './providers/mediastackProvider.js';
import { providerHealthTracker } from './providerHealth.js';

export class NewsAggregator {
  // Track in-flight refresh promises to prevent duplicate simultaneous fetches
  private inFlightFetches: Map<string, Promise<NewsArticle[]>> = new Map();

  /**
   * Fetches raw articles across relevant sources and legitimate API providers.
   * Completely avoids fake mock news.
   */
  private async fetchRawArticles(category?: string, country?: string, query?: string): Promise<NewsArticle[]> {
    const fetchKey = `${category || 'all'}:${country || 'global'}:${query || ''}`;
    const existing = this.inFlightFetches.get(fetchKey);
    if (existing) {
      return existing;
    }

    const fetchPromise = (async () => {
      // 1. Filter enabled RSS sources matching category/country
      let relevantSources = NEWS_SOURCES.filter(s => s.enabled);
      if (category && category !== 'all' && category !== 'trending') {
        relevantSources = relevantSources.filter(s => s.category.toLowerCase() === category.toLowerCase());
      }
      if (country && country !== 'global') {
        const countrySpecific = relevantSources.filter(s => s.country === country);
        const globalSources = relevantSources.filter(s => s.country === 'global' || !s.country);
        relevantSources = [...countrySpecific, ...globalSources];
      }

      // Prioritize category-matching feeds when search query is provided
      if (query && (!category || category === 'all')) {
        const qLower = query.toLowerCase();
        const matched = relevantSources.filter(s =>
          s.category.toLowerCase().includes(qLower) ||
          qLower.includes(s.category.toLowerCase()) ||
          s.name.toLowerCase().includes(qLower)
        );
        if (matched.length > 0) {
          const others = relevantSources.filter(s => !matched.includes(s));
          relevantSources = [...matched, ...others];
        }
      }

      // Query top active sources for this slice
      const activeSources = relevantSources.slice(0, 24);

      // 2. Prepare feed promises with individual error isolation
      const feedPromises: Promise<NewsArticle[]>[] = activeSources.map(source => fetchRssFeed(source));

      // 3. Add legitimate API providers if configured
      if (process.env.GUARDIAN_API_KEY) {
        feedPromises.push(fetchGuardianNews(category, query));
      }
      if (process.env.NEWS_API_KEY) {
        feedPromises.push(fetchNewsApi(category, query, country));
      }
      if (process.env.GNEWS_API_KEY) {
        feedPromises.push(fetchGNews(category, query, country));
      }
      if (process.env.MEDIASTACK_API_KEY) {
        feedPromises.push(fetchMediaStack(category, query, country));
      }

      // 4. Fault-tolerant execution using Promise.allSettled
      const results = await Promise.allSettled(feedPromises);
      const aggregated: NewsArticle[] = [];

      for (const res of results) {
        if (res.status === 'fulfilled' && Array.isArray(res.value)) {
          aggregated.push(...res.value);
        }
      }

      return aggregated;
    })();

    this.inFlightFetches.set(fetchKey, fetchPromise);
    try {
      return await fetchPromise;
    } finally {
      this.inFlightFetches.delete(fetchKey);
    }
  }

  /**
   * Main news retrieval query method:
   * 1. Check memory cache (if valid & not forceRefresh)
   * 2. Fetch fresh articles from active sources (isolated via allSettled)
   * 3. Deduplicate, filter, and sort
   * 4. If all external sources fail temporarily, serve last known good cached feed
   * 5. If no cache and no external sources, return clean empty result with accurate status
   */
  async getNews(options: NewsQueryOptions = {}): Promise<NewsResponse> {
    const {
      category = 'all',
      country = 'global',
      query = '',
      source = '',
      page = 1,
      limit = 25,
      sortBy = 'latest',
      forceRefresh = false,
    } = options;

    const cacheKey = `news:${category}:${country}:${query.toLowerCase().trim()}:${source}:${sortBy}`;
    const cachedArticles = !forceRefresh ? globalNewsCache.get<NewsArticle[]>(cacheKey) : null;

    let allArticles: NewsArticle[] = [];
    let isCached = false;
    let isStale = false;
    let isFallback = false;

    if (cachedArticles && cachedArticles.length > 0) {
      allArticles = cachedArticles;
      isCached = true;
    } else {
      // Fetch fresh articles from external publishers
      let raw: NewsArticle[] = [];
      try {
        raw = await this.fetchRawArticles(category, country, query);
      } catch (err: any) {
        console.warn(`[NewsAggregator] External fetch failed for key "${cacheKey}":`, err?.message || err);
      }

      if (raw.length > 0) {
        // Step 1 & 2: Success or partial success with real articles
        const deduplicated = deduplicateArticles(raw);

        // Filter by search query if provided
        let filtered = deduplicated;
        if (query.trim()) {
          const q = query.trim();
          const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const wordRegex = new RegExp(`\\b${escaped}\\b`, 'i');
          const isShort = q.length <= 3;
          const qLower = q.toLowerCase();

          filtered = filtered.filter(a => {
            if (isShort) {
              return (
                wordRegex.test(a.title) ||
                wordRegex.test(a.description) ||
                a.tags?.some(t => wordRegex.test(t)) ||
                a.category.toLowerCase() === qLower
              );
            } else {
              return (
                a.title.toLowerCase().includes(qLower) ||
                a.description.toLowerCase().includes(qLower) ||
                a.tags?.some(t => t.toLowerCase().includes(qLower)) ||
                a.sourceName.toLowerCase().includes(qLower) ||
                a.category.toLowerCase() === qLower
              );
            }
          });

          // Relevance sort for search
          filtered.sort((a, b) => {
            const aTitle = (isShort ? wordRegex.test(a.title) : a.title.toLowerCase().includes(qLower)) ? 2 : 0;
            const bTitle = (isShort ? wordRegex.test(b.title) : b.title.toLowerCase().includes(qLower)) ? 2 : 0;
            if (aTitle !== bTitle) return bTitle - aTitle;
            return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
          });
        }

        // Filter by source
        if (source.trim()) {
          filtered = filtered.filter(a => a.sourceName.toLowerCase() === source.toLowerCase().trim());
        }

        // Filter by category
        if (category && category !== 'all' && category !== 'trending') {
          filtered = filtered.filter(a => a.category.toLowerCase() === category.toLowerCase());
        }

        // Sort stories
        if (sortBy === 'trending') {
          filtered.sort((a, b) => {
            const scoreA = (a.sourceCoverageCount || 1) * 1000 - (Date.now() - new Date(a.publishedAt).getTime()) / 3600000;
            const scoreB = (b.sourceCoverageCount || 1) * 1000 - (Date.now() - new Date(b.publishedAt).getTime()) / 3600000;
            return scoreB - scoreA;
          });
        } else {
          if (country && country !== 'global') {
            filtered.sort((a, b) => {
              const aRegional = a.country === country ? 1 : 0;
              const bRegional = b.country === country ? 1 : 0;
              if (aRegional !== bRegional) return bRegional - aRegional;
              return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
            });
          } else {
            filtered.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
          }
        }

        allArticles = filtered;

        // Cache in memory and trigger disk save
        globalNewsCache.set(cacheKey, allArticles);
        globalNewsCache.setLastKnownGoodFeed(cacheKey, allArticles);
      } else {
        // Step 3: All external sources temporarily failed or returned 0 articles.
        // Fallback to last successfully cached genuine news feed
        const lastGood = globalNewsCache.getLastKnownGoodFeed(cacheKey);
        if (lastGood && lastGood.articles.length > 0) {
          console.warn(`[NewsAggregator] External sources unreachable. Serving ${lastGood.articles.length} cached articles.`);
          allArticles = lastGood.articles;
          isCached = true;
          isStale = true;
          isFallback = true;
        } else {
          // Step 4: No cache exists and all external sources failed.
          // Do NOT fabricate mock news! Return empty genuine result with status message.
          console.warn('[NewsAggregator] No external articles and no cache available.');
          allArticles = [];
        }
      }
    }

    // Register active articles into articleStore for single-article lookup
    for (const art of allArticles) {
      globalNewsCache.setArticle(art);
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedArticles = allArticles.slice(startIndex, startIndex + limit);

    return {
      success: allArticles.length > 0,
      total: allArticles.length,
      page,
      limit,
      lastUpdated: new Date().toISOString(),
      data: paginatedArticles,
      isCached,
      isStale,
      isFallback,
      healthSummary: providerHealthTracker.getSummary(),
      message: allArticles.length === 0 ? 'External news network currently unreachable. Please retry.' : undefined,
    };
  }

  /**
   * Trending stories based on real coverage and freshness
   */
  async getTrendingNews(): Promise<NewsArticle[]> {
    const res = await this.getNews({ category: 'trending', limit: 12, sortBy: 'trending' });
    if (res.data.length > 0) return res.data;

    // Fallback to latest global stories
    const broad = await this.getNews({ limit: 12, sortBy: 'latest' });
    return broad.data;
  }

  /**
   * Single article by ID lookup
   */
  async getArticleById(id: string): Promise<NewsArticle | null> {
    // 1. Direct memory lookup
    const cached = globalNewsCache.getArticle(id);
    if (cached) return cached;

    // 2. Search in broader feed
    const res = await this.getNews({ limit: 80 });
    const found = res.data.find(a => a.id === id);
    if (found) return found;

    return null;
  }

  /**
   * Get list of all available sources with current health status
   */
  getSources() {
    const healthList = providerHealthTracker.getAllHealth();
    const healthMap = new Map(healthList.map(h => [h.id, h]));

    return NEWS_SOURCES.map(s => {
      const h = healthMap.get(s.id);
      return {
        id: s.id,
        name: s.name,
        category: s.category,
        country: s.country,
        type: s.type,
        enabled: s.enabled,
        status: h?.status || 'healthy',
        lastSuccess: h?.lastSuccess,
        lastFailure: h?.lastFailure,
        consecutiveFailures: h?.consecutiveFailures || 0,
        articleCount: h?.lastArticleCount || 0,
        latencyMs: h?.latencyMs,
      };
    });
  }
}

export const newsAggregator = new NewsAggregator();
