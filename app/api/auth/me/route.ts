import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { protect } from "@/lib/security"
import { requireAuth } from "@/lib/require-auth"

// Arcjet protection via shared helper (with email context)

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response

  // Fetch the user to obtain email for Arcjet validation context
  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: { id: true, email: true, role: true, profile: { select: { name: true, phone: true } } },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const sec = await protect(req as any, { email: user.email })
  if (!sec.allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json({ user, profile: user.profile })
}