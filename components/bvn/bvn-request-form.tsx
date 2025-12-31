"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { validateBVNForm, type FormErrors } from "@/lib/bvn-validation"
import type { BVNRequest } from "@/lib/bvn-storage"
import Link from "next/link"
import useDynamicPricing from "@/hooks/useDynamicPricing"

interface BVNRequestFormProps {
  onSubmit: (data: any) => void
  onCancel: () => void
  initialData?: BVNRequest
  submitService: (params: any) => Promise<any>
  isSubmitting: boolean
}

export function BVNRequestForm({ onSubmit, onCancel, initialData, submitService, isSubmitting }: BVNRequestFormProps) {
  const [formData, setFormData] = useState({
    agentLocation: initialData?.agentLocation || "",
    bvn: initialData?.bvn || "",
    kegowAccountNo: initialData?.kegowAccountNo || "",
    accountName: initialData?.accountName || "",
    firstName: initialData?.firstName || "",
    lastName: initialData?.lastName || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    stateOfResidence: initialData?.stateOfResidence || "",
    address: initialData?.address || "",
    dob: initialData?.dob || "",
    lga: initialData?.lga || "",
    city: initialData?.city || "",
    addressState: initialData?.addressState || "",
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [consentChecked, setConsentChecked] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  const normalizedState = useMemo(() => {
    const s = String(formData.stateOfResidence || "").toLowerCase()
    return s.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "unknown"
  }, [formData.stateOfResidence])

  const { price: servicePrice, isLoading: priceLoading, error: priceError } = useDynamicPricing(
    "bvn",
    "android-license",
    "enrollment",
    { state: normalizedState },
  )

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validationErrors = validateBVNForm(formData)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    if (!consentChecked || !termsAccepted) {
      return
    }
    onSubmit(formData)
  }

  const formFields = [
    { name: "agentLocation", label: "Agent Location", type: "text" },
    { name: "bvn", label: "BVN (11 digits)", type: "text", maxLength: 11 },
    { name: "kegowAccountNo", label: "Kegow Account Number (10 digits)", type: "text", maxLength: 10 },
    { name: "accountName", label: "Account Name", type: "text" },
    { name: "firstName", label: "First Name", type: "text" },
    { name: "lastName", label: "Last Name", type: "text" },
    { name: "email", label: "Email Address", type: "email" },
    { name: "phone", label: "Phone Number (11 digits, starts with 0)", type: "tel", maxLength: 11 },
    { name: "stateOfResidence", label: "State of Residence", type: "text" },
    { name: "address", label: "Address", type: "text" },
    { name: "dob", label: "Date of Birth", type: "date" },
    { name: "lga", label: "LGA", type: "text" },
    { name: "city", label: "City", type: "text" },
    { name: "addressState", label: "Address State", type: "text" },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card>
        <CardHeader>
          <CardTitle>{initialData ? "Resubmit" : "New"} BVN Android License Request</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formFields.map((field) => (
                <div key={field.name} className={field.name === "address" ? "md:col-span-2" : ""}>
                  <Label htmlFor={field.name}>{field.label}</Label>
                  <Input
                    id={field.name}
                    type={field.type}
                    value={formData[field.name as keyof typeof formData]}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    maxLength={field.maxLength}
                    className={errors[field.name] ? "border-red-500" : ""}
                  />
                  {errors[field.name] && <p className="text-sm text-red-600 mt-1">{errors[field.name]}</p>}
                </div>
              ))}
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Estimated Enrollment Price</span>
                <span className="text-sm font-semibold text-gray-900">
                  {priceLoading ? "Loading..." : servicePrice != null ? `₦${servicePrice}` : "—"}
                </span>
              </div>
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="consent"
                  checked={consentChecked}
                  onCheckedChange={(checked) => setConsentChecked(checked === true)}
                  className="mt-1"
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
                  className="mt-1"
                />
                <Label htmlFor="terms" className="text-sm text-gray-700 cursor-pointer leading-relaxed">
                  I agree to the{" "}
                  <Link href="/terms" className="text-primary hover:text-primary/80 underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-primary hover:text-primary/80 underline">
                    Privacy Policy
                  </Link>
                </Label>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90"
                disabled={!consentChecked || !termsAccepted || isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
              {priceError && (
                <p className="text-xs text-red-600 mt-2">{String(priceError)}</p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
