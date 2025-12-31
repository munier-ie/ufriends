"use client"

import type React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import useDynamicPricing from "@/hooks/useDynamicPricing"
import { authFetch } from "@/lib/client-auth"
import { PinPrompt } from "@/components/PinPrompt"
import { handleServiceError } from "@/lib/service-utils"
import { CheckCircle2, Upload, TrendingUp } from "lucide-react"

type Provider = "Opay" | "Moniepoint" | "FCMB" | "Nomba" | "Other"

const providerPrices: Record<Provider, number> = {
  Opay: 15000,
  Moniepoint: 18000,
  FCMB: 20000,
  Nomba: 17000,
  Other: 0,
}

export default function POSRequestPage() {
  const { toast } = useToast()
  const [selectedProvider, setSelectedProvider] = useState<Provider | "">("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPinPromptOpen, setIsPinPromptOpen] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<any>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    bvn: "",
    businessName: "",
    businessAddress: "",
    state: "",
    lga: "",
    posType: "",
    businessType: "",
    nearestOffice: "",
    deliveryOption: "",
    brandName: "",
  })
  const [documents, setDocuments] = useState({
    validId: null as File | null,
    utilityBill: null as File | null,
    cacCertificate: null as File | null,
    passportPhoto: null as File | null,
  })

  // Dynamic pricing for POS Request based on provider (variant) and POS type / delivery option (parameters)
  const dynParams: Record<string, string | number | boolean> = {}
  if (formData.posType) dynParams.posType = formData.posType.toLowerCase()
  if (formData.deliveryOption) dynParams.deliveryOption = formData.deliveryOption.toLowerCase()
  const { price: dynamicPrice, isLoading: priceLoading, error: priceError, submitService } = useDynamicPricing(
    "agency-banking",
    "pos-request",
    selectedProvider ? selectedProvider.toLowerCase() : "",
    dynParams,
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedProvider) {
      toast({
        title: "Error",
        description: "Please select a POS provider",
        variant: "destructive",
      })
      return
    }

    if (!documents.validId || !documents.utilityBill) {
      toast({
        title: "Error",
        description: "Please upload all required documents",
        variant: "destructive",
      })
      return
    }

    setPendingPayload({
      amount: Number(dynamicPrice || providerPrices[selectedProvider]),
      idempotencyKey: crypto.randomUUID(),
      params: {
        provider: selectedProvider,
        formData,
        documents: {
          hasValidId: !!documents.validId,
          hasUtilityBill: !!documents.utilityBill,
          hasCacCertificate: !!documents.cacCertificate,
          hasPassportPhoto: !!documents.passportPhoto,
        }
      },
      category: "agency-banking",
      action: "pos-request"
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

      console.log("POS Request submitted:", { selectedProvider: pendingPayload.params.provider, reference: resp.reference })
      setIsSuccess(true)
      toast({
        title: "Request Submitted",
        description: "Your POS request has been submitted successfully",
      })
    } catch (err: any) {
      toast({ title: "Submission Error", description: String(err?.message || err), variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderProviderFields = () => {
    if (!selectedProvider) return null

    const commonFields = (
      <>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bvn">Bank Verification Number (BVN) *</Label>
          <Input
            id="bvn"
            value={formData.bvn}
            onChange={(e) => setFormData({ ...formData, bvn: e.target.value })}
            maxLength={11}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessName">Business Name *</Label>
          <Input
            id="businessName"
            value={formData.businessName}
            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessAddress">Business Address *</Label>
          <Input
            id="businessAddress"
            value={formData.businessAddress}
            onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
            required
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="state">State *</Label>
            <Input
              id="state"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lga">LGA *</Label>
            <Input
              id="lga"
              value={formData.lga}
              onChange={(e) => setFormData({ ...formData, lga: e.target.value })}
              required
            />
          </div>
        </div>
      </>
    )

    const providerSpecificFields: Record<Provider, React.ReactElement> = {
      Opay: (
        <>
          <div className="space-y-2">
            <Label htmlFor="posType">POS Type *</Label>
            <Select value={formData.posType} onValueChange={(value) => setFormData({ ...formData, posType: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select POS type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mini">Mini</SelectItem>
                <SelectItem value="Traditional">Traditional</SelectItem>
                <SelectItem value="Android">Android</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deliveryOption">Delivery Option *</Label>
            <Select
              value={formData.deliveryOption}
              onValueChange={(value) => setFormData({ ...formData, deliveryOption: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select delivery option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pickup">Pickup</SelectItem>
                <SelectItem value="Delivery">Delivery</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      ),
      Moniepoint: (
        <>
          <div className="space-y-2">
            <Label htmlFor="businessType">Type of Business *</Label>
            <Input
              id="businessType"
              value={formData.businessType}
              onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="posType">POS Type *</Label>
            <Select value={formData.posType} onValueChange={(value) => setFormData({ ...formData, posType: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select POS type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Android">Android</SelectItem>
                <SelectItem value="Traditional">Traditional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nearestOffice">Nearest Moniepoint Office *</Label>
            <Input
              id="nearestOffice"
              value={formData.nearestOffice}
              onChange={(e) => setFormData({ ...formData, nearestOffice: e.target.value })}
              required
            />
          </div>
        </>
      ),
      FCMB: (
        <>
          <div className="space-y-2">
            <Label htmlFor="posType">Type of POS *</Label>
            <Select value={formData.posType} onValueChange={(value) => setFormData({ ...formData, posType: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select POS type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Wired">Wired</SelectItem>
                <SelectItem value="Wireless">Wireless</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      ),
      Nomba: (
        <>
          <div className="space-y-2">
            <Label htmlFor="businessType">Business Category *</Label>
            <Select
              value={formData.businessType}
              onValueChange={(value) => setFormData({ ...formData, businessType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Retail">Retail</SelectItem>
                <SelectItem value="Agent">Agent</SelectItem>
                <SelectItem value="Vendor">Vendor</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="posType">POS Type *</Label>
            <Select value={formData.posType} onValueChange={(value) => setFormData({ ...formData, posType: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select POS type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Nomba Lite">Nomba Lite</SelectItem>
                <SelectItem value="Nomba Pro">Nomba Pro</SelectItem>
                <SelectItem value="Android">Android</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      ),
      Other: (
        <>
          <div className="space-y-2">
            <Label htmlFor="brandName">Brand Name *</Label>
            <Input
              id="brandName"
              value={formData.brandName}
              onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
              placeholder="Enter POS brand name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="posType">POS Type *</Label>
            <Input
              id="posType"
              value={formData.posType}
              onChange={(e) => setFormData({ ...formData, posType: e.target.value })}
              required
            />
          </div>
        </>
      ),
    }

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        {commonFields}
        {providerSpecificFields[selectedProvider]}

        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-semibold text-gray-900">Required Documents</h3>

          <div className="space-y-2">
            <Label htmlFor="validId">Valid ID (NIN, Voter's Card, or Driver's License) *</Label>
            <Input
              id="validId"
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setDocuments({ ...documents, validId: e.target.files?.[0] || null })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="utilityBill">Utility Bill or Proof of Business *</Label>
            <Input
              id="utilityBill"
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setDocuments({ ...documents, utilityBill: e.target.files?.[0] || null })}
              required
            />
          </div>

          {selectedProvider === "FCMB" && (
            <div className="space-y-2">
              <Label htmlFor="passportPhoto">Passport Photograph *</Label>
              <Input
                id="passportPhoto"
                type="file"
                accept="image/*"
                onChange={(e) => setDocuments({ ...documents, passportPhoto: e.target.files?.[0] || null })}
                required
              />
            </div>
          )}

          {(selectedProvider === "Moniepoint" || selectedProvider === "FCMB") && (
            <div className="space-y-2">
              <Label htmlFor="cacCertificate">CAC Certificate (Optional but encouraged)</Label>
              <Input
                id="cacCertificate"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setDocuments({ ...documents, cacCertificate: e.target.files?.[0] || null })}
              />
            </div>
          )}
        </div>

        {selectedProvider && (
          <div className="p-4 bg-[#CCCCFF]/20 border border-[#3457D5]/20 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-medium">Service Cost:</span>
              {priceLoading ? (
                <span className="text-sm">Fetching price...</span>
              ) : dynamicPrice != null ? (
                <span className="text-2xl font-bold text-[#3457D5]">₦{Number(dynamicPrice).toLocaleString()}</span>
              ) : providerPrices[selectedProvider] > 0 ? (
                <span className="text-2xl font-bold text-[#3457D5]">₦{providerPrices[selectedProvider].toLocaleString()}</span>
              ) : (
                <span className="text-sm text-gray-600">—</span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">Price adapts to provider, POS type, and delivery option</p>
            {priceError && (
              <p className="text-xs text-red-600 mt-1">Failed to load price. You can still submit.</p>
            )}
          </div>
        )}

        <Button type="submit" className="w-full bg-[#3457D5] hover:bg-[#2a46b0]" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit POS Request"}
        </Button>
      </motion.div>
    )
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#F9F7F3] flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Request Submitted!</h2>
          <p className="text-gray-600 mb-8">
            Your POS request has been submitted successfully. Our team will review your application and contact you
            within 24-48 hours.
          </p>
          <Button onClick={() => setIsSuccess(false)} className="bg-[#3457D5] hover:bg-[#2a46b0]">
            Submit Another Request
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9F7F3] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">POS Terminal Request</h1>
          <p className="text-gray-600">
            Apply for discounted POS terminals from multiple providers and start your agency banking business.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Request POS Terminal</CardTitle>
                <CardDescription>Select your preferred provider and fill out the application form</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="provider">Select POS Provider *</Label>
                    <Select
                      value={selectedProvider}
                      onValueChange={(value: Provider) => {
                        setSelectedProvider(value)
                        setFormData({
                          fullName: "",
                          phone: "",
                          email: "",
                          bvn: "",
                          businessName: "",
                          businessAddress: "",
                          state: "",
                          lga: "",
                          posType: "",
                          businessType: "",
                          nearestOffice: "",
                          deliveryOption: "",
                          brandName: "",
                        })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Opay">Opay</SelectItem>
                        <SelectItem value="Moniepoint">Moniepoint</SelectItem>
                        <SelectItem value="FCMB">FCMB</SelectItem>
                        <SelectItem value="Nomba">Nomba</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <AnimatePresence mode="wait">{renderProviderFields()}</AnimatePresence>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Info Sidebar */}
          <div className="space-y-4">
            <Card className="bg-[#CCCCFF]/20 border-[#3457D5]/20">
              <CardHeader>
                <CardTitle className="text-[#3457D5] flex items-center gap-2">
                  <motion.div className="w-5 h-5">
                    <TrendingUp />
                  </motion.div>
                  Earning Potential
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <motion.div className="w-4 h-4 text-[#3457D5] mt-0.5 flex-shrink-0">
                    <CheckCircle2 />
                  </motion.div>
                  <span>Earn ₦100-₦200 per withdrawal transaction</span>
                </div>
                <div className="flex items-start gap-2">
                  <motion.div className="w-4 h-4 text-[#3457D5] mt-0.5 flex-shrink-0">
                    <CheckCircle2 />
                  </motion.div>
                  <span>2-4% commission on airtime sales</span>
                </div>
                <div className="flex items-start gap-2">
                  <motion.div className="w-4 h-4 text-[#3457D5] mt-0.5 flex-shrink-0">
                    <CheckCircle2 />
                  </motion.div>
                  <span>1-3% on bill payments</span>
                </div>
                <div className="flex items-start gap-2">
                  <motion.div className="w-4 h-4 text-[#3457D5] mt-0.5 flex-shrink-0">
                    <CheckCircle2 />
                  </motion.div>
                  <span>Unlimited earning potential</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Provider Comparison</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-medium">Opay</span>
                  <span className="text-[#3457D5] font-semibold">₦15,000</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-medium">Moniepoint</span>
                  <span className="text-[#3457D5] font-semibold">₦18,000</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-medium">FCMB</span>
                  <span className="text-[#3457D5] font-semibold">₦20,000</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-medium">Nomba</span>
                  <span className="text-[#3457D5] font-semibold">₦17,000</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <motion.div className="w-4 h-4">
                    <Upload />
                  </motion.div>
                  Required Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#3457D5] rounded-full" />
                  <span>Valid ID (NIN/Voter's Card/Driver's License)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#3457D5] rounded-full" />
                  <span>Utility Bill or Proof of Business</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#3457D5] rounded-full" />
                  <span>Passport Photograph (for some providers)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#3457D5] rounded-full" />
                  <span>CAC Certificate (optional)</span>
                </div>
              </CardContent>
            </Card>
          </div>
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
