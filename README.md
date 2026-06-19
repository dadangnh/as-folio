# as-folio

**A clean, responsive Astro template for academic portfolios.**

[![Astro](https://img.shields.io/badge/Astro-6-FF5D01?logo=astro&logoColor=white)](https://astro.build)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Live Demo](https://img.shields.io/badge/Live_Demo-dadangnh.github.io%2Fas--folio-8A2BE2)](https://dadangnh.github.io/as-folio/)

---

## Screenshots

<table>
  <tr>
    <td align="center"><b>Homepage</b></td>
    <td align="center"><b>Blog</b></td>
    <td align="center"><b>Search</b></td>
  </tr>
  <tr>
    <td><img src="public/assets/img/as_folio_homepage.png" alt="Homepage" /></td>
    <td><img src="public/assets/img/as_folio_blog.png" alt="Blog" /></td>
    <td><img src="public/assets/img/as_folio_search.png" alt="Search" /></td>
  </tr>
</table>

---

## Features

- **Publications** — BibTeX bibliography with configurable author highlighting, abstract toggles, and Altmetric/Dimensions/Google Scholar badges
- **Blog** — MDX posts with math (KaTeX), syntax highlighting, reading progress bar, table of contents, image zoom, related posts, year-grouped listings, and draft post support
- **Projects** — Card grid with category groupings, live GitHub star counts, and project detail pages with inline citations
- **CV** — Supports both RenderCV YAML and JSONResume JSON formats, with PDF download
- **Books** — Reading shelf with Open Library cover art, star ratings, and reading status
- **Repositories** — GitHub user stats, repo pins, and trophies via github-readme-stats
- **Teaching** — Course listing with current/past groupings
- **People** — Lab member profiles with social links
- **Search** — Full-text ⌘K search powered by Pagefind + ninja-keys
- **Dark mode** — System-aware, flash-free, toggleable
- **Distill layout** — Academic paper layout with footnotes, citations, and figure numbers
- **Jupyter notebooks** — Notebook cells rendered as blog posts
- **Per-post CDN widgets** — Mermaid, Chart.js, ECharts, Vega, Plotly, Pseudocode, TikzJax, Leaflet, PhotoSwipe, and more
- **Analytics** — GA4, Pirsch, OpenPanel, Cronitor (pick any)
- **Comments** — Giscus (GitHub Discussions) or Disqus
- **Newsletter** — Loops.so integration
- **Cookie consent** — GDPR-compliant via vanilla-cookieconsent
- **RSS feed + sitemap** — Auto-generated
- **Deploy anywhere** — GitHub Pages, Cloudflare Pages, Netlify, Vercel

---

## Demo

The template ships with demo content for three personas:

| Persona         | Purpose                                              |
| --------------- | ---------------------------------------------------- |
| Albert Einstein | Academic profile: publications, CV, blog, math posts |
| Linus Torvalds  | OSS profile: repositories page, GitHub stats         |
| Dadang NH       | Template creator and maintainer                      |

---

## Getting started

Deployment config is env-first:

- `ASTRO_SITE` and `ASTRO_BASE` are the source of truth
- `astro.config.mjs` reads them during the build
- `src/config/site.ts` only consumes the resolved Astro values

Use `.env` for local development and repository variables for GitHub Pages.

For project pages, keep `ASTRO_SITE` as the site origin, for example
`https://YOUR-USERNAME.github.io`, and put the repo path in `ASTRO_BASE`, for example
`/as-folio`.

### Option A — GitHub Pages (recommended)

1. **Fork** this repository on GitHub
2. Go to your fork → **Settings** → **Pages** → Source: **GitHub Actions**
3. Edit `src/config/site.ts` with your details (see [CUSTOMIZE.md](CUSTOMIZE.md))
4. Push to `main` — the site deploys automatically

### Option B — Local development

```bash
# Prerequisites: Node 24+, Corepack enabled
corepack enable

# Clone
git clone https://github.com/YOUR-USERNAME/as-folio.git
cd as-folio

# Copy env template
cp .env.example .env

# Install
yarn install

# Dev server
yarn dev

# Production build
yarn build
```

---

## Configuration

Deployment URL and base path come from `ASTRO_SITE` and `ASTRO_BASE`, not from editing
`src/config/site.ts` directly.

All site settings live in one file: **`src/config/site.ts`**

This replaces al-folio's `_config.yml`. Every option is typed and documented with JSDoc — your editor will catch mistakes before the build does.

### Minimum required changes

```typescript
// src/config/site.ts

export const site = {
  title: 'Your Name',
  description: 'Your site description',

  author: {
    name: 'Your Name',
    email: 'you@example.com',
    avatar: '/assets/img/prof_pic.jpg',
    subtitle: 'Your Title · Your Institution',
    moreInfo: '<p>Your address here</p>',
  },

  socials: {
    email: 'you@example.com',
    github_username: 'your-github',
    scholar_userid: 'YOUR_SCHOLAR_ID',
    // ... set others to undefined to hide
  },
};
```

See [CUSTOMIZE.md](CUSTOMIZE.md) for a full step-by-step guide.

---

## Project structure

```
src/
├── config/
│   └── site.ts          ← single config file (start here)
├── content/
│   ├── posts/           ← blog posts (.md or .mdx)
│   ├── projects/        ← project pages (.md or .mdx)
│   ├── books/           ← bookshelf entries (.md)
│   ├── teaching/        ← course listings (.md)
│   ├── announcements/   ← news items (.md)
│   └── people/          ← lab member profiles (.md)
├── data/
│   ├── papers.bib       ← BibTeX bibliography
│   ├── coauthors.yml    ← co-author profile links
│   ├── citations.yml    ← citation counts (auto-updated)
│   ├── cv.yml           ← RenderCV format CV
│   ├── resume.json      ← JSONResume format CV
│   └── repositories.yml ← GitHub repos config
├── pages/               ← Astro pages (rarely need editing)
scripts/
└── update-citations.ts  ← fetches citation counts from OpenAlex
```

---

## Adding content

### Blog post

Create `src/content/posts/my-post.md`:

```yaml
---
title: 'My First Post'
date: 2024-01-01
lastmod: 2024-06-15 # optional: last modified date
description: 'Optional description for meta tags'
tags: [math, physics]
categories: [science]
math: true # enable KaTeX
toc: true # table of contents sidebar
draft: false # set true to exclude from listings
---
Your post content here. Math works: $E = mc^2$.
```

### Publication (BibTeX)

Add an entry to `src/data/papers.bib`:

```bibtex
@article{einstein1905,
  title            = {On the Electrodynamics of Moving Bodies},
  author           = {Einstein, Albert},
  journal          = {Annalen der Physik},
  year             = {1905},
  volume           = {17},
  pages            = {891--921},
  doi              = {10.1002/andp.19053221004},

  % as-folio display fields:
  selected         = {true},           % shows on About page
  abbr             = {Ann. Phys.},
  abstract         = {Your abstract.},
  pdf              = {https://example.com/paper.pdf},
  code             = {https://github.com/you/repo},
  slides           = {/assets/pdf/talk.pdf},
  video            = {https://youtube.com/watch?v=...},
  html             = {https://doi.org/...},

  % citation metric badges (all optional):
  google_scholar_id = {YOUR_PAPER_ID},  % from Scholar URL citation_for_view=...
  altmetric        = {true},            % true = use DOI; or explicit Altmetric ID
  dimensions       = {true},            % true = use DOI
  inspirehep_id    = {12345},           % InspireHEP literature record ID
}
```

Citation counts for `google_scholar_id` entries are stored in `src/data/citations.yml` and refreshed automatically on every deploy (via the pre-build script) or on demand with `yarn citations:update`.

### Project

Create `src/content/projects/my-project.md`:

```yaml
---
title: 'My Project'
description: 'What it does'
img: /assets/img/project-thumb.jpg
github: username/repo
github_stars: username/repo # enables live star count
importance: 1 # lower = shown first
category: open source
---
Project description content here.
```

### Book

Create `src/content/books/my-book.md`:

```yaml
---
title: 'The Book Title'
author: Author Name
isbn: '9780000000000'
status: finished # reading | finished | queued | paused | abandoned
stars: 4
started: 2024-01-01
finished: 2024-03-15
---
Optional notes about the book.
```

---

## Deployment

### GitHub Pages

Already configured. Push to `main` after:

1. Setting source to GitHub Actions in repo Settings → Pages
2. Setting repository variable `ASTRO_SITE` to your site origin, e.g. `https://username.github.io`
3. Setting repository variable `ASTRO_BASE` to `''` for user pages or `/repo-name` for project pages

### GitLab Pages

Already configured in `.gitlab-ci.yml`. Push to your default branch after:

1. Forking or mirroring this repo to GitLab
2. Going to **Settings** → **CI/CD** → **Variables** and adding:
   - `ASTRO_SITE` — full URL, e.g. `https://username.gitlab.io` or your custom domain
   - `ASTRO_BASE` — base path for project pages, e.g. `/as-folio`; leave unset for user/group pages (`username.gitlab.io`)
3. Pushing to your default branch — the pipeline runs typecheck → lint → unit tests → deploy automatically

### Cloudflare Pages

```
Build command:  yarn build
Output dir:     dist
Node version:   24
```

### Netlify

Already configured in `netlify.toml`. Connect your repo in Netlify dashboard.

### Vercel

Already configured in `vercel.json`. Connect your repo in Vercel dashboard.

---

## Tech stack

| Layer           | Technology                                                                               |
| --------------- | ---------------------------------------------------------------------------------------- |
| Framework       | [Astro 6](https://astro.build)                                                           |
| CSS             | [Tailwind CSS v4](https://tailwindcss.com)                                               |
| Types           | TypeScript (strict)                                                                      |
| Math            | KaTeX via remark-math + rehype-katex                                                     |
| Search          | [Pagefind](https://pagefind.app) + [ninja-keys](https://github.com/ssleptsov/ninja-keys) |
| BibTeX          | Custom build-time parser (zero runtime deps)                                             |
| Icons           | [Iconify](https://iconify.design) (Font Awesome + Academicons)                           |
| Package manager | Yarn 4 (Berry)                                                                           |
| Node            | 24+                                                                                      |

---

## Contributing

Issues and PRs are welcome. See [AGENTS.md](AGENTS.md) for AI-assisted contribution guidelines.

```bash
yarn lint        # run ESLint
yarn format      # run Prettier
yarn test        # run unit tests
yarn build       # verify production build
```

---

## Acknowledgements

as-folio began as an Astro reimplementation of the [al-folio](https://github.com/alshedivat/al-folio) Jekyll theme and has since evolved into an independent project. All code in this repository is an original implementation.

---

## License

MIT © [Dadang NH](https://github.com/dadangnh)
