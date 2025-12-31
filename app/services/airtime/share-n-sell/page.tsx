"use client"

import { useState, useEffect } from "react"
import useDynamicPricing from "@/hooks/useDynamicPricing"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { Share2, Wallet, CheckCircle2, Zap, TrendingDown } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { PinPrompt } from "@/components/PinPrompt"
import { handleServiceError } from "@/lib/service-utils"

type Network = "MTN" | "Airtel" | "Glo" | "9mobile"

export default function ShareNSellPage() {
  const { toast } = useToast()
  const [network, setNetwork] = useState<Network | "">("")
  const [recipientNumber, setRecipientNumber] = useState("")
  const [amount, setAmount] = useState("")
  const [walletBalance, setWalletBalance] = useState(0)
  const [payable, setPayable] = useState(0)
  const [serviceFee, setServiceFee] = useState<number | null>(null)
  const [dbLoading, setDbLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [transactionId, setTransactionId] = useState("")
  const [isPinPromptOpen, setIsPinPromptOpen] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<any>(null)

  useEffect(() => {
    // Load wallet balance
    const balance = localStorage.getItem("ufriends_wallet_balance")
    setWalletBalance(balance ? Number.parseFloat(balance) : 0)

    // Load rates
    setTimeout(() => setIsLoading(false), 800)
  }, [])

  // Map UI network to slug values
  const toSlugNetwork = (n: string) => {
    const map: Record<string, string> = { MTN: "mtn", Airtel: "airtel", Glo: "glo", "9mobile": "9mobile" }
    return map[n] || n.toLowerCase()
  }

  // Dynamic pricing via hook (service fee) using network parameter; variant unused
  const { price: dynamicPrice, isLoading: priceLoading, error: pricingError, submitService } = useDynamicPricing(
    "airtime",
    "share-n-sell",
    "",
    network ? { network: toSlugNetwork(String(network)) } : undefined,
  )

  // Load live DB pricing (service fee) and compute payable
  useEffect(() => {
    if (!network || !amount) {
      setServiceFee(null)
      setPayable(0)
      return
    }
    const amt = Number.parseFloat(amount) || 0
    setDbLoading(true)
    const fee = typeof dynamicPrice === "number" ? Number(dynamicPrice) : null
    if (fee != null) {
      setServiceFee(fee)
      setPayable(Math.max(0, Math.round(amt + fee)))
    } else {
      setServiceFee(null)
      setPayable(0)
    }
    setDbLoading(false)
  }, [network, amount, dynamicPrice])

  const handleBuyAirtime = async () => {
    // Validation
    if (!network || !recipientNumber || !amount) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    if (recipientNumber.length !== 11) {
      toast({
        title: "Invalid Number",
        description: "Phone number must be 11 digits",
        variant: "destructive",
      })
      return
    }

    if (Number.parseFloat(amount) < 50) {
      toast({
        title: "Amount Too Low",
        description: "Minimum airtime amount is ₦50",
        variant: "destructive",
      })
      return
    }

    if (walletBalance < payable) {
      toast({
        title: "Insufficient Balance",
        description: `Your wallet balance (₦${walletBalance.toLocaleString()}) is less than ₦${payable.toLocaleString()}`,
        variant: "destructive",
      })
      return
    }

    if (typeof dynamicPrice !== "number") {
      toast({ title: "Pricing Unavailable", description: "Live pricing could not be fetched.", variant: "destructive" })
      return
    }

    setPendingPayload({
      amount: Number.parseFloat(amount),
      phone: recipientNumber,
      network,
      idempotencyKey: crypto.randomUUID(),
      category: "airtime",
      action: "share-n-sell"
    })
    setIsPinPromptOpen(true)
  }

  const handlePinConfirm = async (pin: string) => {
    setIsPinPromptOpen(false)
    setIsProcessing(true)

    try {
      const resp = await submitService({ ...pendingPayload, pin })
      if (!resp?.ok) {
        handleServiceError(resp, toast, "Transaction Failed")
        return
      }

      setTransactionId(resp?.reference || `SNS-${Date.now()}`)
      setShowConfirmation(true)
      toast({ title: "Airtime Sent Successfully!", description: `₦${amount} airtime sent to ${recipientNumber}` })

      // Reset form
      setNetwork("")
      setRecipientNumber("")
      setAmount("")
    } catch (error: any) {
      toast({ title: "Transaction Failed", description: error?.message || "Unable to complete purchase", variant: "destructive" })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 rounded-2xl bg-[#3457D5]/10">
            <Share2 className="h-8 w-8 text-[#3457D5]" />
          </div>
          <h1 className="text-4xl font-bold text-foreground">Share 'n Sell</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Buy airtime instantly from UFriends automated system with discounted rates
        </p>
      </motion.div>

      {/* Wallet Balance Card */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
        <Card className="bg-gradient-to-r from-[#3457D5]/10 to-[#CCCCFF]/20 border-[#3457D5]/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-[#3457D5]/20">
                  <Wallet className="h-5 w-5 text-[#3457D5]" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Wallet Balance</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-32 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-[#3457D5]">₦{walletBalance.toLocaleString()}</p>
                  )}
                </div>
              </div>
              <Badge className="bg-[#3457D5] text-white">
                <Zap className="h-3 w-3 mr-1" />
                Instant
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Form */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="border-2 border-[#3457D5]/20">
          <CardHeader>
            <CardTitle className="text-2xl">Buy Airtime</CardTitle>
            <CardDescription>Select network, enter recipient number and amount</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Network Selection */}
            <div className="space-y-2">
              <Label htmlFor="network">Network Provider</Label>
              <Select value={network} onValueChange={(value) => setNetwork(value as Network)}>
                <SelectTrigger id="network" className="border-[#3457D5]/30">
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

            {/* Recipient Number */}
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient Phone Number</Label>
              <Input
                id="recipient"
                type="tel"
                placeholder="08012345678"
                value={recipientNumber}
                onChange={(e) => setRecipientNumber(e.target.value.replace(/\D/g, "").slice(0, 11))}
                className="border-[#3457D5]/30"
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Airtime Amount (₦)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="border-[#3457D5]/30"
              />
            </div>

            {/* Price Display */}
            {network && amount && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-4 rounded-xl bg-[#CCCCFF]/20 border border-[#3457D5]/20 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Airtime Value:</span>
                  <span className="font-semibold">₦{Number.parseFloat(amount).toLocaleString()}</span>
                </div>
                {serviceFee != null ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <TrendingDown className="h-4 w-4 text-green-600" />
                      Service Fee:
                    </span>
                    <span className="font-semibold">{dbLoading ? "Loading..." : `₦${serviceFee.toLocaleString()}`}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Fetching live price…</span>
                    <span className="font-semibold">{dbLoading ? "Loading..." : "—"}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-[#3457D5]/20 flex items-center justify-between">
                  <span className="font-medium">You Pay:</span>
                  <span className="text-2xl font-bold text-[#3457D5]">₦{payable.toLocaleString()}</span>
                </div>
              </motion.div>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleBuyAirtime}
              disabled={isProcessing || !network || !recipientNumber || !amount}
              className="w-full h-12 text-lg bg-[#3457D5] hover:bg-[#3457D5]/90"
            >
              {isProcessing ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="mr-2"
                  >
                    <Zap className="h-5 w-5" />
                  </motion.div>
                  Processing...
                </>
              ) : (
                <>
                  <Share2 className="mr-2 h-5 w-5" />
                  Buy Airtime
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-[#3457D5]/20">
          <CardContent className="pt-6 text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-[#3457D5]/10 flex items-center justify-center">
              <Zap className="h-6 w-6 text-[#3457D5]" />
            </div>
            <h3 className="font-semibold">Instant Delivery</h3>
            <p className="text-sm text-muted-foreground">Airtime sent within seconds</p>
          </CardContent>
        </Card>
        <Card className="border-[#3457D5]/20">
          <CardContent className="pt-6 text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <TrendingDown className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold">Discounted Rates</h3>
            <p className="text-sm text-muted-foreground">Save up to 6% on every purchase</p>
          </CardContent>
        </Card>
        <Card className="border-[#3457D5]/20">
          <CardContent className="pt-6 text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-[#CCCCFF]/30 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-[#3457D5]" />
            </div>
            <h3 className="font-semibold">Wallet Payment</h3>
            <p className="text-sm text-muted-foreground">Secure and convenient</p>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="border-[#3457D5]/30">
          <DialogHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <DialogTitle className="text-center text-2xl">Transaction Successful!</DialogTitle>
            <DialogDescription className="text-center space-y-3 pt-4">
              <p className="text-base">
                ₦{amount} airtime has been sent to <strong>{recipientNumber}</strong>
              </p>
              <div className="p-3 bg-[#F9F7F3] rounded-lg">
                <p className="text-sm text-muted-foreground">Transaction ID</p>
                <p className="font-mono font-semibold text-[#3457D5]">{transactionId}</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowConfirmation(false)} className="w-full bg-[#3457D5]">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <PinPrompt
        isOpen={isPinPromptOpen}
        onClose={() => setIsPinPromptOpen(false)}
        onConfirm={handlePinConfirm}
        isLoading={isProcessing}
      />
    </div>
  )
}
