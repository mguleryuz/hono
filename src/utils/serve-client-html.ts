import type { Context } from 'hono'

export const serveClientHtml = (c: Context) => {
  return c.html(`
        <!DOCTYPE html>
        <html data-theme="dark">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
            <link rel="stylesheet" href="http://localhost:5173/src/styles/global.css" />
            <title>Hono Vite Client</title>
          </head>
          <body>
            <div id="root"></div>
            <div id="app"></div>
            <script type="module">
              import RefreshRuntime from 'http://localhost:5173/@react-refresh'
              RefreshRuntime.injectIntoGlobalHook(window)
              window.$RefreshReg$ = () => {}
              window.$RefreshSig$ = () => (type) => type
              window.__vite_plugin_react_preamble_installed__ = true
            </script>
            <script type="module" src="http://localhost:5173/@vite/client"></script>
            <script type="module" src="http://localhost:5173/src/main.tsx"></script>
          </body>
        </html>
    `)
}
