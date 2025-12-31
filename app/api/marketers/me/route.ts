import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"
import { protect } from "@/lib/security"

export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req)
        if (!auth.ok) return auth.response

        const sec = await protect(req as any)
        if (!sec.allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

        const profile = await prisma.marketerProfile.findUnique({
            where: { userId: auth.user.id }
        })

        if (!profile) {
            return NextResponse.json({ ok: true, profile: null })
        }

        // Find the user's name/email to return complete dashboard data if needed
        // But the frontend mainly needs the profile stats
        const user = await prisma.user.findUnique({
            where: { id: auth.user.id },
            select: { email: true, profile: { select: { name: true, phone: true } } }
        })

        return NextResponse.json({
            ok: true,
            profile: {
                ...profile,
                fullName: user?.profile?.name || "Marketer",
                email: user?.email,
                phone: user?.profile?.phone
            }
        })

    } catch (err: any) {
        return NextResponse.json({ error: "Failed to fetch profile", detail: err.message }, { status: 500 })
    }
}
