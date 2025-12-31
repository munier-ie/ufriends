import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAuthUser } from "@/lib/jwt-auth"
import { protect } from "@/lib/security"
import { KycStatus } from "@prisma/client"
import { sendNotification } from "@/lib/notifications"

// Arcjet protection via shared helper

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await getAuthUser(req)
    if (!authUser?.id || authUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Arcjet shield via shared helper
    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const status = body.status as KycStatus
    const note = typeof body.note === "string" ? body.note : undefined

    const kyc = await prisma.kycRequest.update({
      where: { id },
      data: {
        status,
        reviewedAt: new Date(),
      },
      include: { user: true },
    })

    // If approved, update the user flag
    if (status === "APPROVED") {
      await prisma.user.update({
        where: { id: kyc.userId },
        data: { isKycVerified: true } as any,
      })
    }

    // Send Notification to User
    const statusText = status === "APPROVED" ? "approved" : "rejected"
    await sendNotification({
      userId: kyc.userId,
      type: `KYC_${status}`,
      title: `KYC Verification ${status === "APPROVED" ? "Approved" : "Rejected"}`,
      body: `Your identity verification request has been ${statusText}.${note ? ` Reason: ${note}` : ""}`,
      email: {
        subject: `KYC Verification ${status === "APPROVED" ? "Approved" : "Rejected"} - UFriends`,
        html: `
          <h3>KYC Verification ${status === "APPROVED" ? "Approved" : "Rejected"}</h3>
          <p>Hello,</p>
          <p>Your identity verification request on UFriends has been <strong>${statusText}</strong>.</p>
          ${note ? `<p><strong>Note:</strong> ${note}</p>` : ""}
          <p>Thank you for using UFriends.</p>
        `,
      },
    })

    await prisma.auditLog.create({
      data: {
        actorId: authUser.id,
        action: `KYC_${status}`,
        resourceType: "KycRequest",
        resourceId: kyc.id,
        diffJson: note ? { note } : undefined,
      },
    })

    return NextResponse.json({ id: kyc.id, status: kyc.status })
  } catch (err) {
    return NextResponse.json({ error: "Failed to update KYC", detail: String(err) }, { status: 500 })
  }
}
