# Chronicle Global — Production-Quality Global News Aggregator

Chronicle Global is a modern, high-performance news aggregation web application designed with an editorial aesthetic and a resilient multi-provider aggregation backend. Built with React 18, Vite, TypeScript, Tailwind CSS, Express, and TanStack Query, it continuously fetches, normalizes, deduplicates, and caches news from reputable global newsrooms and wire services without algorithmic manipulation or visual clutter.

---

## 📑 Table of Contents

- [Overview & Philosophy](#overview--philosophy)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture & Data Flow](#architecture--data-flow)
- [Project Directory Structure](#project-directory-structure)
- [Supported Categories & Regions](#supported-categories--regions)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [How to Add a News Provider](#how-to-add-a-news-provider)
- [Caching & Rate Limiting System](#caching--rate-limiting-system)
- [Deduplication & Multi-Source Attribution](#deduplication--multi-source-attribution)
- [API Reference](#api-reference)
- [Deployment Guidelines](#deployment-guidelines)
- [Troubleshooting](#troubleshooting)

---

## 🌟 Overview & Philosophy

Most news aggregators fall into two traps: either basic tutorial templates with static cards, or ad-saturated portals with sensationalist metrics. **Chronicle Global** was engineered to feel like a state-of-the-art independent publication:
- **Clean Editorial Hierarchy**: Lead hero dispatch with visual priority, secondary developments, live wire ticker, and topic-specific spotlights.
- **Fair Use & Publisher Attribution**: Full transparency regarding syndication sources, explicit disclaimers, and prominent one-click links to the publisher's original article.
- **Resilient Multi-Feed Ingestion**: RSS parsing with fallback to official APIs (The Guardian, NewsAPI, GNews, MediaStack) using `Promise.allSettled`, guaranteeing that individual source downtime never brings down the platform.

---

## 🚀 Key Features

1. **Multi-Source Aggregation Layer**: Aggregates from BBC, The Guardian, Al Jazeera, Reuters, CNBC, TechCrunch, The Verge, Wired, Ars Technica, NASA, ESPN, Euronews, and more.
2. **19 Curated Categories**:
   - World, India, Politics, Business, Technology, Science, AI, Startups, Health, Sports, Entertainment, Gaming, Lifestyle, Education, Environment, Space, Finance, Travel, Trending.
3. **9 Regional Editions**:
   - Global, India, United States, United Kingdom, Europe, Middle East, Asia-Pacific, Africa, Australia.
4. **Intelligent Deduplication**:
   - Tokenizes and stems headline words, removes stop words and publisher branding suffixes, and calculates Sørensen–Dice similarity to merge duplicate wires into a single story with a *"Covered by X sources"* badge.
5. **Two-Tier In-Memory Cache**:
   - Aggregated feed responses cached for 5 minutes (`CACHE_TTL=300`) to prevent API quota exhaustion and guarantee sub-50ms repeat loads.
   - Dedicated O(1) `articleStore` ensuring detail pages never 404 even if an article is purged from the general homepage slice.
6. **Live Auto-Refresh & Background Polling**:
   - Polls fresh dispatches every 5 minutes in the background.
   - Non-intrusive floating pill (*"X new stories"*) notifying readers without hijacking scroll position.
   - Manual instant refresh button with spin state.
7. **Refined Dark & Light Editorial Themes**:
   - Polished off-white (`#fdfdfc`) paper aesthetic for day mode; rich deep slate (`#0b0f19`) for night mode.
   - Anti-flash head script respecting `prefers-color-scheme` and persisting choice in `localStorage`.
8. **Interactive Reading Vault & Bookmarks**:
   - Save stories for offline research with one click; stored in `localStorage` and ready to migrate to cloud database upon user auth.
9. **Full Article Detail Views**:
   - Direct publisher attribution, author bylines, formatted timestamps, category tags, related coverage, and multi-channel sharing (Native Share, Copy Link, X, WhatsApp, Facebook).
10. **Resilient Offline & Error States**:
    - Network connectivity detection with automatic retry upon reconnection.
    - Skeletons prevent Cumulative Layout Shift (CLS); broken image fallbacks render neutral editorial placeholders.

---

## 🛠 Tech Stack

### Frontend (`client/`)
- **React 18** + **TypeScript**
- **Vite 6** (lightning-fast HMR and optimized production bundling)
- **Tailwind CSS 3** with custom typography utilities and editorial serif pairing (`Newsreader` + `Inter`)
- **React Router 6** (declarative client-side routing)
- **TanStack Query v5** (server-state synchronization, background refetching, and query caching)
- **Lucide React** (modern iconography)
- **Axios** (HTTP client with timeout and base URL configuration)

### Backend (`server/`)
- **Node.js** + **Express 4**
- **TypeScript** + **tsx** (zero-build development execution)
- **rss-parser** (resilient XML/RSS/Atom stream parsing with custom media namespaces)
- **Helmet** (secure HTTP response headers)
- **CORS** (cross-origin resource sharing configuration)
- **express-rate-limit** (protects upstream services from DDoS and abuse)
- **Vitest** (high-speed unit test runner)

---

## 🏗 Architecture & Data Flow

```text
       Browser / Client (React 18 + Vite)
                     │
         [TanStack Query / Cache]
                     │
          GET /api/news (or /search, /category, /trending)
                     │
                     ▼
          Express API Gateway
        ┌──────────────────────────────────────────────────┐
        │  1. Rate Limiting & Helmet Security              │
        │  2. Route Matching & Parameter Sanitization      │
        │  3. Cache Check (NewsCache memory store)        │
        └──────────────────────────────────────────────────┘
                     │ Cache Miss
                     ▼
             News Aggregator
        ┌──────────────────────────────────────────────────┐
        │  Parallel Ingestion (Promise.allSettled)         │
        │  ├── Verified RSS Sources (BBC, Reuters, etc.)   │
        │  ├── The Guardian Open Platform (API Key)        │
        │  ├── NewsAPI (API Key)                           │
        │  ├── GNews / MediaStack (API Keys)               │
        │  └── Mock Fallback (when offline/zero feeds)     │
        └──────────────────────────────────────────────────┘
                     │
                     ▼
          Normalizer Service
        ┌──────────────────────────────────────────────────┐
        │  • Decode HTML entities (&#8217;, &amp;, etc.)   │
        │  • Strip markup & extract media/enclosure URLs   │
        │  • Compute deterministic MD5 article ID          │
        │  • Conform to NewsArticle interface              │
        └──────────────────────────────────────────────────┘
                     │
                     ▼
         Deduplicator Service
        ┌──────────────────────────────────────────────────┐
        │  • Clean publication title suffixes (" - BBC")   │
        │  • Tokenize & stem words (strip stop words)      │
        │  • Sørensen-Dice similarity comparison           │
        │  • Merge related sources into coverage count     │
        └──────────────────────────────────────────────────┘
                     │
                     ▼
            Cache & Return
        ┌──────────────────────────────────────────────────┐
        │  • Save in NewsCache (TTL: 300s)                 │
        │  • Index into articleStore for O(1) resolution   │
        │  • Slice for requested page & limit              │
        │  • Return unified JSON response                  │
        └──────────────────────────────────────────────────┘
```

---

## 📂 Project Directory Structure

```text
news-website/
├── package.json              # Monorepo workspaces definition ("server", "client")
├── README.md
│
├── server/                   # Backend Aggregator & API
│   ├── .env.example          # Environment template
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts          # Express application entry & middleware
│       ├── cache/
│       │   └── newsCache.ts  # In-memory cache & article store
│       ├── config/
│       │   └── sources.ts    # Centralized RSS and provider catalog
│       ├── controllers/
│       │   └── newsController.ts # HTTP handlers
│       ├── routes/
│       │   └── newsRoutes.ts # Express routes
│       ├── services/
│       │   └── news/
│       │       ├── deduplicator.ts   # Headline similarity & merging
│       │       ├── mockNews.ts       # Fallback mock items for offline dev
│       │       ├── newsAggregator.ts # Main aggregation coordinator
│       │       ├── normalizer.ts     # Schema standardization & image parser
│       │       └── providers/
│       │           ├── gnewsProvider.ts
│       │           ├── guardianProvider.ts
│       │           ├── mediastackProvider.ts
│       │           ├── newsApiProvider.ts
│       │           └── rssProvider.ts
│       ├── types/
│       │   └── news.ts       # Backend TypeScript contracts
│       └── __tests__/
│           └── news.test.ts  # Vitest test suite
│
└── client/                   # Frontend React Application
    ├── index.html            # HTML shell with Google Fonts & anti-flash script
    ├── package.json
    ├── tailwind.config.js
    ├── vite.config.ts        # Vite config with /api reverse proxy
    └── src/
        ├── main.tsx          # React DOM root
        ├── App.tsx           # Router, providers & global layout
        ├── index.css         # Tailwind & custom editorial serif styles
        ├── components/
        │   ├── common/
        │   │   ├── EmptyState.tsx
        │   │   ├── ImageWithFallback.tsx
        │   │   ├── NewStoriesNotification.tsx
        │   │   ├── OfflineBanner.tsx
        │   │   ├── ShareModal.tsx
        │   │   ├── SkeletonCard.tsx
        │   │   └── SourceAttribution.tsx
        │   ├── layout/
        │   │   ├── BreakingTicker.tsx
        │   │   ├── Footer.tsx
        │   │   └── Header.tsx
        │   └── news/
        │       ├── CompactNewsCard.tsx
        │       ├── FeaturedHeroCard.tsx
        │       ├── HorizontalNewsCard.tsx
        │       └── NewsCard.tsx
        ├── context/
        │   ├── BookmarksContext.tsx
        │   ├── RegionContext.tsx
        │   └── ThemeContext.tsx
        ├── pages/
        │   ├── ArticlePage.tsx
        │   ├── BookmarksPage.tsx
        │   ├── CategoryPage.tsx
        │   ├── HomePage.tsx
        │   └── SearchPage.tsx
        ├── services/
        │   └── api.ts        # Axios client calls
        └── types/
            └── news.ts       # Frontend TypeScript definitions
```

---

## 🌐 Supported Categories & Regions

### Categories
| Category | Slug | Primary Coverage |
| :--- | :--- | :--- |
| **World** | `/world` | Geopolitical shifts, international diplomacy, global treaties |
| **India** | `/india` | National affairs, economy, governance, infrastructure |
| **Politics** | `/politics` | Electoral processes, legislation, political analysis |
| **Business** | `/business` | Corporate strategies, industry developments, trade |
| **Technology** | `/technology` | Software, silicon, cybersecurity, enterprise computing |
| **AI** | `/ai` | Neural models, robotics, frontier safety, autonomous tech |
| **Startups** | `/startups` | Seed funding, VC rounds, founders, product launches |
| **Science** | `/science` | Peer-reviewed discoveries, astrophysics, genetics |
| **Health** | `/health` | Biomedical breakthroughs, public wellness, clinical research |
| **Sports** | `/sports` | International leagues, fixtures, athletic tournaments |
| **Entertainment** | `/entertainment` | Film, arts, music, studio reviews, streaming media |
| **Gaming** | `/gaming` | Interactive entertainment, consoles, esports, studios |
| **Lifestyle** | `/lifestyle` | Design, culinary culture, fashion, contemporary trends |
| **Education** | `/education` | Higher learning, research institutes, pedagogical policy |
| **Environment** | `/environment` | Conservation, climate science, energy transitions |
| **Space** | `/space` | Planetary astronomy, orbital launches, space probes |
| **Finance** | `/finance` | Global markets, central banks, debt markets, forex |
| **Travel** | `/travel` | Expeditions, destinations, cultural itineraries |
| **Trending** | `/trending` | Highly syndicated global breaking stories |

### Regions
- 🌐 **Global** (`global`)
- 🇮🇳 **India** (`in`)
- 🇺🇸 **United States** (`us`)
- 🇬🇧 **United Kingdom** (`gb`)
- 🇪🇺 **Europe** (`eu`)
- 🌍 **Middle East** (`me`)
- 🌏 **Asia-Pacific** (`asia`)
- 🌍 **Africa** (`africa`)
- 🇦🇺 **Australia** (`au`)

---

## ⚡ Installation & Setup

### Prerequisites
- Node.js (v18.0.0 or higher recommended)
- npm (v9.0.0 or higher)

### 1. Clone & Install Dependencies
From the repository root:
```bash
npm install
```
This automatically installs both `server` and `client` dependencies through npm workspaces.

---

## 🔐 Environment Variables

Create your `.env` in the `server/` directory:
```bash
cp server/.env.example server/.env
```

### Configuration Options
```ini
# Server Port
PORT=5000

# Node Environment
NODE_ENV=development

# Allowed Frontend URL for CORS
FRONTEND_URL=http://localhost:5173

# Server Cache TTL (in seconds, default: 300 = 5 minutes)
CACHE_TTL=300

# Set to true only for offline development testing with zero internet
USE_MOCK_NEWS=false

# Optional External API Keys (Leave blank to use free, legitimate public RSS feeds)
NEWS_API_KEY=
GUARDIAN_API_KEY=
GNEWS_API_KEY=
MEDIASTACK_API_KEY=
```

> **Security Note**: Never commit `.env` containing production credentials. API keys are strictly accessed on the backend server and are never exposed to the browser.

---

## 💻 Running Locally

### Run Both Frontend & Backend Concurrently
```bash
npm run dev
```
- **Backend API**: `http://localhost:5000`
- **Frontend Client**: `http://localhost:5173`

### Run Individually
```bash
# Backend only:
npm run dev:server

# Frontend only:
npm run dev:client
```

### Running Tests
```bash
npm test
```

### Production Build
```bash
npm run build
```

---

## ➕ How to Add a News Provider

Chronicle Global uses a modular provider pattern. Adding a new feed or API provider requires just 2 simple steps:

### Adding an RSS Feed
Open [`server/src/config/sources.ts`](file:///c:/news-website/server/src/config/sources.ts) and append an entry:
```typescript
{
  id: 'newyorker-culture',
  name: 'The New Yorker',
  url: 'https://www.newyorker.com/feed/culture',
  type: 'rss',
  category: 'lifestyle',
  country: 'us',
  language: 'en',
  enabled: true,
}
```

### Adding a Custom API Provider
1. Create `server/src/services/news/providers/myCustomProvider.ts`:
   ```typescript
   import axios from 'axios';
   import { NewsArticle } from '../../../types/news.js';
   import { normalizeRawArticle } from '../normalizer.js';

   export async function fetchMyCustomNews(category?: string, query?: string): Promise<NewsArticle[]> {
     const apiKey = process.env.MY_CUSTOM_API_KEY;
     if (!apiKey) return [];

     try {
       const res = await axios.get('https://api.mycustomnews.com/v1/news', {
         params: { apiKey, category, q: query },
         timeout: 6000,
       });

       return (res.data.items || [])
         .map(item => normalizeRawArticle(item, { name: 'MyProvider', category: category || 'world' }))
         .filter(Boolean) as NewsArticle[];
     } catch (err) {
       console.warn('[MyProvider] Failed to fetch:', err);
       return [];
     }
   }
   ```
2. In [`server/src/services/news/newsAggregator.ts`](file:///c:/news-website/server/src/services/news/newsAggregator.ts), import and include your function in `feedPromises`:
   ```typescript
   if (process.env.MY_CUSTOM_API_KEY) {
     feedPromises.push(fetchMyCustomNews(category, query));
   }
   ```

---

## 🔄 Caching & Rate Limiting System

1. **Cache TTL & Keys**:
   Feed queries are cached for 300 seconds (5 minutes) based on composite query keys:
   `news:{category}:{country}:{query}:{source}:{sortBy}`
2. **LRU-Bounded Article Index**:
   Every article that passes through normalization is indexed into `articleStore: Map<string, NewsArticle>` (capacity: 2,000 items). This ensures readers can navigate to `/article/:id` directly from bookmarks or search results without getting 404 errors.
3. **Cache Invalidation**:
   `POST /api/news/cache/clear` flushes the cache when manual administrative synchronization is needed.
4. **Rate Limiting**:
   Standard limit of 180 requests per minute per IP via `express-rate-limit` prevents spam and upstream feed abuse.

---

## 🔍 Deduplication & Multi-Source Attribution

When multiple newsrooms cover the same breaking event:
1. Suffix stripping removes trailing brand text (e.g. `"- BBC News"`, `"| Reuters"`).
2. Word tokenization strips punctuation, converts to lower case, discards English stop words (`"the"`, `"in"`, `"at"`), and performs suffix stemming (`"launches"` -> `"launch"`).
3. Sørensen-Dice coefficient compares tokens between articles:
   $$\text{Similarity} = \frac{2 \times |A \cap B|}{|A| + |B|}$$
4. If similarity exceeds `0.45` within a 48-hour window, the newer article merges into the existing entry:
   - Increments `sourceCoverageCount`
   - Adds the new outlet to `relatedSources`
   - Keeps the highest quality image and description

---

## 📡 API Reference

| Method | Endpoint | Query Parameters | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | None | Service status, uptime, and version |
| `GET` | `/api/news` | `category`, `country`, `q`, `page`, `limit`, `sortBy` | Primary news retrieval endpoint |
| `GET` | `/api/news/latest` | `limit` | Latest aggregated stories across all topics |
| `GET` | `/api/news/trending` | None | Trending stories for breaking ticker |
| `GET` | `/api/news/category/:category` | `country`, `page`, `limit`, `sortBy` | Category-filtered news stories |
| `GET` | `/api/news/article/:id` | None | Single article details by hash ID |
| `GET` | `/api/news/search` | `q` (required), `category`, `limit` | Debounced news search |
| `GET` | `/api/sources` | None | List of configured news providers |
| `GET` | `/api/news/cache/stats` | None | Cache hits, misses, and hit rate |
| `POST`| `/api/news/cache/clear` | None | Purges current cache |

---

## 🚢 Deployment Guidelines

### 1. Unified Node Host (e.g., Render, Railway, AWS ECS, DigitalOcean)
Build both client and server:
```bash
npm run build
```
Serve the built client static bundle `client/dist` directly through Express or an Nginx reverse proxy.

### 2. Decoupled Hosting (e.g., Vercel + Fly.io / Cloud Run)
- **Frontend (Vercel/Netlify)**: Point root directory to `client/`. Set `VITE_API_BASE_URL` to your production backend URL.
- **Backend (Cloud Run/Fly.io/Render)**: Point to `server/`. Set environment variables in the host dashboard (`PORT=5000`, `NODE_ENV=production`, `FRONTEND_URL=https://your-domain.com`).

---

## ❓ Troubleshooting

| Issue | Root Cause | Solution |
| :--- | :--- | :--- |
| **Empty feed list on first launch** | External RSS feeds temporarily rate-limiting or blocking IP | The aggregator falls back automatically to `MOCK_ARTICLES`. Ensure `USE_MOCK_NEWS=false` in `server/.env` once internet access is confirmed. |
| **Port 5000 in use** | Another local service running on port 5000 | Modify `PORT=5001` in `server/.env` and update the proxy port in `client/vite.config.ts`. |
| **Missing images on some cards** | Certain feeds omit `media:content` or enclosure tags | The UI automatically displays a styled fallback with category branding without layout shift. |
| **CORS errors in browser** | `FRONTEND_URL` in `server/.env` does not match the client host | Update `FRONTEND_URL=http://localhost:5173` or your production domain. |

---

## 📜 License
MIT License. Content aggregated by Chronicle Global remains the intellectual property of their respective publishers under fair use terms.
