"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Zap, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { handleServiceError } from "@/lib/service-error-handler"
import useDynamicPricing from "@/hooks/useDynamicPricing"
import { PinPrompt } from "@/components/PinPrompt"

export default function ElectricityBillsPage() {
  const [provider, setProvider] = useState("")
  const [meterNumber, setMeterNumber] = useState("")
  const [amount, setAmount] = useState<number | "">("")
  const [customerName, setCustomerName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState<{ reference: string; token?: string; units?: string } | null>(null)
  const [isPinPromptOpen, setIsPinPromptOpen] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<any>(null)
  const { toast } = useToast()

  const [serviceFee, setServiceFee] = useState<number | null>(null)
  const [dbLoading, setDbLoading] = useState(false)

  const discos = [
    { value: "IKEJA", label: "Ikeja Electric" },
    { value: "EKO", label: "Eko Electric" },
    { value: "IBADAN", label: "Ibadan Electric" },
    { value: "ABUJA", label: "Abuja Electric" },
    { value: "KANO", label: "Kano Electric" },
    { value: "PORT-HARCOURT", label: "Port Harcourt Electric" },
    { value: "ENUGU", label: "Enugu Electric" },
    { value: "JOS", label: "Jos Electric" },
  ]

  const toSlugProvider = (p: string) => {
    const map: Record<string, string> = {
      IKEJA: "ikeja",
      EKO: "eko",
      IBADAN: "ibadan",
      ABUJA: "abuja",
      KANO: "kano",
      "PORT-HARCOURT": "port.harcourt",
      ENUGU: "enugu",
      JOS: "jos",
    }
    return map[p] || p.toLowerCase()
  }

  // Hook-driven dynamic pricing based on provider variant and user role
  const { price, isLoading: hookLoading, error, submitService } = useDynamicPricing(
    "bills",
    "electricity",
    provider ? toSlugProvider(provider) : "",
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!provider || !meterNumber || !amount || Number(amount) <= 0) {
      toast({ title: "Missing details", description: "Fill provider, meter and amount", variant: "destructive" })
      return
    }
    setIsSubmitting(true)

    try {
      setPendingPayload({
        amount: Number(amount),
        meterNumber,
        serviceProvider: provider,
        customerName,
      })
      setIsPinPromptOpen(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePinConfirm = async (pin: string) => {
    setIsPinPromptOpen(false)
    setIsSubmitting(true)
    setSuccess(null)

    try {
      if (!pendingPayload) {
        throw new Error("No pending payment details found.")
      }

      const resp = await submitService({ ...pendingPayload, pin })
      if (!resp.ok) {
        throw new Error(resp.error || "Electricity bill payment failed")
      }
      setSuccess({
        reference: String(resp.reference || resp.data?.reference || ""),
        token: resp.data?.token,
        units: resp.data?.units,
      })
      toast({ title: "Electricity paid", description: `Ref: ${String(resp.reference || resp.data?.reference || "")}` })

      // Clear form fields after successful payment
      setProvider("")
      setMeterNumber("")
      setAmount("")
      setCustomerName("")
      setPendingPayload(null)
    } catch (err) {
      handleServiceError(err, "Electricity Payment Failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    // Reflect hook price as service fee in UI
    setDbLoading(hookLoading)
    if (!provider) {
      setServiceFee(null)
      return
    }
    setServiceFee(typeof price === "number" ? price : null)
  }, [provider, price, hookLoading])

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center space-x-3">
        <div className="p-2 bg-[#3457D5]/10 rounded-lg">
          <Zap className="h-6 w-6 text-[#3457D5]" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Electricity Bill</h1>
          <p className="text-muted-foreground">Pay for electricity across all DISCOs</p>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="border-[#3457D5]/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-[#3457D5]/5 to-[#CCCCFF]/10">
            <CardTitle className="text-[#3457D5]">Pay Electricity</CardTitle>
            <CardDescription>Enter meter details and amount</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>DISCO Provider</Label>
                <Select value={provider} onValueChange={setProvider}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {discos.map((d) => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Meter Number</Label>
                <Input value={meterNumber} onChange={(e) => setMeterNumber(e.target.value)} placeholder="1234567890" />
              </div>
              <div className="space-y-2">
                <Label>Amount (₦)</Label>
                <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} placeholder="500" />
              </div>
              {provider ? (
                <div className="bg-[#CCCCFF]/20 p-3 rounded-lg text-sm">
                  <div className="flex justify-between">
                    <span>Service Fee</span>
                    <span>{dbLoading ? "Loading..." : `₦${(serviceFee ?? 0).toLocaleString()}`}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>Total Payable</span>
                    <span>
                      ₦{(() => {
                        const total = (Number(amount) || 0) + (serviceFee || 0)
                        return total.toLocaleString()
                      })()}
                    </span>
                  </div>
                </div>
              ) : null}
              <div className="space-y-2">
                <Label>Customer Name (optional)</Label>
                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="John Doe" />
              </div>
              <Button className="w-full" type="submit" disabled={isSubmitting || hookLoading}>
                {isSubmitting || hookLoading ? "Processing..." : "Pay Electricity"}
              </Button>
            </form>

            {success && (
              <div className="mt-6 p-3 rounded-lg bg-green-50 border border-green-200 text-sm">
                <div className="flex items-center gap-2 font-medium text-green-700">
                  <CheckCircle2 className="h-5 w-5" /> Payment successful
                </div>
                <div className="mt-1 text-green-700">Reference: {success.reference}</div>
                {success.token ? <div className="text-green-700">Token: {success.token}</div> : null}
                {success.units ? <div className="text-green-700">Units: {success.units}</div> : null}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tips</CardTitle>
            <CardDescription>Prepaid meters return tokens on success</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>Confirm DISCO provider matches your meter.</li>
              <li>Double-check meter number before paying.</li>
              <li>Your wallet will be debited after success.</li>
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
