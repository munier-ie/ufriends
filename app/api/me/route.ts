import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { protect } from "@/lib/security"
import { requireAuth } from "@/lib/require-auth"
import { z } from "zod"
import { sanitizer } from "@/lib/validation"

// Arcjet protection via shared helper (with email context)

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response

  // Fetch the user first to obtain a reliable email for Arcjet validation
  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: { id: true, email: true, role: true, isKycVerified: true, transactionPin: true, profile: { select: { name: true, phone: true } } } as any,
  }) as any

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // Apply Arcjet protections (Shield + email validation via rules) with email context
  const sec = await protect(req as any, { email: user.email })
  if (!sec.allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json({ user, profile: user.profile, hasPin: !!user.transactionPin })
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response

  try {
    const body = await req.json()

    // Validate input
    const updateSchema = z.object({
      name: z.string().trim().min(1).optional(),
      phone: z.string().trim().regex(/^\+?[0-9]{10,15}$/, { message: "Invalid phone number" }).optional(),
    })

    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 422 })
    }

    const { name: rawName, phone: rawPhone } = parsed.data

    if (!rawName && !rawPhone) {
      return NextResponse.json({ error: "Missing update fields" }, { status: 400 })
    }

    // Sanitize input
    const updateData: any = {}
    if (rawName) updateData.name = sanitizer.parse(rawName)
    if (rawPhone) updateData.phone = sanitizer.parse(rawPhone)

    const user = await prisma.user.update({
      where: { id: auth.user.id },
      data: {
        profile: {
          upsert: {
            create: updateData,
            update: updateData,
          },
        },
      },
      include: { profile: true },
    })

    return NextResponse.json({ ok: true, profile: user.profile })
  } catch (err) {
    console.error("Profile update failed", err)
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }
}