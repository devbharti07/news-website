import axios from 'axios';
import { NewsArticle } from '../../../types/news.js';
import { normalizeRawArticle } from '../normalizer.js';

export async function fetchNewsApi(category?: string, query?: string, country?: string): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return [];

  try {
    const isSearch = Boolean(query);
    const endpoint = isSearch
      ? 'https://newsapi.org/v2/everything'
      : 'https://newsapi.org/v2/top-headlines';

    const params: Record<string, string> = {
      apiKey,
      pageSize: '25',
    };

    if (query) {
      params['q'] = query;
    } else {
      if (category && category !== 'all' && category !== 'trending') {
        const catMap: Record<string, string> = {
          business: 'business',
          technology: 'technology',
          science: 'science',
          health: 'health',
          sports: 'sports',
          entertainment: 'entertainment',
        };
        if (catMap[category]) params['category'] = catMap[category];
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
          imageUrl: item.urlToImage,
          author: item.author,
          publishedAt: item.publishedAt,
          source: item.source,
        },
        {
          name: item.source?.name || 'NewsAPI',
          url: item.url,
          category: category || 'general',
          country: country || 'global',
        }
      );

      if (normalized) articles.push(normalized);
    }

    return articles;
  } catch (error: any) {
    console.warn(`[NewsAPI Provider Warning] Error querying NewsAPI: ${error?.message || error}`);
    return [];
  }
}
