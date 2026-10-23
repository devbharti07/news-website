import axios from 'axios';
import { NewsArticle, NewsFilterOptions, NewsResponse } from '../types/news';

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 12000,
});

export async function getNews(options: NewsFilterOptions = {}): Promise<NewsResponse> {
  const { category, country, query, source, page = 1, limit = 25, sortBy = 'latest', forceRefresh } = options;

  const params: Record<string, any> = { page, limit, sortBy };
  if (category && category !== 'all') params.category = category;
  if (country && country !== 'global') params.country = country;
  if (query) params.q = query;
  if (source) params.source = source;
  if (forceRefresh) params.forceRefresh = 'true';

  const response = await apiClient.get<NewsResponse>('/news', { params });
  return response.data;
}

export async function getTrendingNews(): Promise<NewsArticle[]> {
  const response = await apiClient.get<{ success: boolean; data: NewsArticle[] }>('/trending');
  return response.data.data;
}

export async function getArticleById(id: string): Promise<NewsArticle> {
  const response = await apiClient.get<{ success: boolean; data: NewsArticle }>(`/news/article/${id}`);
  return response.data.data;
}

export async function searchNews(query: string, options: Partial<NewsFilterOptions> = {}): Promise<NewsResponse> {
  const params: Record<string, any> = { q: query, ...options };
  const response = await apiClient.get<NewsResponse>('/news/search', { params });
  return response.data;
}

export async function getSources() {
  const response = await apiClient.get('/sources');
  return response.data;
}

export async function getHealthStatus() {
  const response = await apiClient.get('/health');
  return response.data;
}

export async function clearServerCache() {
  const response = await apiClient.post('/news/cache/clear');
  return response.data;
}
