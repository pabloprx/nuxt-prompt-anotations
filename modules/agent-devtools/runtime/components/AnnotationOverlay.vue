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
  cssClasses: string
  cssSelector: string
  componentTree: string[]
}

const annotating = useState<boolean>('__agent_annotating')
const annotations = useState<Annotation[]>('__agent_annotations')

// Highlight box tracking
const highlight = ref<{ x: number; y: number; w: number; h: number; label: string } | null>(null)

// Click-to-annotate state
const inputPos = ref<{ x: number; y: number } | null>(null)
const pendingAnnotation = ref<Omit<Annotation, 'id' | 'comment' | 'timestamp'> | null>(null)
const commentText = ref('')

function resolveComponent(el: HTMLElement): { name: string; file: string } {
  let node: any = el
  while (node) {
    const vueComp = (node as any).__vueParentComponent
    if (vueComp) {
      const name = vueComp.type?.__name || vueComp.type?.name || ''
      const file = vueComp.type?.__file || ''
      if (name && !name.startsWith('Agent') && !name.startsWith('Annotation')) {
        return { name, file }
      }
    }
    node = node.parentElement
  }
  return { name: '', file: '' }
}

// Walk the full Vue component tree from element to root
function resolveComponentTree(el: HTMLElement): string[] {
  const tree: string[] = []
  let node: any = el
  while (node) {
    const vueComp = (node as any).__vueParentComponent
    if (vueComp) {
      const name = vueComp.type?.__name || vueComp.type?.name || ''
      if (name && !name.startsWith('Agent') && !name.startsWith('Annotation')) {
        if (!tree.includes(name)) tree.push(name)
      }
    }
    node = node.parentElement
  }
  return tree
}

// Build a unique CSS selector for the element
function buildSelector(el: HTMLElement): string {
  const parts: string[] = []
  let current: HTMLElement | null = el

  for (let i = 0; i < 5 && current && current !== document.body; i++) {
    let seg = current.tagName.toLowerCase()

    if (current.id) {
      seg = `#${current.id}`
      parts.unshift(seg)
      break
    }

    if (current.className && typeof current.className === 'string') {
      const classes = current.className.trim().split(/\s+/).filter((c) => !c.startsWith('v-') && !c.startsWith('data-v-')).slice(0, 2)
      if (classes.length) seg += '.' + classes.join('.')
    }

    // Add nth-child if ambiguous
    const parent = current.parentElement
    if (parent) {
      const siblings = Array.from(parent.children).filter((s) => s.tagName === current!.tagName)
      if (siblings.length > 1) {
        const idx = siblings.indexOf(current) + 1
        seg += `:nth-child(${idx})`
      }
    }

    parts.unshift(seg)
    current = current.parentElement
  }

  return parts.join(' > ')
}

function isToolbarElement(el: HTMLElement): boolean {
  return !!el.closest('.agent-toolbar') || !!el.closest('.agent-overlay') || !!el.closest('.agent-export-backdrop')
}

function onMouseMove(e: MouseEvent) {
  if (inputPos.value) return

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
  if (inputPos.value) return

  const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
  if (!el || isToolbarElement(el)) return

  e.preventDefault()
  e.stopPropagation()

  const rect = el.getBoundingClientRect()
  const { name, file } = resolveComponent(el)
  const textContent = (el.textContent || '').trim().slice(0, 200)

  pendingAnnotation.value = {
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
    cssClasses: typeof el.className === 'string' ? el.className.trim() : '',
    cssSelector: buildSelector(el),
    componentTree: resolveComponentTree(el),
  }

  inputPos.value = {
    x: Math.min(e.pageX + 10, window.innerWidth - 320),
    y: Math.min(e.pageY + 10, window.innerHeight + window.scrollY - 60),
  }

  commentText.value = ''
}

function onSubmitComment(e: KeyboardEvent) {
  if (e.key !== 'Enter' || !commentText.value.trim() || !pendingAnnotation.value) return

  const annotation: Annotation = {
    id: crypto.randomUUID(),
    ...pendingAnnotation.value,
    comment: commentText.value.trim(),
    timestamp: new Date().toISOString(),
  }

  annotations.value = [...annotations.value, annotation]

  fetch('/api/__agent/annotations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(annotation),
  }).catch(() => {})

  inputPos.value = null
  pendingAnnotation.value = null
  commentText.value = ''
}

function onCancelInput(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    inputPos.value = null
    pendingAnnotation.value = null
    commentText.value = ''
    editingPin.value = null
    editPinText.value = ''
  }
}

// Pin editing state
const editingPin = ref<string | null>(null)
const editPinText = ref('')

function onPinClick(ann: Annotation) {
  editingPin.value = ann.id
  editPinText.value = ann.comment
}

function onPinSave(ann: Annotation) {
  if (!editPinText.value.trim()) return
  ann.comment = editPinText.value.trim()
  annotations.value = [...annotations.value]
  editingPin.value = null
  editPinText.value = ''

  fetch('/api/__agent/annotations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ann),
  }).catch(() => {})
}

function onPinRemove(id: string) {
  annotations.value = annotations.value.filter((a) => a.id !== id)
  editingPin.value = null
  editPinText.value = ''

  fetch(`/api/__agent/annotations/${id}`, { method: 'DELETE' }).catch(() => {})
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
  <Teleport to="body">
  <div v-if="annotating" class="agent-overlay">
    <div class="agent-overlay__screen" />

    <!-- Highlight box -->
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

    <!-- Comment input -->
    <div
      v-if="inputPos"
      class="agent-overlay__input-wrap"
      :style="{ left: inputPos.x + 'px', top: inputPos.y + 'px' }"
    >
      <div class="agent-overlay__input-header">
        <strong>{{ pendingAnnotation?.component }}</strong>
        <span v-if="pendingAnnotation?.cssSelector"> - {{ pendingAnnotation.cssSelector }}</span>
      </div>
      <div v-if="pendingAnnotation?.filePath" class="agent-overlay__input-file">
        {{ pendingAnnotation.filePath }}
      </div>
      <input
        v-model="commentText"
        class="agent-overlay__input"
        placeholder="Describe the change and press Enter..."
        autofocus
        @keydown.enter="onSubmitComment"
        @keydown.esc="onCancelInput"
      />
    </div>

    <!-- Pins -->
    <div
      v-for="(ann, idx) in annotations"
      :key="ann.id"
      class="agent-overlay__pin-group"
      :style="{ left: ann.rect.x + ann.rect.w - 8 + 'px', top: ann.rect.y - 8 + 'px' }"
    >
      <div
        class="agent-overlay__pin"
        @click.stop="onPinClick(ann)"
      >
        {{ idx + 1 }}
      </div>
      <div v-if="editingPin === ann.id" class="agent-overlay__pin-popover">
        <input
          v-model="editPinText"
          class="agent-overlay__input"
          autofocus
          @keydown.enter="onPinSave(ann)"
          @keydown.esc="editingPin = null"
          @click.stop
        />
        <div class="agent-overlay__pin-actions">
          <button class="agent-overlay__pin-save" @click.stop="onPinSave(ann)">Save</button>
          <button class="agent-overlay__pin-remove" @click.stop="onPinRemove(ann.id)">Remove</button>
        </div>
      </div>
    </div>
  </div>
  </Teleport>
</template>

<style scoped>
.agent-overlay {
  position: fixed;
  inset: 0;
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
  width: 320px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.agent-overlay__input-header {
  font-size: 12px;
  color: #e0e0ff;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.agent-overlay__input-header strong {
  color: #00d4ff;
}

.agent-overlay__input-header span {
  color: #6060a0;
  font-size: 11px;
}

.agent-overlay__input-file {
  font-size: 10px;
  color: #6060a0;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
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

.agent-overlay__pin-group {
  position: absolute;
  z-index: 99999;
  pointer-events: auto;
}

.agent-overlay__pin {
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
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  transition: transform 0.1s;
}

.agent-overlay__pin:hover {
  transform: scale(1.2);
}

.agent-overlay__pin-popover {
  position: absolute;
  top: 26px;
  left: -100px;
  width: 240px;
  background: #1a1a2e;
  border: 1px solid #00d4ff55;
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.agent-overlay__pin-actions {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}

.agent-overlay__pin-save {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid #00d4ff55;
  border-radius: 4px;
  background: #00d4ff1a;
  color: #00d4ff;
  font-size: 11px;
  cursor: pointer;
}

.agent-overlay__pin-save:hover {
  background: #00d4ff33;
}

.agent-overlay__pin-remove {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid #ff475755;
  border-radius: 4px;
  background: #ff47571a;
  color: #ff6b7f;
  font-size: 11px;
  cursor: pointer;
}

.agent-overlay__pin-remove:hover {
  background: #ff475733;
}
</style>
