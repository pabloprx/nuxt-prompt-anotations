import { defineEventHandler, readBody, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  throw createError({
    statusCode: 422,
    statusMessage: 'Unprocessable Entity',
    data: {
      message: 'Validation failed',
      errors: {
        email: 'Invalid email format',
        quantity: 'Must be greater than 0',
      },
      received: body,
    },
  })
})
