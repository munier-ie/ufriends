"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Shield, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import { signIn, getSession } from "next-auth/react"
import { saveTokens } from "@/lib/client-auth"

export default function TwoFactorPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const email = searchParams.get("email") || ""
    const [code, setCode] = useState("")
    const [loading, setLoading] = useState(false)

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()

        if (code.length !== 6) {
            toast.error("Please enter a 6-digit code")
            return
        }

        try {
            setLoading(true)

            // Verify 2FA code
            const verifyRes = await fetch("/api/auth/2fa/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code }),
            })

            const verifyData = await verifyRes.json()

            if (!verifyRes.ok || !verifyData.verified) {
                toast.error(verifyData.error || "Invalid verification code")
                return
            }

            // 2FA verified - now we need to complete the login
            console.log("2FA Debug: Code verified, attempting login")

            // Get password from session storage (temp stored during login)
            const tempPassword = sessionStorage.getItem("2fa_temp_password")
            console.log("2FA Debug: Temp password found:", !!tempPassword)

            if (!tempPassword) {
                console.log("2FA Debug: Session expired (no password)")
                toast.error("Session expired. Please login again.")
                router.push("/login")
                return
            }

            // Complete the actual login
            console.log("2FA Debug: Calling signIn with email:", email)
            const res = await signIn("credentials", {
                email,
                password: tempPassword,
                twoFactorProof: verifyData.twoFactorProof,
                redirect: false,
            })
            console.log("2FA Debug: signIn result:", res)

            // Clear temp password
            // REMOVED sessionStorage.removeItem("2fa_temp_password") momentarily to use it for API call

            if (res?.ok) {
                console.log("2FA Debug: Login successful")
                toast.success("Login successful!")

                // Get API tokens
                try {
                    const tokenRes = await fetch("/api/auth/login", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email, password: tempPassword, twoFactorProof: verifyData.twoFactorProof }),
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
                sessionStorage.removeItem("2fa_temp_password")

                // Redirect based on role
                const session = await getSession()
                const role = (session?.user as any)?.role
                console.log("2FA Debug: Redirecting based on role:", role)
                router.push(role === "ADMIN" ? "/admin" : "/dashboard")
            } else {
                console.log("2FA Debug: Login failed with error:", res?.error)
                toast.error("Login failed. Please try again.")
                router.push("/login")
            }
        } catch (err) {
            console.error("2FA Debug: Error caught", err)
            toast.error("Verification failed")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen crosshatch-bg flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="mb-8">
                    <Link
                        href="/login"
                        className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Login
                    </Link>

                    <div className="flex items-center space-x-2 mb-6">
                        <Image src="/ufriend-logo.png" alt="UFriends Logo" width={32} height={32} className="w-8 h-8" />
                        <span className="font-bold text-xl text-foreground">UFriends IT</span>
                    </div>
                </div>

                <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-lg">
                    <CardHeader className="space-y-1 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                            <Shield className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-card-foreground">Two-Factor Authentication</CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Enter the 6-digit code from your authenticator app
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleVerify} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="code" className="text-sm font-medium text-foreground">
                                    Verification Code
                                </Label>
                                <Input
                                    id="code"
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={6}
                                    placeholder="000000"
                                    className="text-center text-2xl tracking-[0.5em] font-mono bg-input border-border focus:border-primary"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    autoFocus
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                                disabled={loading || code.length !== 6}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    "Verify & Sign In"
                                )}
                            </Button>

                            <p className="text-center text-sm text-muted-foreground">
                                Open your authenticator app (Google Authenticator, Authy, etc.) to get the code.
                            </p>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
