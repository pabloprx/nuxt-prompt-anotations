import { defineNuxtPlugin, useState } from '#imports'
import { createApp } from 'vue'
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

  // Create a sub-application for the toolbar with proper Vue context
  const container = document.createElement('div')
  container.id = '__agent-devtools-root'
  document.body.appendChild(container)

  // Create sub-app and copy over Nuxt's global components, directives, provides
  const subApp = createApp(AgentToolbar)

  // Copy global properties from Nuxt's Vue app
  const mainApp = nuxtApp.vueApp
  subApp.config.globalProperties = mainApp.config.globalProperties

  // Copy components (AgentAnnotationOverlay, AgentExportPanel)
  const ctx = mainApp._context
  if (ctx.components) {
    for (const [name, comp] of Object.entries(ctx.components)) {
      subApp.component(name, comp as any)
    }
  }

  // Copy provides (useState needs this)
  if (ctx.provides) {
    for (const [key, val] of Object.entries(ctx.provides)) {
      subApp.provide(key, val)
    }
  }

  subApp.mount(container)

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
