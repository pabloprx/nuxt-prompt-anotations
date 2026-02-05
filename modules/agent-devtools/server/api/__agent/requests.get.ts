import { defineEventHandler } from 'h3'
import { clientRequests } from '../../utils/storage'
import { serverRequests } from '../../../runtime/network-tracker.server'

export default defineEventHandler(() => {
  return { client: clientRequests, server: serverRequests }
})
