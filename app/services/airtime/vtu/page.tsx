"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Smartphone, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { authFetch } from "@/lib/client-auth"
import { useDynamicPricing } from "@/hooks/useDynamicPricing"
import { PinPrompt } from "@/components/PinPrompt"
import { useRouter } from "next/navigation"

export default function AirtimeVTUPage() {
  const [network, setNetwork] = useState("")
  const [phone, setPhone] = useState("")
  const [amount, setAmount] = useState<number | "">("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState<{ reference: string; providerRef?: string } | null>(null)
  const [isPinPromptOpen, setIsPinPromptOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Dynamic pricing for service fee using network as a parameter (variant unused)
  const variant = ""
  const { price: serviceFee, isLoading: dbLoading, error: pricingError, submitService } = useDynamicPricing(
    "airtime",
    "vtu",
    variant,
    network ? { network: toSlugNetwork(network) } : undefined,
  )

  // New: status details for receipt-like info
  const [statusDetail, setStatusDetail] = useState<null | {
    status: string
    amount: number
    wallet?: { balance: number; currency?: string } | null
    meta?: any
  }>(null)
  const [loadingStatus, setLoadingStatus] = useState(false)

  const quickAmounts = [100, 200, 500, 1000, 2000]

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!network || !phone || !amount || Number(amount) <= 0) {
      toast({ title: "Missing details", description: "Fill network, phone and amount", variant: "destructive" })
      return
    }
    setIsPinPromptOpen(true)
  }

  const handlePinConfirm = async (pin: string) => {
    setIsPinPromptOpen(false)
    setIsSubmitting(true)
    setSuccess(null)
    setStatusDetail(null)
    try {
      const result = await submitService({
        amount: Number(amount),
        params: { phone, network },
        phone,
        network,
        pin
      })
      if (!result.ok) {
        throw new Error(result.error || "Airtime purchase failed")
      }
      setSuccess({ reference: String(result.reference || ""), providerRef: String((result.data?.providerRef) || "") || undefined })
      toast({
        title: "Airtime purchased", description: `Ref: ${String(result.reference || "")}.
      Viewing details below.` })
    } catch (err: any) {
      console.error('API Error:', err);
      const errorMessage = err?.message || err?.error || "Failed to process request. Please try again.";
      toast({
        title: "Airtime Purchase Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false)
    }
  }

  function toSlugNetwork(n: string) {
    const map: Record<string, string> = {
      MTN: "mtn",
      GLO: "glo",
      AIRTEL: "airtel",
      "9MOBILE": "9mobile",
    }
    return map[n] || n.toLowerCase()
  }

  // Recompute variant when network changes to trigger hook fetching
  useEffect(() => {
    // no-op; variant derived from network string
  }, [network])

  // New: fetch transaction status after success to show receipt-like details
  useEffect(() => {
    if (!success?.reference) {
      return
    }
    ; (async () => {
      try {
        setLoadingStatus(true)
        const res = await authFetch(`/api/service/status/${encodeURIComponent(success.reference)}`)
        const data = await res.json().catch(() => null)
        if (res.ok && data?.ok) {
          setStatusDetail({ status: String(data.status || "SUCCESS"), amount: Number(data.amount || 0), wallet: data.wallet || null, meta: data.meta || {} })
        } else {
          setStatusDetail(null)
          toast({ title: "Receipt unavailable", description: String(data?.error || "Unable to fetch status") })
        }
      } catch (err) {
        setStatusDetail(null)
        toast({ title: "Receipt fetch failed", description: String(err) })
      } finally {
        setLoadingStatus(false)
      }
    })()
  }, [success?.reference])

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Smartphone className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Airtime VTU</h1>
          <p className="text-muted-foreground">Buy instant airtime on all networks</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Buy Airtime</CardTitle>
            <CardDescription>Enter phone, network and amount</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submit}>
              <div className="space-y-2">
                <Label>Network</Label>
                <Select value={network} onValueChange={setNetwork}>
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
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08012345678" />
              </div>
              <div className="space-y-2">
                <Label>Amount (₦)</Label>
                <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} placeholder="100" />
              </div>
              {network ? (
                <div className="bg-[#CCCCFF]/20 p-3 rounded-lg text-sm">
                  <div className="flex justify-between">
                    <span>Service Fee</span>
                    <span>{dbLoading ? "Loading..." : `₦${(Number(serviceFee || 0)).toLocaleString()}`}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>Total Payable</span>
                    <span>
                      ₦{(((Number(amount) || 0) + Number(serviceFee || 0))).toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : null}
              <Button className="w-full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : "Purchase Airtime"}
              </Button>
            </form>
            <div className="mt-4">
              <Label>Quick Amounts</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {quickAmounts.map((amt) => (
                  <Button key={amt} variant="outline" onClick={() => setAmount(amt)}>
                    ₦{amt}
                  </Button>
                ))}
              </div>
            </div>
            {success && (
              <div className="mt-6 p-3 rounded-lg bg-green-50 border border-green-200 text-sm">
                <div className="flex items-center gap-2 font-medium text-green-700">
                  <CheckCircle2 className="h-5 w-5" /> Purchase successful
                </div>
                <div className="mt-1 text-green-700">Reference: {success.reference}</div>
                {success.providerRef ? (
                  <div className="text-green-700">Provider Ref: {success.providerRef}</div>
                ) : null}

                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(success.reference)}>Copy Reference</Button>
                  <Button size="sm" variant="secondary" disabled={loadingStatus} onClick={() => {
                    // refetch status on demand
                    setStatusDetail(null)
                    setLoadingStatus(true)
                    authFetch(`/api/service/status/${encodeURIComponent(success.reference)}`)
                      .then(r => r.json())
                      .then(d => {
                        if (d?.ok) {
                          setStatusDetail({ status: String(d.status || "SUCCESS"), amount: Number(d.amount || 0), wallet: d.wallet || null, meta: d.meta || {} })
                        } else {
                          toast({ title: "Receipt unavailable", description: String(d?.error || "Unable to fetch status") })
                        }
                      })
                      .catch(err => toast({ title: "Receipt fetch failed", description: String(err) }))
                      .finally(() => setLoadingStatus(false))
                  }}>{loadingStatus ? "Loading..." : "View Details"}</Button>
                </div>

                {statusDetail && (
                  <div className="mt-3 bg-white border rounded p-3 text-green-700">
                    <div className="flex justify-between"><span>Status</span><span className="font-medium">{statusDetail.status}</span></div>
                    <div className="flex justify-between mt-1"><span>Amount</span><span className="font-medium">₦{Number(statusDetail.amount || 0).toLocaleString()}</span></div>
                    {statusDetail.wallet ? (
                      <div className="flex justify-between mt-1"><span>Wallet Balance</span><span className="font-medium">₦{Number(statusDetail.wallet.balance || 0).toLocaleString()}</span></div>
                    ) : null}
                    {statusDetail.meta?.providerRef ? (
                      <div className="mt-1"><span>Provider Ref:</span> {String(statusDetail.meta.providerRef)}</div>
                    ) : null}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tips</CardTitle>
            <CardDescription>Ensure correct phone and network</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>Use the exact network your SIM is on.</li>
              <li>Double-check phone number before submitting.</li>
              <li>Your wallet will be debited after a successful purchase.</li>
            </ul>
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
