"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { FileCheck, AlertTriangle, CheckCircle2, Clock } from "lucide-react"
import Link from "next/link"
import { PinPrompt } from "@/components/PinPrompt"
import { handleServiceError } from "@/lib/service-utils"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { getServicePrices } from "@/lib/service-pricing"
import useDynamicPricing from "@/hooks/useDynamicPricing"

const CLEARANCE_TYPES = [
  { value: "Normal IPE", label: "Normal IPE", key: "IPE Clearance - Normal" },
  { value: "Modification IPE", label: "Modification IPE", key: "IPE Clearance - Modification" },
]

const MOCK_USER_ID = "u_001"

export default function IPEClearancePage() {
  const [showWarning, setShowWarning] = useState(true)
  const [clearanceType, setClearanceType] = useState("")
  const [trackingId, setTrackingId] = useState("")
  const [servicePrice, setServicePrice] = useState(0)
  const [isMarketer, setIsMarketer] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isPinPromptOpen, setIsPinPromptOpen] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedData, setSubmittedData] = useState<any>(null)
  const { toast } = useToast()

  // Detect current user role to decide pricing tier
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

  // Dynamic pricing via hook: category=nin, subservice=ipe-clearance, variant per type
  const variantSlug = useMemo(() => {
    const map: Record<string, string> = {
      "Normal IPE": "normal",
      "Modification IPE": "modification",
    }
    const v = map[clearanceType] || String(clearanceType || "").toLowerCase().replace(/[^a-z0-9]+/g, "_")
    return v || "basic"
  }, [clearanceType])

  const { price: dynPrice, isLoading: priceLoading, error: priceError, submitService } = useDynamicPricing(
    "nin",
    "ipe-clearance",
    variantSlug,
  )

  useEffect(() => {
    if (typeof dynPrice === "number") setServicePrice(Number(dynPrice))
    else if (!priceLoading && dynPrice == null) setServicePrice(0)
  }, [dynPrice, priceLoading])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!clearanceType || !trackingId || !agreeTerms || !agreePrivacy) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields and agree to terms",
        variant: "destructive",
      })
      return
    }

    if (!trackingId.trim()) {
      toast({
        title: "Invalid Tracking ID",
        description: "Please enter a valid tracking ID",
        variant: "destructive",
      })
      return
    }

    setPendingPayload({
      amount: servicePrice,
      idempotencyKey: crypto.randomUUID(),
      params: {
        clearanceType,
        trackingId,
      },
      category: "nin",
      action: "ipe-clearance"
    })
    setIsPinPromptOpen(true)
  }

  const handlePinConfirm = async (pin: string) => {
    setIsPinPromptOpen(false)
    setIsSubmitting(true)

    try {
      const resp = await submitService({ ...pendingPayload, pin })

      if (!resp.ok) {
        handleServiceError(resp, toast, "Submission Failed")
        return
      }

      const requestData = {
        id: resp.reference || crypto.randomUUID(),
        userId: MOCK_USER_ID,
        clearanceType: pendingPayload.params.clearanceType,
        trackingId: pendingPayload.params.trackingId,
        price: pendingPayload.amount,
        status: "SUBMITTED",
        submittedAt: new Date().toISOString(),
      }

      setSubmittedData(requestData)
      toast({ title: "Success!", description: "IPE Clearance request submitted successfully." })
      setShowConfirmation(true)
    } catch (err: any) {
      toast({ title: "Submission Error", description: err.message || "An error occurred", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setClearanceType("")
    setTrackingId("")
    setAgreeTerms(false)
    setAgreePrivacy(false)
    setShowConfirmation(false)
    setSubmittedData(null)
  }

  return (
    <div className="min-h-screen bg-[#F9F7F3] p-4 md:p-8">
      <Toaster />

      {/* Warning Dialog */}
      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#3457D5] bg-[#CCCCFF]/20">
              <AlertTriangle className="h-8 w-8 text-[#3457D5]" />
            </div>
            <DialogTitle className="text-center text-2xl font-bold text-gray-900">
              Privacy & Data Protection Warning
            </DialogTitle>
            <DialogDescription className="text-center text-sm leading-relaxed text-gray-600">
              By using this service, you confirm that you have obtained the necessary legal authority to process this
              personal data, and you assume full liability for unlawful access. The Company and its Data Protection
              Compliance Organization (DPCO) will cooperate fully with regulators in cases of misuse.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center">
            <Button
              onClick={() => setShowWarning(false)}
              className="bg-[#3457D5] px-8 text-white hover:bg-[#3457D5]/90"
            >
              I Understand & Accept
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center space-y-4 p-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Request Submitted!</h2>
            <p className="text-sm text-gray-600">Your IPE Clearance request has been submitted successfully.</p>

            {submittedData && (
              <div className="w-full space-y-3 rounded-lg border border-[#CCCCFF] bg-[#CCCCFF]/10 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Service:</span>
                  <span className="font-semibold text-gray-900">IPE Clearance</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-semibold text-gray-900">{submittedData.clearanceType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tracking ID:</span>
                  <span className="font-mono text-xs font-semibold text-gray-900">{submittedData.trackingId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-semibold text-[#3457D5]">₦{submittedData.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                    Pending
                  </span>
                </div>
              </div>
            )}

            <div className="flex w-full gap-2">
              <Button onClick={resetForm} className="flex-1 bg-[#3457D5] text-white hover:bg-[#3457D5]/90">
                Submit Another
              </Button>
              <Button
                onClick={() => setShowConfirmation(false)}
                variant="outline"
                className="flex-1 border-[#3457D5] text-[#3457D5] hover:bg-[#CCCCFF]/20"
              >
                Close
              </Button>
            </div>
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
              <FileCheck className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">IPE Clearance</h1>
          </div>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Request IPE (Identity Protection and Enhancement) Clearance for your tracking ID
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Form Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <Card className="border-[#CCCCFF]/30 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-[#3457D5]/5 to-[#CCCCFF]/10">
                <CardTitle className="flex items-center text-[#3457D5]">
                  <FileCheck className="mr-2 h-5 w-5" />
                  Clearance Request
                </CardTitle>
                <CardDescription>Select clearance type and enter your tracking ID</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="clearance-type" className="text-sm font-medium">
                      IPE Clearance Type
                    </Label>
                    <Select value={clearanceType} onValueChange={setClearanceType}>
                      <SelectTrigger className="mt-2 border-[#CCCCFF] focus:border-[#3457D5]">
                        <SelectValue placeholder="Select clearance type" />
                      </SelectTrigger>
                      <SelectContent>
                        {CLEARANCE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="tracking-id" className="text-sm font-medium">
                      Tracking ID
                    </Label>
                    <Input
                      id="tracking-id"
                      placeholder="Enter your IPE tracking ID"
                      value={trackingId}
                      onChange={(e) => setTrackingId(e.target.value)}
                      className="mt-2 border-[#CCCCFF] font-mono focus:border-[#3457D5]"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">The unique tracking ID assigned to you</p>
                  </div>

                  {clearanceType && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-lg border-2 border-[#3457D5]/30 bg-[#CCCCFF]/20 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Service Price:</span>
                        <span className="text-2xl font-bold text-[#3457D5]">{priceLoading ? "Fetching price..." : `₦${servicePrice.toFixed(2)}`}</span>
                      </div>
                      {priceError && (
                        <p className="mt-1 text-xs text-red-600">{String(priceError)}</p>
                      )}
                    </motion.div>
                  )}

                  <div className="space-y-4 border-t border-[#CCCCFF]/50 pt-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="privacy"
                        checked={agreePrivacy}
                        onCheckedChange={(checked) => setAgreePrivacy(checked === true)}
                        className="mt-1 border-[#3457D5] data-[state=checked]:bg-[#3457D5]"
                      />
                      <Label htmlFor="privacy" className="cursor-pointer text-sm leading-relaxed text-gray-700">
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
                      <Label htmlFor="terms" className="cursor-pointer text-sm leading-relaxed text-gray-700">
                        I agree to the{" "}
                        <Link href="/terms" className="text-[#3457D5] hover:underline">
                          Terms of Service
                        </Link>{" "}
                        and understand the legal implications
                      </Label>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={!clearanceType || !trackingId || !agreeTerms || !agreePrivacy}
                    className="w-full bg-[#3457D5] py-6 text-base font-semibold text-white hover:bg-[#3457D5]/90 disabled:opacity-50"
                  >
                    Submit Clearance Request
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Info Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="space-y-6"
          >
            <Card className="border-[#CCCCFF]/30">
              <CardHeader className="bg-gradient-to-r from-[#3457D5]/5 to-[#CCCCFF]/10">
                <CardTitle className="flex items-center text-[#3457D5]">
                  <FileCheck className="mr-2 h-5 w-5" />
                  Clearance Types & Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {CLEARANCE_TYPES.map((type) => {
                    const prices = getServicePrices()
                    const price = prices[type.key]?.sell || 0
                    return (
                      <div key={type.value} className="rounded-lg border border-[#3457D5]/20 bg-[#CCCCFF]/10 p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="font-semibold text-[#3457D5]">{type.label}</div>
                          <div className="text-lg font-bold text-[#3457D5]">₦{price.toFixed(2)}</div>
                        </div>
                        <div className="text-xs text-gray-600">
                          {type.value === "Normal IPE"
                            ? "Standard IPE clearance processing"
                            : "Modified IPE clearance with additional verification"}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#CCCCFF]/30">
              <CardHeader className="bg-gradient-to-r from-[#3457D5]/5 to-[#CCCCFF]/10">
                <CardTitle className="text-[#3457D5]">What is IPE Clearance?</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="mb-4 text-sm text-gray-600">
                  IPE (Identity Protection and Enhancement) Clearance is a verification process that ensures your
                  identity records are accurate and up-to-date in the national database.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="mr-2 text-[#3457D5]">✓</span>
                    <span>Verifies identity information accuracy</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-[#3457D5]">✓</span>
                    <span>Resolves identity discrepancies</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-[#3457D5]">✓</span>
                    <span>Updates national database records</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-[#3457D5]">✓</span>
                    <span>Provides clearance certificate</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-[#CCCCFF]/30">
              <CardHeader className="bg-gradient-to-r from-[#3457D5]/5 to-[#CCCCFF]/10">
                <CardTitle className="flex items-center text-[#3457D5]">
                  <Clock className="mr-2 h-5 w-5" />
                  Processing Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-2 text-sm text-gray-600">
                  <p className="flex items-start">
                    <span className="mr-2 text-[#3457D5]">•</span>
                    <span>Normal IPE: 3-5 business days</span>
                  </p>
                  <p className="flex items-start">
                    <span className="mr-2 text-[#3457D5]">•</span>
                    <span>Modification IPE: 5-7 business days</span>
                  </p>
                  <p className="flex items-start">
                    <span className="mr-2 text-[#3457D5]">•</span>
                    <span>Email notification upon completion</span>
                  </p>
                  <p className="flex items-start">
                    <span className="mr-2 text-[#3457D5]">•</span>
                    <span>Track status using your tracking ID</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#CCCCFF]/30">
              <CardHeader className="bg-gradient-to-r from-[#3457D5]/5 to-[#CCCCFF]/10">
                <CardTitle className="text-[#3457D5]">Required Documents</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-2 text-sm text-gray-600">
                  <p className="flex items-start">
                    <span className="mr-2 text-[#3457D5]">•</span>
                    <span>Valid tracking ID from previous submission</span>
                  </p>
                  <p className="flex items-start">
                    <span className="mr-2 text-[#3457D5]">•</span>
                    <span>Proof of identity (NIN, passport, etc.)</span>
                  </p>
                  <p className="flex items-start">
                    <span className="mr-2 text-[#3457D5]">•</span>
                    <span>Supporting documents (if modification)</span>
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
        isLoading={isSubmitting}
      />
    </div>
  )
}
