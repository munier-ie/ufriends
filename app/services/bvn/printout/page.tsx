"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { FileText, AlertTriangle } from "lucide-react"
import { PinPrompt } from "@/components/PinPrompt"
import { handleServiceError } from "@/lib/service-utils"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useDynamicPricing } from "@/hooks/useDynamicPricing"
import { downloadPdfAutoWithData, downloadPdfViaServer } from "@/lib/client-pdf"

export default function BVNPrintoutPage() {
  const [showPrivacyWarning, setShowPrivacyWarning] = useState(true)
  const [bvn, setBvn] = useState("")
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [verificationData, setVerificationData] = useState<any | null>(null)
  const [verificationPayload, setVerificationPayload] = useState<any | null>(null)
  const [showDownload, setShowDownload] = useState(false)
  const [slipType, setSlipType] = useState<"standard" | "plastic">("standard")
  const { toast } = useToast()
  const [isPinPromptOpen, setIsPinPromptOpen] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<any>(null)
  const { price: servicePrice, isLoading: priceLoading, error: pricingError, submitService } = useDynamicPricing(
    "bvn",
    "printout",
    "default",
  )

  const stringifyError = (err: any) => {
    try {
      if (!err) return "Unknown error"
      if (typeof err === "string") return err

      const msg = typeof err.message === "string" ? err.message : null
      const isUseless = msg && msg.trim() === "[object Object]"
      if (msg && !isUseless) return msg

      // Prefer cause details if available
      const cause = (err as any).cause
      if (typeof cause === "string") return cause
      if (cause && typeof cause === "object") {
        const cmsg = (cause as any).message || (cause as any).detail || (cause as any).error || (cause as any).statusText
        if (typeof cmsg === "string" && cmsg.trim()) return cmsg
        try { return JSON.stringify(cause, Object.getOwnPropertyNames(cause)) } catch { }
      }

      // Axios-style errors
      const axiosMsg = err?.response?.data?.message || err?.response?.data?.error
      if (typeof axiosMsg === "string") return axiosMsg

      // If message is JSON-like, parse and extract usable fields
      if (msg && /^\{/.test(msg)) {
        try {
          const parsed = JSON.parse(msg)
          const pm = parsed?.message || parsed?.error || parsed?.detail
          if (typeof pm === "string" && pm.trim()) return pm
        } catch { }
      }

      // Fallback: include non-enumerable Error props
      return JSON.stringify(err, Object.getOwnPropertyNames(err))
    } catch {
      return "Unknown error"
    }
  }

  const handleSubmit = async () => {
    if (!bvn || bvn.length !== 11 || !agreePrivacy || !agreeTerms) {
      toast({ title: "Validation Error", description: "Enter a valid 11-digit BVN and accept privacy/terms.", variant: "destructive" })
      return
    }

    const amount = Number(servicePrice || 0)
    if (!Number.isFinite(amount) || amount <= 0) {
      toast({ title: "Pricing Unavailable", description: "Service price not available.", variant: "destructive" })
      return
    }

    setPendingPayload({
      amount,
      idempotencyKey: crypto.randomUUID(),
      bvn,
    })
    setIsPinPromptOpen(true)
  }

  const handlePinConfirm = async (pin: string) => {
    setIsPinPromptOpen(false)
    setIsProcessing(true)
    try {
      const resp = await submitService({ ...pendingPayload, pin })
      if (!resp.ok) {
        handleServiceError(resp, toast, "BVN Printout Failed")
        return
      }
      const payload = resp.data

      setVerificationData(payload?.data || null)
      setVerificationPayload(payload || null)
      setShowDownload(true)
      localStorage.setItem("ufriends_manual_services", JSON.stringify([
        ...(JSON.parse(localStorage.getItem("ufriends_manual_services") || "[]")),
        {
          id: crypto.randomUUID(),
          userId: "u_001",
          serviceType: "BVN Printout",
          formData: { bvn },
          price: pendingPayload.amount,
          status: "Completed",
          result: payload?.data,
          submittedAt: new Date().toISOString(),
        },
      ]))

      toast({ title: "Success!", description: "BVN printout retrieved and billed." })
    } catch (error: any) {
      toast({ title: "Error", description: error?.message || "Verification failed", variant: "destructive" })
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadBVNPrintout = async () => {
    try {
      const data: any = verificationPayload || verificationData || {}

      await downloadPdfAutoWithData("bvn.printout", data, "bvn-printout", slipType)
      toast({ title: "Success", description: "Downloaded BVN printout" })
    } catch (err: any) {
      try {
        const data: any = verificationData || {}
        const fullName = data.full_name || data.fullName || [data.first_name || data.firstName, data.last_name || data.lastName].filter(Boolean).join(" ")
        const dob = data.date_of_birth || data.dob || data.birthdate || ""
        const bvnValue = data.bvn || bvn
        const doc = new (await import("jspdf")).default()
        doc.setFontSize(18)
        doc.text("BVN Printout", 90, 15)
        doc.setFontSize(10)
        doc.text(`Name: ${fullName || ""}`, 15, 30)
        doc.text(`BVN: ${bvnValue}`, 15, 40)
        if (dob) doc.text(`DOB: ${dob}`, 15, 50)
        doc.save(`bvn-printout-${Date.now()}.pdf`)
        toast({ title: "Downloaded", description: "Basic BVN printout generated" })
      } catch {
        toast({ title: "Error", description: err?.message || "Failed to generate PDF", variant: "destructive" })
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#F9F7F3] p-4 md:p-8">
      <Dialog open={showPrivacyWarning} onOpenChange={setShowPrivacyWarning}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#3457D5] bg-[#CCCCFF]/20">
              <AlertTriangle className="h-8 w-8 text-[#3457D5]" />
            </div>
            <DialogTitle className="text-center text-2xl font-bold">Privacy & Data Protection Warning</DialogTitle>
            <DialogDescription className="text-center text-sm leading-relaxed text-gray-600">
              By using this service, you confirm legal authority to process this data and accept liability for misuse.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center">
            <Button onClick={() => setShowPrivacyWarning(false)} className="bg-[#3457D5] px-8 text-white hover:bg-[#3457D5]/90">
              I Understand & Accept
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="mx-auto max-w-3xl">
        <Card className="border-[#CCCCFF]/30 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-[#3457D5]/5 to-[#CCCCFF]/10">
            <CardTitle className="flex items-center text-[#3457D5]">
              <FileText className="mr-2 h-5 w-5" /> BVN Printout
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div>
              <Label htmlFor="bvn">BVN Number</Label>
              <Input id="bvn" placeholder="Enter 11-digit BVN" maxLength={11} value={bvn} onChange={(e) => setBvn(e.target.value.replace(/\D/g, ""))} className="mt-2 border-[#CCCCFF] focus:border-[#3457D5]" />
            </div>

            <div className="space-y-2">
              <Label>Slip Type</Label>
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

            <div className="flex items-start space-x-3">
              <Checkbox
                id="privacy"
                checked={agreePrivacy}
                onCheckedChange={(checked) => setAgreePrivacy(checked === true)}
                className="mt-1 border-[#3457D5] data-[state=checked]:bg-[#3457D5]"
              />
              <Label htmlFor="privacy" className="cursor-pointer text-sm leading-relaxed">
                I confirm I have legal authority to access this data and agree to the {" "}
                <Link href="/privacy" className="text-[#3457D5] hover:underline">Privacy Policy</Link>
              </Label>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms"
                checked={agreeTerms}
                onCheckedChange={(checked) => setAgreeTerms(checked === true)}
                className="mt-1 border-[#3457D5] data-[state=checked]:bg-[#3457D5]"
              />
              <Label htmlFor="terms" className="cursor-pointer text-sm leading-relaxed">
                I agree to the {" "}
                <Link href="/terms" className="text-[#3457D5] hover:underline">Terms of Use</Link>
                {" "} and understand the legal implications
              </Label>
            </div>

            <Button onClick={handleSubmit} disabled={isProcessing || bvn.length !== 11 || !agreePrivacy || !agreeTerms || priceLoading} className="w-full bg-[#3457D5] py-6 text-base font-semibold text-white hover:bg-[#3457D5]/90">
              {isProcessing ? "Processing..." : priceLoading ? "Loading price..." : `Submit - ₦${servicePrice ?? 0}`}
            </Button>
            {showDownload && (
              <Button onClick={downloadBVNPrintout} className="w-full bg-green-600 py-6 text-base font-semibold text-white hover:bg-green-700">
                Download BVN Printout (PDF)
              </Button>
            )}
            {pricingError ? (
              <p className="text-sm text-red-600 mt-2">{String(pricingError)}</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
      <PinPrompt
        isOpen={isPinPromptOpen}
        onClose={() => setIsPinPromptOpen(false)}
        onConfirm={handlePinConfirm}
        isLoading={isProcessing}
      />
    </div>
  )
}
