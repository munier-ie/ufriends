import { verifyAccessToken } from "./jwt"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export type AuthUser = { id: string; email?: string | null; role?: string | null }

export async function getAuthUser(req: Request): Promise<AuthUser | null> {
  // Prefer Authorization: Bearer access token
  const authHeader = (req as any).headers?.get?.("authorization") || ""
  const [, token] = authHeader.split(" ")
  if (authHeader.toLowerCase().startsWith("bearer ") && token) {
    try {
      const payload: any = await verifyAccessToken(token)
      return { id: payload.sub, email: payload.email, role: payload.role }
    } catch {}
  }

  // Fallback to NextAuth session
  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.id) {
      return { id: (session.user as any).id, email: session.user.email, role: (session.user as any).role }
    }
  } catch {}

  return null
}