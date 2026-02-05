<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useState } from '#imports'

interface Annotation {
  id: string
  component: string
  filePath: string
  elementTag: string
  textPreview: string
  comment: string
  timestamp: string
  rect: { x: number; y: number; w: number; h: number }
}

const annotating = useState<boolean>('__agent_annotating')
const annotations = useState<Annotation[]>('__agent_annotations')

// Highlight box tracking
const highlight = ref<{ x: number; y: number; w: number; h: number; label: string } | null>(null)

// Click-to-annotate state
const inputPos = ref<{ x: number; y: number } | null>(null)
const pendingElement = ref<{ component: string; filePath: string; elementTag: string; textPreview: string; rect: { x: number; y: number; w: number; h: number } } | null>(null)
const commentText = ref('')

function resolveComponent(el: HTMLElement): { name: string; file: string } {
  let node: any = el
  // Walk __vueParentComponent chain to find nearest Vue component info
  while (node) {
    const vueComp = (node as any).__vueParentComponent
    if (vueComp) {
      const name = vueComp.type?.__name || vueComp.type?.name || ''
      const file = vueComp.type?.__file || ''
      if (name && !name.startsWith('Agent')) {
        return { name, file }
      }
    }
    node = node.parentElement
  }
  return { name: '', file: '' }
}

function isToolbarElement(el: HTMLElement): boolean {
  return !!el.closest('.agent-toolbar') || !!el.closest('.agent-overlay')
}

function onMouseMove(e: MouseEvent) {
  if (inputPos.value) return // Don't update highlight while input is open

  const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
  if (!el || isToolbarElement(el)) {
    highlight.value = null
    return
  }

  const rect = el.getBoundingClientRect()
  const { name } = resolveComponent(el)
  highlight.value = {
    x: rect.left + window.scrollX,
    y: rect.top + window.scrollY,
    w: rect.width,
    h: rect.height,
    label: name || el.tagName.toLowerCase(),
  }
}

function onClick(e: MouseEvent) {
  if (inputPos.value) return // Already showing input

  const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
  if (!el || isToolbarElement(el)) return

  e.preventDefault()
  e.stopPropagation()

  const rect = el.getBoundingClientRect()
  const { name, file } = resolveComponent(el)
  const textContent = (el.textContent || '').trim().slice(0, 50)

  pendingElement.value = {
    component: name || el.tagName.toLowerCase(),
    filePath: file,
    elementTag: el.tagName.toLowerCase(),
    textPreview: textContent,
    rect: {
      x: Math.round(rect.left + window.scrollX),
      y: Math.round(rect.top + window.scrollY),
      w: Math.round(rect.width),
      h: Math.round(rect.height),
    },
  }

  // Position input near click, offset slightly so it doesn't obscure the element
  inputPos.value = {
    x: Math.min(e.pageX + 10, window.innerWidth - 320),
    y: Math.min(e.pageY + 10, window.innerHeight + window.scrollY - 60),
  }

  commentText.value = ''
}

function onSubmitComment(e: KeyboardEvent) {
  if (e.key !== 'Enter' || !commentText.value.trim() || !pendingElement.value) return

  const annotation: Annotation = {
    id: crypto.randomUUID(),
    component: pendingElement.value.component,
    filePath: pendingElement.value.filePath,
    elementTag: pendingElement.value.elementTag,
    textPreview: pendingElement.value.textPreview,
    comment: commentText.value.trim(),
    timestamp: new Date().toISOString(),
    rect: pendingElement.value.rect,
  }

  annotations.value = [...annotations.value, annotation]

  // Fire and forget POST
  fetch('/api/__agent/annotations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(annotation),
  }).catch(() => {})

  // Reset input state
  inputPos.value = null
  pendingElement.value = null
  commentText.value = ''
}

function onCancelInput(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    inputPos.value = null
    pendingElement.value = null
    commentText.value = ''
  }
}

onMounted(() => {
  document.addEventListener('mousemove', onMouseMove, true)
  document.addEventListener('click', onClick, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onMouseMove, true)
  document.removeEventListener('click', onClick, true)
})
</script>

<template>
  <div v-if="annotating" class="agent-overlay">
    <!-- Full-screen transparent layer (pointer-events: none so page is still usable) -->
    <div class="agent-overlay__screen" />

    <!-- Highlight box following hovered element -->
    <div
      v-if="highlight"
      class="agent-overlay__highlight"
      :style="{
        left: highlight.x + 'px',
        top: highlight.y + 'px',
        width: highlight.w + 'px',
        height: highlight.h + 'px',
      }"
    >
      <span class="agent-overlay__highlight-label">{{ highlight.label }}</span>
    </div>

    <!-- Comment input floating near click point -->
    <div
      v-if="inputPos"
      class="agent-overlay__input-wrap"
      :style="{ left: inputPos.x + 'px', top: inputPos.y + 'px' }"
    >
      <div class="agent-overlay__input-header">
        {{ pendingElement?.component }} &mdash; {{ pendingElement?.elementTag }}
      </div>
      <input
        v-model="commentText"
        class="agent-overlay__input"
        placeholder="Add a comment and press Enter..."
        autofocus
        @keydown.enter="onSubmitComment"
        @keydown.esc="onCancelInput"
      />
    </div>

    <!-- Annotation markers/pins -->
    <div
      v-for="(ann, idx) in annotations"
      :key="ann.id"
      class="agent-overlay__pin"
      :style="{ left: ann.rect.x + ann.rect.w - 8 + 'px', top: ann.rect.y - 8 + 'px' }"
      :title="ann.comment"
    >
      {{ idx + 1 }}
    </div>
  </div>
</template>

<style scoped>
.agent-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 99998;
  pointer-events: none;
}

.agent-overlay__screen {
  position: fixed;
  inset: 0;
  pointer-events: none;
}

.agent-overlay__highlight {
  position: absolute;
  border: 2px solid #00d4ff;
  background: rgba(0, 212, 255, 0.08);
  pointer-events: none;
  transition: all 0.1s ease;
  z-index: 99998;
}

.agent-overlay__highlight-label {
  position: absolute;
  top: -22px;
  left: 0;
  background: #00d4ff;
  color: #0a0a1a;
  font-size: 11px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 3px;
  white-space: nowrap;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.agent-overlay__input-wrap {
  position: absolute;
  z-index: 99999;
  pointer-events: auto;
  background: #1a1a2e;
  border: 1px solid #00d4ff55;
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  width: 300px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.agent-overlay__input-header {
  font-size: 11px;
  color: #8888aa;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.agent-overlay__input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #2a2a4e;
  border-radius: 4px;
  background: #0d0d1a;
  color: #e0e0ff;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
}

.agent-overlay__input:focus {
  border-color: #00d4ff;
}

.agent-overlay__pin {
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ff6b81;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  cursor: default;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  z-index: 99999;
}
</style>
