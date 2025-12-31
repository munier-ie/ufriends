import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"
import bcrypt from "bcryptjs"

// POST /api/admin/settings/security - change password or toggle 2FA
export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req, { roles: ["ADMIN"] })
        if (!auth.ok) return auth.response

        const body = await req.json()
        const { action, currentPassword, newPassword, enable2FA } = body as {
            action: "changePassword" | "toggle2FA"
            currentPassword?: string
            newPassword?: string
            enable2FA?: boolean
        }

        const user = await prisma.user.findUnique({
            where: { id: auth.user.id },
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        if (action === "changePassword") {
            if (!currentPassword || !newPassword) {
                return NextResponse.json({ error: "Current and new passwords are required" }, { status: 400 })
            }

            if (newPassword.length < 8) {
                return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 })
            }

            // Verify current password
            const isValid = await bcrypt.compare(currentPassword, user.passwordHash)
            if (!isValid) {
                return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 })
            }

            // Check if new password is the same as current password
            const isSame = await bcrypt.compare(newPassword, user.passwordHash)
            if (isSame) {
                return NextResponse.json({ error: "New password cannot be the same as current password" }, { status: 400 })
            }

            // Hash new password and update
            const newHash = await bcrypt.hash(newPassword, 12)
            await prisma.user.update({
                where: { id: auth.user.id },
                data: { passwordHash: newHash },
            })

            return NextResponse.json({ ok: true, message: "Password changed successfully" })
        }

        if (action === "toggle2FA") {
            const user = await prisma.user.findUnique({
                where: { id: auth.user.id },
                select: { totpSecret: true }
            })

            if (enable2FA && !user?.totpSecret) {
                return NextResponse.json({ error: "Cannot enable 2FA without setup. Please scan QR code first." }, { status: 400 })
            }

            await prisma.user.update({
                where: { id: auth.user.id },
                data: { totpEnabled: enable2FA },
            })

            return NextResponse.json({ ok: true, message: `Two-factor authentication ${enable2FA ? "enabled" : "disabled"}` })
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    } catch (err) {
        return NextResponse.json({ error: "Failed to update security settings", detail: String(err) }, { status: 500 })
    }
}

// GET /api/admin/settings/security - get 2FA status
export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req, { roles: ["ADMIN"] })
        if (!auth.ok) return auth.response

        const user = await prisma.user.findUnique({
            where: { id: auth.user.id },
            select: { totpEnabled: true },
        })

        return NextResponse.json({ ok: true, twoFactorEnabled: user?.totpEnabled || false })
    } catch (err) {
        return NextResponse.json({ error: "Failed to fetch security settings", detail: String(err) }, { status: 500 })
    }
}
