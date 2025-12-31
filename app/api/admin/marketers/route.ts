import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"
import { protect } from "@/lib/security"

export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req, { roles: ["ADMIN"] })
        if (!auth.ok) return auth.response

        const sec = await protect(req as any)
        if (!sec.allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

        // Fetch all profiles with user details
        const profiles = await prisma.marketerProfile.findMany({
            include: {
                user: {
                    select: {
                        email: true,
                        profile: {
                            select: {
                                name: true,
                                phone: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        })

        // Transform to match the shape expected by frontend logic (similar to mock)
        const data = profiles.map(p => ({
            id: p.id,
            userId: p.userId,
            fullName: p.user.profile?.name || "Unknown",
            email: p.user.email,
            phone: p.user.profile?.phone || "",
            status: p.status.toLowerCase(), // frontend expects lowercase 'pending', 'approved' etc usually
            state: p.state,
            lga: p.lga,
            marketingType: p.marketingType,
            passportUrl: p.passportUrl,
            validIdUrl: p.validIdUrl,
            referralCode: p.referralCode,
            commission: Number(p.totalCommission),
            withdrawableBalance: Number(p.commissionBalance),
            totalReferrals: p.totalReferrals,
            totalSales: Number(p.totalSales),
            createdAt: p.createdAt.toISOString(),
            marketerId: p.status === "Approved" ? p.userId : undefined // logic or maybe specialized field? field doesn't exist yet in schema so use userId or logic
        }))

        return NextResponse.json(data)

    } catch (err: any) {
        return NextResponse.json({ error: "Failed to fetch marketers", detail: err.message }, { status: 500 })
    }
}
