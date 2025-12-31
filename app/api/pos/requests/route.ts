import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"

// POST /api/pos/requests - create a new POS request for the authenticated user
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req)
    if (!auth.ok) return auth.response

    const { ensureKyc } = await import("@/lib/kyc-check")
    const kycError = await ensureKyc(auth.user.id)
    if (kycError) return kycError

    const body = await req.json()
    const {
      provider,
      formData,
      documents,
    }: {
      provider: string
      formData: Record<string, any>
      documents?: Record<string, any>
    } = body

    if (!provider || !formData) {
      return NextResponse.json({ error: "Missing provider or formData" }, { status: 400 })
    }

    const created = await prisma.posRequest.create({
      data: {
        userId: auth.user.id,
        businessInfo: {
          provider,
          formData,
          documents: documents || {},
        },
        status: "PENDING",
      },
    })

    const { sendAdminNotification } = await import("@/lib/notifications")
    await sendAdminNotification({
      type: "NEW_POS_REQUEST",
      title: "New POS Request",
      body: `A new POS request (${provider}) has been submitted by ${auth.user.email}.`,
      email: {
        subject: "New POS Request - Admin Alert",
        html: `<h3>New POS Request</h3><p>A user with email <strong>${auth.user.email}</strong> has submitted a new <strong>${provider}</strong> POS request.</p><p>Please log in to the admin panel to review the request.</p>`
      }
    })

    return NextResponse.json({ ok: true, id: created.id })

  } catch (err) {
    return NextResponse.json({ error: "Failed to submit POS request", detail: String(err) }, { status: 500 })
  }
}

// GET /api/pos/requests - list the authenticated user's POS requests
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req)
    if (!auth.ok) return auth.response

    const requests = await prisma.posRequest.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: "desc" },
    })

    const list = requests.map((r) => {
      const info = (r.businessInfo || {}) as any
      return {
        id: r.id,
        provider: info.provider || "Unknown",
        formData: info.formData || {},
        documents: info.documents || {},
        status: r.status,
        createdAt: r.createdAt,
        assignedAgentId: r.assignedAgentId || null,
      }
    })

    return NextResponse.json({ ok: true, requests: list })
  } catch (err) {
    return NextResponse.json({ error: "Failed to list POS requests", detail: String(err) }, { status: 500 })
  }
}