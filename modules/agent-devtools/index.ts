import { defineNuxtModule, addPlugin, addComponentsDir, addServerHandler, createResolver } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'agent-devtools',
    configKey: 'agentDevtools',
  },
  defaults: {
    enabled: true,
  },
  setup(options, nuxt) {
    if (!options.enabled || !nuxt.options.dev) return

    const { resolve } = createResolver(import.meta.url)

    // Client plugins
    addPlugin({ src: resolve('./runtime/network-tracker.client'), mode: 'client' })
    addPlugin({ src: resolve('./runtime/ui-annotator.client'), mode: 'client' })

    // Components
    addComponentsDir({ path: resolve('./runtime/components'), prefix: 'Agent' })

    // Server API routes
    const apiRoutes = [
      { route: '/api/__agent/requests', handler: resolve('./server/api/__agent/requests.get') },
      { route: '/api/__agent/requests', handler: resolve('./server/api/__agent/requests.post'), method: 'post' as const },
      { route: '/api/__agent/annotations', handler: resolve('./server/api/__agent/annotations.get') },
      { route: '/api/__agent/annotations', handler: resolve('./server/api/__agent/annotations.post'), method: 'post' as const },
      { route: '/api/__agent/annotations/:id', handler: resolve('./server/api/__agent/annotations/[id].delete'), method: 'delete' as const },
      { route: '/api/__agent/export', handler: resolve('./server/api/__agent/export.get') },
      { route: '/api/__agent/clear', handler: resolve('./server/api/__agent/clear.delete'), method: 'delete' as const },
    ]

    for (const route of apiRoutes) {
      addServerHandler(route)
    }

    // Server middleware for request tracking
    addServerHandler({
      handler: resolve('./runtime/network-tracker.server'),
      middleware: true,
    })
  },
})
