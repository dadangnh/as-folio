/// <reference types="vitest" />
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, 'src/components'),
      '@layouts': path.resolve(__dirname, 'src/layouts'),
      '@styles': path.resolve(__dirname, 'src/styles'),
      '@assets': path.resolve(__dirname, 'src/assets'),
      '@config': path.resolve(__dirname, 'src/config'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@content': path.resolve(__dirname, 'src/content'),
      '@data': path.resolve(__dirname, 'src/data'),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}', 'scripts/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    css: false,
    reporters: ['default', ['junit', { suiteName: 'Unit Tests' }]],
    outputFile: {
      junit: './test-results/unit-results.xml',
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/pages/**/*', 'src/content.config.ts'],
      reporter: ['lcov', 'text', 'cobertura'],
    },
  },
});
