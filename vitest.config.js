import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: [
      'packages/**/*.{test,spec}.js',
      'apps/**/*.{test,spec}.js'
    ],
    exclude: [
      '**/node_modules/**', 
      '**/dist/**', 
      'Brightdesk-Workspace/**', 
      'Brightdesk-Forms/**'
    ],
  },
});
