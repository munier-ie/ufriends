"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Shield, ShieldCheck, ShieldOff, Loader2, Copy, Check } from "lucide-react"
import { authFetch } from "@/lib/client-auth"
import { toast } from "sonner"

export function TwoFactorSetup() {
    const [loading, setLoading] = useState(true)
    const [enabled, setEnabled] = useState(false)
    const [qrCode, setQrCode] = useState("")
    const [secret, setSecret] = useState("")
    const [code, setCode] = useState("")
    const [verifying, setVerifying] = useState(false)
    const [copied, setCopied] = useState(false)
    const [showDisable, setShowDisable] = useState(false)
    const [disableCode, setDisableCode] = useState("")

    const loadStatus = async () => {
        try {
            const res = await authFetch("/api/auth/2fa/setup")
            if (res.ok) {
                const data = await res.json()
                setEnabled(data.enabled === true)
                if (!data.enabled && data.qrCode) {
                    setQrCode(data.qrCode)
                    setSecret(data.secret)
                }
            }
        } catch (err) {
            console.error("Failed to load 2FA status:", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadStatus()
    }, [])

    const handleVerify = async () => {
        if (code.length !== 6) {
            toast.error("Please enter a 6-digit code")
            return
        }

        setVerifying(true)
        try {
            const res = await authFetch("/api/auth/2fa/setup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code }),
            })

            const data = await res.json()
            if (res.ok) {
                toast.success("Two-factor authentication enabled!")
                setEnabled(true)
                setQrCode("")
                setSecret("")
                setCode("")
            } else {
                toast.error(data.error || "Invalid code")
            }
        } catch {
            toast.error("Failed to verify code")
        } finally {
            setVerifying(false)
        }
    }

    const handleDisable = async () => {
        if (disableCode.length !== 6) {
            toast.error("Please enter a 6-digit code")
            return
        }

        setVerifying(true)
        try {
            const res = await authFetch("/api/auth/2fa/setup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: disableCode, action: "disable" }),
            })

            const data = await res.json()
            if (res.ok) {
                toast.success("Two-factor authentication disabled")
                setEnabled(false)
                setShowDisable(false)
                setDisableCode("")
                // Reload to get new QR code
                loadStatus()
            } else {
                toast.error(data.error || "Invalid code")
            }
        } catch {
            toast.error("Failed to disable 2FA")
        } finally {
            setVerifying(false)
        }
    }

    const copySecret = () => {
        navigator.clipboard.writeText(secret)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        )
    }

    if (enabled) {
        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                                <ShieldCheck className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <CardTitle>Two-Factor Authentication</CardTitle>
                                <CardDescription>Your account is protected with 2FA</CardDescription>
                            </div>
                        </div>
                        <Badge className="bg-green-100 text-green-700">Enabled</Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        You'll be asked for a verification code from your authenticator app when signing in.
                    </p>

                    {showDisable ? (
                        <div className="space-y-4 border-t pt-4">
                            <p className="text-sm text-red-600 font-medium">
                                Enter your authenticator code to disable 2FA
                            </p>
                            <div className="flex gap-2">
                                <Input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    placeholder="000000"
                                    className="font-mono text-center"
                                    value={disableCode}
                                    onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                />
                                <Button variant="destructive" onClick={handleDisable} disabled={verifying || disableCode.length !== 6}>
                                    {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Disable"}
                                </Button>
                                <Button variant="outline" onClick={() => { setShowDisable(false); setDisableCode("") }}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={() => setShowDisable(true)}>
                            <ShieldOff className="mr-2 h-4 w-4" />
                            Disable Two-Factor Authentication
                        </Button>
                    )}
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle>Set Up Two-Factor Authentication</CardTitle>
                        <CardDescription>Add an extra layer of security to your account</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                        <p className="font-medium text-foreground mb-2">Step 1: Scan the QR code</p>
                        <p>Open your authenticator app (Google Authenticator, Authy, etc.) and scan this QR code:</p>
                    </div>

                    {qrCode && (
                        <div className="flex justify-center">
                            <div className="bg-white p-4 rounded-lg shadow-sm">
                                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                            </div>
                        </div>
                    )}

                    <div className="text-sm text-muted-foreground">
                        <p className="font-medium text-foreground mb-2">Can't scan? Enter manually:</p>
                        <div className="flex items-center gap-2 bg-muted p-3 rounded-lg">
                            <code className="flex-1 font-mono text-sm break-all">{secret}</code>
                            <Button variant="ghost" size="sm" onClick={copySecret}>
                                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="border-t pt-6 space-y-4">
                    <div className="text-sm">
                        <p className="font-medium text-foreground mb-2">Step 2: Enter verification code</p>
                        <p className="text-muted-foreground">Enter the 6-digit code from your authenticator app to verify setup:</p>
                    </div>

                    <div className="flex gap-2">
                        <Input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="000000"
                            className="font-mono text-center text-lg tracking-widest max-w-[150px]"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        />
                        <Button onClick={handleVerify} disabled={verifying || code.length !== 6} className="gap-2">
                            {verifying ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    <ShieldCheck className="h-4 w-4" />
                                    Enable 2FA
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
