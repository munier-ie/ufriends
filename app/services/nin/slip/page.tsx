"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { FileText, Download, AlertTriangle, Shield, Clock } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import jsPDF from "jspdf"
import { downloadPdfAutoWithData } from "@/lib/client-pdf"
import useDynamicPricing from "@/hooks/useDynamicPricing"
import { PinPrompt } from "@/components/PinPrompt"

export default function NINSlipPage() {
  const [showPrivacyWarning, setShowPrivacyWarning] = useState(true)
  const [retrievalMethod, setRetrievalMethod] = useState("")
  const [slipType, setSlipType] = useState("")
  const [ninNumber, setNinNumber] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [fullName, setFullName] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [state, setState] = useState("")
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showDownload, setShowDownload] = useState(false)
  const [servicePriceOverride, setServicePriceOverride] = useState<number | null>(null)
  const [transactionReference, setTransactionReference] = useState("")
  const [pdfUrl, setPdfUrl] = useState("")
  const [verificationData, setVerificationData] = useState(null)
  const [isPinPromptOpen, setIsPinPromptOpen] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<any>(null)
  const { toast } = useToast()

  // Use dynamic pricing hook (catalog-based)
  const variantLabel = (slipType || "standard").replace(/^\w/, (c) => c.toUpperCase())
  const { price, isLoading, error, submitService, reference } = useDynamicPricing("NIN", "Slip", variantLabel)

  const handleSubmit = async () => {
    if (!isFormValid()) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields and agree to terms",
        variant: "destructive",
      })
      return
    }

    const amount = Number(price ?? servicePriceOverride ?? 0)
    if (!Number.isFinite(amount) || amount <= 0) {
      toast({ title: "Pricing Unavailable", description: "Service price not available. Set a manual override or try later.", variant: "destructive" })
      return
    }

    // Prepare payload for submitService
    const payload: any = {
      amount,
      idempotencyKey: crypto.randomUUID(),
      nin: ninNumber,
      retrievalMethod,
      slipType
    }

    if (retrievalMethod === "phone" && phoneNumber) {
      payload.phone = phoneNumber // Ensure backend maps this correctly
      payload.phoneNumber = phoneNumber
    }
    if (retrievalMethod === "demographic") {
      if (fullName) {
        const nameParts = fullName.trim().split(" ")
        payload.firstName = nameParts[0] || ""
        payload.lastName = nameParts[nameParts.length - 1] || ""
      }
      if (dateOfBirth) payload.dateOfBirth = dateOfBirth
      if (state) payload.state = state
    }

    setPendingPayload(payload)
    setIsPinPromptOpen(true)
  }

  const handlePinConfirm = async (pin: string) => {
    setIsPinPromptOpen(false)
    setIsProcessing(true)

    try {
      const payload = { ...pendingPayload, pin }
      // Use submitService which handles billing and verification via the backend service handler
      const srvResult = await submitService(payload)

      if (!srvResult.ok) {
        throw new Error(srvResult.error || "Service request failed")
      }

      const vData = srvResult.data?.data || srvResult.data // Adjust based on response
      setVerificationData(vData)
      setTransactionReference(srvResult.data?.reference || `NIN-${Date.now()}`)

      setIsProcessing(false)
      setShowDownload(true)
      toast({ title: "Success!", description: "NIN slip generated successfully." })
    } catch (error: any) {
      const message = error?.message || error?.error || error?.detail || JSON.stringify(error)
      console.error("NIN Slip Error:", message)
      setIsProcessing(false)
      toast({ title: "Error", description: message, variant: "destructive" })
    }
  }

  const downloadNINSlipPDF = async () => {
    try {
      const data: any = verificationData || {}
      const actionForPdf = "nin.advanced"
      const fname = `nin-slip-${transactionReference || Date.now()}`
      await downloadPdfAutoWithData(actionForPdf, data, fname, slipType)
      toast({ title: "Download Complete", description: "NIN slip PDF has been generated successfully." })
    } catch (error: any) {
      console.error("PDF generation error:", error?.message || JSON.stringify(error))
      toast({ title: "Download Error", description: error?.message || "Failed to generate PDF.", variant: "destructive" })
    }
  }

  const isFormValid = () => {
    if (!retrievalMethod || !slipType || !agreePrivacy || !agreeTerms) return false

    if (retrievalMethod === "nin") return ninNumber.length === 11 && /^\d+$/.test(ninNumber)
    if (retrievalMethod === "phone")
      return phoneNumber.length === 11 && phoneNumber.startsWith("0") && /^\d+$/.test(phoneNumber)
    if (retrievalMethod === "demographic") return fullName && dateOfBirth && state

    return false
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
              By using this service, you confirm that you have obtained the necessary legal authority to process this
              personal data, and you assume full liability for unlawful access. The Company and its Data Protection
              Compliance Organization (DPCO) will cooperate fully with regulators in cases of misuse.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center">
            <Button
              onClick={() => setShowPrivacyWarning(false)}
              className="bg-[#3457D5] px-8 text-white hover:bg-[#3457D5]/90"
            >
              I Understand & Accept
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <div className="mb-4 flex items-center justify-center">
            <div className="mr-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#3457D5]">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">NIN Slip</h1>
          </div>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Download your National Identity Slip PDF using various retrieval methods
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <Card className="border-[#CCCCFF]/30 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-[#3457D5]/5 to-[#CCCCFF]/10">
                <CardTitle className="flex items-center text-[#3457D5]">
                  <FileText className="mr-2 h-5 w-5" />
                  Generate NIN Slip
                </CardTitle>
                <CardDescription>Choose retrieval method and slip type</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div>
                  <Label htmlFor="retrieval-method" className="text-sm font-medium">
                    Retrieval Method
                  </Label>
                  <Select value={retrievalMethod} onValueChange={setRetrievalMethod}>
                    <SelectTrigger className="mt-2 border-[#CCCCFF] focus:border-[#3457D5]">
                      <SelectValue placeholder="Select retrieval method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nin">NIN Number</SelectItem>
                      <SelectItem value="phone">Phone Number</SelectItem>
                      <SelectItem value="demographic">Demographic Data</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {retrievalMethod === "nin" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Label htmlFor="nin">NIN Number</Label>
                    <Input
                      id="nin"
                      placeholder="Enter 11-digit NIN"
                      maxLength={11}
                      value={ninNumber}
                      onChange={(e) => setNinNumber(e.target.value.replace(/\D/g, ""))}
                      className="mt-2 border-[#CCCCFF] focus:border-[#3457D5]"
                    />
                  </motion.div>
                )}

                {retrievalMethod === "phone" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="08012345678"
                      maxLength={11}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                      className="mt-2 border-[#CCCCFF] focus:border-[#3457D5]"
                    />
                  </motion.div>
                )}

                {retrievalMethod === "demographic" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <div>
                      <Label htmlFor="fullname">Full Name</Label>
                      <Input
                        id="fullname"
                        placeholder="First Middle Last"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="mt-2 border-[#CCCCFF] focus:border-[#3457D5]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dob">Date of Birth</Label>
                      <Input
                        id="dob"
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="mt-2 border-[#CCCCFF] focus:border-[#3457D5]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        placeholder="Enter state"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="mt-2 border-[#CCCCFF] focus:border-[#3457D5]"
                      />
                    </div>
                  </motion.div>
                )}

                <div>
                  <Label htmlFor="slip-type" className="text-sm font-medium">
                    Slip Type
                  </Label>
                  <Select value={slipType} onValueChange={setSlipType}>
                    <SelectTrigger className="mt-2 border-[#CCCCFF] focus:border-[#3457D5]">
                      <SelectValue placeholder="Select slip type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="regular">Regular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-lg border border-[#3457D5]/30 bg-[#CCCCFF]/20 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">💰 Service Price:</span>
                    <span className="text-2xl font-bold text-[#3457D5]">₦{Number(price ?? servicePriceOverride ?? 0).toFixed(2)}</span>
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
                    I confirm that I have the legal authority to access this data and agree to the{" "}
                    <Link href="/privacy" className="text-[#3457D5] hover:underline">
                      Privacy Policy
                    </Link>
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
                    I agree to the{" "}
                    <Link href="/terms" className="text-[#3457D5] hover:underline">
                      Terms of Use
                    </Link>{" "}
                    and understand the legal implications
                  </Label>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!isFormValid() || isProcessing || Number(price ?? servicePriceOverride ?? 0) <= 0}
                  className="w-full bg-[#3457D5] py-6 text-base font-semibold text-white hover:bg-[#3457D5]/90"
                >
                  {isProcessing ? "Processing..." : "Submit Request"}
                </Button>

                {verificationData && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-green-200 bg-green-50 p-4"
                  >
                    <h3 className="font-semibold text-green-800 mb-2">✅ Verification Successful</h3>
                    <div className="text-sm text-green-700 space-y-1">
                      <p><strong>Name:</strong> {(verificationData as any)?.firstName} {(verificationData as any)?.lastName}</p>
                      <p><strong>NIN:</strong> {(verificationData as any)?.nin}</p>
                      <p><strong>Date of Birth:</strong> {(verificationData as any)?.dateOfBirth}</p>
                      <p><strong>Gender:</strong> {(verificationData as any)?.gender}</p>
                      {transactionReference && (
                        <p><strong>Reference:</strong> {transactionReference}</p>
                      )}
                    </div>
                  </motion.div>
                )}

                {showDownload && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Button
                      onClick={downloadNINSlipPDF}
                      className="w-full bg-green-600 py-6 text-base font-semibold text-white hover:bg-green-700"
                    >
                      <Download className="mr-2 h-5 w-5" />
                      Download NIN Slip (PDF)
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="space-y-6"
          >
            <Card className="border-[#CCCCFF]/30">
              <CardHeader className="bg-gradient-to-r from-[#3457D5]/5 to-[#CCCCFF]/10">
                <CardTitle className="flex items-center text-[#3457D5]">
                  <FileText className="mr-2 h-5 w-5" />
                  PDF Layout
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="mr-2 text-[#3457D5]">•</span>
                    <span>
                      <strong>Header:</strong> UFriends logo + "National Identity Slip"
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-[#3457D5]">•</span>
                    <span>
                      <strong>Body:</strong> Slip Type, Method used, and User Data
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-[#3457D5]">•</span>
                    <span>
                      <strong>Footer:</strong> "Generated via UFriends.com.ng — For Verification Purposes Only"
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-[#CCCCFF]/30">
              <CardHeader className="bg-gradient-to-r from-[#3457D5]/5 to-[#CCCCFF]/10">
                <CardTitle className="flex items-center text-[#3457D5]">
                  <Shield className="mr-2 h-5 w-5" />
                  Slip Types
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="rounded-lg border border-[#3457D5]/20 bg-[#CCCCFF]/10 p-3">
                    <div className="font-semibold text-[#3457D5]">Standard</div>
                    <div className="text-sm text-gray-600">Basic NIN information with photo</div>
                  </div>
                  <div className="rounded-lg border border-[#3457D5]/20 bg-[#CCCCFF]/10 p-3">
                    <div className="font-semibold text-[#3457D5]">Premium</div>
                    <div className="text-sm text-gray-600">Enhanced slip with additional details</div>
                  </div>
                  <div className="rounded-lg border border-[#3457D5]/20 bg-[#CCCCFF]/10 p-3">
                    <div className="font-semibold text-[#3457D5]">Regular</div>
                    <div className="text-sm text-gray-600">Standard format for official use</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#CCCCFF]/30">
              <CardHeader className="bg-gradient-to-r from-[#3457D5]/5 to-[#CCCCFF]/10">
                <CardTitle className="flex items-center text-[#3457D5]">
                  <Clock className="mr-2 h-5 w-5" />
                  Processing Time
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-2 text-sm text-gray-600">
                  <p className="flex items-start">
                    <span className="mr-2 text-[#3457D5]">•</span>
                    <span>Instant verification and generation</span>
                  </p>
                  <p className="flex items-start">
                    <span className="mr-2 text-[#3457D5]">•</span>
                    <span>PDF available immediately after submission</span>
                  </p>
                  <p className="flex items-start">
                    <span className="mr-2 text-[#3457D5]">•</span>
                    <span>Valid for all official purposes</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
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
