# Migration guide

How to move an existing as-folio site to a new major version.

---

## Migrating to 3.0: Yarn → Bun

as-folio 3.0 uses [Bun](https://bun.sh) as package manager and runtime instead of Yarn and Node.

1. **Install Bun 1.4 or newer.** See <https://bun.sh/docs/installation>.
2. **Remove the Yarn files:**

   ```bash
   rm -rf yarn.lock .yarnrc.yml .yarn/ .nvmrc node_modules
   ```

3. **Take the new `package.json` and `bunfig.toml`** from the template (or merge them into yours), then install:

   ```bash
   bun install
   ```

   `bunfig.toml` sets `minimumReleaseAge` so freshly published packages wait three days before they can be installed.

4. **Update CI.** Copy the workflows from `.github/workflows/` (they use `oven-sh/setup-bun` and `bun install --frozen-lockfile`). GitLab users: `.gitlab-ci.yml` now uses the `oven/bun` image. Netlify and Vercel configs (`netlify.toml`, `vercel.json`) already call `bun run build`.
5. **Use `bun run <script>`** wherever you used `yarn <script>` (`bun run dev`, `bun run build`, `bun run test`, …).

### Astro 7

as-folio 3.0 requires **Astro 7** (`peerDependencies.astro` is `>=7.0.0`). Bump `astro`, `@astrojs/mdx` (8), `@astrojs/react` (7), `@astrojs/markdown-remark`, `@astrojs/rss`, `@astrojs/partytown` and `@astrojs/check` together, and declare `vite` at the version Astro 7 uses (8.x).

Things to check in your own content and components:

- **Markdown still uses remark/rehype.** Astro 7 defaults to a new Markdown engine; as-folio keeps the unified pipeline through `@astrojs/markdown-remark` so remark/rehype plugins (math, KaTeX, external links) keep working. Keep the `unified` import in `astro.config.mjs`.
- **Entities in component props are no longer decoded.** Write `title="Honors & Awards"`, not `title="Honors &amp; Awards"` — Astro 7 escapes the string again and the page would show `&amp;`.
- **Whitespace inside `<pre>` follows your template exactly.** If a component renders `<pre>` with an expression on its own line, the Astro 7 compiler emits one newline fewer than Astro 6. `src/components/JupyterNotebook.astro` shows how to emit explicit whitespace when you need identical output.
- **Invalid HTML is not auto-fixed** by the new compiler; unclosed tags are build errors.
