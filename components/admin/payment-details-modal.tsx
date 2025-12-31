"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, Clock, RefreshCw, RotateCw } from "lucide-react"
import { authFetch } from "@/lib/client-auth"
import { useToast } from "@/hooks/use-toast"

type Payment = {
  id: string
  user: string
  email: string
  amount: number
  method: string
  status: "completed" | "pending" | "failed"
  reference: string
  date: string
  service: string
}

type PaymentDetailsModalProps = {
  payment: Payment
  isOpen: boolean
  onClose: () => void
}

export function PaymentDetailsModal({ payment, isOpen, onClose }: PaymentDetailsModalProps) {
  const [adminNotes, setAdminNotes] = useState("")
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleMarkAsPaid = () => {
    console.log("[v0] Marking payment as paid:", payment.id)
    alert(`Payment ${payment.reference} marked as paid`)
    onClose()
  }

  const handleRefund = async () => {
    try {
      if (isProcessing) return
      setIsProcessing(true)

      // Refunds target FAILED service purchase transactions.
      // Wallet funding payments may not be refundable via this endpoint.
      const res = await authFetch(`/api/admin/service/refund/${encodeURIComponent(payment.reference)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: adminNotes || "Admin-initiated refund" }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        const msg = data?.error || "Refund failed"
        toast({ title: "Refund Error", description: msg, variant: "destructive" })
        return
      }

      toast({
        title: "Refund Processed",
        description: `Reference ${payment.reference} refunded successfully`,
      })
      onClose()
    } catch (err) {
      toast({ title: "Refund Error", description: String(err), variant: "destructive" })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRetry = async () => {
    try {
      if (isProcessing) return
      setIsProcessing(true)

      const res = await authFetch(`/api/admin/service/retry/${encodeURIComponent(payment.reference)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: adminNotes || "Admin-initiated retry" }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        const msg = data?.error || "Retry failed"
        toast({ title: "Retry Error", description: msg, variant: "destructive" })
        return
      }

      toast({ title: "Retry Requested", description: `Reference ${payment.reference} retry successful` })
      onClose()
    } catch (err) {
      toast({ title: "Retry Error", description: String(err), variant: "destructive" })
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusBadge = (status: Payment["status"]) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        )
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            <XCircle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Payment Details</DialogTitle>
          <DialogDescription>View and manage payment transaction</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-muted-foreground">Reference</Label>
              <p className="font-mono text-sm font-semibold">{payment.reference}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <div className="mt-1">{getStatusBadge(payment.status)}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">User</Label>
              <p className="font-medium">{payment.user}</p>
              <p className="text-sm text-muted-foreground">{payment.email}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Date</Label>
              <p className="text-sm">{payment.date}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Service</Label>
              <p className="text-sm">{payment.service}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Payment Method</Label>
              <p className="text-sm">{payment.method}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Amount</Label>
              <p className="text-lg font-bold text-primary">₦{payment.amount.toLocaleString()}</p>
            </div>
          </div>

          {/* Admin Notes */}
          <div className="space-y-2">
            <Label htmlFor="admin-notes">Admin Notes</Label>
            <Textarea
              id="admin-notes"
              placeholder="Add notes about this payment..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {payment.status === "pending" && (
              <Button onClick={handleMarkAsPaid} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Mark as Paid
              </Button>
            )}
            {payment.status === "failed" && (
              <>
                <Button onClick={handleRetry} className="flex items-center gap-2" disabled={isProcessing}>
                  <RotateCw className="h-4 w-4" />
                  {isProcessing ? "Processing..." : "Retry Service"}
                </Button>
                <Button onClick={handleRefund} variant="destructive" className="flex items-center gap-2" disabled={isProcessing}>
                  <RefreshCw className="h-4 w-4" />
                  {isProcessing ? "Processing..." : "Process Refund"}
                </Button>
              </>
            )}
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
