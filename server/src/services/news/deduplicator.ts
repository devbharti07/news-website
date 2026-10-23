import { NewsArticle } from '../../types/news.js';

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'in', 'on', 'at', 'for', 'to', 'of', 'with', 'by', 'from',
  'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'as', 'that', 'this', 'these',
  'those', 'it', 'its', 'says', 'said', 'after', 'over', 'into', 'about'
]);

/**
 * Strips source attribution branding from the end of news titles
 * e.g., "SpaceX Launches Starship - The Verge" -> "SpaceX Launches Starship"
 */
export function cleanTitleSuffix(title: string): string {
  return title
    .replace(/\s*[-–—|:]\s*([A-Za-z0-9\s&.]+)(news|post|times|verge|reuters|bbc|cnn|guardian|express|hindu|al jazeera|bloomberg|cnbc)?$/i, '')
    .trim();
}

/**
 * Simple English stemmer for news headlines
 */
function stemWord(word: string): string {
  if (word.length <= 3) return word;
  
  // Don't strip 's' from words ending in ss, is, us
  if (word.endsWith('ss') || word.endsWith('is') || word.endsWith('us')) {
    return word;
  }

  return word
    .replace(/(?:ing|edly|ingly)$/, '')
    .replace(/(?:ed|ly)$/, '')
    .replace(/s$/, '');
}

/**
 * Normalizes title into a clean set of meaningful stemmed word tokens
 */
export function tokenizeTitle(title: string): Set<string> {
  const cleaned = cleanTitleSuffix(title)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = cleaned
    .split(' ')
    .filter(w => w.length > 2 && !STOP_WORDS.has(w))
    .map(w => stemWord(w));

  return new Set(words);
}

/**
 * Calculates similarity between two token sets using Sørensen–Dice coefficient: 2 * |A ∩ B| / (|A| + |B|)
 * Ideal for short texts like news headlines.
 */
export function calculateJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersectionCount = 0;
  for (const item of setA) {
    if (setB.has(item)) {
      intersectionCount++;
    }
  }

  return (2 * intersectionCount) / (setA.size + setB.size);
}

/**
 * Deduplicates a list of articles, merging duplicate reports into coverage count and related sources
 */
export function deduplicateArticles(articles: NewsArticle[], similarityThreshold = 0.45): NewsArticle[] {
  const result: NewsArticle[] = [];
  const tokenCache: Map<string, Set<string>> = new Map();
  const seenUrls = new Set<string>();

  for (const article of articles) {
    // 1. Direct URL duplicate check
    const normalizedUrl = article.articleUrl.split('?')[0].replace(/\/+$/, '');
    if (seenUrls.has(normalizedUrl)) {
      continue;
    }

    const currentTokens = tokenizeTitle(article.title);
    tokenCache.set(article.id, currentTokens);

    let isDuplicate = false;

    for (const existing of result) {
      // Check timestamp proximity (within 48 hours)
      const timeDiffMs = Math.abs(
        new Date(article.publishedAt).getTime() - new Date(existing.publishedAt).getTime()
      );
      const isWithin48h = isNaN(timeDiffMs) || timeDiffMs < 48 * 3600 * 1000;

      if (!isWithin48h) continue;

      const existingTokens = tokenCache.get(existing.id) || tokenizeTitle(existing.title);
      const similarity = calculateJaccardSimilarity(currentTokens, existingTokens);

      if (similarity >= similarityThreshold) {
        isDuplicate = true;

        // Merge sources
        const sources = new Set(existing.relatedSources || [existing.sourceName]);
        sources.add(article.sourceName);
        existing.relatedSources = Array.from(sources);
        existing.sourceCoverageCount = existing.relatedSources.length;

        // Upgrade image if existing had none
        if (!existing.imageUrl && article.imageUrl) {
          existing.imageUrl = article.imageUrl;
        }

        // Upgrade description if existing is very short
        if ((!existing.description || existing.description.length < 50) && article.description && article.description.length > 50) {
          existing.description = article.description;
        }

        break;
      }
    }

    if (!isDuplicate) {
      seenUrls.add(normalizedUrl);
      result.push({
        ...article,
        sourceCoverageCount: article.sourceCoverageCount || 1,
        relatedSources: article.relatedSources || [article.sourceName],
      });
    }
  }

  return result;
}
