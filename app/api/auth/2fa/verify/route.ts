import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { authenticator } from "otplib"
import bcrypt from "bcryptjs"

// POST /api/auth/2fa/verify - Verify TOTP during login
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { email, code, tempToken } = body as { email?: string; code?: string; tempToken?: string }

        if (!email || !code) {
            return NextResponse.json({ error: "Email and code are required" }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
            select: { id: true, totpSecret: true, totpEnabled: true, role: true },
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        if (!user.totpEnabled || !user.totpSecret) {
            return NextResponse.json({ error: "2FA is not enabled for this user" }, { status: 400 })
        }

        const isValid = authenticator.verify({ token: code, secret: user.totpSecret })
        if (!isValid) {
            return NextResponse.json({ error: "Invalid verification code" }, { status: 401 })
        }

        // 2FA verified - Issue a proof token for NextAuth/Login to consume
        const { sign2FAProof } = await import("@/lib/jwt")
        const twoFactorProof = await sign2FAProof({ sub: user.id })

        return NextResponse.json({
            ok: true,
            verified: true,
            twoFactorProof,
            userId: user.id,
            role: user.role,
            message: "2FA verification successful"
        })
    } catch (err) {
        return NextResponse.json({ error: "2FA verification failed", detail: String(err) }, { status: 500 })
    }
}
