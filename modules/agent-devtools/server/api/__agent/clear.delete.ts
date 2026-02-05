import { defineEventHandler } from 'h3'
import { clearClientRequests, clearAnnotations } from '../../utils/storage'
import { clearServerRequests } from '../../../runtime/network-tracker.server'

export default defineEventHandler(() => {
  clearClientRequests()
  clearServerRequests()
  clearAnnotations()
  return { ok: true }
})
