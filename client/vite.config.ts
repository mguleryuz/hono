import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig, loadEnv } from 'vite'
import viteCompression from 'vite-plugin-compression'

// https://vitejs.dev/config/
export default ({ mode }: { mode: string }) => {
  // Set the server path based on the environment
  const serverPath = path.resolve(__dirname, '../src')

  // Load env vars from parent directory
  const NODE_ENV = process.env.NODE_ENV
  process.env = loadEnv(mode, path.resolve(__dirname, '..'))
  process.env.NODE_ENV = NODE_ENV

  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080
  const isProd = mode === 'production'

  return defineConfig({
    define: {
      'process.env': process.env,
    },
    plugins: [
      tailwindcss(),
      tanstackRouter({}),
      react(),
      // Gzip compression
      viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
        filter: /\.(js|mjs|json|txt|html|xml|svg)$/i,
      }),
      // Brotli compression
      viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
        compressionOptions: {
          level: 11,
        },
        filter: /\.(js|mjs|json|txt|html|xml|svg)$/i,
      }),
      // Bundle analyzer (only in production)
      isProd &&
        visualizer({
          filename: './dist/stats.html',
          open: true,
          gzipSize: true,
          brotliSize: true,
        }),
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': serverPath,
        '@c': path.resolve(__dirname, './src'),
      },
    },
    build: {
      // Enable minification
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      // CSS minification options - use default (esbuild) which is less aggressive
      cssMinify: true,
      // Rollup options for better code splitting
      rollupOptions: {
        output: {
          // Manual chunks to split vendor code
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'ui-vendor': [
              '@radix-ui/react-accordion',
              '@radix-ui/react-alert-dialog',
              '@radix-ui/react-avatar',
              '@radix-ui/react-checkbox',
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-label',
              '@radix-ui/react-popover',
              '@radix-ui/react-select',
              '@radix-ui/react-separator',
              '@radix-ui/react-switch',
              '@radix-ui/react-tabs',
              '@radix-ui/react-tooltip',
            ],
            'wallet-vendor': ['@rainbow-me/rainbowkit', 'wagmi', 'viem'],
            'chart-vendor': ['recharts'],
            'query-vendor': ['@tanstack/react-query', '@tanstack/react-router'],
          },
          // Use content hash for better caching
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        },
      },
      // Set chunk size warning limit
      chunkSizeWarningLimit: 1000,
      // Enable source maps for production
      sourcemap: false,
      // CSS code splitting
      cssCodeSplit: true,
      // Asset inlining threshold
      assetsInlineLimit: 4096,
    },
    optimizeDeps: {
      // Pre-bundle dependencies for faster dev server startup
      include: [
        'react',
        'react-dom',
        '@tanstack/react-query',
        '@tanstack/react-router',
        '@rainbow-me/rainbowkit',
        'wagmi',
        'viem',
      ],
      // Exclude large or problematic dependencies
      exclude: ['@tanstack/router-devtools'],
    },
    server: {
      host: true,
      proxy: {
        '/static': {
          target: `http://127.0.0.1:${PORT}`,
          changeOrigin: true,
        },
        '/api': {
          target: `http://127.0.0.1:${PORT}`,
          changeOrigin: true,
        },
      },
    },
  })
}
