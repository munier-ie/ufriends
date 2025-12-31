import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/require-auth"
import { prisma } from "@/lib/db"
import { Role, DisputeStatus } from "@prisma/client"

export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req, { roles: [Role.ADMIN, Role.MARKETER] }) // Assuming marketers might help? Or just Admin. Let's stick to Admin.
        if (!auth.ok) return auth.response

        // Basic filtering
        const { searchParams } = new URL(req.url)
        const status = searchParams.get("status")
        const search = searchParams.get("search")

        const whereClause: any = {}
        if (status && status !== "all") {
            whereClause.status = status as DisputeStatus
        }

        // Search is harder with Prisma on multiple fields without full text search, but let's try basic OR
        if (search) {
            whereClause.OR = [
                { reference: { contains: search, mode: 'insensitive' } },
                { service: { contains: search, mode: 'insensitive' } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
                { user: { profile: { name: { contains: search, mode: 'insensitive' } } } },
            ]
        }

        const disputes = await prisma.dispute.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        email: true,
                        profile: {
                            select: { name: true }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 50, // Limit for now
        })

        // Transform for frontend
        const formatted = disputes.map(d => ({
            id: d.id,
            date: d.createdAt.toISOString().slice(0, 16).replace("T", " "),
            user: d.user.profile?.name || d.user.email,
            userEmail: d.user.email,
            service: d.service,
            refId: d.reference || "N/A",
            issue: d.issue,
            status: d.status.toLowerCase(), // frontend expects lowercase or we match enum
            adminNotes: d.adminNotes,
            screenshot: d.screenshotUrl,
            assignedTo: d.assignedTo
        }))

        return NextResponse.json({ ok: true, data: formatted })
    } catch (error) {
        console.error("[Admin Disputes API] Failed to fetch disputes", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const auth = await requireAuth(req, { roles: [Role.ADMIN] })
        if (!auth.ok) return auth.response

        const body = await req.json()
        const { id, status, adminNotes } = body

        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

        const updateData: any = {}
        if (status) updateData.status = status.toUpperCase() as DisputeStatus
        if (adminNotes !== undefined) updateData.adminNotes = adminNotes

        const updated = await prisma.dispute.update({
            where: { id },
            data: updateData,
        })

        if (status) {
            const { sendNotification } = await import("@/lib/notifications")
            await sendNotification({
                userId: updated.userId,
                type: "DISPUTE_UPDATE",
                title: `Dispute Update: ${status}`,
                body: `Your dispute for ${updated.service} is now ${status}. ${adminNotes ? `Admin Note: ${adminNotes}` : ""}`,
                email: {
                    subject: `Dispute Update: ${updated.service} is ${status}`,
                    html: `
                        <h3>Dispute Status Update</h3>
                        <p>Your dispute regarding <strong>${updated.service}</strong> has been updated.</p>
                        <p><strong>New Status:</strong> <span style="color:blue">${status}</span></p>
                        ${adminNotes ? `<p><strong>Admin Note:</strong> ${adminNotes}</p>` : ""}
                        <p>Login to your dashboard to view more details.</p>
                    `
                }
            })
        }

        return NextResponse.json({ ok: true, data: updated })
    } catch (error) {
        console.error("[Admin Disputes API] Failed to update dispute", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
