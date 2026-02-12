import { defineEventHandler, getRequestURL, getRequestHeaders, getMethod } from 'h3'

interface ServerCapturedRequest {
  id: string
  method: string
  url: string
  timestamp: string
  requestHeaders: Record<string, string>
  status?: number
  duration?: number
}

export const serverRequests: ServerCapturedRequest[] = []

export function clearServerRequests() {
  serverRequests.length = 0
}

const SKIP_PREFIXES = ['/__nuxt', '/api/__agent', '/_nuxt']

export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  const pathname = url.pathname

  // Only track /api/ routes, skip static assets and agent paths
  if (!pathname.startsWith('/api/')) return
  if (SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return

  const id = crypto.randomUUID()
  const method = getMethod(event)
  const timestamp = new Date().toISOString()
  const requestHeaders = getRequestHeaders(event) as Record<string, string>
  const start = performance.now()

  const entry: ServerCapturedRequest = {
    id,
    method,
    url: url.href,
    timestamp,
    requestHeaders,
  }

  // Capture response info after the handler completes
  event.node.res.on('finish', () => {
    try {
      entry.status = event.node.res.statusCode
      entry.duration = Math.round(performance.now() - start)
      serverRequests.push(entry)
    } catch {
      // Never break the request flow
    }
  })
})
