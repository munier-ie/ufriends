"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Eye, CheckCircle, XCircle, Search } from "lucide-react"
import { BVNModificationStorage, type BVNModificationRequest } from "@/lib/bvn-modification-storage"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function AdminBVNModificationRequestsPage() {
  const [requests, setRequests] = useState<BVNModificationRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<BVNModificationRequest | null>(null)
  const [showActionDialog, setShowActionDialog] = useState(false)
  const [actionType, setActionType] = useState<"approve" | "reject">("approve")
  const [rejectionReason, setRejectionReason] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = () => {
    setRequests(BVNModificationStorage.getAllRequests())
  }

  const handleAction = () => {
    if (!selectedRequest) return

    if (actionType === "reject" && !rejectionReason.trim()) {
      toast({ title: "Error", description: "Please provide a rejection reason", variant: "destructive" })
      return
    }

    BVNModificationStorage.updateRequestStatus(
      selectedRequest.id,
      actionType === "approve" ? "Approved" : "Rejected",
      actionType === "reject" ? rejectionReason : undefined,
    )

    toast({
      title: "Success",
      description: `Request ${actionType === "approve" ? "approved" : "rejected"} successfully`,
    })

    setShowActionDialog(false)
    setSelectedRequest(null)
    setRejectionReason("")
    loadRequests()
  }

  const getStatusBadge = (status: BVNModificationRequest["status"]) => {
    const variants = {
      Pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      Approved: "bg-green-100 text-green-800 border-green-300",
      Rejected: "bg-red-100 text-red-800 border-red-300",
    }
    return <Badge className={variants[status]}>{status}</Badge>
  }

  const filteredRequests = requests.filter((r) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      r.currentBVN.includes(search) ||
      r.currentName.toLowerCase().includes(search) ||
      r.modificationType.toLowerCase().includes(search)
    )
  })

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "Pending").length,
    approved: requests.filter((r) => r.status === "Approved").length,
    rejected: requests.filter((r) => r.status === "Rejected").length,
  }

  return (
    <div className="p-6">
      <Toaster />

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">BVN Modification Requests</h1>
        <p className="text-muted-foreground">Review and manage BVN modification requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
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

      {/* Requests List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Requests</CardTitle>
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by BVN, name, or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No requests found</div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm text-gray-500">#{request.id.slice(0, 8)}</span>
                          {getStatusBadge(request.status)}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Type:</span>{" "}
                            <span className="font-medium">{request.modificationType}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">BVN:</span>{" "}
                            <span className="font-medium">{request.currentBVN}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Name:</span>{" "}
                            <span className="font-medium">{request.currentName}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Verification:</span>{" "}
                            <span className="font-medium">{request.verificationType}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Submitted:</span>{" "}
                            <span className="font-medium">{new Date(request.submittedAt).toLocaleDateString()}</span>
                          </div>
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
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                setSelectedRequest(request)
                                setActionType("approve")
                                setShowActionDialog(true)
                              }}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedRequest(request)
                                setActionType("reject")
                                setShowActionDialog(true)
                              }}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={!!selectedRequest && !showActionDialog} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Request ID</Label>
                  <p className="font-mono">{selectedRequest.id}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>
                <div>
                  <Label className="text-gray-600">Modification Type</Label>
                  <p>{selectedRequest.modificationType}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Current BVN</Label>
                  <p>{selectedRequest.currentBVN}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Current Name</Label>
                  <p>{selectedRequest.currentName}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Verification Type</Label>
                  <p>{selectedRequest.verificationType}</p>
                </div>
                {selectedRequest.nin && (
                  <div>
                    <Label className="text-gray-600">NIN</Label>
                    <p>{selectedRequest.nin}</p>
                  </div>
                )}
                {selectedRequest.idFile && (
                  <div>
                    <Label className="text-gray-600">ID File</Label>
                    <p>{selectedRequest.idFile}</p>
                  </div>
                )}
                {selectedRequest.comment && (
                  <div className="col-span-2">
                    <Label className="text-gray-600">Comment</Label>
                    <p>{selectedRequest.comment}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionType === "approve" ? "Approve" : "Reject"} Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Are you sure you want to {actionType} this request from {selectedRequest?.currentName}?
            </p>
            {actionType === "reject" && (
              <div>
                <Label>Rejection Reason</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter reason for rejection"
                  rows={3}
                />
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowActionDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAction}
                className={actionType === "approve" ? "bg-green-600 hover:bg-green-700" : ""}
                variant={actionType === "reject" ? "destructive" : "default"}
              >
                Confirm {actionType === "approve" ? "Approval" : "Rejection"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
