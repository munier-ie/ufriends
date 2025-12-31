"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Info, Download, CheckCircle } from "lucide-react"
import { PinPrompt } from "@/components/PinPrompt"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { motion, AnimatePresence } from "framer-motion"
import jsPDF from "jspdf"
import { downloadPdfViaServer, downloadPdfAuto, downloadPdfAutoWithData } from "@/lib/client-pdf"
import useDynamicPricing from "@/hooks/useDynamicPricing"

export default function BVNVerificationPage() {
  const { toast } = useToast()
  const [showWarning, setShowWarning] = useState(false)
  const [bvn, setBvn] = useState("")
  const [consentChecked, setConsentChecked] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const { price, isLoading, error: pricingError, submitService, reference } = useDynamicPricing("bvn", "printout", "default")
  const [apiResult, setApiResult] = useState<any | null>(null)
  const [isPinPromptOpen, setIsPinPromptOpen] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<any>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [slipType, setSlipType] = useState<"standard" | "plastic">("standard")

  useEffect(() => {
    setShowWarning(true)
  }, [])

  // pricing handled by useDynamicPricing

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!consentChecked || !termsAccepted) {
      toast({
        title: "Error",
        description: "Please accept consent and terms to continue",
        variant: "destructive",
      })
      return
    }

    if (bvn.length !== 11) {
      toast({ title: "Error", description: "BVN must be 11 digits", variant: "destructive" })
      return
    }

    try {
      setIsVerifying(true)
      setErrorMsg(null)
      setApiResult(null)

      const amt = Number(price || 0)
      if (!Number.isFinite(amt) || amt <= 0) {
        toast({ title: "Pricing Unavailable", description: "Service price not available.", variant: "destructive" })
        setShowResult(false)
        setIsVerifying(false)
        return
      }
      setPendingPayload({
        amount: amt,
        idempotencyKey: crypto.randomUUID(),
        bvn,
      })
      setIsPinPromptOpen(true)
    } finally {
      setIsVerifying(false)
    }
  }

  const handlePinConfirm = async (pin: string) => {
    setIsPinPromptOpen(false)
    setIsVerifying(true)
    setErrorMsg(null)
    setApiResult(null)

    try {
      const resp = await submitService({ ...pendingPayload, pin })
      if (!resp.ok) {
        const message = resp.error || "Verification failed"
        setErrorMsg(message)
        toast({ title: "Verification failed", description: message, variant: "destructive" })
        setShowResult(false)
        return
      }
      setApiResult(resp.data)
      setShowResult(true)
      toast({ title: "Success", description: "BVN verification completed!" })
    } catch (err: any) {
      const message = err?.message || "Network error during verification"
      setErrorMsg(message)
      toast({ title: "Error", description: message, variant: "destructive" })
    } finally {
      setIsVerifying(false)
    }
  }

  const generatePDF = async () => {
    try {
      const r = await fetch("/api/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "bvn.printout", params: { bvn } }),
      })
      const payload = await r.json().catch(() => null)
      if (!r.ok) throw new Error(String(payload?.error || `Failed (${r.status})`))


      await downloadPdfAutoWithData("bvn.printout", payload, "bvn-printout", slipType)
      toast({ title: "Success", description: "Downloaded BVN printout" })
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to generate BVN printout", variant: "destructive" })
    }
  }

  return (
    <div className="min-h-screen bg-[#F9F7F3] p-4 md:p-8">
      <Toaster />

      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="sr-only">Privacy & Data Protection</DialogTitle>
          <div className="flex flex-col items-center text-center space-y-4 p-6">
            <div className="w-16 h-16 rounded-full border-2 border-[#3457D5] bg-[#CCCCFF]/20 flex items-center justify-center">
              <Info className="h-8 w-8 text-[#3457D5]" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Privacy & Data Protection</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              This service processes personal data. By proceeding, you confirm that you have obtained necessary consent
              and legal authority. You assume full liability for unauthorized access. We cooperate fully with regulators
              in cases of misuse.
            </p>
            <Button
              onClick={() => setShowWarning(false)}
              className="bg-[#3457D5] hover:bg-[#3457D5]/90 text-white px-8"
            >
              I Understand
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {!showResult ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="shadow-lg border-[#CCCCFF]/30">
                <CardContent className="p-6 md:p-8">
                  <h1 className="text-2xl font-bold mb-2 text-gray-900">BVN Verification</h1>
                  <p className="text-sm text-gray-600 mb-8">Verify Bank Verification Number instantly</p>

                  <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Bank Verification Number (BVN)</Label>
                      <Input
                        type="text"
                        placeholder="Enter 11-digit BVN"
                        maxLength={11}
                        value={bvn}
                        onChange={(e) => setBvn(e.target.value.replace(/\D/g, ""))}
                        className="border-[#CCCCFF] focus:border-[#3457D5]"
                        required
                      />
                    </div>

                    <div className="space-y-4 border-t border-[#CCCCFF]/50 pt-4">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="consent"
                          checked={consentChecked}
                          onCheckedChange={(checked) => setConsentChecked(checked === true)}
                          className="mt-1 border-[#3457D5] data-[state=checked]:bg-[#3457D5]"
                        />
                        <Label htmlFor="consent" className="text-sm text-gray-700 cursor-pointer leading-relaxed">
                          I confirm that I have obtained the data subject's consent for this verification.
                        </Label>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="terms"
                          checked={termsAccepted}
                          onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                          className="mt-1 border-[#3457D5] data-[state=checked]:bg-[#3457D5]"
                        />
                        <Label htmlFor="terms" className="text-sm text-gray-700 cursor-pointer leading-relaxed">
                          I agree to the {" "}
                          <Link href="/terms" className="text-[#3457D5] hover:underline">
                            Terms of Service
                          </Link>{" "}
                          and{" "}
                          <Link href="/privacy" className="text-[#3457D5] hover:underline">
                            Privacy Policy
                          </Link>
                        </Label>
                      </div>
                      {errorMsg ? (
                        <p className="text-sm text-red-600">{errorMsg}</p>
                      ) : pricingError ? (
                        <p className="text-sm text-red-600">{pricingError}</p>
                      ) : null}
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-[#3457D5] hover:bg-[#3457D5]/90 text-white font-medium py-6"
                      disabled={!consentChecked || !termsAccepted || isVerifying || isLoading}
                    >
                      {isVerifying ? "Verifying..." : `Verify - ₦${price ?? 400}`}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="shadow-lg border-[#CCCCFF]/30">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Verification Complete!</h2>
                  <p className="text-gray-600 mb-6">BVN has been successfully verified.</p>
                  {(() => {
                    const data: any = apiResult?.data ?? (apiResult as any)?.result ?? {}
                    const fullName =
                      data.full_name || data.fullName || [data.first_name || data.firstName, data.last_name || data.lastName].filter(Boolean).join(" ")
                    const bvnValue = data.bvn || bvn
                    const dob = data.date_of_birth || data.dob || data.birthdate
                    return (
                      <div className="text-left max-w-md mx-auto mb-6 text-sm text-gray-700">
                        {fullName && <div className="flex justify-between"><span className="font-medium">Name</span><span>{fullName}</span></div>}
                        <div className="flex justify-between"><span className="font-medium">BVN</span><span>{bvnValue}</span></div>
                        {dob && <div className="flex justify-between"><span className="font-medium">DOB</span><span>{dob}</span></div>}
                      </div>
                    )
                  })()}

                  <div className="mb-6 text-left">
                    <Label className="mb-2 block">Slip Type</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-gray-50 transition-colors w-full">
                        <input
                          type="radio"
                          name="slipType"
                          value="standard"
                          checked={slipType === "standard"}
                          onChange={() => setSlipType("standard")}
                          className="accent-[#3457D5]"
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">Standard Slip</span>
                          <span className="text-xs text-muted-foreground">Regular A4 printout</span>
                        </div>
                      </label>
                      <label className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-gray-50 transition-colors w-full">
                        <input
                          type="radio"
                          name="slipType"
                          value="plastic"
                          checked={slipType === "plastic"}
                          onChange={() => setSlipType("plastic")}
                          className="accent-[#3457D5]"
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">Plastic ID</span>
                          <span className="text-xs text-muted-foreground">ID Card format</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <Button onClick={generatePDF} className="bg-[#3457D5] hover:bg-[#3457D5]/90 text-white">
                    <Download className="h-4 w-4 mr-2" />
                    Download Slip
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <PinPrompt
        isOpen={isPinPromptOpen}
        onClose={() => setIsPinPromptOpen(false)}
        onConfirm={handlePinConfirm}
        isLoading={isVerifying}
      />
    </div>
  )
}
