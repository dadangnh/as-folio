// Pinned to 7.2.0 (7.2.1 breaks Shiki in mdx blocks) — bump with astro.
import { unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import partytown from '@astrojs/partytown';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import Icons from 'unplugin-icons/vite';

/**
 * Remark plugin: rewrite root-relative src/href inside raw HTML blocks in .md files.
 * Markdown raw HTML (e.g. <img src="/assets/...">) stays as mdast 'html' nodes and
 * is never parsed into hast elements — string replacement is the only reliable path.
 */
function remarkBasePaths() {
  const base = (process.env.ASTRO_BASE ?? '').replace(/\/$/, '');
  if (!base) return (tree) => tree;

  // Match src="/" or href="/" but not src="//" (protocol-relative)
  const re = /((?:src|href)=")\/(?!\/)/g;

  function walk(node) {
    if (node.type === 'html' && typeof node.value === 'string') {
      node.value = node.value.replace(re, `$1${base}/`);
    }
    node.children?.forEach(walk);
  }

  return (tree) => walk(tree);
}

/**
 * Rehype plugin: rewrite root-relative src/href on hast element nodes.
 * Handles standard markdown images (![](/)  → <img src="/">) and MDX JSX elements
 * after remark-rehype converts them to hast.
 */
function rehypeBasePaths() {
  const base = (process.env.ASTRO_BASE ?? '').replace(/\/$/, '');
  if (!base) return (tree) => tree;

  function walk(node) {
    if (node.type === 'element') {
      const src = node.properties?.src;
      if (typeof src === 'string' && src.startsWith('/') && !src.startsWith('//')) {
        node.properties.src = `${base}${src}`;
      }
      const href = node.properties?.href;
      if (typeof href === 'string' && href.startsWith('/') && !href.startsWith('//')) {
        node.properties.href = `${base}${href}`;
      }
    }
    node.children?.forEach(walk);
  }

  return (tree) => walk(tree);
}

// https://astro.build/config
//
// Deployment config is env-first:
// - local development: copy `.env.example` to `.env`
// - GitHub Pages: set repository variables `ASTRO_SITE` and `ASTRO_BASE`
//
// `src/config/site.ts` consumes the resolved Astro values via
// `import.meta.env.SITE` and `import.meta.env.BASE_URL`; it is not the
// source of truth for deployment URLs.
export default defineConfig({
  site: process.env.ASTRO_SITE ?? 'https://example.github.io', // override via ASTRO_SITE env var or edit directly
  base: process.env.ASTRO_BASE ?? '', // override via ASTRO_BASE env var or set '/repo-name' for project pages
  output: 'static',
  trailingSlash: 'always',
  compressHTML: true,
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  image: {
    // Allow Astro's <Image> component to optimise images from these remote domains.
    // Used for book covers (Open Library) and GitHub stats cards.
    domains: [
      'covers.openlibrary.org',
      'github-readme-stats.vercel.app',
      'github-profile-trophy.vercel.app',
    ],
  },
  integrations: [
    react(),
    mdx(),
    partytown({
      config: {
        forward: ['dataLayer.push'],
      },
    }),
  ],
  vite: {
    // Icons are provided by unplugin-icons: each icon is a static
    // `~icons/<collection>/<name>` import compiled to a zero-JS inline SVG.
    // An unknown icon name fails the build (unresolved import) instead of a
    // silent warning, so there is no hand-maintained include list to drift.
    plugins: [tailwindcss(), Icons({ compiler: 'astro' })],
    resolve: {
      alias: {
        '@components': '/src/components',
        '@layouts': '/src/layouts',
        '@styles': '/src/styles',
        '@assets': '/src/assets',
        '@config': '/src/config',
        '@utils': '/src/utils',
        '@content': '/src/content',
        '@data': '/src/data',
      },
    },
    build: {
      rollupOptions: {
        output: {
          // Shorter, readable asset paths (e.g. _s/abc123.js instead of _astro/abc123.js)
          assetFileNames: '_s/[hash][extname]',
          chunkFileNames: '_s/[hash].js',
          entryFileNames: '_s/[hash].js',
        },
      },
    },
  },
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath, remarkBasePaths],
      rehypePlugins: [
        [rehypeKatex, { strict: false }],
        [
          rehypeExternalLinks,
          {
            target: '_blank',
            rel: ['noopener', 'noreferrer'],
          },
        ],
        rehypeBasePaths,
      ],
    }),
    syntaxHighlight: 'shiki',
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
    },
  },
});
