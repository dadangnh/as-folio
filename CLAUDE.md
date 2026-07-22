# CLAUDE.md — as-folio

Instructions for Claude Code when working on this repository.

---

## Project overview

**as-folio** is a standalone Astro v6 template for academic portfolios, built with
TypeScript and Tailwind CSS v4.

Key constraint: this is a **reusable template**, not a personal site. Demo content uses
Einstein, Torvalds, and Dadang NH as personas. All configuration is exposed via
`src/config/site.ts` (single source of truth).

---

## Package manager

**Always use `yarn`. Never use `npm` or `npx`.**

```bash
yarn install        # install dependencies
yarn dev            # development server
yarn build          # production build (includes pagefind indexing)
yarn lint           # ESLint
yarn format         # Prettier
```

---

## Architecture

### Config

- `src/config/site.ts` — all site settings, typed, JSDoc-documented. This is the one file
  template users edit. Add new config here (with JSDoc) when adding features.

### Content Layer (Astro 6)

- `src/content.config.ts` — collection schemas using `glob` loader + Zod
- Collections: `posts`, `projects`, `people`, `teaching`, `announcements`, `books`
- Use `z.coerce.string()` for ISBN/OLID fields (YAML parses bare numbers as JS numbers)
- Use `render(entry)` not `entry.render()` (Astro 6 API)
- Posts support `draft: boolean` (excluded from listings and search index) and `lastmod: date` (shown in header, used in JSON-LD `dateModified`)

### CSS

- Tailwind v4 via `@tailwindcss/vite` plugin — no `tailwind.config.js`
- CSS custom properties defined in `src/styles/_colors.css`
- Dark mode via `[data-theme='dark']` selector on `<html>` (not Tailwind's `dark:` variant)
- Never use `dark:` Tailwind prefix — use CSS variable overrides instead

### Icons

- `unplugin-icons` (`compiler: 'astro'`) with `@iconify-json/fa-brands`, `@iconify-json/fa-solid`, `@iconify-json/fa-regular`
- `@iconify-json/academicons` for academic social icons
- Usage: `import IconGithub from '~icons/fa-brands/github'` → `<IconGithub />` (unknown name = build error)
- Data-driven icons: put the component in the data — `{ Icon: IconGithub }` → `<item.Icon />`

### BibTeX

- `src/utils/bibtex.ts` — custom build-time BibTeX parser (no external dependencies), produces typed `BibEntry[]`
  - `BIBTEX_INTERNAL_FIELDS` — set of display-only fields excluded from the copyable BibTeX citation block
  - `getCleanBibtex(entry)` — returns a citation-safe BibTeX string with internal fields stripped
- `src/data/papers.bib` — Einstein demo papers
- `src/data/coauthors.yml` — co-author profile links; format: `LastName: { url, scholar, orcid }`
- `src/data/citations.yml` — citation counts keyed by `google_scholar_id`; auto-updated by `scripts/update-citations.ts`
- Never fetch BibTeX at runtime; always parse at build time in `getStaticPaths` or page frontmatter

### Citations update script

- `scripts/update-citations.ts` — fetches citation counts from the OpenAlex API (by DOI) and writes `src/data/citations.yml`
- Run manually: `yarn citations:update`
- Runs automatically as `prebuild` before every `yarn build`
- GitHub Actions workflow (`.github/workflows/update-citations.yml`) also runs this weekly and commits the result

### Analytics

- All analytics scripts loaded via Partytown (`@astrojs/partytown`)
- Only inject scripts when the relevant `site.analytics.*` field is non-empty

---

## Coding conventions

### Astro components

- All CSS in `<style>` blocks (scoped) or inline `style` attributes using CSS variables
- Avoid Tailwind classes for component-level layout — use CSS custom properties for theming
- Script blocks use vanilla JS only (no framework imports in `<script>`)
- Use `is:inline` only when the script must run before hydration (e.g., dark mode FOUC prevention)

### TypeScript

- Strict mode is on. No `any` types without a comment explaining why.
- Use `as const` on config objects to preserve literal types
- Prefer `z.coerce.string()` over `z.string()` for data that YAML may parse as numbers

### Security

- Never use `innerHTML` or `set:html` with user-provided content
- Use `textContent` for dynamic text in client scripts
- Sanitize any content coming from external APIs before rendering

### No backwards-compat hacks

- Delete unused code outright — don't leave `// removed` comments or re-export removed types
- Don't add `_var` renaming just to silence "unused" warnings — fix the actual issue

---

## Adding a new feature

1. Add the feature flag to `site.ts` with a JSDoc comment
2. Add any new content schema fields to `src/content.config.ts`
3. Implement in the relevant component/page
4. If it's a per-post CDN widget, add the frontmatter flag to `posts` schema and
   inject the CDN script in `src/layouts/Post.astro` following the existing pattern
5. Document in `CUSTOMIZE.md` under the appropriate section

---

## Common pitfalls

| Issue                        | Fix                                                                                                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `render()` error             | Use `const { Content } = await render(entry)` (Astro 6 API)                                                                                                                                      |
| YAML number parsed as string | Use `z.coerce.string()` in schema                                                                                                                                                                |
| Dark mode flash              | Ensure `<script is:inline>` with `localStorage` check is in `<head>` before CSS                                                                                                                  |
| Nested `<a>` elements        | Use `data-href` + JS click handler for clickable cards; inner links stay real `<a>`                                                                                                              |
| `as const` type error        | Use `as 'literal'` type assertion for string union fields in site config                                                                                                                         |
| ISBN coercion                | Always `z.coerce.string()` for isbn/olid fields                                                                                                                                                  |
| Icon not found at build      | Import it as `~icons/<collection>/<name>`; an unknown name is a build error, not a silent warning                                                                                                |
| Hardcoded persona string     | Never embed persona names (e.g. `'einstein'`) in components — pass all user-visible text as props from `site.ts`                                                                                 |
| Image zoom stuck / no close  | medium-zoom only attaches to `img[data-zoomable]`; use `<Figure zoomable />` to opt in. The `transitionend` failsafe (400ms timeout) handles environments where the CSS transition doesn't fire. |
| BibTeX field shows in cite   | Add the field name to `BIBTEX_INTERNAL_FIELDS` in `src/utils/bibtex.ts` so it's stripped from the copyable citation block.                                                                       |

---

## Build verification

After any significant change:

```bash
yarn build
```

The build must:

- Exit with code 0
- Have 0 TypeScript errors
- Produce all expected pages in `dist/`
- Include `dist/pagefind/` (search index)
