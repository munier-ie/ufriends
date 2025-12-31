import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"
import { authenticator } from "otplib"
import * as QRCode from "qrcode"

// GET /api/auth/2fa/setup - Generate TOTP secret and QR code
export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req)
        if (!auth.ok) return auth.response

        const user = await prisma.user.findUnique({
            where: { id: auth.user.id },
            select: { email: true, totpSecret: true, totpEnabled: true },
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // If 2FA is already enabled, don't allow re-setup without disabling first
        if (user.totpEnabled) {
            return NextResponse.json({
                ok: true,
                enabled: true,
                message: "2FA is already enabled. Disable it first to set up a new authenticator."
            })
        }

        // Generate a new secret or use existing pending one
        let secret = user.totpSecret
        if (!secret) {
            secret = authenticator.generateSecret()
            // Store the secret (pending - not enabled yet)
            await prisma.user.update({
                where: { id: auth.user.id },
                data: { totpSecret: secret },
            })
        }

        // Generate QR code
        const appName = "UFriends"
        const otpAuthUrl = authenticator.keyuri(user.email, appName, secret)
        const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl)

        return NextResponse.json({
            ok: true,
            enabled: false,
            secret,
            qrCode: qrCodeDataUrl,
            message: "Scan the QR code with your authenticator app, then enter the code to verify."
        })
    } catch (err) {
        return NextResponse.json({ error: "Failed to setup 2FA", detail: String(err) }, { status: 500 })
    }
}

// POST /api/auth/2fa/setup - Verify TOTP code and enable 2FA
export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req)
        if (!auth.ok) return auth.response

        const body = await req.json()
        const { code, action } = body as { code?: string; action?: "disable" }

        const user = await prisma.user.findUnique({
            where: { id: auth.user.id },
            select: { totpSecret: true, totpEnabled: true },
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Handle disable action
        if (action === "disable") {
            if (!code) {
                return NextResponse.json({ error: "Code is required to disable 2FA" }, { status: 400 })
            }

            if (!user.totpSecret) {
                return NextResponse.json({ error: "2FA is not set up" }, { status: 400 })
            }

            const isValid = authenticator.verify({ token: code, secret: user.totpSecret })
            if (!isValid) {
                return NextResponse.json({ error: "Invalid code" }, { status: 401 })
            }

            await prisma.user.update({
                where: { id: auth.user.id },
                data: { totpEnabled: false, totpSecret: null },
            })

            return NextResponse.json({ ok: true, message: "2FA disabled successfully" })
        }

        // Handle enable/verify action
        if (!code) {
            return NextResponse.json({ error: "Verification code is required" }, { status: 400 })
        }

        if (!user.totpSecret) {
            return NextResponse.json({ error: "No pending 2FA setup. Generate a QR code first." }, { status: 400 })
        }

        const isValid = authenticator.verify({ token: code, secret: user.totpSecret })
        if (!isValid) {
            return NextResponse.json({ error: "Invalid verification code. Please try again." }, { status: 401 })
        }

        // Enable 2FA
        await prisma.user.update({
            where: { id: auth.user.id },
            data: { totpEnabled: true },
        })

        return NextResponse.json({ ok: true, message: "Two-factor authentication has been enabled!" })
    } catch (err) {
        return NextResponse.json({ error: "Failed to verify 2FA", detail: String(err) }, { status: 500 })
    }
}
