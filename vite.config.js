import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: { target: 'es2020' },
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.js', 'src/**/*.test.js'],
    globals: false
  }
})
