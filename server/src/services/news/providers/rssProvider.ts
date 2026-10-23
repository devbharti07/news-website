import Parser from 'rss-parser';
import { NewsArticle, NewsSourceConfig } from '../../../types/news.js';
import { normalizeRawArticle } from '../normalizer.js';
import { providerHealthTracker } from '../providerHealth.js';

const parser = new Parser({
  timeout: 6000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 GlobalNewsAggregator/1.0',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  },
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['content:encoded', 'contentEncoded'],
      ['dc:creator', 'creator'],
      ['enclosure', 'enclosure'],
    ],
  },
});

export async function fetchRssFeed(source: NewsSourceConfig): Promise<NewsArticle[]> {
  const startTime = Date.now();
  try {
    const feed = await parser.parseURL(source.url);
    const latency = Date.now() - startTime;

    if (!feed.items || feed.items.length === 0) {
      providerHealthTracker.recordSuccess(source.id, 0, latency);
      return [];
    }

    const articles: NewsArticle[] = [];
    for (const item of feed.items) {
      const normalized = normalizeRawArticle(item, {
        name: source.name,
        url: source.url,
        category: source.category,
        country: source.country,
      });

      if (normalized) {
        articles.push(normalized);
      }
    }

    providerHealthTracker.recordSuccess(source.id, articles.length, latency);
    return articles;
  } catch (error: any) {
    const latency = Date.now() - startTime;
    const msg = error?.message || String(error);
    providerHealthTracker.recordFailure(source.id, msg, latency);
    console.warn(`[RSS Provider Warning] Failed feed "${source.name}" (${source.url}): ${msg}`);
    return [];
  }
}
