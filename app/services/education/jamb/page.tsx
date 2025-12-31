"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { BookOpen, FileText, CheckCircle2 } from "lucide-react"
import { PinPrompt } from "@/components/PinPrompt"
import { handleServiceError } from "@/lib/service-utils"
import useDynamicPricing from "@/hooks/useDynamicPricing"
import { authFetch } from "@/lib/client-auth"

export default function JAMBPage() {
  const [jambServiceType, setJambServiceType] = useState("")
  const [fullName, setFullName] = useState("")
  const [profileCode, setProfileCode] = useState("")
  const [jambYear, setJambYear] = useState("")
  const [servicePrice, setServicePrice] = useState(0)
  const [isMarketer, setIsMarketer] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isPinPromptOpen, setIsPinPromptOpen] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<any>(null)
  const { toast } = useToast()

  const { price: hookPrice, isLoading, submitService } = useDynamicPricing(
    "education",
    "jamb",
    toSlugId(jambServiceType),
  )

  const toSlugId = (label: string) => {
    const map: Record<string, string> = {
      "Profile Code Retrieval": "profile-code",
      "Print Admission Letter": "print-admission-letter",
      "Original JAMB Result": "original-result",
      "O'Level Upload": "olevel-upload",
      "Check Admission Status": "check-admission-status",
      "Acceptance of Admission": "acceptance",
    }
    return map[label] || label.toLowerCase().replace(/[^a-z0-9]+/g, "-")
  }

  // Detect current user role to choose pricing tier
  useEffect(() => {
    ; (async () => {
      try {
        const res = await authFetch("/api/me")
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

  // DB-first tiered pricing
  useEffect(() => {
    if (hookPrice != null) {
      setServicePrice(hookPrice)
    }
  }, [hookPrice])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!jambServiceType || !fullName || !profileCode || !jambYear) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" })
      return
    }

    setPendingPayload({
      amount: servicePrice,
      jambServiceType,
      fullName,
      profileCode,
      jambYear,
    })
    setIsPinPromptOpen(true)
  }

  const handlePinConfirm = async (pin: string) => {
    setIsPinPromptOpen(false)
    setIsSubmitting(true)

    try {
      const resp = await submitService({ ...pendingPayload, pin })

      if (!resp.ok) {
        handleServiceError(resp, toast, "Request Failed")
        return
      }

      setShowSuccess(true)
      toast({
        title: "Request Submitted!",
        description: `Reference: ${resp.reference || "N/A"}`,
      })

      setJambServiceType("")
      setFullName("")
      setProfileCode("")
      setJambYear("")
    } catch (error) {
      toast({
        title: "Error",
        description: String(error),
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
              <p className="text-lg">Your JAMB service request has been submitted to our admin team.</p>
              <div className="bg-[#CCCCFF]/20 p-4 rounded-lg space-y-2">
                <p>
                  <strong>Service:</strong> {jambServiceType}
                </p>
                <p>
                  <strong>Price:</strong> ₦{servicePrice.toLocaleString()}
                </p>
                <p>
                  <strong>Status:</strong> Pending Admin Processing
                </p>
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
          <h1 className="text-4xl font-bold text-[#3457D5] mb-2">JAMB Services</h1>
          <p className="text-gray-600">Access comprehensive JAMB-related services and documentation</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#3457D5]" />
                  JAMB Service Request
                </CardTitle>
                <CardDescription>Select service and provide required information</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="jambServiceType">Service Type</Label>
                    <Select value={jambServiceType} onValueChange={setJambServiceType} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select JAMB service" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Profile Code Retrieval">Profile Code Retrieval</SelectItem>
                        <SelectItem value="Print Admission Letter">Print Admission Letter</SelectItem>
                        <SelectItem value="Original JAMB Result">Original JAMB Result</SelectItem>
                        <SelectItem value="O'Level Upload">O'Level Upload</SelectItem>
                        <SelectItem value="Check Admission Status">Check Admission Status</SelectItem>
                        <SelectItem value="Acceptance of Admission">Acceptance of Admission</SelectItem>
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
                    <Label htmlFor="profileCode">Profile Code or JAMB Reg No.</Label>
                    <Input
                      id="profileCode"
                      value={profileCode}
                      onChange={(e) => setProfileCode(e.target.value)}
                      placeholder="Enter profile code or registration number"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jambYear">JAMB Year</Label>
                    <Select value={jambYear} onValueChange={setJambYear} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 11 }, (_, i) => 2025 - i).map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {jambServiceType && (
                    <div className="bg-[#CCCCFF]/20 p-4 rounded-lg">
                      <p className="text-sm text-gray-700">💰 Service Price: ₦{servicePrice.toLocaleString()}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting || !jambServiceType}
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
                <CardTitle className="text-[#3457D5]">Available JAMB Services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-white rounded-lg border border-[#3457D5]/20">
                  <div className="font-semibold text-[#3457D5]">Profile Code Retrieval</div>
                  <div className="text-sm text-gray-600">Recover your lost JAMB profile code</div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#3457D5]/20">
                  <div className="font-semibold text-[#3457D5]">Print Admission Letter</div>
                  <div className="text-sm text-gray-600">Get your official admission letter</div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#3457D5]/20">
                  <div className="font-semibold text-[#3457D5]">Original JAMB Result</div>
                  <div className="text-sm text-gray-600">Download your original result slip</div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#3457D5]/20">
                  <div className="font-semibold text-[#3457D5]">O'Level Upload</div>
                  <div className="text-sm text-gray-600">Upload your O'Level results to JAMB</div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#3457D5]/20">
                  <div className="font-semibold text-[#3457D5]">Check Admission Status</div>
                  <div className="text-sm text-gray-600">Verify your admission status</div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#3457D5]/20">
                  <div className="font-semibold text-[#3457D5]">Acceptance of Admission</div>
                  <div className="text-sm text-gray-600">Accept your admission offer</div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-[#3457D5]" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                <p>1. Select the JAMB service you need</p>
                <p>2. Provide your details and JAMB information</p>
                <p>3. Submit your request to our admin team</p>
                <p>4. Admin processes and uploads your documents</p>
                <p>5. Receive notification when completed</p>
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
