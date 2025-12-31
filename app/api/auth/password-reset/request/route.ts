import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { sendOtpEmail } from "@/lib/mailer"
import { protect } from "@/lib/security"
import { z } from "zod"
import { sanitizer } from "@/lib/validation"

// Centralized protection via shared helper
const schema = z.object({ email: z.string().trim().toLowerCase().email() })

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: Request) {
  try {
    const ip = (req as any).ip || undefined
    const json = await req.json().catch(() => ({}))
    const parsed = schema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 })
    }
    const email = sanitizer.parse(parsed.data.email)

    try {
      const sec = await protect(req as any, { email })
      if (!sec.allowed) {
        return NextResponse.json({ error: "Request denied" }, { status: 429 })
      }
    } catch {}

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    if (!user) {
      // Do not reveal whether the email exists; return ok
      return NextResponse.json({ ok: true })
    }

    const since = new Date(Date.now() - 60 * 60 * 1000) // last 1 hour
    const recentCount = await prisma.otpCode.count({ where: { email, purpose: "password_reset", createdAt: { gte: since } } })
    if (recentCount >= 5) {
      return NextResponse.json({ error: "Too many reset requests. Try later." }, { status: 429 })
    }

    const code = generateOtp()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    await prisma.otpCode.create({ data: { email, code, purpose: "password_reset", expiresAt, ip } })

    await sendOtpEmail(email, code)

    return NextResponse.json({ ok: true, expiresAt })
  } catch (err) {
    return NextResponse.json({ error: "Failed to request password reset" }, { status: 500 })
  }
}