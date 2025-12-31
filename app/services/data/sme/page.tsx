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
import { Wifi, Wallet, CheckCircle2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import useDynamicPricing from "@/hooks/useDynamicPricing"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { timedAuthFetch } from "@/lib/ui-metrics"
import { handleServiceError } from "@/lib/service-error-handler"
import { PinPrompt } from "@/components/PinPrompt"

interface DataPlan {
  id: string
  name: string
  size: string
  price: number
  validity: string
}

const dataPlans: Record<string, DataPlan[]> = {
  MTN: [
    { id: "mtn-500mb", name: "500MB", size: "500MB", price: 150, validity: "30 days" },
    { id: "mtn-1gb", name: "1GB", size: "1GB", price: 280, validity: "30 days" },
    { id: "mtn-2gb", name: "2GB", size: "2GB", price: 560, validity: "30 days" },
    { id: "mtn-3gb", name: "3GB", size: "3GB", price: 840, validity: "30 days" },
    { id: "mtn-4gb", name: "4GB", size: "4GB", price: 1120, validity: "30 days" },
    { id: "mtn-5gb", name: "5GB", size: "5GB", price: 1400, validity: "30 days" },
    { id: "mtn-10gb", name: "10GB", size: "10GB", price: 2800, validity: "30 days" },
  ],
  Airtel: [
    { id: "airtel-500mb", name: "500MB", size: "500MB", price: 140, validity: "30 days" },
    { id: "airtel-1gb", name: "1GB", size: "1GB", price: 270, validity: "30 days" },
    { id: "airtel-2gb", name: "2GB", size: "2GB", price: 540, validity: "30 days" },
    { id: "airtel-3gb", name: "3GB", size: "3GB", price: 810, validity: "30 days" },
    { id: "airtel-4gb", name: "4GB", size: "4GB", price: 1080, validity: "30 days" },
    { id: "airtel-5gb", name: "5GB", size: "5GB", price: 1350, validity: "30 days" },
    { id: "airtel-10gb", name: "10GB", size: "10GB", price: 2700, validity: "30 days" },
  ],
  Glo: [
    { id: "glo-500mb", name: "500MB", size: "500MB", price: 130, validity: "30 days" },
    { id: "glo-1gb", name: "1GB", size: "1GB", price: 250, validity: "30 days" },
    { id: "glo-2gb", name: "2GB", size: "2GB", price: 500, validity: "30 days" },
    { id: "glo-3gb", name: "3GB", size: "3GB", price: 750, validity: "30 days" },
    { id: "glo-4gb", name: "4GB", size: "4GB", price: 1000, validity: "30 days" },
    { id: "glo-5gb", name: "5GB", size: "5GB", price: 1250, validity: "30 days" },
    { id: "glo-10gb", name: "10GB", size: "10GB", price: 2500, validity: "30 days" },
  ],
  "9mobile": [
    { id: "9mobile-500mb", name: "500MB", size: "500MB", price: 120, validity: "30 days" },
    { id: "9mobile-1gb", name: "1GB", size: "1GB", price: 240, validity: "30 days" },
    { id: "9mobile-2gb", name: "2GB", size: "2GB", price: 480, validity: "30 days" },
    { id: "9mobile-3gb", name: "3GB", size: "3GB", price: 720, validity: "30 days" },
    { id: "9mobile-4gb", name: "4GB", size: "4GB", price: 960, validity: "30 days" },
    { id: "9mobile-5gb", name: "5GB", size: "5GB", price: 1200, validity: "30 days" },
    { id: "9mobile-10gb", name: "10GB", size: "10GB", price: 2400, validity: "30 days" },
  ],
}

export default function SMEDataPage() {
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [walletBalance, setWalletBalance] = useState(0)
  const [network, setNetwork] = useState("")
  const [selectedPlan, setSelectedPlan] = useState<DataPlan | null>(null)
  const variantKey = network && selectedPlan ? `${network.toLowerCase()}.${selectedPlan.size.toLowerCase()}` : ""
  const { price, isLoading: pricingLoading, error: pricingError, submitService } = useDynamicPricing(
    "data",
    "sme",
    variantKey,
    { network, size: selectedPlan?.size || "" }
  )
  const [recipientNumber, setRecipientNumber] = useState("")
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [transactionId, setTransactionId] = useState("")
  const [isPinPromptOpen, setIsPinPromptOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const balance = localStorage.getItem("ufriends_wallet_balance")
    setWalletBalance(balance ? Number.parseFloat(balance) : 0)
      // Removed legacy UI pricing; rely solely on dynamic pricing from hook

      // Load live wallet balance to avoid stale localStorage
      ; (async () => {
        try {
          const res = await timedAuthFetch("/api/wallet/balance")
          if (res.ok) {
            const data = await res.json().catch(() => ({}))
            const bal = Number(data?.balance ?? 0)
            const numericBal = Number.isFinite(bal) ? bal : 0
            setWalletBalance(numericBal)
            try {
              localStorage.setItem("ufriends_wallet_balance", String(numericBal))
            } catch { }
          }
        } catch {
          // ignore; fallback to localStorage value already set
        } finally {
          setLoading(false)
        }
      })()
    // If network fails, loading will be set in finally
  }, [])

  // Pricing and role handled by useDynamicPricing

  const availablePlans = network ? dataPlans[network] || [] : []

  const getPlanSlug = (plan: DataPlan | null, net: string) => {
    if (!plan || !net) return null
    const sizeSlug = plan.size.toLowerCase()
    const netSlug = net.toLowerCase()
    return `data.sme.${netSlug}.${sizeSlug}`
  }

  // Live pricing handled by useDynamicPricing and reacts to network and plan changes

  const basePrice = selectedPlan ? selectedPlan.price : 0

  // Final payable amount comes exclusively from dynamic pricing
  const dynamicAmount: number | null = typeof price === "number" ? Math.round(price) : null

  // Marketer pricing unified by hook; keep legacy fallback only if needed

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!network || !selectedPlan || !recipientNumber) {
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

    if (dynamicAmount == null) {
      toast({ title: "Pricing unavailable", description: "Please wait for live price to load", variant: "destructive" })
      return
    }

    if (walletBalance < dynamicAmount) {
      toast({
        title: "Insufficient Balance",
        description: `You need ₦${dynamicAmount.toLocaleString()} but have ₦${walletBalance.toLocaleString()}`,
        variant: "destructive",
      })
      return
    }

    setShowConfirmation(false)
    setIsPinPromptOpen(true)
  }

  const handlePinConfirm = async (pin: string) => {
    setIsPinPromptOpen(false)
    setProcessing(true)
    try {
      const resp = await submitService({
        amount: dynamicAmount as number,
        phone: recipientNumber,
        network,
        planCode: selectedPlan?.size,
        pin
      })
      if (!resp.ok) {
        throw new Error(resp?.error || resp?.message || "Request failed")
      }

      setTransactionId(resp?.reference || crypto.randomUUID())
      setProcessing(false)
      setShowConfirmation(true)
      toast({ title: "Purchase Successful", description: `${selectedPlan?.size} sent to ${recipientNumber}` })
    } catch (err: any) {
      setProcessing(false)
      toast({
        title: "Data Purchase Failed",
        description: err instanceof Error ? err.message : "Failed to process request. Please try again.",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setNetwork("")
    setSelectedPlan(null)
    setRecipientNumber("")
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
          <Wifi className="h-12 w-12 text-[#3457D5] mr-3" />
          <h1 className="text-4xl font-bold text-gray-900">SME Data</h1>
        </div>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">Affordable SME data bundles at wholesale prices</p>
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
            <CardTitle className="text-[#3457D5]">Purchase SME Data</CardTitle>
            <CardDescription>Get discounted data bundles instantly</CardDescription>
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
                    <Label htmlFor="plan">Select Data Plan *</Label>
                    <Select
                      value={selectedPlan?.id || ""}
                      onValueChange={(value) => {
                        const plan = availablePlans.find((p) => p.id === value)
                        setSelectedPlan(plan || null)
                      }}
                    >
                      <SelectTrigger className="border-[#CCCCFF] focus:ring-[#3457D5]">
                        <SelectValue placeholder="Choose data plan" />
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
                        <p>Price: {pricingLoading ? "Loading..." : dynamicAmount != null ? `₦${dynamicAmount.toLocaleString()}` : "Unavailable"}</p>
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
                    <span>{pricingLoading ? "Loading..." : dynamicAmount != null ? `₦${dynamicAmount.toLocaleString()}` : "Unavailable"}</span>
                  </div>
                </motion.div>
              )}

              <Button
                type="submit"
                disabled={processing || pricingLoading || dynamicAmount == null || !network || !selectedPlan || !recipientNumber}
                className="w-full bg-[#3457D5] hover:bg-[#2a4ab0] text-white"
              >
                {processing ? "Processing..." : "Buy Data"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Legacy comparison table removed: only dynamic pricing is displayed */}

      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="border-[#CCCCFF]">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl text-[#3457D5]">Purchase Successful!</DialogTitle>
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
                  <span>Amount Paid:</span>
                  <span>{pricingLoading ? "Loading..." : dynamicAmount != null ? `₦${dynamicAmount.toLocaleString()}` : "Unavailable"}</span>
                </div>
              </div>
              <p className="text-sm text-gray-500">Data will be delivered within 5 minutes</p>
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
