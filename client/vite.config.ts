import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

// https://vitejs.dev/config/
export default ({ mode }: { mode: string }) => {
  // Load env vars from parent directory
  process.env = {
    ...process.env,
    ...loadEnv(mode, path.resolve(__dirname, '..')),
  }

  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080

  return defineConfig({
    define: {
      'process.env': process.env,
    },
    plugins: [TanStackRouterVite({}), react()],
    resolve: {
      alias: {
        '@c': path.resolve(__dirname, './src'),
      },
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
