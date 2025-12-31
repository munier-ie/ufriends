import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { sendOtpEmail } from "@/lib/mailer"
import { sendOtpSms } from "@/lib/sms"
import { protect } from "@/lib/security"
import { z } from "zod"
import { sanitizer } from "@/lib/validation"

// Centralized protection via shared helper

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const schema = z
      .object({
        email: z.string().trim().toLowerCase().email({ message: "Invalid email" }).optional(),
        phone: z
          .string()
          .trim()
          .regex(/^\+?[0-9]{10,15}$/i, { message: "Invalid phone" })
          .optional(),
      })
      .refine((d) => !!d.email || !!d.phone, { message: "Provide email or phone" })

    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 })
    }

    const email = parsed.data.email ? sanitizer.parse(parsed.data.email) : undefined
    const phone = parsed.data.phone ? sanitizer.parse(parsed.data.phone) : undefined

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 })
    }

    const sec = await protect(req as any, { email })
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const ip = (req as any).ip || undefined

    // Rate limiting: max 5 requests per 15 minutes per email
    const windowMs = 15 * 60 * 1000
    const since = new Date(Date.now() - windowMs)
    const recentCount = await prisma.otpCode.count({ where: { email, purpose: "signup", createdAt: { gte: since } } })
    if (recentCount >= 5) {
      return NextResponse.json({ error: "Too many OTP requests. Try later." }, { status: 429 })
    }

    const code = generateOtp()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    await prisma.otpCode.create({ data: { email, phone: phone || null, code, purpose: "signup", expiresAt, ip } })

    // Send via email
    if (email) {
      await sendOtpEmail(email, code)
    }
    // Send via SMS if phone provided (stub)
    if (phone) {
      await sendOtpSms(phone, code)
    }

    // Do NOT leak code in responses
    return NextResponse.json({ ok: true, expiresAt })
  } catch (err) {
    return NextResponse.json({ error: "Failed to request OTP" }, { status: 500 })
  }
}