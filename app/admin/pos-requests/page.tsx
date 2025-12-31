"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { authFetch } from "@/lib/client-auth"
type POSRequest = {
  id: string
  provider: string
  status: "Pending" | "Approved" | "Rejected" | "Completed"
  createdAt: string
  userEmail?: string
  userName?: string
  userPhone?: string
  assignedAgentId?: string | null
  assignedAgentLocation?: string | null
  formData: any
  documents: any
  adminNotes?: string | null
  evidenceUrl?: string | null
}
import { Eye, CheckCircle, XCircle, Upload, Trash2, Filter } from "lucide-react"

export default function AdminPOSRequestsPage() {
  const { toast } = useToast()
  const [requests, setRequests] = useState<POSRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<POSRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<POSRequest | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const [deletePassword, setDeletePassword] = useState("")
  const [filterProvider, setFilterProvider] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  useEffect(() => {
    loadRequests()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [requests, filterProvider, filterStatus])

  const loadRequests = async () => {
    try {
      const res = await authFetch(`/api/admin/pos/requests`)
      const data = await res.json().catch(() => ({}))
      if (res.ok && Array.isArray(data?.requests)) {
        setRequests(data.requests)
      }
    } catch {}
  }

  const applyFilters = () => {
    let filtered = [...requests]

    if (filterProvider !== "all") {
      filtered = filtered.filter((r) => r.provider === filterProvider)
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((r) => r.status === filterStatus)
    }

    setFilteredRequests(filtered)
  }

  const handleViewDetails = (request: POSRequest) => {
    setSelectedRequest(request)
    setViewDialogOpen(true)
  }

  const handleApprove = async (request: POSRequest) => {
    await authFetch(`/api/admin/pos/requests/${request.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PROCESSING" }),
    })
    await loadRequests()
    toast({ title: "Request Approved", description: "The POS request has been approved successfully." })
  }

  const handleReject = async (request: POSRequest) => {
    await authFetch(`/api/admin/pos/requests/${request.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "FAILED" }),
    })
    await loadRequests()
    toast({ title: "Request Rejected", description: "The POS request has been rejected.", variant: "destructive" })
  }

  const handleUploadEvidence = (request: POSRequest) => {
    setSelectedRequest(request)
    setAdminNotes(request.adminNotes || "")
    setEvidenceDialogOpen(true)
  }

  const handleSubmitEvidence = async () => {
    if (!selectedRequest || !evidenceFile) {
      toast({
        title: "Error",
        description: "Please upload evidence file",
        variant: "destructive",
      })
      return
    }

    await authFetch(`/api/admin/pos/requests/${selectedRequest.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED", adminNotes }),
    })
    await loadRequests()
    setEvidenceDialogOpen(false)
    setEvidenceFile(null)
    setAdminNotes("")

    toast({
      title: "Evidence Uploaded",
      description: "The request has been marked as completed.",
    })
  }

  const handleDeleteRequest = (request: POSRequest) => {
    setSelectedRequest(request)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (deletePassword !== "admin123") {
      toast({
        title: "Error",
        description: "Incorrect password",
        variant: "destructive",
      })
      return
    }

    if (selectedRequest) {
      await authFetch(`/api/admin/pos/requests/${selectedRequest.id}`, { method: "DELETE" })
      await loadRequests()
      setDeleteDialogOpen(false)
      setDeletePassword("")
      toast({
        title: "Request Deleted",
        description: "The POS request has been deleted successfully.",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      Pending: "secondary",
      Approved: "default",
      Rejected: "destructive",
      Completed: "outline",
    }
    return <Badge variant={variants[status] || "default"}>{status}</Badge>
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">POS Requests Management</h1>
        <p className="text-gray-600 mt-1">Manage and process POS terminal requests from users</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select value={filterProvider} onValueChange={setFilterProvider}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  <SelectItem value="Opay">Opay</SelectItem>
                  <SelectItem value="Moniepoint">Moniepoint</SelectItem>
                  <SelectItem value="FCMB">FCMB</SelectItem>
                  <SelectItem value="Nomba">Nomba</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requests.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {requests.filter((r) => r.status === "Pending").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {requests.filter((r) => r.status === "Approved").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {requests.filter((r) => r.status === "Completed").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>All POS Requests</CardTitle>
          <CardDescription>View and manage all POS terminal requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No requests found</div>
            ) : (
              filteredRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{request.formData.fullName}</h3>
                      <p className="text-sm text-gray-600">{request.formData.email}</p>
                      <p className="text-sm text-gray-600">{request.formData.phone}</p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-[#3457D5]">{request.provider}</Badge>
                      <div className="mt-2">{getStatusBadge(request.status)}</div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Business:</span>{" "}
                      <span className="font-medium">{request.formData.businessName}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">POS Type:</span>{" "}
                      <span className="font-medium">{request.formData.posType}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Location:</span>{" "}
                      <span className="font-medium">
                        {request.formData.lga}, {request.formData.state}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Date:</span>{" "}
                      <span className="font-medium">{new Date(request.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => handleViewDetails(request)}>
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>

                    {request.status === "Pending" && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleApprove(request)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleReject(request)}>
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}

                    {request.status === "Approved" && (
                      <Button
                        size="sm"
                        className="bg-[#3457D5] hover:bg-[#2a46b0]"
                        onClick={() => handleUploadEvidence(request)}
                      >
                        <Upload className="w-4 h-4 mr-1" />
                        Upload Evidence
                      </Button>
                    )}

                    <Button size="sm" variant="destructive" onClick={() => handleDeleteRequest(request)}>
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>POS Request Details</DialogTitle>
            <DialogDescription>Complete information about the POS request</DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Full Name</Label>
                  <p className="font-medium">{selectedRequest.formData.fullName}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Phone</Label>
                  <p className="font-medium">{selectedRequest.formData.phone}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Email</Label>
                  <p className="font-medium">{selectedRequest.formData.email}</p>
                </div>
                <div>
                  <Label className="text-gray-600">BVN</Label>
                  <p className="font-medium">{selectedRequest.formData.bvn || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Business Name</Label>
                  <p className="font-medium">{selectedRequest.formData.businessName}</p>
                </div>
                <div>
                  <Label className="text-gray-600">POS Type</Label>
                  <p className="font-medium">{selectedRequest.formData.posType}</p>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-gray-600">Business Address</Label>
                  <p className="font-medium">{selectedRequest.formData.businessAddress}</p>
                </div>
              </div>

              <div>
                <Label className="text-gray-600">Uploaded Documents</Label>
                <div className="grid md:grid-cols-2 gap-2 mt-2">
                  {selectedRequest.documents.validId && (
                    <a
                      href={selectedRequest.documents.validId}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View Valid ID
                    </a>
                  )}
                  {selectedRequest.documents.utilityBill && (
                    <a
                      href={selectedRequest.documents.utilityBill}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View Utility Bill
                    </a>
                  )}
                  {selectedRequest.documents.cacCertificate && (
                    <a
                      href={selectedRequest.documents.cacCertificate}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View CAC Certificate
                    </a>
                  )}
                  {selectedRequest.documents.passportPhoto && (
                    <a
                      href={selectedRequest.documents.passportPhoto}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View Passport Photo
                    </a>
                  )}
                </div>
              </div>

              {selectedRequest.evidenceUrl && (
                <div>
                  <Label className="text-gray-600">Evidence of Completion</Label>
                  <a
                    href={selectedRequest.evidenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm block mt-1"
                  >
                    View Evidence
                  </a>
                </div>
              )}

              {selectedRequest.adminNotes && (
                <div>
                  <Label className="text-gray-600">Admin Notes</Label>
                  <p className="text-sm mt-1">{selectedRequest.adminNotes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Evidence Dialog */}
      <Dialog open={evidenceDialogOpen} onOpenChange={setEvidenceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Evidence of Completion</DialogTitle>
            <DialogDescription>Upload proof that the POS has been delivered or processed</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="evidence">Evidence File (Receipt, Tracking Info, etc.)</Label>
              <Input
                id="evidence"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Admin Notes</Label>
              <Textarea
                id="notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any notes about the completion..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEvidenceDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-[#3457D5] hover:bg-[#2a46b0]" onClick={handleSubmitEvidence}>
              Upload & Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>This action cannot be undone. Enter admin password to confirm.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="password">Admin Password</Label>
            <Input
              id="password"
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
