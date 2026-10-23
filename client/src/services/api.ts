import axios from 'axios';
import { NewsArticle, NewsFilterOptions, NewsResponse } from '../types/news';

/**
 * Resolves the API Base URL cleanly for both local development and production.
 *
 * Rules:
 * 1. Uses import.meta.env.VITE_API_BASE_URL if configured (local or production).
 * 2. Normalizes to avoid duplicate or missing '/api' path segments (e.g. 'https://host' -> 'https://host/api', 'https://host/api/' -> 'https://host/api').
 * 3. In local development (import.meta.env.DEV), falls back to '/api' (proxied by Vite dev server to localhost:5000).
 * 4. In production (import.meta.env.PROD), never silently falls back to localhost. If VITE_API_BASE_URL is missing, raises a clear, descriptive error so the user knows exactly which Vercel environment variable to set.
 */
export function resolveApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL;

  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    let clean = envUrl.trim().replace(/\/+$/, '');
    if (!clean.endsWith('/api')) {
      clean += '/api';
    }
    return clean;
  }

  // Local development mode: relative '/api' proxied by Vite dev server
  if (import.meta.env.DEV) {
    return '/api';
  }

  // Production on localhost or container preview
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return '/api';
  }

  // Production on a deployed host (e.g. Vercel) without VITE_API_BASE_URL set:
  const configErrorMsg =
    'Production backend API is not configured. Please set the VITE_API_BASE_URL environment variable in your Vercel Project Settings (e.g., https://your-backend.onrender.com/api).';
  console.error(`[Chronicle Global Configuration Error] ${configErrorMsg}`);
  throw new Error(configErrorMsg);
}

let cachedBaseUrl: string | null = null;
function getBaseUrl(): string {
  if (!cachedBaseUrl) {
    cachedBaseUrl = resolveApiBaseUrl();
  }
  return cachedBaseUrl;
}

const apiClient = axios.create({
  timeout: 12000,
});

// Axios request interceptor ensuring dynamic resolution of baseURL and clear error surfacing
apiClient.interceptors.request.use(config => {
  try {
    config.baseURL = getBaseUrl();
  } catch (err: any) {
    return Promise.reject(err);
  }
  return config;
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
