"use client"

import { useState } from "react"
import { z } from "zod"
import { ZodXssSanitizer, ACTION_LEVELS } from "zod-xss-sanitizer"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<"request" | "verify">("request")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)

  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [verifying, setVerifying] = useState(false)

  const sanitizer = ZodXssSanitizer.sanitizer({ actionLevel: ACTION_LEVELS.SANITIZE })

  const emailSchema = z.string().trim().toLowerCase().email()
  const resetSchema = z.object({ code: z.string().length(6), newPassword: z.string().min(6) })

  const requestReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const parsed = emailSchema.safeParse(email)
    if (!parsed.success) {
      toast.error("Enter a valid email address")
      return
    }
    const safeEmail = sanitizer.parse(parsed.data)

    try {
      setLoading(true)
      const res = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: safeEmail }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to request reset")
      toast.success("If your email exists, a reset code was sent.")
      setEmail(safeEmail)
      setStep("verify")
    } catch (err: any) {
      toast.error(err.message || "Reset request failed")
    } finally {
      setLoading(false)
    }
  }

  const verifyReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const parsed = resetSchema.safeParse({ code, newPassword: password })
    if (!parsed.success) {
      toast.error("Provide 6-digit code and password ≥ 6 chars")
      return
    }

    try {
      setVerifying(true)
      const res = await fetch("/api/auth/password-reset/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: parsed.data.code, newPassword: parsed.data.newPassword }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Invalid code or expired")
      toast.success("Password reset successful. Please sign in.")
      router.push("/login")
    } catch (err: any) {
      toast.error(err.message || "Reset failed")
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <h1 className="text-2xl font-semibold">Forgot Password</h1>
      {step === "request" && (
        <>
          <p className="text-sm text-muted-foreground mt-2">
            Enter your email to receive password reset instructions.
          </p>
          <form className="mt-6 space-y-4" onSubmit={requestReset}>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="w-full rounded border border-border bg-input px-3 py-2"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full rounded bg-primary text-primary-foreground px-3 py-2 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Code"}
            </button>
          </form>
        </>
      )}

      {step === "verify" && (
        <>
          <p className="text-sm text-muted-foreground mt-2">
            Enter the 6-digit code we sent to {email}, then choose a new password.
          </p>
          <form className="mt-6 space-y-4" onSubmit={verifyReset}>
            <div className="space-y-2">
              <label htmlFor="code" className="text-sm font-medium">Reset Code</label>
              <input
                id="code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="123456"
                className="w-full rounded border border-border bg-input px-3 py-2"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">New Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter a new password"
                className="w-full rounded border border-border bg-input px-3 py-2"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button type="button" className="rounded border px-3 py-2" onClick={() => setStep("request")}>Back</button>
              <button
                type="submit"
                className="flex-1 rounded bg-primary text-primary-foreground px-3 py-2 disabled:opacity-50"
                disabled={verifying || code.length !== 6 || password.length < 6}
              >
                {verifying ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  )
}