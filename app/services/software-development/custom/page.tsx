"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Upload, Lightbulb, Loader2, CheckCircle2 } from "lucide-react"
import useDynamicPricing from "@/hooks/useDynamicPricing"
import { PinPrompt } from "@/components/PinPrompt"
import { handleServiceError } from "@/lib/service-utils"

export default function CustomSolutionDevelopmentPage() {
  const [servicePrice, setServicePrice] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPinPromptOpen, setIsPinPromptOpen] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<any>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    projectTitle: "",
    problemDescription: "",
    solutionType: "",
    featureList: "",
    techPreference: "",
    budgetRange: "",
    deliveryTimeframe: "",
    deliveryOption: "",
    additionalNotes: "",
  })

  // Dynamic pricing: category=software-development, subservice=custom, variant=selected solutionType
  const variantSlug = formData.solutionType || ""
  const sdParams: Record<string, string | number | boolean> = {}
  if (formData.deliveryTimeframe) sdParams.deliveryTimeframe = formData.deliveryTimeframe
  const { price: dynPrice, isLoading: priceLoading, error: priceError, submitService } = useDynamicPricing(
    "software-development",
    "custom",
    variantSlug,
    sdParams,
  )

  useEffect(() => {
    if (typeof dynPrice === "number") setServicePrice(Number(dynPrice))
    else if (!priceLoading && dynPrice == null) setServicePrice(0)
  }, [dynPrice, priceLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setPendingPayload({
      amount: Number(servicePrice || 0),
      idempotencyKey: crypto.randomUUID(),
      params: {
        ...formData
      },
      category: "software-development",
      action: "custom"
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

      console.log("Software Development Request submitted:", { reference: resp.reference })
      setIsSuccess(true)

      setTimeout(() => {
        setIsSuccess(false)
        setFormData({
          projectTitle: "",
          problemDescription: "",
          solutionType: "",
          featureList: "",
          techPreference: "",
          budgetRange: "",
          deliveryTimeframe: "",
          deliveryOption: "",
          additionalNotes: "",
        })
      }, 5000)
    } catch (err: any) {
      toast({ title: "Submission Error", description: String(err?.message || err), variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center space-y-6 text-center"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-foreground">Request Submitted!</h2>
          <p className="text-muted-foreground">
            Your custom solution development request has been received. Our team will review it and contact you within
            24 hours.
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9F7F3] py-12">
      <div className="container mx-auto max-w-6xl px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold text-[#3457D5]">Custom Solution Development</h1>
          <p className="text-lg text-muted-foreground">
            Tailored software solutions designed specifically for your unique business needs
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#CCCCFF] px-6 py-2">
            <span className="text-sm font-medium text-[#3457D5]">Starting from</span>
            <span className="text-2xl font-bold text-[#3457D5]">₦{servicePrice.toLocaleString()}</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Price adapts based on solution type and delivery timeframe.
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-2 border-[#CCCCFF]">
              <CardHeader>
                <CardTitle className="text-[#3457D5]">Project Details</CardTitle>
                <CardDescription>Tell us about your custom solution requirements</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="projectTitle">Project Title *</Label>
                    <Input
                      id="projectTitle"
                      placeholder="e.g., Automated Inventory Management System"
                      value={formData.projectTitle}
                      onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })}
                      required
                      className="border-[#CCCCFF] focus:border-[#3457D5]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="problemDescription">Problem Description *</Label>
                    <Textarea
                      id="problemDescription"
                      placeholder="Describe the problem or challenge you're facing that needs a custom solution..."
                      value={formData.problemDescription}
                      onChange={(e) => setFormData({ ...formData, problemDescription: e.target.value })}
                      required
                      rows={4}
                      className="border-[#CCCCFF] focus:border-[#3457D5]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="solutionType">Solution Type *</Label>
                    <Select
                      value={formData.solutionType}
                      onValueChange={(value) => setFormData({ ...formData, solutionType: value })}
                    >
                      <SelectTrigger className="border-[#CCCCFF] focus:border-[#3457D5]">
                        <SelectValue placeholder="Select solution type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="automation-tool">Automation Tool</SelectItem>
                        <SelectItem value="crm">CRM System</SelectItem>
                        <SelectItem value="erp">ERP Solution</SelectItem>
                        <SelectItem value="api-integration">API Integration</SelectItem>
                        <SelectItem value="ai-ml">AI/ML Solution</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="featureList">Feature List *</Label>
                    <Textarea
                      id="featureList"
                      placeholder="List the key features and functionalities you need..."
                      value={formData.featureList}
                      onChange={(e) => setFormData({ ...formData, featureList: e.target.value })}
                      required
                      rows={4}
                      className="border-[#CCCCFF] focus:border-[#3457D5]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="techPreference">Tech Preference</Label>
                    <Input
                      id="techPreference"
                      placeholder="Any specific technology requirements? (optional)"
                      value={formData.techPreference}
                      onChange={(e) => setFormData({ ...formData, techPreference: e.target.value })}
                      className="border-[#CCCCFF] focus:border-[#3457D5]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budgetRange">Budget Range *</Label>
                    <Select
                      value={formData.budgetRange}
                      onValueChange={(value) => setFormData({ ...formData, budgetRange: value })}
                    >
                      <SelectTrigger className="border-[#CCCCFF] focus:border-[#3457D5]">
                        <SelectValue placeholder="Select your budget range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="50k-100k">₦50,000 - ₦100,000</SelectItem>
                        <SelectItem value="100k-250k">₦100,000 - ₦250,000</SelectItem>
                        <SelectItem value="250k-500k">₦250,000 - ₦500,000</SelectItem>
                        <SelectItem value="500k+">₦500,000+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deliveryTimeframe">Delivery Timeframe *</Label>
                    <Select
                      value={formData.deliveryTimeframe}
                      onValueChange={(value) => setFormData({ ...formData, deliveryTimeframe: value })}
                    >
                      <SelectTrigger className="border-[#CCCCFF] focus:border-[#3457D5]">
                        <SelectValue placeholder="Select delivery timeframe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-2-weeks">1-2 Weeks</SelectItem>
                        <SelectItem value="1-month">1 Month</SelectItem>
                        <SelectItem value="2-months">2+ Months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deliveryOption">Delivery Option *</Label>
                    <Select
                      value={formData.deliveryOption}
                      onValueChange={(value) => setFormData({ ...formData, deliveryOption: value })}
                    >
                      <SelectTrigger className="border-[#CCCCFF] focus:border-[#3457D5]">
                        <SelectValue placeholder="Select delivery option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="express">Express</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="additionalNotes">Additional Notes</Label>
                    <Textarea
                      id="additionalNotes"
                      placeholder="Any other information you'd like to share..."
                      value={formData.additionalNotes}
                      onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                      rows={3}
                      className="border-[#CCCCFF] focus:border-[#3457D5]"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#3457D5] text-white hover:bg-[#2a46b0]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting Request...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Submit Request
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            <Card className="border-2 border-[#CCCCFF] bg-gradient-to-br from-[#3457D5] to-[#2a46b0] text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-6 w-6" />
                  Custom Solutions We Build
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Business Automation</h3>
                  <p className="text-sm text-white/90">Streamline operations with custom automation tools</p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">System Integration</h3>
                  <p className="text-sm text-white/90">Connect your existing systems seamlessly</p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">AI & Machine Learning</h3>
                  <p className="text-sm text-white/90">Intelligent solutions powered by AI</p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Custom APIs</h3>
                  <p className="text-sm text-white/90">Build powerful APIs for your business</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-[#CCCCFF]">
              <CardHeader>
                <CardTitle className="text-[#3457D5]">Our Approach</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#CCCCFF] text-sm font-bold text-[#3457D5]">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold">Discovery & Analysis</h4>
                    <p className="text-sm text-muted-foreground">Deep dive into your requirements and challenges</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#CCCCFF] text-sm font-bold text-[#3457D5]">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold">Solution Design</h4>
                    <p className="text-sm text-muted-foreground">Create a tailored solution architecture</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#CCCCFF] text-sm font-bold text-[#3457D5]">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold">Development & Testing</h4>
                    <p className="text-sm text-muted-foreground">Build and rigorously test your solution</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#CCCCFF] text-sm font-bold text-[#3457D5]">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold">Deployment & Training</h4>
                    <p className="text-sm text-muted-foreground">Launch and train your team</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-[#CCCCFF]">
              <CardHeader>
                <CardTitle className="text-[#3457D5]">Benefits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#3457D5]" />
                  <p className="text-sm">Tailored to your exact needs</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#3457D5]" />
                  <p className="text-sm">Scalable and future-proof</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#3457D5]" />
                  <p className="text-sm">Full ownership of the solution</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#3457D5]" />
                  <p className="text-sm">Ongoing support and maintenance</p>
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
