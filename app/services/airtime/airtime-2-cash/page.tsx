"use client"

import { useEffect, useState } from "react"
import useDynamicPricing from "@/hooks/useDynamicPricing"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { DollarSign, CheckCircle2 } from "lucide-react"
import { motion } from "framer-motion"
import { getServicePrices } from "@/lib/service-pricing"
import { PinPrompt } from "@/components/PinPrompt"
import { handleServiceError } from "@/lib/service-utils"
// removed duplicate named import of useDynamicPricing

type Network = "MTN" | "GLO" | "AIRTEL" | "9MOBILE"

export default function Airtime2CashPage() {
  const [network, setNetwork] = useState<Network | "">("")
  const [phone, setPhone] = useState("")
  const [amount, setAmount] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isMarketer, setIsMarketer] = useState(false)
  const [dbLoading, setDbLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [reference, setReference] = useState("")
  const [isPinPromptOpen, setIsPinPromptOpen] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<any>(null)
  const { toast } = useToast()

  // Map UI network to slug values
  const toSlugNetwork = (n: string) => {
    const map: Record<string, string> = { MTN: "mtn", GLO: "glo", AIRTEL: "airtel", "9MOBILE": "9mobile" }
    return map[n] || n.toLowerCase()
  }

  // Live dynamic pricing: use network as a parameter; variant unused
  const variant = ""
  const { price, isLoading: priceLoading, error: pricingError, submitService } = useDynamicPricing(
    "airtime",
    "airtime-2-cash",
    variant,
    network ? { network: toSlugNetwork(String(network)) } : undefined,
  )

  // Detect current user role to choose pricing tier
  useEffect(() => {
    ; (async () => {
      try {
        const res = await fetch("/api/me")
        const data = res.ok ? await res.json() : null
        const role = data?.user?.role || data?.role || ""
        const roles: string[] = data?.user?.roles || []
        const marketer = /MARKETER/i.test(role) || roles.includes("MARKETER")
        setIsMarketer(Boolean(marketer))
      } catch {
        setIsMarketer(false)
      }
    })()
  }, [])

  // Removed duplicate hook call and broken dbPrice effect

  // Compute payout and describe pricing mode based on dynamic pricing only
  const computePayout = () => {
    const amt = Number(amount) || 0
    const p = price
    if (typeof p === "number") {
      if (p > 0 && p <= 1.5) {
        // Treat as rate multiplier
        return { payout: Math.round(amt * p), mode: `Rate x${p}` }
      }
      // Treat as fixed fee deducted
      const payout = Math.max(0, Math.round(amt - p))
      return { payout, mode: `Fee ₦${p}` }
    }
    return { payout: 0, mode: "Pricing unavailable" }
  }

  // Removed duplicate submit function that simulated order capture

  const { payout, mode } = computePayout()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!network || !phone || !amount) {
      toast({ title: "Missing Information", description: "Please fill in all fields", variant: "destructive" })
      return
    }
    if (String(phone).replace(/\D/g, "").length !== 11) {
      toast({ title: "Invalid Number", description: "Phone number must be 11 digits", variant: "destructive" })
      return
    }
    if (Number(amount) < 50) {
      toast({ title: "Amount Too Low", description: "Minimum amount is ₦50", variant: "destructive" })
      return
    }
    if (typeof price !== "number") {
      toast({ title: "Pricing Unavailable", description: "Live pricing could not be fetched.", variant: "destructive" })
      return
    }

    setPendingPayload({
      amount: Number(amount),
      phone,
      network,
      idempotencyKey: crypto.randomUUID(),
      category: "airtime",
      action: "airtime-2-cash"
    })
    setIsPinPromptOpen(true)
  }

  const handlePinConfirm = async (pin: string) => {
    setIsPinPromptOpen(false)
    setIsSubmitting(true)

    try {
      const resp = await submitService({ ...pendingPayload, pin })
      if (!resp?.ok) {
        handleServiceError(resp, toast, "Submission Failed")
        return
      }

      setReference(resp?.reference || `ATC-${Date.now()}`)
      setSuccess(true)
      toast({ title: "Request Submitted", description: `Airtime to cash request submitted for ₦${amount}` })
      setNetwork("")
      setPhone("")
      setAmount(0)
    } catch (err: any) {
      toast({ title: "Submission Failed", description: err?.message || "Unable to submit request", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <DollarSign className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Airtime 2 Cash</h1>
          <p className="text-muted-foreground">Convert airtime to cash with role-based pricing</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Sell Airtime</CardTitle>
            <CardDescription>Enter phone, network and amount</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submit}>
              <div className="space-y-2">
                <Label>Network</Label>
                <Select value={network} onValueChange={(v) => setNetwork(v as Network)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select network" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MTN">MTN</SelectItem>
                    <SelectItem value="GLO">GLO</SelectItem>
                    <SelectItem value="AIRTEL">AIRTEL</SelectItem>
                    <SelectItem value="9MOBILE">9MOBILE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="08012345678" />
              </div>
              <div className="space-y-2">
                <Label>Amount (₦)</Label>
                <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} placeholder="100" />
              </div>
              {network ? (
                <div className="bg-[#CCCCFF]/20 p-3 rounded-lg text-sm">
                  <div className="flex justify-between">
                    <span>Pricing</span>
                    <span>{dbLoading ? "Loading..." : (priceLoading ? "Loading..." : mode)}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>You Receive</span>
                    <span>₦{payout.toLocaleString()}</span>
                  </div>
                </div>
              ) : null}
              <Button className="w-full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </form>
            {success && (
              <Dialog open={success} onOpenChange={setSuccess}>
                <DialogContent>
                  <DialogHeader>
                    <div className="flex justify-center mb-4">
                      <div className="rounded-full bg-green-100 p-3">
                        <CheckCircle2 className="h-12 w-12 text-green-600" />
                      </div>
                    </div>
                    <DialogTitle className="text-center">Request Received</DialogTitle>
                    <DialogDescription className="text-center space-y-2">
                      <div className="flex justify-between">
                        <span>Reference</span>
                        <span className="font-semibold">{reference}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Network</span>
                        <span className="font-semibold">{network}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Amount</span>
                        <span className="font-semibold">₦{Number(amount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>You Receive</span>
                        <span className="font-semibold">₦{payout.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">We will confirm and credit your wallet shortly.</p>
                    </DialogDescription>
                  </DialogHeader>
                  <Button onClick={() => setSuccess(false)} className="w-full">
                    Make Another Request
                  </Button>
                </DialogContent>
              </Dialog>
            )}
          </CardContent>
        </Card>
        <Card className="border-[#CCCCFF]/20">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
            <CardDescription>Simple steps to convert airtime to cash</CardDescription>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>• Enter your phone, select network and amount.</p>
            <p>• We apply role-based pricing using live DB or legacy rates.</p>
            <p>• We process your request and credit your wallet.</p>
          </CardContent>
        </Card>
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
