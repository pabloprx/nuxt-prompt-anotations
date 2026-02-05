import { defineNuxtPlugin, useState } from '#imports'

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

export default defineNuxtPlugin(async () => {
  const annotating = useState<boolean>('__agent_annotating', () => false)
  const annotations = useState<Annotation[]>('__agent_annotations', () => [])

  // Keyboard shortcut: Cmd+Shift+A toggles annotation mode
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.metaKey && e.shiftKey && e.key === 'a') {
      e.preventDefault()
      annotating.value = !annotating.value
    }
  })

  // Fetch existing annotations on startup
  try {
    const res = await fetch('/api/__agent/annotations')
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) {
        annotations.value = data
      }
    }
  } catch {
    // Silent: annotations API may not be ready yet
  }
})
