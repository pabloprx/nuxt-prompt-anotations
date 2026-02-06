<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useState } from '#imports'

const emit = defineEmits<{ close: [] }>()

const selectedRequestIds = useState<string[]>('__agent_selected_requests', () => [])
const annotations = useState<any[]>('__agent_annotations')

const loading = ref(true)
const copied = ref(false)
const errorMessage = ref('')

// Server data: full request objects for selected IDs + annotations
const serverRequests = ref<any[]>([])
const serverAnnotations = ref<any[]>([])
const expandedItems = ref(new Set<string>())

onMounted(async () => {
  window.addEventListener('keydown', onEscape)

  try {
    const res = await fetch('/api/__agent/export')
    if (res.ok) {
      const data = await res.json()
      serverRequests.value = data.requests ?? []
      serverAnnotations.value = data.annotations ?? []
    } else {
      errorMessage.value = 'Could not fetch export data.'
    }
  } catch {
    errorMessage.value = 'Network error fetching export.'
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onEscape)
})

function onEscape(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

// Only show requests that were selected in the network panel
const selectedRequests = computed(() => {
  const ids = new Set(selectedRequestIds.value)
  return serverRequests.value.filter((r: any) => ids.has(r.id))
})

function toggleExpand(id: string) {
  if (expandedItems.value.has(id)) expandedItems.value.delete(id)
  else expandedItems.value.add(id)
  expandedItems.value = new Set(expandedItems.value)
}

function statusColor(status: number): string {
  if (!status || status >= 400) return '#ff4757'
  if (status >= 300) return '#ffa502'
  return '#2ed573'
}

function formatHeaders(headers: Record<string, string> | undefined): string {
  if (!headers || Object.keys(headers).length === 0) return ''
  return Object.entries(headers).map(([k, v]) => `  ${k}: ${v}`).join('\n')
}

const hasContent = computed(() => selectedRequests.value.length > 0 || serverAnnotations.value.length > 0)

// Build markdown from selected requests + all annotations
const composedMarkdown = computed(() => {
  const parts: string[] = []

  if (selectedRequests.value.length > 0) {
    parts.push('## Network Requests\n')
    for (const r of selectedRequests.value) {
      parts.push(`### ${r.method} ${r.url}`)
      parts.push(`- **Status**: ${r.status ?? 'ERR'}`)
      if (r.duration != null) parts.push(`- **Duration**: ${r.duration}ms`)
      if (r.timestamp) parts.push(`- **Timestamp**: ${r.timestamp}`)

      if (r.requestHeaders && Object.keys(r.requestHeaders).length > 0) {
        parts.push('- **Request Headers**:')
        for (const [k, v] of Object.entries(r.requestHeaders)) {
          parts.push(`  - \`${k}\`: ${v}`)
        }
      }
      if (r.requestBody) parts.push(`- **Request Body**: \`${r.requestBody}\``)

      if (r.responseHeaders && Object.keys(r.responseHeaders).length > 0) {
        parts.push('- **Response Headers**:')
        for (const [k, v] of Object.entries(r.responseHeaders)) {
          parts.push(`  - \`${k}\`: ${v}`)
        }
      }
      if (r.responseBody) parts.push(`- **Response Body**: \`${r.responseBody}\``)
      parts.push('')
    }
  }

  if (serverAnnotations.value.length > 0) {
    parts.push('## Annotations\n')
    for (const a of serverAnnotations.value) {
      parts.push(`### ${a.component}`)
      parts.push(`- **Comment**: ${a.comment}`)
      parts.push(`- **File**: \`${a.filePath || '-'}\``)
      parts.push(`- **Selector**: \`${a.cssSelector || '-'}\``)
      if (a.cssClasses) parts.push(`- **Classes**: \`${a.cssClasses}\``)
      parts.push('')
    }
  }

  return parts.join('\n')
})

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(composedMarkdown.value)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = composedMarkdown.value
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

function removeRequest(id: string) {
  selectedRequestIds.value = selectedRequestIds.value.filter((i) => i !== id)
}
</script>

<template>
  <Teleport to="body">
    <div class="agent-export-backdrop" @click.self="emit('close')">
      <Transition name="agent-export-panel" appear>
        <div class="agent-export">
          <div class="agent-export__header">
            <span class="agent-export__title">Export Prompt</span>
            <div class="agent-export__actions">
              <button
                class="agent-export__btn"
                :class="{ 'agent-export__btn--copied': copied }"
                :disabled="!hasContent"
                @click="copyToClipboard"
              >
                {{ copied ? 'Copied!' : 'Copy to Clipboard' }}
              </button>
              <button class="agent-export__close" @click="emit('close')">&times;</button>
            </div>
          </div>

          <div class="agent-export__body">
            <div v-if="loading" class="agent-export__loading">Loading...</div>
            <div v-else-if="errorMessage" class="agent-export__loading">{{ errorMessage }}</div>
            <div v-else-if="!hasContent" class="agent-export__empty-state">
              <div class="agent-export__empty-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="2,12 6,4 10,16 14,8 18,14 22,6" />
                </svg>
              </div>
              <p>No requests selected.</p>
              <p class="agent-export__empty-hint">Open the Network panel and check the requests you want to include.</p>
            </div>
            <div v-else>
              <!-- Selected requests -->
              <div v-if="selectedRequests.length" class="agent-export__group">
                <div class="agent-export__group-header">
                  Requests ({{ selectedRequests.length }})
                </div>

                <div
                  v-for="req in selectedRequests"
                  :key="req.id"
                  class="agent-export__item"
                >
                  <div class="agent-export__item-row">
                    <span
                      class="agent-export__item-status"
                      :style="{ color: statusColor(req.status) }"
                    >{{ req.status || 'ERR' }}</span>
                    <span class="agent-export__item-method">{{ req.method }}</span>
                    <span class="agent-export__item-url" :title="req.url">{{ req.url }}</span>
                    <span class="agent-export__item-meta">{{ req.duration }}ms</span>
                    <button
                      class="agent-export__expand-btn"
                      @click="toggleExpand(req.id)"
                    >{{ expandedItems.has(req.id) ? '&#9650;' : '&#9660;' }}</button>
                    <button
                      class="agent-export__remove-btn"
                      title="Remove from export"
                      @click="removeRequest(req.id)"
                    >&times;</button>
                  </div>

                  <div v-if="expandedItems.has(req.id)" class="agent-export__item-details">
                    <div v-if="req.requestHeaders && Object.keys(req.requestHeaders).length" class="agent-export__detail-section">
                      <div class="agent-export__detail-label">Request Headers</div>
                      <pre class="agent-export__detail-pre">{{ formatHeaders(req.requestHeaders) }}</pre>
                    </div>
                    <div v-if="req.requestBody" class="agent-export__detail-section">
                      <div class="agent-export__detail-label">Request Body</div>
                      <pre class="agent-export__detail-pre">{{ req.requestBody }}</pre>
                    </div>
                    <div v-if="req.responseHeaders && Object.keys(req.responseHeaders).length" class="agent-export__detail-section">
                      <div class="agent-export__detail-label">Response Headers</div>
                      <pre class="agent-export__detail-pre">{{ formatHeaders(req.responseHeaders) }}</pre>
                    </div>
                    <div v-if="req.responseBody" class="agent-export__detail-section">
                      <div class="agent-export__detail-label">Response Body</div>
                      <pre class="agent-export__detail-pre">{{ req.responseBody }}</pre>
                    </div>
                    <div v-if="!req.requestBody && !req.responseBody && !(req.requestHeaders && Object.keys(req.requestHeaders).length)" class="agent-export__detail-empty">
                      No additional details captured.
                    </div>
                  </div>
                </div>
              </div>

              <!-- Annotations -->
              <div v-if="serverAnnotations.length" class="agent-export__group">
                <div class="agent-export__group-header">
                  Annotations ({{ serverAnnotations.length }})
                </div>
                <div
                  v-for="ann in serverAnnotations"
                  :key="ann.id"
                  class="agent-export__item"
                >
                  <div class="agent-export__item-row">
                    <span class="agent-export__item-method">{{ ann.component }}</span>
                    <span class="agent-export__item-url">{{ ann.comment }}</span>
                    <button
                      class="agent-export__expand-btn"
                      @click="toggleExpand(ann.id)"
                    >{{ expandedItems.has(ann.id) ? '&#9650;' : '&#9660;' }}</button>
                  </div>
                  <div v-if="expandedItems.has(ann.id)" class="agent-export__item-details">
                    <div v-if="ann.filePath" class="agent-export__detail-section">
                      <div class="agent-export__detail-label">File</div>
                      <pre class="agent-export__detail-pre">{{ ann.filePath }}</pre>
                    </div>
                    <div v-if="ann.cssSelector" class="agent-export__detail-section">
                      <div class="agent-export__detail-label">Selector</div>
                      <pre class="agent-export__detail-pre">{{ ann.cssSelector }}</pre>
                    </div>
                    <div v-if="ann.cssClasses" class="agent-export__detail-section">
                      <div class="agent-export__detail-label">Classes</div>
                      <pre class="agent-export__detail-pre">{{ ann.cssClasses }}</pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>

<style scoped>
.agent-export-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.agent-export {
  background: #1a1a2e;
  border-radius: 12px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.6);
  max-width: 640px;
  width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.agent-export__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #2a2a4e;
}

.agent-export__title {
  font-weight: 600;
  font-size: 15px;
  color: #e0e0ff;
}

.agent-export__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.agent-export__btn {
  padding: 5px 14px;
  border: 1px solid #00d4ff55;
  border-radius: 6px;
  background: #00d4ff1a;
  color: #00d4ff;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.agent-export__btn:hover { background: #00d4ff33; }
.agent-export__btn:disabled { opacity: 0.4; cursor: not-allowed; }

.agent-export__btn--copied {
  background: #2ed57333;
  border-color: #2ed57355;
  color: #2ed573;
}

.agent-export__close {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #8888aa;
  font-size: 22px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.agent-export__close:hover {
  background: #2a2a4e;
  color: #e0e0ff;
}

.agent-export__body {
  overflow-y: auto;
  padding: 12px;
  flex: 1;
}

.agent-export__loading {
  color: #6060a0;
  text-align: center;
  padding: 40px 0;
  font-size: 13px;
}

/* Empty state */
.agent-export__empty-state {
  text-align: center;
  padding: 32px 16px;
  color: #6060a0;
  font-size: 13px;
}

.agent-export__empty-icon {
  margin-bottom: 12px;
  color: #3a3a5e;
}

.agent-export__empty-state p {
  margin: 4px 0;
}

.agent-export__empty-hint {
  font-size: 12px;
  color: #4a4a6e;
}

/* Groups */
.agent-export__group {
  margin-bottom: 12px;
}

.agent-export__group-header {
  padding: 4px 4px 8px;
  font-size: 12px;
  font-weight: 600;
  color: #8888aa;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Items */
.agent-export__item {
  border: 1px solid #2a2a4e;
  border-radius: 6px;
  margin-bottom: 4px;
  overflow: hidden;
}

.agent-export__item-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  font-size: 12px;
  color: #c0c0e0;
}

.agent-export__item-status {
  font-weight: 700;
  font-size: 11px;
  min-width: 28px;
  text-align: center;
}

.agent-export__item-method {
  font-weight: 700;
  color: #e0e0ff;
  flex-shrink: 0;
}

.agent-export__item-url {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.agent-export__item-meta {
  color: #6060a0;
  font-size: 11px;
  flex-shrink: 0;
}

.agent-export__expand-btn {
  border: none;
  background: none;
  color: #6060a0;
  font-size: 10px;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 3px;
  flex-shrink: 0;
  transition: color 0.15s;
}

.agent-export__expand-btn:hover { color: #e0e0ff; }

.agent-export__remove-btn {
  border: none;
  background: none;
  color: #ff475766;
  font-size: 16px;
  cursor: pointer;
  padding: 0 2px;
  line-height: 1;
  flex-shrink: 0;
  transition: color 0.15s;
}

.agent-export__remove-btn:hover { color: #ff4757; }

/* Details */
.agent-export__item-details {
  border-top: 1px solid #2a2a4e;
  background: #16162a;
  padding: 8px 10px;
}

.agent-export__detail-section {
  margin-bottom: 6px;
}

.agent-export__detail-section:last-child { margin-bottom: 0; }

.agent-export__detail-label {
  font-size: 10px;
  font-weight: 600;
  color: #6060a0;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-bottom: 2px;
}

.agent-export__detail-pre {
  margin: 0;
  padding: 4px 6px;
  background: #0d0d1a;
  border-radius: 4px;
  font-size: 11px;
  line-height: 1.4;
  color: #a0a0c0;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  max-height: 120px;
  overflow-y: auto;
}

.agent-export__detail-empty {
  font-size: 11px;
  color: #6060a0;
  font-style: italic;
}

/* Transition */
.agent-export-panel-enter-active,
.agent-export-panel-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.agent-export-panel-enter-from,
.agent-export-panel-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
