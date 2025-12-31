import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/require-auth"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req)
        if (!auth.ok) return auth.response

        const disputes = await prisma.dispute.findMany({
            where: {
                userId: auth.user.id,
            },
            orderBy: {
                createdAt: "desc",
            },
        })

        return NextResponse.json({ ok: true, data: disputes })
    } catch (error) {
        console.error("[Disputes API] Failed to fetch disputes", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req)
        if (!auth.ok) return auth.response

        const body = await req.json()
        const { service, issue, reference, screenshotUrl } = body

        if (!service || !issue) {
            return NextResponse.json({ error: "Service and issue are required" }, { status: 400 })
        }

        const dispute = await prisma.dispute.create({
            data: {
                userId: auth.user.id,
                service,
                issue,
                reference,
                screenshotUrl,
                status: "OPEN",
            },
        })

        const { sendAdminNotification } = await import("@/lib/notifications")
        await sendAdminNotification({
            type: "NEW_DISPUTE",
            title: "New Dispute Logged",
            body: `User ${auth.user.email} logged a dispute for service: ${service}.`,
            email: {
                subject: `[Admin Alert] New Dispute: ${service}`,
                html: `
                    <h3>New Dispute Logged</h3>
                    <p><strong>User:</strong> ${auth.user.email}</p>
                    <p><strong>Service:</strong> ${service}</p>
                    <p><strong>Category:</strong> ${service}</p>
                    <p><strong>Issue:</strong> ${issue}</p>
                    <p><strong>Reference:</strong> ${reference || "N/A"}</p>
                    <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/disputes">View in Admin Dashboard</a></p>
                `
            }
        })

        return NextResponse.json({ ok: true, data: dispute })
    } catch (error) {
        console.error("[Disputes API] Failed to create dispute", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
