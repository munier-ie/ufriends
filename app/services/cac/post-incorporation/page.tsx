"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { AlertTriangle, FileCheck, Clock, Upload, X } from "lucide-react"
import { PinPrompt } from "@/components/PinPrompt"
import { handleServiceError } from "@/lib/service-utils"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useKYCCheck } from "@/hooks/use-kyc-check"
import { KYCRequiredModal } from "@/components/kyc-required-modal"
import useDynamicPricing from "@/hooks/useDynamicPricing"

const SERVICE_TYPES = [
  { value: "annual-returns", label: "Annual Returns Filing", price: 15000 },
  { value: "change-name", label: "Change of Company Name", price: 25000 },
  { value: "change-address", label: "Change of Business Address", price: 20000 },
  { value: "change-directors", label: "Change of Directors / Secretaries", price: 18000 },
  { value: "increase-capital", label: "Increase Share Capital", price: 30000 },
  { value: "certified-copy", label: "Certified True Copy / Company Extract", price: 5000, hasQuantity: true },
  { value: "good-standing", label: "Letter of Good Standing", price: 12000 },
  { value: "retrieve-certificate", label: "Retrieve / Re-Download Lost Certificate", price: 8000 },
  { value: "retrieve-status", label: "Retrieve / Re-Download Status Report", price: 6000 },
  { value: "amend-memorandum", label: "Amend Memorandum / Articles", price: 22000 },
]

export default function CacPostIncorporationPage() {
  const [showPrivacyWarning, setShowPrivacyWarning] = useState(true)
  const [serviceType, setServiceType] = useState("")
  const [identifierType, setIdentifierType] = useState<"RC" | "BN">("RC")
  const [rcNumber, setRcNumber] = useState("")
  const [bnNumber, setBnNumber] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [currentDetails, setCurrentDetails] = useState("")
  const [newDetails, setNewDetails] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPinPromptOpen, setIsPinPromptOpen] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<any>(null)
  const { toast } = useToast()
  const { showKYCModal, setShowKYCModal, requireKYC } = useKYCCheck()

  const selectedService = SERVICE_TYPES.find((s) => s.value === serviceType)
  const { price: servicePrice, isLoading: priceLoading, error: priceError, submitService } = useDynamicPricing(
    "cac",
    "post-incorporation",
    serviceType || "unknown",
    {
      identifierType,
      quantity: selectedService?.hasQuantity ? Number.parseInt(quantity || "1") : false,
    },
  )

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setUploadedFiles((prev) => [...prev, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (!requireKYC()) return

    if (!isFormValid()) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields and agree to terms",
        variant: "destructive",
      })
      return
    }

    setPendingPayload({
      amount: Number(servicePrice || 0),
      idempotencyKey: crypto.randomUUID(),
      params: {
        serviceType: selectedService?.label,
        identifierType,
        rcNumber: identifierType === "RC" ? rcNumber : undefined,
        bnNumber: identifierType === "BN" ? bnNumber : undefined,
        businessName,
        currentDetails,
        newDetails,
        quantity: selectedService?.hasQuantity ? quantity : undefined,
        uploadedFileNames: uploadedFiles.map((f) => f.name),
      },
      category: "cac",
      action: "post-incorporation"
    })
    setIsPinPromptOpen(true)
  }

  const handlePinConfirm = async (pin: string) => {
    setIsPinPromptOpen(false)
    setIsProcessing(true)

    try {
      const resp = await submitService({ ...pendingPayload, pin })

      if (!resp.ok) {
        handleServiceError(resp, toast, "Submission Failed")
        return
      }

      toast({
        title: "Success",
        description: "Post-Incorporation request submitted successfully!",
      })

      // Reset form
      setServiceType("")
      setRcNumber("")
      setBnNumber("")
      setBusinessName("")
      setCurrentDetails("")
      setNewDetails("")
      setQuantity("1")
      setUploadedFiles([])
      setAgreePrivacy(false)
      setAgreeTerms(false)
    } catch (err: any) {
      toast({ title: "Submission Error", description: err.message || "An error occurred", variant: "destructive" })
    } finally {
      setIsProcessing(false)
    }
  }

  const isFormValid = () => {
    if (!serviceType) return false
    if (identifierType === "RC" && !rcNumber) return false
    if (identifierType === "BN" && !bnNumber) return false
    if (!agreePrivacy || !agreeTerms) return false
    if (uploadedFiles.length === 0) return false
    return true
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
              <FileCheck className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">CAC Post-Incorporation Services</h1>
          </div>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Manage your business post-registration needs - annual returns, name changes, address updates, and more
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
                  Service Request Form
                </CardTitle>
                <CardDescription>Select and submit your post-incorporation service request</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div>
                  <Label htmlFor="service-type" className="text-sm font-medium">
                    Service Type <span className="text-destructive">*</span>
                  </Label>
                  <Select value={serviceType} onValueChange={setServiceType}>
                    <SelectTrigger className="mt-2 border-[#CCCCFF] focus:border-[#3457D5] w-full">
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_TYPES.map((service) => (
                        <SelectItem key={service.value} value={service.value}>
                          {service.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-medium">Company Identifier</Label>
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant={identifierType === "RC" ? "default" : "outline"}
                      onClick={() => setIdentifierType("RC")}
                      className={identifierType === "RC" ? "bg-[#3457D5] hover:bg-[#3457D5]/90" : ""}
                    >
                      RC Number
                    </Button>
                    <Button
                      type="button"
                      variant={identifierType === "BN" ? "default" : "outline"}
                      onClick={() => setIdentifierType("BN")}
                      className={identifierType === "BN" ? "bg-[#3457D5] hover:bg-[#3457D5]/90" : ""}
                    >
                      Business Name (BN)
                    </Button>
                  </div>

                  {identifierType === "RC" ? (
                    <div>
                      <Label htmlFor="rc-number" className="text-sm font-medium">
                        RC Number <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="rc-number"
                        value={rcNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "")
                          setRcNumber(value.slice(0, 7))
                        }}
                        placeholder="e.g., 1234567"
                        className="mt-2 border-[#CCCCFF] focus:border-[#3457D5]"
                      />
                      <p className="mt-1 text-xs text-gray-500">7 digits only</p>
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="bn-number" className="text-sm font-medium">
                        BN Number <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="bn-number"
                        value={bnNumber}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase()
                          // Extract only the numeric part after BN prefix
                          const numericPart = value.replace(/^BN/, "").replace(/\D/g, "")
                          // Limit to 7 digits
                          const limitedNumeric = numericPart.slice(0, 7)
                          // Reconstruct with BN prefix if it exists
                          const prefix = value.startsWith("BN") ? "BN" : ""
                          setBnNumber(prefix + limitedNumeric)
                        }}
                        placeholder="e.g., BN1234567"
                        className="mt-2 border-[#CCCCFF] focus:border-[#3457D5]"
                      />
                      <p className="mt-1 text-xs text-gray-500">BN followed by up to 7 digits</p>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="business-name" className="text-sm font-medium">
                      Business/Company Name (Optional)
                    </Label>
                    <Input
                      id="business-name"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Enter business name"
                      className="mt-2 border-[#CCCCFF] focus:border-[#3457D5]"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="current-details" className="text-sm font-medium">
                    Current Details
                  </Label>
                  <Textarea
                    id="current-details"
                    placeholder="Enter current information (e.g., current name, address, director details)..."
                    value={currentDetails}
                    onChange={(e) => setCurrentDetails(e.target.value)}
                    className="mt-2 min-h-[100px] border-[#CCCCFF] focus:border-[#3457D5]"
                  />
                  <p className="mt-1 text-xs text-gray-500">Provide the current information on record</p>
                </div>

                <div>
                  <Label htmlFor="new-details" className="text-sm font-medium">
                    New Details
                  </Label>
                  <Textarea
                    id="new-details"
                    placeholder="Enter new information (e.g., new name, new address, new director details)..."
                    value={newDetails}
                    onChange={(e) => setNewDetails(e.target.value)}
                    className="mt-2 min-h-[100px] border-[#CCCCFF] focus:border-[#3457D5]"
                  />
                  <p className="mt-1 text-xs text-gray-500">Provide the updated information you want to register</p>
                </div>

                {selectedService?.hasQuantity && (
                  <div>
                    <Label htmlFor="quantity" className="text-sm font-medium">
                      Quantity / Number of Pages
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="mt-2 border-[#CCCCFF] focus:border-[#3457D5]"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="file-upload" className="text-sm font-medium">
                    Upload Supporting Documents <span className="text-destructive">*</span>
                  </Label>
                  <div className="mt-2">
                    <label
                      htmlFor="file-upload"
                      className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-[#CCCCFF] bg-[#CCCCFF]/10 p-6 transition-colors hover:border-[#3457D5] hover:bg-[#CCCCFF]/20"
                    >
                      <div className="text-center">
                        <Upload className="mx-auto h-8 w-8 text-[#3457D5]" />
                        <p className="mt-2 text-sm text-gray-600">Click to upload or drag and drop</p>
                        <p className="mt-1 text-xs text-gray-500">PDF, DOC, DOCX, JPG, PNG (Max 10MB each)</p>
                      </div>
                      <input
                        id="file-upload"
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-md border border-[#CCCCFF] bg-white p-2"
                        >
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-[#3457D5]/30 bg-[#CCCCFF]/20 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Service Price:</span>
                    {priceLoading ? (
                      <span className="text-sm text-muted-foreground">Fetching price...</span>
                    ) : servicePrice != null && Number(servicePrice) > 0 ? (
                      <span className="text-2xl font-bold text-[#3457D5]">₦{Number(servicePrice).toLocaleString()}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
                  {priceError && (
                    <p className="mt-2 text-xs text-red-600">Failed to load price. You can still submit.</p>
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
                  {isProcessing ? "Submitting..." : "Submit Request"}
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
                  Available Services
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {SERVICE_TYPES.map((service) => (
                    <div key={service.value} className="rounded-lg border border-[#3457D5]/20 bg-[#CCCCFF]/10 p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-[#3457D5]">{service.label}</div>
                          <div className="text-sm text-gray-600">
                            ₦{service.price.toLocaleString()}
                            {service.hasQuantity && " per page"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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
                    <span>Document review: 1-2 business days</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-[#3457D5]">•</span>
                    <span>CAC processing: 3-7 business days</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-[#3457D5]">•</span>
                    <span>Final delivery: 1-2 business days</span>
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
                    <span>Valid identification (Director's ID)</span>
                  </p>
                  <p className="flex items-start">
                    <span className="mr-2 text-[#3457D5]">•</span>
                    <span>Supporting documents (varies by service)</span>
                  </p>
                  <p className="flex items-start">
                    <span className="mr-2 text-[#3457D5]">•</span>
                    <span>Proof of authority (if applicable)</span>
                  </p>
                  <p className="flex items-start">
                    <span className="mr-2 text-[#3457D5]">•</span>
                    <span>Utility bill for address changes</span>
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
                    <span>All prices are subject to CAC official fees</span>
                  </p>
                  <p className="flex items-start">
                    <span className="mr-2 text-[#3457D5]">•</span>
                    <span>Processing times may vary based on CAC workload</span>
                  </p>
                  <p className="flex items-start">
                    <span className="mr-2 text-[#3457D5]">•</span>
                    <span>Keep your request reference number safe</span>
                  </p>
                  <p className="flex items-start">
                    <span className="mr-2 text-[#3457D5]">•</span>
                    <span>Contact support for urgent requests</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      <KYCRequiredModal open={showKYCModal} onOpenChange={setShowKYCModal} />
      <PinPrompt
        isOpen={isPinPromptOpen}
        onClose={() => setIsPinPromptOpen(false)}
        onConfirm={handlePinConfirm}
        isLoading={isProcessing}
      />
    </div>
  )
}
