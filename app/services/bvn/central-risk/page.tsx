"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { motion } from "framer-motion"
import { Shield, Upload, Info } from "lucide-react"
import { PinPrompt } from "@/components/PinPrompt"
import { handleServiceError } from "@/lib/service-utils"
import Link from "next/link"
import { formatPrice } from "@/lib/service-pricing"
import { useToast } from "@/hooks/use-toast"
import { useDynamicPricing } from "@/hooks/useDynamicPricing"

export default function CentralRiskManagementPage() {
  const [showWarning, setShowWarning] = useState(false)
  const [ticketId, setTicketId] = useState("")
  const [bmsTicket, setBmsTicket] = useState("")
  const [agentCode, setAgentCode] = useState("")
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [consentChecked, setConsentChecked] = useState(false)
  const [termsChecked, setTermsChecked] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPinPromptOpen, setIsPinPromptOpen] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<any>(null)
  const [isMarketer, setIsMarketer] = useState(false)
  const { toast } = useToast()

  const { price: servicePrice, isLoading: priceLoading, error: priceError, submitService } = useDynamicPricing(
    "bvn",
    "central-risk",
    "default",
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setScreenshot(e.target.files[0])
    }
  }

  const handleSubmit = async () => {
    if (!isFormValid()) return

    setPendingPayload({
      amount: Number(servicePrice || 0),
      idempotencyKey: crypto.randomUUID(),
      params: {
        ticketId,
        bmsTicket,
        agentCode,
        screenshotFileName: screenshot?.name
      },
      category: "bvn",
      action: "central-risk"
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

      toast({
        title: "Request submitted successfully",
        description: "Your central risk request is being processed.",
      })

      // Reset form
      setTicketId("")
      setBmsTicket("")
      setAgentCode("")
      setScreenshot(null)
      setConsentChecked(false)
      setTermsChecked(false)
    } catch (error) {
      toast({
        title: "Submission failed",
        description: "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = () => {
    return ticketId && bmsTicket && agentCode && screenshot && consentChecked && termsChecked
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
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-[#2c3e50] mb-2">Central Risk Management</h1>
          <p className="text-lg text-gray-600">Submit BVN retrieval via Central Risk Management system</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="shadow-lg border-[#CCCCFF]/30">
            <CardHeader>
              <CardTitle className="flex items-center text-[#2c3e50]">
                <Shield className="h-5 w-5 mr-2 text-[#3457D5]" />
                Submit Central Risk Request
              </CardTitle>
              <CardDescription>Enter your ticket details and upload required documentation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="ticket-id" className="text-[#2c3e50]">
                  Ticket ID
                </Label>
                <Input
                  id="ticket-id"
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value)}
                  placeholder="Enter ticket ID"
                  className="border-[#CCCCFF]/50 focus:ring-[#3457D5]"
                  required
                />
              </div>

              <div>
                <Label htmlFor="bms-ticket" className="text-[#2c3e50]">
                  BMS Ticket
                </Label>
                <Input
                  id="bms-ticket"
                  value={bmsTicket}
                  onChange={(e) => setBmsTicket(e.target.value)}
                  placeholder="Enter BMS ticket number"
                  className="border-[#CCCCFF]/50 focus:ring-[#3457D5]"
                  required
                />
              </div>

              <div>
                <Label htmlFor="agent-code" className="text-[#2c3e50]">
                  Agent Code
                </Label>
                <Input
                  id="agent-code"
                  value={agentCode}
                  onChange={(e) => setAgentCode(e.target.value)}
                  placeholder="Enter your agent code"
                  className="border-[#CCCCFF]/50 focus:ring-[#3457D5]"
                  required
                />
              </div>

              <div>
                <Label htmlFor="screenshot" className="text-[#2c3e50]">
                  Screenshot Upload (Required)
                </Label>
                <div className="border-2 border-dashed border-[#CCCCFF] rounded-lg p-6 text-center bg-[#CCCCFF]/10 mt-2">
                  <Upload className="h-8 w-8 text-[#3457D5] mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    {screenshot ? screenshot.name : "Upload screenshot (.jpg, .png, .pdf)"}
                  </p>
                  <input
                    type="file"
                    id="screenshot"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    className="mt-2 border-[#3457D5] text-[#3457D5] hover:bg-[#CCCCFF]/20 bg-transparent"
                    onClick={() => document.getElementById("screenshot")?.click()}
                    type="button"
                  >
                    Choose File
                  </Button>
                </div>
              </div>

              <div className="bg-[#CCCCFF]/20 border border-[#CCCCFF]/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#2c3e50]">💰 Service Price:</span>
                  <span className="text-2xl font-bold text-[#3457D5]">{priceLoading ? "Loading..." : formatPrice(Number(servicePrice || 0))}</span>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="consent"
                  checked={consentChecked}
                  onCheckedChange={(checked) => setConsentChecked(checked === true)}
                  className="border-2 border-[#3457D5] data-[state=checked]:bg-[#3457D5] mt-1"
                />
                <Label htmlFor="consent" className="text-sm text-gray-700 cursor-pointer leading-relaxed">
                  By checking this box, you confirm the ID owner's consent for verification.
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms"
                  checked={termsChecked}
                  onCheckedChange={(checked) => setTermsChecked(checked === true)}
                  className="border-2 border-[#3457D5] data-[state=checked]:bg-[#3457D5] mt-1"
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
                {isSubmitting ? "SUBMITTING..." : "SUBMIT REQUEST"}
              </Button>
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
