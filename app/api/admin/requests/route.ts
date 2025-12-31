import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"
import { z } from "zod"

export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req)
        // Basic admin check - adjust role check as needed per system design
        if (!auth.ok || auth.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        const { searchParams } = new URL(req.url)
        const status = searchParams.get("status")
        const page = Number(searchParams.get("page") || "1")
        const limit = Number(searchParams.get("limit") || "20")
        const skip = (page - 1) * limit

        const whereClause: any = {
            // Filter for manual service request statuses
            status: status ? { equals: status as any } : { in: ["SUBMITTED", "ONGOING", "REJECTED", "CANCELLED", "COMPLETED", "SUCCESS"] },
            // Optional: Filter by "manual" meta tag if you want to exclude automated successes
            // meta: { path: ['manual'], equals: true } 
            // But status filter might be enough since SUBMITTED/ONGOING are unique to manual flow mostly
        }

        // If we only want "manual" requests specifically, we can check for Type "SERVICE_REQUEST" 
        // or rely on the statuses that are primarily manual. 
        // Let's broaden to include "SUCCESS" if it was manual, but for now focus on active work.
        if (!status) {
            whereClause.status = { in: ["SUBMITTED", "ONGOING"] }
        }

        const [transactions, total] = await prisma.$transaction([
            prisma.transaction.findMany({
                where: whereClause,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
                include: {
                    user: {
                        select: { id: true, email: true, profile: { select: { name: true, phone: true } } }
                    }
                }
            }),
            prisma.transaction.count({ where: whereClause })
        ])

        return NextResponse.json({
            data: transactions,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        })

    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch requests", detail: String(error) }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const auth = await requireAuth(req)
        if (!auth.ok || auth.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        const body = await req.json()
        const UpdateSchema = z.object({
            id: z.string().min(1),
            status: z.enum(["ONGOING", "SUCCESS", "REJECTED", "CANCELLED"]), // Map COMPLETED to SUCCESS for consistency or keep separate
            adminNotes: z.string().optional(),
            proofUrl: z.string().optional(),
        })

        const parsed = UpdateSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid data", detail: parsed.error.flatten() }, { status: 400 })
        }

        const { id, status, adminNotes, proofUrl } = parsed.data

        const tx = await prisma.transaction.update({
            where: { id },
            data: {
                status: status as any,
                adminNotes,
                proofUrl,
            } as any
        })

        // Refund logic if Cancelled/Rejected
        if (status === "REJECTED" || status === "CANCELLED") {
            // Check if not already refunded
            // refund to wallet
            await prisma.wallet.update({
                where: { userId: tx.userId },
                data: { balance: { increment: tx.amount } }
            })
        }

        // Notify User
        const { sendNotification } = await import("@/lib/notifications")
        const statusMap: Record<string, string> = {
            "ONGOING": "is now processing",
            "SUCCESS": "has been completed successfully",
            "REJECTED": "has been rejected",
            "CANCELLED": "has been cancelled and refunded"
        }
        await sendNotification({
            userId: tx.userId,
            type: `SERVICE_${status}`,
            title: `Service Request Update: ${tx.category}`,
            body: `Your request for ${tx.category}${tx.subservice ? ` (${tx.subservice})` : ""} ${statusMap[status] || status.toLowerCase()}.${adminNotes ? ` Note: ${adminNotes}` : ""}`,
            email: {
                subject: `Service Update: ${tx.category} - UFriends`,
                html: `<h3>Service Request Update</h3><p>Your request for <strong>${tx.category}${tx.subservice ? ` (${tx.subservice})` : ""}</strong> ${statusMap[status] || status.toLowerCase()}.</p>${adminNotes ? `<p><strong>Admin Note:</strong> ${adminNotes}</p>` : ""}${proofUrl ? `<p><a href="${proofUrl}">View Result/Proof</a></p>` : ""}`
            }
        })

        return NextResponse.json({ ok: true, data: tx })


    } catch (error) {
        return NextResponse.json({ error: "Failed to update request", detail: String(error) }, { status: 500 })
    }
}
