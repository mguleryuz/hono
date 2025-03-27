import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

// https://vitejs.dev/config/
export default ({ mode }: { mode: string }) => {
  // Set the server path based on the environment
  const serverPath =
    process.env.NODE_ENV === 'production'
      ? path.resolve(__dirname, '../dist')
      : path.resolve(__dirname, '../src')

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
        '@': serverPath,
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
