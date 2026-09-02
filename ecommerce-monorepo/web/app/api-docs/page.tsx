'use client'

import React, { useEffect } from 'react'
import Head from 'next/head'

export default function ApiDocsPage() {
  useEffect(() => {
    // Dynamically load Swagger UI CSS and bundle
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css'
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js'
    script.async = true
    script.onload = () => {
      // @ts-ignore
      if (window.SwaggerUIBundle) {
        // @ts-ignore
        window.SwaggerUIBundle({
          url: '/api/openapi.json',
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [
            // @ts-ignore
            window.SwaggerUIBundle.presets.apis,
            // @ts-ignore
            window.SwaggerUIBundle.SwaggerUIStandalonePreset,
          ],
          layout: 'BaseLayout',
        })
      }
    }
    document.body.appendChild(script)

    return () => {
      if (document.head.contains(link)) document.head.removeChild(link)
      if (document.body.contains(script)) document.body.removeChild(script)
    }
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-[#1a3a5c] text-white py-6 px-4 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">API Documentation & Swagger UI</h1>
            <p className="text-sm text-gray-300 mt-1">
              Interactive REST API specification for Global Trade platform
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/api/openapi.json"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-[#c9a84c] text-slate-900 font-semibold rounded-lg text-sm hover:bg-[#d8b85c] transition-colors"
            >
              Raw OpenAPI JSON
            </a>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div id="swagger-ui" />
      </div>
    </div>
  )
}
