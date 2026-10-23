import { Router } from 'express';
import {
  getNewsHandler,
  getLatestNewsHandler,
  getCategoryNewsHandler,
  searchNewsHandler,
  getArticleByIdHandler,
  getTrendingHandler,
  getSourcesHandler,
  getSourcesHealthHandler,
  clearCacheHandler,
  getCacheStatsHandler,
} from '../controllers/newsController.js';

export const newsRouter = Router();

newsRouter.get('/', getNewsHandler);
newsRouter.get('/latest', getLatestNewsHandler);
newsRouter.get('/trending', getTrendingHandler);
newsRouter.get('/search', searchNewsHandler);
newsRouter.get('/sources', getSourcesHandler);
newsRouter.get('/sources/health', getSourcesHealthHandler);
newsRouter.get('/cache/stats', getCacheStatsHandler);
newsRouter.post('/cache/clear', clearCacheHandler);
newsRouter.get('/category/:category', getCategoryNewsHandler);
newsRouter.get('/article/:id', getArticleByIdHandler);
