import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';
import path from 'path';

export default defineConfig({
  plugins: [angular()],
  resolve: {
    alias: {
      '@credit-application/domain': path.resolve(__dirname, 'src/app/features/credit-application/domain/index.ts'),
      '@credit-application/application': path.resolve(__dirname, 'src/app/features/credit-application/application/index.ts'),
      '@credit-application/infrastructure': path.resolve(__dirname, 'src/app/features/credit-application/infrastructure/index.ts'),
      '@shared/result': path.resolve(__dirname, 'src/app/shared/result'),
      'crdx-components': path.resolve(__dirname, 'src/testing/crdx-components.mock.ts'),
      '@core/config': path.resolve(__dirname, 'src/app/core/config'),
      '@core/core': path.resolve(__dirname, 'src/app/core/core.ts'),
      '@core/ports': path.resolve(__dirname, 'src/app/core/ports'),
      '@environments/environment': path.resolve(__dirname, 'src/environments/environment.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      exclude: ['src/main.ts', 'src/environments/**', '**/*.spec.ts'],
    },
  },
});
