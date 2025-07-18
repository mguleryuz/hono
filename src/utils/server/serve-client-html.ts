import { readFileSync } from 'fs'
import { join } from 'path'
import { getAuthMethod } from '@/utils/env'
import type { Context } from 'hono'

const appConfig = {
  AUTH_METHOD: getAuthMethod(),
}

declare global {
  interface Window {
    APP_CONFIG: typeof appConfig
  }
}

export const serveClientHtml = async (c: Context) => {
  try {
    const response = await fetch('http://localhost:5173')
    let html = await response.text()

    // Replace relative paths with absolute URLs
    html = html
      .replace('/@vite/client', 'http://localhost:5173/@vite/client')
      .replace('/src/main.tsx', 'http://localhost:5173/src/main.tsx')
      .replace('/@react-refresh', 'http://localhost:5173/@react-refresh')

    // Inject APP_CONFIG into HTML
    const configScript = `
      <script>
        window.APP_CONFIG = ${JSON.stringify(appConfig)};
      </script>
    `

    // Insert the config script before the closing </head> tag
    html = html.replace('</head>', `${configScript}</head>`)

    return c.html(html)
  } catch (error) {
    console.error('Failed to fetch Vite dev server HTML:', error)
    return c.text('Failed to load application', 500)
  }
}

export const serveProductionHtml = async (c: Context) => {
  try {
    // Read the built HTML file
    const htmlPath = join(process.cwd(), 'client/dist/index.html')
    let html = readFileSync(htmlPath, 'utf-8')

    // Inject APP_CONFIG into HTML
    const configScript = `
      <script>
        window.APP_CONFIG = ${JSON.stringify(appConfig)};
      </script>
    `

    // Insert the config script before the closing </head> tag
    html = html.replace('</head>', `${configScript}</head>`)

    return c.html(html)
  } catch (error) {
    console.error('Failed to serve production HTML:', error)
    return c.text('Failed to load application', 500)
  }
}
