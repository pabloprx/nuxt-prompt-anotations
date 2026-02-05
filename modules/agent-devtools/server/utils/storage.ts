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

interface Annotation {
  id: string
  component: string
  filePath: string
  elementTag: string
  textPreview: string
  comment: string
  timestamp: string
  rect: { x: number; y: number; w: number; h: number }
}

export const clientRequests: CapturedRequest[] = []
export const annotations: Annotation[] = []

export function clearClientRequests() {
  clientRequests.length = 0
}

export function clearAnnotations() {
  annotations.length = 0
}
