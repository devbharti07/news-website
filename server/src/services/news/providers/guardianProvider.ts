import axios from 'axios';
import { NewsArticle } from '../../../types/news.js';
import { normalizeRawArticle } from '../normalizer.js';

export async function fetchGuardianNews(category?: string, query?: string): Promise<NewsArticle[]> {
  const apiKey = process.env.GUARDIAN_API_KEY;
  if (!apiKey) return [];

  try {
    const params: Record<string, string> = {
      'api-key': apiKey,
      'show-fields': 'headline,trailText,thumbnail,byline,shortUrl',
      'page-size': '25',
    };

    if (query) {
      params['q'] = query;
    } else if (category && category !== 'all' && category !== 'trending') {
      const sectionMap: Record<string, string> = {
        world: 'world',
        politics: 'politics',
        business: 'business',
        technology: 'technology',
        science: 'science',
        sports: 'sport',
        environment: 'environment',
        education: 'education',
      };
      if (sectionMap[category]) {
        params['section'] = sectionMap[category];
      }
    }

    const res = await axios.get('https://content.guardianapis.com/search', {
      params,
      timeout: 6000,
    });

    const results = res.data?.response?.results || [];
    const articles: NewsArticle[] = [];

    for (const item of results) {
      const normalized = normalizeRawArticle(
        {
          title: item.fields?.headline || item.webTitle,
          description: item.fields?.trailText || '',
          url: item.webUrl,
          imageUrl: item.fields?.thumbnail,
          author: item.fields?.byline,
          publishedAt: item.webPublicationDate,
          categories: [item.sectionName],
        },
        {
          name: 'The Guardian',
          url: 'https://www.theguardian.com',
          category: category || 'world',
          country: 'gb',
        }
      );

      if (normalized) articles.push(normalized);
    }

    return articles;
  } catch (error: any) {
    console.warn(`[Guardian Provider Warning] Error querying Guardian API: ${error?.message || error}`);
    return [];
  }
}
