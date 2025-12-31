"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Info } from "lucide-react"
import { PinPrompt } from "@/components/PinPrompt"
import { handleServiceError } from "@/lib/service-utils"
import Link from "next/link"
import { formatPrice } from "@/lib/service-pricing"
import { addManualService } from "@/lib/manual-services-storage"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { useDynamicPricing } from "@/hooks/useDynamicPricing"
import { downloadPdfAutoWithData } from "@/lib/client-pdf"

export default function BVNRetrievalPage() {
  const [retrievalMethod, setRetrievalMethod] = useState("phone")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [accountName, setAccountName] = useState("")
  const [bank, setBank] = useState("")
  const [consent, setConsent] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDownload, setShowDownload] = useState(false)
  const [verificationPayload, setVerificationPayload] = useState<any | null>(null)
  const [isPinPromptOpen, setIsPinPromptOpen] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<any>(null)
  const [isMarketer, setIsMarketer] = useState(false)
  const { toast } = useToast()

  const variantForPricing = retrievalMethod === "phone" ? "With Phone" : ""
  const { price: servicePrice, isLoading: priceLoading, error: priceError, submitService } = useDynamicPricing(
    "bvn",
    "retrieval",
    variantForPricing,
    { method: retrievalMethod },
  )

  useEffect(() => {
    ; (async () => {
      try {
        const res = await fetch("/api/me")
        const data = res.ok ? await res.json() : null
        const role = data?.user?.role || data?.role || ""
        const roles: string[] = data?.user?.roles || []
        const marketer = /MARKETER/i.test(role) || roles.includes("MARKETER")
        setIsMarketer(Boolean(marketer))
      } catch {
        setIsMarketer(false)
      }
    })()
  }, [])

  useEffect(() => {
    setShowWarning(true)
  }, [])

  const handleSubmit = async () => {
    if (!isFormValid()) return

    if (retrievalMethod !== "phone") {
      toast({
        title: "Method not supported",
        description: "Currently only phone number retrieval is supported with Prembly API",
        variant: "destructive",
      })
      return
    }

    const amount = Number(servicePrice || 0)
    setPendingPayload({
      amount,
      idempotencyKey: crypto.randomUUID(),
      params: { phoneNumber },
    })
    setIsPinPromptOpen(true)
  }

  const handlePinConfirm = async (pin: string) => {
    setIsPinPromptOpen(false)
    setIsSubmitting(true)

    try {
      const resp = await submitService({ ...pendingPayload, pin })
      if (!resp.ok) {
        handleServiceError(resp, toast, "Retrieval Failed")
        return
      }
      const payload = resp.data

      const formData = { phoneNumber }

      addManualService({
        userId: "u_001",
        serviceType: "BVN Retrieval",
        method: "Phone Number",
        formData,
        price: pendingPayload.amount,
        status: "Completed",
      })

      localStorage.setItem("ufriends_bvn_result", JSON.stringify(payload?.data || payload))
      setVerificationPayload(payload)
      setShowDownload(true)

      toast({
        title: "BVN Retrieved Successfully",
        description: "Your BVN has been retrieved.",
      })

      setPhoneNumber("")
      setConsent(false)
      setTermsAccepted(false)
    } catch (error: any) {
      console.error("BVN Retrieval Error:", error)
      toast({
        title: "Retrieval failed",
        description: error.message || "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = () => {
    if (!consent || !termsAccepted) return false
    if (retrievalMethod === "phone") {
      return phoneNumber.length === 11 && phoneNumber.startsWith("0")
    } else {
      return accountNumber.length === 10 && accountName.trim() !== "" && bank !== ""
    }
  }

  return (
    <div className="min-h-screen bg-[#F9F7F3] p-4">
      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Warning</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center text-center space-y-4 p-6">
            <div className="w-16 h-16 rounded-full bg-[#CCCCFF]/20 flex items-center justify-center">
              <Info className="h-8 w-8 text-[#3457D5]" />
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              By using this service, you confirm that you have obtained the necessary legal authority to process this
              personal data, and you assume full liability for unlawful access. The Company and its Data Protection
              Compliance Organization (DPCO) will cooperate fully with regulators in cases of misuse.
            </p>
            <Button onClick={() => setShowWarning(false)} className="bg-[#3457D5] hover:bg-[#2a46b0] text-white px-8">
              I Understand
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-lg bg-[#3457D5] flex items-center justify-center">
              <Search className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-[#2c3e50] mb-2">BVN Retrieval</h1>
          <p className="text-lg text-gray-600">Retrieve your Bank Verification Number using your registered details</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="shadow-lg border-[#CCCCFF]/30">
            <CardContent className="p-6 space-y-6">
              <div>
                <Label className="text-base font-semibold mb-4 block text-[#2c3e50]">Select Retrieval Method</Label>
                <Select value={retrievalMethod} onValueChange={setRetrievalMethod}>
                  <SelectTrigger className="border-[#CCCCFF]/50 focus:ring-[#3457D5]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone">Retrieve Using Phone Number</SelectItem>
                    <SelectItem value="bank">Retrieve Using Bank Account</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {retrievalMethod === "phone" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                  <Label htmlFor="phone-number" className="text-base font-medium text-[#2c3e50]">
                    Registered Phone Number
                  </Label>
                  <Input
                    id="phone-number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                    className="mt-2 border-[#CCCCFF]/50 focus:ring-[#3457D5]"
                    placeholder="08012345678"
                    type="tel"
                    maxLength={11}
                  />
                  <p className="text-xs text-gray-500 mt-1">Must be 11 digits starting with 0</p>
                </motion.div>
              )}

              {retrievalMethod === "bank" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="account-number" className="text-base font-medium text-[#2c3e50]">
                      Account Number
                    </Label>
                    <Input
                      id="account-number"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                      className="mt-2 border-[#CCCCFF]/50 focus:ring-[#3457D5]"
                      placeholder="Enter 10-digit account number"
                      maxLength={10}
                    />
                  </div>

                  <div>
                    <Label htmlFor="account-name" className="text-base font-medium text-[#2c3e50]">
                      Account Name
                    </Label>
                    <Input
                      id="account-name"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="mt-2 border-[#CCCCFF]/50 focus:ring-[#3457D5]"
                      placeholder="Enter account name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bank" className="text-base font-medium text-[#2c3e50]">
                      Bank
                    </Label>
                    <Select value={bank} onValueChange={setBank}>
                      <SelectTrigger className="mt-2 border-[#CCCCFF]/50 focus:ring-[#3457D5]">
                        <SelectValue placeholder="Select your bank" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="first-bank">First Bank</SelectItem>
                        <SelectItem value="access-bank">Access Bank</SelectItem>
                        <SelectItem value="fcmb">FCMB</SelectItem>
                        <SelectItem value="keystone">Keystone Bank</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              )}

              <div className="bg-[#CCCCFF]/20 border border-[#CCCCFF]/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#2c3e50]">💰 Service Price:</span>
                  <span className="text-2xl font-bold text-[#3457D5]">{priceLoading ? "Loading..." : formatPrice(Number(servicePrice || 0))}</span>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="consent"
                  checked={consent}
                  onCheckedChange={(checked) => setConsent(checked === true)}
                  className="w-5 h-5 border-2 border-[#3457D5] data-[state=checked]:bg-[#3457D5] mt-1"
                />
                <Label htmlFor="consent" className="text-sm text-gray-700 cursor-pointer leading-relaxed">
                  By checking this box, you confirm the ID owner's consent for verification.
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                  className="w-5 h-5 border-2 border-[#3457D5] data-[state=checked]:bg-[#3457D5] mt-1"
                />
                <Label htmlFor="terms" className="text-sm text-gray-700 cursor-pointer leading-relaxed">
                  I agree to the{" "}
                  <Link href="/terms" className="text-[#3457D5] hover:text-[#2a46b0] underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-[#3457D5] hover:text-[#2a46b0] underline">
                    Privacy Policy
                  </Link>
                </Label>
              </div>

              <Button
                className="w-full bg-[#3457D5] hover:bg-[#2a46b0] text-white py-3 text-base font-medium"
                disabled={!isFormValid() || isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? "SUBMITTING..." : "RETRIEVE MY BVN"}
              </Button>
              {showDownload && (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-base font-medium"
                  onClick={async () => {
                    try {
                      await downloadPdfAutoWithData("bvn.retrieval_phone", verificationPayload || {}, "bvn-by-phone-printout")
                      toast({ title: "Downloaded", description: "BVN printout PDF generated" })
                    } catch (err: any) {
                      toast({ title: "Download Error", description: err?.message || "Failed to download BVN printout", variant: "destructive" })
                    }
                  }}
                >
                  Download BVN Printout (PDF)
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
      <PinPrompt
        isOpen={isPinPromptOpen}
        onClose={() => setIsPinPromptOpen(false)}
        onConfirm={handlePinConfirm}
        isLoading={isSubmitting}
      />
    </div>
  )
}
