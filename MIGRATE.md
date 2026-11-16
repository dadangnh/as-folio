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

<!-- Filled in when the Astro 7 upgrade lands (peer requirement and any config changes). -->
