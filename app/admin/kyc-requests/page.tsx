"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Eye, CheckCircle2, Clock, XCircle, ShieldCheck, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface AdminKycItem {
  id: string
  userId: string
  userEmail: string
  type: "BVN" | "NIN"
  status: "PENDING" | "APPROVED" | "REJECTED"
  submittedAt: string
  reviewedAt?: string | null
  documents: { id: string; type: string; fileUrl: string }[]
}

export default function AdminKYCRequestsPage() {
  const [requests, setRequests] = useState<AdminKycItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [approvalNote, setApprovalNote] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  const selectedRequest = useMemo(() => requests.find((r) => r.id === selectedId), [requests, selectedId])

  const statusCounts = useMemo(() => {
    const totals = { total: 0, pending: 0, approved: 0, rejected: 0 }
    requests.forEach((r) => {
      totals.total += 1
      if (r.status === "PENDING") totals.pending += 1
      else if (r.status === "APPROVED") totals.approved += 1
      else if (r.status === "REJECTED") totals.rejected += 1
    })
    return totals
  }, [requests])

  const filteredRequests = useMemo(() => {
    let filtered = [...requests]
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (req) =>
          req.userEmail?.toLowerCase().includes(term) ||
          req.userId.toLowerCase().includes(term) ||
          req.type.toLowerCase().includes(term),
      )
    }
    // This filter is now applied on the server, but we keep it for immediate client-side feedback if needed
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((req) => req.status === statusFilter)
    }
    return filtered
  }, [requests, searchTerm, statusFilter])

  const loadRequests = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== "ALL") params.set("status", statusFilter)
      if (fromDate) params.set("from", fromDate)
      if (toDate) params.set("to", toDate)
      const res = await fetch(`/api/admin/kyc?${params.toString()}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to load KYC list")
      setRequests(data.items || [])
    } catch (e: any) {
      toast.error(e?.message || "Failed to load KYC requests")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [statusFilter]) // Reload when status filter changes

  const handleViewDetails = (id: string) => {
    setSelectedId(id)
    setApprovalNote("")
    setIsModalOpen(true)
  }

  const handleApprove = async () => {
    if (!selectedId) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/kyc/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED", note: approvalNote || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to approve")
      toast.success("KYC Approved", { description: data?.reviewedByEmail ? `By ${data.reviewedByEmail}` : "" })
      setApprovalNote("")
      setSelectedId(null)
      setIsModalOpen(false)
      await loadRequests() // Refresh list
    } catch (e: any) {
      toast.error("Error", { description: e.message })
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!selectedId) return
    if (!approvalNote.trim()) {
      toast.error("A note is required for rejection.")
      return
    }
    setActionLoading(true)
    try {
      const res = await fetch(`/api/kyc/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED", note: approvalNote || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to reject")
      toast.error("KYC Rejected", { description: data?.reviewedByEmail ? `By ${data.reviewedByEmail}` : "" })
      setApprovalNote("")
      setSelectedId(null)
      setIsModalOpen(false)
      await loadRequests() // Refresh list
    } catch (e: any) {
      toast.error("Error", { description: e.message })
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status: AdminKycItem["status"]) => {
    switch (status) {
      case "APPROVED":
        return (
          <Badge className="bg-green-600 hover:bg-green-700 text-white">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Approved
          </Badge>
        )
      case "PENDING":
        return (
          <Badge variant="default">
            <Clock className="h-3 w-3 mr-1" /> Pending
          </Badge>
        )
      case "REJECTED":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" /> Rejected
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  const selfieUrl = (req?: AdminKycItem) => req?.documents.find((d) => d.type === "SELFIE")?.fileUrl

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">KYC Requests</h1>
          <p className="text-muted-foreground">Review and manage user identity verification</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Badge variant="secondary">Total: {statusCounts.total}</Badge>
        <Badge>Pending: {statusCounts.pending}</Badge>
        <Badge className="bg-green-600 text-white hover:bg-green-700">Approved: {statusCounts.approved}</Badge>
        <Badge variant="destructive">Rejected: {statusCounts.rejected}</Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle>KYC Verification Requests</CardTitle>
              <CardDescription>View and process identity verification submissions</CardDescription>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search email, user ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} placeholder="From Date" className="w-auto" />
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} placeholder="To Date" className="w-auto" />
            <Button onClick={loadRequests} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Apply Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Selfie</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No KYC requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="text-sm">
                        <div className="font-medium">{request.userEmail || "Unknown"}</div>
                        <div className="font-mono text-muted-foreground text-xs">{request.userId}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{request.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <img
                          src={selfieUrl(request) || "/placeholder.svg"}
                          alt="Selfie"
                          className="h-10 w-10 rounded-full object-cover border"
                        />
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="text-sm">{new Date(request.submittedAt).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(request.id)}>
                          <Eye className="h-4 w-4 mr-2" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>KYC Verification Details</DialogTitle>
            <DialogDescription>Review and process this verification request</DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6 py-4">
              <div className="flex justify-center">
                <img
                  src={selfieUrl(selectedRequest) || "/placeholder.svg"}
                  alt="User selfie"
                  className="w-48 h-48 rounded-lg object-cover border"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">User</Label>
                  <p className="font-medium mt-1">{selectedRequest.userEmail || "Unknown"}</p>
                  <p className="font-mono text-xs text-muted-foreground">{selectedRequest.userId}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <p className="font-medium mt-1">{selectedRequest.type}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Submitted At</Label>
                  <p className="text-sm mt-1">{new Date(selectedRequest.submittedAt).toLocaleString()}</p>
                </div>
                {selectedRequest.reviewedAt && (
                  <div>
                    <Label className="text-muted-foreground">Reviewed At</Label>
                    <p className="text-sm mt-1">{new Date(selectedRequest.reviewedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Documents</Label>
                <div className="grid grid-cols-2 gap-3">
                  {selectedRequest.documents.filter((d) => d.type !== "SELFIE").length > 0 ? (
                    selectedRequest.documents
                      .filter((d) => d.type !== "SELFIE")
                      .map((doc) => (
                        <a
                          key={doc.id}
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="border rounded-md p-2 hover:bg-muted"
                        >
                          <div className="text-xs text-muted-foreground">{doc.type}</div>
                          <div className="font-mono text-[11px] truncate">{doc.fileUrl}</div>
                        </a>
                      ))
                  ) : (
                    <div className="text-sm text-muted-foreground col-span-2">No supporting documents</div>
                  )}
                </div>
              </div>

              {selectedRequest.status === "PENDING" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="approval-note">Note (optional for approval, required for rejection)</Label>
                    <Textarea
                      id="approval-note"
                      value={approvalNote}
                      onChange={(e) => setApprovalNote(e.target.value)}
                      placeholder="Add a note for this decision..."
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleReject} variant="destructive" className="flex-1" disabled={actionLoading}>
                      {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />} Reject
                    </Button>
                    <Button onClick={handleApprove} className="flex-1" disabled={actionLoading}>
                      {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} Approve
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
