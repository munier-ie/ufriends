"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Settings, TestTube, CheckCircle, XCircle, AlertTriangle, Edit, Trash2, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { authFetch } from "@/lib/client-auth"

interface ProviderTemplate {
  id: string
  name: string
  category: string
  description: string
  baseUrl: string
  requiredFields: string[]
  optionalFields: string[]
  configTemplate: Record<string, any>
}

interface Provider {
  id: string
  name: string
  category: string
  apiBaseUrl: string
  isActive: boolean
  priority: number
  configJson?: Record<string, any>
  apiKeys?: Array<{ id: string; keyName: string; keyValue?: string }>
}

const PROVIDER_TEMPLATES: ProviderTemplate[] = [
  {
    id: "prembly",
    name: "Prembly",
    category: "verification",
    description: "Identity verification and background checks",
    baseUrl: "https://api.prembly.com",
    requiredFields: ["api_key"],
    optionalFields: ["app_id", "app_username"],
    configTemplate: { adapter: "prembly" }
  },
  {
    id: "prembly-nin",
    name: "Prembly (NIN)",
    category: "nin",
    description: "Prembly for NIN services (slip, printout)",
    baseUrl: "https://api.prembly.com",
    requiredFields: ["api_key"],
    optionalFields: ["app_id", "app_username"],
    configTemplate: { adapter: "prembly", service: "nin" }
  },
  {
    id: "prembly-bvn",
    name: "Prembly (BVN)",
    category: "bvn",
    description: "Prembly for BVN services (retrieval, printout)",
    baseUrl: "https://api.prembly.com",
    requiredFields: ["api_key"],
    optionalFields: ["app_id", "app_username"],
    configTemplate: { adapter: "prembly", service: "bvn" }
  },
  {
    id: "prembly-cac",
    name: "Prembly (CAC)",
    category: "cac",
    description: "Prembly for CAC services (retrieval, status report)",
    baseUrl: "https://api.prembly.com",
    requiredFields: ["api_key"],
    optionalFields: ["app_id", "app_username"],
    configTemplate: { adapter: "prembly", service: "cac" }
  },
  {
    id: "subandgain",
    name: "SubAndGain",
    category: "vtu",
    description: "Airtime, data, and bill payments",
    baseUrl: "https://subandgain.com",
    requiredFields: ["api_key", "username"],
    optionalFields: [],
    configTemplate: { adapter: "subandgain" }
  },
  {
    id: "subandgain-bills",
    name: "SubAndGain (Bills)",
    category: "bills",
    description: "SubAndGain for bills and education",
    baseUrl: "https://subandgain.com",
    requiredFields: ["api_key", "username"],
    optionalFields: [],
    configTemplate: { adapter: "subandgain" }
  },
  {
    id: "portedsim",
    name: "PortedSIM",
    category: "vtu",
    description: "Airtime and data services",
    baseUrl: "https://api.portedsim.com",
    requiredFields: ["api_key"],
    optionalFields: ["secret_key"],
    configTemplate: { adapter: "portedsim" }
  },
  {
    id: "maskawa",
    name: "Maskawa",
    category: "vtu",
    description: "Airtime, data, bills, and education",
    baseUrl: "",
    requiredFields: ["api_key"],
    optionalFields: ["username"],
    configTemplate: { adapter: "maskawa" }
  },
  {
    id: "maskawa-bills",
    name: "Maskawa (Bills)",
    category: "bills",
    description: "Maskawa for bills and education",
    baseUrl: "",
    requiredFields: ["api_key"],
    optionalFields: ["username"],
    configTemplate: { adapter: "maskawa" }
  }
]

export function EnhancedProviderManager() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ProviderTemplate | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [testing, setTesting] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<any>(null)
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({})
  const [newKeyName, setNewKeyName] = useState("")
  const [newKeyValue, setNewKeyValue] = useState("")

  const categories = [
    { id: "vtu", name: "Airtime & Data", icon: "📱" },
    { id: "bills", name: "Bills & Education", icon: "💡" },
    { id: "bvn", name: "BVN Services", icon: "🆔" },
    { id: "nin", name: "NIN Services", icon: "🆔" },
    { id: "cac", name: "CAC Services", icon: "🏢" },
    { id: "verification", name: "Verification Services", icon: "✅" }
  ]

  useEffect(() => {
    fetchProviders()
  }, [])

  const fetchProviders = async () => {
    setLoading(true)
    try {
      const res = await authFetch("/api/admin/providers?flat=true")
      if (!res.ok) throw new Error("Failed to fetch providers")
      const data = await res.json()
      setProviders(Array.isArray(data.providers) ? data.providers : [])
    } catch (error) {
      toast.error("Failed to load providers")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddProvider = (template: ProviderTemplate) => {
    setSelectedTemplate(template)
    setFormData({
      name: template.name,
      category: template.category,
      apiBaseUrl: template.baseUrl,
      priority: 10,
      ...template.configTemplate
    })
    setShowAddModal(true)
  }

  const handleEditProvider = (provider: Provider) => {
    setSelectedProvider(provider)
    setFormData({
      name: provider.name,
      category: provider.category,
      apiBaseUrl: provider.apiBaseUrl,
      priority: provider.priority,
      ...provider.configJson
    })
    setShowEditModal(true)
  }

  const persistApiKeys = async (providerId: string, fields: string[]) => {
    const toSave = fields.filter((f) => typeof formData[f] === "string" && formData[f])
    if (toSave.length === 0) return
    await Promise.all(
      toSave.map((keyName) =>
        authFetch(`/api/admin/providers/${providerId}/api-key`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keyName, keyValue: String(formData[keyName]) })
        })
      )
    )
  }

  const handleSubmit = async (isEdit = false) => {
    try {
      const url = isEdit ? `/api/admin/providers/${selectedProvider?.id}` : "/api/admin/providers"
      const method = isEdit ? "PATCH" : "POST"

      const payload = {
        name: formData.name,
        category: formData.category,
        apiBaseUrl: formData.apiBaseUrl,
        priority: formData.priority,
        configJson: { ...formData }
      }

      const res = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error("Failed to save provider")
      const json = await res.json()
      const providerId = json?.provider?.id || selectedProvider?.id

      if (!isEdit && selectedTemplate && providerId) {
        const fields = [...selectedTemplate.requiredFields, ...selectedTemplate.optionalFields]
        await persistApiKeys(providerId, fields)
      }

      toast.success(`Provider ${isEdit ? 'updated' : 'added'} successfully`)
      await fetchProviders()
      setShowAddModal(false)
      setShowEditModal(false)
      setFormData({})
      setSelectedProvider(null)
      setSelectedTemplate(null)
      setNewKeyName("")
      setNewKeyValue("")
    } catch (error) {
      toast.error(`Failed to ${isEdit ? 'update' : 'add'} provider`)
      console.error(error as any)
    }
  }

  const handleActivateProvider = async (providerId: string, activate: boolean) => {
    try {
      const res = await authFetch(`/api/admin/providers/${providerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: activate })
      })

      if (!res.ok) throw new Error("Failed to update provider status")
      
      toast.success(`Provider ${activate ? 'activated' : 'deactivated'}`)
      fetchProviders()
    } catch (error) {
      toast.error("Failed to update provider status")
      console.error(error)
    }
  }

  const handleDeleteProvider = async (providerId: string) => {
    if (!confirm("Are you sure you want to delete this provider?")) return
    
    try {
      const res = await authFetch(`/api/admin/providers/${providerId}`, {
        method: "DELETE"
      })

      if (!res.ok) throw new Error("Failed to delete provider")
      
      toast.success("Provider deleted successfully")
      fetchProviders()
    } catch (error) {
      toast.error("Failed to delete provider")
      console.error(error)
    }
  }

  const handleTestProvider = async (provider: Provider) => {
    setTesting(provider.id)
    setTestResult(null)
    
    try {
      const res = await authFetch(`/api/admin/providers/${provider.id}/test`, {
        method: "POST"
      })

      const result = await res.json()
      setTestResult(result)
      
      if (result.success) {
        toast.success("Provider test successful")
      } else {
        toast.error("Provider test failed")
      }
    } catch (error) {
      toast.error("Failed to test provider")
      setTestResult({ success: false, error: error.message })
    } finally {
      setTesting(null)
    }
  }

  const toggleApiKeyVisibility = (providerId: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [providerId]: !prev[providerId]
    }))
  }

  const handleAddApiKey = async () => {
    if (!selectedProvider?.id) {
      toast.error("No provider selected")
      return
    }
    if (!newKeyName.trim() || !newKeyValue.trim()) {
      toast.error("Enter key name and value")
      return
    }
    try {
      const res = await authFetch(`/api/admin/providers/${selectedProvider.id}/api-key`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyName: newKeyName.trim(), keyValue: newKeyValue.trim() })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || "Failed to create API key")
      }
      toast.success("API key saved")
      setNewKeyName("")
      setNewKeyValue("")
      await fetchProviders()
    } catch (err: any) {
      toast.error(String(err?.message || err || "Failed to save API key"))
    }
  }

  const handleDeleteApiKey = async (providerId: string, keyId: string) => {
    if (!providerId || !keyId) return
    try {
      const res = await authFetch(`/api/admin/providers/${providerId}/api-key?keyId=${encodeURIComponent(keyId)}`, {
        method: "DELETE"
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || "Failed to delete API key")
      }
      toast.success("API key deleted")
      await fetchProviders()
    } catch (err: any) {
      toast.error(String(err?.message || err || "Failed to delete API key"))
    }
  }

  const getProvidersByCategory = () => {
    const grouped: Record<string, Provider[]> = {}
    providers.forEach(provider => {
      if (!grouped[provider.category]) {
        grouped[provider.category] = []
      }
      grouped[provider.category].push(provider)
    })
    return grouped
  }

  const getTemplateForCategory = (categoryId: string) => {
    return PROVIDER_TEMPLATES.filter(template => template.category === categoryId)
  }

  const providersByCategory = getProvidersByCategory()

  return (
    <div className="space-y-6">
      {/* Quick Add Provider Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Quick Add Provider
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PROVIDER_TEMPLATES.map(template => (
              <Card key={template.id} className="border-2 hover:border-blue-300 transition-colors">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{template.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                  <Badge variant="outline" className="mb-3">
                    {categories.find(c => c.id === template.category)?.name}
                  </Badge>
                  <Button 
                    className="w-full" 
                    size="sm"
                    onClick={() => handleAddProvider(template)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Provider
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Provider Management by Category */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid grid-cols-3 md:grid-cols-6">
          <TabsTrigger value="all">All</TabsTrigger>
          {categories.map(category => (
            <TabsTrigger key={category.id} value={category.id}>
              {category.icon} {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all">
          {categories.map(category => {
            const categoryProviders = providersByCategory[category.id] || []
            return (
              <Card key={category.id} className="mb-4">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{category.icon} {category.name}</span>
                    <div className="flex gap-2">
                      {getTemplateForCategory(category.id).map(template => (
                        <Button
                          key={template.id}
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddProvider(template)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add {template.name}
                        </Button>
                      ))}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {categoryProviders.length === 0 ? (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        No providers configured for {category.name}. Click "Add Provider" to get started.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      {categoryProviders.map(provider => (
                        <Card key={provider.id} className={provider.isActive ? "border-green-300" : "border-gray-300"}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold">{provider.name}</h4>
                                  <Badge variant={provider.isActive ? "default" : "secondary"}>
                                    {provider.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                  <Badge variant="outline">Priority: {provider.priority}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {provider.apiBaseUrl}
                                </p>
                                {provider.apiKeys && provider.apiKeys.length > 0 && (
                                  <div className="space-y-1">
                                    {provider.apiKeys.map(key => (
                                      <div key={key.id} className="flex items-center gap-2 text-sm">
                                        <span className="font-medium">{key.keyName}:</span>
                                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                          {showApiKeys[provider.id] ? key.keyValue : "••••••••"}
                                        </code>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => toggleApiKeyVisibility(provider.id)}
                                        >
                                          {showApiKeys[provider.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleTestProvider(provider)}
                                  disabled={testing === provider.id}
                                >
                                  <TestTube className="h-4 w-4 mr-1" />
                                  {testing === provider.id ? "Testing..." : "Test"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditProvider(provider)}
                                >
                                  <Settings className="h-4 w-4 mr-1" />
                                  Configure
                                </Button>
                                <Button
                                  size="sm"
                                  variant={provider.isActive ? "destructive" : "default"}
                                  onClick={() => handleActivateProvider(provider.id, !provider.isActive)}
                                >
                                  {provider.isActive ? "Deactivate" : "Activate"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteProvider(provider.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            {testResult && testing === null && (
                              <Alert className="mt-3">
                                {testResult.success ? (
                                  <>
                                    <CheckCircle className="h-4 w-4" />
                                    <AlertDescription>
                                      Provider test successful! Response: {JSON.stringify(testResult.data)}
                                    </AlertDescription>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-4 w-4" />
                                    <AlertDescription>
                                      Provider test failed: {testResult.error}
                                    </AlertDescription>
                                  </>
                                )}
                              </Alert>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>

        {categories.map(category => (
          <TabsContent key={category.id} value={category.id}>
            {/* Category-specific content */}
          </TabsContent>
        ))}
      </Tabs>

      {/* Add Provider Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add {selectedTemplate?.name} Provider</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Provider Name</Label>
                <Input
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter provider name"
                />
              </div>
              <div>
                <Label>Priority</Label>
                <Input
                  type="number"
                  value={formData.priority || 10}
                  onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                  placeholder="Priority (higher = first fallback)"
                />
              </div>
            </div>
            <div>
              <Label>Base URL</Label>
              <Input
                value={formData.apiBaseUrl || ""}
                onChange={(e) => setFormData({ ...formData, apiBaseUrl: e.target.value })}
                placeholder="https://api.example.com"
              />
            </div>
            {selectedTemplate?.requiredFields.map(field => (
              <div key={field}>
                <Label className="flex items-center gap-1">
                  {field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ')}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData[field] || ""}
                  onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                  placeholder={`Enter ${field.replace(/_/g, ' ')}`}
                />
              </div>
            ))}
            {selectedTemplate?.optionalFields.map(field => (
              <div key={field}>
                <Label>{field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ')}</Label>
                <Input
                  value={formData[field] || ""}
                  onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                  placeholder={`Enter ${field.replace(/_/g, ' ')} (optional)`}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button onClick={() => handleSubmit(false)}>Add Provider</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Provider Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit {selectedProvider?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Provider Name</Label>
                <Input
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Priority</Label>
                <Input
                  type="number"
                  value={formData.priority || 10}
                  onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <Label>Base URL</Label>
              <Input
                value={formData.apiBaseUrl || ""}
                onChange={(e) => setFormData({ ...formData, apiBaseUrl: e.target.value })}
              />
            </div>
            {/* Add API Key Management */}
            <div className="space-y-2">
              <Label>API Keys</Label>
              <div className="space-y-2">
                {selectedProvider?.apiKeys?.map(key => (
                  <div key={key.id} className="flex items-center gap-2">
                    <Input value={key.keyName} readOnly className="flex-1" />
                    <Input 
                      value={selectedProvider?.id && showApiKeys[selectedProvider.id] ? (key.keyValue || '') : "••••••••"} 
                      readOnly 
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => selectedProvider?.id && toggleApiKeyVisibility(selectedProvider.id)}
                    >
                      {selectedProvider?.id && showApiKeys[selectedProvider.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => key.id && selectedProvider?.id && handleDeleteApiKey(selectedProvider.id, key.id)}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Input
                  placeholder="Key name (e.g., api_key)"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
                <Input
                  placeholder="Key value"
                  value={newKeyValue}
                  onChange={(e) => setNewKeyValue(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <Button size="sm" onClick={handleAddApiKey}>Add/Update Key</Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button onClick={() => handleSubmit(true)}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}