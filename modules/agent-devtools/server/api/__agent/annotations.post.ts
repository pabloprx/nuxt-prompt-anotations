import { defineEventHandler, readBody } from 'h3'
import { annotations } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  annotations.push(body)
  return { ok: true }
})
