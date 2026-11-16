# AGENTS.md — as-folio

Guidelines for AI agents (Claude Code, Codex, Copilot Workspace, etc.) contributing to as-folio.

---

## Repository layout

```text
as-folio/
├── src/
│   ├── config/site.ts        ← single config file (start here)
│   ├── content/              ← collections: posts, projects, people, teaching, books, announcements
│   ├── data/
│   │   ├── papers.bib        ← BibTeX bibliography
│   │   ├── coauthors.yml     ← co-author profile links (LastName: { url, scholar, orcid })
│   │   ├── citations.yml     ← citation counts keyed by google_scholar_id (auto-updated)
│   │   ├── cv.yml            ← RenderCV format CV
│   │   ├── resume.json       ← JSONResume format CV
│   │   └── repositories.yml  ← GitHub repos config
│   ├── layouts/              ← Base.astro, Page.astro, Post.astro, Distill.astro
│   ├── components/           ← UI components
│   ├── pages/                ← Astro route pages
│   └── styles/               ← global.css, _colors.css, _typography.css
├── scripts/
│   └── update-citations.ts   ← fetches citation counts from OpenAlex API (run via bun run citations:update)
├── public/                   ← static assets (images, favicon, PDFs)
├── astro.config.mjs
├── package.json
├── CLAUDE.md                 ← coding conventions and architecture (read this first)
├── AGENTS.md                 ← this file
├── README.md
├── QUICKSTART.md
└── CUSTOMIZE.md
```

All paths in this file are relative to the repository root.

---

## Build command

```bash
bun run build        # must exit 0 before submitting any PR
```

Run this after every non-trivial change. If the build fails, fix it before proceeding.

---

## What to do first

1. **Read `CLAUDE.md`** — coding conventions, architecture, common pitfalls
2. **Read `src/config/site.ts`** — understand the config shape before touching features
3. **Read `src/content.config.ts`** — understand content schemas before adding fields
4. **Run `bun run build`** — confirm baseline passes

---

## Key rules

### Package manager

Use `bun`. Never `npm`, `npx` or `yarn`. Add dev dependencies with `bun add -d`.

### Content Layer API

Use Astro 6 API: `const { Content } = await render(entry)` — not `entry.render()`.

### CSS

- CSS custom properties for all theming (see `src/styles/_colors.css`)
- Dark mode via `[data-theme='dark']` selector — never Tailwind's `dark:` prefix
- No `innerHTML` with untrusted content — use `textContent`

### Config changes

Any new feature must have:

- A flag in `site.ts` with a JSDoc comment
- Documentation in `CUSTOMIZE.md`
- Build verified to exit 0

### No hardcoded persona strings

**Never embed persona names, demo values, or user-visible strings directly in components.**
All such values must originate in `src/config/site.ts` and be passed down as props.

Examples of what NOT to do:

```typescript
// ❌ Wrong — hardcoded persona
const PERSONA_LAST_NAME = 'einstein';

// ❌ Wrong — hardcoded UI label
<button>Abs</button>
```

Examples of what to do instead:

```typescript
// ✅ Correct — derived from config
const authorLastName = site.publications.authorLastName ?? site.author.name.split(' ').pop() ?? '';

// ✅ Correct — label from config
<button>{labels.abstract ?? 'Abs'}</button>
```

This applies to publication author highlighting, search placeholders, empty-state messages, page descriptions, and any other user-visible text.

### Schema changes

When adding BibTeX fields, frontmatter fields, or collection fields:

- Update `src/content.config.ts` with the Zod schema
- Use `z.coerce.string()` for fields that YAML may parse as numbers (ISBN, IDs)
- Add `optional()` with a default for fields that may not be present

---

## Patterns to follow

### Clickable card with inner link (avoid nested `<a>`)

```astro
<div class="card" data-href={url} role="link" tabindex="0">
  {/* inner GitHub link — real <a> */}
  <a href={githubUrl} class="github-link" onclick="event.stopPropagation()">...</a>
</div>

<script>
  document.querySelectorAll('[data-href]').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (!(e.target as Element).closest('a')) {
        window.location.href = card.dataset.href!;
      }
    });
  });
</script>
```

### Per-post CDN widget (in Post.astro)

```astro
---
const { chart_js = false } = post.data;
---

{chart_js && <script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js" defer />}
```

### Analytics injection (in Base.astro)

```astro
---
const { pirsch } = site.analytics;
---

{pirsch && <script defer src="https://api.pirsch.io/pa.js" data-code={pirsch} />}
```

---

## Files you should NOT modify

- `bun.lock` — managed by bun automatically
- `dist/` — build output, not tracked in git
- `.husky/` — hooks managed by husky

---

## Files you will frequently modify

| File                          | Purpose                                              |
| ----------------------------- | ---------------------------------------------------- |
| `src/config/site.ts`          | Add feature flags, config options                    |
| `src/content.config.ts`       | Add collection fields                                |
| `src/layouts/Post.astro`      | Add per-post CDN widgets                             |
| `src/layouts/Base.astro`      | Add global scripts (analytics, consent)              |
| `src/components/*.astro`      | New UI components                                    |
| `src/pages/*.astro`           | New or modified pages                                |
| `src/content/**/*.md`         | Demo content                                         |
| `src/data/papers.bib`         | BibTeX demo entries                                  |
| `src/data/coauthors.yml`      | Co-author links (LastName → url/scholar/orcid)       |
| `src/data/citations.yml`      | Citation counts; auto-updated — rarely edit manually |
| `scripts/update-citations.ts` | Citation fetch script; edit to change API/options    |
| `CUSTOMIZE.md`                | Document new features                                |

---

## Testing

```bash
bun run test           # unit tests (Vitest)
bun run lint           # ESLint
bun run format         # Prettier (check only in CI)
bun run build          # full production build + pagefind index
```

The build is the primary acceptance test. All pages must generate without errors.

---

## Pull request checklist

- [ ] `bun run build` exits 0 with 0 TypeScript errors
- [ ] `bun run lint` passes
- [ ] New feature has a flag in `site.ts`
- [ ] New feature documented in `CUSTOMIZE.md`
- [ ] New collection fields added to `src/content.config.ts`
- [ ] Demo content updated if needed
