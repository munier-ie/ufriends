import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"
import { protect } from "@/lib/security"

export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req)
        if (!auth.ok) return auth.response

        const sec = await protect(req as any)
        if (!sec.allowed) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const userId = auth.user.id
        const now = new Date()

        // Last 30 days for Transactions card
        const thirtyDaysAgo = new Date(now)
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const sixtyDaysAgo = new Date(now)
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

        // Current month for Savings card
        const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

        const [
            txCountCurrent,
            txCountPrevious,
            servicesUsed,
            savingsCurrent,
            savingsPrevious
        ] = await Promise.all([
            // Transactions: Count of success in last 30 days
            prisma.transaction.count({
                where: { userId, status: "SUCCESS", createdAt: { gte: thirtyDaysAgo } }
            }),
            // Transactions: Count of success in previous 30 days (31-60 days ago)
            prisma.transaction.count({
                where: { userId, status: "SUCCESS", createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } }
            }),
            // Services Used: Unique categories
            prisma.transaction.groupBy({
                by: ['category'],
                where: { userId, status: "SUCCESS" },
                _count: { category: true }
            }),
            // Monthly Savings: Sum of (userPrice - amountPaid) for current month
            prisma.transaction.aggregate({
                where: { userId, status: "SUCCESS", createdAt: { gte: firstDayOfCurrentMonth } },
                _sum: { amountPaid: true, basePrice: true }
            }),
            // Monthly Savings: Sum of (userPrice - amountPaid) for last month
            prisma.transaction.aggregate({
                where: { userId, status: "SUCCESS", createdAt: { gte: firstDayOfLastMonth, lt: firstDayOfCurrentMonth } },
                _sum: { amountPaid: true, basePrice: true }
            })
        ])

        // Calculate growth percentages
        const calculateGrowth = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0
            return Math.round(((current - previous) / previous) * 100)
        }

        const txGrowth = calculateGrowth(txCountCurrent, txCountPrevious)

        // My understanding of Savings: Difference between what a regular user pays vs what this user paid (if they are a marketer)
        // Actually, looking at the schema, we have 'amountPaid' and 'basePrice' and 'profit' (for admin).
        // The previous implementation used 'userPrice' to determine what to show the user.
        // However, the Transaction model has 'amountPaid' and 'basePrice'.
        // If a user is a MARKETER, they pay 'marketerPrice'.
        // 'Savings' for a marketer could be (userPrice - marketerPrice).
        // But the Transaction model doesn't explicitly store 'userPrice' unless it's in meta or 'amount' (which is usually the amount debited).

        // Let's refine the savings calculation. 
        // In pricing/route.ts, we see:
        // const selected = role === "marketer" ? Number(foundPricing.marketerPrice) : Number(foundPricing.userPrice)

        // In transaction/[reference]/status/route.ts:
        // const amountPaid = Number(tx.amountPaid ?? tx.amount ?? 0)
        // const basePrice = Number(tx.basePrice ?? 0)
        // const profit = amountPaid - basePrice

        // If we want to show 'Savings', we might need to know what the 'userPrice' would have been.
        // For now, let's use a simpler heuristic or assume 'savings' is tracked in meta if it was calculated.
        // Alternatively, if the user is a marketer, we can estimate savings if we had 'userPrice'.

        // Let's look at the implementation of transactions again.
        // Usually, when a transaction is created, 'amountPaid' is what the user actually paid.
        // If we don't have 'userPrice' in the Transaction table, we could try to look it up, but that's complex and slow.
        // Maybe 'Savings' in this context meant something else? 
        // Wait, the mock data shows "Monthly Savings: ₦2,340".

        // I'll check if any other field in Transaction could represent savings.
        // The Transaction model has: amountPaid, basePrice, profit.
        // 'profit' is for the platform.

        // If I cannot find a direct 'savings' field, I'll calculate it as 0 for now or try to infer it.
        // Actually, let's check if 'meta' contains 'savings'.

        // Calculate the "Savings" for marketers.
        // Savings = (Sum of what a regular user would pay) - (Sum of what this user actually paid)
        // We only calculate this for Marketers.
        let savingsValCurrent = 0
        let savingsValPrevious = 0

        const userProfile = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true }
        })

        if (userProfile?.role === "MARKETER") {
            // Find all successful service purchases for the current month
            const currentMonthTxs = await prisma.transaction.findMany({
                where: {
                    userId,
                    status: "SUCCESS",
                    type: "SERVICE_PURCHASE",
                    createdAt: { gte: firstDayOfCurrentMonth }
                },
                select: {
                    amountPaid: true,
                    meta: true
                }
            })

            for (const tx of currentMonthTxs) {
                const amtPaid = Number(tx.amountPaid || 0)
                const storedUserPrice = (tx.meta as any)?.userPrice
                if (storedUserPrice) {
                    savingsValCurrent += (Number(storedUserPrice) - amtPaid)
                } else {
                    const originalAmount = Number((tx as any).amount || amtPaid)
                    if (originalAmount > amtPaid) {
                        savingsValCurrent += (originalAmount - amtPaid)
                    }
                }
            }

            // Repeat for previous month
            const lastMonthTxs = await prisma.transaction.findMany({
                where: {
                    userId,
                    status: "SUCCESS",
                    type: "SERVICE_PURCHASE",
                    createdAt: { gte: firstDayOfLastMonth, lt: firstDayOfCurrentMonth }
                },
                select: {
                    amountPaid: true,
                    meta: true
                }
            })
            for (const tx of lastMonthTxs) {
                const amtPaid = Number(tx.amountPaid || 0)
                const storedUserPrice = (tx.meta as any)?.userPrice
                if (storedUserPrice) {
                    savingsValPrevious += (Number(storedUserPrice) - amtPaid)
                } else {
                    const originalAmount = Number((tx as any).amount || amtPaid)
                    if (originalAmount > amtPaid) {
                        savingsValPrevious += (originalAmount - amtPaid)
                    }
                }
            }
        }

        const savingsGrowth = calculateGrowth(savingsValCurrent, savingsValPrevious)

        const uniqueServices = servicesUsed.filter((s: any) => s.category).length

        return NextResponse.json({
            ok: true,
            stats: {
                transactions: {
                    value: txCountCurrent,
                    growth: txGrowth,
                },
                servicesUsed: {
                    value: uniqueServices,
                    total: 12, // As per UI
                },
                savings: {
                    value: savingsValCurrent,
                    growth: savingsGrowth,
                }
            }
        })
    } catch (err) {
        console.error("Dashboard stats error:", err)
        return NextResponse.json({ error: "Failed to load dashboard stats" }, { status: 500 })
    }
}
