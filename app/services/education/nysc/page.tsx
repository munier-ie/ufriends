"use client"

import type React from "react"

import { useState, useEffect } from "react"
import useDynamicPricing from "@/hooks/useDynamicPricing"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Flag, FileText, CheckCircle2 } from "lucide-react"
import { PinPrompt } from "@/components/PinPrompt"

export default function NYSCPage() {
  const [requestType, setRequestType] = useState("")
  const [fullName, setFullName] = useState("")
  const [callUpNumber, setCallUpNumber] = useState("")
  const [institution, setInstitution] = useState("")
  const [yearOfService, setYearOfService] = useState("")
  const [servicePrice, setServicePrice] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [reference, setReference] = useState("")
  const [isPinPromptOpen, setIsPinPromptOpen] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<any>(null)
  const { toast } = useToast()

  // Map request type to variant slug
  const toSlugId = (label: string) => {
    const map: Record<string, string> = {
      "NYSC Verification": "verification",
      "NYSC Reprint": "reprint",
      "NYSC Call-up Letter": "call-up-letter",
      "NYSC Certificate Retrieval": "certificate-retrieval",
    }
    const id = map[label] || label.toLowerCase().replace(/[^a-z0-9]+/g, ".")
    return id
  }

  // Dynamic pricing via hook; no legacy fallback
  const { price, isLoading: dbLoading, error: pricingError, submitService } = useDynamicPricing(
    "education",
    "nysc",
    requestType ? toSlugId(requestType) : ""
  )

  // Reflect hook price into UI
  useEffect(() => {
    if (typeof price === "number") setServicePrice(Number(price))
    else setServicePrice(0)
  }, [price])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      setPendingPayload({
        amount: servicePrice,
        requestType,
        fullName,
        callUpNumber,
        institution,
        yearOfService,
      })
      setIsPinPromptOpen(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePinConfirm = async (pin: string) => {
    setIsPinPromptOpen(false)
    setIsSubmitting(true)

    try {
      const resp = await submitService({ ...pendingPayload, pin })
      if (!resp?.ok) {
        throw new Error(resp?.error || resp?.message || "Request failed")
      }

      setReference(resp?.reference || `EDU-NYSC-${Date.now()}`)
      setShowSuccess(true)
      toast({ title: "Request Submitted!", description: "NYSC request submitted successfully." })

      setRequestType("")
      setFullName("")
      setCallUpNumber("")
      setInstitution("")
      setYearOfService("")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-[#F9F7F3] p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto"
        >
          <Card className="border-[#3457D5]">
            <CardHeader className="bg-[#3457D5] text-white">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6" />
                Request Submitted Successfully!
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <p className="text-lg">Your NYSC service request has been submitted to our admin team.</p>
              <div className="bg-[#CCCCFF]/20 p-4 rounded-lg space-y-2">
                <p>
                  <strong>Service:</strong> {requestType}
                </p>
                <p>
                  <strong>Price:</strong> ₦{servicePrice.toLocaleString()}
                </p>
                <p>
                  <strong>Status:</strong> Pending Admin Processing
                </p>
                {reference && (
                  <p>
                    <strong>Reference:</strong> {reference}
                  </p>
                )}
              </div>
              <p className="text-sm text-gray-600">
                You will be notified once your request is processed. The admin will upload the required documents to
                your account.
              </p>
              <Button onClick={() => setShowSuccess(false)} className="bg-[#3457D5] hover:bg-[#2a46aa]">
                Submit Another Request
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9F7F3] p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold text-[#3457D5] mb-2">NYSC Services</h1>
          <p className="text-gray-600">Access NYSC verification and document retrieval services</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#3457D5]" />
                  NYSC Service Request
                </CardTitle>
                <CardDescription>Select service and provide required information</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="requestType">Type of Request</Label>
                    <Select value={requestType} onValueChange={setRequestType} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select request type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NYSC Verification">NYSC Verification</SelectItem>
                        <SelectItem value="NYSC Reprint">NYSC Reprint</SelectItem>
                        <SelectItem value="NYSC Call-up Letter">NYSC Call-up Letter</SelectItem>
                        <SelectItem value="NYSC Certificate Retrieval">NYSC Certificate Retrieval</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="callUpNumber">Call-up Number (Optional)</Label>
                    <Input
                      id="callUpNumber"
                      value={callUpNumber}
                      onChange={(e) => setCallUpNumber(e.target.value)}
                      placeholder="Enter call-up number if available"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="institution">Institution Name</Label>
                    <Input
                      id="institution"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      placeholder="Enter your institution name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="yearOfService">Year of Service</Label>
                    <Select value={yearOfService} onValueChange={setYearOfService} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 15 }, (_, i) => 2025 - i).map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {requestType && (
                    <div className="bg-[#CCCCFF]/20 p-4 rounded-lg">
                      <p className="text-sm text-gray-700">💰 Service Price: ₦{servicePrice.toLocaleString()}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting || !requestType}
                    className="w-full bg-[#3457D5] hover:bg-[#2a46aa]"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Request"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-[#3457D5]/10 to-[#CCCCFF]/20">
              <CardHeader>
                <CardTitle className="text-[#3457D5]">Available NYSC Services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-white rounded-lg border border-[#3457D5]/20">
                  <div className="font-semibold text-[#3457D5]">NYSC Verification</div>
                  <div className="text-sm text-gray-600">Verify your NYSC certificate authenticity</div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#3457D5]/20">
                  <div className="font-semibold text-[#3457D5]">NYSC Reprint</div>
                  <div className="text-sm text-gray-600">Reprint lost or damaged certificate</div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#3457D5]/20">
                  <div className="font-semibold text-[#3457D5]">NYSC Call-up Letter</div>
                  <div className="text-sm text-gray-600">Retrieve your call-up letter</div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#3457D5]/20">
                  <div className="font-semibold text-[#3457D5]">NYSC Certificate Retrieval</div>
                  <div className="text-sm text-gray-600">Get your discharge certificate</div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5 text-[#3457D5]" />
                  Service Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-[#3457D5] text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Manual Processing</h3>
                    <p className="text-sm text-gray-600">Admin team handles your request personally</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-[#3457D5] text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Document Upload</h3>
                    <p className="text-sm text-gray-600">Receive documents via email and dashboard</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-[#3457D5] text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">24/7 Support</h3>
                    <p className="text-sm text-gray-600">Our team is always ready to assist</p>
                  </div>
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
