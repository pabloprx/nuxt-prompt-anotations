<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useState } from '#imports'

const annotating = useState<boolean>('__agent_annotating')
const requests = useState<any[]>('__agent_requests')
const selectedRequestIds = useState<string[]>('__agent_selected_requests', () => [])

const showNetwork = ref(false)
const showExport = ref(false)

function toggleAnnotate() {
  annotating.value = !annotating.value
}

function toggleNetwork() {
  showNetwork.value = !showNetwork.value
  if (showNetwork.value) showExport.value = false
}

function toggleExport() {
  showExport.value = !showExport.value
  if (showExport.value) showNetwork.value = false
}

function statusColor(status: number): string {
  if (!status || status >= 400) return '#ff4757'
  if (status >= 300) return '#ffa502'
  return '#2ed573'
}

// Badge logic
const errorCount = computed(() => {
  return (requests.value ?? []).filter((r: any) => !r.status || r.status >= 400).length
})
const badgeCount = computed(() => {
  if (errorCount.value > 0) return errorCount.value
  return requests.value?.length ?? 0
})
const badgeColor = computed(() => {
  return errorCount.value > 0 ? '#ff4757' : '#00d4ff'
})

// Reversed requests (newest first)
const reversedRequests = computed(() => {
  return [...(requests.value ?? [])].reverse()
})

// Selection helpers
const selectedSet = computed(() => new Set(selectedRequestIds.value))

function toggleRequest(id: string) {
  if (selectedSet.value.has(id)) {
    selectedRequestIds.value = selectedRequestIds.value.filter((i) => i !== id)
  } else {
    selectedRequestIds.value = [...selectedRequestIds.value, id]
  }
}

function selectAll() {
  selectedRequestIds.value = (requests.value ?? []).map((r: any) => r.id)
}

function deselectAll() {
  selectedRequestIds.value = []
}

const allSelected = computed(() => {
  const len = requests.value?.length ?? 0
  return len > 0 && selectedRequestIds.value.length === len
})

// Export badge: count of selected items
const exportBadgeCount = computed(() => selectedRequestIds.value.length)

// Clear all captured data
async function clearAll() {
  try {
    await fetch('/api/__agent/clear', { method: 'DELETE' })
    requests.value = []
    selectedRequestIds.value = []
  } catch {
    // silent
  }
}

// Global Escape handler
function onEscape(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  if (showExport.value) {
    showExport.value = false
  } else if (showNetwork.value) {
    showNetwork.value = false
  } else if (annotating.value) {
    annotating.value = false
  }
}

onMounted(() => {
  window.addEventListener('keydown', onEscape)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onEscape)
})
</script>

<template>
  <Teleport to="body">
    <div class="agent-toolbar">
      <!-- Toolbar buttons -->
      <div class="agent-toolbar__buttons">
        <button
          class="agent-toolbar__btn"
          :class="{ 'agent-toolbar__btn--active': annotating }"
          title="Annotate (Cmd+Shift+A)"
          @click="toggleAnnotate"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
          </svg>
        </button>
        <button
          class="agent-toolbar__btn"
          :class="{ 'agent-toolbar__btn--active': showNetwork }"
          title="Network requests"
          @click="toggleNetwork"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="2,12 6,4 10,16 14,8 18,14 22,6" />
          </svg>
          <span
            v-if="badgeCount > 0"
            class="agent-toolbar__badge"
            :style="{ background: badgeColor }"
          >{{ badgeCount }}</span>
        </button>
        <button
          class="agent-toolbar__btn"
          :class="{ 'agent-toolbar__btn--active': showExport }"
          title="Export prompt"
          @click="toggleExport"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="6" y="4" width="12" height="16" rx="2" />
            <path d="M6 4V3a1 1 0 0 1 1-1h4l2 2h4a1 1 0 0 1 1 1v1" />
            <line x1="10" y1="11" x2="14" y2="11" />
            <line x1="10" y1="15" x2="14" y2="15" />
          </svg>
          <span
            v-if="exportBadgeCount > 0"
            class="agent-toolbar__badge agent-toolbar__badge--export"
          >{{ exportBadgeCount }}</span>
        </button>
      </div>

      <!-- Network panel -->
      <Transition name="agent-panel">
        <div v-if="showNetwork" class="agent-toolbar__panel">
          <div class="agent-toolbar__panel-header">
            <span>Network Requests ({{ requests?.length ?? 0 }})</span>
            <div class="agent-toolbar__panel-actions">
              <button
                v-if="requests?.length"
                class="agent-toolbar__select-btn"
                @click="allSelected ? deselectAll() : selectAll()"
              >{{ allSelected ? 'Deselect all' : 'Select all' }}</button>
              <button
                v-if="requests?.length"
                class="agent-toolbar__clear-btn"
                @click="clearAll"
              >Clear</button>
            </div>
          </div>
          <div class="agent-toolbar__panel-scroll">
            <div
              v-for="req in reversedRequests"
              :key="req.id"
              class="agent-toolbar__request"
              :class="{ 'agent-toolbar__request--selected': selectedSet.has(req.id) }"
              :style="{ borderLeftColor: statusColor(req.status) }"
            >
              <input
                type="checkbox"
                class="agent-toolbar__req-check"
                :checked="selectedSet.has(req.id)"
                @change="toggleRequest(req.id)"
              />
              <span class="agent-toolbar__req-method">{{ req.method }}</span>
              <span class="agent-toolbar__req-url" :title="req.url">{{ req.url }}</span>
              <span
                class="agent-toolbar__req-status"
                :style="{ color: statusColor(req.status) }"
              >
                {{ req.status || 'ERR' }}
              </span>
              <span class="agent-toolbar__req-duration">{{ req.duration }}ms</span>
            </div>
            <div v-if="!requests?.length" class="agent-toolbar__empty">
              No requests captured yet.
            </div>
          </div>
        </div>
      </Transition>

      <!-- Annotation overlay -->
      <AgentAnnotationOverlay v-if="annotating" />

      <!-- Export panel -->
      <AgentExportPanel v-if="showExport" @close="showExport = false" />
    </div>
  </Teleport>
</template>

<style scoped>
.agent-toolbar {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 99999;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 14px;
}

.agent-toolbar__buttons {
  display: flex;
  gap: 4px;
  background: #1a1a2e;
  padding: 6px;
  border-radius: 10px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
}

.agent-toolbar__btn {
  position: relative;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #a0a0c0;
  font-size: 18px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.agent-toolbar__btn:hover {
  background: #2a2a4e;
  color: #e0e0ff;
}

.agent-toolbar__btn--active {
  background: #00d4ff33;
  color: #00d4ff;
}

.agent-toolbar__badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 700;
  line-height: 16px;
  text-align: center;
  color: #fff;
}

.agent-toolbar__badge--export {
  background: #00d4ff;
}

.agent-toolbar__panel {
  position: absolute;
  bottom: 52px;
  right: 0;
  width: 420px;
  max-height: 400px;
  background: #1a1a2e;
  border-radius: 10px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.agent-toolbar__panel-header {
  padding: 10px 14px;
  font-weight: 600;
  color: #e0e0ff;
  border-bottom: 1px solid #2a2a4e;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.agent-toolbar__panel-actions {
  display: flex;
  gap: 6px;
}

.agent-toolbar__select-btn {
  padding: 2px 8px;
  border: 1px solid #00d4ff55;
  border-radius: 4px;
  background: #00d4ff1a;
  color: #00d4ff;
  font-size: 11px;
  cursor: pointer;
  transition: background 0.15s;
}

.agent-toolbar__select-btn:hover {
  background: #00d4ff33;
}

.agent-toolbar__clear-btn {
  padding: 2px 8px;
  border: 1px solid #ff475755;
  border-radius: 4px;
  background: #ff47571a;
  color: #ff6b7f;
  font-size: 11px;
  cursor: pointer;
  transition: background 0.15s;
}

.agent-toolbar__clear-btn:hover {
  background: #ff475733;
}

.agent-toolbar__panel-scroll {
  overflow-y: auto;
  max-height: 340px;
  padding: 6px;
}

.agent-toolbar__request {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-left: 3px solid #2ed573;
  border-radius: 4px;
  margin-bottom: 4px;
  background: #16162a;
  font-size: 12px;
  color: #c0c0e0;
  transition: background 0.15s;
}

.agent-toolbar__request--selected {
  background: #00d4ff0d;
}

.agent-toolbar__req-check {
  accent-color: #00d4ff;
  flex-shrink: 0;
}

.agent-toolbar__req-method {
  font-weight: 700;
  min-width: 40px;
  color: #e0e0ff;
}

.agent-toolbar__req-url {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.agent-toolbar__req-status {
  font-weight: 600;
  min-width: 30px;
  text-align: right;
}

.agent-toolbar__req-duration {
  min-width: 50px;
  text-align: right;
  color: #8888aa;
}

.agent-toolbar__empty {
  padding: 20px;
  text-align: center;
  color: #6060a0;
}

/* Transition */
.agent-panel-enter-active,
.agent-panel-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.agent-panel-enter-from,
.agent-panel-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
