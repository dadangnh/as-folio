import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { normalizeHtml, compareDist, CSS_BUNDLES_ENTRY } from './compare-dist';

describe('compare-dist', () => {
  describe('normalizeHtml', () => {
    it('normalizes hashed script and style filenames', () => {
      const htmlA =
        '<script src="/_astro/SearchTrigger.astro_astro_type_script_index_0_lang.CLmTwsfW.js"></script><link rel="stylesheet" href="/_s/BWGhwEio.css">';
      const htmlB =
        '<script src="/_astro/SearchTrigger.astro_astro_type_script_index_0_lang.RpmsRbDy.js"></script><link rel="stylesheet" href="/_s/bJmZYzdk.css">';

      expect(normalizeHtml(htmlA)).toBe(normalizeHtml(htmlB));
    });

    it('leaves non-hashed URLs unchanged', () => {
      const html = '<link rel="icon" href="/favicon.svg"><a href="/blog/code-blocks/">Post</a>';
      expect(normalizeHtml(html)).toBe(html);
    });
  });

  describe('compareDist', () => {
    let dirA: string;
    let dirB: string;

    beforeEach(() => {
      const baseTemp = fs.mkdtempSync(path.join(os.tmpdir(), 'compare-dist-test-'));
      dirA = path.join(baseTemp, 'a');
      dirB = path.join(baseTemp, 'b');
      fs.mkdirSync(dirA, { recursive: true });
      fs.mkdirSync(dirB, { recursive: true });
    });

    afterEach(() => {
      fs.rmSync(path.dirname(dirA), { recursive: true, force: true });
    });

    it('detects missing files, changed files, and ignores asset hashes and pagefind', () => {
      // Identical file
      fs.writeFileSync(path.join(dirA, 'same.html'), '<p>Same</p>');
      fs.writeFileSync(path.join(dirB, 'same.html'), '<p>Same</p>');

      // Differing only by asset hash
      fs.writeFileSync(
        path.join(dirA, 'hash-diff.html'),
        '<script src="/_astro/foo.12345678.js"></script>',
      );
      fs.writeFileSync(
        path.join(dirB, 'hash-diff.html'),
        '<script src="/_astro/foo.abcdefgh.js"></script>',
      );

      // Real text change
      fs.writeFileSync(path.join(dirA, 'real.html'), '<h1>Hello</h1>');
      fs.writeFileSync(path.join(dirB, 'real.html'), '<h1>World</h1>');

      // File only in A
      fs.writeFileSync(path.join(dirA, 'gone.html'), 'Gone');

      // Pagefind ignored
      fs.mkdirSync(path.join(dirA, 'pagefind'), { recursive: true });
      fs.mkdirSync(path.join(dirB, 'pagefind'), { recursive: true });
      fs.writeFileSync(path.join(dirA, 'pagefind', 'pagefind.js'), 'foo');
      fs.writeFileSync(path.join(dirB, 'pagefind', 'pagefind.js'), 'bar');
      fs.writeFileSync(path.join(dirA, 'pagefind', 'only-in-a.js'), 'bar');

      // Files under _astro/ and _s/ compared by normalized name presence only, never by bytes
      fs.mkdirSync(path.join(dirA, '_astro'), { recursive: true });
      fs.mkdirSync(path.join(dirB, '_astro'), { recursive: true });
      fs.writeFileSync(path.join(dirA, '_astro', 'chunk.12345678.js'), 'content A');
      fs.writeFileSync(path.join(dirB, '_astro', 'chunk.87654321.js'), 'content B differing');

      fs.mkdirSync(path.join(dirA, '_s'), { recursive: true });
      fs.mkdirSync(path.join(dirB, '_s'), { recursive: true });
      fs.writeFileSync(path.join(dirA, '_s', '12345678.css'), 'style A');
      fs.writeFileSync(path.join(dirB, '_s', '87654321.css'), 'style A');

      const result = compareDist(dirA, dirB);
      expect(result).toEqual({
        onlyInA: ['gone.html'],
        onlyInB: [],
        changed: ['real.html'],
      });
    });
    it('reports CSS bundle content changes even though names are hash-only', () => {
      fs.mkdirSync(path.join(dirA, '_s'), { recursive: true });
      fs.mkdirSync(path.join(dirB, '_s'), { recursive: true });
      fs.writeFileSync(path.join(dirA, '_s', 'AAAAAAAA.css'), '.a{color:red}');
      fs.writeFileSync(path.join(dirB, '_s', 'BBBBBBBB.css'), '.a{color:#f00}');
      expect(compareDist(dirA, dirB).changed).toEqual([CSS_BUNDLES_ENTRY]);
    });

    it('compares non-HTML files byte-for-byte', () => {
      fs.mkdirSync(path.join(dirA, 'og'), { recursive: true });
      fs.mkdirSync(path.join(dirB, 'og'), { recursive: true });
      fs.writeFileSync(path.join(dirA, 'og', 'x.png'), Buffer.from([0x89, 0x50, 0xff, 0xfe]));
      fs.writeFileSync(path.join(dirB, 'og', 'x.png'), Buffer.from([0x89, 0x50, 0xff, 0xfd]));
      expect(compareDist(dirA, dirB).changed).toEqual(['og/x.png']);
    });

    it('byte-compares optimised images in _astro/ but not JS chunks', () => {
      fs.mkdirSync(path.join(dirA, '_astro'), { recursive: true });
      fs.mkdirSync(path.join(dirB, '_astro'), { recursive: true });
      fs.writeFileSync(path.join(dirA, '_astro', 'photo.Ab12Cd34_Z1abcd.webp'), 'pixels A');
      fs.writeFileSync(path.join(dirB, '_astro', 'photo.Ab12Cd34_Z1abcd.webp'), 'pixels B');
      fs.writeFileSync(path.join(dirA, '_astro', 'page.Ab12Cd34.js'), 'let a');
      fs.writeFileSync(path.join(dirB, '_astro', 'page.Ab12Cd34.js'), 'var a');
      expect(compareDist(dirA, dirB).changed).toEqual(['_astro/photo.Ab12Cd34_Z1abcd.webp']);
    });
  });
});
