import { defineEventHandler } from 'h3'
import { clientRequests, annotations } from '../../utils/storage'
import { serverRequests } from '../../../runtime/network-tracker.server'

export default defineEventHandler(() => {
  const requests = [
    ...clientRequests.map((r) => ({ ...r, source: 'client' as const })),
    ...serverRequests.map((r) => ({ ...r, source: 'server' as const })),
  ]

  return { requests, annotations }
})
