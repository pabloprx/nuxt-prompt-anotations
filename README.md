# nuxt-prompt-annotations

Nuxt module for visualizing and managing AI prompt annotations in your app. Dev-only toolbar that overlays prompt boundaries, token counts, and metadata directly on your UI.

## Setup

1. Clone this repo next to your project:

```bash
git clone git@github.com:pabloprx/nuxt-prompt-anotations.git ../nuxt-prompt-anotations
```

2. Add it to your `nuxt.config.ts` as a local path:

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
