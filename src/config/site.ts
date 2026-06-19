/**
 * as-folio site configuration
 *
 * This file replaces _config.yml from al-folio.
 * Update the values below to personalize your site.
 * All configuration is fully typed — your editor will catch mistakes.
 */

// ─── Navigation types (exported for use in Navbar.astro / SearchTrigger) ────

/** A simple navigation link. */
export type NavLeaf = { label: string; href: string };

/**
 * A dropdown group. `label` is the trigger text; `children` are the menu items.
 * Maximum supported depth is 2 levels (group → item). Do not nest further.
 */
export type NavDropdown = { label: string; children: NavLeaf[] };

/** A top-level nav entry — either a plain link or a dropdown group. */
export type NavItem = NavLeaf | NavDropdown;

export const site = {
  // ─── Derived deployment values ────────────────────────────────────────────

  /** Site origin from Astro's resolved `site` option. */
  url: import.meta.env.SITE.replace(/\/$/, ''),

  /** Base path from Astro's resolved `base` option. */
  base: import.meta.env.BASE_URL === '/' ? '' : import.meta.env.BASE_URL.replace(/\/$/, ''),

  // ─── Identity ──────────────────────────────────────────────────────────────

  /** Site title. Shown in the browser tab and navbar. */
  title: 'Albert Einstein',

  /** Site description. Used in meta tags. */
  description: 'A simple, clean, and responsive Astro template for academics. Powered by as-folio.',

  /** Language code for the site. */
  lang: 'en',

  // ─── Author ────────────────────────────────────────────────────────────────

  author: {
    /** Full name shown in navbar, about page heading, and footer. */
    name: 'Albert Einstein',

    /** Short email address (used in social links). */
    email: 'einstein@example.com',

    /** Path to profile photo. Place image in public/assets/img/. */
    avatar: '/assets/img/prof_pic.jpg',

    /**
     * Subtitle below your name on the about page.
     * HTML is supported.
     */
    subtitle: `Theoretical Physicist
      &nbsp;·&nbsp;
      <a href="https://en.wikipedia.org/wiki/Institute_for_Advanced_Study">Institute for Advanced Study</a>,
      Princeton`,

    /**
     * Address block below profile photo.
     * HTML is supported.
     */
    moreInfo: `<p>Institute for Advanced Study</p>
      <p>Einstein Drive</p>
      <p>Princeton, NJ 08540</p>`,
  },

  // ─── Social links ──────────────────────────────────────────────────────────
  //
  // Supported platforms (set to undefined to hide):
  //   email, x_username, linkedin_username, github_username, gitlab_username,
  //   scholar_userid, orcid_id, inspire_id, researchgate_username,
  //   arxiv_id, youtube_id, instagram_username, mastodon_url,
  //   bluesky_handle, medium_username, cv_pdf, rss_icon

  socials: {
    email: 'einstein@example.com',
    x_username: undefined as string | undefined,
    linkedin_username: undefined as string | undefined,
    github_username: undefined as string | undefined,
    gitlab_username: undefined as string | undefined,
    /** Google Scholar user ID — the part after user= in your Scholar URL */
    scholar_userid: 'qc6CJjYAAAAJ',
    orcid_id: undefined as string | undefined,
    /** Inspire HEP author ID */
    inspire_id: '1010907',
    researchgate_username: undefined as string | undefined,
    arxiv_id: undefined as string | undefined,
    youtube_id: undefined as string | undefined,
    instagram_username: undefined as string | undefined,
    mastodon_url: undefined as string | undefined,
    bluesky_handle: undefined as string | undefined,
    medium_username: undefined as string | undefined,
    /** Path to CV PDF in public/assets/pdf/ */
    cv_pdf: '/assets/pdf/example_pdf.pdf',
    /** Show RSS icon in social links */
    rss_icon: true,
  },

  // ─── Navigation ────────────────────────────────────────────────────────────

  navbar: {
    /** Fix navbar to top of viewport. */
    fixed: true,
    /** Show social icons in navbar (about page only). */
    socialIcons: false,
    /**
     * Top-level navigation items.
     * Use `{ label, href }` for a plain link.
     * Use `{ label, children: [...] }` for a dropdown group (max 2 levels).
     *
     * `href` values are relative to the site root (base is prepended automatically).
     */
    items: [
      { label: 'about', href: '/' },
      { label: 'blog', href: '/blog/' },
      { label: 'publications', href: '/publications/' },
      { label: 'projects', href: '/projects/' },
      { label: 'repositories', href: '/repositories/' },
      { label: 'cv', href: '/cv/' },
      {
        label: 'more',
        children: [
          { label: 'teaching', href: '/teaching/' },
          { label: 'people', href: '/people/' },
          { label: 'books', href: '/books/' },
        ],
      },
    ] as NavItem[],
  },

  // ─── Footer ────────────────────────────────────────────────────────────────

  footer: {
    /**
     * Text shown in footer. HTML is supported.
     * Leave empty string to hide.
     */
    text: `Powered by <a href="https://github.com/dadangnh/as-folio" target="_blank" rel="noopener noreferrer">as-folio</a>.
      Hosted by <a href="https://pages.github.com/" target="_blank" rel="noopener noreferrer">GitHub Pages</a>.`,
    /** Show "Last updated" timestamp in footer. */
    lastUpdated: false,
    /** Path to impressum/legal page (EU GDPR). Leave undefined to hide. */
    impressum: undefined as string | undefined,
    /**
     * Footer display mode:
     * 'sticky'  — always visible at the bottom of the viewport (al-folio default)
     * 'normal'  — sits at the natural bottom of page content (only visible when scrolled down)
     * 'hidden'  — footer is not rendered at all
     */
    position: 'sticky' as 'sticky' | 'normal' | 'hidden',
  },

  // ─── CV page ───────────────────────────────────────────────────────────────

  cv: {
    /**
     * Which CV data format to render.
     * 'rendercv' → reads src/data/cv.yml (RenderCV YAML format)
     * 'jsonresume' → reads src/data/resume.json (JSONResume format)
     */
    format: 'rendercv' as 'rendercv' | 'jsonresume',
    /** Path to CV PDF for the download button in public/assets/pdf/. */
    pdfPath: '/assets/pdf/example_pdf.pdf',
  },

  // ─── Blog ──────────────────────────────────────────────────────────────────

  blog: {
    /** Name shown in the blog page heading. */
    name: 'as-folio',
    description: 'A simple, clean, and responsive Astro template for academics.',
    /** Number of posts per page. */
    postsPerPage: 5,
    /**
     * Tags shown as badges on the blog listing page header.
     * Users can click them to filter posts by tag.
     */
    displayTags: ['formatting', 'images', 'links', 'math', 'code', 'blockquotes'],
    /** Categories shown as badges on the blog listing page header. */
    displayCategories: [] as string[],
    /**
     * External post sources (fetched at build time).
     * Each entry is either an RSS feed URL or a list of individual post objects.
     */
    externalSources: [] as Array<{
      name: string;
      rssUrl?: string;
      posts?: Array<{ url: string; publishedDate: string }>;
      categories?: string[];
      tags?: string[];
    }>,
    /** Average reading speed (words per minute) used for reading-time estimates. */
    wordsPerMinute: 200 as number,
    /** Message shown on the blog listing page when no posts exist. */
    emptyMessage: 'No posts yet. Check back soon!',
  },

  // ─── About page sections ──────────────────────────────────────────────────

  announcements: {
    /** Show news/announcements section on the about page. */
    enabled: true,
    /** Enable vertical scroll if more than 3 items. */
    scrollable: true,
    /** Max news items to show (undefined = show all). */
    limit: 5 as number | undefined,
  },

  latestPosts: {
    /** Show latest blog posts section on the about page. */
    enabled: true,
    scrollable: true,
    limit: 3 as number | undefined,
  },

  selectedPapers: {
    /** Show selected publications section on the about page. */
    enabled: true,
  },

  // ─── Features ─────────────────────────────────────────────────────────────

  features: {
    /** Enable dark/light mode toggle in navbar. */
    darkmode: true,
    /** Enable ⌘K search. */
    search: true,
    /** Enable reading progress bar on blog posts. */
    progressBar: true,
    /** Show back-to-top button. */
    backToTop: true,
    /** Enable automatic masonry layout for project cards. */
    masonry: true,
    /** Enable click-to-zoom on images (medium-zoom). */
    mediumZoom: true,
    /** Show styled CSS tooltips on hover for project card icons and publication annotations.
     *  When false, the browser's native title-attribute tooltip is used instead. */
    tooltips: false,
    /** Enable GDPR-compliant cookie consent dialog. */
    cookieConsent: false,
    /** Enable newsletter subscription form. */
    newsletter: false,
    /**
     * Enable video embedding for BibTeX entries.
     * If false, video links open in a new tab instead.
     */
    videoEmbedding: false,
    /**
     * Enable Astro View Transitions for smooth page-to-page animations.
     * Disable if you prefer full page reloads (e.g. for accessibility reasons).
     */
    viewTransitions: true,
    /** Show social sharing links (X, LinkedIn, Facebook, email) at the bottom of blog posts. */
    socialShare: true,
  },

  // ─── Giscus comments ──────────────────────────────────────────────────────
  // Follow setup at https://giscus.app/ then fill in the values below.

  giscus: {
    /** Set to true once you've configured the fields below. */
    enabled: false,
    /**
     * When true, Giscus is hidden behind a "Load comments" button — the
     * giscus.app script is only fetched after the user opts in.
     * Recommended for GDPR compliance (giscus sets third-party cookies).
     * Default: true.
     */
    lazyLoad: true,
    repo: '' as `${string}/${string}`,
    repoId: '',
    category: 'Comments',
    categoryId: '',
    /** How to map discussions to pages. */
    mapping: 'title' as 'pathname' | 'url' | 'title' | 'og:title',
    strict: true,
    reactionsEnabled: true,
    inputPosition: 'bottom' as 'top' | 'bottom',
    darkTheme: 'dark',
    lightTheme: 'light',
    lang: 'en',
  },

  // ─── Analytics ────────────────────────────────────────────────────────────

  analytics: {
    /** Google Analytics 4 measurement ID (format: G-XXXXXXXXXX). */
    ga4: '' as string,
    /** Cronitor RUM analytics site ID. */
    cronitor: '' as string,
    /** Pirsch analytics site ID. */
    pirsch: '' as string,
    /** OpenPanel analytics client ID. */
    openpanel: '' as string,
    /** Google Search Console verification ID. */
    googleVerification: '' as string,
    /** Bing Webmaster verification ID. */
    bingVerification: '' as string,
  },

  // ─── Open Graph ───────────────────────────────────────────────────────────

  og: {
    /** Include Open Graph meta tags. */
    enabled: true,
    /** Default OG image path (in public/). */
    image: '' as string,
  },

  // ─── Newsletter ───────────────────────────────────────────────────────────

  newsletter: {
    /** Loops.so form endpoint. */
    endpoint: '' as string,
  },

  // ─── Teaching page ────────────────────────────────────────────────────────

  teaching: {
    /**
     * Google Calendar ID for the "Upcoming Events" section.
     * Set to a calendar address like 'user@gmail.com' to show the embed.
     * Leave empty string to hide the calendar section entirely.
     */
    calendarId: 'test@gmail.com' as string,
    /** Timezone for the Google Calendar embed (e.g., 'America/New_York'). */
    timezone: 'America/New_York' as string,
  },

  // ─── Publications ─────────────────────────────────────────────────────────

  publications: {
    /**
     * Show badges for individual publication entries.
     * Can be disabled globally here; also toggleable per entry in BibTeX.
     */
    badges: {
      altmetric: true,
      dimensions: true,
      googleScholar: true,
      inspirehep: true,
    },
    /**
     * Max number of authors shown before "and N more..." link.
     * Set to undefined to always show all authors.
     */
    maxAuthorLimit: 3 as number | undefined,
    /** Enable thumbnail images for publications (if `preview` set in BibTeX). */
    thumbnails: true,
    /**
     * Last name used to italicise your name in publication author lists.
     * Defaults to the last word of `site.author.name` when not set.
     * Override explicitly if your publications use a different name form.
     */
    authorLastName: undefined as string | undefined,
    /** Path prefix (relative to public/) for publication preview images. */
    previewDir: '/assets/img/publication_preview/',
    /** Path prefix (relative to public/) for publication PDFs and supplements. */
    pdfDir: '/assets/pdf/',
    /** UI labels — override for non-English sites. */
    labels: {
      abstract: 'Abs',
      bibtex: 'Bib',
      supp: 'Supp',
      searchPlaceholder: 'Search publications\u2026',
      noResults: 'No publications match your search.',
    },
  },

  // ─── Repositories ────────────────────────────────────────────────────────

  repositories: {
    /** Show GitHub user stats cards. */
    githubUsers: true,
    /** Show GitHub repository pin cards. */
    githubRepos: true,
    /** Show GitHub trophy stats (repo_trophies). Disabled by default — the service has known reliability issues. */
    trophies: false,
    /** Theme for light mode (from github-readme-stats themes). */
    themeLight: 'default' as string,
    /** Theme for dark mode. */
    themeDark: 'dark' as string,
    /** Trophy card theme for light mode (from github-profile-trophy themes). */
    trophyThemeLight: 'flat' as string,
    /** Trophy card theme for dark mode. */
    trophyThemeDark: 'gitdimmed' as string,
  },

  // ─── Comments ─────────────────────────────────────────────────────────────

  comments: {
    /**
     * Disqus shortname — the subdomain part of YOUR-SHORTNAME.disqus.com.
     * Required when a post sets `disqus: true` in frontmatter.
     * Leave empty string if not using Disqus.
     */
    disqusShortname: '' as string,
  },

  // ─── Page copy ────────────────────────────────────────────────────────────

  pages: {
    projects: {
      /** Description shown below the "projects" heading on the projects page. */
      description: 'A growing collection of your cool projects.',
    },
    teaching: {
      /** Description shown below the "teaching" heading on the teaching page. */
      description: 'Course materials, schedules, and resources for classes taught.',
    },
  },

  // ─── Theme defaults ───────────────────────────────────────────────────────

  theme: {
    /**
     * Default color theme.
     * 'system' follows OS preference.
     */
    default: 'system' as 'light' | 'dark' | 'system',

    /**
     * Primary accent color used for links, active nav items, badges, and highlights.
     * Accepts any CSS color string (hex, hsl, rgb, etc.).
     * Set to 'auto' to use the built-in defaults (purple in light mode, cyan in dark mode).
     *
     * Example presets:
     *   Purple (default): { light: '#b509ac', dark: '#2698ba' }
     *   Blue:             { light: '#0076df', dark: '#68c0d9' }
     *   Red:              { light: '#ff3636', dark: '#f29105' }
     *   Green:            { light: '#009f06', dark: '#b7d12a' }
     *   Orange:           { light: '#f29105', dark: '#efcc00' }
     */
    color: {
      light: 'auto' as string,
      dark: 'auto' as string,
    },
  },
} as const;

export type SiteConfig = typeof site;
