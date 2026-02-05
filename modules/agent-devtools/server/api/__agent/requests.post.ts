import { defineEventHandler, readBody } from 'h3'
import { clientRequests } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  clientRequests.push(body)
  return { ok: true }
})
