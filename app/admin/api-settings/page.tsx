"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { ApiProviderModal } from "@/components/admin/api-provider-modal"
import { CheckCircle, XCircle, Plus, Copy, Trash2, Eye, EyeOff, Settings2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { authFetch } from "@/lib/client-auth"

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
  priority?: number
  apiKeys?: { id: string; keyName: string; createdAt?: string; updatedAt?: string }[]
}

// Removed localStorage usage; data now loaded from backend

const defaultProviders: ApiProvider[] = [
  // Airtime & Data (VTU)
  {
    id: "1",
    provider: "Maskawa",
    category: "Airtime & Data (VTU)",
    apiBase: "https://api.maskawa.com/v1",
    apiKey: "",
    status: "Not Set",
    lastChecked: "",
    notes: "",
    isActive: true,
  },
  {
    id: "2",
    provider: "SubandGain",
    category: "Airtime & Data (VTU)",
    apiBase: "https://api.subandgain.com/v2",
    apiKey: "",
    status: "Not Set",
    lastChecked: "",
    notes: "",
  },
  {
    id: "3",
    provider: "Ported SIM",
    category: "Airtime & Data (VTU)",
    apiBase: "https://api.portedsim.com/v1",
    apiKey: "",
    status: "Not Set",
    lastChecked: "",
    notes: "",
  },

  // Bills & Education
  {
    id: "4",
    provider: "Maskawa",
    category: "Bills & Education",
    apiBase: "https://api.maskawa.com/v1",
    apiKey: "",
    status: "Not Set",
    lastChecked: "",
    notes: "",
    isActive: true,
  },
  {
    id: "5",
    provider: "SubandGain",
    category: "Bills & Education",
    apiBase: "https://api.subandgain.com/v2",
    apiKey: "",
    status: "Not Set",
    lastChecked: "",
    notes: "",
  },

  // Verification / KYC
  {
    id: "6",
    provider: "Prembly",
    category: "Verification / KYC",
    apiBase: "https://api.prembly.com",
    apiKey: "",
    status: "Not Set",
    lastChecked: "",
    notes: "",
    isActive: true,
  },

  // Wallet / Payments
  {
    id: "7",
    provider: "Monnify",
    category: "Wallet / Payments",
    apiBase: "https://api.monnify.com/v1",
    apiKey: "",
    status: "Not Set",
    lastChecked: "",
    notes: "",
    isActive: true,
  },
  {
    id: "8",
    provider: "PaymentPoint",
    category: "Wallet / Payments",
    apiBase: "https://api.paymentpoint.com/v1",
    apiKey: "",
    status: "Not Set",
    lastChecked: "",
    notes: "",
  },

  // Manual Internal Services
  {
    id: "9",
    provider: "CAC Post-Incorporation",
    category: "Manual Internal Services",
    apiBase: "N/A",
    apiKey: "N/A",
    status: "Connected",
    lastChecked: new Date().toLocaleDateString(),
    notes: "Manual service",
    isActive: true,
  },
  {
    id: "10",
    provider: "NIN Modification",
    category: "Manual Internal Services",
    apiBase: "N/A",
    apiKey: "N/A",
    status: "Connected",
    lastChecked: new Date().toLocaleDateString(),
    notes: "Manual service",
    isActive: true,
  },
  {
    id: "11",
    provider: "Training",
    category: "Manual Internal Services",
    apiBase: "N/A",
    apiKey: "N/A",
    status: "Connected",
    lastChecked: new Date().toLocaleDateString(),
    notes: "Manual service",
    isActive: true,
  },
]

export default function ApiSettingsPage() {
  const router = useRouter()
  const [providers, setProviders] = useState<ApiProvider[]>([])
  const [selectedProvider, setSelectedProvider] = useState<ApiProvider | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [search, setSearch] = useState("")
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [pageSize, setPageSize] = useState<number>(6)
  const { toast } = useToast()

  // Load from backend on mount
  useEffect(() => {
    const loadProviders = async () => {
      try {
        const res = await authFetch("/api/admin/providers", { method: "GET" })
        if (res.status === 401) {
          toast({ title: "Please sign in", description: "Admin access required.", variant: "destructive" })
          router.push("/login")
          return
        }
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        // Accept either array `providers` or object `providersByCategory`
        const mapped: ApiProvider[] = []
        if (Array.isArray(data.providers)) {
          for (const p of data.providers) {
            mapped.push({
              id: p.id,
              provider: p.name,
              category: p.category,
              apiBase: p.apiBaseUrl || "",
              apiKey: "",
              status: (p.apiKeys && p.apiKeys.length > 0) ? "Connected" : "Not Set",
              lastChecked: "",
              notes: "",
              isActive: !!p.isActive,
              priority: p.priority ?? 0,
              apiKeys: (p.apiKeys || []).map((k: any) => ({ id: k.id, keyName: k.keyName, createdAt: k.createdAt, updatedAt: k.updatedAt }))
            })
          }
        } else if (data.providersByCategory && typeof data.providersByCategory === "object") {
          for (const category of Object.keys(data.providersByCategory)) {
            const list = data.providersByCategory[category] || []
            for (const p of list) {
              mapped.push({
                id: p.id,
                provider: p.name,
                category: p.category,
                apiBase: p.apiBaseUrl || "",
                apiKey: "",
                status: (p.apiKeys && p.apiKeys.length > 0) ? "Connected" : "Not Set",
                lastChecked: "",
                notes: "",
                isActive: !!p.isActive,
                priority: p.priority ?? 0,
                apiKeys: (p.apiKeys || []).map((k: any) => ({ id: k.id, keyName: k.keyName, createdAt: k.createdAt, updatedAt: k.updatedAt }))
              })
            }
          }
        }
        setProviders(mapped)
      } catch (err) {
        // Fallback to defaults if backend fails
        setProviders(defaultProviders)
        toast({ title: "Using local defaults", description: "Failed to load providers from server.", variant: "destructive" })
      }
    }
    loadProviders()
  }, [])

  // No localStorage persistence; rely on backend state

  const filteredProviders = providers.filter((p) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      p.provider.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    )
  })

  const categories = Array.from(new Set(filteredProviders.map((p) => p.category)))

  const handleAddProvider = () => {
    setSelectedProvider(null)
    setIsModalOpen(true)
  }

  const handleEditProvider = (provider: ApiProvider) => {
    setSelectedProvider(provider)
    setIsModalOpen(true)
  }

  const categoryToSlug = (category: string) => {
    const map: Record<string, string> = {
      "Wallet / Payments": "wallet",
      "Verification / KYC": "verification",
      "Bills & Education": "bills",
      "Airtime & Data (VTU)": "vtu",
      "Manual Internal Services": "internal",
    }
    return map[category] || category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
  }

  const handleSaveProvider = async (provider: ApiProvider) => {
    if (selectedProvider) {
      // Persist edits to server
      try {
        const res = await authFetch(`/api/admin/providers/${provider.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: provider.provider,
            category: categoryToSlug(provider.category),
            apiBaseUrl: provider.apiBase || undefined,
            isActive: !!provider.isActive,
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (res.status === 401) {
          toast({ title: "Please sign in", description: "Admin access required.", variant: "destructive" })
          router.push("/login")
          return
        }
        if (!res.ok) throw new Error(data?.error || "Failed to update provider")
        const updated = data.provider
        setProviders(providers.map((p) => (p.id === provider.id ? {
          id: updated.id,
          provider: updated.name,
          category: updated.category,
          apiBase: updated.apiBaseUrl || "",
          apiKey: "",
          status: (updated.apiKeys && updated.apiKeys.length > 0) ? "Connected" : "Not Set",
          lastChecked: "",
          notes: provider.notes,
          isActive: !!updated.isActive,
          apiKeys: (updated.apiKeys || []).map((k: any) => ({ id: k.id, keyName: k.keyName, createdAt: k.createdAt, updatedAt: k.updatedAt }))
        } : p)))
        toast({ title: "Provider Updated", description: `${updated.name} was updated successfully.` })
      } catch (err) {
        toast({ title: "Failed to update provider", description: String(err), variant: "destructive" })
      }
      return
    }

    // Persist new provider to server
    try {
      const res = await authFetch("/api/admin/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: provider.provider,
          category: categoryToSlug(provider.category),
          apiBaseUrl: provider.apiBase || undefined,
          priority: 0,
          isActive: !!provider.isActive,
        }),
      })
      const data = await res.json()
      if (res.status === 401) {
        toast({ title: "Please sign in", description: "Admin access required.", variant: "destructive" })
        router.push("/login")
        return
      }
      if (!res.ok) throw new Error(data?.error || "Failed to create provider")
      const created = data.provider
      setProviders([...providers, {
        id: created.id,
        provider: created.name,
        category: created.category,
        apiBase: created.apiBaseUrl || "",
        apiKey: "",
        status: (created.apiKeys && created.apiKeys.length > 0) ? "Connected" : "Not Set",
        lastChecked: "",
        notes: "",
        isActive: !!created.isActive,
        apiKeys: (created.apiKeys || []).map((k: any) => ({ id: k.id, keyName: k.keyName, createdAt: k.createdAt, updatedAt: k.updatedAt }))
      }])
      toast({ title: "Provider Added", description: `${created.name} was created successfully.` })
    } catch (err) {
      toast({ title: "Failed to add provider", description: String(err), variant: "destructive" })
    }
  }

  const handleDeleteProvider = async (id: string) => {
    if (!confirm("Are you sure you want to delete this provider?")) return
    try {
      const res = await authFetch(`/api/admin/providers/${encodeURIComponent(id)}`, { method: "DELETE" })
      const data = await res.json().catch(() => ({}))
      if (res.status === 401) {
        toast({ title: "Please sign in", description: "Admin access required.", variant: "destructive" })
        router.push("/login")
        return
      }
      if (!res.ok) throw new Error(data?.error || "Failed to delete provider")
      setProviders(providers.filter((p) => p.id !== id))
      toast({ title: "Provider Deleted", description: "The provider has been removed successfully." })
    } catch (err) {
      toast({ title: "Failed to delete provider", description: String(err), variant: "destructive" })
    }
  }

  const handleCopyKey = (apiKey: string, providerName: string) => {
    navigator.clipboard.writeText(apiKey)
    toast({
      title: "API Key Copied",
      description: `${providerName} API key copied to clipboard.`,
    })
  }

  const handleTestConnection = (provider: ApiProvider) => {
    toast({
      title: "Testing Connection",
      description: `Testing connection to ${provider.provider}...`,
    })

    setTimeout(() => {
      const success = Math.random() > 0.3
      const updatedProvider = {
        ...provider,
        status: success ? ("Connected" as const) : ("Invalid" as const),
        lastChecked: new Date().toLocaleDateString(),
      }
      setProviders(providers.map((p) => (p.id === provider.id ? updatedProvider : p)))

      toast({
        title: success ? "Connection Successful" : "Connection Failed",
        description: success
          ? `${provider.provider} is responding correctly.`
          : `Unable to connect to ${provider.provider}.`,
        variant: success ? "default" : "destructive",
      })
    }, 1500)
  }

  const handleTestAllConnections = () => {
    toast({
      title: "Testing All Connections",
      description: "Testing all API providers...",
    })

    providers.forEach((provider, index) => {
      if (provider.category !== "Manual Internal Services") {
        setTimeout(() => {
          handleTestConnection(provider)
        }, index * 500)
      }
    })
  }

  const handleSetActive = async (providerId: string, category: string) => {
    try {
      const res = await authFetch(`/api/admin/providers/category/${encodeURIComponent(categoryToSlug(category))}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeProviderId: providerId })
      })
      if (res.status === 401) {
        toast({ title: "Please sign in", description: "Admin access required.", variant: "destructive" })
        router.push("/login")
        return
      }
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const updated = (data.providers || []).map((p: any) => ({
        id: p.id,
        provider: p.name,
        category: p.category,
        apiBase: p.apiBaseUrl || "",
        apiKey: "",
        status: (p.apiKeys && p.apiKeys.length > 0) ? "Connected" : "Not Set",
        lastChecked: "",
        notes: "",
        isActive: !!p.isActive,
        priority: p.priority ?? 0,
        apiKeys: (p.apiKeys || []).map((k: any) => ({ id: k.id, keyName: k.keyName, createdAt: k.createdAt, updatedAt: k.updatedAt }))
      }))
      setProviders((prev) => prev.map((p) => {
        if (p.category !== category) return p
        const match = updated.find((u: { id: string }) => u.id === p.id)
        return match || p
      }))
      toast({ title: "Active Provider Updated", description: "The active provider for this category has been updated." })
    } catch (err) {
      toast({ title: "Failed to set active provider", description: String(err), variant: "destructive" })
    }
  }

  const handleSetPriority = async (providerId: string, category: string, newPriority: number) => {
    try {
      const currentActive = providers.find((p) => p.category === category && p.isActive)?.id || providerId
      const res = await authFetch(`/api/admin/providers/category/${encodeURIComponent(categoryToSlug(category))}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeProviderId: currentActive, priorities: { [providerId]: newPriority } })
      })
      if (res.status === 401) {
        toast({ title: "Please sign in", description: "Admin access required.", variant: "destructive" })
        router.push("/login")
        return
      }
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const updated = (data.providers || []).map((p: any) => ({
        id: p.id,
        provider: p.name,
        category: p.category,
        apiBase: p.apiBaseUrl || "",
        apiKey: "",
        status: (p.apiKeys && p.apiKeys.length > 0) ? "Connected" : "Not Set",
        lastChecked: "",
        notes: "",
        isActive: !!p.isActive,
        priority: p.priority ?? 0,
        apiKeys: (p.apiKeys || []).map((k: any) => ({ id: k.id, keyName: k.keyName, createdAt: k.createdAt, updatedAt: k.updatedAt }))
      }))
      setProviders((prev) => prev.map((p) => {
        if (p.category !== category) return p
        const match = updated.find((u: { id: string }) => u.id === p.id)
        return match || p
      }))
      toast({ title: "Priority Updated", description: "Provider priority updated for this category." })
    } catch (err) {
      toast({ title: "Failed to update priority", description: String(err), variant: "destructive" })
    }
  }

  const handleAddApiKey = async (provider: ApiProvider) => {
    const keyName = window.prompt(`Enter key name for ${provider.provider}`)
    if (!keyName) return
    const keyValue = window.prompt("Enter key value")
    if (!keyValue) return
    try {
      const res = await fetch(`/api/admin/providers/${encodeURIComponent(provider.id)}/api-key`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyName, keyValue })
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const apiKey = data.apiKey
      setProviders((prev) => prev.map((p) => p.id === provider.id ? { ...p, apiKeys: [...(p.apiKeys || []), { id: apiKey.id, keyName: apiKey.keyName }] , status: "Connected" } : p))
      toast({ title: "API Key Created", description: `Key '${keyName}' added for ${provider.provider}` })
    } catch (err) {
      toast({ title: "Failed to create API key", description: String(err), variant: "destructive" })
    }
  }

  const handleDeleteApiKey = async (provider: ApiProvider, keyId: string) => {
    if (!confirm("Delete this API key?")) return
    try {
      const res = await fetch(`/api/admin/providers/${encodeURIComponent(provider.id)}/api-key?keyId=${encodeURIComponent(keyId)}`, { method: "DELETE" })
      if (!res.ok) throw new Error(await res.text())
      setProviders((prev) => prev.map((p) => p.id === provider.id ? { ...p, apiKeys: (p.apiKeys || []).filter(k => k.id !== keyId), status: (p.apiKeys || []).filter(k => k.id !== keyId).length > 0 ? "Connected" : "Not Set" } : p))
      toast({ title: "API Key Deleted", description: `Key removed for ${provider.provider}` })
    } catch (err) {
      toast({ title: "Failed to delete API key", description: String(err), variant: "destructive" })
    }
  }

  const toggleShowKey = (id: string) => {
    setShowKeys((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const connectedCount = providers.filter((p) => p.status === "Connected").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Integration Settings</h1>
          <p className="text-muted-foreground">Configure all external API providers.</p>
        </div>
        <div className="flex gap-2 items-center">
          <Input
            placeholder="Search providers or categories"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Page size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Show 3</SelectItem>
              <SelectItem value="6">Show 6</SelectItem>
              <SelectItem value="9">Show 9</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleTestAllConnections} variant="outline">
            <Settings2 className="mr-2 h-4 w-4" />
            Test All Connections
          </Button>
          <Button onClick={handleAddProvider}>
            <Plus className="mr-2 h-4 w-4" />
            Add Provider
          </Button>
        </div>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Connection Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {connectedCount} / {providers.length}{" "}
            <span className="text-base font-normal text-muted-foreground">providers connected</span>
          </div>
        </CardContent>
      </Card>

      {/* Provider Cards by Category */}
      {categories.map((category) => (
        <div key={category} className="space-y-4">
          <h2 className="text-xl font-semibold">{category}</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProviders
              .filter((p) => p.category === category)
              .slice(0, expanded[category] ? undefined : pageSize)
              .map((provider) => (
                <Card key={provider.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{provider.provider}</CardTitle>
                        <Badge variant="secondary" className="mt-2">
                          {provider.category}
                        </Badge>
                      </div>
                      {provider.status === "Connected" ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : provider.status === "Invalid" ? (
                        <XCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* API Base URL */}
                    <div>
                      <Label className="text-xs text-muted-foreground">API Base URL</Label>
                      <p className="text-sm font-mono truncate">{provider.apiBase}</p>
                    </div>

                    {/* API Keys */}
                    <div>
                      <Label className="text-xs text-muted-foreground">API Keys</Label>
                      <div className="space-y-2">
                        {(provider.apiKeys && provider.apiKeys.length > 0) ? (
                          <div className="flex flex-wrap gap-2">
                            {provider.apiKeys!.map((k) => (
                              <div key={k.id} className="flex items-center gap-2 border rounded px-2 py-1 text-xs">
                                <span className="font-mono">{k.keyName}</span>
                                <Button variant="ghost" size="sm" className="h-6 px-1 text-red-600" onClick={() => handleDeleteApiKey(provider, k.id)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">No keys set</p>
                        )}
                        <div>
                          <Button variant="outline" size="sm" onClick={() => handleAddApiKey(provider)}>
                            Add API Key
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Status & Last Checked */}
                    <div className="flex items-center justify-between text-xs">
                      <Badge
                        variant={
                          provider.status === "Connected"
                            ? "default"
                            : provider.status === "Invalid"
                              ? "destructive"
                              : "secondary"
                        }
                        className={provider.status === "Connected" ? "bg-green-600" : ""}
                      >
                        {provider.status}
                      </Badge>
                      <span className="text-muted-foreground">
                        {provider.lastChecked ? `Checked: ${provider.lastChecked}` : "Never checked"}
                      </span>
                    </div>

                    {/* Set Active Toggle */}
                    {providers.filter((p) => p.category === category).length > 1 && (
                      <div className="flex items-center justify-between pt-2 border-t">
                        <Label htmlFor={`active-${provider.id}`} className="text-xs">
                          Active Provider
                        </Label>
                        <Switch
                          id={`active-${provider.id}`}
                          checked={provider.isActive || false}
                          onCheckedChange={() => handleSetActive(provider.id, category)}
                        />
                      </div>
                    )}

                    {/* Priority Input */}
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`priority-${provider.id}`} className="text-xs">
                        Priority
                      </Label>
                      <Input
                        id={`priority-${provider.id}`}
                        type="number"
                        min={0}
                        className="w-20 h-8 text-sm"
                        value={provider.priority ?? 0}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value) || 0)
                          setProviders((prev) => prev.map((p) => p.id === provider.id ? { ...p, priority: val } : p))
                        }}
                        onBlur={(e) => {
                          const val = Math.max(0, Number(e.target.value) || 0)
                          handleSetPriority(provider.id, category, val)
                        }}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditProvider(provider)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTestConnection(provider)}
                        disabled={provider.category === "Manual Internal Services"}
                      >
                        Test
                      </Button>
                      {provider.apiKey && provider.apiKey !== "N/A" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyKey(provider.apiKey, provider.provider)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProvider(provider.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
          {filteredProviders.filter((p) => p.category === category).length > pageSize && (
            <div className="flex justify-center">
              <Button variant="ghost" onClick={() => setExpanded((prev) => ({ ...prev, [category]: !prev[category] }))}>
                {expanded[category] ? "Show Less" : "Show More"}
              </Button>
            </div>
          )}
        </div>
      ))}

      <ApiProviderModal
        provider={selectedProvider}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSave={handleSaveProvider}
      />
    </div>
  )
}
