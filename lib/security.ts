import arcjet, { shield, validateEmail, detectBot, fixedWindow } from "@arcjet/next"

type AJInstance = ReturnType<typeof arcjet> | null

// Create a shared Arcjet instance with common rules.
// In development, ARCJET_KEY may be missing, so we fail open.
export const aj: AJInstance = process.env.ARCJET_KEY
  ? arcjet({
    key: process.env.ARCJET_KEY!,
    rules: [
      shield({ mode: "LIVE" }),
      detectBot({ mode: "LIVE", allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:MONITOR", "CATEGORY:PREVIEW"] }),
      fixedWindow({ mode: "LIVE", window: "60s", max: 100 }),
    ],
  })
  : null

// Email-validation instance for routes that need email context
export const ajWithEmail: AJInstance = process.env.ARCJET_KEY
  ? arcjet({
    key: process.env.ARCJET_KEY!,
    rules: [
      shield({ mode: "LIVE" }),
      detectBot({ mode: "LIVE", allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:MONITOR", "CATEGORY:PREVIEW"] }),
      fixedWindow({ mode: "LIVE", window: "60s", max: 100 }),
      validateEmail({ mode: "LIVE", deny: ["DISPOSABLE", "INVALID", "NO_MX_RECORDS"] }),
    ],
  })
  : null

export async function protect(req: Request, opts?: { email?: string }) {
  if (!aj) return { allowed: true }
  try {
    const decision = await (opts?.email && ajWithEmail
      ? (ajWithEmail as any).protect(req as any, { email: opts.email })
      : (aj as any).protect(req as any))
    if (decision?.isDenied?.()) return { allowed: false }
    return { allowed: true }
  } catch {
    // Fail open in dev
    return { allowed: true }
  }
}