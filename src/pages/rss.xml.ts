import rss from '@astrojs/rss';
import { site } from '@config/site';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';

export async function GET(context: APIContext) {
  const posts = (await getCollection('posts'))
    .filter((p) => !p.data.hidden && !p.data.draft)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  return rss({
    title: site.blog?.name || site.title,
    description: site.blog?.description || site.description,
    site: context.site ?? site.url,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description ?? '',
      pubDate: post.data.date,
      link: `${site.base}/blog/${post.id}/`,
      categories: [...(post.data.tags ?? []), ...(post.data.categories ?? [])],
      author: site.author.email ? `${site.author.email} (${site.author.name})` : site.author.name,
    })),
    customData: [
      `<language>${site.lang}</language>`,
      site.author.email
        ? `<managingEditor>${site.author.email} (${site.author.name})</managingEditor>`
        : '',
      `<generator>as-folio (Astro)</generator>`,
    ]
      .filter(Boolean)
      .join('\n'),
  });
}
