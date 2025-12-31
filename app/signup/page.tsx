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
import { signIn } from "next-auth/react"
import { toast } from "sonner"
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp"
import { z } from "zod"
import { ZodXssSanitizer, ACTION_LEVELS } from "zod-xss-sanitizer"
import { FieldError } from "@/components/ui/field"

export default function SignupPage() {
  return (
    <div className="min-h-screen crosshatch-bg flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Content - Updated illustration to match FAQ style */}
        <div className="hidden lg:block relative">
          <div className="text-center lg:text-left mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
              Join <span className="text-primary">UFriends IT</span> Today
            </h2>
            <p className="text-lg text-muted-foreground mb-8 text-pretty">
              Create your account and start enjoying secure, fast, and reliable financial services.
            </p>
          </div>

          <div className="relative max-w-md mx-auto lg:mx-0">
            <img
              src="/login-signup-illustration.png"
              alt="User registration and signup illustration"
              className="w-full h-auto rounded-2xl shadow-lg"
            />

            {/* Floating Elements - matching FAQ style */}
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-bold">+</span>
              </div>
            </div>

            <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-secondary/20 rounded-full flex items-center justify-center">
              <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                <span className="text-secondary-foreground text-lg font-bold">🎉</span>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center lg:text-left">
            <p className="text-muted-foreground mb-4">Join Our Growing Community</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-muted-foreground">Free Account Setup</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-muted-foreground">Instant Verification</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content - Signup Form */}
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
              <CardTitle className="text-2xl font-bold text-card-foreground">Create your account</CardTitle>
              <CardDescription className="text-muted-foreground">
                Join thousands of users managing their finances with UFriends IT
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SignupForm />
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:text-primary/80 font-medium">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function SignupForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<"form" | "otp">("form")
  const [otp, setOtp] = useState("")
  const [otpLoading, setOtpLoading] = useState(false)
  const sanitizer = ZodXssSanitizer.sanitizer({ actionLevel: ACTION_LEVELS.SANITIZE })

  const [errors, setErrors] = useState<{
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    password?: string
    confirmPassword?: string
  }>({})
  const [touched, setTouched] = useState<{
    firstName?: boolean
    lastName?: boolean
    email?: boolean
    phone?: boolean
    password?: boolean
    confirmPassword?: boolean
  }>({})

  const validateFirstName = (v: string) => {
    const res = z.string().trim().min(1, { message: "First name is required" }).safeParse(v)
    return res.success ? undefined : (res.error.issues[0]?.message || "Invalid first name")
  }
  const validateLastName = (v: string) => {
    const res = z.string().trim().min(1, { message: "Last name is required" }).safeParse(v)
    return res.success ? undefined : (res.error.issues[0]?.message || "Invalid last name")
  }
  const validateEmail = (v: string) => {
    const res = z.string().trim().toLowerCase().email({ message: "Enter a valid email" }).safeParse(v)
    return res.success ? undefined : (res.error.issues[0]?.message || "Invalid email")
  }
  const validatePhone = (v: string) => {
    const res = z
      .string()
      .trim()
      .regex(/^\+?[0-9]{10,15}$/i, { message: "Enter a valid phone" })
      .safeParse(v)
    return res.success ? undefined : (res.error.issues[0]?.message || "Invalid phone")
  }
  const validatePassword = (v: string) => {
    const res = z.string().min(6, { message: "Password must be ≥ 6 characters" }).safeParse(v)
    return res.success ? undefined : (res.error.issues[0]?.message || "Invalid password")
  }
  const validateConfirmPassword = (v: string, pwd: string) => {
    const base = z.string().min(6, { message: "Confirm password must be ≥ 6" }).safeParse(v)
    if (!base.success) return base.error.issues[0]?.message || "Invalid confirm password"
    return v === pwd ? undefined : "Passwords do not match"
  }

  const passwordStrength = (pwd: string) => {
    let score = 0
    const length = pwd.length
    const hasLower = /[a-z]/.test(pwd)
    const hasUpper = /[A-Z]/.test(pwd)
    const hasNumber = /\d/.test(pwd)
    const hasSymbol = /[^A-Za-z0-9]/.test(pwd)
    if (length >= 6) score++
    if (length >= 10) score++
    if (hasLower && hasUpper) score++
    if (hasNumber && hasSymbol) score++
    const labels = ["Very weak", "Weak", "Okay", "Good", "Strong"]
    const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500", "bg-green-600"]
    const idx = Math.min(score, 4)
    return { score: idx, label: labels[idx], color: colors[idx] }
  }

  const StrengthMeter = ({ value }: { value: string }) => {
    const { score, label, color } = passwordStrength(value)
    const pct = (score / 4) * 100
    return (
      <div className="mt-1">
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-1">Strength: {label}</p>
      </div>
    )
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Client-side validation for signup
    const schema = z
      .object({
        firstName: z.string().trim().min(1),
        lastName: z.string().trim().min(1),
        email: z.string().trim().toLowerCase().email(),
        phone: z.string().trim().regex(/^\+?[0-9]{10,15}$/i, { message: "Invalid phone" }),
        password: z.string().min(6),
        confirmPassword: z.string().min(6),
      })
      .refine((d) => d.password === d.confirmPassword, {
        path: ["confirmPassword"],
        message: "Passwords do not match",
      })

    const parsed = schema.safeParse({ firstName, lastName, email, phone, password, confirmPassword })

    // set field errors when submitting
    setErrors({
      firstName: validateFirstName(firstName),
      lastName: validateLastName(lastName),
      email: validateEmail(email),
      phone: validatePhone(phone),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(confirmPassword, password),
    })

    if (!parsed.success) {
      const err = parsed.error.issues[0]
      toast.error(err?.message || "Please check your inputs")
      return
    }

    const safeEmail = sanitizer.parse(parsed.data.email)
    const safeName = sanitizer.parse(`${parsed.data.firstName} ${parsed.data.lastName}`.trim())
    const safePhone = sanitizer.parse(parsed.data.phone)
    const safePassword = parsed.data.password

    try {
      setLoading(true)
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: safeEmail, password: safePassword, name: safeName, phone: safePhone }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to register")
      }

      // Request OTP
      const otpReq = await fetch("/api/auth/signup-otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: safeEmail, phone: safePhone }),
      })
      const otpData = await otpReq.json().catch(() => ({}))
      if (!otpReq.ok) {
        throw new Error(otpData.error || "Failed to request OTP")
      }

      toast.info("OTP sent. Please enter the 6-digit code.")
      // Persist sanitized values for OTP step and subsequent sign-in
      setEmail(safeEmail)
      setPhone(safePhone)
      setStep("otp")
    } catch (err: any) {
      toast.error(err.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  const onVerifyOtp = async () => {
    try {
      setOtpLoading(true)
      if (!otp || otp.length !== 6) {
        toast.error("Enter the 6-digit OTP")
        return
      }
      const verifyRes = await fetch("/api/auth/signup-otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp }),
      })
      const verifyData = await verifyRes.json().catch(() => ({}))
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || "Invalid OTP")
      }

      toast.success("Account verified. Signing you in...")

      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (signInRes?.ok) {
        router.push("/dashboard")
      } else {
        toast.error("Sign-in failed. Please try logging in.")
        router.push("/login")
      }
    } catch (err: any) {
      toast.error(err.message || "OTP verification failed")
    } finally {
      setOtpLoading(false)
    }
  }

  return (
    <>
      {step === "form" ? (
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium text-foreground">
                First Name
              </Label>
              <Input
                id="firstName"
                type="text"
                placeholder="John"
                className="bg-input border-border focus:border-primary focus:ring-primary/20"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <FieldError errors={[errors.firstName ? { message: errors.firstName } : undefined]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-medium text-foreground">
                Last Name
              </Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Doe"
                className="bg-input border-border focus:border-primary focus:ring-primary/20"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
              <FieldError errors={[errors.lastName ? { message: errors.lastName } : undefined]} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="john.doe@example.com"
              className="bg-input border-border focus:border-primary focus:ring-primary/20"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <FieldError errors={[errors.email ? { message: errors.email } : undefined]} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium text-foreground">
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+234 801 234 5678"
              className="bg-input border-border focus:border-primary focus:ring-primary/20"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <FieldError errors={[errors.phone ? { message: errors.phone } : undefined]} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                className="bg-input border-border focus:border-primary focus:ring-primary/20 pr-10"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            <StrengthMeter value={password} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
              Confirm Password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                className="bg-input border-border focus:border-primary focus:ring-primary/20 pr-10"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <FieldError errors={[errors.confirmPassword ? { message: errors.confirmPassword } : undefined]} />
          </div>

          <div className="flex items-start space-x-2">
            <input
              id="terms"
              type="checkbox"
              className="w-4 h-4 text-primary border-border rounded focus:ring-primary/20 mt-0.5"
              required
            />
            <Label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed">
              I agree to the{" "}
              <Link href="/terms" className="text-primary hover:text-primary/80">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-primary hover:text-primary/80">
                Privacy Policy
              </Link>
            </Label>
          </div>

          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="otp">Enter OTP</Label>
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otp} onChange={setOtp} containerClassName="justify-center">
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <p className="text-xs text-muted-foreground text-center">We sent a 6-digit code to {email}</p>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setStep("form")}>Back</Button>
            <Button type="button" className="flex-1" onClick={onVerifyOtp} disabled={otpLoading || otp.length !== 6}>
              {otpLoading ? "Verifying..." : "Verify & Continue"}
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
