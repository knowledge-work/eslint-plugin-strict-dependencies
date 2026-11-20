import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    clearMocks: true,
    include: ['__tests__/**/*.js'],
  },
})
