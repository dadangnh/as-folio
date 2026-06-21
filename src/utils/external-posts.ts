/**
 * External posts loader for as-folio.
 *
 * Fetches external post sources defined in `site.blog.externalSources` at build time.
 * Supports both RSS feed URLs and manual post lists.
 */

import { site } from '@config/site';

export interface ExternalPost {
  title: string;
  url: string;
  publishedDate: Date;
  description?: string;
  source: string;
  tags: string[];
  categories: string[];
  /** Always true so blog listing can distinguish external from local posts */
  external: true;
}

/**
 * Parse an RSS/Atom feed XML string and return an array of posts.
 * Handles both RSS 2.0 and Atom formats.
 */
function parseRssFeed(
  xml: string,
  sourceName: string,
  tags: string[],
  categories: string[],
): ExternalPost[] {
  const posts: ExternalPost[] = [];

  // Atom feed items (<entry>)
  const isAtom = /<feed\b/.test(xml);
  const itemPattern = isAtom ? /<entry>([\s\S]*?)<\/entry>/g : /<item>([\s\S]*?)<\/item>/g;

  const titleTag = isAtom ? 'title' : 'title';
  const linkTag = isAtom ? 'link' : 'link';
  const dateTag = isAtom ? 'updated' : 'pubDate';
  const descTag = isAtom ? 'summary' : 'description';

  for (const m of xml.matchAll(itemPattern)) {
    const block = m[1];

    const titleMatch = block.match(
      new RegExp(`<${titleTag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${titleTag}>`),
    );
    const title = titleMatch ? titleMatch[1].trim() : '';
    if (!title) continue;

    // <link href="..."> (Atom) or <link>url</link>
    let url: string;
    const linkHrefMatch = block.match(/<link\s+[^>]*href="([^"]+)"/);
    if (linkHrefMatch) {
      url = linkHrefMatch[1];
    } else {
      const linkTextMatch = block.match(
        new RegExp(`<${linkTag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${linkTag}>`),
      );
      url = linkTextMatch ? linkTextMatch[1].trim() : '';
    }
    if (!url) continue;

    const dateMatch = block.match(new RegExp(`<${dateTag}[^>]*>([^<]+)</${dateTag}>`));
    const dateStr = dateMatch ? dateMatch[1].trim() : '';
    const publishedDate = dateStr ? new Date(dateStr) : new Date();

    const descMatch = block.match(
      new RegExp(`<${descTag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${descTag}>`),
    );
    // Strip any HTML tags from description
    const rawDesc = descMatch ? descMatch[1].trim() : '';
    const description = rawDesc ? rawDesc.replace(/<[^>]+>/g, '').slice(0, 200) : undefined;

    posts.push({
      title,
      url,
      publishedDate,
      description,
      source: sourceName,
      tags,
      categories,
      external: true,
    });
  }

  return posts;
}

/**
 * Fetch all external post sources configured in `site.blog.externalSources`.
 * Returns an empty array if no sources are configured.
 * Errors fetching individual sources are silently swallowed (the build should not fail).
 */
export async function fetchExternalPosts(): Promise<ExternalPost[]> {
  const sources = site.blog.externalSources;
  if (!sources || sources.length === 0) return [];

  const results: ExternalPost[] = [];

  for (const src of sources) {
    const tags = src.tags ?? [];
    const categories = src.categories ?? [];

    // Manual post list
    if (src.posts && src.posts.length > 0) {
      for (const p of src.posts) {
        results.push({
          title: src.name,
          url: p.url,
          publishedDate: new Date(p.publishedDate),
          source: src.name,
          tags,
          categories,
          external: true,
        });
      }
    }

    // RSS feed fetch
    if (src.rssUrl) {
      try {
        const res = await fetch(src.rssUrl, {
          signal: AbortSignal.timeout(8000),
          headers: { 'User-Agent': 'as-folio/1.0 RSS reader' },
        });
        if (res.ok) {
          const xml = await res.text();
          const fetched = parseRssFeed(xml, src.name, tags, categories);
          results.push(...fetched);
        }
      } catch {
        // Don't fail the build for unreachable RSS feeds
        console.warn(`[as-folio] Could not fetch external posts from: ${src.rssUrl}`);
      }
    }
  }

  return results;
}
