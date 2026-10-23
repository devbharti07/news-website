import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { newsRouter } from './routes/newsRoutes.js';
import { getTrendingHandler, getSourcesHandler } from './controllers/newsController.js';
import { newsAggregator } from './services/news/newsAggregator.js';
import { providerHealthTracker } from './services/news/providerHealth.js';
import { globalNewsCache } from './cache/newsCache.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const rawFrontendUrls = process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:3000';
const allowedOrigins = rawFrontendUrls
  .split(',')
  .map(u => u.trim().replace(/\/+$/, ''))
  .filter(Boolean);

function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true; // allow server-to-server, health checks, curl
  const normalized = origin.trim().replace(/\/+$/, '');
  if (allowedOrigins.includes(normalized)) return true;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalized)) return true;
  if (/^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/.test(normalized)) return true;
  return false;
}

// 1. Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// 2. CORS
app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        console.warn(`[CORS Blocked] Origin not allowed: ${origin}`);
        callback(new Error(`CORS origin not allowed: ${origin}`));
      }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
  })
);

// 3. Body Parsing
app.use(express.json({ limit: '1mb' }));

// 4. Rate Limiting (180 requests per minute per IP)
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 180,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again in a minute.',
  },
});
app.use('/api', limiter);

// 5. Health Endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    providerHealth: providerHealthTracker.getSummary(),
    cacheStats: globalNewsCache.getStats(),
  });
});

// 6. Mount News Routes
app.use('/api/news', newsRouter);
app.use('/api/trending', getTrendingHandler);
app.use('/api/sources', getSourcesHandler);

// 7. Global 404 Handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// 8. Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Unhandled Server Error]', err);
  res.status(err.status || 500).json({
    success: false,
    message: 'Internal server error occurred',
    error: process.env.NODE_ENV === 'development' ? err?.message : undefined,
  });
});

// Periodic automatic background refresh (every 5 minutes)
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const backgroundRefreshTimer = setInterval(() => {
  console.log('[Background Refresh] Polling fresh stories from external news network...');
  newsAggregator.getNews({ limit: 40, forceRefresh: true }).catch(err => {
    console.warn('[Background Refresh Warning] Scheduled refresh failed:', err?.message || err);
  });
}, REFRESH_INTERVAL_MS);

// Start Server
const server = app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🌐 Chronicle Global News Server running on port ${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📰 API Endpoint: http://localhost:${PORT}/api/news`);
  console.log(`===============================================`);

  // Warm up cache in background immediately on startup
  newsAggregator.getNews({ limit: 35 }).catch(err => {
    console.warn('[Cache Warmup] Initial feed pre-fetch warning:', err?.message || err);
  });
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[FATAL] Port ${PORT} is already in use by another process.`);
    console.error(`Check running processes with Get-NetTCPConnection -LocalPort ${PORT}`);
    process.exit(1);
  } else {
    console.error('[FATAL] Server listener error:', err);
  }
});

// Graceful Shutdown
function handleShutdown() {
  console.log('Shutdown signal received: closing HTTP server and saving cache');
  clearInterval(backgroundRefreshTimer);
  globalNewsCache.saveToDiskSync();
  server.close(() => {
    console.log('HTTP server closed cleanly');
    process.exit(0);
  });
}

process.on('SIGTERM', handleShutdown);
process.on('SIGINT', handleShutdown);
