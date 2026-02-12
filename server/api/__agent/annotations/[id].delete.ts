import { defineEventHandler, getRouterParam } from 'h3'
import { annotations } from '../../../utils/storage'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  const idx = annotations.findIndex((a) => a.id === id)
  if (idx !== -1) annotations.splice(idx, 1)
  return { ok: true }
})
