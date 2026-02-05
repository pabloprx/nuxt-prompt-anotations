# Nuxt Agent DevTools POC - Implementation Session

Date: 2026-02-05

## What was done

Built the entire Nuxt Agent DevTools POC from an empty directory skeleton. 20 source files created across 6 phases.

## Phase 1: Project Bootstrap

Files created:
- `package.json` - Nuxt 3 + Vue 3 + TypeScript deps
- `nuxt.config.ts` - Registers `~/modules/agent-devtools` module
- `tsconfig.json` - Extends `.nuxt/tsconfig.json`

## Phase 2: Module Core

- `modules/agent-devtools/index.ts` - Module entry point using `defineNuxtModule`. Registers:
  - 2 client plugins (network-tracker, ui-annotator)
  - Component directory (runtime/components with `Agent` prefix)
  - 6 server API routes under `/api/__agent/`
  - 1 server middleware for request tracking
  - Only activates in dev mode (`nuxt.options.dev`)

## Phase 3: Network Tracker

- `modules/agent-devtools/runtime/network-tracker.client.ts` - Client plugin that monkey-patches `globalThis.fetch`. Captures: id, method, url, status, statusText, duration, timestamp, request/response headers, request/response body, error flag. Stores in `useState('__agent_requests')` + fire-and-forget POST to server. Skips `/api/__agent/` paths to avoid recursion.

- `modules/agent-devtools/runtime/network-tracker.server.ts` - h3 middleware that captures server-side `/api/` requests. Uses `event.node.res.on('finish')` to capture status and duration after handler completes. Exports `serverRequests` array and `clearServerRequests()`.

## Phase 4: UI Annotator

- `modules/agent-devtools/runtime/ui-annotator.client.ts` - Client plugin managing annotation mode state via `useState`. Registers Cmd+Shift+A keyboard shortcut. Fetches existing annotations on startup.

- `modules/agent-devtools/runtime/components/AgentToolbar.vue` - Floating toolbar (fixed bottom-right, z-index 99999) with 3 buttons: Annotate, Network, Export. Dark theme (#1a1a2e). Network panel shows scrollable request list color-coded by status. Panels are mutually exclusive. Teleported to body.

- `modules/agent-devtools/runtime/components/AnnotationOverlay.vue` - Full annotation overlay. Mousemove highlights elements with bounding rect + component label. Resolves Vue component name/file by walking `__vueParentComponent` chain. Click opens floating comment input. Enter submits annotation (stored in state + POSTed to server). Shows numbered pins at annotated positions.

- `modules/agent-devtools/runtime/components/ExportPanel.vue` - Modal panel fetching markdown from `/api/__agent/export`. Displays in `<pre>` block. Copy-to-clipboard with "Copied!" confirmation. Backdrop click to close.

## Phase 5: Server API

- `modules/agent-devtools/server/utils/storage.ts` - Shared in-memory storage: `clientRequests[]`, `annotations[]`, and clear functions.

- `modules/agent-devtools/server/api/__agent/requests.get.ts` - Returns `{ client, server }` request arrays
- `modules/agent-devtools/server/api/__agent/requests.post.ts` - Stores client-POSTed request entries
- `modules/agent-devtools/server/api/__agent/annotations.get.ts` - Returns annotations array
- `modules/agent-devtools/server/api/__agent/annotations.post.ts` - Stores annotation entries
- `modules/agent-devtools/server/api/__agent/export.get.ts` - Generates markdown report with: client/server request tables, failed request details (headers, body), annotation summary table + detail blocks
- `modules/agent-devtools/server/api/__agent/clear.delete.ts` - Clears all stored data

## Phase 6: Demo App

- `components/ProductCard.vue` - Product card with image placeholder, name, price
- `components/Header.vue` - Dark gradient header with title/subtitle
- `pages/index.vue` - Demo page with 6 product cards in grid, "Trigger Error" button that POSTs to `/api/demo`, error display, and `<AgentToolbar />` component
- `server/api/demo.post.ts` - Returns 422 with validation error details

## Verification Results

1. `npm install` - Clean (600 packages, 0 vulnerabilities)
2. `nuxt build` - Passes with zero errors (141 client modules, 75 server modules)
3. Dev server starts without warnings
4. API endpoint smoke tests:
   - `GET /api/__agent/requests` - returns `{ client: [], server: [] }` initially
   - `POST /api/demo` - returns 422 with validation errors as expected
   - `GET /api/__agent/requests` (after demo) - server tracker captured the 422 request with full headers, status (422), duration (9ms)
   - `GET /api/__agent/export` - generates correct markdown with request tables and failed request details
   - `DELETE /api/__agent/clear` - returns `{ ok: true }`, clears all data

## Fix applied during review

- `ExportPanel.vue` was calling `res.text()` but the export endpoint returns JSON `{ markdown }`. Fixed to use `res.json()` and extract `.markdown`.

## File inventory (19 source files)

```
components/Header.vue
components/ProductCard.vue
modules/agent-devtools/index.ts
modules/agent-devtools/runtime/components/AgentToolbar.vue
modules/agent-devtools/runtime/components/AnnotationOverlay.vue
modules/agent-devtools/runtime/components/ExportPanel.vue
modules/agent-devtools/runtime/network-tracker.client.ts
modules/agent-devtools/runtime/network-tracker.server.ts
modules/agent-devtools/runtime/ui-annotator.client.ts
modules/agent-devtools/server/api/__agent/annotations.get.ts
modules/agent-devtools/server/api/__agent/annotations.post.ts
modules/agent-devtools/server/api/__agent/clear.delete.ts
modules/agent-devtools/server/api/__agent/export.get.ts
modules/agent-devtools/server/api/__agent/requests.get.ts
modules/agent-devtools/server/api/__agent/requests.post.ts
modules/agent-devtools/server/utils/storage.ts
nuxt.config.ts
package.json
pages/index.vue
server/api/demo.post.ts
tsconfig.json
```
