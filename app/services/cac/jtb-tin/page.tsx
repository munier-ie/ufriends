"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { AlertTriangle, FileText, Upload, X, CheckCircle2, Building2, User } from "lucide-react"
import { PinPrompt } from "@/components/PinPrompt"
import { handleServiceError } from "@/lib/service-utils"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useKYCCheck } from "@/hooks/use-kyc-check"
import { KYCRequiredModal } from "@/components/kyc-required-modal"
import useDynamicPricing from "@/hooks/useDynamicPricing"
import { Skeleton } from "@/components/ui/skeleton"

type ApplicantType = "Individual" | "Business"
type IDType = "NIN" | "BVN"

interface IndividualFormData {
  firstName: string
  middleName: string
  lastName: string
  dateOfBirth: string
  idType: IDType
  nin: string
  bvn: string
  phone: string
  email: string
  street: string
  city: string
  state: string
  lga: string
}

interface BusinessFormData {
  businessName: string
  cacNumber: string
  businessAddress: string
  phone: string
  email: string
  directorName: string
  directorIdType: IDType
  directorNin: string
  directorBvn: string
  businessNature: string
}

export default function JTBTINRegistrationPage() {
  const [showPrivacyWarning, setShowPrivacyWarning] = useState(true)
  const [applicantType, setApplicantType] = useState<ApplicantType>("Individual")
  // Dynamic pricing via hook: category=cac, subservice=jtb-tin, variant=individual|business
  const variant = applicantType === "Individual" ? "individual" : "business"
  const { price: servicePrice, isLoading: priceLoading, error: priceError, submitService } = useDynamicPricing(
    "cac",
    "jtb-tin",
    variant,
  )

  // Individual form state
  const [individualForm, setIndividualForm] = useState<IndividualFormData>({
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: "",
    idType: "NIN",
    nin: "",
    bvn: "",
    phone: "",
    email: "",
    street: "",
    city: "",
    state: "",
    lga: "",
  })

  // Business form state
  const [businessForm, setBusinessForm] = useState<BusinessFormData>({
    businessName: "",
    cacNumber: "",
    businessAddress: "",
    phone: "",
    email: "",
    directorName: "",
    directorIdType: "NIN",
    directorNin: "",
    directorBvn: "",
    businessNature: "",
  })

  const [validIdFile, setValidIdFile] = useState<File | null>(null)
  const [cacCertFile, setCacCertFile] = useState<File | null>(null)
  const [proofOfAddressFile, setProofOfAddressFile] = useState<File | null>(null)
  const [directorIdFile, setDirectorIdFile] = useState<File | null>(null)

  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPinPromptOpen, setIsPinPromptOpen] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<any>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [referenceId, setReferenceId] = useState("")

  const { toast } = useToast()
  const { showKYCModal, setShowKYCModal, requireKYC } = useKYCCheck()

  // Pricing handled by useDynamicPricing and updates as applicantType changes

  const handleIndividualChange = (field: keyof IndividualFormData, value: string) => {
    setIndividualForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleBusinessChange = (field: keyof BusinessFormData, value: string) => {
    setBusinessForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<File | null>>,
  ) => {
    const file = e.target.files?.[0]
    if (file) {
      const validTypes = ["image/jpeg", "image/png", "application/pdf"]
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload JPG, PNG, or PDF files only",
          variant: "destructive",
        })
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "File size must be less than 10MB",
          variant: "destructive",
        })
        return
      }
      setter(file)
    }
  }

  const validateIndividualForm = (): boolean => {
    if (!individualForm.firstName || !individualForm.lastName) {
      toast({
        title: "Validation Error",
        description: "First name and last name are required",
        variant: "destructive",
      })
      return false
    }
    if (!individualForm.dateOfBirth) {
      toast({
        title: "Validation Error",
        description: "Date of birth is required",
        variant: "destructive",
      })
      return false
    }
    if (individualForm.idType === "NIN" && !individualForm.nin) {
      toast({
        title: "Validation Error",
        description: "NIN is required",
        variant: "destructive",
      })
      return false
    }
    if (individualForm.idType === "BVN" && !individualForm.bvn) {
      toast({
        title: "Validation Error",
        description: "BVN is required",
        variant: "destructive",
      })
      return false
    }
    if (individualForm.nin && individualForm.nin.length !== 11) {
      toast({
        title: "Validation Error",
        description: "NIN must be 11 digits",
        variant: "destructive",
      })
      return false
    }
    if (individualForm.bvn && individualForm.bvn.length !== 11) {
      toast({
        title: "Validation Error",
        description: "BVN must be 11 digits",
        variant: "destructive",
      })
      return false
    }
    if (!individualForm.phone || individualForm.phone.length !== 11) {
      toast({
        title: "Validation Error",
        description: "Phone number must be 11 digits",
        variant: "destructive",
      })
      return false
    }
    if (!individualForm.email || !individualForm.email.includes("@")) {
      toast({
        title: "Validation Error",
        description: "Valid email address is required",
        variant: "destructive",
      })
      return false
    }
    if (!validIdFile) {
      toast({
        title: "Validation Error",
        description: "Valid ID upload is required",
        variant: "destructive",
      })
      return false
    }
    if (!individualForm.street || !individualForm.city || !individualForm.state || !individualForm.lga) {
      toast({
        title: "Validation Error",
        description: "Complete residential address is required",
        variant: "destructive",
      })
      return false
    }
    return true
  }

  const validateBusinessForm = (): boolean => {
    if (!businessForm.businessName) {
      toast({
        title: "Validation Error",
        description: "Business name is required",
        variant: "destructive",
      })
      return false
    }
    if (!businessForm.cacNumber) {
      toast({
        title: "Validation Error",
        description: "CAC certificate number is required",
        variant: "destructive",
      })
      return false
    }
    if (!businessForm.businessAddress) {
      toast({
        title: "Validation Error",
        description: "Business address is required",
        variant: "destructive",
      })
      return false
    }
    if (!businessForm.phone || businessForm.phone.length !== 11) {
      toast({
        title: "Validation Error",
        description: "Phone number must be 11 digits",
        variant: "destructive",
      })
      return false
    }
    if (!businessForm.email || !businessForm.email.includes("@")) {
      toast({
        title: "Validation Error",
        description: "Valid email address is required",
        variant: "destructive",
      })
      return false
    }
    if (!businessForm.directorName) {
      toast({
        title: "Validation Error",
        description: "Director name is required",
        variant: "destructive",
      })
      return false
    }
    if (businessForm.directorIdType === "NIN" && !businessForm.directorNin) {
      toast({
        title: "Validation Error",
        description: "Director NIN is required",
        variant: "destructive",
      })
      return false
    }
    if (businessForm.directorIdType === "BVN" && !businessForm.directorBvn) {
      toast({
        title: "Validation Error",
        description: "Director BVN is required",
        variant: "destructive",
      })
      return false
    }
    if (!directorIdFile) {
      toast({
        title: "Validation Error",
        description: "Director ID is required",
        variant: "destructive",
      })
      return false
    }
    if (!cacCertFile) {
      toast({
        title: "Validation Error",
        description: "CAC certificate upload is required",
        variant: "destructive",
      })
      return false
    }
    if (!proofOfAddressFile) {
      toast({
        title: "Validation Error",
        description: "Proof of address is required",
        variant: "destructive",
      })
      return false
    }
    if (!businessForm.businessNature) {
      toast({
        title: "Validation Error",
        description: "Business nature/sector is required",
        variant: "destructive",
      })
      return false
    }
    return true
  }

  const handleSubmit = () => {
    if (!requireKYC()) return

    if (!agreePrivacy || !agreeTerms) {
      toast({
        title: "Validation Error",
        description: "Please agree to privacy policy and terms of use",
        variant: "destructive",
      })
      return
    }

    const isValid = applicantType === "Individual" ? validateIndividualForm() : validateBusinessForm()
    if (!isValid) return

    setPendingPayload({
      amount: Number(servicePrice || 0),
      idempotencyKey: crypto.randomUUID(),
      params: {
        applicantType,
        formData: applicantType === "Individual" ? individualForm : businessForm,
        uploadedFileNames: {
          validId: validIdFile?.name,
          cacCert: cacCertFile?.name,
          proofOfAddress: proofOfAddressFile?.name,
          directorId: directorIdFile?.name,
        }
      },
      category: "cac",
      action: "jtb-tin"
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

      setReferenceId(String(resp.reference || ""))
      setShowConfirmation(true)
      toast({
        title: "Success!",
        description: "JTB TIN registration request submitted successfully",
      })
    } catch (err: any) {
      toast({ title: "Submission Error", description: err.message || "An error occurred", variant: "destructive" })
    } finally {
      setIsProcessing(false)
    }
  }

  const resetForm = () => {
    setIndividualForm({
      firstName: "",
      middleName: "",
      lastName: "",
      dateOfBirth: "",
      idType: "NIN",
      nin: "",
      bvn: "",
      phone: "",
      email: "",
      street: "",
      city: "",
      state: "",
      lga: "",
    })
    setBusinessForm({
      businessName: "",
      cacNumber: "",
      businessAddress: "",
      phone: "",
      email: "",
      directorName: "",
      directorIdType: "NIN",
      directorNin: "",
      directorBvn: "",
      businessNature: "",
    })
    setValidIdFile(null)
    setCacCertFile(null)
    setProofOfAddressFile(null)
    setDirectorIdFile(null)
    setAgreePrivacy(false)
    setAgreeTerms(false)
    setShowConfirmation(false)
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

      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <DialogTitle className="text-center text-2xl font-bold">Request Submitted Successfully!</DialogTitle>
            <DialogDescription className="text-center text-sm leading-relaxed text-gray-600">
              Your JTB TIN registration request has been received and is being processed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-[#3457D5]/30 bg-[#CCCCFF]/20 p-4">
              <p className="text-sm font-medium text-gray-700">Reference ID:</p>
              <p className="text-lg font-bold text-[#3457D5]">{referenceId}</p>
            </div>
            <div className="rounded-lg border border-[#3457D5]/30 bg-[#CCCCFF]/20 p-4">
              <p className="text-sm font-medium text-gray-700">Status:</p>
              <p className="text-lg font-semibold text-orange-600">Pending Review</p>
            </div>
            <p className="text-center text-xs text-gray-500">
              Please save your reference ID for tracking purposes. You will be notified once your request is processed.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={resetForm} className="flex-1 bg-[#3457D5] text-white hover:bg-[#3457D5]/90">
              Submit Another Request
            </Button>
            <Button
              onClick={() => setShowConfirmation(false)}
              variant="outline"
              className="flex-1 border-[#3457D5] text-[#3457D5]"
            >
              Close
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
            <h1 className="text-4xl font-bold text-gray-900">JTB TIN Registration</h1>
          </div>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Register for your Tax Identification Number (TIN) through the Joint Tax Board
          </p>
        </motion.div>

        <div className="mb-6">
          <Card className="border-[#CCCCFF]/30 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-[#3457D5]/5 to-[#CCCCFF]/10">
              <CardTitle className="text-[#3457D5]">Select Applicant Type</CardTitle>
              <CardDescription>Choose whether you're applying as an individual or business</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setApplicantType("Individual")}
                  className={`flex items-center gap-4 rounded-lg border-2 p-6 transition-all ${applicantType === "Individual"
                    ? "border-[#3457D5] bg-[#CCCCFF]/20"
                    : "border-[#CCCCFF] bg-white hover:border-[#3457D5]/50"
                    }`}
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full ${applicantType === "Individual" ? "bg-[#3457D5]" : "bg-[#CCCCFF]"
                      }`}
                  >
                    <User className={`h-6 w-6 ${applicantType === "Individual" ? "text-white" : "text-[#3457D5]"}`} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">Individual</h3>
                    <p className="text-sm text-gray-600">Personal TIN registration</p>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setApplicantType("Business")}
                  className={`flex items-center gap-4 rounded-lg border-2 p-6 transition-all ${applicantType === "Business"
                    ? "border-[#3457D5] bg-[#CCCCFF]/20"
                    : "border-[#CCCCFF] bg-white hover:border-[#3457D5]/50"
                    }`}
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full ${applicantType === "Business" ? "bg-[#3457D5]" : "bg-[#CCCCFF]"
                      }`}
                  >
                    <Building2
                      className={`h-6 w-6 ${applicantType === "Business" ? "text-white" : "text-[#3457D5]"}`}
                    />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">Business</h3>
                    <p className="text-sm text-gray-600">Corporate TIN registration</p>
                  </div>
                </motion.button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={applicantType}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-[#CCCCFF]/30 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-[#3457D5]/5 to-[#CCCCFF]/10">
                    <CardTitle className="flex items-center text-[#3457D5]">
                      <FileText className="mr-2 h-5 w-5" />
                      {applicantType} Registration Form
                    </CardTitle>
                    <CardDescription>Fill in all required information accurately</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    {applicantType === "Individual" ? (
                      <>
                        <div className="grid gap-4 md:grid-cols-3">
                          <div>
                            <Label htmlFor="firstName">
                              First Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="firstName"
                              value={individualForm.firstName}
                              onChange={(e) => handleIndividualChange("firstName", e.target.value)}
                              placeholder="Enter first name"
                              className="mt-2 border-[#CCCCFF] focus:border-[#3457D5]"
                            />
                          </div>
                          <div>
                            <Label htmlFor="middleName">Middle Name</Label>
                            <Input
                              id="middleName"
                              value={individualForm.middleName}
                              onChange={(e) => handleIndividualChange("middleName", e.target.value)}
                              placeholder="Enter middle name"
                              className="mt-2 border-[#CCCCFF] focus:border-[#3457D5]"
                            />
                          </div>
                          <div>
                            <Label htmlFor="lastName">
                              Last Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="lastName"
                              value={individualForm.lastName}
                              onChange={(e) => handleIndividualChange("lastName", e.target.value)}
                              placeholder="Enter last name"
                              className="mt-2 border-[#CCCCFF] focus:border-[#3457D5]"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="dateOfBirth">
                            Date of Birth <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="dateOfBirth"
                            type="date"
                            value={individualForm.dateOfBirth}
                            onChange={(e) => handleIndividualChange("dateOfBirth", e.target.value)}
                            className="mt-2 border-[#CCCCFF] focus:border-[#3457D5]"
                          />
                        </div>

                        <div>
                          <Label className="mb-2 block">
                            Identification Type <span className="text-destructive">*</span>
                          </Label>
                          <div className="flex gap-4">
                            <Button
                              type="button"
                              variant={individualForm.idType === "NIN" ? "default" : "outline"}
                              onClick={() => handleIndividualChange("idType", "NIN")}
                              className={individualForm.idType === "NIN" ? "bg-[#3457D5] hover:bg-[#3457D5]/90" : ""}
                            >
                              NIN
                            </Button>
                            <Button
                              type="button"
                              variant={individualForm.idType === "BVN" ? "default" : "outline"}
                              onClick={() => handleIndividualChange("idType", "BVN")}
                              className={individualForm.idType === "BVN" ? "bg-[#3457D5] hover:bg-[#3457D5]/90" : ""}
                            >
                              BVN
                            </Button>
                          </div>
                        </div>

                        {individualForm.idType === "NIN" ? (
                          <div>
                            <Label htmlFor="nin">
                              NIN (11 digits) <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="nin"
                              value={individualForm.nin}
                              onChange={(e) => handleIndividualChange("nin", e.target.value.replace(/\D/g, ""))}
                              placeholder="Enter 11-digit NIN"
                              maxLength={11}
                              className="mt-2 border-[#CCCCFF] focus:border-[#3457D5]"
                            />
                          </div>
                        ) : (
                          <div>
                            <Label htmlFor="bvn">
                              BVN (11 digits) <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="bvn"
                              value={individualForm.bvn}
                              onChange={(e) => handleIndividualChange("bvn", e.target.value.replace(/\D/g, ""))}
                              placeholder="Enter 11-digit BVN"
                              maxLength={11}
                              className="mt-2 border-[#CCCCFF] focus:border-[#3457D5]"
                            />
                          </div>
                        )}

                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <Label htmlFor="phone">
                              Phone Number <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="phone"
                              value={individualForm.phone}
                              onChange={(e) => handleIndividualChange("phone", e.target.value.replace(/\D/g, ""))}
                              placeholder="08012345678"
                              maxLength={11}
                              className="mt-2 border-[#CCCCFF] focus:border-[#3457D5]"
                            />
                          </div>
                          <div>
                            <Label htmlFor="email">
                              Email Address <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="email"
                              type="email"
                              value={individualForm.email}
                              onChange={(e) => handleIndividualChange("email", e.target.value)}
                              placeholder="email@example.com"
                              className="mt-2 border-[#CCCCFF] focus:border-[#3457D5]"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="validId">
                            Valid ID Upload (Passport/National ID/Driver License){" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <div className="mt-2">
                            <label
                              htmlFor="validId"
                              className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-[#CCCCFF] bg-[#CCCCFF]/10 p-6 transition-colors hover:border-[#3457D5] hover:bg-[#CCCCFF]/20"
                            >
                              <div className="text-center">
                                <Upload className="mx-auto h-8 w-8 text-[#3457D5]" />
                                <p className="mt-2 text-sm text-gray-600">
                                  {validIdFile ? validIdFile.name : "Click to upload ID"}
                                </p>
                                <p className="mt-1 text-xs text-gray-500">JPG, PNG, PDF (Max 10MB)</p>
                              </div>
                              <input
                                id="validId"
                                type="file"
                                accept=".jpg,.jpeg,.png,.pdf"
                                onChange={(e) => handleFileUpload(e, setValidIdFile)}
                                className="hidden"
                              />
                            </label>
                            {validIdFile && (
                              <div className="mt-2 flex items-center justify-between rounded-md border border-[#CCCCFF] bg-white p-2">
                                <span className="text-sm text-gray-700">{validIdFile.name}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setValidIdFile(null)}
                                  className="h-6 w-6 p-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <Label className="text-base font-semibold">
                            Residential Address <span className="text-destructive">*</span>
                          </Label>
                          <div>
                            <Label htmlFor="street">Street Address</Label>
                            <Input
                              id="street"
                              value={individualForm.street}
                              onChange={(e) => handleIndividualChange("street", e.target.value)}
                              placeholder="Enter street address"
                              className="mt-2 border-[#CCCCFF] focus:border-[#3457D5]"
                            />
                          </div>
                          <div className="grid gap-4 md:grid-cols-3">
                            <div>
                              <Label htmlFor="city">City</Label>
                              <Input
                                id="city"
                                value={individualForm.city}
                                onChange={(e) => handleIndividualChange("city", e.target.value)}
                                placeholder="Enter city"
                                className="mt-2 border-[#CCCCFF] focus:border-[#3457D5]"
                              />
                            </div>
                            <div>
                              <Label htmlFor="state">State</Label>
                              <Input
                                id="state"
                                value={individualForm.state}
                                onChange={(e) => handleIndividualChange("state", e.target.value)}
                                placeholder="Enter state"
                                className="mt-2 border-[#CCCCFF] focus:border-[#3457D5]"
                              />
                            </div>
                            <div>
                              <Label htmlFor="lga">LGA</Label>
                              <Input
                                id="lga"
                                value={individualForm.lga}
                                onChange={(e) => handleIndividualChange("lga", e.target.value)}
                                placeholder="Enter LGA"
                                className="mt-2 border-[#CCCCFF] focus:border-[#3457D5]"
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <Label htmlFor="businessName">
                            Business Name <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="businessName"
                            value={businessForm.businessName}
                            onChange={(e) => handleBusinessChange("businessName", e.target.value)}
                            placeholder="Enter registered business name"
                            className="mt-2 border-[#CCCCFF] focus:border-[#3457D5]"
                          />
                        </div>

                        <div>
                          <Label htmlFor="cacNumber">
                            CAC Certificate Number (RC Number) <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="cacNumber"
                            value={businessForm.cacNumber}
                            onChange={(e) => {
                              const value = e.target.value.toUpperCase()
                              // Extract only the numeric part after RC or BN prefix
                              const numericPart = value.replace(/^(RC|BN)/, "").replace(/\D/g, "")
                              // Limit to 7 digits
                              const limitedNumeric = numericPart.slice(0, 7)
                              // Reconstruct with prefix if it exists
                              const prefixMatch = value.match(/^(RC|BN)/)
                              const prefix = prefixMatch ? prefixMatch[0] : ""
                              handleBusinessChange("cacNumber", prefix + limitedNumeric)
                            }}
                            placeholder="e.g., RC1234567"
                            className="mt-2 border-[#CCCCFF] focus:border-[#3457D5]"
                          />
                          <p className="mt-1 text-xs text-gray-500">Enter RC or BN followed by up to 7 digits</p>
                        </div>

                        <div>
                          <Label htmlFor="businessAddress">
                            Registered Business Address <span className="text-destructive">*</span>
                          </Label>
                          <Textarea
                            id="businessAddress"
                            value={businessForm.businessAddress}
                            onChange={(e) => handleBusinessChange("businessAddress", e.target.value)}
                            placeholder="Enter complete business address"
                            className="mt-2 min-h-[80px] border-[#CCCCFF] focus:border-[#3457D5]"
                          />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <Label htmlFor="businessPhone">
                              Phone Number <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="businessPhone"
                              value={businessForm.phone}
                              onChange={(e) => handleBusinessChange("phone", e.target.value.replace(/\D/g, ""))}
                              placeholder="08012345678"
                              maxLength={11}
                              className="mt-2 border-[#CCCCFF] focus:border-[#3457D5]"
                            />
                          </div>
                          <div>
                            <Label htmlFor="businessEmail">
                              Email Address <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="businessEmail"
                              type="email"
                              value={businessForm.email}
                              onChange={(e) => handleBusinessChange("email", e.target.value)}
                              placeholder="business@example.com"
                              className="mt-2 border-[#CCCCFF] focus:border-[#3457D5]"
                            />
                          </div>
                        </div>

                        <div className="space-y-4 rounded-lg border-2 border-[#3457D5]/20 bg-[#CCCCFF]/10 p-4">
                          <Label className="text-base font-semibold">Director Details</Label>

                          <div>
                            <Label htmlFor="directorName">
                              Director Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="directorName"
                              value={businessForm.directorName}
                              onChange={(e) => handleBusinessChange("directorName", e.target.value)}
                              placeholder="Enter director's full name"
                              className="mt-2 border-[#CCCCFF] focus:border-[#3457D5]"
                            />
                          </div>

                          <div>
                            <Label className="mb-2 block">
                              Director ID Type <span className="text-destructive">*</span>
                            </Label>
                            <div className="flex gap-4">
                              <Button
                                type="button"
                                variant={businessForm.directorIdType === "NIN" ? "default" : "outline"}
                                onClick={() => handleBusinessChange("directorIdType", "NIN")}
                                className={
                                  businessForm.directorIdType === "NIN" ? "bg-[#3457D5] hover:bg-[#3457D5]/90" : ""
                                }
                              >
                                NIN
                              </Button>
                              <Button
                                type="button"
                                variant={businessForm.directorIdType === "BVN" ? "default" : "outline"}
                                onClick={() => handleBusinessChange("directorIdType", "BVN")}
                                className={
                                  businessForm.directorIdType === "BVN" ? "bg-[#3457D5] hover:bg-[#3457D5]/90" : ""
                                }
                              >
                                BVN
                              </Button>
                            </div>
                          </div>

                          {businessForm.directorIdType === "NIN" ? (
                            <div>
                              <Label htmlFor="directorNin">
                                Director NIN (11 digits) <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                id="directorNin"
                                value={businessForm.directorNin}
                                onChange={(e) => handleBusinessChange("directorNin", e.target.value.replace(/\D/g, ""))}
                                placeholder="Enter 11-digit NIN"
                                maxLength={11}
                                className="mt-2 border-[#CCCCFF] focus:border-[#3457D5]"
                              />
                            </div>
                          ) : (
                            <div>
                              <Label htmlFor="directorBvn">
                                Director BVN (11 digits) <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                id="directorBvn"
                                value={businessForm.directorBvn}
                                onChange={(e) => handleBusinessChange("directorBvn", e.target.value.replace(/\D/g, ""))}
                                placeholder="Enter 11-digit BVN"
                                maxLength={11}
                                className="mt-2 border-[#CCCCFF] focus:border-[#3457D5]"
                              />
                            </div>
                          )}

                          <div>
                            <Label htmlFor="directorId">
                              Director Valid ID <span className="text-destructive">*</span>
                            </Label>
                            <div className="mt-2">
                              <label
                                htmlFor="directorId"
                                className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-[#CCCCFF] bg-white p-4 transition-colors hover:border-[#3457D5]"
                              >
                                <div className="text-center">
                                  <Upload className="mx-auto h-6 w-6 text-[#3457D5]" />
                                  <p className="mt-1 text-sm text-gray-600">
                                    {directorIdFile ? directorIdFile.name : "Upload Director ID"}
                                  </p>
                                </div>
                                <input
                                  id="directorId"
                                  type="file"
                                  accept=".jpg,.jpeg,.png,.pdf"
                                  onChange={(e) => handleFileUpload(e, setDirectorIdFile)}
                                  className="hidden"
                                />
                              </label>
                              {directorIdFile && (
                                <div className="mt-2 flex items-center justify-between rounded-md border border-[#CCCCFF] bg-white p-2">
                                  <span className="text-sm text-gray-700">{directorIdFile.name}</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDirectorIdFile(null)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="cacCert">
                            Upload CAC Certificate <span className="text-destructive">*</span>
                          </Label>
                          <div className="mt-2">
                            <label
                              htmlFor="cacCert"
                              className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-[#CCCCFF] bg-[#CCCCFF]/10 p-6 transition-colors hover:border-[#3457D5] hover:bg-[#CCCCFF]/20"
                            >
                              <div className="text-center">
                                <Upload className="mx-auto h-8 w-8 text-[#3457D5]" />
                                <p className="mt-2 text-sm text-gray-600">
                                  {cacCertFile ? cacCertFile.name : "Click to upload CAC Certificate"}
                                </p>
                                <p className="mt-1 text-xs text-gray-500">PDF, DOC, DOCX (Max 10MB)</p>
                              </div>
                              <input
                                id="cacCert"
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={(e) => handleFileUpload(e, setCacCertFile)}
                                className="hidden"
                              />
                            </label>
                            {cacCertFile && (
                              <div className="mt-2 flex items-center justify-between rounded-md border border-[#CCCCFF] bg-white p-2">
                                <span className="text-sm text-gray-700">{cacCertFile.name}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setCacCertFile(null)}
                                  className="h-6 w-6 p-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="proofOfAddress">
                            Proof of Address (Business Premises) <span className="text-destructive">*</span>
                          </Label>
                          <div className="mt-2">
                            <label
                              htmlFor="proofOfAddress"
                              className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-[#CCCCFF] bg-[#CCCCFF]/10 p-6 transition-colors hover:border-[#3457D5] hover:bg-[#CCCCFF]/20"
                            >
                              <div className="text-center">
                                <Upload className="mx-auto h-8 w-8 text-[#3457D5]" />
                                <p className="mt-2 text-sm text-gray-600">
                                  {proofOfAddressFile ? proofOfAddressFile.name : "Click to upload Proof of Address"}
                                </p>
                                <p className="mt-1 text-xs text-gray-500">Utility bill, lease agreement (Max 10MB)</p>
                              </div>
                              <input
                                id="proofOfAddress"
                                type="file"
                                accept=".jpg,.jpeg,.png,.pdf"
                                onChange={(e) => handleFileUpload(e, setProofOfAddressFile)}
                                className="hidden"
                              />
                            </label>
                            {proofOfAddressFile && (
                              <div className="mt-2 flex items-center justify-between rounded-md border border-[#CCCCFF] bg-white p-2">
                                <span className="text-sm text-gray-700">{proofOfAddressFile.name}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setProofOfAddressFile(null)}
                                  className="h-6 w-6 p-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="businessNature">
                            Nature or Sector of Business <span className="text-destructive">*</span>
                          </Label>
                          <Textarea
                            id="businessNature"
                            value={businessForm.businessNature}
                            onChange={(e) => handleBusinessChange("businessNature", e.target.value)}
                            placeholder="Describe your business sector and activities"
                            className="mt-2 min-h-[80px] border-[#CCCCFF] focus:border-[#3457D5]"
                          />
                        </div>
                      </>
                    )}

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
                      disabled={isProcessing}
                      className="w-full bg-[#3457D5] py-6 text-base font-semibold text-white hover:bg-[#3457D5]/90"
                    >
                      {isProcessing ? "Submitting..." : "Submit Registration"}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="space-y-6"
          >
            <Card className="border-[#CCCCFF]/30">
              <CardHeader className="bg-gradient-to-r from-[#3457D5]/5 to-[#CCCCFF]/10">
                <CardTitle className="text-[#3457D5]">Service Price</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {priceLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-32" />
                  </div>
                ) : (
                  <div className="rounded-lg border border-[#3457D5]/30 bg-[#CCCCFF]/20 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Total Price:</span>
                      {priceLoading ? (
                        <Skeleton className="h-8 w-40" />
                      ) : servicePrice != null ? (
                        <span className="text-2xl font-bold text-[#3457D5]">₦{Number(servicePrice).toLocaleString()}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Price unavailable</span>
                      )}
                      {priceError && (
                        <p className="mt-2 text-xs text-red-600">Failed to load price. You can still submit.</p>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-gray-600">
                      {applicantType === "Individual" ? "Individual" : "Business"} registration fee
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-[#CCCCFF]/30">
              <CardHeader className="bg-gradient-to-r from-[#3457D5]/5 to-[#CCCCFF]/10">
                <CardTitle className="text-[#3457D5]">Required Documents</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-2 text-sm text-gray-600">
                  {applicantType === "Individual" ? (
                    <>
                      <p className="flex items-start">
                        <span className="mr-2 text-[#3457D5]">•</span>
                        <span>Valid government-issued ID</span>
                      </p>
                      <p className="flex items-start">
                        <span className="mr-2 text-[#3457D5]">•</span>
                        <span>NIN or BVN (11 digits)</span>
                      </p>
                      <p className="flex items-start">
                        <span className="mr-2 text-[#3457D5]">•</span>
                        <span>Proof of residential address</span>
                      </p>
                      <p className="flex items-start">
                        <span className="mr-2 text-[#3457D5]">•</span>
                        <span>Valid email and phone number</span>
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="flex items-start">
                        <span className="mr-2 text-[#3457D5]">•</span>
                        <span>CAC registration certificate</span>
                      </p>
                      <p className="flex items-start">
                        <span className="mr-2 text-[#3457D5]">•</span>
                        <span>Director's valid ID and NIN/BVN</span>
                      </p>
                      <p className="flex items-start">
                        <span className="mr-2 text-[#3457D5]">•</span>
                        <span>Proof of business address</span>
                      </p>
                      <p className="flex items-start">
                        <span className="mr-2 text-[#3457D5]">•</span>
                        <span>Business contact information</span>
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#CCCCFF]/30">
              <CardHeader className="bg-gradient-to-r from-[#3457D5]/5 to-[#CCCCFF]/10">
                <CardTitle className="text-[#3457D5]">Processing Timeline</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="mr-2 text-[#3457D5]">•</span>
                    <span>Application submission: Instant</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-[#3457D5]">•</span>
                    <span>Document verification: 1-2 business days</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-[#3457D5]">•</span>
                    <span>JTB processing: 5-10 business days</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-[#3457D5]">•</span>
                    <span>TIN certificate delivery: 1-2 business days</span>
                  </li>
                </ul>
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
                    <span>All information must be accurate and verifiable</span>
                  </p>
                  <p className="flex items-start">
                    <span className="mr-2 text-[#3457D5]">•</span>
                    <span>Documents must be clear and legible</span>
                  </p>
                  <p className="flex items-start">
                    <span className="mr-2 text-[#3457D5]">•</span>
                    <span>Keep your reference ID for tracking</span>
                  </p>
                  <p className="flex items-start">
                    <span className="mr-2 text-[#3457D5]">•</span>
                    <span>Contact support for any issues</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      <KYCRequiredModal open={showKYCModal} onOpenChange={setShowKYCModal} />
    </div>
  )
}
