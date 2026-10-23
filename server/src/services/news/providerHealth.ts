import { ProviderHealth, NewsSourceConfig } from '../../types/news.js';
import { NEWS_SOURCES } from '../../config/sources.js';

class ProviderHealthTracker {
  private healthMap: Map<string, ProviderHealth> = new Map();

  constructor() {
    for (const source of NEWS_SOURCES) {
      this.healthMap.set(source.id, {
        id: source.id,
        name: source.name,
        url: source.url,
        category: source.category,
        status: 'healthy',
        consecutiveFailures: 0,
        lastArticleCount: 0,
      });
    }
  }

  recordSuccess(sourceId: string, articleCount: number, latencyMs: number) {
    const existing = this.healthMap.get(sourceId);
    if (existing) {
      existing.status = 'healthy';
      existing.lastSuccess = new Date().toISOString();
      existing.consecutiveFailures = 0;
      existing.lastArticleCount = articleCount;
      existing.latencyMs = latencyMs;
      existing.lastError = undefined;
    }
  }

  recordFailure(sourceId: string, error: string, latencyMs: number) {
    const existing = this.healthMap.get(sourceId);
    if (existing) {
      existing.consecutiveFailures++;
      existing.lastFailure = new Date().toISOString();
      existing.lastError = error;
      existing.latencyMs = latencyMs;
      existing.status = existing.consecutiveFailures >= 3 ? 'failing' : 'degraded';
    }
  }

  getHealth(sourceId: string): ProviderHealth | undefined {
    return this.healthMap.get(sourceId);
  }

  getAllHealth(): ProviderHealth[] {
    return Array.from(this.healthMap.values());
  }

  getSummary() {
    const all = this.getAllHealth();
    const healthySources = all.filter(s => s.status === 'healthy').length;
    const degradedSources = all.filter(s => s.status === 'degraded').length;
    const failingSources = all.filter(s => s.status === 'failing').length;

    return {
      totalSources: all.length,
      healthySources,
      degradedSources,
      failingSources,
    };
  }
}

export const providerHealthTracker = new ProviderHealthTracker();
