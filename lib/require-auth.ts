import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAuthUser, AuthUser } from "@/lib/jwt-auth"

export type RequireAuthOptions = {
  roles?: Array<string>
}

export type RequireAuthResult = {
  ok: true
  user: AuthUser
} | {
  ok: false
  response: NextResponse
}

export async function requireAuth(req: Request, options: RequireAuthOptions = {}): Promise<RequireAuthResult> {
  const tokenUser = await getAuthUser(req)
  if (!tokenUser?.id) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  // Check DB for status and latest role
  const user = await prisma.user.findUnique({
    where: { id: tokenUser.id },
    select: { id: true, email: true, role: true, status: true }
  })

  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  if (user.status === "suspended") {
    return { ok: false, response: NextResponse.json({ error: "Account suspended" }, { status: 403 }) }
  }

  // Enforce role check if required
  if (options.roles && user.role && !options.roles.includes(user.role)) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  // Return the DB user to ensure downstream consumers have up-to-date data
  return { ok: true, user: { id: user.id, email: user.email, role: user.role } }
}