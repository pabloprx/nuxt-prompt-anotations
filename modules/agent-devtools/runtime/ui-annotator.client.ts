import { defineNuxtPlugin, useState } from '#imports'
import { h, render } from 'vue'
import AgentToolbar from './components/AgentToolbar.vue'

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

export default defineNuxtPlugin(async (nuxtApp) => {
  const annotating = useState<boolean>('__agent_annotating', () => false)
  const annotations = useState<Annotation[]>('__agent_annotations', () => [])

  // Mount toolbar directly to body using Vue's render
  const container = document.createElement('div')
  container.id = '__agent-devtools-root'
  document.body.appendChild(container)

  // Use nuxtApp's vueApp context for proper reactivity
  const vnode = h(AgentToolbar)
  vnode.appContext = nuxtApp.vueApp._context
  render(vnode, container)

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
