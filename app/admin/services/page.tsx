"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ServiceDetailsModal } from "@/components/admin/service-details-modal"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { authFetch } from "@/lib/client-auth"
import { Badge as UIBadge } from "@/components/ui/badge"
import { EnhancedProviderManager } from "@/components/admin/enhanced-provider-manager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type ServiceType = "automated" | "manual"

interface SubService {
  id: string
  name: string
  type: ServiceType
  status: "up" | "down" | "manual"
  requests: number
  successRate?: number
  avgResponse?: string
  _raw?: { serviceId: string; subServiceId?: string }
}

interface ServiceCategory {
  id: string
  name: string
  services: SubService[]
}

const serviceCategories: ServiceCategory[] = [
  {
    id: "vtu",
    name: "Airtime & Data (VTU)",
    services: [
      {
        id: "vtu-1",
        name: "Airtime Purchase (Maskawa)",
        type: "automated",
        status: "up",
        requests: 245,
        successRate: 98,
        avgResponse: "85ms",
      },
      {
        id: "vtu-2",
        name: "Data Bundle (SubandGain)",
        type: "automated",
        status: "up",
        requests: 198,
        successRate: 96,
        avgResponse: "120ms",
      },
      {
        id: "vtu-3",
        name: "Ported SIM Activation",
        type: "automated",
        status: "up",
        requests: 87,
        successRate: 94,
        avgResponse: "150ms",
      },
    ],
  },
  {
    id: "bills",
    name: "Bills & Education",
    services: [
      {
        id: "bills-1",
        name: "Electricity Payment (Maskawa)",
        type: "automated",
        status: "up",
        requests: 156,
        successRate: 97,
        avgResponse: "200ms",
      },
      {
        id: "bills-2",
        name: "Cable TV Subscription",
        type: "automated",
        status: "up",
        requests: 134,
        successRate: 95,
        avgResponse: "180ms",
      },
      {
        id: "bills-3",
        name: "WAEC Result Checker",
        type: "automated",
        status: "up",
        requests: 89,
        successRate: 99,
        avgResponse: "100ms",
      },
    ],
  },
  {
    id: "bvn",
    name: "BVN Services",
    services: [
      {
        id: "bvn-1",
        name: "BVN Print-Out",
        type: "automated",
        status: "up",
        requests: 342,
        successRate: 97,
        avgResponse: "120ms",
      },
      {
        id: "bvn-2",
        name: "BVN Verification",
        type: "automated",
        status: "up",
        requests: 278,
        successRate: 98,
        avgResponse: "95ms",
      },
      {
        id: "bvn-3",
        name: "BVN Modification",
        type: "manual",
        status: "manual",
        requests: 45,
      },
    ],
  },
  {
    id: "nin",
    name: "NIN Services",
    services: [
      {
        id: "nin-1",
        name: "NIN Slip",
        type: "automated",
        status: "up",
        requests: 298,
        successRate: 96,
        avgResponse: "110ms",
      },
      {
        id: "nin-2",
        name: "NIN Verification",
        type: "automated",
        status: "up",
        requests: 234,
        successRate: 97,
        avgResponse: "105ms",
      },
      {
        id: "nin-3",
        name: "NIN Modification",
        type: "manual",
        status: "manual",
        requests: 84,
      },
    ],
  },
  {
    id: "cac",
    name: "CAC Services",
    services: [
      {
        id: "cac-1",
        name: "Business Name Registration",
        type: "manual",
        status: "manual",
        requests: 67,
      },
      {
        id: "cac-2",
        name: "Company Registration",
        type: "manual",
        status: "manual",
        requests: 45,
      },
      {
        id: "cac-3",
        name: "CAC Certificate Retrieval",
        type: "manual",
        status: "manual",
        requests: 38,
      },
      {
        id: "cac-4",
        name: "CAC Status Report",
        type: "manual",
        status: "manual",
        requests: 27,
      },
    ],
  },
  {
    id: "verification",
    name: "Verification Services",
    services: [
      {
        id: "verify-1",
        name: "Voters Card Verification",
        type: "automated",
        status: "up",
        requests: 156,
        successRate: 94,
        avgResponse: "140ms",
      },
      {
        id: "verify-2",
        name: "Driver's License Verification",
        type: "automated",
        status: "up",
        requests: 123,
        successRate: 96,
        avgResponse: "130ms",
      },
      {
        id: "verify-3",
        name: "International Passport Verification",
        type: "automated",
        status: "up",
        requests: 89,
        successRate: 95,
        avgResponse: "150ms",
      },
    ],
  },
]

// Provider management types
interface ProviderMeta {
  id: string
  name: string
  category: string
  isActive: boolean
  priority: number
  apiBaseUrl?: string | null
  apiKeys?: Array<{ id: string; keyName: string; createdAt: string; updatedAt: string }>
}

export default function ServicesPage() {
  const [selectedService, setSelectedService] = useState<SubService | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleViewService = (service: SubService) => {
    setSelectedService(service)
    setIsModalOpen(true)
  }

  const [providersByCategory, setProvidersByCategory] = useState<Record<string, ProviderMeta[]>>({})
  const [loadingProviders, setLoadingProviders] = useState(false)
  const [liveServices, setLiveServices] = useState<any[]>([])
  const [metricsByService, setMetricsByService] = useState<Record<string, any>>({})
  const [manualToggles, setManualToggles] = useState<Record<string, boolean>>({})
  const [actionMsg, setActionMsg] = useState<string | null>(null)
  const [editedPriorities, setEditedPriorities] = useState<Record<string, number>>({})
  const [savingPriorityId, setSavingPriorityId] = useState<string | null>(null)
  const [dragInfo, setDragInfo] = useState<{ category?: string; providerId?: string } | null>(null)
  const categorySlugMap: Record<string, string> = {
    vtu: "airtime",
    bills: "bills",
    bvn: "bvn",
    nin: "nin",
    cac: "cac",
    verification: "verification",
  }

  const fetchProviders = async () => {
    setLoadingProviders(true)
    try {
      const res = await authFetch("/api/admin/providers")
      if (!res.ok) throw new Error("Failed to fetch providers")
      const data = await res.json()
      setProvidersByCategory(data.providersByCategory || {})
    } catch (error) {
      console.error(error)
      setActionMsg("Failed to load providers")
    } finally {
      setLoadingProviders(false)
    }
  }

  const fetchServices = async () => {
    try {
      const res = await authFetch("/api/admin/services", { method: "GET" })
      const data = await res.json().catch(() => ({}))
      const list = Array.isArray(data?.services) ? data.services : []
      setLiveServices(list)
    } catch (e) {
      console.error("Failed to load services", e)
    }
  }

  const fetchMetrics = async () => {
    try {
      const res = await authFetch("/api/admin/services/metrics", { method: "GET" })
      const data = await res.json().catch(() => ({}))
      const byService = (data?.byService || {}) as Record<string, any>
      setMetricsByService(byService)
    } catch (e) {
      console.error("Failed to load metrics", e)
    }
  }

  const fetchManualToggles = async () => {
    try {
      const res = await authFetch("/api/admin/services/manual", { method: "GET" })
      const data = await res.json().catch(() => ({}))
      const toggles = (data?.toggles || {}) as Record<string, boolean>
      setManualToggles(toggles)
    } catch (e) {
      console.error("Failed to load manual toggles", e)
    }
  }

  useEffect(() => {
    fetchProviders()
    fetchServices()
    fetchMetrics()
    fetchManualToggles()
    const interval = setInterval(() => {
      fetchMetrics()
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const setManualOnly = async (serviceId: string, subServiceId: string, enabled: boolean) => {
    try {
      const res = await authFetch("/api/admin/services/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, subServiceId, manualOnly: enabled })
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        const key = `manual_only:${serviceId}:${subServiceId}`
        setManualToggles((prev) => ({ ...prev, [key]: enabled }))
        setActionMsg(`Manual-only ${enabled ? "enabled" : "disabled"} for ${serviceId}/${subServiceId}`)
      } else {
        setActionMsg(data?.error || "Failed to set manual-only toggle")
      }
    } catch (e) {
      setActionMsg("Error updating manual-only toggle")
    }
  }

  const activateProvider = async (category: string, providerId: string) => {
    try {
      setActionMsg(null)
      const res = await authFetch(`/api/admin/providers/category/${encodeURIComponent(category)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeProviderId: providerId })
      })
      const data = await res.json()
      if (res.ok) {
        setActionMsg(`Activated provider for ${category}`)
        fetchProviders()
      } else {
        setActionMsg(data?.error || "Failed to activate provider")
      }
    } catch (e) {
      setActionMsg("Error activating provider")
    }
  }

  const openApiKeyModal = (providerId: string, providerName: string) => {
    setApiKeyModal({ open: true, providerId, providerName })
    setNewKeyName("")
    setNewKeyValue("")
  }

  const createApiKey = async () => {
    if (!apiKeyModal.providerId) return
    try {
      setActionMsg(null)
      const res = await authFetch(`/api/admin/providers/${apiKeyModal.providerId}/api-key`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyName: newKeyName, keyValue: newKeyValue })
      })
      const data = await res.json()
      if (res.ok) {
        setActionMsg("API key created")
        setApiKeyModal({ open: false })
        fetchProviders()
      } else {
        setActionMsg(data?.error || "Failed to create API key")
      }
    } catch (e) {
      setActionMsg("Error creating API key")
    }
  }

  const deleteApiKey = async (providerId: string, keyId: string) => {
    try {
      setActionMsg(null)
      const res = await authFetch(`/api/admin/providers/${providerId}/api-key?keyId=${encodeURIComponent(keyId)}`, {
        method: "DELETE"
      })
      const data = await res.json()
      if (res.ok) {
        setActionMsg("API key deleted")
        fetchProviders()
      } else {
        setActionMsg(data?.error || "Failed to delete API key")
      }
    } catch (e) {
      setActionMsg("Error deleting API key")
    }
  }

  const setPriorityLocal = (providerId: string, value: number) => {
    const safe = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0
    setEditedPriorities((prev) => ({ ...prev, [providerId]: safe }))
  }

  const savePriority = async (providerId: string) => {
    const value = editedPriorities[providerId]
    if (value === undefined || value === null) return
    try {
      setSavingPriorityId(providerId)
      setActionMsg(null)
      const res = await authFetch(`/api/admin/providers/${providerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: Number(value) })
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setActionMsg("Priority updated")
        setSavingPriorityId(null)
        // refresh and clear local edit
        await fetchProviders()
        setEditedPriorities((prev) => {
          const next = { ...prev }
          delete next[providerId]
          return next
        })
      } else {
        setSavingPriorityId(null)
        setActionMsg(data?.error || "Failed to update priority")
      }
    } catch (e) {
      setSavingPriorityId(null)
      setActionMsg("Error updating priority")
    }
  }

  const onDragStart = (category: string, providerId: string) => {
    setDragInfo({ category, providerId })
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const onDropProvider = async (category: string, targetProviderId: string) => {
    if (!dragInfo || dragInfo.category !== category || dragInfo.providerId === targetProviderId) return
    const list = providersByCategory[category] || []
    const fromIdx = list.findIndex((p) => p.id === dragInfo.providerId)
    const toIdx = list.findIndex((p) => p.id === targetProviderId)
    if (fromIdx < 0 || toIdx < 0) return
    const newList = [...list]
    const [moved] = newList.splice(fromIdx, 1)
    newList.splice(toIdx, 0, moved)
    setProvidersByCategory((prev) => ({ ...prev, [category]: newList }))

    // Persist priorities: earlier rows get higher priority integers
    const priorities: Record<string, number> = {}
    for (let i = 0; i < newList.length; i++) {
      const p = newList[i]
      priorities[p.id] = newList.length - i // highest at top
    }
    try {
      const res = await authFetch(`/api/admin/providers/category/${encodeURIComponent(category)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priorities })
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setActionMsg("Provider order saved")
        fetchProviders()
      } else {
        setActionMsg(data?.error || "Failed to save provider order")
      }
    } catch (e) {
      setActionMsg("Error saving provider order")
    } finally {
      setDragInfo(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Service Management</h1>
        <p className="text-muted-foreground">Manage all UFriends services and monitor their performance.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Services</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {(liveServices.length
              ? liveServices.map((svc: any) => ({
                  id: svc.id,
                  name: svc.name,
                  services: (svc.subServices || []).map((sub: any, idx: number) => {
                    const manualKey = `manual_only:${svc.id}:${sub?.id}`
                    const manual = !!manualToggles[manualKey]
                    const m = metricsByService[svc.id]
                    const subMetrics = (m?.bySubService || {})[sub?.id ?? "unknown"]
                    const total = subMetrics?.total || 0
                    const success = subMetrics?.success || 0
                    const successRate = total > 0 ? Math.round((success / total) * 100) : undefined
                    return {
                      id: `${svc.id}-${sub?.id ?? idx}`,
                      name: sub?.name ?? "Service",
                      type: manual ? "manual" : ("automated" as const),
                      status: manual ? "manual" : (svc.isAvailable ? "up" : "down"),
                      requests: total,
                      successRate,
                      avgResponse: undefined,
                      _raw: { serviceId: svc.id, subServiceId: sub?.id },
                    }
                  }),
                }))
              : serviceCategories).map((category) => (
              <AccordionItem key={category.id} value={category.id}>
                <AccordionTrigger className="text-lg font-semibold">{category.name}</AccordionTrigger>
                <AccordionContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sub-Service</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Requests</TableHead>
                        <TableHead>Success Rate</TableHead>
                        <TableHead>Avg Response</TableHead>
                        <TableHead>Manual Only</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {category.services.map((service) => (
                        <TableRow key={service.id}>
                          <TableCell className="font-medium">{service.name}</TableCell>
                          <TableCell>
                            <Badge variant={service.type === "automated" ? "default" : "secondary"}>
                              {service.type === "automated" ? "Automated" : "Manual"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {(() => {
                              // Prefer live provider info when available
                              if (liveServices.length) {
                                const live = liveServices.find((s: any) => s.id === category.id)
                                const activeName = live?.providerInfo?.provider?.name
                                const fallbacks = (live?.providerInfo?.fallbackProviders || [])
                                if (activeName) {
                                  return (
                                    <span className="text-sm flex items-center gap-2">
                                      <UIBadge variant="default" className="bg-green-600">{activeName}</UIBadge>
                                      {fallbacks.length > 0 && (
                                        <span className="text-muted-foreground">→ Fallbacks by priority</span>
                                      )}
                                    </span>
                                  )
                                }
                                return <span className="text-sm text-muted-foreground">No active provider</span>
                              }
                              // Fallback to providersByCategory mapping
                              const slug = categorySlugMap[category.id]
                              const providers = providersByCategory[slug] || providersByCategory[category.id] || []
                              const active = providers.find((p) => p.isActive)
                              return active ? (
                                <span className="text-sm flex items-center gap-2">
                                  <UIBadge variant="default" className="bg-green-600">{active.name}</UIBadge>
                                  {providers.filter((p) => !p.isActive && p.priority > 0).length > 0 && (
                                    <span className="text-muted-foreground">→ Fallbacks by priority</span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-sm text-muted-foreground">No active provider</span>
                              )
                            })()}
                          </TableCell>
                          <TableCell>
                            {service.status === "up" && (
                              <Badge variant="default" className="bg-green-600">
                                Up
                              </Badge>
                            )}
                            {service.status === "down" && <Badge variant="destructive">Down</Badge>}
                            {service.status === "manual" && <Badge variant="secondary">Manual</Badge>}
                          </TableCell>
                          <TableCell>{service.requests}</TableCell>
                          <TableCell>{service.successRate ? `${service.successRate}%` : "—"}</TableCell>
                          <TableCell>{service.avgResponse || "—"}</TableCell>
                          <TableCell>
                            {(() => {
                              const raw = (service as any)._raw
                              if (!raw) return <span className="text-sm text-muted-foreground">—</span>
                              const manualKey = `manual_only:${raw.serviceId}:${raw.subServiceId}`
                              const checked = !!manualToggles[manualKey]
                              return (
                                <label className="flex items-center gap-2 text-sm">
                                  <Input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => setManualOnly(raw.serviceId, raw.subServiceId, e.target.checked)}
                                  />
                                  <span>{checked ? "On" : "Off"}</span>
                                </label>
                              )
                            })()}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewService({
                                ...service,
                                _raw: { ...(service as any)._raw, serviceId: category.id }
                              })}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {selectedService && (() => {
        const svcId = (selectedService as any)._raw?.serviceId as string | undefined
        const live = svcId ? liveServices.find((s: any) => s.id === svcId) : null
        const activeProvider = live?.providerInfo?.provider
        const providerName = activeProvider?.name as string | undefined
        const providerBaseUrl = (activeProvider?.apiBaseUrl ?? null) as string | null
        return (
          <ServiceDetailsModal
            service={selectedService}
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            providerName={providerName}
            providerBaseUrl={providerBaseUrl}
          />
        )
      })()}

      {/* Enhanced Provider Management */}
      {/* Removed to keep provider management in dedicated /admin/providers page */}
      {/* <EnhancedProviderManager /> */}

    </div>
  )
}
