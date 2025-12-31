import { z } from "zod"
import { ZodXssSanitizer, ACTION_LEVELS } from "zod-xss-sanitizer"

// Shared XSS sanitizer instance
export const sanitizer = ZodXssSanitizer.sanitizer({ actionLevel: ACTION_LEVELS.SANITIZE })

export function sanitizeEmail(input: string) {
  return sanitizer.parse(z.string().trim().toLowerCase().email().parse(input))
}

export function sanitizeString(input: string) {
  return sanitizer.parse(z.string().trim().min(1).parse(input))
}

export function sanitizePhone(input: string) {
  const schema = z.string().trim().regex(/^\+?[0-9]{10,15}$/i, { message: "Invalid phone" })
  return sanitizer.parse(schema.parse(input))
}

export function isValidUrl(input: string) {
  const res = z.string().url().safeParse(input)
  return res.success
}