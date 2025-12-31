"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle2, AlertCircle, X } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { PinPrompt } from "@/components/PinPrompt"
import { handleServiceError } from "@/lib/service-utils"
import { useKYCCheck } from "@/hooks/use-kyc-check"
import { KYCRequiredModal } from "@/components/kyc-required-modal"
import useDynamicPricing from "@/hooks/useDynamicPricing"

type RegistrationMode = "BN" | "RC"

interface FormData {
  // Personal Information
  fullName: string
  dateOfBirth: string
  nationality: string
  idType: string
  idFile: File | null
  passportPhoto: File | null

  // Business Information
  businessName: string
  businessObjectives: string
  businessType: string
  businessAddress: string
  residenceAddress: string
  commencementDate: string

  // RC Mode specific
  rcNumber: string
  directors: Director[]
}

interface Director {
  id: string
  name: string
  dateOfBirth: string
  idType: string
  idFile: File | null
}

const RESTRICTED_WORDS = [
  "Federal",
  "National",
  "Government",
  "State",
  "Ministry",
  "Commission",
  "Authority",
  "Bank",
  "Insurance",
  "University",
]

const ID_TYPES = ["NIN", "Passport", "Driver's License", "Voter's Card"]

const BUSINESS_TYPES = [
  "Sole Proprietorship",
  "Partnership",
  "Limited Liability Company",
  "Public Limited Company",
  "NGO",
  "Incorporated Trustees",
]

export function CacRegistrationForm() {
  const { showKYCModal, setShowKYCModal, requireKYC } = useKYCCheck()

  const [mode, setMode] = useState<RegistrationMode>("BN")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null)
  const [checkingName, setCheckingName] = useState(false)
  const [isPinPromptOpen, setIsPinPromptOpen] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<any>(null)

  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    dateOfBirth: "",
    nationality: "Nigerian",
    idType: "",
    idFile: null,
    passportPhoto: null,
    businessName: "",
    businessObjectives: "",
    businessType: "",
    businessAddress: "",
    residenceAddress: "",
    commencementDate: "",
    rcNumber: "",
    directors: [],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Dynamic pricing via hook: category=cac, subservice=registration, variant=bn|rc, params include directorsCount and businessType
  const { price: servicePrice, isLoading: priceLoading, error: priceError, submitService } = useDynamicPricing(
    "cac",
    "registration",
    mode.toLowerCase(),
    {
      directorsCount: formData.directors.length,
      businessType: formData.businessType ? formData.businessType.toLowerCase() : "",
    },
  )

  // Check for restricted words
  const hasRestrictedWords = (name: string) => {
    return RESTRICTED_WORDS.some((word) => name.toLowerCase().includes(word.toLowerCase()))
  }

  // Check name availability (mock)
  const checkNameAvailability = async () => {
    if (!formData.businessName) return

    setCheckingName(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    // Mock result - randomly available or not
    setNameAvailable(Math.random() > 0.3)
    setCheckingName(false)
  }

  // Handle file upload
  const handleFileUpload = (field: keyof FormData, file: File | null) => {
    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "application/pdf"]
      if (!validTypes.includes(file.type)) {
        setErrors({ ...errors, [field]: "Only JPEG, PNG, or PDF files are allowed" })
        return
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, [field]: "File size must be less than 5MB" })
        return
      }
    }
    setFormData({ ...formData, [field]: file })
    setErrors({ ...errors, [field]: "" })
  }

  // Add director (RC mode)
  const addDirector = () => {
    setFormData({
      ...formData,
      directors: [
        ...formData.directors,
        {
          id: Date.now().toString(),
          name: "",
          dateOfBirth: "",
          idType: "",
          idFile: null,
        },
      ],
    })
  }

  // Remove director
  const removeDirector = (id: string) => {
    setFormData({
      ...formData,
      directors: formData.directors.filter((d) => d.id !== id),
    })
  }

  // Update director
  const updateDirector = (id: string, field: keyof Director, value: any) => {
    setFormData({
      ...formData,
      directors: formData.directors.map((d) => (d.id === id ? { ...d, [field]: value } : d)),
    })
  }

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName) newErrors.fullName = "Full name is required"
    if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required"
    if (!formData.nationality) newErrors.nationality = "Nationality is required"
    if (!formData.idType) newErrors.idType = "ID type is required"
    if (!formData.idFile) newErrors.idFile = "ID document is required"
    if (!formData.passportPhoto) newErrors.passportPhoto = "Passport photo is required"
    if (!formData.businessName) newErrors.businessName = "Business name is required"
    if (!formData.businessObjectives) newErrors.businessObjectives = "Business objectives are required"
    if (!formData.businessType) newErrors.businessType = "Business type is required"
    if (!formData.businessAddress) newErrors.businessAddress = "Business address is required"
    if (!formData.commencementDate) newErrors.commencementDate = "Commencement date is required"

    if (mode === "RC") {
      if (formData.directors.length === 0) {
        newErrors.directors = "At least one director is required for company registration"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!requireKYC()) {
      return
    }

    if (!validateForm()) {
      return
    }

    setPendingPayload({
      amount: Number(servicePrice),
      businessName: formData.businessName,
      businessObjectives: formData.businessObjectives,
      businessType: formData.businessType,
      businessAddress: formData.businessAddress,
      residenceAddress: formData.residenceAddress,
      commencementDate: formData.commencementDate,
      directors: formData.directors.map(d => ({
        name: d.name,
        dateOfBirth: d.dateOfBirth,
        idType: d.idType
      })),
      idType: formData.idType,
      rcNumber: formData.rcNumber,
      category: "cac",
      variant: mode.toLowerCase()
    })
    setIsPinPromptOpen(true)
  }

  const handlePinConfirm = async (pin: string) => {
    setIsPinPromptOpen(false)
    setIsSubmitting(true)
    try {
      const resp = await submitService({ ...pendingPayload, pin })

      if (!resp.ok) {
        handleServiceError(resp, null, "Submission failed")
        return
      }

      console.log("Form submitted:", { mode, formData: pendingPayload, reference: resp.reference })
      setIsSuccess(true)
    } catch (err: any) {
      setErrors({ submit: err.message || "An unexpected error occurred" })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Application Submitted Successfully!</h2>
            <p className="text-muted-foreground mb-6">
              Your CAC registration application has been submitted. We will process your request and contact you soon.
            </p>
            <Button onClick={() => setIsSuccess(false)}>Submit Another Application</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Registration Form</CardTitle>
          <CardDescription>Choose your registration type and fill in the required information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Mode Selection */}
            <Tabs value={mode} onValueChange={(value) => setMode(value as RegistrationMode)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="BN">Business Name (BN)</TabsTrigger>
                <TabsTrigger value="RC">Company Registration (RC)</TabsTrigger>
              </TabsList>

              <TabsContent value="BN" className="space-y-6 mt-6">
                <Alert>
                  <AlertDescription>
                    Business Name registration is suitable for sole proprietorships and partnerships.
                  </AlertDescription>
                </Alert>
              </TabsContent>

              <TabsContent value="RC" className="space-y-6 mt-6">
                <Alert>
                  <AlertDescription>
                    Company Registration (RC) is for Limited Liability Companies, PLCs, and Incorporated Trustees.
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>

            {/* Personal Information Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Personal Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    Full Name of Proprietor / Main Applicant <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Enter full name"
                    className={errors.fullName ? "border-destructive" : ""}
                  />
                  {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">
                    Date of Birth <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className={errors.dateOfBirth ? "border-destructive" : ""}
                  />
                  {errors.dateOfBirth && <p className="text-sm text-destructive">{errors.dateOfBirth}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nationality">
                    Nationality <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="nationality"
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    placeholder="Enter nationality"
                    className={errors.nationality ? "border-destructive" : ""}
                  />
                  {errors.nationality && <p className="text-sm text-destructive">{errors.nationality}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="idType">
                    Means of Identification <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.idType}
                    onValueChange={(value) => setFormData({ ...formData, idType: value })}
                  >
                    <SelectTrigger className={errors.idType ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select ID type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ID_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.idType && <p className="text-sm text-destructive">{errors.idType}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="idFile">
                    Upload ID Document <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="idFile"
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => handleFileUpload("idFile", e.target.files?.[0] || null)}
                      className={errors.idFile ? "border-destructive" : ""}
                    />
                    {formData.idFile && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Uploaded
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">JPEG, PNG, or PDF (max 5MB)</p>
                  {errors.idFile && <p className="text-sm text-destructive">{errors.idFile}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passportPhoto">
                    Passport Photo <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="passportPhoto"
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload("passportPhoto", e.target.files?.[0] || null)}
                      className={errors.passportPhoto ? "border-destructive" : ""}
                    />
                    {formData.passportPhoto && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Uploaded
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">JPEG or PNG (max 5MB)</p>
                  {errors.passportPhoto && <p className="text-sm text-destructive">{errors.passportPhoto}</p>}
                </div>
              </div>
            </div>

            {/* Business Information Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Business Information</h3>

              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="businessName">
                    Proposed Business / Company Name <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="businessName"
                      value={formData.businessName}
                      onChange={(e) => {
                        setFormData({ ...formData, businessName: e.target.value })
                        setNameAvailable(null)
                      }}
                      placeholder="Enter business name"
                      className={errors.businessName ? "border-destructive" : ""}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={checkNameAvailability}
                      disabled={!formData.businessName || checkingName}
                    >
                      {checkingName ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check"}
                    </Button>
                  </div>
                  {errors.businessName && <p className="text-sm text-destructive">{errors.businessName}</p>}
                  {nameAvailable === true && (
                    <Alert className="border-green-500 bg-green-50">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <AlertDescription className="text-green-700">Name is available!</AlertDescription>
                    </Alert>
                  )}
                  {nameAvailable === false && (
                    <Alert className="border-destructive bg-destructive/10">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <AlertDescription className="text-destructive">
                        Name is not available. Please try another name.
                      </AlertDescription>
                    </Alert>
                  )}
                  {hasRestrictedWords(formData.businessName) && (
                    <Alert className="border-yellow-500 bg-yellow-50">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-700">
                        This name contains restricted words that may require special approval from relevant authorities.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessObjectives">
                    Business Objectives / Line of Business <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="businessObjectives"
                    value={formData.businessObjectives}
                    onChange={(e) => setFormData({ ...formData, businessObjectives: e.target.value })}
                    placeholder="Describe your business objectives and activities"
                    rows={4}
                    className={errors.businessObjectives ? "border-destructive" : ""}
                  />
                  {errors.businessObjectives && <p className="text-sm text-destructive">{errors.businessObjectives}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="businessType">
                      Business Type / Structure <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.businessType}
                      onValueChange={(value) => setFormData({ ...formData, businessType: value })}
                    >
                      <SelectTrigger className={errors.businessType ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select business type" />
                      </SelectTrigger>
                      <SelectContent>
                        {BUSINESS_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.businessType && <p className="text-sm text-destructive">{errors.businessType}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="commencementDate">
                      Proposed Date of Commencement <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="commencementDate"
                      type="date"
                      value={formData.commencementDate}
                      onChange={(e) => setFormData({ ...formData, commencementDate: e.target.value })}
                      className={errors.commencementDate ? "border-destructive" : ""}
                    />
                    {errors.commencementDate && <p className="text-sm text-destructive">{errors.commencementDate}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessAddress">
                    Business Address <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="businessAddress"
                    value={formData.businessAddress}
                    onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                    placeholder="Enter complete business address"
                    rows={3}
                    className={errors.businessAddress ? "border-destructive" : ""}
                  />
                  {errors.businessAddress && <p className="text-sm text-destructive">{errors.businessAddress}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="residenceAddress">Residence / Proprietor Address</Label>
                  <Textarea
                    id="residenceAddress"
                    value={formData.residenceAddress}
                    onChange={(e) => setFormData({ ...formData, residenceAddress: e.target.value })}
                    placeholder="Enter residence address (if different from business address)"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* RC Mode - Additional Directors */}
            {mode === "RC" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-lg font-semibold text-foreground">Additional Directors</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addDirector}>
                    Add Director
                  </Button>
                </div>

                {errors.directors && <p className="text-sm text-destructive">{errors.directors}</p>}

                {formData.directors.map((director, index) => (
                  <Card key={director.id} className="bg-muted/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Director {index + 1}</CardTitle>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDirector(director.id)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Director Name</Label>
                          <Input
                            value={director.name}
                            onChange={(e) => updateDirector(director.id, "name", e.target.value)}
                            placeholder="Enter director name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Date of Birth</Label>
                          <Input
                            type="date"
                            value={director.dateOfBirth}
                            onChange={(e) => updateDirector(director.id, "dateOfBirth", e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>ID Type</Label>
                          <Select
                            value={director.idType}
                            onValueChange={(value) => updateDirector(director.id, "idType", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select ID type" />
                            </SelectTrigger>
                            <SelectContent>
                              {ID_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Upload ID Document</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="file"
                              accept=".jpg,.jpeg,.png,.pdf"
                              onChange={(e) => updateDirector(director.id, "idFile", e.target.files?.[0] || null)}
                            />
                            {director.idFile && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* RC Mode - RC Number */}
            {mode === "RC" && (
              <div className="space-y-2">
                <Label htmlFor="rcNumber">RC Number (if retrieving existing registration)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">RC</span>
                  <Input
                    id="rcNumber"
                    value={formData.rcNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 7)
                      setFormData({ ...formData, rcNumber: value })
                    }}
                    maxLength={7}
                    placeholder="Enter 7-digit number"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Enter 7 digits only (RC prefix is automatic)</p>
              </div>
            )}

            {/* BN Mode - BN Number */}
            {mode === "BN" && (
              <div className="space-y-2">
                <Label htmlFor="bnNumber">BN Number (if retrieving existing registration)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">BN</span>
                  <Input
                    id="bnNumber"
                    value={formData.rcNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 7)
                      setFormData({ ...formData, rcNumber: value })
                    }}
                    maxLength={7}
                    placeholder="Enter 7-digit number"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Enter 7 digits only (BN prefix is automatic)</p>
              </div>
            )}

            {/* Estimated Pricing */}
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Estimated Price</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Based on registration mode, business type and directors</span>
                  {priceLoading ? (
                    <span className="text-sm">Fetching price...</span>
                  ) : servicePrice != null ? (
                    <span className="text-xl font-bold text-primary">₦{Number(servicePrice).toLocaleString()}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </div>
                {priceError && (
                  <p className="mt-2 text-xs text-red-600">Failed to load price. You can still submit.</p>
                )}
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => window.history.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="min-w-[150px]">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>
            </div>
            {errors.submit && (
              <p className="text-sm text-red-600 text-right mt-2">{errors.submit}</p>
            )}
          </form>
        </CardContent>
      </Card>

      <KYCRequiredModal open={showKYCModal} onOpenChange={setShowKYCModal} />
      <PinPrompt
        isOpen={isPinPromptOpen}
        onClose={() => setIsPinPromptOpen(false)}
        onConfirm={handlePinConfirm}
        isLoading={isSubmitting}
      />
    </>
  )
}
