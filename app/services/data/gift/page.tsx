"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Gift, Wallet, CheckCircle2, Heart } from "lucide-react"
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

const giftPlans: Record<string, DataPlan[]> = {
  MTN: [
    { id: "mtn-gift-500mb", name: "500MB Gift", size: "500MB", price: 180, validity: "30 days" },
    { id: "mtn-gift-1gb", name: "1GB Gift", size: "1GB", price: 350, validity: "30 days" },
    { id: "mtn-gift-2gb", name: "2GB Gift", size: "2GB", price: 700, validity: "30 days" },
    { id: "mtn-gift-3gb", name: "3GB Gift", size: "3GB", price: 1050, validity: "30 days" },
    { id: "mtn-gift-4gb", name: "4GB Gift", size: "4GB", price: 1400, validity: "30 days" },
    { id: "mtn-gift-5gb", name: "5GB Gift", size: "5GB", price: 1750, validity: "30 days" },
    { id: "mtn-gift-10gb", name: "10GB Gift", size: "10GB", price: 3500, validity: "30 days" },
  ],
  Airtel: [
    { id: "airtel-gift-500mb", name: "500MB Gift", size: "500MB", price: 170, validity: "30 days" },
    { id: "airtel-gift-1gb", name: "1GB Gift", size: "1GB", price: 340, validity: "30 days" },
    { id: "airtel-gift-2gb", name: "2GB Gift", size: "2GB", price: 680, validity: "30 days" },
    { id: "airtel-gift-3gb", name: "3GB Gift", size: "3GB", price: 1020, validity: "30 days" },
    { id: "airtel-gift-4gb", name: "4GB Gift", size: "4GB", price: 1360, validity: "30 days" },
    { id: "airtel-gift-5gb", name: "5GB Gift", size: "5GB", price: 1700, validity: "30 days" },
    { id: "airtel-gift-10gb", name: "10GB Gift", size: "10GB", price: 3400, validity: "30 days" },
  ],
  Glo: [
    { id: "glo-gift-500mb", name: "500MB Gift", size: "500MB", price: 160, validity: "30 days" },
    { id: "glo-gift-1gb", name: "1GB Gift", size: "1GB", price: 320, validity: "30 days" },
    { id: "glo-gift-2gb", name: "2GB Gift", size: "2GB", price: 640, validity: "30 days" },
    { id: "glo-gift-3gb", name: "3GB Gift", size: "3GB", price: 960, validity: "30 days" },
    { id: "glo-gift-4gb", name: "4GB Gift", size: "4GB", price: 1280, validity: "30 days" },
    { id: "glo-gift-5gb", name: "5GB Gift", size: "5GB", price: 1600, validity: "30 days" },
    { id: "glo-gift-10gb", name: "10GB Gift", size: "10GB", price: 3200, validity: "30 days" },
  ],
  "9mobile": [
    { id: "9mobile-gift-500mb", name: "500MB Gift", size: "500MB", price: 150, validity: "30 days" },
    { id: "9mobile-gift-1gb", name: "1GB Gift", size: "1GB", price: 300, validity: "30 days" },
    { id: "9mobile-gift-2gb", name: "2GB Gift", size: "2GB", price: 600, validity: "30 days" },
    { id: "9mobile-gift-3gb", name: "3GB Gift", size: "3GB", price: 900, validity: "30 days" },
    { id: "9mobile-gift-4gb", name: "4GB Gift", size: "4GB", price: 1200, validity: "30 days" },
    { id: "9mobile-gift-5gb", name: "5GB Gift", size: "5GB", price: 1500, validity: "30 days" },
    { id: "9mobile-gift-10gb", name: "10GB Gift", size: "10GB", price: 3000, validity: "30 days" },
  ],
}

export default function GiftDataPage() {
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [walletBalance, setWalletBalance] = useState(0)
  const [network, setNetwork] = useState("")
  const [selectedPlan, setSelectedPlan] = useState<DataPlan | null>(null)
  const variantKey = network && selectedPlan ? `${network.toLowerCase()}.${selectedPlan.size.toLowerCase()}` : ""
  const { price, isLoading: pricingLoading, error: pricingError, submitService } = useDynamicPricing(
    "data",
    "gift",
    variantKey,
    { network, size: selectedPlan?.size || "" }
  )
  const [recipientNumber, setRecipientNumber] = useState("")
  const [message, setMessage] = useState("")
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

  const availablePlans = network ? giftPlans[network] || [] : []

  const getPlanSlug = (plan: DataPlan | null, net: string) => {
    if (!plan || !net) return null
    const sizeSlug = plan.size.toLowerCase()
    const netSlug = net.toLowerCase()
    return `data.gift.${netSlug}.${sizeSlug}`
  }

  // Live pricing handled by useDynamicPricing and reacts to network and plan

  // Use dynamic pricing only
  const getSelectedPlanPayable = () => {
    if (typeof price === "number") return Math.round(price)
    return 0
  }

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

    const finalPrice = getSelectedPlanPayable()

    if (typeof price !== "number") {
      toast({
        title: "Pricing Unavailable",
        description: "Live pricing could not be fetched. Please try again.",
        variant: "destructive",
      })
      return
    }

    if (walletBalance < finalPrice) {
      toast({
        title: "Insufficient Balance",
        description: `You need ₦${finalPrice.toLocaleString()} but have ₦${walletBalance.toLocaleString()}`,
        variant: "destructive",
      })
      return
    }

    setPendingPayload({
      amount: finalPrice,
      phone: recipientNumber,
      network,
      planCode: selectedPlan.size,
      message,
      idempotencyKey: crypto.randomUUID(),
      category: "data",
      action: "gift"
    })
    setIsPinPromptOpen(true)
  }

  const handlePinConfirm = async (pin: string) => {
    setIsPinPromptOpen(false)
    setProcessing(true)

    try {
      const resp = await submitService({ ...pendingPayload, pin })
      if (!resp.ok) {
        handleServiceError(resp, toast, "Gift Failed")
        return
      }

      setTransactionId(resp?.reference || crypto.randomUUID())
      setShowConfirmation(true)
      toast({ title: "Gift Sent Successfully", description: `${selectedPlan?.size} gift sent to ${recipientNumber}` })
    } catch (err: any) {
      toast({ title: "Gift Failed", description: err?.message || "Unable to send gift", variant: "destructive" })
    } finally {
      setProcessing(false)
    }
  }

  const resetForm = () => {
    setNetwork("")
    setSelectedPlan(null)
    setRecipientNumber("")
    setMessage("")
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
          <Gift className="h-12 w-12 text-[#3457D5] mr-3" />
          <h1 className="text-4xl font-bold text-gray-900">Gift Data</h1>
        </div>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">Share the gift of connectivity with your loved ones</p>
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
            <CardTitle className="text-[#3457D5] flex items-center">
              <Heart className="h-5 w-5 mr-2" />
              Send Gift Data
            </CardTitle>
            <CardDescription>Surprise someone special with a data gift</CardDescription>
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
                    <Label htmlFor="plan">Select Gift Plan *</Label>
                    <Select
                      value={selectedPlan?.id || ""}
                      onValueChange={(value) => {
                        const plan = availablePlans.find((p) => p.id === value)
                        setSelectedPlan(plan || null)
                      }}
                    >
                      <SelectTrigger className="border-[#CCCCFF] focus:ring-[#3457D5]">
                        <SelectValue placeholder="Choose gift plan" />
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
                <Label htmlFor="message">Personal Message (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Add a personal message to your gift..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={200}
                  className="border-[#CCCCFF] focus:ring-[#3457D5] min-h-[100px]"
                />
                <p className="text-xs text-gray-500 mt-1">{message.length}/200 characters</p>
              </div>

              {selectedPlan && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-[#F9F7F3] rounded-lg border border-[#CCCCFF]"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Gift Plan:</span>
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
                {processing ? "Sending Gift..." : "Send Gift Data"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Legacy comparison table removed to ensure only dynamic pricing displays */}

      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="border-[#CCCCFF]">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl text-[#3457D5]">Gift Sent Successfully!</DialogTitle>
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
                  <span className="text-gray-600">Gift Plan:</span>
                  <span className="font-semibold">{selectedPlan?.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Recipient:</span>
                  <span className="font-semibold">{recipientNumber}</span>
                </div>
                {message && (
                  <div className="pt-2 border-t border-[#CCCCFF]">
                    <span className="text-gray-600 text-sm">Your Message:</span>
                    <p className="text-sm italic mt-1">{message}</p>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-[#3457D5]">
                  <span>Amount Paid:</span>
                  <span>₦{selectedPlan ? getSelectedPlanPayable().toLocaleString() : 0}</span>
                </div>
              </div>
              <p className="text-sm text-gray-500">Gift will be delivered within 5 minutes</p>
            </DialogDescription>
          </DialogHeader>
          <Button onClick={resetForm} className="w-full bg-[#3457D5] hover:bg-[#2a4ab0]">
            Send Another Gift
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
