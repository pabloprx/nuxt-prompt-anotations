import { defineEventHandler } from 'h3'
import { clientRequests, annotations } from '../../utils/storage'
import { serverRequests } from '../../../runtime/network-tracker.server'

function requestTable(rows: Array<{ method?: string; url?: string; status?: number; duration?: number }>): string {
  if (rows.length === 0) return '_None captured._\n'

  const lines = [
    '| Method | URL | Status | Duration |',
    '|--------|-----|--------|----------|',
  ]

  for (const r of rows) {
    const method = r.method ?? '-'
    const url = r.url ?? '-'
    const status = r.status ?? '-'
    const duration = r.duration != null ? `${r.duration}ms` : '-'
    lines.push(`| ${method} | ${url} | ${status} | ${duration} |`)
  }

  return lines.join('\n') + '\n'
}

export default defineEventHandler(() => {
  const now = new Date().toISOString()
  const parts: string[] = []

  parts.push(`# Agent DevTools Export`)
  parts.push(`Generated: ${now}`)
  parts.push('')

  // -- Network Requests --
  parts.push('## Network Requests')
  parts.push('')

  parts.push('### Client Requests')
  parts.push(requestTable(clientRequests))

  parts.push('### Server Requests')
  parts.push(requestTable(serverRequests))

  // -- Failed Requests --
  const allRequests = [...clientRequests, ...serverRequests]
  const failed = allRequests.filter((r) => (r.status ?? 0) >= 400)

  parts.push('## Failed Requests')
  parts.push('')

  if (failed.length === 0) {
    parts.push('_No failed requests._')
  } else {
    for (const r of failed) {
      parts.push(`### ${r.method ?? 'UNKNOWN'} ${r.url ?? 'unknown'}`)
      parts.push(`- **Status**: ${r.status ?? '-'}`)
      parts.push(`- **Duration**: ${r.duration != null ? r.duration + 'ms' : '-'}`)
      parts.push(`- **Timestamp**: ${(r as any).timestamp ?? '-'}`)

      const reqHeaders = (r as any).requestHeaders
      if (reqHeaders && Object.keys(reqHeaders).length > 0) {
        parts.push('- **Request Headers**:')
        for (const [k, v] of Object.entries(reqHeaders)) {
          parts.push(`  - \`${k}\`: ${v}`)
        }
      }

      const resHeaders = (r as any).responseHeaders
      if (resHeaders && Object.keys(resHeaders).length > 0) {
        parts.push('- **Response Headers**:')
        for (const [k, v] of Object.entries(resHeaders)) {
          parts.push(`  - \`${k}\`: ${v}`)
        }
      }

      const reqBody = (r as any).requestBody
      if (reqBody) {
        parts.push(`- **Request Body**: \`${reqBody}\``)
      }

      const resBody = (r as any).responseBody
      if (resBody) {
        parts.push(`- **Response Body**: \`${resBody}\``)
      }

      parts.push('')
    }
  }

  parts.push('')

  // -- Annotations --
  parts.push('## Annotations')
  parts.push('')

  if (annotations.length === 0) {
    parts.push('_No annotations._')
  } else {
    parts.push('| # | Component | File | Comment |')
    parts.push('|---|-----------|------|---------|')
    annotations.forEach((a, i) => {
      parts.push(`| ${i + 1} | ${a.component} | ${a.filePath || '-'} | ${a.comment} |`)
    })

    parts.push('')
    parts.push('### Annotation Details')
    parts.push('')

    annotations.forEach((a, i) => {
      parts.push(`#### ${i + 1}. ${a.component}`)
      parts.push(`- **File**: ${a.filePath || '-'}`)
      parts.push(`- **Element**: \`<${a.elementTag}>\``)
      parts.push(`- **Text Preview**: ${a.textPreview || '-'}`)
      parts.push(`- **Comment**: ${a.comment}`)
      parts.push(`- **Timestamp**: ${a.timestamp}`)
      parts.push(`- **Position**: x=${a.rect.x} y=${a.rect.y} w=${a.rect.w} h=${a.rect.h}`)
      parts.push('')
    })
  }

  const markdown = parts.join('\n')
  return { markdown }
})
