# nuxt-prompt-annotations

Nuxt module for visualizing and managing AI prompt annotations in your app. Dev-only toolbar that overlays prompt boundaries, token counts, and metadata directly on your UI.

## Install

```bash
npm install --save-dev git+ssh://git@github.com:pabloprx/nuxt-prompt-anotations.git
```

Or via HTTPS:

```bash
npm install --save-dev git+https://github.com/pabloprx/nuxt-prompt-anotations.git
```

## Setup

Add the module to your `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-prompt-annotations'],
})
```

That's it. The toolbar auto-mounts in dev mode.
