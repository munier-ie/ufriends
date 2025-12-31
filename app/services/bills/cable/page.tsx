"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Tv, Wallet, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { authFetch } from "@/lib/client-auth"
import useDynamicPricing from "@/hooks/useDynamicPricing"
import { PinPrompt } from "@/components/PinPrompt"
import { handleServiceError } from "@/lib/service-utils"

// Cable TV plans data (names kept for display; prices now fetched live per tier)
const cablePlans = {
  dstv: [
    { id: "dstv-padi", name: "DStv Padi", price: 2500 },
    { id: "dstv-yanga", name: "DStv Yanga", price: 3500 },
    { id: "dstv-confam", name: "DStv Confam", price: 6200 },
    { id: "dstv-compact", name: "DStv Compact", price: 10500 },
    { id: "dstv-compact-plus", name: "DStv Compact Plus", price: 16600 },
    { id: "dstv-premium", name: "DStv Premium", price: 24500 },
  ],
  gotv: [
    { id: "gotv-smallie", name: "GOtv Smallie", price: 1300 },
    { id: "gotv-jinja", name: "GOtv Jinja", price: 2700 },
    { id: "gotv-jolli", name: "GOtv Jolli", price: 3950 },
    { id: "gotv-max", name: "GOtv Max", price: 5700 },
    { id: "gotv-supa", name: "GOtv Supa", price: 7600 },
  ],
  startimes: [
    { id: "startimes-nova", name: "Nova", price: 1200 },
    { id: "startimes-basic", name: "Basic", price: 2200 },
    { id: "startimes-smart", name: "Smart", price: 3000 },
    { id: "startimes-classic", name: "Classic", price: 3600 },
    { id: "startimes-super", name: "Super", price: 5500 },
  ],
}

export default function CablePage() {
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [walletBalance, setWalletBalance] = useState(0)
  const [provider, setProvider] = useState("")
  const [smartcardNumber, setSmartcardNumber] = useState("")
  const [selectedPlan, setSelectedPlan] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [transactionId, setTransactionId] = useState("")
  const { toast } = useToast()
  const [isMarketer, setIsMarketer] = useState(false)
  const [planPrices, setPlanPrices] = useState<Record<string, number>>({})
  const [pricingLoading, setPricingLoading] = useState(false)

  const [isPinPromptOpen, setIsPinPromptOpen] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<any>(null)

  const { price: hookPrice, isLoading: hookLoading, submitService } = useDynamicPricing(
    "bills",
    "cable",
    selectedPlan,
  )

  // Load wallet balance
  useEffect(() => {
    const timer = setTimeout(() => {
      const balance = localStorage.getItem("ufriends_wallet_balance")
      setWalletBalance(balance ? Number.parseFloat(balance) : 50000)
      setLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  // Determine user role to decide pricing tier
  useEffect(() => {
    const loadRole = async () => {
      try {
        const res = await authFetch("/api/me")
        const data = res.ok ? await res.json() : null
        setIsMarketer((data?.user?.role || "") === "MARKETER")
      } catch {
        setIsMarketer(false)
      }
    }
    loadRole()
  }, [])

  // Map plan id to pricing slug
  const toSlug = (prov: string, planId: string) => {
    const normalize = (s: string) => s.replace(/[^a-z0-9]+/gi, ".").replace(/\.+/g, ".").replace(/^\.|\.$/g, "").toLowerCase()
    // Extract terminal token (e.g., padi, compact.plus, premium)
    const tail = planId.replace(/^dstv-|^gotv-|^startimes-/, "")
    return `bills.cable.${normalize(prov)}.${normalize(tail)}`
  }

  // Fetch prices for available plans when provider changes or tier flips
  useEffect(() => {
    const fetchPrices = async () => {
      if (!provider) {
        setPlanPrices({})
        return
      }
      try {
        setPricingLoading(true)
        const tier = isMarketer ? "marketer" : "user"
        const plans = cablePlans[provider as keyof typeof cablePlans] || []
        const slugs = plans.map((p) => toSlug(provider, p.id))
        const results = await Promise.all(
          slugs.map(async (slug) => {
            const res = await fetch(`/api/pricing?serviceSlug=${encodeURIComponent(slug)}&tier=${tier}`)
            const data = await res.json().catch(() => null)
            const price = res.ok && data?.price?.price != null ? Number(data.price.price) : null
            return { slug, price }
          }),
        )
        const byPlan: Record<string, number> = {}
        for (const plan of plans) {
          const slug = toSlug(provider, plan.id)
          const found = results.find((r) => r.slug === slug)
          byPlan[plan.id] = found?.price ?? plan.price // fallback to UI default if DB missing
        }
        setPlanPrices(byPlan)
      } catch {
        // fallback to UI defaults if pricing fetch fails
        const plans = cablePlans[provider as keyof typeof cablePlans] || []
        const byPlan: Record<string, number> = {}
        for (const plan of plans) byPlan[plan.id] = plan.price
        setPlanPrices(byPlan)
      } finally {
        setPricingLoading(false)
      }
    }
    fetchPrices()
  }, [provider, isMarketer])

  // Get available plans for selected provider
  const availablePlans = provider ? cablePlans[provider as keyof typeof cablePlans] || [] : []

  // Get selected plan details
  const planDetails = availablePlans.find((p) => p.id === selectedPlan)
  const totalAmount = hookPrice || planPrices[selectedPlan] || planDetails?.price || 0

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!provider || !smartcardNumber || !selectedPlan) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    if (smartcardNumber.length < 10) {
      toast({
        title: "Invalid Smartcard Number",
        description: "Please enter a valid smartcard/IUC number.",
        variant: "destructive",
      })
      return
    }

    if (walletBalance < totalAmount) {
      toast({
        title: "Insufficient Balance",
        description: `You need ₦${totalAmount.toLocaleString()} but have ₦${walletBalance.toLocaleString()}.`,
        variant: "destructive",
      })
      return
    }

    // Prepare payload and open PIN prompt
    setPendingPayload({
      amount: totalAmount,
      smartcardNumber,
      provider,
      planId: selectedPlan,
      customerName,
    })
    setIsPinPromptOpen(true)
  }

  const handlePinConfirm = async (pin: string) => {
    setIsPinPromptOpen(false)
    setProcessing(true)

    try {
      const resp = await submitService({ ...pendingPayload, pin })

      if (!resp.ok) {
        handleServiceError(resp, toast, "Payment Failed")
        return
      }

      setTransactionId(resp.reference || `CBL${Date.now()}`)

      // Deduct from wallet (UI only, backend does real debit)
      if (walletBalance >= totalAmount) {
        const newBalance = walletBalance - totalAmount
        setWalletBalance(newBalance)
      }

      setShowConfirmation(true)
      toast({
        title: "Payment Successful!",
        description: `Your ${provider.toUpperCase()} subscription has been renewed.`,
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  // Reset form
  const resetForm = () => {
    setProvider("")
    setSmartcardNumber("")
    setSelectedPlan("")
    setCustomerName("")
    setShowConfirmation(false)
    setTransactionId("")
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-[#3457D5]/10 rounded-full">
            <Tv className="h-10 w-10 text-[#3457D5]" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Cable TV Subscription</h1>
        <p className="text-lg text-gray-600">Pay for DStv, GOtv, and StarTimes subscriptions</p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Payment Form */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Card className="border-[#3457D5]/20 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-[#3457D5]/5 to-[#CCCCFF]/10">
              <CardTitle className="flex items-center gap-2 text-[#3457D5]">
                <Tv className="h-5 w-5" />
                Pay Cable Bill
              </CardTitle>
              <CardDescription>Instant subscription renewal</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Wallet Balance */}
                <div className="p-4 bg-[#F9F7F3] rounded-lg border border-[#3457D5]/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-[#3457D5]" />
                      <span className="text-sm font-medium text-gray-700">Wallet Balance</span>
                    </div>
                    <span className="text-lg font-bold text-[#3457D5]">₦{walletBalance.toLocaleString()}</span>
                  </div>
                </div>

                {/* Provider Selection */}
                <div className="space-y-2">
                  <Label htmlFor="provider">Cable Provider *</Label>
                  <Select value={provider} onValueChange={setProvider}>
                    <SelectTrigger className="border-[#3457D5]/20 focus:ring-[#3457D5]">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dstv">DStv</SelectItem>
                      <SelectItem value="gotv">GOtv</SelectItem>
                      <SelectItem value="startimes">StarTimes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Smartcard Number */}
                <div className="space-y-2">
                  <Label htmlFor="smartcard">Smartcard/IUC Number *</Label>
                  <Input
                    id="smartcard"
                    value={smartcardNumber}
                    onChange={(e) => setSmartcardNumber(e.target.value)}
                    placeholder="Enter smartcard number"
                    className="border-[#3457D5]/20 focus:ring-[#3457D5]"
                  />
                </div>

                {/* Plan Selection */}
                <div className="space-y-2">
                  <Label htmlFor="plan">Subscription Plan *</Label>
                  <Select value={selectedPlan} onValueChange={setSelectedPlan} disabled={!provider}>
                    <SelectTrigger className="border-[#3457D5]/20 focus:ring-[#3457D5]">
                      <SelectValue placeholder="Select plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePlans.map((plan) => {
                        const price = planPrices[plan.id] ?? plan.price
                        return (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name} - ₦{pricingLoading ? "..." : price.toLocaleString()}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Customer Name (Optional) */}
                <div className="space-y-2">
                  <Label htmlFor="customer-name">Customer Name (Optional)</Label>
                  <Input
                    id="customer-name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Account holder name"
                    className="border-[#3457D5]/20 focus:ring-[#3457D5]"
                  />
                </div>

                {/* Total Amount */}
                {totalAmount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-[#CCCCFF]/20 rounded-lg border border-[#3457D5]/20"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Total Amount</span>
                      <span className="text-2xl font-bold text-[#3457D5]">₦{pricingLoading ? "..." : totalAmount.toLocaleString()}</span>
                    </div>
                  </motion.div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={processing}
                  className="w-full bg-[#3457D5] hover:bg-[#3457D5]/90 text-white"
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Pay Cable Bill"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Information Cards */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          {/* Supported Providers */}
          <Card className="border-[#3457D5]/20">
            <CardHeader>
              <CardTitle className="text-[#3457D5]">Supported Providers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-[#F9F7F3] rounded-lg border border-[#3457D5]/10">
                <div className="font-semibold text-gray-900">DStv</div>
                <div className="text-sm text-gray-600">All packages available</div>
              </div>
              <div className="p-3 bg-[#F9F7F3] rounded-lg border border-[#3457D5]/10">
                <div className="font-semibold text-gray-900">GOtv</div>
                <div className="text-sm text-gray-600">All packages available</div>
              </div>
              <div className="p-3 bg-[#F9F7F3] rounded-lg border border-[#3457D5]/10">
                <div className="font-semibold text-gray-900">StarTimes</div>
                <div className="text-sm text-gray-600">All packages available</div>
              </div>
            </CardContent>
          </Card>

          {/* Important Notes */}
          <Card className="border-[#3457D5]/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#3457D5]">
                <AlertCircle className="h-5 w-5" />
                Important Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Instant activation after payment</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Verify smartcard number before payment</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>SMS confirmation sent after successful payment</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>24/7 payment availability</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirmation && (
          <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
            <DialogContent className="border-[#3457D5]/20">
              <DialogHeader>
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-green-100 rounded-full">
                    <CheckCircle2 className="h-12 w-12 text-green-600" />
                  </div>
                </div>
                <DialogTitle className="text-center text-2xl">Payment Successful!</DialogTitle>
                <DialogDescription className="text-center">
                  Your cable TV subscription has been renewed successfully.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="p-4 bg-[#F9F7F3] rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="font-mono font-semibold text-[#3457D5]">{transactionId}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Provider:</span>
                    <span className="font-semibold">{provider.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Plan:</span>
                    <span className="font-semibold">{planDetails?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-semibold text-[#3457D5]">₦{totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">New Balance:</span>
                    <span className="font-semibold">₦{walletBalance.toLocaleString()}</span>
                  </div>
                </div>
                <Button onClick={resetForm} className="w-full bg-[#3457D5] hover:bg-[#3457D5]/90">
                  Make Another Payment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      <PinPrompt
        isOpen={isPinPromptOpen}
        onClose={() => setIsPinPromptOpen(false)}
        onConfirm={handlePinConfirm}
        isLoading={processing}
      />
    </div>
  )
}
