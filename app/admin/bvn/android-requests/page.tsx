"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Smartphone, Eye, Check, X, ExternalLink, Trash2 } from "lucide-react"
import { BVNStorage, type BVNRequest } from "@/lib/bvn-storage"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { authFetch } from "@/lib/client-auth"

const MOCK_ADMIN = "Admin Uthman"

export default function AdminBVNRequestsPage() {
  const [requests, setRequests] = useState<BVNRequest[]>([])
  const [androidAppLink, setAndroidAppLink] = useState("")
  const [appDescription, setAppDescription] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"All" | "Pending" | "Approved" | "Rejected">("All")
  const [selectedRequest, setSelectedRequest] = useState<BVNRequest | null>(null)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setRequests(BVNStorage.getRequests())
    try {
      const res = await fetch("/api/admin/system-settings/bvn-android")
      if (res.ok) {
        const data = await res.json()
        setAndroidAppLink(data.link || "")
        setAppDescription(data.description || "")
      }
    } catch (err) {
      console.error("Failed to load settings:", err)
    }
  }

  const saveSettings = async () => {
    setIsSaving(true)
    try {
      const res = await authFetch("/api/admin/system-settings/bvn-android", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link: androidAppLink, description: appDescription }),
      })

      if (!res.ok) throw new Error("Failed to save settings")

      // Legacy audit log (optional, but keeping for consistency with local logs)
      BVNStorage.addAuditLog({
        action: "Updated Android App Settings",
        admin: MOCK_ADMIN,
        target: "Android App Link/Desc",
        timestamp: new Date().toISOString(),
      })

      toast({
        title: "Success",
        description: "Android app settings updated successfully!",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleApprove = (request: BVNRequest) => {
    BVNStorage.updateRequest(request.id, {
      status: "Approved",
      reviewedBy: MOCK_ADMIN,
      reviewedAt: new Date().toISOString(),
    })
    BVNStorage.addAuditLog({
      action: "Approved BVN Android Request",
      admin: MOCK_ADMIN,
      target: request.accountName,
      timestamp: new Date().toISOString(),
    })
    toast({
      title: "Request Approved",
      description: `Request for ${request.accountName} has been approved.`,
    })
    loadData()
    setSelectedRequest(null)
  }

  const handleReject = () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a rejection reason.",
        variant: "destructive",
      })
      return
    }

    BVNStorage.updateRequest(selectedRequest.id, {
      status: "Rejected",
      rejectionReason,
      reviewedBy: MOCK_ADMIN,
      reviewedAt: new Date().toISOString(),
    })
    BVNStorage.addAuditLog({
      action: "Rejected BVN Android Request",
      admin: MOCK_ADMIN,
      target: selectedRequest.accountName,
      timestamp: new Date().toISOString(),
    })
    toast({
      title: "Request Rejected",
      description: `Request for ${selectedRequest.accountName} has been rejected.`,
    })
    loadData()
    setSelectedRequest(null)
    setShowRejectDialog(false)
    setRejectionReason("")
  }

  const handleDelete = (request: BVNRequest) => {
    const allRequests = BVNStorage.getRequests()
    const filtered = allRequests.filter((r) => r.id !== request.id)
    BVNStorage.saveRequests(filtered)
    BVNStorage.addAuditLog({
      action: "Deleted BVN Android Request",
      admin: MOCK_ADMIN,
      target: request.accountName,
      timestamp: new Date().toISOString(),
    })
    toast({
      title: "Request Deleted",
      description: `Request for ${request.accountName} has been deleted.`,
    })
    loadData()
    setSelectedRequest(null)
  }

  const getStatusBadge = (status: BVNRequest["status"]) => {
    const variants = {
      Pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      Approved: "bg-green-100 text-green-800 border-green-300",
      Rejected: "bg-red-100 text-red-800 border-red-300",
    }
    return <Badge className={variants[status]}>{status}</Badge>
  }

  const filteredRequests = requests
    .filter((r) => {
      if (filterStatus !== "All" && r.status !== filterStatus) return false
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        return (
          r.bvn.includes(search) ||
          r.accountName.toLowerCase().includes(search) ||
          r.agentLocation.toLowerCase().includes(search)
        )
      }
      return true
    })
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "Pending").length,
    approved: requests.filter((r) => r.status === "Approved").length,
    rejected: requests.filter((r) => r.status === "Rejected").length,
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <Toaster />
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl font-bold text-foreground mb-2">BVN Android Requests Management</h1>
          <p className="text-muted-foreground mb-6">Review and manage BVN enrollment requests</p>
        </motion.div>

        {/* Android App Link Manager */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="border-blue-300 bg-blue-50 mb-6">
            <CardHeader>
              <CardTitle className="text-lg text-blue-700 flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Android App Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="appLink">App Download URL</Label>
                <Input
                  id="appLink"
                  type="url"
                  placeholder="Enter or paste Android app link"
                  value={androidAppLink}
                  onChange={(e) => setAndroidAppLink(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appDesc">Description</Label>
                <Textarea
                  id="appDesc"
                  placeholder="Enter instructions, version info, or other details for the user..."
                  value={appDescription}
                  onChange={(e) => setAppDescription(e.target.value)}
                  rows={3}
                  className="bg-white"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={saveSettings} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {isSaving ? "Saving..." : "Save Settings"}
                </Button>
                {androidAppLink && (
                  <Button variant="outline" asChild>
                    <a href={androidAppLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Test Link
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                <div className="text-sm text-muted-foreground">Approved</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                <div className="text-sm text-muted-foreground">Rejected</div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex gap-2 flex-wrap">
                  {(["All", "Pending", "Approved", "Rejected"] as const).map((status) => (
                    <Button
                      key={status}
                      variant={filterStatus === status ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterStatus(status)}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
                <Input
                  placeholder="Search by BVN, name, or agent..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full md:w-64"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Requests Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Smartphone className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No requests found</h3>
                <p className="text-muted-foreground">
                  {requests.length === 0
                    ? "No BVN requests have been submitted yet."
                    : "No requests match your current filters."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request, index) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm text-muted-foreground">#{request.id.slice(0, 8)}</span>
                            {getStatusBadge(request.status)}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Agent:</span>{" "}
                              <span className="font-medium">{request.agentLocation}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">BVN:</span>{" "}
                              <span className="font-medium">{request.bvn}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Account:</span>{" "}
                              <span className="font-medium">{request.kegowAccountNo}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Name:</span>{" "}
                              <span className="font-medium">{request.accountName}</span>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Submitted: {new Date(request.submittedAt).toLocaleDateString()} at{" "}
                            {new Date(request.submittedAt).toLocaleTimeString()}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setSelectedRequest(request)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                          {request.status === "Pending" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 hover:text-green-700 bg-transparent"
                                onClick={() => handleApprove(request)}
                              >
                                <Check className="w-4 h-4 mr-2" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 bg-transparent"
                                onClick={() => {
                                  setSelectedRequest(request)
                                  setShowRejectDialog(true)
                                }}
                              >
                                <X className="w-4 h-4 mr-2" />
                                Reject
                              </Button>
                            </>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 bg-transparent"
                            onClick={() => handleDelete(request)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Request Details Dialog */}
      <Dialog open={!!selectedRequest && !showRejectDialog} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription>Full information for this BVN enrollment request</DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                {getStatusBadge(selectedRequest.status)}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Reference ID:</span>
                  <div className="font-medium">{selectedRequest.id}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Agent Location:</span>
                  <div className="font-medium">{selectedRequest.agentLocation}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">BVN:</span>
                  <div className="font-medium">{selectedRequest.bvn}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Kegow Account:</span>
                  <div className="font-medium">{selectedRequest.kegowAccountNo}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Account Name:</span>
                  <div className="font-medium">{selectedRequest.accountName}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">First Name:</span>
                  <div className="font-medium">{selectedRequest.firstName}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Name:</span>
                  <div className="font-medium">{selectedRequest.lastName}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <div className="font-medium">{selectedRequest.email}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <div className="font-medium">{selectedRequest.phone}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">State:</span>
                  <div className="font-medium">{selectedRequest.stateOfResidence}</div>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Address:</span>
                  <div className="font-medium">{selectedRequest.address}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Date of Birth:</span>
                  <div className="font-medium">{new Date(selectedRequest.dob).toLocaleDateString()}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">LGA:</span>
                  <div className="font-medium">{selectedRequest.lga}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">City:</span>
                  <div className="font-medium">{selectedRequest.city}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Address State:</span>
                  <div className="font-medium">{selectedRequest.addressState}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Submitted:</span>
                  <div className="font-medium">{new Date(selectedRequest.submittedAt).toLocaleString()}</div>
                </div>
                {selectedRequest.reviewedAt && (
                  <>
                    <div>
                      <span className="text-muted-foreground">Reviewed:</span>
                      <div className="font-medium">{new Date(selectedRequest.reviewedAt).toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Reviewed By:</span>
                      <div className="font-medium">{selectedRequest.reviewedBy}</div>
                    </div>
                  </>
                )}
                {selectedRequest.rejectionReason && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Rejection Reason:</span>
                    <div className="font-medium text-red-600">{selectedRequest.rejectionReason}</div>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedRequest?.status === "Pending" && (
              <>
                <Button variant="outline" onClick={() => handleApprove(selectedRequest)}>
                  <Check className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 bg-transparent"
                  onClick={() => {
                    setShowRejectDialog(true)
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>Please provide a reason for rejecting this request.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectionReason">Rejection Reason</Label>
              <Textarea
                id="rejectionReason"
                placeholder="Enter the reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false)
                setRejectionReason("")
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
