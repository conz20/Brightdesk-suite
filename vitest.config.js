import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    clearMocks: false,
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
