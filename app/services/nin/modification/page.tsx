"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Edit2, AlertTriangle, FileCheck, Clock } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import useDynamicPricing from "@/hooks/useDynamicPricing"
import { PinPrompt } from "@/components/PinPrompt"

export default function NINModificationPage() {
  const [showPrivacyWarning, setShowPrivacyWarning] = useState(true)
  const [modificationType, setModificationType] = useState("")
  const [currentDetails, setCurrentDetails] = useState("")
  const [newDetails, setNewDetails] = useState("")
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [servicePrice, setServicePrice] = useState(0)
  const [isMarketer, setIsMarketer] = useState(false)
  const [isPinPromptOpen, setIsPinPromptOpen] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<any>(null)
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

  // Dynamic pricing via hook: category=nin, subservice=modification, variant=basic
  const normalizedModificationType = useMemo(() => {
    const s = String(modificationType || "").toLowerCase()
    return s.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "unknown"
  }, [modificationType])

  const { price: dynPrice, isLoading: priceLoading, error: priceError, submitService } = useDynamicPricing(
    "nin",
    "modification",
    "basic",
    { modificationType: normalizedModificationType },
  )

  // Reflect hook price into UI display/state
  useEffect(() => {
    if (typeof dynPrice === "number") setServicePrice(Number(dynPrice))
    else if (!priceLoading && dynPrice == null) setServicePrice(0)
  }, [dynPrice, priceLoading])

  const handleSubmit = () => {
    // Validate name format if modification type is name correction
    if (modificationType === "name" && newDetails) {
      const nameParts = newDetails.trim().split(/\s+/)
      if (nameParts.length < 3) {
        toast({
          title: "Invalid Name Format",
          description: "Please enter full name in format: First Middle Surname.",
          variant: "destructive",
        })
        return
      }
    }

    if (!isFormValid()) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields and agree to terms",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    setPendingPayload({
      amount: servicePrice,
      modificationType,
      oldDetails: currentDetails,
      newDetails,
      category: "nin",
      action: "modification"
    })
    setIsPinPromptOpen(true)
  }

  const handlePinConfirm = async (pin: string) => {
    setIsPinPromptOpen(false)
    setIsProcessing(true)

    try {
      const resp = await submitService({ ...pendingPayload, pin })
      if (!resp.ok) {
        throw new Error(resp.error || "Submission failed")
      }
      toast({ title: "Success!", description: "NIN Modification request submitted successfully." })
      setModificationType("")
      setCurrentDetails("")
      setNewDetails("")
      setAgreePrivacy(false)
      setAgreeTerms(false)
    } catch (err: any) {
      toast({ title: "Submission Error", description: err.message || "An error occurred", variant: "destructive" })
    } finally {
      setIsProcessing(false)
    }
  }

  const isFormValid = () => {
    return modificationType && currentDetails && newDetails && agreePrivacy && agreeTerms
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
              <Edit2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">NIN Modification</h1>
          </div>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Correct your NIN record - name, DOB, address, and more
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
                  <FileCheck className="mr-2 h-5 w-5" />
                  Submit Modification Request
                </CardTitle>
                <CardDescription>Provide details for NIN record correction</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div>
                  <Label htmlFor="modification-type" className="text-sm font-medium">
                    Modification Type
                  </Label>
                  <Select value={modificationType} onValueChange={setModificationType}>
                    <SelectTrigger className="mt-2 border-[#CCCCFF] focus:border-[#3457D5]">
                      <SelectValue placeholder="Select modification type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name Correction</SelectItem>
                      <SelectItem value="dob">Date of Birth Correction</SelectItem>
                      <SelectItem value="address">Address Update</SelectItem>
                      <SelectItem value="gender">Gender Update</SelectItem>
                      <SelectItem value="phone">Phone Update</SelectItem>
                      <SelectItem value="other">Others</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="current-details" className="text-sm font-medium">
                    Current Details
                  </Label>
                  <Textarea
                    id="current-details"
                    placeholder="Enter current NIN record..."
                    value={currentDetails}
                    onChange={(e) => setCurrentDetails(e.target.value)}
                    className="mt-2 min-h-[100px] border-[#CCCCFF] focus:border-[#3457D5]"
                  />
                </div>

                <div>
                  <Label htmlFor="new-details" className="text-sm font-medium">
                    New Details
                  </Label>
                  <Textarea
                    id="new-details"
                    placeholder="Enter new details..."
                    value={newDetails}
                    onChange={(e) => setNewDetails(e.target.value)}
                    className="mt-2 min-h-[100px] border-[#CCCCFF] focus:border-[#3457D5]"
                  />
                  {modificationType === "name" && (
                    <p className="mt-1 text-xs text-gray-500">Format: First Middle Surname</p>
                  )}
                </div>

                <div className="rounded-lg border border-[#3457D5]/30 bg-[#CCCCFF]/20 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">💰 Service Price:</span>
                    <span className="text-2xl font-bold text-[#3457D5]">{priceLoading ? "Fetching price..." : `₦${servicePrice.toFixed(2)}`}</span>
                  </div>
                  {priceError && (
                    <p className="mt-1 text-xs text-red-600">{String(priceError)}</p>
                  )}
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
                  disabled={!isFormValid() || isProcessing}
                  className="w-full bg-[#3457D5] py-6 text-base font-semibold text-white hover:bg-[#3457D5]/90"
                >
                  {isProcessing ? "Submitting..." : "Submit Modification Request"}
                </Button>
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
                  <FileCheck className="mr-2 h-5 w-5" />
                  Modification Types
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="rounded-lg border border-[#3457D5]/20 bg-[#CCCCFF]/10 p-3">
                    <div className="font-semibold text-[#3457D5]">Name Correction</div>
                    <div className="text-sm text-gray-600">Update incorrect name spelling or format</div>
                  </div>
                  <div className="rounded-lg border border-[#3457D5]/20 bg-[#CCCCFF]/10 p-3">
                    <div className="font-semibold text-[#3457D5]">Date of Birth</div>
                    <div className="text-sm text-gray-600">Correct wrong date of birth</div>
                  </div>
                  <div className="rounded-lg border border-[#3457D5]/20 bg-[#CCCCFF]/10 p-3">
                    <div className="font-semibold text-[#3457D5]">Address Update</div>
                    <div className="text-sm text-gray-600">Change residential address</div>
                  </div>
                  <div className="rounded-lg border border-[#3457D5]/20 bg-[#CCCCFF]/10 p-3">
                    <div className="font-semibold text-[#3457D5]">Other Updates</div>
                    <div className="text-sm text-gray-600">Gender, phone, or other details</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#CCCCFF]/30">
              <CardHeader className="bg-gradient-to-r from-[#3457D5]/5 to-[#CCCCFF]/10">
                <CardTitle className="flex items-center text-[#3457D5]">
                  <Clock className="mr-2 h-5 w-5" />
                  Processing Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="mr-2 text-[#3457D5]">•</span>
                    <span>Request submission: Instant</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-[#3457D5]">•</span>
                    <span>Document review: 2-3 business days</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-[#3457D5]">•</span>
                    <span>NIMC verification: 5-7 business days</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-[#3457D5]">•</span>
                    <span>Final approval: 2-3 business days</span>
                  </li>
                </ul>
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
                    <span>Supporting documents (ID card, affidavit, etc.)</span>
                  </p>
                  <p className="flex items-start">
                    <span className="mr-2 text-[#3457D5]">•</span>
                    <span>Name changes require legal documentation</span>
                  </p>
                  <p className="flex items-start">
                    <span className="mr-2 text-[#3457D5]">•</span>
                    <span>Address changes need proof of residence</span>
                  </p>
                  <p className="flex items-start">
                    <span className="mr-2 text-[#3457D5]">•</span>
                    <span>Some modifications require NIMC visit</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#CCCCFF]/30">
              <CardHeader className="bg-gradient-to-r from-[#3457D5]/5 to-[#CCCCFF]/10">
                <CardTitle className="text-[#3457D5]">Important Notes</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-2 text-sm text-gray-600">
                  <p className="flex items-start">
                    <span className="mr-2 text-[#3457D5]">•</span>
                    <span>Processing fee applies for all modifications</span>
                  </p>
                  <p className="flex items-start">
                    <span className="mr-2 text-[#3457D5]">•</span>
                    <span>Keep your request reference number safe</span>
                  </p>
                  <p className="flex items-start">
                    <span className="mr-2 text-[#3457D5]">•</span>
                    <span>You will be notified of approval status</span>
                  </p>
                  <p className="flex items-start">
                    <span className="mr-2 text-[#3457D5]">•</span>
                    <span>Contact support for any questions</span>
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
