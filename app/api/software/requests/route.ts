import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"
import { protect } from "@/lib/security"

// GET /api/software/requests
// Returns the authenticated user's software development requests
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req)
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = (searchParams.get("status") || "").trim().toUpperCase()
    const where: any = { userId: auth.user.id }
    if (["PENDING", "PROCESSING", "COMPLETED", "FAILED"].includes(status)) {
      where.status = status
    }

    const items = await prisma.softwareRequest.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      include: {
        assignment: true,
        deliveryFiles: true,
      },
    })

    const data = items.map((r) => ({
      id: r.id,
      userId: r.userId,
      serviceType: r.serviceType,
      subType: r.subType,
      formData: r.formJson,
      price: r.price,
      status: r.status,
      submittedAt: r.submittedAt,
      assignment: r.assignment || null,
      deliveryFiles: r.deliveryFiles || [],
    }))

    return NextResponse.json({ ok: true, items: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 })
  }
}

// POST /api/software/requests
// Creates a new manual software development request for the authenticated user
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req)
    if (!auth.ok) return auth.response

    const { ensureKyc } = await import("@/lib/kyc-check")
    const kycError = await ensureKyc(auth.user.id)
    if (kycError) return kycError

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const serviceType = String(body?.serviceType || "Software Development")
    const subType = String(body?.subType || "General")
    const formData = body?.formData || {}
    const price = Number(body?.price || 0)

    if (!serviceType || !subType) {
      return NextResponse.json({ error: "Missing serviceType or subType" }, { status: 400 })
    }

    if (!(price >= 0)) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 })
    }

    const created = await prisma.softwareRequest.create({
      data: {
        userId: auth.user.id,
        serviceType,
        subType,
        formJson: formData,
        price,
        status: "PENDING",
      },
    })

    const { sendAdminNotification } = await import("@/lib/notifications")
    await sendAdminNotification({
      type: "NEW_SOFTWARE_REQUEST",
      title: "New Software Project Request",
      body: `A new software request (${subType}) has been submitted by ${auth.user.email}.`,
      email: {
        subject: "New Software Request - Admin Alert",
        html: `<h3>New Software Project Request</h3><p>A user with email <strong>${auth.user.email}</strong> has requested a new <strong>${subType}</strong> project.</p><p>Budget/Price: ₦${price.toLocaleString()}</p><p>Please log in to the admin panel to review the project details.</p>`
      }
    })

    return NextResponse.json({ ok: true, item: created }, { status: 201 })

  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 })
  }
}