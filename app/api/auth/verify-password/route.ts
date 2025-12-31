import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { sanitizer } from "@/lib/validation"
import arcjet, { shield } from "@arcjet/next"

// Lighter Arcjet instance for password check - Shield only, no email validation overhead if not needed
// or we can reuse existing if we want consistency. For now, let's keep it minimal.
const aj = process.env.ARCJET_KEY
    ? arcjet({
        key: process.env.ARCJET_KEY!,
        rules: [
            shield({ mode: "LIVE" }),
        ],
    })
    : null

const verifySchema = z.object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(1),
})

export async function POST(req: Request) {
    try {
        const raw = await req.json()
        const parsed = verifySchema.safeParse(raw)
        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid input" }, { status: 422 })
        }

        const email = sanitizer.parse(parsed.data.email)
        const password = parsed.data.password

        // Basic protection against bots
        if (aj) {
            const decision = await aj.protect(req as any)
            if (decision.isDenied()) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 })
            }
        }

        const user = await prisma.user.findUnique({
            where: { email },
            select: { passwordHash: true }
        })

        if (!user) {
            // Use generic error to prevent enumeration
            return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
        }

        const ok = await bcrypt.compare(password, user.passwordHash)
        if (!ok) {
            return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
        }

        return NextResponse.json({ ok: true })
    } catch (err) {
        return NextResponse.json({ error: "Verification failed" }, { status: 500 })
    }
}
