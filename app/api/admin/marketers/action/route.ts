import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"
import { protect } from "@/lib/security"
import { sendNotification } from "@/lib/notifications"

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req, { roles: ["ADMIN"] })
        if (!auth.ok) return auth.response

        const sec = await protect(req as any)
        if (!sec.allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

        const body = await req.json()
        const { action, marketerId, amount } = body

        if (!action || !marketerId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const marketer = await prisma.marketerProfile.findUnique({
            where: { id: marketerId },
            include: { user: true }
        })

        if (!marketer) {
            return NextResponse.json({ error: "Marketer not found" }, { status: 404 })
        }

        let updated
        if (action === "approve") {
            updated = await prisma.marketerProfile.update({
                where: { id: marketerId },
                data: { status: "Approved" }
            })
            // Also update User role to MARKETER
            if (updated) {
                await prisma.user.update({
                    where: { id: marketer.userId },
                    data: { role: "MARKETER" }
                })
            }

            await sendNotification({
                userId: marketer.userId,
                type: "MARKETER_APPROVED",
                title: "Marketer Application Approved",
                body: "Congratulations! Your application to become a marketer has been approved. You can now access the marketer dashboard.",
                email: {
                    subject: "Your Marketer Application has been Approved! - UFriends",
                    html: `<h3>Marketer Application Approved</h3><p>Hello,</p><p>Congratulations! Your application to become a marketer on UFriends has been <strong>approved</strong>.</p><p>You can now log in and start earning commissions.</p>`
                }
            })
        } else if (action === "reject") {
            updated = await prisma.marketerProfile.update({
                where: { id: marketerId },
                data: { status: "Rejected" }
            })

            await sendNotification({
                userId: marketer.userId,
                type: "MARKETER_REJECTED",
                title: "Marketer Application Rejected",
                body: "We regret to inform you that your marketer application has been rejected at this time.",
                email: {
                    subject: "Marketer Application Status - UFriends",
                    html: `<h3>Marketer Application Status</h3><p>Hello,</p><p>We regret to inform you that your marketer application on UFriends has been <strong>rejected</strong> at this time.</p><p>If you have questions, please contact support.</p>`
                }
            })
        } else if (action === "suspend") {
            updated = await prisma.marketerProfile.update({
                where: { id: marketerId },
                data: { status: "Suspended" }
            })

            await sendNotification({
                userId: marketer.userId,
                type: "MARKETER_SUSPENDED",
                title: "Account Suspended",
                body: "Your marketer account has been suspended. Please contact admin for more information.",
                email: {
                    subject: "Marketer Account Suspended - UFriends",
                    html: `<h3>Account Suspended</h3><p>Hello,</p><p>Your marketer account on UFriends has been <strong>suspended</strong>.</p><p>Please contact support or your administrator for further details.</p>`
                }
            })
        } else if (action === "credit") {
            const val = Number(amount)
            if (isNaN(val) || val <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
            updated = await prisma.marketerProfile.update({
                where: { id: marketerId },
                data: { commissionBalance: { increment: val } }
            })

            await sendNotification({
                userId: marketer.userId,
                type: "MARKETER_WALLET_CREDITED",
                title: "Wallet Credited",
                body: `Your marketer commission balance has been credited with ₦${val.toLocaleString()}.`,
                email: {
                    subject: "Marketer Wallet Credited - UFriends",
                    html: `<h3>Wallet Credited</h3><p>Your marketer commission balance has been credited with <strong>₦${val.toLocaleString()}</strong>.</p>`
                }
            })
        } else if (action === "debit") {
            const val = Number(amount)
            if (isNaN(val) || val <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
            updated = await prisma.marketerProfile.update({
                where: { id: marketerId },
                data: { commissionBalance: { decrement: val } }
            })

            await sendNotification({
                userId: marketer.userId,
                type: "MARKETER_WALLET_DEBITED",
                title: "Wallet Debited",
                body: `Your marketer commission balance has been debited with ₦${val.toLocaleString()}.`,
                email: {
                    subject: "Marketer Wallet Debited - UFriends",
                    html: `<h3>Wallet Debited</h3><p>Your marketer commission balance has been debited with <strong>₦${val.toLocaleString()}</strong>.</p>`
                }
            })
        } else {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 })
        }

        return NextResponse.json({ ok: true, updated })

    } catch (err: any) {
        return NextResponse.json({ error: "Action failed", detail: err.message }, { status: 500 })
    }
}

