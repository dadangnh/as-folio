# Quickstart - Deploy in 5 minutes

Fork → configure deployment → personalize → deploy. No local setup required.

---

## Step 1 - Fork the repository

Click **Fork** on the [as-folio GitHub page](https://github.com/dadangnh/as-folio).

Keep the default settings. Fork to your personal account.

---

## Step 2 - Enable GitHub Pages

In your fork:

1. Go to **Settings** → **Pages**
2. Under _Source_, select **GitHub Actions**
3. Save

---

## Step 3 - Set deployment variables

In your fork, go to **Settings** → **Secrets and variables** → **Actions** → **Variables**.

Create these repository variables for a user/org page:

```text
ASTRO_SITE=https://YOUR-USERNAME.github.io
ASTRO_BASE=
```

If you need an alternative to an empty string, `ASTRO_BASE=/` is equivalent here.

For a project page, use:

```text
ASTRO_SITE=https://YOUR-USERNAME.github.io
ASTRO_BASE=/as-folio
```

---

## Step 4 - Personalize your site

Edit `src/config/site.ts` directly on GitHub:

```typescript
export const site = {
  title: 'Your Name',

  author: {
    name: 'Your Name',
    email: 'you@example.com',
    subtitle: 'Your Role · Your Institution',
  },

  socials: {
    email: 'you@example.com',
    github_username: 'YOUR-USERNAME',
    // set unused platforms to: undefined
  },
};
```

Commit the change to `main`.

---

## Step 5 - Wait for the build

The GitHub Actions workflow runs automatically on every push to `main`.

Check progress in the **Actions** tab under **Deploy to GitHub Pages**.

Build takes about 90-120 seconds. The first step fetches citation counts from OpenAlex,
which adds a few seconds but requires no configuration.

---

## Step 6 - Visit your site

After the workflow completes, your site is live at:

```text
https://YOUR-USERNAME.github.io
```

For project pages, the URL will include your repo name:

```text
https://YOUR-USERNAME.github.io/as-folio
```

---

## Next steps

- Replace the demo content in `src/content/` with your own
- Add your BibTeX papers to `src/data/papers.bib`
- Add co-author links to `src/data/coauthors.yml`
- Replace `public/assets/img/prof_pic.jpg` with your photo
- Update your CV in `src/data/cv.yml` or `src/data/resume.json`

See [CUSTOMIZE.md](CUSTOMIZE.md) for a complete guide.
