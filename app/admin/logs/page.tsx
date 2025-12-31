"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ActivityLogModal } from "@/components/admin/activity-log-modal"
import { Search, Paperclip } from "lucide-react"
import { authFetch } from "@/lib/client-auth"
import { ensureAbsoluteUrl } from "@/lib/utils"

interface ActivityLog {
  id: string
  date: string
  user: string
  userEmail: string
  category: string
  subService: string
  details: string
  status: "completed" | "pending" | "failed" | "processing"
  photo?: string
  refId: string
  type?: "Automated" | "Manual"
  evidence?: {
    url: string
    name: string
    uploadedAt: string
  }
  adminNotes?: string
}

const STORAGE_KEY = "ufriends_serviceLogs"

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  type AuditLog = { id: string; actorId: string | null; action: string; resourceType: string; resourceId: string | null; diffJson?: any; createdAt: string }
  const [walletAdjustLogs, setWalletAdjustLogs] = useState<AuditLog[]>([])
  const [referenceTerm, setReferenceTerm] = useState("")
  const [referenceLoading, setReferenceLoading] = useState(false)
  const [referenceResult, setReferenceResult] = useState<null | {
    transaction: {
      id: string
      userId: string
      type: string
      amount: number
      status: string
      reference: string
      meta: any
      createdAt: string
      provider: { id: string; name: string; category: string } | null
    }
    auditLogs: Array<{ id: string; action: string; resourceType: string; resourceId: string | null; createdAt: string; diffJson?: any }>
  }>(null)

  useEffect(() => {
    // Load general audit logs into ActivityLog format
    authFetch(`/api/admin/audit-logs?take=200`)
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        if (data?.ok && Array.isArray(data.logs)) {
          const mapped = data.logs.map((l: any) => ({
            id: l.id,
            date: new Date(l.createdAt).toISOString().slice(0, 16).replace("T", " "),
            user: l.actorId || "system",
            userEmail: "",
            category: l.resourceType === "Transaction" ? (l.diffJson?.serviceId || "Transaction") : (l.resourceType || "Audit"),
            subService: l.diffJson?.subServiceId || l.diffJson?.action || l.action || "",
            details: (() => {
              if (!l.diffJson) return ""
              const { params, amount, ...rest } = l.diffJson
              const parts = []
              if (amount) parts.push(`Amount: ₦${amount}`)
              if (params) {
                for (const [key, val] of Object.entries(params)) {
                  parts.push(`${key}: ${val}`)
                }
              }
              // Add other relevant fields if needed, or keep it clean
              if (rest.error || rest.reason) parts.push(`Error: ${rest.error || rest.reason}`)
              return parts.join("\n")
            })(),
            status: "completed" as const, // In a real app we might derive this from l.diffJson.status if available
            refId: l.resourceId || l.id,
            type: "Automated" as const,
          }))
          setLogs(mapped)
        }
      })
      .catch(() => { })

    // Load wallet adjustment audit logs
    authFetch(`/api/admin/audit-logs?action=WALLET_ADMIN_ADJUST&take=100`)
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        if (data?.ok && Array.isArray(data.logs)) setWalletAdjustLogs(data.logs)
      })
      .catch(() => { })
  }, [])

  const lookupReference = async () => {
    const ref = referenceTerm.trim()
    if (!ref) return
    setReferenceLoading(true)
    setReferenceResult(null)
    try {
      const res = await authFetch(`/api/admin/service/logs/${encodeURIComponent(ref)}`)
      const data = await res.json().catch(() => ({}))
      if (res.ok && data?.ok) {
        setReferenceResult({ transaction: data.transaction, auditLogs: data.auditLogs || [] })
      } else {
        setReferenceResult(null)
      }
    } catch {
      setReferenceResult(null)
    } finally {
      setReferenceLoading(false)
    }
  }

  const handleViewLog = (log: ActivityLog) => {
    setSelectedLog(log)
    setIsModalOpen(true)
  }

  const handleUpdateLog = (updatedLog: ActivityLog) => {
    const updatedLogs = logs.map((log) => (log.id === updatedLog.id ? updatedLog : log))
    setLogs(updatedLogs)
  }

  const handleViewEvidence = (evidence: { url: string; name: string }) => {
    window.open(ensureAbsoluteUrl(evidence.url), "_blank")
  }

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.subService.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.refId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === "all" || log.category === filterCategory
    const matchesStatus = filterStatus === "all" || log.status === filterStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Service Activity Logs</h1>
        <p className="text-muted-foreground">Track and manage all user service requests.</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Label>Search</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="User, service, or ref ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="BVN">BVN</SelectItem>
                  <SelectItem value="NIN">NIN</SelectItem>
                  <SelectItem value="CAC">CAC</SelectItem>
                  <SelectItem value="VTU">VTU</SelectItem>
                  <SelectItem value="Bills">Bills</SelectItem>
                  <SelectItem value="Verification">Verification</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setFilterCategory("all")
                  setFilterStatus("all")
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Adjustments (AuditLog) */}
      <Card>
        <CardHeader>
          <CardTitle>Wallet Adjustments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Admin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {walletAdjustLogs
                  .filter((l) => !searchTerm || (l.resourceId || "").toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((l) => {
                    const delta = Number(l?.diffJson?.delta ?? 0)
                    const reason = String(l?.diffJson?.reason ?? "")
                    return (
                      <TableRow key={l.id}>
                        <TableCell className="text-sm">{new Date(l.createdAt).toLocaleString()}</TableCell>
                        <TableCell className="text-sm font-mono">{l.resourceId}</TableCell>
                        <TableCell className="text-sm font-semibold">₦{delta.toLocaleString()}</TableCell>
                        <TableCell className="text-sm">{reason || "—"}</TableCell>
                        <TableCell className="text-sm font-mono">{l.actorId || "—"}</TableCell>
                      </TableRow>
                    )
                  })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Reference Lookup */}
      <Card>
        <CardHeader>
          <CardTitle>Lookup by Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 items-end">
            <div className="md:col-span-2">
              <Label>Transaction Reference</Label>
              <Input
                value={referenceTerm}
                onChange={(e) => setReferenceTerm(e.target.value)}
                placeholder="Enter reference (e.g., TXR-12345)"
                className="mt-2 font-mono"
              />
            </div>
            <div>
              <Button onClick={lookupReference} disabled={referenceLoading || !referenceTerm.trim()} className="w-full">
                {referenceLoading ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>

          {referenceResult && (
            <div className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label>Reference</Label>
                  <p className="mt-2 font-mono text-sm">{referenceResult.transaction.reference}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-2">
                    <Badge variant={referenceResult.transaction.status === "SUCCESS" ? "default" : referenceResult.transaction.status === "PENDING" ? "secondary" : referenceResult.transaction.status === "PROCESSING" ? "outline" : "destructive"}>
                      {referenceResult.transaction.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Amount</Label>
                  <p className="mt-2 font-semibold">₦{Number(referenceResult.transaction.amount || 0).toLocaleString()}</p>
                </div>
                <div>
                  <Label>User ID</Label>
                  <p className="mt-2 font-mono text-sm">{referenceResult.transaction.userId}</p>
                </div>
                <div>
                  <Label>Provider</Label>
                  <p className="mt-2">{referenceResult.transaction.provider ? `${referenceResult.transaction.provider.name} (${referenceResult.transaction.provider.category})` : "—"}</p>
                </div>
                <div>
                  <Label>Created</Label>
                  <p className="mt-2">{new Date(referenceResult.transaction.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <Label>Metadata</Label>
                <p className="mt-2 rounded-lg border bg-muted p-3 text-xs overflow-auto">
                  {JSON.stringify(referenceResult.transaction.meta || {}, null, 2)}
                </p>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(referenceResult.auditLogs || []).map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="text-sm">{new Date(l.createdAt).toLocaleString()}</TableCell>
                        <TableCell className="text-sm">{l.action}</TableCell>
                        <TableCell className="text-sm">{l.resourceType}:{l.resourceId}</TableCell>
                        <TableCell className="text-xs max-w-md truncate">{JSON.stringify(l.diffJson || {})}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Logs ({filteredLogs.length} results)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Sub-Service</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Evidence</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.date}</TableCell>
                  <TableCell>{log.user}</TableCell>
                  <TableCell>{log.category}</TableCell>
                  <TableCell>{log.subService}</TableCell>
                  <TableCell className="max-w-xs truncate">{log.details}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        log.status === "completed"
                          ? "default"
                          : log.status === "pending"
                            ? "secondary"
                            : log.status === "processing"
                              ? "outline"
                              : "destructive"
                      }
                    >
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {log.evidence ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewEvidence(log.evidence!)}
                        className="gap-1"
                      >
                        <Paperclip className="h-4 w-4" />
                        View
                      </Button>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => handleViewLog(log)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredLogs.length)} of{" "}
              {filteredLogs.length} results
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedLog && (
        <ActivityLogModal
          log={selectedLog}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onUpdate={handleUpdateLog}
        />
      )}
    </div>
  )
}
