import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, type Page } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const EXTERNAL_IMAGE_HOSTS: string[] = [
  'github-readme-stats.vercel.app',
  'github-profile-trophy.vercel.app',
  'covers.openlibrary.org',
];

export const MASK_SELECTORS: string[] = [
  '.altmetric-embed',
  '.__dimensions_badge_embed__',
  'section.giscus-comments',
  '.giscus',
  'iframe.giscus-frame',
  '.leaflet-tile-pane',
  '.repo-card img',
  '.cover-img',
  // Animated GIFs keep playing; their bytes are covered by compare-dist
  'img[src$=".gif"]',
];

const placeholderBuffer = fs.readFileSync(path.join(__dirname, 'fixtures', 'placeholder.png'));

/**
 * Prepares the page before navigation:
 * - Freezes client time
 * - Sets the localStorage theme
 * - Routes external volatile image requests to a local solid placeholder
 */
export async function prepare(page: Page, theme: 'light' | 'dark'): Promise<void> {
  await page.clock.setFixedTime(new Date('2026-01-01T00:00:00Z'));

  await page.addInitScript((t) => {
    localStorage.setItem('theme', t);
  }, theme);

  // Chart.js animates on canvas, which CSS animations: 'disabled' cannot stop.
  // Trap the UMD global assignment and turn animation off before any chart is created.
  await page.addInitScript(() => {
    let chartGlobal: unknown;
    Object.defineProperty(window, 'Chart', {
      configurable: true,
      get: () => chartGlobal,
      set: (value: { defaults?: { animation?: unknown } }) => {
        if (value?.defaults) value.defaults.animation = false;
        chartGlobal = value;
      },
    });
  });

  // Client-side GitHub star counts (src/pages/projects/index.astro) drift live; serve a fixed count
  await page.route('https://api.github.com/repos/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ stargazers_count: 12345 }),
    });
  });

  for (const host of EXTERNAL_IMAGE_HOSTS) {
    await page.route(`**://${host}/**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: placeholderBuffer,
      });
    });
  }
}

/**
 * Stabilizes the page after navigation:
 * - Waits for fonts to load and network to become idle
 * - Scrolls to the bottom and back to trigger lazy assets
 * - Waits until all <img> elements are complete
 * - Asserts the <html> data-theme attribute matches the expected theme
 */
export async function stabilize(page: Page, theme: 'light' | 'dark'): Promise<void> {
  await page.waitForLoadState('domcontentloaded');

  await page.evaluate(async () => {
    if (document.fonts) {
      await document.fonts.ready;
    }
  });

  await page.waitForLoadState('networkidle').catch(() => {
    // networkidle might timeout on long polling or streaming; continue safely
  });

  // Force lazy images to load: a single scroll misses mid-page images on long pages
  await page.evaluate(() => {
    document
      .querySelectorAll('img[loading="lazy"]')
      .forEach((img) => img.setAttribute('loading', 'eager'));
  });

  // Scroll to bottom and back to trigger lazy loaded images
  await page.evaluate(async () => {
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((resolve) => setTimeout(resolve, 100));
    window.scrollTo(0, 0);
  });

  // Wait until every image in the document is complete
  await page.waitForFunction(() => {
    const images = Array.from(document.querySelectorAll('img'));
    return images.every((img) => img.complete);
  });

  // Assert Review Focus 1: html has the expected data-theme attribute
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
}
