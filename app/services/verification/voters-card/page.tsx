"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Info, Download, CheckCircle } from "lucide-react"
import { PinPrompt } from "@/components/PinPrompt"
import { handleServiceError } from "@/lib/service-utils"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { motion, AnimatePresence } from "framer-motion"
import jsPDF from "jspdf"
import { downloadPdfViaServer, downloadPdfAuto } from "@/lib/client-pdf"
import useDynamicPricing from "@/hooks/useDynamicPricing"

const SLIP_TYPES = [
  { value: "basic", label: "Basic Data Slip" },
  { value: "full", label: "Full Voter's ID Card" },
]

export default function VotersCardVerificationPage() {
  const { toast } = useToast()
  const [showWarning, setShowWarning] = useState(false)
  const [number, setNumber] = useState("")
  const [lastName, setLastName] = useState("")
  const [firstName, setFirstName] = useState("")
  const [dob, setDob] = useState("")
  const [lga, setLga] = useState("")
  const [state, setState] = useState("")
  const [slipType, setSlipType] = useState("basic")
  const [consentChecked, setConsentChecked] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const { price: servicePrice, isLoading, error: pricingError, submitService } = useDynamicPricing("voters-card", slipType, slipType)
  const [apiResult, setApiResult] = useState<any | null>(null)
  const [isPinPromptOpen, setIsPinPromptOpen] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<any>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    setShowWarning(true)
  }, [])

  // Pricing handled by useDynamicPricing

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

    if (!number) {
      toast({ title: "Error", description: "Please enter Voter number", variant: "destructive" })
      return
    }

    try {
      setIsVerifying(true)
      setErrorMsg(null)
      setApiResult(null)

      setPendingPayload({
        amount: Number(servicePrice || 500),
        idempotencyKey: crypto.randomUUID(),
        number, lastName, firstName, dob, lga, state, slipType,
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
        handleServiceError(resp, toast, "Verification Failed")
        setShowResult(false)
        return
      }

      setApiResult(resp.data)
      setShowResult(true)
      toast({ title: "Success", description: "Voter's Card verification completed!" })
    } catch (err: any) {
      const message = err?.message || "Network error during verification"
      setErrorMsg(message)
      toast({ title: "Error", description: message, variant: "destructive" })
    } finally {
      setIsVerifying(false)
    }
  }

  const generatePDF = async () => {
    const tplId = process.env.NEXT_PUBLIC_TEMPLATE_ID_VOTERS_VERIFY
    if (tplId) {
      try {
        await downloadPdfViaServer(tplId, "voters.verify", { number, lastName, firstName, dob, lga, state }, String(slipType).toLowerCase() === "full" ? "voters-card-full" : "voters-card-verification")
        toast({ title: "Success", description: "Downloaded Voter's slip" })
        return
      } catch (err: any) {
        toast({ title: "Error", description: err?.message || "Failed to generate PDF", variant: "destructive" })
      }
    }
    try {
      await downloadPdfAuto("voters.verify", { number, lastName, firstName, dob, lga, state }, String(slipType).toLowerCase() === "full" ? "voters-card-full" : "voters-card-verification", slipType)
      toast({ title: "Success", description: "Downloaded Voter's slip" })
      return
    } catch { }
    const data: any = apiResult?.data ?? (apiResult as any)?.result ?? {}
    const fullName = data.full_name || `${data.first_name || ""} ${data.last_name || ""}`.trim()
    const vinNum = data.number || data.votersCardNumber || data.vin || number

    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text("UFriends Information Technology", 70, 15)
    doc.setFontSize(14)
    doc.text("Voter's Card Verification Slip", 70, 25)
    doc.setFontSize(10)
    doc.text(`Date: ${new Date().toLocaleString()}`, 15, 40)
    doc.text(`VIN: ${vinNum}`, 15, 50)
    if (fullName) doc.text(`Name: ${fullName}`, 15, 60)
    doc.text(`Slip Type: ${SLIP_TYPES.find((t) => t.value === slipType)?.label}`, 15, 70)
    doc.text(`Price: ₦${servicePrice ?? 0}`, 15, 80)
    doc.text("Status: Verified", 15, 90)
    doc.text("Note: This is a verification slip generated by UFriends.com.ng", 15, 250)
    doc.save(`voters-card-verification-${Date.now()}.pdf`)
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
                  <h1 className="text-2xl font-bold mb-2 text-gray-900">Voter's Card Verification</h1>
                  <p className="text-sm text-gray-600 mb-8">
                    Verify Permanent Voter's Card (PVC) details with INEC database
                  </p>

                  <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Voter Identification Number (VIN)</Label>
                      <Input
                        type="text"
                        placeholder="Enter Voter number"
                        value={number}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 19)
                          setNumber(value)
                        }}
                        maxLength={19}
                        className="border-[#CCCCFF] focus:border-[#3457D5]"
                        required
                      />
                      <p className="text-xs text-muted-foreground">Maximum 19 alphanumeric characters</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">First Name</Label>
                        <Input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Last Name</Label>
                        <Input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Date of Birth</Label>
                        <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">LGA</Label>
                        <Input type="text" value={lga} onChange={(e) => setLga(e.target.value)} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-sm font-medium">State</Label>
                        <Input type="text" value={state} onChange={(e) => setState(e.target.value)} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Slip Type</Label>
                      <Select value={slipType} onValueChange={setSlipType}>
                        <SelectTrigger className="w-full border-[#CCCCFF] focus:border-[#3457D5]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SLIP_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                          I agree to the{" "}
                          <Link href="/terms" className="text-[#3457D5] hover:underline">
                            Terms of Service
                          </Link>{" "}
                          and{" "}
                          <Link href="/privacy" className="text-[#3457D5] hover:underline">
                            Privacy Policy
                          </Link>
                        </Label>
                      </div>
                      {errorMsg ? <p className="text-sm text-red-600">{errorMsg}</p> : null}
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-[#3457D5] hover:bg-[#3457D5]/90 text-white font-medium py-6"
                      disabled={!consentChecked || !termsAccepted || isVerifying || isLoading}
                    >
                      {isVerifying ? "Verifying..." : (isLoading ? "Fetching price..." : `Verify - ₦${servicePrice ?? 0}`)}
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
                  <p className="text-gray-600 mb-6">Voter's Card has been successfully verified.</p>
                  {(() => {
                    const data: any = apiResult?.data ?? (apiResult as any)?.result ?? {}
                    const fullName = data.full_name || `${data.first_name || ""} ${data.last_name || ""}`.trim()
                    const vinNum = data.number || data.votersCardNumber || data.vin || number
                    return (
                      <div className="text-left max-w-md mx-auto mb-6 text-sm text-gray-700">
                        <div className="flex justify-between"><span className="font-medium">VIN</span><span>{vinNum}</span></div>
                        {fullName && <div className="flex justify-between"><span className="font-medium">Name</span><span>{fullName}</span></div>}
                      </div>
                    )
                  })()}
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
