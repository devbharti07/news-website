import axios from 'axios';
import { NewsArticle } from '../../../types/news.js';
import { normalizeRawArticle } from '../normalizer.js';

export async function fetchMediaStack(category?: string, query?: string, country?: string): Promise<NewsArticle[]> {
  const apiKey = process.env.MEDIASTACK_API_KEY;
  if (!apiKey) return [];

  try {
    const params: Record<string, string> = {
      access_key: apiKey,
      languages: 'en',
      limit: '25',
    };

    if (query) {
      params['keywords'] = query;
    } else {
      if (category && category !== 'all' && category !== 'trending') {
        params['categories'] = category;
      }
      if (country && country !== 'global') {
        params['countries'] = country;
      }
    }

    const res = await axios.get('http://api.mediastack.com/v1/news', { params, timeout: 6000 });
    const rawArticles = res.data?.data || [];
    const articles: NewsArticle[] = [];

    for (const item of rawArticles) {
      const normalized = normalizeRawArticle(
        {
          title: item.title,
          description: item.description,
          url: item.url,
          imageUrl: item.image,
          author: item.author,
          publishedAt: item.published_at,
          source: { name: item.source },
        },
        {
          name: item.source || 'MediaStack',
          url: item.url,
          category: item.category || category || 'general',
          country: item.country || country || 'global',
        }
      );

      if (normalized) articles.push(normalized);
    }

    return articles;
  } catch (error: any) {
    console.warn(`[MediaStack Provider Warning] Error querying MediaStack: ${error?.message || error}`);
    return [];
  }
}
