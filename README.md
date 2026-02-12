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

The toolbar auto-mounts in dev mode. No extra components or config needed.

## Structure

```
index.ts        - module entry point (defineNuxtModule)
runtime/        - client plugins, components, server middleware
server/         - API routes (/api/__agent/*)
```

## Local development

Clone next to your project and install from the local path:

```bash
git clone git@github.com:pabloprx/nuxt-prompt-anotations.git ../nuxt-prompt-anotations
npm install --save-dev ../nuxt-prompt-anotations
```

Changes to the local clone are picked up on next dev server restart.

## CI

If installed as a `devDependency` from a git URL, CI needs git access to this repo for `npm install`:

- **SSH URL**: CI needs an SSH key or deploy key with read access.
- **HTTPS URL**: CI needs a GitHub token. Use `git+https://<token>@github.com/pabloprx/nuxt-prompt-anotations.git` or configure git credentials.
- **`npm install --production`** or `NODE_ENV=production`: devDependencies are skipped. But if your build needs the module (likely for Nuxt), it must be installed.
