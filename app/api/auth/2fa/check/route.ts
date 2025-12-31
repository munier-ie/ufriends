import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// POST /api/auth/2fa/check - Check if user has 2FA enabled (before login completion)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { email } = body as { email?: string }

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
            select: { totpEnabled: true },
        })

        if (!user) {
            // Don't reveal if user exists, return as if 2FA is not enabled
            return NextResponse.json({ ok: true, requires2FA: false })
        }

        return NextResponse.json({ ok: true, requires2FA: user.totpEnabled === true })
    } catch (err) {
        return NextResponse.json({ requires2FA: false })
    }
}
