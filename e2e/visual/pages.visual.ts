import { expect, test } from '@playwright/test';

import { PAGES } from './pages';
import { MASK_SELECTORS, prepare, stabilize } from './stabilize';

const THEMES: ('light' | 'dark')[] = ['light', 'dark'];

for (const entry of PAGES) {
  for (const theme of THEMES) {
    test(`${entry.name} [${theme}]`, async ({ page }) => {
      await prepare(page, theme);
      await page.goto(entry.path);
      await stabilize(page, theme);

      await expect(page).toHaveScreenshot(`${entry.name}-${theme}.png`, {
        fullPage: true,
        mask: MASK_SELECTORS.map((s) => page.locator(s)),
      });
    });
  }
}
