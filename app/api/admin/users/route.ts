import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { protect } from "@/lib/security"
import { requireAuth } from "@/lib/require-auth"

// Arcjet protection via shared helper

// GET /api/admin/users - list users with profile and wallet summary
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { roles: ["ADMIN"] })
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      include: {
        profile: { select: { name: true, phone: true } },
        wallet: { select: { balance: true, currency: true, updatedAt: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    const list = users.map((u) => ({
      id: u.id,
      name: u.profile?.name || u.email.split("@")[0] || "UFriends User",
      email: u.email,
      phone: u.profile?.phone || "",
      role: (u.role === "ADMIN" ? "admin" : u.role === "MARKETER" ? "agent" : "user") as
        | "user"
        | "agent"
        | "admin",
      status: (u.status as "active" | "suspended" | "pending") || "active",
      balance: Number(u.wallet?.balance ?? 0),
      joinDate: u.createdAt.toISOString().slice(0, 10),
      totalRequests: 0,
      totalSpent: 0,
    }))

    return NextResponse.json({ ok: true, users: list })
  } catch (err) {
    return NextResponse.json({ error: "Failed to list users", detail: String(err) }, { status: 500 })
  }
}