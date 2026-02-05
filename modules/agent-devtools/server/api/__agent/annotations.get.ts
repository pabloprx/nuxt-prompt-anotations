import { defineEventHandler } from 'h3'
import { annotations } from '../../utils/storage'

export default defineEventHandler(() => {
  return annotations
})
