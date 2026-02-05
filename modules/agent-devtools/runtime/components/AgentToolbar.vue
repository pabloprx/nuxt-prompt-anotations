<script setup lang="ts">
import { ref } from 'vue'
import { useState } from '#imports'

const annotating = useState<boolean>('__agent_annotating')
const requests = useState<any[]>('__agent_requests')

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
          &#9998;
        </button>
        <button
          class="agent-toolbar__btn"
          :class="{ 'agent-toolbar__btn--active': showNetwork }"
          title="Network requests"
          @click="toggleNetwork"
        >
          &#9700;
        </button>
        <button
          class="agent-toolbar__btn"
          :class="{ 'agent-toolbar__btn--active': showExport }"
          title="Export report"
          @click="toggleExport"
        >
          &#8615;
        </button>
      </div>

      <!-- Network panel -->
      <Transition name="agent-panel">
        <div v-if="showNetwork" class="agent-toolbar__panel">
          <div class="agent-toolbar__panel-header">
            Network Requests ({{ requests?.length ?? 0 }})
          </div>
          <div class="agent-toolbar__panel-scroll">
            <div
              v-for="req in (requests ?? [])"
              :key="req.id"
              class="agent-toolbar__request"
              :style="{ borderLeftColor: statusColor(req.status) }"
            >
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
