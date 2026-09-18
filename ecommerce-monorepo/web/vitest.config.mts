import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [path.resolve(__dirname, 'vitest.setup.ts')],
    include: ['**/*.test.{ts,tsx}'],
    css: false,
    server: {
      deps: {
        inline: true,
      },
    },
  },
  server: {
    fs: {
      strict: false,
    },
  },
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  resolve: {
    preserveSymlinks: true,
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@monorepo/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
      'zod': path.resolve(__dirname, 'node_modules/zod'),
    },
  },
})
