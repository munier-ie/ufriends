"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, CheckCircle2, AlertCircle, Info } from "lucide-react"
import { useDynamicPricing } from "@/hooks/useDynamicPricing"
import { formatPrice } from "@/lib/service-pricing"
import { PinPrompt } from "@/components/PinPrompt"
import { handleServiceError } from "@/lib/service-utils"
import { useToast } from "@/hooks/use-toast"

type CompanyType = 'RC' | 'BN' | 'IT'

interface FormData {
  number: string
  companyType: CompanyType
  companyName?: string
}

interface RetrievalResult {
  businessName: string
  rcNumber: string
  status: string
  dateRegistered: string
  businessType: string
  address: string
  bnNumber?: string
}

export function CacRetrievalForm() {
  const { toast } = useToast()
  const [isRetrieving, setIsRetrieving] = useState(false)
  const [isPinPromptOpen, setIsPinPromptOpen] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<any>(null)
  const [result, setResult] = useState<RetrievalResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<FormData>({
    number: "",
    companyType: 'RC',
    companyName: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Dynamic pricing for CAC retrieval; vary by companyType
  const { price: servicePrice, isLoading: priceLoading, error: priceError, submitService } = useDynamicPricing(
    "cac",
    "info",
    "",
    { companyType: formData.companyType },
  )

  // Fallback alignment with admin parameters: discover correct parameter key and retry pricing
  const [alignedPrice, setAlignedPrice] = useState<number | null>(null)
  const [alignedLoading, setAlignedLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function alignPrice() {
      setAlignedPrice(null)
      if (servicePrice != null) return
      if (!formData.companyType) return
      setAlignedLoading(true)
      try {
        const paramsRes = await fetch(`/api/pricing/parameters?category=cac&subservice=info&variant=`)
        const json = await paramsRes.json()
        const options = json?.options || {}
        const keys = Object.keys(options)
        if (keys.length === 0) return
        const preferred = keys.filter((k) => {
          const vals: string[] = Array.isArray(options[k]) ? options[k] : []
          const lc = vals.map((v) => String(v).toLowerCase())
          return lc.includes(formData.companyType.toLowerCase()) || /type|channel|company/i.test(k)
        })
        const keyToUse = preferred[0] || keys[0]
        if (!keyToUse) return
        const url = new URL(`/api/pricing`, window.location.origin)
        url.searchParams.set("category", "cac")
        url.searchParams.set("subservice", "info")
        url.searchParams.set("variant", "")
        url.searchParams.set("role", "user")
        url.searchParams.set(keyToUse, formData.companyType)
        const priceRes = await fetch(url.toString())
        const pjson = await priceRes.json()
        const val = pjson?.price ?? pjson?.data?.price ?? null
        if (!cancelled) setAlignedPrice(val != null ? Number(val) : null)
      } catch (_) {
        // ignore
      } finally {
        if (!cancelled) setAlignedLoading(false)
      }
    }
    alignPrice()
    return () => {
      cancelled = true
    }
  }, [formData.companyType, servicePrice])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.number) newErrors.number = `${formData.companyType} number is required`
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleRetrieve = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)

    if (!validateForm()) {
      return
    }

    setPendingPayload({
      amount: Number(servicePrice ?? alignedPrice ?? 0),
      idempotencyKey: crypto.randomUUID(),
      params: {
        number: formData.number,
        companyType: formData.companyType,
        companyName: formData.companyName || undefined,
      },
      category: "cac",
      action: "info"
    })
    setIsPinPromptOpen(true)
  }

  const handlePinConfirm = async (pin: string) => {
    setIsPinPromptOpen(false)
    setIsRetrieving(true)

    try {
      const resp = await submitService({ ...pendingPayload, pin })

      if (!resp.ok) {
        handleServiceError(resp, toast, "Submission Failed")
        return
      }

      const dataResult = resp.data

      const d: any = dataResult?.data ?? dataResult
      setResult({
        businessName: d.businessName || d.company_name || d.companyName || "Not provided",
        rcNumber: d.rc_number || d.rcNumber || formData.number,
        status: d.status || d.company_status || "Verified",
        dateRegistered: d.dateRegistered || d.date_of_registration || "Not provided",
        businessType: d.businessType || d.company_type || formData.companyType,
        address: d.address || d.company_address || "",
      })
    } catch (err: any) {
      setError(err?.message || "Failed to retrieve CAC certificate")
    } finally {
      setIsRetrieving(false)
    }
  }

  const handleClear = () => {
    setFormData({ number: "", companyType: 'RC', companyName: "" })
    setResult(null)
    setError(null)
    setErrors({})
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>CAC Certificate Retrieval</CardTitle>
        <CardDescription>
          Retrieve your existing CAC registration details using your BN/RC number or director information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRetrieve} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Channel (Company Type)</Label>
            <Select value={formData.companyType} onValueChange={(v) => setFormData({ ...formData, companyType: v as CompanyType })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RC">RC (Registered Company)</SelectItem>
                <SelectItem value="BN">BN (Business Name)</SelectItem>
                <SelectItem value="IT">IT (Incorporated Trustee)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              {formData.companyType === 'BN' ? 'BN numbers may include the BN prefix, followed by digits.' : formData.companyType === 'IT' ? 'IT numbers are provided by CAC for Incorporated Trustees.' : 'RC numbers are numeric only.'}
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="number">
                {formData.companyType === 'BN' ? 'Business Name (BN) Number' : formData.companyType === 'IT' ? 'Incorporated Trustee (IT) Number' : 'Company RC Number'} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="number"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                placeholder={formData.companyType === 'BN' ? 'e.g., BN1234567' : formData.companyType === 'IT' ? 'e.g., IT1234567' : 'e.g., 1234567'}
                className={errors.number ? "border-destructive" : ""}
              />
              {errors.number && <p className="text-sm text-destructive">{errors.number}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Company / Business Name (Optional)</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Enter name (optional)"
              />
            </div>
          </div>

          {/* Dynamic Cost Information */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Retrieval Fee</p>
                  <p className="text-xs text-muted-foreground mt-1">Covers CAC verification and processing cost</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    {priceLoading || alignedLoading
                      ? "Loading..."
                      : (servicePrice ?? alignedPrice) == null
                        ? "Not configured"
                        : formatPrice(Number((servicePrice ?? alignedPrice) || 0))}
                  </p>
                </div>
              </div>
              {priceError && (
                <p className="mt-2 text-sm text-red-600">Failed to load price. You can still submit.</p>
              )}
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              All retrievals are done through official CAC records. UFriends acts as an authorized service intermediary.
            </AlertDescription>
          </Alert>

          {/* Result Display */}
          {result && (
            <Card className="border-green-500 bg-green-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-green-800">Retrieval Successful</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-green-900">Business Name</p>
                    <p className="text-sm text-green-700">{result.businessName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-900">RC Number</p>
                    <p className="text-sm text-green-700">{result.rcNumber}</p>
                  </div>
                  {result.bnNumber && (
                    <div>
                      <p className="text-sm font-medium text-green-900">BN Number</p>
                      <p className="text-sm text-green-700">{result.bnNumber}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-green-900">Status</p>
                    <p className="text-sm text-green-700">{result.status}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-900">Date Registered</p>
                    <p className="text-sm text-green-700">{result.dateRegistered}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-900">Business Type</p>
                    <p className="text-sm text-green-700">{result.businessType}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-green-900">Address</p>
                    <p className="text-sm text-green-700">{result.address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Alert className="border-destructive bg-destructive/10">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive">{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={handleClear}>
              Clear Form
            </Button>
            <Button type="submit" disabled={isRetrieving || priceLoading || alignedLoading} className="min-w-[150px]">
              {isRetrieving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Retrieving...
                </>
              ) : (
                "Retrieve Registration"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
      <PinPrompt
        isOpen={isPinPromptOpen}
        onClose={() => setIsPinPromptOpen(false)}
        onConfirm={handlePinConfirm}
        isLoading={isRetrieving}
      />
    </Card>
  )
}
