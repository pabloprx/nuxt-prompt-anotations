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

## Local development

For making changes to the module while using it in a project:

> Ask Claude Code: "Clone https://github.com/pabloprx/nuxt-prompt-anotations next to my project, install it locally with a file path, and add it to my nuxt modules."

What that does manually:

```bash
# Clone next to your project
git clone git@github.com:pabloprx/nuxt-prompt-anotations.git ../nuxt-prompt-anotations

# Install from local path (changes reflect immediately, no re-install needed)
npm install --save-dev ../nuxt-prompt-anotations
```

Your `nuxt.config.ts` stays the same. Changes to the local clone are picked up on next dev server restart.

## CI note

If you install this as a `devDependency` from a git URL, your CI will need git access to this repo to run `npm install`. Two things to watch:

- **Private repo + SSH URL**: CI needs an SSH key or deploy key with read access. Otherwise `npm install` will fail (not warn, fail).
- **Private repo + HTTPS URL**: CI needs a GitHub token. You can use `git+https://<token>@github.com/pabloprx/nuxt-prompt-anotations.git` or configure git credentials in CI.
- **`npm install --production`** or `NODE_ENV=production`: devDependencies are skipped entirely, so it won't matter. But if your build step needs the module (it likely does for Nuxt), you need it installed.

If your CI doesn't need the devtools module (e.g. production build only), you can skip devDependencies. Otherwise, make sure git access is configured.
