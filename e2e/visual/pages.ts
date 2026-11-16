export interface PageEntry {
  name: string;
  path: string;
}

export const PAGES: PageEntry[] = [
  { name: 'home', path: '/' },
  { name: '404', path: '/404.html' },
  { name: 'news', path: '/news/' },
  { name: 'cv', path: '/cv/' },
  { name: 'books', path: '/books/' },
  { name: 'repositories', path: '/repositories/' },
  { name: 'people', path: '/people/' },
  { name: 'teaching', path: '/teaching/' },
  { name: 'publications', path: '/publications/' },
  { name: 'publication-detail', path: '/publications/einstein1905relativity/' },
  { name: 'projects', path: '/projects/' },
  { name: 'project-detail', path: '/projects/general-relativity/' },
  { name: 'blog', path: '/blog/' },
  { name: 'blog-category', path: '/blog/category/demo/' },
  { name: 'blog-tag', path: '/blog/tag/code/' },
  { name: 'blog-year', path: '/blog/year/2025/' },
  { name: 'blog-tags', path: '/blog/tags/' },
  { name: 'blog-code-blocks', path: '/blog/code-blocks/' },
  { name: 'blog-math-typesetting', path: '/blog/math-typesetting/' },
  { name: 'blog-images-and-figures', path: '/blog/images-and-figures/' },
  { name: 'blog-diagrams-with-mermaid', path: '/blog/diagrams-with-mermaid/' },
  { name: 'blog-formatting-examples', path: '/blog/formatting-examples/' },
  { name: 'blog-distill-style-post', path: '/blog/distill-style-post/' },
  { name: 'blog-algorithms-pseudocode', path: '/blog/algorithms-pseudocode/' },
  { name: 'blog-charts-with-chartjs', path: '/blog/charts-with-chartjs/' },
  { name: 'blog-jupyter-notebook', path: '/blog/jupyter-notebook/' },
];
