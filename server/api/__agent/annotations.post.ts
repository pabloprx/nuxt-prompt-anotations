import { defineEventHandler, readBody } from 'h3'
import { annotations } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const idx = annotations.findIndex((a) => a.id === body.id)
  if (idx !== -1) {
    annotations[idx] = body
  } else {
    annotations.push(body)
  }
  return { ok: true }
})
