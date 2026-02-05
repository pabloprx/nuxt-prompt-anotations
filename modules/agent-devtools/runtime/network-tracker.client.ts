import { defineNuxtPlugin, useState } from '#imports'

interface CapturedRequest {
  id: string
  method: string
  url: string
  status: number
  statusText: string
  duration: number
  timestamp: string
  requestHeaders: Record<string, string>
  responseHeaders: Record<string, string>
  requestBody: string | null
  responseBody: string | null
  error: boolean
}

export default defineNuxtPlugin(() => {
  const requests = useState<CapturedRequest[]>('__agent_requests', () => [])
  const originalFetch = globalThis.fetch

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : input.url

    // Skip agent endpoints to avoid infinite recursion
    if (url.includes('/api/__agent/')) {
      return originalFetch(input, init)
    }

    const id = crypto.randomUUID()
    const method = (init?.method ?? 'GET').toUpperCase()
    const timestamp = new Date().toISOString()
    const start = performance.now()

    // Extract request headers
    const requestHeaders: Record<string, string> = {}
    if (init?.headers) {
      const h = new Headers(init.headers)
      h.forEach((value, key) => {
        requestHeaders[key] = value
      })
    }

    // Serialize request body
    let requestBody: string | null = null
    if (init?.body != null) {
      try {
        requestBody = typeof init.body === 'string'
          ? init.body
          : JSON.stringify(init.body)
      } catch {
        requestBody = '[unserializable body]'
      }
    }

    let response: Response
    try {
      response = await originalFetch(input, init)
    } catch (err) {
      // Network error: still record what we can, then re-throw
      try {
        const entry: CapturedRequest = {
          id,
          method,
          url,
          status: 0,
          statusText: 'Network Error',
          duration: Math.round(performance.now() - start),
          timestamp,
          requestHeaders,
          responseHeaders: {},
          requestBody,
          responseBody: null,
          error: true,
        }
        requests.value.push(entry)
        postToServer(entry)
      } catch {
        // Tracking must never break the app
      }
      throw err
    }

    // Capture response data
    try {
      const duration = Math.round(performance.now() - start)

      const responseHeaders: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      let responseBody: string | null = null
      try {
        const cloned = response.clone()
        responseBody = await cloned.text()
      } catch {
        responseBody = '[unable to read body]'
      }

      const entry: CapturedRequest = {
        id,
        method,
        url,
        status: response.status,
        statusText: response.statusText,
        duration,
        timestamp,
        requestHeaders,
        responseHeaders,
        requestBody,
        responseBody,
        error: response.status >= 400,
      }

      requests.value.push(entry)
      postToServer(entry)
    } catch {
      // Tracking must never break the app
    }

    return response
  }

  function postToServer(entry: CapturedRequest) {
    try {
      originalFetch('/api/__agent/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      }).catch(() => {})
    } catch {
      // Silent: fire-and-forget
    }
  }
})
