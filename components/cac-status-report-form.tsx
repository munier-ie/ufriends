"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, CheckCircle2, AlertCircle, Info, Download } from "lucide-react"
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

interface StatusReport {
  businessName: string
  rcNumber: string
  registrationType: string
  status: string
  dateRegistered: string
  lastUpdated: string
  verificationLevel: string
  remarks: string
}

export function CacStatusReportForm() {
  const { toast } = useToast()
  const [isChecking, setIsChecking] = useState(false)
  const [isPinPromptOpen, setIsPinPromptOpen] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<any>(null)
  const [report, setReport] = useState<StatusReport | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<FormData>({
    number: "",
    companyType: 'RC',
    companyName: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Dynamic pricing for CAC status report; vary by companyType
  const { price: servicePrice, isLoading: priceLoading, error: priceError, submitService } = useDynamicPricing(
    "cac",
    "status",
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
        const paramsRes = await fetch(`/api/pricing/parameters?category=cac&subservice=status&variant=`)
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
        url.searchParams.set("subservice", "status")
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

  const handleCheckStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setReport(null)

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
      action: "status"
    })
    setIsPinPromptOpen(true)
  }

  const handlePinConfirm = async (pin: string) => {
    setIsPinPromptOpen(false)
    setIsChecking(true)

    try {
      const resp = await submitService({ ...pendingPayload, pin })

      if (!resp.ok) {
        handleServiceError(resp, toast, "Submission Failed")
        return
      }

      const resultData = resp.data
      // Store the result for reference
      localStorage.setItem("ufriends_cac_status_report", JSON.stringify(resultData?.data || resultData))

      const dataAny: any = resultData?.data ?? resultData
      setReport({
        businessName: dataAny.businessName || dataAny.company_name || dataAny.companyName || "Not provided",
        rcNumber: dataAny.rc_number || dataAny.rcNumber || dataAny.bnNumber || formData.number || "Not provided",
        registrationType: dataAny.registrationType || dataAny.company_type || formData.companyType,
        status: dataAny.status || dataAny.company_status || "Verified",
        dateRegistered: dataAny.dateRegistered || dataAny.date_of_registration || "Not provided",
        lastUpdated: dataAny.lastUpdated || new Date().toLocaleDateString(),
        verificationLevel: dataAny.verificationLevel || "Standard",
        remarks: dataAny.remarks || "Verification completed successfully",
      })
    } catch (error: any) {
      console.error("CAC Status Report Error:", error)
      setError(error.message || "Failed to retrieve CAC status report. Please try again later.")
    } finally {
      setIsChecking(false)
    }
  }
  // Sample override to demonstrate report structure (if needed)
  // setReport({
  //   lastUpdated: "05 October 2025",
  //   verificationLevel: "Verified",
  //   remarks: "Record matches official CAC data.",
  // })

  const handleClear = () => {
    setFormData({ number: "", companyType: 'RC', companyName: "" })
    setReport(null)
    setError(null)
    setErrors({})
  }

  const handleDownloadReport = () => {
    // Mock download functionality
    alert("PDF report download would be triggered here in production.")
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>CAC Status Report Retrieval</CardTitle>
        <CardDescription>
          Check the official registration status of a business or company through UFriends CAC services
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCheckStatus} className="space-y-6">
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
                {formData.companyType === 'BN' ? 'BN Number' : formData.companyType === 'IT' ? 'IT Number' : 'RC Number'} <span className="text-destructive">*</span>
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
              <Label htmlFor="companyName">Registered Name (Optional)</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder={formData.companyType === 'BN' ? 'Enter business name' : 'Enter company/trustee name'}
              />
            </div>
          </div>

          {/* Dynamic Cost Information */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Status Report Fee</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Includes verification and processing. Price inclusive of service charge and CAC verification cost.
                  </p>
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
              All status reports are based on official Corporate Affairs Commission data. UFriends is an authorized
              service intermediary.
            </AlertDescription>
          </Alert>

          {/* Status Report Display */}
          {report && (
            <Card className="border-green-500 bg-green-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <CardTitle className="text-green-800">Status Report Retrieved Successfully</CardTitle>
                  </div>
                  <Badge className="bg-green-600 text-white">{report.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-green-900">Business Name</p>
                    <p className="text-sm text-green-700">{report.businessName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-900">RC Number</p>
                    <p className="text-sm text-green-700">{report.rcNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-900">Registration Type</p>
                    <p className="text-sm text-green-700">{report.registrationType}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-900">Status</p>
                    <p className="text-sm text-green-700">{report.status}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-900">Date Registered</p>
                    <p className="text-sm text-green-700">{report.dateRegistered}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-900">Last Updated</p>
                    <p className="text-sm text-green-700">{report.lastUpdated}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-900">Verification Level</p>
                    <p className="text-sm text-green-700">{report.verificationLevel}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-900">Remarks</p>
                    <p className="text-sm text-green-700">{report.remarks}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-green-200">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-green-600 text-green-700 hover:bg-green-100 bg-transparent"
                    onClick={handleDownloadReport}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF Report
                  </Button>
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
            <Button type="submit" disabled={isChecking || priceLoading || alignedLoading} className="min-w-[150px]">
              {isChecking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                "Check Status"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
      <PinPrompt
        isOpen={isPinPromptOpen}
        onClose={() => setIsPinPromptOpen(false)}
        onConfirm={handlePinConfirm}
        isLoading={isChecking}
      />
    </Card>
  )
}
