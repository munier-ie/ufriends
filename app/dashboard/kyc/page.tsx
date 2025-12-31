"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldCheck, ArrowRight, ArrowLeft, CheckCircle2, Info } from "lucide-react"
import { CameraCapture } from "@/components/kyc/camera-capture"
import { toast } from "sonner"
import { authFetch } from "@/lib/client-auth"

type VerificationType = "BVN" | "NIN" | "PASSPORT" | "VOTER_ID" | "DRIVER_LICENSE" | "OTHER" | null
type Step = 1 | 2 | 3 | 4 | 5

export default function KYCVerificationPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [verificationType, setVerificationType] = useState<VerificationType>(null)
  const [idNumber, setIdNumber] = useState("")
  const [selfieImage, setSelfieImage] = useState<string>("")
  const [errors, setErrors] = useState<{ idNumber?: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateIdNumber = () => {
    if (!idNumber) {
      setErrors({ idNumber: `${verificationType} number is required` })
      return false
    }
    if (verificationType === "BVN" || verificationType === "NIN") {
      if (!/^\d{11}$/.test(idNumber)) {
        setErrors({ idNumber: `${verificationType} must be exactly 11 digits` })
        return false
      }
    } else if (idNumber.length < 5) {
      setErrors({ idNumber: `${verificationType} number is too short` })
      return false
    }
    setErrors({})
    return true
  }

  const handleNext = () => {
    if (currentStep === 1 && !verificationType) {
      toast.error("Please select a verification type")
      return
    }
    if (currentStep === 2 && !validateIdNumber()) {
      return
    }
    if (currentStep === 3 && !selfieImage) {
      toast.error("Please capture your selfie")
      return
    }
    setCurrentStep((prev) => Math.min(prev + 1, 5) as Step)
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1) as Step)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      const res = await authFetch("/api/kyc/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: verificationType,
          idNumber,
          selfieImage,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || "Submission failed")
      }

      toast.success("KYC verification submitted successfully!")
      router.push("/dashboard/kyc/pending")
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit KYC")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <ShieldCheck className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">KYC Verification</h1>
        <p className="text-muted-foreground">Complete your identity verification to access restricted services</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4, 5].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${step < currentStep
                ? "bg-primary text-primary-foreground"
                : step === currentStep
                  ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                  : "bg-muted text-muted-foreground"
                }`}
            >
              {step < currentStep ? <CheckCircle2 className="h-4 w-4" /> : step}
            </div>
            {step < 5 && <div className={`w-8 h-1 ${step < currentStep ? "bg-primary" : "bg-muted"}`} />}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>
                {currentStep === 1 && "Choose Verification Type"}
                {currentStep === 2 && `Enter Your ${verificationType} Number`}
                {currentStep === 3 && "Capture Live Photo"}
                {currentStep === 4 && "Confirm Your Information"}
                {currentStep === 5 && "Review & Submit"}
              </CardTitle>
              <CardDescription>
                {currentStep === 1 && "Select how you'd like to verify your identity"}
                {currentStep === 2 && "Ensure this matches your legal details"}
                {currentStep === 3 && "We'll guide you through a liveness check"}
                {currentStep === 4 && "Please review your information carefully"}
                {currentStep === 5 && "Final step before submission"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Choose Verification Type */}
              {currentStep === 1 && (
                <RadioGroup
                  value={verificationType || ""}
                  onValueChange={(value) => setVerificationType(value as VerificationType)}
                >
                  <div className="space-y-3">
                    <div
                      className={`flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer transition-all ${verificationType === "BVN"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                        }`}
                      onClick={() => setVerificationType("BVN")}
                    >
                      <RadioGroupItem value="BVN" id="bvn" />
                      <Label htmlFor="bvn" className="flex-1 cursor-pointer">
                        <div className="font-medium">BVN Verification</div>
                        <div className="text-sm text-muted-foreground">Bank Verification Number</div>
                      </Label>
                    </div>

                    <div
                      className={`flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer transition-all ${verificationType === "NIN"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                        }`}
                      onClick={() => setVerificationType("NIN")}
                    >
                      <RadioGroupItem value="NIN" id="nin" />
                      <Label htmlFor="nin" className="flex-1 cursor-pointer">
                        <div className="font-medium">NIN Verification</div>
                        <div className="text-sm text-muted-foreground">National Identification Number</div>
                      </Label>
                    </div>

                    <div
                      className={`flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer transition-all ${verificationType === "PASSPORT"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                        }`}
                      onClick={() => setVerificationType("PASSPORT")}
                    >
                      <RadioGroupItem value="PASSPORT" id="passport" />
                      <Label htmlFor="passport" className="flex-1 cursor-pointer">
                        <div className="font-medium">International Passport</div>
                        <div className="text-sm text-muted-foreground">Valid Nigerian passport</div>
                      </Label>
                    </div>

                    <div
                      className={`flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer transition-all ${verificationType === "VOTER_ID"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                        }`}
                      onClick={() => setVerificationType("VOTER_ID")}
                    >
                      <RadioGroupItem value="VOTER_ID" id="voter_id" />
                      <Label htmlFor="voter_id" className="flex-1 cursor-pointer">
                        <div className="font-medium">Voter's Card (VIN)</div>
                        <div className="text-sm text-muted-foreground">Voter Identification Number</div>
                      </Label>
                    </div>

                    <div
                      className={`flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer transition-all ${verificationType === "DRIVER_LICENSE"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                        }`}
                      onClick={() => setVerificationType("DRIVER_LICENSE")}
                    >
                      <RadioGroupItem value="DRIVER_LICENSE" id="driver_license" />
                      <Label htmlFor="driver_license" className="flex-1 cursor-pointer">
                        <div className="font-medium">Driver's License</div>
                        <div className="text-sm text-muted-foreground">Valid FRSC Driver's License</div>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              )}

              {/* Step 2: Input Field */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="idNumber">
                      {verificationType} Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="idNumber"
                      type="text"
                      placeholder={`Enter ${verificationType} number`}
                      value={idNumber}
                      onChange={(e) => {
                        const val = e.target.value
                        const value = (verificationType === "BVN" || verificationType === "NIN")
                          ? val.replace(/\D/g, "").slice(0, 11)
                          : val.toUpperCase().trim()
                        setIdNumber(value)
                        if (errors.idNumber) setErrors({})
                      }}
                      className={errors.idNumber ? "border-destructive" : ""}
                    />
                    {errors.idNumber && <p className="text-sm text-destructive">{errors.idNumber}</p>}
                    <p className="text-xs text-muted-foreground">
                      Ensure this {verificationType} matches your legal details.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: Capture Live Photo */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Your browser will request camera permission. Please allow access to continue with liveness verification.
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Position your face in the circle and follow the on-screen instructions for liveness verification.
                    </AlertDescription>
                  </Alert>
                  <CameraCapture onCapture={setSelfieImage} capturedImage={selfieImage} />
                </div>
              )}

              {/* Step 4: Confirmation */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Verification Type:</span>
                      <span className="text-sm font-medium">{verificationType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{verificationType} Number:</span>
                      <span className="text-sm font-medium font-mono">{idNumber}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Selfie Photo:</span>
                      <img
                        src={selfieImage || "/placeholder.svg"}
                        alt="Selfie preview"
                        className="h-16 w-16 rounded-full object-cover border-2 border-border"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Review & Submit */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <Alert className="border-primary/20 bg-primary/5">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-sm">
                      Your information is encrypted and processed in compliance with the Nigeria Data Protection Act
                      (NDPA 2023).
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-medium">Verification Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Type:</span>
                        <span className="text-sm font-medium">{verificationType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">ID Number:</span>
                        <span className="text-sm font-medium font-mono">{idNumber}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Photo:</span>
                        <img
                          src={selfieImage || "/placeholder.svg"}
                          alt="Selfie"
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 pt-4">
                {currentStep > 1 && (
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={isSubmitting}
                    className="flex-1 bg-transparent"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                )}

                {currentStep < 5 ? (
                  <Button onClick={handleNext} className="flex-1">
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Submit for Verification
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
