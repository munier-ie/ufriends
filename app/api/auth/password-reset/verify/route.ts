import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import { protect } from "@/lib/security"
import { z } from "zod"
import { sanitizer } from "@/lib/validation"

// Centralized protection via shared helper
const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z.string().length(6),
  newPassword: z.string().min(6),
})

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => ({}))
    const parsed = schema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const email = sanitizer.parse(parsed.data.email)
    const code = parsed.data.code
    const newPassword = parsed.data.newPassword

    try {
      const sec = await protect(req as any, { email })
      if (!sec.allowed) {
        return NextResponse.json({ error: "Request denied" }, { status: 429 })
      }
    } catch { }

    const now = new Date()
    const otp = await prisma.otpCode.findFirst({
      where: {
        email,
        purpose: "password_reset",
        expiresAt: { gt: now },
        consumedAt: null,
      },
      orderBy: { createdAt: "desc" },
    })

    if (!otp) {
      return NextResponse.json({ error: "No active password reset code found" }, { status: 404 })
    }

    if (otp.attempts >= 5) {
      await prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } })
      return NextResponse.json({ error: "Too many failed attempts. Please request a new code." }, { status: 429 })
    }

    if (otp.code !== code) {
      if (otp.attempts + 1 >= 5) {
        await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 }, consumedAt: new Date() } })
        return NextResponse.json({ error: "Invalid code. Too many failed attempts." }, { status: 429 })
      }
      await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } })
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    if (!user) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)

    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
      prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } }),
      prisma.refreshToken.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } }),
    ])

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 })
  }
}