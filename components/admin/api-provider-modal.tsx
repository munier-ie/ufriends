"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface ApiProvider {
  id: string
  provider: string
  category: string
  apiBase: string
  apiKey: string
  status: "Connected" | "Invalid" | "Not Set"
  lastChecked: string
  notes: string
  isActive?: boolean
}

interface ApiProviderModalProps {
  provider: ApiProvider | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (provider: ApiProvider) => void
}

const PROVIDER_OPTIONS = [
  "Maskawa",
  "SubandGain",
  "Ported SIM",
  "Prembly",
  "Monnify",
  "PaymentPoint",
  "CAC Post-Incorporation",
  "NIN Modification",
  "Training",
  "Custom Provider",
]

const CATEGORY_OPTIONS = [
  "Airtime & Data (VTU)",
  "Bills & Education",
  "Verification / KYC",
  "Wallet / Payments",
  "Manual Internal Services",
]

export function ApiProviderModal({ provider, open, onOpenChange, onSave }: ApiProviderModalProps) {
  const [formData, setFormData] = useState<Partial<ApiProvider>>({
    provider: "",
    category: "",
    apiBase: "",
    apiKey: "",
    notes: "",
    status: "Not Set",
    lastChecked: "",
  })
  const [errors, setErrors] = useState<{ provider?: string; category?: string; apiBase?: string; apiKey?: string }>({})
  const { toast } = useToast()

  useEffect(() => {
    if (provider) {
      setFormData(provider)
    } else {
      setFormData({
        provider: "",
        category: "",
        apiBase: "",
        apiKey: "",
        notes: "",
        status: "Not Set",
        lastChecked: "",
      })
    }
  }, [provider, open])

  const validate = (fd: Partial<ApiProvider>) => {
    const e: { provider?: string; category?: string; apiBase?: string; apiKey?: string } = {}
    if (!fd.provider) e.provider = "Provider is required"
    if (!fd.category) e.category = "Category is required"
    if (fd.apiBase) {
      try {
        // Basic URL validation
        new URL(fd.apiBase)
      } catch {
        e.apiBase = "Enter a valid URL"
      }
    }
    if (fd.apiKey && fd.apiKey.length < 8) e.apiKey = "API key must be at least 8 characters"
    return e
  }

  const handleSave = () => {
    const v = validate(formData)
    setErrors(v)
    if (Object.keys(v).length > 0) {
      toast({ title: "Please fix form errors", variant: "destructive" })
      return
    }

    const savedProvider: ApiProvider = {
      id: provider?.id || Date.now().toString(),
      provider: formData.provider!,
      category: formData.category!,
      apiBase: formData.apiBase || "",
      apiKey: formData.apiKey || "",
      status: formData.status || "Not Set",
      lastChecked: formData.lastChecked || "",
      notes: formData.notes || "",
      isActive: formData.isActive,
    }

    onSave(savedProvider)
    toast({
      title: provider ? "Provider Updated" : "Provider Added",
      description: `${savedProvider.provider} has been ${provider ? "updated" : "added"} successfully.`,
    })
    onOpenChange(false)
  }

  const handleTestConnection = () => {
    toast({
      title: "Testing Connection",
      description: `Testing connection to ${formData.provider}...`,
    })

    setTimeout(() => {
      const success = Math.random() > 0.3
      toast({
        title: success ? "Connection Successful" : "Connection Failed",
        description: success
          ? `${formData.provider} is responding correctly.`
          : `Unable to connect to ${formData.provider}.`,
        variant: success ? "default" : "destructive",
      })
    }, 1500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{provider ? "Edit API Provider" : "Add New API Provider"}</DialogTitle>
          <DialogDescription>Manage API provider configuration, credentials, and connectivity.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Provider Name */}
          <div>
            <Label>Provider Name *</Label>
            {provider ? (
              <Input value={formData.provider} readOnly className="mt-2" />
            ) : (
              <Select
                value={formData.provider}
                onValueChange={(value) => {
                  const next = { ...formData, provider: value }
                  setFormData(next)
                  setErrors((prev) => ({ ...prev, ...validate(next) }))
                }}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDER_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.provider && <p className="mt-1 text-sm text-red-600">{errors.provider}</p>}
          </div>

          {/* Category */}
          <div>
            <Label>Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => {
                const next = { ...formData, category: value }
                setFormData(next)
                setErrors((prev) => ({ ...prev, ...validate(next) }))
              }}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
          </div>

          {/* API Base URL */}
          <div>
            <Label>API Base URL</Label>
            <Input
              value={formData.apiBase}
              onChange={(e) => {
                const next = { ...formData, apiBase: e.target.value }
                setFormData(next)
                setErrors((prev) => ({ ...prev, ...validate(next) }))
              }}
              placeholder="https://api.example.com/v1"
              className="mt-2"
            />
            {errors.apiBase && <p className="mt-1 text-sm text-red-600">{errors.apiBase}</p>}
          </div>

          {/* API Key */}
          <div>
            <Label>API Key</Label>
            <Input
              value={formData.apiKey}
              onChange={(e) => {
                const next = { ...formData, apiKey: e.target.value }
                setFormData(next)
                setErrors((prev) => ({ ...prev, ...validate(next) }))
              }}
              placeholder="Enter API key"
              className="mt-2"
            />
            {errors.apiKey && <p className="mt-1 text-sm text-red-600">{errors.apiKey}</p>}
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any notes about this provider..."
              className="mt-2"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-4">
            <Button onClick={handleSave} disabled={Object.keys(validate(formData)).length > 0}>Save Provider</Button>
            {formData.apiKey && formData.category !== "Manual Internal Services" && (
              <Button variant="outline" onClick={handleTestConnection}>
                Test Connection
              </Button>
            )}
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
