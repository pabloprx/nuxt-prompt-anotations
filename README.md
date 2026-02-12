# nuxt-prompt-annotations

Nuxt module for visualizing and managing AI prompt annotations in your app. Dev-only toolbar that overlays prompt boundaries, token counts, and metadata directly on your UI.

## Setup

1. Clone and install:

```bash
git clone git@github.com:pabloprx/nuxt-prompt-anotations.git ../nuxt-prompt-anotations
cd ../nuxt-prompt-anotations && npm install && cd -
```

2. Add to your `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['../nuxt-prompt-anotations'],
})
```

That's it. The toolbar auto-mounts in dev mode.

## Updating

```bash
cd ../nuxt-prompt-anotations && git pull
```

Then restart your dev server.

## Structure

```
index.ts        - module entry point (defineNuxtModule)
runtime/        - client plugins, components, server middleware
server/         - API routes (/api/__agent/*)
```
