import type { Context } from 'hono'

export const serveClientHtml = async (c: Context) => {
  try {
    const response = await fetch('http://localhost:5173')
    let html = await response.text()

    // Replace relative paths with absolute URLs
    html = html
      .replace('/@vite/client', 'http://localhost:5173/@vite/client')
      .replace('/src/main.tsx', 'http://localhost:5173/src/main.tsx')
      .replace('/@react-refresh', 'http://localhost:5173/@react-refresh')

    return c.html(html)
  } catch (error) {
    console.error('Failed to fetch Vite dev server HTML:', error)
    return c.text('Failed to load application', 500)
  }
}
