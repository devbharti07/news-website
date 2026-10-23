import { describe, it, expect } from 'vitest';
import {
  tokenizeTitle,
  calculateJaccardSimilarity,
  deduplicateArticles,
  cleanTitleSuffix,
} from '../services/news/deduplicator.js';
import { normalizeRawArticle, decodeHtmlEntities, stripHtml } from '../services/news/normalizer.js';
import { NewsCache } from '../cache/newsCache.js';
import { NewsArticle } from '../types/news.js';

describe('Normalizer Utility', () => {
  it('decodes HTML entities properly including numeric and hex', () => {
    expect(decodeHtmlEntities('Apple &amp; Microsoft&#8217;s Future')).toBe("Apple & Microsoft’s Future");
    expect(decodeHtmlEntities('&quot;Hello World&quot;')).toBe('"Hello World"');
    expect(decodeHtmlEntities('They&#39;re coming &mdash; watch out')).toBe("They're coming — watch out");
    expect(decodeHtmlEntities('Price: &#x24;100 &copy; 2026')).toBe('Price: $100 © 2026');
  });

  it('strips HTML tags and removes excess whitespace', () => {
    const raw = '<p>Breaking: <strong>Major discovery</strong> reported. <br/>Read more.</p>';
    expect(stripHtml(raw)).toBe('Breaking: Major discovery reported. Read more.');
  });

  it('normalizes raw RSS object into NewsArticle with unique ID', () => {
    const raw = {
      title: 'NASA Discovers Habitable Exoplanet',
      description: 'A telescope spots an earth-like world.',
      link: 'https://nasa.gov/news/123',
      pubDate: '2026-10-05T10:00:00Z',
    };
    const normalized = normalizeRawArticle(raw, {
      name: 'NASA',
      url: 'https://nasa.gov',
      category: 'space',
    });

    expect(normalized).not.toBeNull();
    expect(normalized?.title).toBe('NASA Discovers Habitable Exoplanet');
    expect(normalized?.category).toBe('space');
    expect(normalized?.sourceName).toBe('NASA');
    expect(normalized?.id).toBeDefined();
  });

  it('filters out [Removed] placeholder articles from deleted wire feeds', () => {
    const raw = {
      title: '[Removed]',
      description: '[Removed]',
      link: 'https://news.example.com/removed',
    };
    const normalized = normalizeRawArticle(raw, {
      name: 'News Outlet',
      category: 'world',
    });
    expect(normalized).toBeNull();
  });

  it('generates a clean fallback description if description is empty or missing', () => {
    const raw = {
      title: 'Global Climate Accord Finalized in Geneva',
      link: 'https://un.org/climate-accord',
    };
    const normalized = normalizeRawArticle(raw, {
      name: 'UN News',
      category: 'environment',
    });
    expect(normalized).not.toBeNull();
    expect(normalized?.description).toContain('Global Climate Accord Finalized in Geneva');
    expect(normalized?.description).toContain('UN News');
  });
});

describe('Deduplicator Utility', () => {
  it('cleans source suffix from titles', () => {
    expect(cleanTitleSuffix('SpaceX Launches Starship - The Verge')).toBe('SpaceX Launches Starship');
    expect(cleanTitleSuffix('Markets Rally Amid Tech Gains | Reuters')).toBe('Markets Rally Amid Tech Gains');
    expect(cleanTitleSuffix('Global Summit Ends with Treaty - BBC News')).toBe('Global Summit Ends with Treaty');
  });

  it('calculates Jaccard similarity accurately between token sets', () => {
    const tokensA = tokenizeTitle('SpaceX launches Starship into orbit successfully');
    const tokensB = tokenizeTitle('SpaceX successfully launches Starship rocket into orbit');
    const sim = calculateJaccardSimilarity(tokensA, tokensB);

    expect(sim).toBeGreaterThanOrEqual(0.6);
  });

  it('deduplicates similar stories and merges source coverage', () => {
    const article1: NewsArticle = {
      id: 'art-1',
      title: 'Federal Reserve announces 25 basis point interest rate cut - BBC News',
      description: 'The Federal Reserve has decided to reduce rates by 25 basis points.',
      articleUrl: 'https://bbc.com/news/rate-cut',
      sourceName: 'BBC News',
      publishedAt: new Date().toISOString(),
      category: 'finance',
    };

    const article2: NewsArticle = {
      id: 'art-2',
      title: 'US Fed cuts benchmark interest rates by 25 basis points | Reuters',
      description: 'Central bank enacts interest rate cut to support labor market.',
      articleUrl: 'https://reuters.com/markets/rate-cut-fed',
      sourceName: 'Reuters',
      publishedAt: new Date().toISOString(),
      category: 'finance',
    };

    const article3: NewsArticle = {
      id: 'art-3',
      title: 'James Webb spots distant galaxy at cosmic dawn',
      description: 'Astronomers observe oldest galaxy yet discovered in early universe.',
      articleUrl: 'https://nasa.gov/news/oldest-galaxy',
      sourceName: 'NASA',
      publishedAt: new Date().toISOString(),
      category: 'space',
    };

    const deduped = deduplicateArticles([article1, article2, article3]);

    expect(deduped.length).toBe(2);
    const financeStory = deduped.find(a => a.category === 'finance');
    expect(financeStory).toBeDefined();
    expect(financeStory?.sourceCoverageCount).toBe(2);
    expect(financeStory?.relatedSources).toContain('BBC News');
    expect(financeStory?.relatedSources).toContain('Reuters');
  });

  it('does NOT merge unrelated stories from the same company or entity', () => {
    const storyA: NewsArticle = {
      id: 'apple-1',
      title: 'Apple launches new iPhone with upgraded cameras',
      description: 'Apple introduces the latest generation smartphone at Cupertino event.',
      articleUrl: 'https://theverge.com/apple-iphone',
      sourceName: 'The Verge',
      publishedAt: new Date().toISOString(),
      category: 'technology',
    };

    const storyB: NewsArticle = {
      id: 'apple-2',
      title: 'Apple reports record quarterly revenue driven by services growth',
      description: 'The tech giant beats Wall Street estimates in latest fiscal earnings.',
      articleUrl: 'https://ft.com/apple-earnings',
      sourceName: 'Financial Times',
      publishedAt: new Date().toISOString(),
      category: 'business',
    };

    const deduped = deduplicateArticles([storyA, storyB]);
    expect(deduped.length).toBe(2);
    expect(deduped[0].id).toBe('apple-1');
    expect(deduped[1].id).toBe('apple-2');
  });
});

describe('NewsCache', () => {
  it('stores and retrieves cached items before expiry', () => {
    const cache = new NewsCache(10);
    cache.set('test-key', { count: 42 });

    expect(cache.has('test-key')).toBe(true);
    expect(cache.get<{ count: number }>('test-key')).toEqual({ count: 42 });
  });

  it('returns null on cache miss', () => {
    const cache = new NewsCache(10);
    expect(cache.get('non-existent')).toBeNull();
  });

  it('stores and retrieves individual articles by ID via articleStore', () => {
    const cache = new NewsCache(10);
    const mockArt: NewsArticle = {
      id: 'art-xyz-123',
      title: 'Quantum Advantage Milestone Achieved',
      description: 'Physicists demonstrate scalable coherence.',
      articleUrl: 'https://science.org/quantum',
      sourceName: 'Science',
      publishedAt: new Date().toISOString(),
      category: 'science',
    };

    cache.setArticle(mockArt);
    const retrieved = cache.getArticle('art-xyz-123');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.title).toBe('Quantum Advantage Milestone Achieved');

    // Test non-existent article
    expect(cache.getArticle('art-non-existent')).toBeNull();

    // Test clearing
    cache.clear();
    expect(cache.getArticle('art-xyz-123')).toBeNull();
  });

  it('tracks hits, misses, and hitRate in getStats', () => {
    const cache = new NewsCache(10);
    cache.set('key1', 'val1');

    cache.get('key1'); // hit
    cache.get('key2'); // miss

    const stats = cache.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBe('0.50');
  });

  it('stores and retrieves lastKnownGoodFeed even after regular cache entry expires', () => {
    const cache = new NewsCache(0.001); // 1ms TTL
    const mockArticles: NewsArticle[] = [
      {
        id: 'fallback-1',
        title: 'Emergency Summit Declares International Climate Pact',
        description: 'World leaders ratify agreement in Geneva.',
        articleUrl: 'https://un.org/summit',
        sourceName: 'UN News',
        publishedAt: new Date().toISOString(),
        category: 'world',
      },
    ];

    cache.set('test-feed', mockArticles);
    // Wait slightly for entry to expire from standard TTL
    const now = Date.now();
    while (Date.now() - now < 10) {}

    // Regular get should return null because expired
    expect(cache.get('test-feed')).toBeNull();

    // But lastKnownGoodFeed should still return the real cached articles!
    const lastGood = cache.getLastKnownGoodFeed('test-feed');
    expect(lastGood).not.toBeNull();
    expect(lastGood?.articles.length).toBe(1);
    expect(lastGood?.articles[0].title).toBe('Emergency Summit Declares International Climate Pact');
  });
});

describe('ProviderHealthTracker', () => {
  it('records successful fetch and updates health metrics', async () => {
    const { providerHealthTracker } = await import('../services/news/providerHealth.js');
    providerHealthTracker.recordSuccess('bbc-top', 30, 250);

    const health = providerHealthTracker.getHealth('bbc-top');
    expect(health).toBeDefined();
    expect(health?.status).toBe('healthy');
    expect(health?.lastArticleCount).toBe(30);
    expect(health?.latencyMs).toBe(250);
    expect(health?.consecutiveFailures).toBe(0);
  });

  it('records failures, transitions to degraded and failing on repeated errors', async () => {
    const { providerHealthTracker } = await import('../services/news/providerHealth.js');
    providerHealthTracker.recordFailure('test-failing-source', 'Connection timeout', 5000);
    
    // First failure: degraded
    let health = providerHealthTracker.getHealth('test-failing-source');
    // If not in default list, test with known id
    providerHealthTracker.recordFailure('aljazeera-all', 'HTTP 500 Server Error', 1200);
    health = providerHealthTracker.getHealth('aljazeera-all');
    expect(health?.consecutiveFailures).toBeGreaterThanOrEqual(1);

    // After 3 failures: failing
    providerHealthTracker.recordFailure('aljazeera-all', 'HTTP 500 Server Error', 1200);
    providerHealthTracker.recordFailure('aljazeera-all', 'HTTP 500 Server Error', 1200);
    health = providerHealthTracker.getHealth('aljazeera-all');
    expect(health?.status).toBe('failing');

    // Recovery resets consecutive failures
    providerHealthTracker.recordSuccess('aljazeera-all', 20, 300);
    health = providerHealthTracker.getHealth('aljazeera-all');
    expect(health?.status).toBe('healthy');
    expect(health?.consecutiveFailures).toBe(0);
  });

  it('provides aggregate health summary of all sources', async () => {
    const { providerHealthTracker } = await import('../services/news/providerHealth.js');
    const summary = providerHealthTracker.getSummary();
    expect(summary.totalSources).toBeGreaterThanOrEqual(40);
    expect(summary.healthySources).toBeGreaterThanOrEqual(0);
  });
});
