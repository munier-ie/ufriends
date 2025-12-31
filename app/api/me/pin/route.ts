import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"
import bcrypt from "bcryptjs"
import { z } from "zod"

const schema = z.object({
    currentPassword: z.string().optional(),
    currentPin: z.string().optional(),
    newPin: z.string().length(4).regex(/^\d+$/),
})

export async function POST(req: NextRequest) {
    const auth = await requireAuth(req)
    if (!auth.ok) return auth.response

    try {
        const body = await req.json()
        const parsed = schema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 })
        }

        const { currentPassword, currentPin, newPin } = parsed.data

        const user = await prisma.user.findUnique({
            where: { id: auth.user.id },
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // If user already has a PIN, verify current PIN or Password
        if (user.transactionPin) {
            if (currentPin) {
                const isPinMatch = await bcrypt.compare(currentPin, user.transactionPin)
                if (!isPinMatch) {
                    return NextResponse.json({ error: "Current PIN does not match" }, { status: 400 })
                }
            } else if (currentPassword) {
                const isMatch = await bcrypt.compare(currentPassword, user.passwordHash)
                if (!isMatch) {
                    return NextResponse.json({ error: "Current password does not match" }, { status: 400 })
                }
            } else {
                return NextResponse.json({ error: "Current PIN or password required to update PIN" }, { status: 400 })
            }
        } else {
            // If first time setting PIN, require password for security
            if (!currentPassword) {
                return NextResponse.json({ error: "Current password required to set PIN for the first time" }, { status: 400 })
            }
            const isMatch = await bcrypt.compare(currentPassword, user.passwordHash)
            if (!isMatch) {
                return NextResponse.json({ error: "Current password does not match" }, { status: 400 })
            }
        }

        // Check if new PIN is the same as current PIN
        if (user.transactionPin) {
            const isSame = await bcrypt.compare(newPin, user.transactionPin)
            if (isSame) {
                return NextResponse.json({ error: "New PIN cannot be the same as current PIN" }, { status: 400 })
            }
        }

        const hashedPin = await bcrypt.hash(newPin, 10)

        await prisma.user.update({
            where: { id: user.id },
            data: { transactionPin: hashedPin },
        })

        return NextResponse.json({ ok: true, message: "Transaction PIN updated successfully" })
    } catch (err) {
        console.error("PIN update failed", err)
        return NextResponse.json({ error: "Failed to update PIN" }, { status: 500 })
    }
}
