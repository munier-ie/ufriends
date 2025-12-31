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
import { useToast } from "@/hooks/use-toast"

import { Eye, CheckCircle, XCircle, DollarSign, TrendingUp, Users } from "lucide-react"

export default function AdminMarketersPage() {
  const { toast } = useToast()
  const [marketers, setMarketers] = useState<any[]>([])
  const [selectedMarketer, setSelectedMarketer] = useState<any>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false)
  const [balanceAction, setBalanceAction] = useState<"credit" | "debit">("credit")
  const [balanceAmount, setBalanceAmount] = useState("")

  useEffect(() => {
    loadMarketers()
  }, [])

  const loadMarketers = async () => {
    try {
      const res = await fetch("/api/admin/marketers")
      if (res.ok) {
        const data = await res.json()
        setMarketers(data)
      }
    } catch (e) {
      console.error("Failed to load marketers", e)
    }
  }

  const handleAction = async (action: string, id: string, amount?: number) => {
    try {
      const res = await fetch("/api/admin/marketers/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, marketerId: id, amount })
      })
      if (res.ok) {
        loadMarketers()
        toast({
          title: "Success",
          description: `Marketer ${action} successful`,
        })
        return true
      } else {
        throw new Error("Action failed")
      }
    } catch (e) {
      toast({
        title: "Error",
        description: "Operation failed",
        variant: "destructive"
      })
      return false
    }
  }

  const handleViewDetails = (marketer: any) => {
    setSelectedMarketer(marketer)
    setViewDialogOpen(true)
  }

  const handleApprove = (marketer: any) => handleAction("approve", marketer.id)
  const handleReject = (marketer: any) => handleAction("reject", marketer.id)
  const handleSuspend = (marketer: any) => handleAction("suspend", marketer.id)

  const handleBalanceAction = (marketer: any, action: "credit" | "debit") => {
    setSelectedMarketer(marketer)
    setBalanceAction(action)
    setBalanceDialogOpen(true)
  }

  const handleSubmitBalance = async () => {
    if (!selectedMarketer || !balanceAmount) return

    const amount = Number.parseFloat(balanceAmount)
    const success = await handleAction(balanceAction, selectedMarketer.id, amount)

    if (success) {
      setBalanceDialogOpen(false)
      setBalanceAmount("")
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      approved: "default",
      pending: "secondary",
      rejected: "destructive",
    }
    return <Badge variant={variants[status] || "default"}>{status}</Badge>
  }

  const totalMarketers = marketers.length
  const approvedMarketers = marketers.filter((m) => m.status === "approved").length
  const pendingRequests = marketers.filter((m) => m.status === "pending").length

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Marketer Management</h1>
        <p className="text-gray-600 mt-1">Manage UFriends marketer requests and track their performance</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMarketers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedMarketers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingRequests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#3457D5]">
              ₦{marketers.reduce((sum, m) => sum + (m.withdrawableBalance || 0), 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Marketers List */}
      <Card>
        <CardHeader>
          <CardTitle>All Marketer Requests</CardTitle>
          <CardDescription>View and manage all marketer registration requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {marketers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No marketer requests found</div>
            ) : (
              marketers.map((marketer) => (
                <div key={marketer.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{marketer.fullName}</h3>
                      <p className="text-sm text-gray-600">{marketer.email}</p>
                      <p className="text-sm text-gray-600">{marketer.phone}</p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(marketer.status)}
                      {marketer.marketerId && <Badge className="ml-2 bg-[#3457D5]">{marketer.marketerId}</Badge>}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">State</span>
                      <p className="font-medium">{marketer.state}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Marketing Type</span>
                      <p className="font-medium">{marketer.marketingType.join(", ")}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Balance</span>
                      <p className="font-medium">₦{(marketer.withdrawableBalance || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Requested</span>
                      <p className="font-medium">{new Date(marketer.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => handleViewDetails(marketer)}>
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>

                    {marketer.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleApprove(marketer)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleReject(marketer)}>
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}

                    {marketer.status === "approved" && marketer.marketerStatus !== "suspended" && (
                      <Button size="sm" variant="destructive" onClick={() => handleSuspend(marketer)}>
                        <XCircle className="w-4 h-4 mr-1" />
                        Suspend
                      </Button>
                    )}

                    <Button
                      size="sm"
                      className="bg-[#3457D5] hover:bg-[#2a46b0]"
                      onClick={() => handleBalanceAction(marketer, "credit")}
                    >
                      <DollarSign className="w-4 h-4 mr-1" />
                      Credit
                    </Button>

                    <Button size="sm" variant="outline" onClick={() => handleBalanceAction(marketer, "debit")}>
                      <DollarSign className="w-4 h-4 mr-1" />
                      Debit
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
            <DialogTitle>Marketer Request Details</DialogTitle>
            <DialogDescription>Complete information about the marketer request</DialogDescription>
          </DialogHeader>

          {selectedMarketer && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Full Name</Label>
                  <p className="font-medium">{selectedMarketer.fullName}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Status</Label>
                  <p className="font-medium capitalize">{selectedMarketer.status}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Phone</Label>
                  <p className="font-medium">{selectedMarketer.phone}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Email</Label>
                  <p className="font-medium">{selectedMarketer.email}</p>
                </div>
                <div>
                  <Label className="text-gray-600">State</Label>
                  <p className="font-medium">{selectedMarketer.state}</p>
                </div>
                <div>
                  <Label className="text-gray-600">LGA</Label>
                  <p className="font-medium">{selectedMarketer.lga}</p>
                </div>
              </div>

              <div>
                <Label className="text-gray-600">Marketing Types</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedMarketer.marketingType.map((type: string) => (
                    <Badge key={type} variant="outline">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-gray-600">Documents</Label>
                <div className="grid md:grid-cols-2 gap-2 mt-2">
                  <a
                    href={selectedMarketer.passportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View Passport Photo
                  </a>
                  <a
                    href={selectedMarketer.validIdUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View Valid ID
                  </a>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Label className="text-gray-600">Account Details</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex justify-between">
                    <span>Withdrawable Balance:</span>
                    <span className="font-semibold">
                      ₦{(selectedMarketer.withdrawableBalance || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Commission Earned:</span>
                    <span className="font-semibold">₦{(selectedMarketer.commission || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Sales:</span>
                    <span className="font-semibold">₦{(selectedMarketer.totalSales || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Balance Action Dialog */}
      <Dialog open={balanceDialogOpen} onOpenChange={setBalanceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{balanceAction === "credit" ? "Credit" : "Debit"} Balance</DialogTitle>
            <DialogDescription>
              {balanceAction === "credit" ? "Add funds to" : "Deduct funds from"} marketer's balance
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedMarketer && (
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Current Balance</p>
                <p className="text-xl font-bold">₦{(selectedMarketer.withdrawableBalance || 0).toLocaleString()}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₦)</Label>
              <Input
                id="amount"
                type="number"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBalanceDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className={balanceAction === "credit" ? "bg-[#3457D5] hover:bg-[#2a46b0]" : ""}
              variant={balanceAction === "debit" ? "destructive" : "default"}
              onClick={handleSubmitBalance}
            >
              {balanceAction === "credit" ? "Credit" : "Debit"} Balance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
