import { Api } from '@/api'
import { OpenApi } from '@effect/platform'
import { Hono } from 'hono'

export const docs = new Hono()

// Serve OpenAPI JSON specification
docs.get('/openapi.json', (c) => {
  try {
    const openApiSpec = OpenApi.fromApi(Api)

    // Add server configuration to ensure proper base path
    const specWithServers = {
      ...openApiSpec,
      servers: [
        {
          url: '/api',
          description: 'API Server',
        },
      ],
    }

    return c.json(specWithServers)
  } catch (error) {
    console.error('Error generating OpenAPI spec:', error)
    return c.json({ error: 'Failed to generate API documentation' }, 500)
  }
})

// Serve Swagger UI documentation interface
docs.get('/', (c) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>API Documentation</title>
      <meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
      <style>
        html {
          box-sizing: border-box;
          overflow: -moz-scrollbars-vertical;
          overflow-y: scroll;
        }
        *, *:before, *:after {
          box-sizing: inherit;
        }
        body {
          margin:0;
          background: #fafafa;
        }
      </style>
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js" charset="UTF-8"></script>
      <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js" charset="UTF-8"></script>
      <script>
        window.onload = function() {
          const ui = SwaggerUIBundle({
            url: '/api/docs/openapi.json',
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
              SwaggerUIBundle.presets.apis,
              SwaggerUIStandalonePreset
            ],
            plugins: [
              SwaggerUIBundle.plugins.DownloadUrl
            ],
            layout: "StandaloneLayout",
            tryItOutEnabled: true,
            requestInterceptor: (request) => {
              // Add any custom headers or authentication here if needed
              return request;
            }
          });
        };
      </script>
    </body>
    </html>
  `

  return c.html(html)
})
