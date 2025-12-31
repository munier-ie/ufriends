import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { protect } from "@/lib/security"
import { z } from "zod"
import { sanitizer } from "@/lib/validation"
import { requireAuth } from "@/lib/require-auth"
import { sendAdminNotification } from "@/lib/notifications"

// Centralized Arcjet protection via shared helper

const submitSchema = z.object({
  type: z.enum(["BVN", "NIN", "PASSPORT", "VOTER_ID", "DRIVER_LICENSE", "OTHER"]),
  idNumber: z.string().min(5).max(32),
  selfieImage: z.string().url().optional(),
  documents: z.array(z.object({ type: z.string().min(2).max(32), fileUrl: z.string().url() })).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req)
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const raw = await req.json()
    const parsed = submitSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 422 })
    }

    const data = parsed.data
    const type = data.type
    const idNumber = sanitizer.parse(data.idNumber)
    const selfieImage = data.selfieImage ? sanitizer.parse(data.selfieImage) : undefined
    const documents = (data.documents || []).map((d: { type: string; fileUrl: string }) => ({ type: sanitizer.parse(d.type), fileUrl: sanitizer.parse(d.fileUrl) }))

    // Create KYC request
    const kyc = await prisma.kycRequest.create({
      data: {
        userId: auth.user.id,
        type: type as any,
        status: "PENDING" as any,
      },
    })

    // Attach documents (including selfie if provided)
    if (selfieImage) {
      documents.push({ type: "SELFIE", fileUrl: selfieImage })
    }
    if (documents.length > 0) {
      await prisma.document.createMany({
        data: documents.map((d) => ({ kycRequestId: kyc.id, type: d.type as any, fileUrl: d.fileUrl })),
      })
    }

    // Create vendor stub request depending on type
    if (type === "BVN") {
      await prisma.bvnRequest.create({
        data: {
          userId: auth.user.id,
          details: { idNumber },
          status: "PENDING" as any,
        },
      }).catch(() => { })
    } else if (type === "NIN") {
      await prisma.ninRequest.create({
        data: {
          userId: auth.user.id,
          details: { idNumber },
          status: "PENDING" as any,
        },
      }).catch(() => { })
    }

    // Notify Admins
    await sendAdminNotification({
      type: "NEW_KYC_REQUEST",
      title: "New KYC Verification Request",
      body: `A new KYC request (${type}) has been submitted by ${auth.user.email || "a user"}.`,
      email: {
        subject: "New KYC Verification Request - Admin Alert",
        html: `
          <h3>New KYC Verification Request</h3>
          <p>A user with email <strong>${auth.user.email || "N/A"}</strong> has submitted a new <strong>${type}</strong> KYC request.</p>
          <p>Please log in to the admin panel to review it.</p>
        `,
      },
    })

    await prisma.auditLog.create({
      data: {
        actorId: auth.user.id,
        action: "KYC_SUBMIT",
        resourceType: "KYCRequest",
        resourceId: kyc.id,
        diffJson: { type, idNumber: "MASKED", docCount: documents.length },
      },
    }).catch(() => { })

    return NextResponse.json({ ok: true, id: kyc.id, status: "PENDING" })
  } catch (err) {
    return NextResponse.json({ error: "Failed to submit KYC", detail: String(err) }, { status: 500 })
  }
}
