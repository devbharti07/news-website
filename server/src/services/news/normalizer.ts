import crypto from 'crypto';
import { NewsArticle } from '../../types/news.js';

/**
 * Decodes all HTML entities (named, numeric, hex) into readable UTF-8 text
 */
export function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&#(\d+);/g, (_, dec) => {
      try {
        return String.fromCharCode(Number(dec));
      } catch {
        return '';
      }
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      try {
        return String.fromCharCode(parseInt(hex, 16));
      } catch {
        return '';
      }
    })
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&rsquo;/g, '’')
    .replace(/&lsquo;/g, '‘')
    .replace(/&rdquo;/g, '”')
    .replace(/&ldquo;/g, '“')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&hellip;/g, '…')
    .replace(/&trade;/g, '™')
    .replace(/&copy;/g, '©')
    .replace(/&reg;/g, '®')
    .replace(/&#8217;/g, '’')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8230;/g, '…');
}

/**
 * Strips HTML tags and excessive whitespace
 */
export function stripHtml(html: string): string {
  if (!html) return '';
  const text = html.replace(/<[^>]*>/g, ' ');
  return decodeHtmlEntities(text).replace(/\s+/g, ' ').trim();
}

/**
 * Extracts image URL from various RSS feed formats
 */
export function extractImageUrl(item: any): string | undefined {
  // 1. Enclosure
  if (item.enclosure?.url && typeof item.enclosure.url === 'string') {
    const url = item.enclosure.url;
    if (url.match(/\.(jpeg|jpg|gif|png|webp|avif)/i) || item.enclosure.type?.startsWith('image/')) {
      return url;
    }
  }

  // 2. Media content (media:content or mediaContent or media.content or media:group)
  const mediaContent = item.mediaContent || item['media:content'] || item.media?.content || item['media:group']?.['media:content'];
  if (mediaContent) {
    if (Array.isArray(mediaContent) && mediaContent.length > 0) {
      const best = mediaContent.find((m: any) => m.$?.url || m.url) || mediaContent[0];
      if (best?.$?.url) return best.$.url;
      if (best?.url) return best.url;
      if (typeof best === 'string') return best;
    } else if (mediaContent.$?.url) {
      return mediaContent.$.url;
    } else if (mediaContent.url) {
      return mediaContent.url;
    } else if (typeof mediaContent === 'string') {
      return mediaContent;
    }
  }

  // 3. Media thumbnail (media:thumbnail or mediaThumbnail or media.thumbnail)
  const mediaThumbnail = item.mediaThumbnail || item['media:thumbnail'] || item.media?.thumbnail || item['media:group']?.['media:thumbnail'];
  if (mediaThumbnail) {
    if (Array.isArray(mediaThumbnail) && mediaThumbnail.length > 0) {
      const best = mediaThumbnail[0];
      if (best?.$?.url) return best.$.url;
      if (best?.url) return best.url;
      if (typeof best === 'string') return best;
    } else if (mediaThumbnail.$?.url) {
      return mediaThumbnail.$.url;
    } else if (mediaThumbnail.url) {
      return mediaThumbnail.url;
    } else if (typeof mediaThumbnail === 'string') {
      return mediaThumbnail;
    }
  }

  // 4. Inline img tag in content, contentEncoded, or description
  const contentToSearch = `${item.contentEncoded || ''} ${item['content:encoded'] || ''} ${item.content || ''} ${item.description || ''} ${item.summary || ''}`;
  const imgMatch = contentToSearch.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch && imgMatch[1]) {
    const src = imgMatch[1];
    // Filter out tracking pixels / tiny icons
    if (!src.includes('feedburner') && !src.includes('doubleclick') && !src.includes('pixel') && !src.includes('1x1')) {
      return src;
    }
  }

  return undefined;
}

/**
 * Creates a unique deterministic hash ID
 */
export function generateArticleId(title: string, sourceName: string, publishedAt: string): string {
  const seed = `${sourceName}-${title.trim().toLowerCase()}-${publishedAt.slice(0, 10)}`;
  return crypto.createHash('md5').update(seed).digest('hex').slice(0, 16);
}

/**
 * Normalizes an arbitrary item from RSS or API into a strict NewsArticle
 */
export function normalizeRawArticle(
  raw: any,
  defaultSource: { name: string; url?: string; category: string; country?: string }
): NewsArticle | null {
  try {
    const rawTitle = raw.title || raw.headline || '';
    const cleanTitle = stripHtml(rawTitle);
    if (!cleanTitle || cleanTitle.length < 5 || cleanTitle.toLowerCase() === '[removed]') return null;

    const sourceName = raw.source?.name || defaultSource.name;
    const rawDesc = raw.description || raw.summary || raw.contentSnippet || raw['content:encoded'] || '';
    let cleanDesc = stripHtml(rawDesc).slice(0, 400);
    if (!cleanDesc || cleanDesc.toLowerCase() === '[removed]' || cleanDesc.length < 10) {
      cleanDesc = `${cleanTitle}. Read the full report at ${sourceName}.`;
    }

    const articleUrl = raw.link || raw.url || raw.articleUrl;
    if (!articleUrl || typeof articleUrl !== 'string' || !articleUrl.startsWith('http')) {
      return null;
    }

    let publishedDate: Date;
    if (raw.pubDate || raw.publishedAt || raw.isoDate || raw.date) {
      const parsed = new Date(raw.pubDate || raw.publishedAt || raw.isoDate || raw.date);
      publishedDate = isNaN(parsed.getTime()) ? new Date() : parsed;
    } else {
      publishedDate = new Date();
    }

    // Guard against future clock drift or epoch reset
    const now = Date.now();
    if (publishedDate.getTime() > now + 3600000 * 24 || publishedDate.getTime() < new Date('2022-01-01').getTime()) {
      publishedDate = new Date();
    }

    const imageUrl = raw.imageUrl || extractImageUrl(raw);

    const rawAuthor = stripHtml(raw.author || raw.creator || raw['dc:creator'] || '');
    const cleanAuthor = rawAuthor && rawAuthor !== 'undefined' && rawAuthor !== 'null' && rawAuthor.length > 2 ? rawAuthor : undefined;

    // Extract tags
    const tags: string[] = [];
    if (Array.isArray(raw.categories)) {
      raw.categories.forEach((cat: any) => {
        if (typeof cat === 'string') {
          const clean = stripHtml(cat);
          if (clean && clean.length < 30 && !tags.includes(clean)) tags.push(clean);
        } else if (cat?._ || cat?.$?.term) {
          const clean = stripHtml(cat._ || cat.$.term);
          if (clean && clean.length < 30 && !tags.includes(clean)) tags.push(clean);
        }
      });
    }

    const category = (raw.category || defaultSource.category || 'general').toLowerCase();
    const country = raw.country || defaultSource.country || 'global';

    return {
      id: generateArticleId(cleanTitle, sourceName, publishedDate.toISOString()),
      title: cleanTitle,
      description: cleanDesc,
      imageUrl,
      articleUrl,
      sourceName,
      sourceUrl: defaultSource.url,
      author: cleanAuthor,
      publishedAt: publishedDate.toISOString(),
      category,
      country,
      language: raw.language || 'en',
      tags: tags.slice(0, 6),
      sourceCoverageCount: 1,
      relatedSources: [sourceName],
    };
  } catch {
    return null;
  }
}
