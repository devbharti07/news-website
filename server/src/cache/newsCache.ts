import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { NewsArticle } from '../types/news.js';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  createdAt: number;
}

export class NewsCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private articleStore: Map<string, NewsArticle> = new Map();
  private lastKnownGoodFeeds: Map<string, { articles: NewsArticle[]; savedAt: number }> = new Map();
  private defaultTTLMs: number;
  private maxCacheSize: number = 300;
  private hits: number = 0;
  private misses: number = 0;
  private diskFilePath: string;
  private saveDebounceTimer: NodeJS.Timeout | null = null;

  constructor(defaultTTLSeconds: number = 300) {
    this.defaultTTLMs = defaultTTLSeconds * 1000;

    // Resolve data directory relative to server
    try {
      const currentDir = path.dirname(fileURLToPath(import.meta.url));
      const dataDir = path.resolve(currentDir, '../../data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      this.diskFilePath = path.join(dataDir, 'news-cache.json');
      this.loadFromDisk();
    } catch {
      this.diskFilePath = path.resolve(process.cwd(), 'data/news-cache.json');
    }
  }

  /**
   * Load persisted cache from disk on startup
   */
  private loadFromDisk(): void {
    try {
      if (!fs.existsSync(this.diskFilePath)) return;
      const raw = fs.readFileSync(this.diskFilePath, 'utf8');
      if (!raw.trim()) return;

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.articles)) {
        for (const art of parsed.articles) {
          if (art && art.id) {
            this.articleStore.set(art.id, art);
          }
        }
      }

      if (parsed.feeds && typeof parsed.feeds === 'object') {
        for (const [key, value] of Object.entries(parsed.feeds)) {
          if (value && Array.isArray((value as any).articles)) {
            this.lastKnownGoodFeeds.set(key, {
              articles: (value as any).articles,
              savedAt: (value as any).savedAt || Date.now(),
            });
            // Also populate memory cache with a grace period
            this.cache.set(key, {
              data: (value as any).articles,
              expiresAt: Date.now() + 60 * 1000, // 1 min initial grace period
              createdAt: (value as any).savedAt || Date.now(),
            });
          }
        }
      }

      console.log(`[NewsCache] Loaded ${this.articleStore.size} articles and ${this.lastKnownGoodFeeds.size} feeds from persistent disk cache.`);
    } catch (err: any) {
      console.warn('[NewsCache] Could not load disk cache:', err?.message || err);
    }
  }

  /**
   * Debounced save to persistent disk cache
   */
  public triggerDiskSave(): void {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }

    this.saveDebounceTimer = setTimeout(() => {
      this.saveToDiskSync();
    }, 1500);
  }

  public saveToDiskSync(): void {
    try {
      const articlesArray = Array.from(this.articleStore.values()).slice(0, 1000);
      const feedsObj: Record<string, any> = {};
      for (const [k, v] of this.lastKnownGoodFeeds.entries()) {
        feedsObj[k] = {
          articles: v.articles.slice(0, 100),
          savedAt: v.savedAt,
        };
      }

      const dir = path.dirname(this.diskFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const payload = JSON.stringify({
        savedAt: new Date().toISOString(),
        totalArticles: articlesArray.length,
        articles: articlesArray,
        feeds: feedsObj,
      });

      fs.writeFileSync(this.diskFilePath, payload, 'utf8');
    } catch (err: any) {
      console.warn('[NewsCache] Failed to write persistent disk cache:', err?.message || err);
    }
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.data;
  }

  set<T>(key: string, data: T, ttlSeconds?: number): void {
    if (this.cache.size >= this.maxCacheSize) {
      this.pruneExpired();
      if (this.cache.size >= this.maxCacheSize) {
        const oldestKey = this.cache.keys().next().value;
        if (oldestKey) this.cache.delete(oldestKey);
      }
    }

    const ttlMs = ttlSeconds ? ttlSeconds * 1000 : this.defaultTTLMs;
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
      createdAt: Date.now(),
    });

    if (Array.isArray(data) && data.length > 0 && typeof data[0]?.id === 'string') {
      this.setLastKnownGoodFeed(key, data as unknown as NewsArticle[]);
    }
  }

  /**
   * Stores a feed as "last known good", which can be served as stale fallback during outages
   */
  setLastKnownGoodFeed(key: string, articles: NewsArticle[]): void {
    if (articles && articles.length > 0) {
      this.lastKnownGoodFeeds.set(key, {
        articles,
        savedAt: Date.now(),
      });
      this.triggerDiskSave();
    }
  }

  /**
   * Retrieves the last known good feed even if the main cache entry expired
   */
  getLastKnownGoodFeed(key: string): { articles: NewsArticle[]; savedAt: number } | null {
    const found = this.lastKnownGoodFeeds.get(key);
    if (found && found.articles.length > 0) {
      return found;
    }

    // Fallback: check broadest "news:all:global:::"
    const broad = this.lastKnownGoodFeeds.get('news:all:global:::latest');
    if (broad && broad.articles.length > 0) {
      return broad;
    }

    return null;
  }

  pruneExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  setArticle(article: NewsArticle): void {
    if (article && article.id) {
      if (this.articleStore.size > 2000) {
        const firstKey = this.articleStore.keys().next().value;
        if (firstKey) this.articleStore.delete(firstKey);
      }
      this.articleStore.set(article.id, article);
    }
  }

  getArticle(id: string): NewsArticle | null {
    return this.articleStore.get(id) || null;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.articleStore.clear();
    this.lastKnownGoodFeeds.clear();
    this.hits = 0;
    this.misses = 0;
    try {
      if (fs.existsSync(this.diskFilePath)) {
        fs.unlinkSync(this.diskFilePath);
      }
    } catch {}
  }

  getStats() {
    this.pruneExpired();
    return {
      size: this.cache.size,
      articlesStored: this.articleStore.size,
      lastKnownGoodFeeds: this.lastKnownGoodFeeds.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits + this.misses > 0 ? (this.hits / (this.hits + this.misses)).toFixed(2) : '0.00',
    };
  }
}

export const globalNewsCache = new NewsCache(
  parseInt(process.env.CACHE_TTL || '300', 10)
);
