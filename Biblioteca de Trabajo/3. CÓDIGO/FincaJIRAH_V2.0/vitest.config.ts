import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary'],
      include: ['lib/services/**', 'lib/adapters/**', 'lib/state/**', 'lib/observers/**', 'lib/repositories/DashboardRepository.ts'],
      exclude: [
        'lib/services/offline.service.ts',   // fuera de alcance (hook de dispositivo)
      ],
      thresholds: {
        lines: 85,
        branches: 70,
        functions: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
