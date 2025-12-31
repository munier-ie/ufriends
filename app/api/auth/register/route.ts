import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { sanitizer } from "@/lib/validation"
import { protect } from "@/lib/security"
import Ajv from "ajv"
import addFormats from "ajv-formats"

// Arcjet protection via shared helper (with email context)

const ajv = new Ajv({ allErrors: true, removeAdditional: true })
addFormats(ajv)
const registerSchema = {
  type: "object",
  required: ["email", "password", "name", "phone"],
  additionalProperties: false,
  properties: {
    email: { type: "string", format: "email" },
    password: { type: "string", minLength: 6 },
    name: { type: "string", minLength: 1 },
    phone: { type: "string", pattern: "^\\+?[0-9]{10,15}$" },
  },
} as const
const validateRegister = ajv.compile(registerSchema)

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // AJV validation first
    const valid = validateRegister(body)
    if (!valid) {
      return NextResponse.json({ error: "Invalid input", details: validateRegister.errors }, { status: 422 })
    }

    // Zod schema for types + transformations
    const schema = z.object({
      email: z.string().trim().toLowerCase().email(),
      password: z.string().min(6),
      name: z.string().trim().min(1),
      phone: z.string().trim().regex(/^\+?[0-9]{10,15}$/i, { message: "Invalid phone" }),
    })

    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 422 })
    }

    const email = sanitizer.parse(parsed.data.email)
    const password = parsed.data.password
    const name = sanitizer.parse(parsed.data.name)
    const phone = sanitizer.parse(parsed.data.phone)

    // Arcjet protection via shared helper
    const sec = await protect(req as any, { email })
    if (!sec.allowed) {
      return NextResponse.json({ error: "Request denied" }, { status: 429 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 })
    }
    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        profile: { create: { name, phone } },
      },
      select: { id: true, email: true, role: true, createdAt: true },
    })
    return NextResponse.json({ user })
  } catch (err) {
    return NextResponse.json({ error: "Registration failed", detail: String(err) }, { status: 500 })
  }
}