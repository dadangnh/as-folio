/**
 * Custom sitemap endpoint — generates /sitemap.xml at build time.
 *
 * <lastmod> strategy (SEO best practice: omit rather than fake):
 *   - Blog posts:  data.lastmod (frontmatter) → git commit date → data.date (publish)
 *   - Projects:    git commit date → omit
 *   - Static pages: git commit date of page file → today (homepage only) → omit
 *
 * When git is unavailable (no repo / CI without git history), gitLastmod() returns
 * undefined and each URL falls back gracefully without emitting a stale date.
 *
 * Replaces @astrojs/sitemap which cannot access content-layer dates.
 */

import { spawnSync } from 'node:child_process';

import { site } from '@config/site';
import { buildDate } from '@utils/date';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';

const siteUrl = site.url.replace(/\/$/, '');
const base = (site.base ?? '').replace(/\/$/, '');

function loc(path: string): string {
  return `${siteUrl}${base}${path}`;
}

/**
 * Returns the last git commit date (YYYY-MM-DD) for a file, or undefined
 * when git is unavailable or the file has no commits yet.
 *
 * Uses spawnSync (not exec/execSync) so file paths are passed as arguments,
 * not interpolated into a shell command — no shell injection risk.
 */
function gitLastmod(filePath: string): string | undefined {
  const result = spawnSync('git', ['log', '-1', '--format=%ci', '--', filePath], {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  if (result.status !== 0 || !result.stdout?.trim()) return undefined;
  // Output: "2025-03-20 14:30:00 +0700" → "2025-03-20"
  return result.stdout.trim().split(' ')[0] || undefined;
}

interface UrlEntry {
  url: string;
  lastmod?: string;
  changefreq?: string;
  priority?: number;
}

function urlEntry({ url, lastmod, changefreq, priority }: UrlEntry): string {
  return [
    '  <url>',
    `    <loc>${url}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : '',
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : '',
    priority !== undefined ? `    <priority>${priority.toFixed(1)}</priority>` : '',
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n');
}

export async function GET(_ctx: APIContext): Promise<Response> {
  const [posts, projects] = await Promise.all([
    getCollection('posts', (p) => !p.data.draft && !p.data.hidden),
    getCollection('projects', (p) => !p.data.redirect),
  ]);

  const today = buildDate().toISOString().split('T')[0];

  // Static pages: git date of their source file.
  // Homepage falls back to today (it aggregates live content so build-date is legitimate).
  // Other static pages omit <lastmod> when git is unavailable.
  const staticUrls: UrlEntry[] = [
    {
      url: loc('/'),
      lastmod: gitLastmod('src/pages/index.astro') ?? today,
      changefreq: 'weekly',
      priority: 1.0,
    },
    {
      url: loc('/blog/'),
      lastmod: gitLastmod('src/pages/blog/index.astro'),
      changefreq: 'weekly',
      priority: 0.9,
    },
    {
      url: loc('/publications/'),
      lastmod: gitLastmod('src/pages/publications/index.astro'),
      changefreq: 'monthly',
      priority: 0.8,
    },
    {
      url: loc('/projects/'),
      lastmod: gitLastmod('src/pages/projects/index.astro'),
      changefreq: 'monthly',
      priority: 0.8,
    },
    {
      url: loc('/cv/'),
      lastmod: gitLastmod('src/pages/cv.astro'),
      changefreq: 'monthly',
      priority: 0.7,
    },
    {
      url: loc('/teaching/'),
      lastmod: gitLastmod('src/pages/teaching/index.astro'),
      changefreq: 'monthly',
      priority: 0.6,
    },
    {
      url: loc('/people/'),
      lastmod: gitLastmod('src/pages/people/index.astro'),
      changefreq: 'monthly',
      priority: 0.6,
    },
    {
      url: loc('/books/'),
      lastmod: gitLastmod('src/pages/books.astro'),
      changefreq: 'monthly',
      priority: 0.5,
    },
    {
      url: loc('/repositories/'),
      lastmod: gitLastmod('src/pages/repositories.astro'),
      changefreq: 'monthly',
      priority: 0.5,
    },
  ];

  const postUrls: UrlEntry[] = posts
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
    .map((p) => ({
      url: loc(`/blog/${p.id}/`),
      // Priority: explicit lastmod frontmatter → git commit date → publish date
      lastmod:
        p.data.lastmod?.toISOString().split('T')[0] ??
        (p.filePath ? gitLastmod(p.filePath) : undefined) ??
        p.data.date.toISOString().split('T')[0],
      changefreq: 'monthly',
      priority: 0.7,
    }));

  const projectUrls: UrlEntry[] = projects.map((p) => ({
    url: loc(`/projects/${p.id}/`),
    // Only emit lastmod when git can provide a real date; omit otherwise
    lastmod: p.filePath ? gitLastmod(p.filePath) : undefined,
    changefreq: 'monthly',
    priority: 0.7,
  }));

  const allUrls = [...staticUrls, ...postUrls, ...projectUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(urlEntry).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
