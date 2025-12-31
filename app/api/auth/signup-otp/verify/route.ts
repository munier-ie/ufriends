import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { protect } from "@/lib/security"
import { z } from "zod"
import { sanitizer } from "@/lib/validation"

// Centralized protection via shared helper

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const schema = z.object({
      email: z.string().trim().toLowerCase().email({ message: "Invalid email" }),
      code: z.string().trim().regex(/^[0-9]{6}$/i, { message: "Invalid code" }),
    })

    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 })
    }

    const email = sanitizer.parse(parsed.data.email)
    const code = sanitizer.parse(parsed.data.code)

    const sec = await protect(req as any, { email })
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const now = new Date()
    const otp = await prisma.otpCode.findFirst({
      where: { email, purpose: "signup", consumedAt: null, expiresAt: { gt: now } },
      orderBy: { createdAt: "desc" },
    })

    if (!otp) {
      return NextResponse.json({ error: "No active OTP found" }, { status: 404 })
    }

    if (otp.attempts >= 5) {
      // Auto-consume or block this OTP to prevent further brute-forcing.
      await prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } })
      return NextResponse.json({ error: "Too many failed attempts. Please request a new code." }, { status: 429 })
    }

    if (otp.code !== code) {
      const nextMeta = { attempts: { increment: 1 } }
      // If this was the last allowed attempt, just consume it now.
      if (otp.attempts + 1 >= 5) {
        await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 }, consumedAt: new Date() } })
        return NextResponse.json({ error: "Invalid OTP. Too many failed attempts." }, { status: 429 })
      }
      await prisma.otpCode.update({ where: { id: otp.id }, data: nextMeta })
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 })
    }

    await prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: "Failed to verify OTP" }, { status: 500 })
  }
}