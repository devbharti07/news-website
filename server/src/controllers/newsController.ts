import { Request, Response } from 'express';
import { newsAggregator } from '../services/news/newsAggregator.js';
import { globalNewsCache } from '../cache/newsCache.js';
import { providerHealthTracker } from '../services/news/providerHealth.js';

export async function getNewsHandler(req: Request, res: Response) {
  try {
    const { category, country, q, query, source, page, limit, sortBy, forceRefresh } = req.query;

    const result = await newsAggregator.getNews({
      category: typeof category === 'string' ? category : undefined,
      country: typeof country === 'string' ? country : undefined,
      query: typeof (q || query) === 'string' ? String(q || query) : undefined,
      source: typeof source === 'string' ? source : undefined,
      page: page ? parseInt(String(page), 10) : 1,
      limit: limit ? parseInt(String(limit), 10) : 25,
      sortBy: sortBy === 'trending' || sortBy === 'relevant' ? sortBy : 'latest',
      forceRefresh: forceRefresh === 'true',
    });

    // If query has no articles and no cache was found, return 503 unless it was an explicit search filter
    if (result.total === 0 && !result.success && !q && !query) {
      res.status(503).json(result);
      return;
    }

    res.json(result);
  } catch (error: any) {
    console.error('[News Controller Error]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve news articles',
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined,
    });
  }
}

export async function getLatestNewsHandler(req: Request, res: Response) {
  try {
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 25;
    const result = await newsAggregator.getNews({ limit, sortBy: 'latest' });
    res.json(result);
  } catch (error: any) {
    console.error('[Latest News Controller Error]', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve latest news' });
  }
}

export async function getCategoryNewsHandler(req: Request, res: Response) {
  try {
    const category = typeof req.params.category === 'string' ? req.params.category : String(req.params.category || '');
    const { country, page, limit, sortBy, forceRefresh } = req.query;

    const result = await newsAggregator.getNews({
      category,
      country: typeof country === 'string' ? country : undefined,
      page: page ? parseInt(String(page), 10) : 1,
      limit: limit ? parseInt(String(limit), 10) : 25,
      sortBy: sortBy === 'trending' ? 'trending' : 'latest',
      forceRefresh: forceRefresh === 'true',
    });

    res.json(result);
  } catch (error: any) {
    console.error('[Category News Error]', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve category news' });
  }
}

export async function searchNewsHandler(req: Request, res: Response) {
  try {
    const query = req.query.q || req.query.query;
    if (!query || typeof query !== 'string' || !query.trim()) {
      res.status(400).json({ success: false, message: 'Query parameter "q" is required' });
      return;
    }

    const { category, source, page, limit } = req.query;

    const result = await newsAggregator.getNews({
      query: String(query),
      category: typeof category === 'string' ? category : undefined,
      source: typeof source === 'string' ? source : undefined,
      page: page ? parseInt(String(page), 10) : 1,
      limit: limit ? parseInt(String(limit), 10) : 25,
      sortBy: 'latest',
    });

    res.json(result);
  } catch (error: any) {
    console.error('[Search News Error]', error);
    res.status(500).json({ success: false, message: 'Search query failed' });
  }
}

export async function getArticleByIdHandler(req: Request, res: Response) {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : String(req.params.id || '');
    const article = await newsAggregator.getArticleById(id);

    if (!article) {
      res.status(404).json({ success: false, message: 'Article not found' });
      return;
    }

    res.json({ success: true, data: article });
  } catch (error: any) {
    console.error('[Article Details Error]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch article details' });
  }
}

export async function getTrendingHandler(_req: Request, res: Response) {
  try {
    const articles = await newsAggregator.getTrendingNews();
    res.json({
      success: true,
      total: articles.length,
      lastUpdated: new Date().toISOString(),
      data: articles,
    });
  } catch (error: any) {
    console.error('[Trending News Error]', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve trending news' });
  }
}

export async function getSourcesHandler(_req: Request, res: Response) {
  try {
    const sources = newsAggregator.getSources();
    res.json({
      success: true,
      count: sources.length,
      healthSummary: providerHealthTracker.getSummary(),
      data: sources,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve sources' });
  }
}

export async function getSourcesHealthHandler(_req: Request, res: Response) {
  try {
    const health = providerHealthTracker.getAllHealth();
    res.json({
      success: true,
      summary: providerHealthTracker.getSummary(),
      providers: health,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve health' });
  }
}

export async function clearCacheHandler(_req: Request, res: Response) {
  try {
    globalNewsCache.clear();
    res.json({ success: true, message: 'News cache cleared successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to clear cache' });
  }
}

export async function getCacheStatsHandler(_req: Request, res: Response) {
  res.json({ success: true, stats: globalNewsCache.getStats() });
}
