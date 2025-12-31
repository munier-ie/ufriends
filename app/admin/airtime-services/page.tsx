"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Share2, ArrowRightLeft, TrendingUp, CheckCircle2, XCircle, Clock, Search } from "lucide-react"

interface ShareNSellLog {
  id: string
  userId: string
  network: string
  recipientNumber: string
  amount: number
  price: number
  status: string
  method: string
  date: string
}

interface Airtime2CashRequest {
  id: string
  userId: string
  network: string
  senderNumber: string
  companyNumber: string
  amount: number
  payoutValue: number
  payoutMethod: string
  bankInfo: { bank: string; acctName: string; acctNo: string } | null
  status: string
  createdAt: string
  adminNote?: string
}

export default function AirtimeServicesAdminPage() {
  const { toast } = useToast()
  const [shareNSellLogs, setShareNSellLogs] = useState<ShareNSellLog[]>([])
  const [airtime2CashRequests, setAirtime2CashRequests] = useState<Airtime2CashRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<Airtime2CashRequest | null>(null)
  const [showActionDialog, setShowActionDialog] = useState(false)
  const [actionType, setActionType] = useState<"approve" | "reject">("approve")
  const [adminNote, setAdminNote] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const logs = JSON.parse(localStorage.getItem("ufriends_share_n_sell_logs") || "[]")
    const requests = JSON.parse(localStorage.getItem("ufriends_airtime2cash_requests") || "[]")
    setShareNSellLogs(logs)
    setAirtime2CashRequests(requests)
  }

  const handleAction = (request: Airtime2CashRequest, type: "approve" | "reject") => {
    setSelectedRequest(request)
    setActionType(type)
    setAdminNote("")
    setShowActionDialog(true)
  }

  const confirmAction = () => {
    if (!selectedRequest) return

    const updatedRequests = airtime2CashRequests.map((req) => {
      if (req.id === selectedRequest.id) {
        if (actionType === "approve") {
          // Update wallet if payout method is Wallet
          if (req.payoutMethod === "Wallet") {
            const currentBalance = Number.parseFloat(localStorage.getItem("ufriends_wallet_balance") || "0")
            const newBalance = currentBalance + req.payoutValue
            localStorage.setItem("ufriends_wallet_balance", newBalance.toString())
          }
          return { ...req, status: "Completed", adminNote }
        } else {
          return { ...req, status: "Rejected", adminNote }
        }
      }
      return req
    })

    localStorage.setItem("ufriends_airtime2cash_requests", JSON.stringify(updatedRequests))
    setAirtime2CashRequests(updatedRequests)
    setShowActionDialog(false)

    toast({
      title: actionType === "approve" ? "Request Approved" : "Request Rejected",
      description: `Airtime 2 Cash request ${actionType === "approve" ? "approved" : "rejected"} successfully`,
    })
  }

  const filteredA2CRequests = airtime2CashRequests.filter((req) => {
    const matchesSearch =
      req.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.senderNumber.includes(searchTerm) ||
      req.network.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || req.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalShareNSellRevenue = shareNSellLogs.reduce((sum, log) => sum + log.price, 0)
  const totalShareNSellProfit = shareNSellLogs.reduce((sum, log) => sum + (log.amount - log.price), 0)
  const totalA2CPending = airtime2CashRequests.filter((r) => r.status === "Pending").length
  const totalA2CCompleted = airtime2CashRequests.filter((r) => r.status === "Completed").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Airtime Services Management</h1>
        <p className="text-muted-foreground mt-2">Manage Share 'n Sell and Airtime 2 Cash services</p>
      </div>

      {/* Analytics Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-[#3457D5]/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Share2 className="h-4 w-4 text-[#3457D5]" />
              Share 'n Sell Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#3457D5]">₦{totalShareNSellRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{shareNSellLogs.length} transactions</p>
          </CardContent>
        </Card>

        <Card className="border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Profit Margin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₦{totalShareNSellProfit.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">From Share 'n Sell</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              Pending A2C
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{totalA2CPending}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting confirmation</p>
          </CardContent>
        </Card>

        <Card className="border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Completed A2C
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalA2CCompleted}</div>
            <p className="text-xs text-muted-foreground mt-1">Successfully processed</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="airtime2cash" className="space-y-4">
        <TabsList className="bg-[#F9F7F3]">
          <TabsTrigger value="airtime2cash" className="data-[state=active]:bg-[#3457D5] data-[state=active]:text-white">
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Airtime 2 Cash
          </TabsTrigger>
          <TabsTrigger value="sharensell" className="data-[state=active]:bg-[#3457D5] data-[state=active]:text-white">
            <Share2 className="h-4 w-4 mr-2" />
            Share 'n Sell Logs
          </TabsTrigger>
        </TabsList>

        {/* Airtime 2 Cash Tab */}
        <TabsContent value="airtime2cash" className="space-y-4">
          <Card className="border-[#3457D5]/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Airtime 2 Cash Requests</CardTitle>
                  <CardDescription>Review and approve user airtime conversion requests</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Network</TableHead>
                    <TableHead>Sender</TableHead>
                    <TableHead>UFriends Number</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payout</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredA2CRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                        No requests found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredA2CRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-mono text-xs">{request.id}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{request.network}</Badge>
                        </TableCell>
                        <TableCell>{request.senderNumber}</TableCell>
                        <TableCell>{request.companyNumber}</TableCell>
                        <TableCell>₦{request.amount.toLocaleString()}</TableCell>
                        <TableCell className="font-semibold text-green-600">
                          ₦{request.payoutValue.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={request.payoutMethod === "Wallet" ? "default" : "secondary"}>
                            {request.payoutMethod}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {request.status === "Pending" && (
                            <Badge className="bg-yellow-500 text-white">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                          {request.status === "Completed" && (
                            <Badge className="bg-green-500 text-white">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                          {request.status === "Rejected" && (
                            <Badge className="bg-red-500 text-white">
                              <XCircle className="h-3 w-3 mr-1" />
                              Rejected
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {request.status === "Pending" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleAction(request, "approve")}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Approve
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleAction(request, "reject")}>
                                Reject
                              </Button>
                            </div>
                          )}
                          {request.status !== "Pending" && (
                            <span className="text-xs text-muted-foreground">
                              {request.adminNote || "No action needed"}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Share 'n Sell Tab */}
        <TabsContent value="sharensell" className="space-y-4">
          <Card className="border-[#3457D5]/20">
            <CardHeader>
              <CardTitle>Share 'n Sell Transaction Logs</CardTitle>
              <CardDescription>Automated airtime purchase records (read-only)</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Network</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Airtime Value</TableHead>
                    <TableHead>Amount Paid</TableHead>
                    <TableHead>Profit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shareNSellLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No transactions yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    shareNSellLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-xs">{log.id}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.network}</Badge>
                        </TableCell>
                        <TableCell>{log.recipientNumber}</TableCell>
                        <TableCell>₦{log.amount.toLocaleString()}</TableCell>
                        <TableCell>₦{log.price.toLocaleString()}</TableCell>
                        <TableCell className="font-semibold text-green-600">
                          ₦{(log.amount - log.price).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-500 text-white">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{new Date(log.date).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent className="border-[#3457D5]/30">
          <DialogHeader>
            <DialogTitle>{actionType === "approve" ? "Approve" : "Reject"} Airtime 2 Cash Request</DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "Confirm that you've verified the airtime transfer"
                : "Provide a reason for rejection"}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-[#F9F7F3] rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Request ID:</span>
                  <span className="font-mono font-semibold">{selectedRequest.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network:</span>
                  <span className="font-semibold">{selectedRequest.network}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-semibold">₦{selectedRequest.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payout:</span>
                  <span className="font-semibold text-green-600">₦{selectedRequest.payoutValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Method:</span>
                  <span className="font-semibold">{selectedRequest.payoutMethod}</span>
                </div>
                {selectedRequest.bankInfo && (
                  <div className="pt-2 border-t space-y-1">
                    <p className="font-semibold">Bank Details:</p>
                    <p>{selectedRequest.bankInfo.bank}</p>
                    <p>
                      {selectedRequest.bankInfo.acctNo} - {selectedRequest.bankInfo.acctName}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-note">Admin Note {actionType === "reject" && "(Required)"}</Label>
                <Textarea
                  id="admin-note"
                  placeholder={
                    actionType === "approve"
                      ? "Optional note (e.g., 'Transfer verified')"
                      : "Reason for rejection (e.g., 'Transfer not found')"
                  }
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              disabled={actionType === "reject" && !adminNote}
              className={actionType === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {actionType === "approve" ? "Approve Request" : "Reject Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
