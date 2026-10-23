import axios from 'axios';
import { NewsArticle } from '../../../types/news.js';
import { normalizeRawArticle } from '../normalizer.js';

export async function fetchGNews(category?: string, query?: string, country?: string): Promise<NewsArticle[]> {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) return [];

  try {
    const isSearch = Boolean(query);
    const endpoint = isSearch
      ? 'https://gnews.io/api/v4/search'
      : 'https://gnews.io/api/v4/top-headlines';

    const params: Record<string, string> = {
      token: apiKey,
      max: '25',
      lang: 'en',
    };

    if (query) {
      params['q'] = query;
    } else {
      if (category && category !== 'all' && category !== 'trending') {
        params['category'] = category;
      }
      if (country && country !== 'global') {
        params['country'] = country;
      }
    }

    const res = await axios.get(endpoint, { params, timeout: 6000 });
    const rawArticles = res.data?.articles || [];
    const articles: NewsArticle[] = [];

    for (const item of rawArticles) {
      const normalized = normalizeRawArticle(
        {
          title: item.title,
          description: item.description,
          url: item.url,
          imageUrl: item.image,
          publishedAt: item.publishedAt,
          source: item.source,
        },
        {
          name: item.source?.name || 'GNews',
          url: item.source?.url,
          category: category || 'general',
          country: country || 'global',
        }
      );

      if (normalized) articles.push(normalized);
    }

    return articles;
  } catch (error: any) {
    console.warn(`[GNews Provider Warning] Error querying GNews: ${error?.message || error}`);
    return [];
  }
}
