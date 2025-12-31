import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"
import bcrypt from "bcryptjs"
import { z } from "zod"

const schema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
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

        const { currentPassword, newPassword } = parsed.data

        const user = await prisma.user.findUnique({
            where: { id: auth.user.id },
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash)
        if (!isMatch) {
            return NextResponse.json({ error: "Current password does not match" }, { status: 400 })
        }

        const passwordHash = await bcrypt.hash(newPassword, 10)
        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash },
        })

        return NextResponse.json({ ok: true, message: "Password changed successfully" })
    } catch (err) {
        console.error("Password change failed", err)
        return NextResponse.json({ error: "Failed to change password" }, { status: 500 })
    }
}
