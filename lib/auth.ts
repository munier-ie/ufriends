import NextAuth from "next-auth"
import type { NextAuthOptions } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import { protect } from "@/lib/security"
import Joi from "joi"
import { sanitizer } from "@/lib/validation"

const isProd = process.env.NODE_ENV === "production"

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        twoFactorProof: { label: "2FA Proof", type: "text" },
      },
      async authorize(credentials, req) {
        console.log("AUTH DEBUG: authorize called with", { email: credentials?.email })
        // Basic input validation with Joi
        const schema = Joi.object({
          // Allow non-public TLDs (e.g., .local) in development; enforce strict in production
          email: isProd
            ? Joi.string().email().required()
            : Joi.string().email({ tlds: { allow: false } }).required(),
          password: Joi.string().min(6).required(),
        })
        const { error, value } = schema.validate({
          email: credentials?.email,
          password: credentials?.password,
        })
        if (error) {
          console.log("AUTH DEBUG: Joi validation error", error)
          return null
        }

        // Sanitize email using shared sanitizer
        const safeEmail = sanitizer.parse(value.email.trim().toLowerCase())

        // Centralized protection: Shield/email validation handled by shared helper
        try {
          const sec = await protect(req as any, { email: safeEmail })
          if (!sec.allowed) {
            console.log("AUTH DEBUG: Protected by Arcjet/Security")
            return null
          }
        } catch {
          // Fail open to avoid login lockouts if Arcjet fails
        }

        // Credentials auth
        const user = await prisma.user.findUnique({ where: { email: safeEmail } })
        if (!user) {
          console.log("AUTH DEBUG: User not found", safeEmail)
          return null
        }
        const ok = await bcrypt.compare(value.password, user.passwordHash)
        if (!ok) {
          console.log("AUTH DEBUG: Password mismatch for", safeEmail)
          return null
        }

        // ENFORCE 2FA
        if (user.totpEnabled) {
          if (!credentials?.twoFactorProof) {
            console.log("AUTH DEBUG: 2FA required but proof missing")
            throw new Error("2FA_REQUIRED")
          }
          try {
            const { verify2FAProof } = await import("@/lib/jwt")
            const proof = await verify2FAProof(credentials.twoFactorProof)
            if (proof.sub !== user.id) throw new Error("INVALID_PROOF")
          } catch (e) {
            console.log("AUTH DEBUG: 2FA proof verification failed")
            throw new Error("2FA_EXPIRED")
          }
        }

        console.log("AUTH DEBUG: Auth successful for", safeEmail)
        return { id: user.id, email: user.email, role: user.role }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        ; (token as any).id = (user as any).id
          ; (token as any).role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ; (session.user as any).id = (token as any).id
          ; (session.user as any).role = (token as any).role
      }
      return session
    },
  },
}