"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Building, Wallet, CheckCircle2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import useDynamicPricing from "@/hooks/useDynamicPricing"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PinPrompt } from "@/components/PinPrompt"
import { handleServiceError } from "@/lib/service-utils"

interface DataPlan {
  id: string
  name: string
  size: string
  price: number
  validity: string
}

const corporatePlans: Record<string, DataPlan[]> = {
  MTN: [
    { id: "mtn-corp-1gb", name: "1GB Corporate", size: "1GB", price: 300, validity: "30 days" },
    { id: "mtn-corp-2gb", name: "2GB Corporate", size: "2GB", price: 600, validity: "30 days" },
    { id: "mtn-corp-3gb", name: "3GB Corporate", size: "3GB", price: 900, validity: "30 days" },
    { id: "mtn-corp-4gb", name: "4GB Corporate", size: "4GB", price: 1200, validity: "30 days" },
    { id: "mtn-corp-5gb", name: "5GB Corporate", size: "5GB", price: 1500, validity: "30 days" },
    { id: "mtn-corp-10gb", name: "10GB Corporate", size: "10GB", price: 3000, validity: "30 days" },
    { id: "mtn-corp-25gb", name: "25GB Corporate", size: "25GB", price: 7500, validity: "30 days" },
    { id: "mtn-corp-50gb", name: "50GB Corporate", size: "50GB", price: 15000, validity: "30 days" },
  ],
  Airtel: [
    { id: "airtel-corp-1gb", name: "1GB Corporate", size: "1GB", price: 290, validity: "30 days" },
    { id: "airtel-corp-2gb", name: "2GB Corporate", size: "2GB", price: 580, validity: "30 days" },
    { id: "airtel-corp-3gb", name: "3GB Corporate", size: "3GB", price: 870, validity: "30 days" },
    { id: "airtel-corp-4gb", name: "4GB Corporate", size: "4GB", price: 1160, validity: "30 days" },
    { id: "airtel-corp-5gb", name: "5GB Corporate", size: "5GB", price: 1450, validity: "30 days" },
    { id: "airtel-corp-10gb", name: "10GB Corporate", size: "10GB", price: 2900, validity: "30 days" },
    { id: "airtel-corp-25gb", name: "25GB Corporate", size: "25GB", price: 7250, validity: "30 days" },
  ],
  Glo: [
    { id: "glo-corp-1gb", name: "1GB Corporate", size: "1GB", price: 280, validity: "30 days" },
    { id: "glo-corp-2gb", name: "2GB Corporate", size: "2GB", price: 560, validity: "30 days" },
    { id: "glo-corp-3gb", name: "3GB Corporate", size: "3GB", price: 840, validity: "30 days" },
    { id: "glo-corp-4gb", name: "4GB Corporate", size: "4GB", price: 1120, validity: "30 days" },
    { id: "glo-corp-5gb", name: "5GB Corporate", size: "5GB", price: 1400, validity: "30 days" },
    { id: "glo-corp-10gb", name: "10GB Corporate", size: "10GB", price: 2800, validity: "30 days" },
  ],
  "9mobile": [
    { id: "9mobile-corp-1gb", name: "1GB Corporate", size: "1GB", price: 270, validity: "30 days" },
    { id: "9mobile-corp-2gb", name: "2GB Corporate", size: "2GB", price: 540, validity: "30 days" },
    { id: "9mobile-corp-3gb", name: "3GB Corporate", size: "3GB", price: 810, validity: "30 days" },
    { id: "9mobile-corp-4gb", name: "4GB Corporate", size: "4GB", price: 1080, validity: "30 days" },
    { id: "9mobile-corp-5gb", name: "5GB Corporate", size: "5GB", price: 1350, validity: "30 days" },
    { id: "9mobile-corp-10gb", name: "10GB Corporate", size: "10GB", price: 2700, validity: "30 days" },
  ],
}

export default function CorporateDataPage() {
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [walletBalance, setWalletBalance] = useState(0)
  const [network, setNetwork] = useState("")
  const [selectedPlan, setSelectedPlan] = useState<DataPlan | null>(null)
  const variantKey = network && selectedPlan ? `${network.toLowerCase()}.${selectedPlan.size.toLowerCase()}` : ""
  const { price, isLoading: pricingLoading, error: pricingError, submitService } = useDynamicPricing(
    "data",
    "corporate",
    variantKey,
    { network, size: selectedPlan?.size || "" }
  )
  const [recipientNumber, setRecipientNumber] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("wallet")
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [transactionId, setTransactionId] = useState("")
  const [isPinPromptOpen, setIsPinPromptOpen] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    const balance = localStorage.getItem("ufriends_wallet_balance")
    setWalletBalance(balance ? Number.parseFloat(balance) : 0)
    setLoading(false)
  }, [])

  // Role and pricing are handled by useDynamicPricing

  const availablePlans = network ? corporatePlans[network] || [] : []

  const getPlanSlug = (plan: DataPlan | null, net: string) => {
    if (!plan || !net) return null
    const sizeSlug = plan.size.toLowerCase()
    const netSlug = net.toLowerCase()
    return `data.corporate.${netSlug}.${sizeSlug}`
  }

  // Live pricing handled by useDynamicPricing

  // Role-aware dynamic pricing for selected plan
  const getSelectedPlanPayable = () => {
    if (typeof price === "number") return Math.round(price)
    return 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!network || !selectedPlan || !recipientNumber || !paymentMethod) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (recipientNumber.length !== 11) {
      toast({
        title: "Invalid Phone Number",
        description: "Phone number must be 11 digits",
        variant: "destructive",
      })
      return
    }

    const finalPrice = getSelectedPlanPayable()

    if (typeof price !== "number") {
      toast({
        title: "Pricing Unavailable",
        description: "Live pricing could not be fetched. Please try again.",
        variant: "destructive",
      })
      return
    }

    if (paymentMethod === "wallet" && walletBalance < finalPrice) {
      toast({
        title: "Insufficient Balance",
        description: `You need ₦${finalPrice.toLocaleString()} but have ₦${walletBalance.toLocaleString()}`,
        variant: "destructive",
      })
      return
    }

    if (paymentMethod !== "wallet") {
      // For non-wallet, we capture order without calling live provider or PIN
      setProcessing(true)
      const idempotencyKey = crypto.randomUUID()
      setTransactionId(idempotencyKey)
      setProcessing(false)
      setShowConfirmation(true)
      toast({ title: "Order Received", description: "Please complete bank transfer" })
      return
    }

    setPendingPayload({
      amount: finalPrice,
      phone: recipientNumber,
      network,
      planCode: selectedPlan.size,
      idempotencyKey: crypto.randomUUID(),
      category: "data",
      action: "corporate"
    })
    setIsPinPromptOpen(true)
  }

  const handlePinConfirm = async (pin: string) => {
    setIsPinPromptOpen(false)
    setProcessing(true)

    try {
      const resp = await submitService({ ...pendingPayload, pin })
      if (!resp.ok) {
        handleServiceError(resp, toast, "Purchase Failed")
        return
      }

      setTransactionId(resp?.reference || crypto.randomUUID())
      setShowConfirmation(true)
      toast({ title: "Purchase Successful", description: `${selectedPlan?.size} sent to ${recipientNumber}` })
    } catch (err: any) {
      toast({ title: "Purchase Failed", description: err?.message || "Unable to complete purchase", variant: "destructive" })
    } finally {
      setProcessing(false)
    }
  }

  const resetForm = () => {
    setNetwork("")
    setSelectedPlan(null)
    setRecipientNumber("")
    setPaymentMethod("wallet")
    setShowConfirmation(false)
    setTransactionId("")
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Building className="h-12 w-12 text-[#3457D5] mr-3" />
          <h1 className="text-4xl font-bold text-gray-900">Corporate Data</h1>
        </div>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">Premium corporate data plans for businesses</p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-[#3457D5] to-[#CCCCFF] text-white">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Wallet className="h-5 w-5 mr-2" />
                Wallet Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">₦{walletBalance.toLocaleString()}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="shadow-lg border-[#CCCCFF]">
          <CardHeader className="bg-[#F9F7F3]">
            <CardTitle className="text-[#3457D5]">Purchase Corporate Data</CardTitle>
            <CardDescription>Enterprise-grade data solutions</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="network">Select Network *</Label>
                <Select value={network} onValueChange={setNetwork}>
                  <SelectTrigger className="border-[#CCCCFF] focus:ring-[#3457D5]">
                    <SelectValue placeholder="Choose network" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MTN">MTN</SelectItem>
                    <SelectItem value="Airtel">Airtel</SelectItem>
                    <SelectItem value="Glo">Glo</SelectItem>
                    <SelectItem value="9mobile">9mobile</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <AnimatePresence mode="wait">
                {network && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Label htmlFor="plan">Select Corporate Plan *</Label>
                    <Select
                      value={selectedPlan?.id || ""}
                      onValueChange={(value) => {
                        const plan = availablePlans.find((p) => p.id === value)
                        setSelectedPlan(plan || null)
                      }}
                    >
                      <SelectTrigger className="border-[#CCCCFF] focus:ring-[#3457D5]">
                        <SelectValue placeholder="Choose corporate plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePlans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name} ({plan.validity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedPlan && (
                      <div className="mt-3 text-sm text-gray-700">
                        {pricingLoading && <p>Fetching live price…</p>}
                        {!pricingLoading && pricingError && (
                          <p className="text-red-600">Unable to fetch price: {pricingError}</p>
                        )}
                        {!pricingLoading && !pricingError && typeof price === "number" && (
                          <p>Current price: ₦{Math.round(price).toLocaleString()}</p>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <Label htmlFor="recipientNumber">Recipient Phone Number *</Label>
                <Input
                  id="recipientNumber"
                  type="tel"
                  placeholder="08012345678"
                  value={recipientNumber}
                  onChange={(e) => setRecipientNumber(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  maxLength={11}
                  className="border-[#CCCCFF] focus:ring-[#3457D5]"
                />
              </div>

              <div>
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="border-[#CCCCFF] focus:ring-[#3457D5]">
                    <SelectValue placeholder="Choose payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wallet">Wallet</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedPlan && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-[#F9F7F3] rounded-lg border border-[#CCCCFF]"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Data Plan:</span>
                    <span className="font-semibold">{selectedPlan.size}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Validity:</span>
                    <span className="font-semibold">{selectedPlan.validity}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold text-[#3457D5]">
                    <span>Total Amount:</span>
                    <span>₦{getSelectedPlanPayable().toLocaleString()}</span>
                  </div>
                </motion.div>
              )}

              <Button
                type="submit"
                disabled={processing || !network || !selectedPlan || !recipientNumber}
                className="w-full bg-[#3457D5] hover:bg-[#2a4ab0] text-white"
              >
                {processing ? "Processing..." : "Buy Corporate Data"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {network && (
        <></>
      )}

      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="border-[#CCCCFF]">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl text-[#3457D5]">
              {paymentMethod === "wallet" ? "Purchase Successful!" : "Order Received!"}
            </DialogTitle>
            <DialogDescription className="text-center space-y-4 pt-4">
              <div className="bg-[#F9F7F3] p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="font-semibold">{transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Network:</span>
                  <span className="font-semibold">{network}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Data Plan:</span>
                  <span className="font-semibold">{selectedPlan?.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Recipient:</span>
                  <span className="font-semibold">{recipientNumber}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-[#3457D5]">
                  <span>Amount:</span>
                  <span>₦{selectedPlan ? getSelectedPlanPayable().toLocaleString() : 0}</span>
                </div>
              </div>
              {paymentMethod === "bank" && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800 font-semibold mb-2">Bank Transfer Details:</p>
                  <p className="text-xs text-gray-600">Bank: GTBank</p>
                  <p className="text-xs text-gray-600">Account: 0123456789</p>
                  <p className="text-xs text-gray-600">Name: UFriends IT</p>
                </div>
              )}
              <p className="text-sm text-gray-500">
                {paymentMethod === "wallet"
                  ? "Data will be delivered within 5 minutes"
                  : "Data will be delivered after payment confirmation"}
              </p>
            </DialogDescription>
          </DialogHeader>
          <Button onClick={resetForm} className="w-full bg-[#3457D5] hover:bg-[#2a4ab0]">
            Make Another Purchase
          </Button>
        </DialogContent>
      </Dialog>
      <PinPrompt
        isOpen={isPinPromptOpen}
        onClose={() => setIsPinPromptOpen(false)}
        onConfirm={handlePinConfirm}
        isLoading={processing}
      />
    </div>
  )
}
