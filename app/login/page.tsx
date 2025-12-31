"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, ArrowLeft } from "lucide-react"
import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { signIn, getSession } from "next-auth/react"
import { saveTokens } from "@/lib/client-auth"
import { toast } from "sonner"
import { z } from "zod"
import { ZodXssSanitizer, ACTION_LEVELS } from "zod-xss-sanitizer"
import { FieldError } from "@/components/ui/field"

export default function LoginPage() {
  return (
    <div className="min-h-screen crosshatch-bg flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Content - Updated illustration to match FAQ style */}
        <div className="hidden lg:block relative">
          <div className="text-center lg:text-left mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
              Welcome Back to <span className="text-primary">UFriends IT</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 text-pretty">
              Sign in to access your secure financial dashboard and continue managing your transactions.
            </p>
          </div>

          {/* Login Illustration - matching FAQ style */}
          <div className="relative max-w-md mx-auto lg:mx-0">
            <img
              src="/login-signup-illustration.png"
              alt="Login illustration showing user authentication interface"
              className="w-full h-auto rounded-2xl shadow-lg"
            />

            {/* Floating Elements - matching FAQ style */}
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-bold">🔐</span>
              </div>
            </div>

            <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-secondary/20 rounded-full flex items-center justify-center">
              <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                <span className="text-secondary-foreground text-lg font-bold">✓</span>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center lg:text-left">
            <p className="text-muted-foreground mb-4">Secure & Trusted Platform</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-muted-foreground">Bank-Level Security</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-muted-foreground">50,000+ Trusted Users</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content - Login Form */}
        <div className="w-full max-w-md mx-auto">
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>

            <div className="flex items-center space-x-2 mb-6">
              <Image src="/ufriend-logo.png" alt="UFriends Logo" width={32} height={32} className="w-8 h-8" />
              <span className="font-bold text-xl text-foreground">UFriends IT</span>
            </div>
          </div>

          <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-card-foreground">Welcome back</CardTitle>
              <CardDescription className="text-muted-foreground">Sign in to your account to continue</CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm />
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Link href="/signup" className="text-primary hover:text-primary/80 font-medium">
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function LoginForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const sanitizer = ZodXssSanitizer.sanitizer({ actionLevel: ACTION_LEVELS.SANITIZE })

  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({})

  const validateEmail = (v: string) => {
    const schema = z.string().trim().toLowerCase().email({ message: "Enter a valid email" })
    const res = schema.safeParse(v)
    return res.success ? undefined : (res.error.issues[0]?.message || "Invalid email")
  }
  const validatePassword = (v: string) => {
    const schema = z.string().min(6, { message: "Password must be ≥ 6 characters" })
    const res = schema.safeParse(v)
    return res.success ? undefined : (res.error.issues[0]?.message || "Invalid password")
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Client-side validation and sanitization
    const schema = z.object({
      email: z.string().trim().toLowerCase().email(),
      password: z.string().min(6),
    })
    const parsed = schema.safeParse({ email, password })

    // set field errors when submitting
    setErrors({
      email: validateEmail(email),
      password: validatePassword(password),
    })

    if (!parsed.success) {
      toast.error("Please provide a valid email and password (≥6 chars)")
      return
    }
    const safeEmail = sanitizer.parse(parsed.data.email)
    const safePassword = parsed.data.password

    try {
      setLoading(true)

      // First check if 2FA is enabled for this user
      const check2FARes = await fetch("/api/auth/2fa/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: safeEmail }),
      })
      const check2FAData = await check2FARes.json()

      // If 2FA is required, verify password first then redirect to 2FA page
      if (check2FAData.requires2FA) {
        // Verify password is correct before going to 2FA
        const verifyRes = await fetch("/api/auth/verify-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: safeEmail, password: safePassword }),
        })

        if (!verifyRes.ok) {
          const errData = await verifyRes.json()
          toast.error(errData.error || "Invalid email or password")
          return
        }

        // Password verified, store temporarily and redirect to 2FA
        sessionStorage.setItem("2fa_temp_password", safePassword)
        router.push(`/login/2fa?email=${encodeURIComponent(safeEmail)}`)
        return
      }

      // No 2FA - proceed with normal login
      const res = await signIn("credentials", {
        email: safeEmail,
        password: safePassword,
        redirect: false,
      })

      if (res?.ok) {
        toast.success("Signed in successfully")

        // Also obtain API tokens and store in localStorage for authenticated API calls
        try {
          const tokenRes = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: safeEmail, password: safePassword }),
          })
          if (tokenRes.ok) {
            const data = await tokenRes.json()
            const access = data?.tokens?.accessToken as string | undefined
            const refresh = data?.tokens?.refreshToken as string | undefined
            if (access && refresh) {
              saveTokens({ accessToken: access, refreshToken: refresh })
            }
          }
        } catch { }

        // Fetch session to determine role and redirect appropriately
        const session = await getSession()
        const role = (session?.user as any)?.role
        router.push(role === "ADMIN" ? "/admin" : "/dashboard")
      } else {
        toast.error(res?.error || "Invalid email or password")
      }
    } catch (err: any) {
      toast.error(err.message || "Sign-in failed")
    } finally {
      setLoading(false)
    }
  }


  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-foreground">
          Email Address
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          className="bg-input border-border focus:border-primary focus:ring-primary/20"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (touched.email) {
              setErrors((prev) => ({ ...prev, email: validateEmail(e.target.value) }))
            }
          }}
          onBlur={() => {
            setTouched((t) => ({ ...t, email: true }))
            setErrors((prev) => ({ ...prev, email: validateEmail(email) }))
          }}
        />
        <FieldError errors={[errors.email ? { message: errors.email } : undefined]} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-foreground">
          Password
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            className="bg-input border-border focus:border-primary focus:ring-primary/20 pr-10"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (touched.password) {
                setErrors((prev) => ({ ...prev, password: validatePassword(e.target.value) }))
              }
            }}
            onBlur={() => {
              setTouched((t) => ({ ...t, password: true }))
              setErrors((prev) => ({ ...prev, password: validatePassword(password) }))
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <FieldError errors={[errors.password ? { message: errors.password } : undefined]} />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <input
            id="remember"
            type="checkbox"
            className="w-4 h-4 text-primary border-border rounded focus:ring-primary/20"
          />
          <Label htmlFor="remember" className="text-sm text-muted-foreground">
            Remember me
          </Label>
        </div>
        <Link href="/forgot-password" className="text-sm text-primary hover:text-primary/80">
          Forgot password?
        </Link>
      </div>

      <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={loading}>
        {loading ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  )
}
