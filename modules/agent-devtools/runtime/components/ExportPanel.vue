<script setup lang="ts">
import { ref, onMounted } from 'vue'

const emit = defineEmits<{ close: [] }>()

const markdown = ref('')
const loading = ref(true)
const copied = ref(false)

onMounted(async () => {
  try {
    const res = await fetch('/api/__agent/export')
    if (res.ok) {
      const data = await res.json()
      markdown.value = data.markdown
    } else {
      markdown.value = '# Export failed\n\nCould not fetch export data.'
    }
  } catch {
    markdown.value = '# Export failed\n\nNetwork error fetching export.'
  } finally {
    loading.value = false
  }
})

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(markdown.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    // Fallback for older browsers
    const ta = document.createElement('textarea')
    ta.value = markdown.value
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="agent-export-backdrop" @click.self="emit('close')">
      <Transition name="agent-export-panel" appear>
        <div class="agent-export">
          <div class="agent-export__header">
            <span class="agent-export__title">Export Report</span>
            <div class="agent-export__actions">
              <button class="agent-export__btn" @click="copyToClipboard">
                {{ copied ? 'Copied!' : 'Copy to Clipboard' }}
              </button>
              <button class="agent-export__close" @click="emit('close')">&times;</button>
            </div>
          </div>
          <div class="agent-export__body">
            <div v-if="loading" class="agent-export__loading">Loading export...</div>
            <pre v-else class="agent-export__content">{{ markdown }}</pre>
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
  z-index: 100000;
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
  max-width: 600px;
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
  padding: 14px 18px;
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
  transition: background 0.15s;
}

.agent-export__btn:hover {
  background: #00d4ff33;
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
  padding: 18px;
  flex: 1;
}

.agent-export__loading {
  color: #6060a0;
  text-align: center;
  padding: 40px 0;
}

.agent-export__content {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  color: #c0c0e0;
  font-size: 13px;
  line-height: 1.6;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
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
