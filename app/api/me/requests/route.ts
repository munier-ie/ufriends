import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"

// GET /api/me/requests - Get user's service requests with proof
export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req)
        if (!auth.ok) return auth.response

        const { searchParams } = new URL(req.url)
        const status = searchParams.get("status")
        const page = Math.max(1, Number(searchParams.get("page") || 1))
        const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 20)))

        const where: any = {
            userId: auth.user.id,
            // Filter for service-related transactions (not just wallet credits/debits)
            type: { in: ["SERVICE_DEBIT", "SERVICE_REQUEST"] },
        }

        if (status) {
            where.status = status
        }

        const [transactions, total] = await prisma.$transaction([
            prisma.transaction.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.transaction.count({ where }),
        ])

        return NextResponse.json({
            ok: true,
            data: transactions,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        })
    } catch (err) {
        return NextResponse.json({ error: "Failed to fetch requests", detail: String(err) }, { status: 500 })
    }
}
