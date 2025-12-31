import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { protect } from "@/lib/security"
import { requireAuth } from "@/lib/require-auth"

// Arcjet protection via shared helper

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req as any)
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const latest = await prisma.kycRequest.findFirst({
      where: { userId: auth.user.id },
      orderBy: { submittedAt: "desc" },
      include: { documents: true },
    })

    if (!latest) {
      return NextResponse.json({ status: "NONE" })
    }

    return NextResponse.json({
      id: latest.id,
      type: latest.type,
      status: latest.status,
      submittedAt: latest.submittedAt,
      reviewedAt: latest.reviewedAt,
      documents: (latest.documents || []).map((d: { id: string; type: string; fileUrl: string }) => ({ id: d.id, type: d.type, fileUrl: d.fileUrl })),
    })
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch KYC status", detail: String(err) }, { status: 500 })
  }
}