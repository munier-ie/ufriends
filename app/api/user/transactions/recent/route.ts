import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/require-auth"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req)
        if (!auth.ok) return auth.response

        const { searchParams } = new URL(req.url)
        const category = searchParams.get("category")

        const where: any = {
            userId: auth.user.id
        }

        if (category && category !== "OTHER" && category !== "WALLET") {
            // Match category loosely or exactly
            // Our DB categories are typically lowercase like 'bvn', 'nin', 'airtime'
            // The frontend sends 'BVN', 'NIN', etc.
            where.category = { equals: category, mode: 'insensitive' }
        }

        const transactions = await prisma.transaction.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: 20,
            select: {
                id: true,
                reference: true,
                amount: true,
                status: true,
                createdAt: true,
                category: true,
                subservice: true,
            }
        })

        return NextResponse.json({ ok: true, data: transactions })
    } catch (error) {
        console.error("Failed to fetch recent transactions", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
